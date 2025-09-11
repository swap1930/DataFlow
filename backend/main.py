from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import os
from uuid import uuid4
import pandas as pd
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, auth
import base64
import requests
from pydantic import BaseModel
from chat import answer_question

from process import process_excel_file
from config import FRONTEND_ORIGINS
from db import insert_processed_file  # MongoDB integration

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize Firebase Admin SDK (Optional - for development)
firebase_initialized = False
try:
    # Try to get default app
    firebase_admin.get_app()
    firebase_initialized = True
    print("✅ Firebase Admin SDK initialized successfully")
except ValueError:
    try:
        # Initialize if not already initialized
        cred: credentials.Certificate | None = None

        # 1) Prefer JSON string from env
        firebase_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
        # 2) Or Base64-encoded JSON from env
        firebase_b64 = os.getenv("FIREBASE_CREDENTIALS_B64")
        # 3) Or file on disk
        firebase_file = os.getenv("FIREBASE_CREDENTIALS_FILE", "firebase-service-account.json")

        if firebase_json:
            import json as _json
            data = _json.loads(firebase_json)
            cred = credentials.Certificate(data)
        elif firebase_b64:
            import json as _json
            decoded = base64.b64decode(firebase_b64)
            data = _json.loads(decoded)
            cred = credentials.Certificate(data)
        elif os.path.exists(firebase_file):
            cred = credentials.Certificate(firebase_file)

        if cred is not None:
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            print("✅ Firebase Admin SDK initialized successfully")
        else:
            raise RuntimeError("No Firebase credentials provided")
    except Exception as e:
        print(f"⚠️ Firebase Admin SDK not initialized: {e}")
        print("⚠️ Authentication will be disabled. Provide FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_B64")
        firebase_initialized = False

app = FastAPI(title="DataFlow Analytics API", version="1.0.0")

# CORS
allowed = [origin.strip() for origin in FRONTEND_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_origin_regex=r"^https:\/\/([a-z0-9-]+\.)*netlify\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Firebase Authentication Dependency
async def verify_firebase_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    token = authorization.split("Bearer ")[1]
    
    if not firebase_initialized:
        # If Firebase is not initialized, try to decode token manually for development
        print("⚠️ Firebase not configured, trying manual token decode...")
        try:
            import base64
            import json
            
            # Extract payload from JWT token (middle part)
            token_parts = token.split('.')
            if len(token_parts) != 3:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token format"
                )
            
            # Decode the payload (add padding if needed)
            payload = token_parts[1]
            # Add padding if necessary
            missing_padding = len(payload) % 4
            if missing_padding:
                payload += '=' * (4 - missing_padding)
            
            decoded_payload = base64.urlsafe_b64decode(payload)
            user_data = json.loads(decoded_payload)
            
            print(f"✅ Decoded user_id: {user_data.get('user_id', 'unknown')}")
            print(f"✅ Decoded email: {user_data.get('email', 'unknown')}")
            
            return {
                "uid": user_data.get('user_id', user_data.get('sub', 'unknown')),
                "email": user_data.get('email', 'unknown@example.com')
            }
        except Exception as decode_error:
            print(f"❌ Manual token decode failed: {decode_error}")
            # Fallback to mock user
            return {"uid": "dev_user_123", "email": "dev@example.com"}
    
    try:
        # Verify the Firebase token
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

# ---------------- Health Check ----------------
@app.get("/")
async def root():
    return {"message": "DataFlow Analytics API is running!"}

# ---------------- File Upload ----------------
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    valid_extensions = ['.xlsx', '.xls', '.csv']
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in valid_extensions:
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload Excel or CSV.")

    # Clear previous uploads
    for existing in os.listdir(UPLOAD_DIR):
        existing_path = os.path.join(UPLOAD_DIR, existing)
        if os.path.isfile(existing_path):
            os.remove(existing_path)

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {"message": "File uploaded successfully", "file_path": file_path}

# ---------------- Data Processing ----------------
@app.post("/api/process-data")
async def process_data(
    remove_fields: str = Form(""),
    number_of_relations: int = Form(1),
    description: str = Form(""),
    require_dashboard: str = Form("false"),
    decoded_token: dict = Depends(verify_firebase_token)  # Get user info from Firebase token
):
    try:
        # Extract user_id from Firebase token
        user_id = decoded_token.get('uid', 'anonymous')
        
        require_dashboard_bool = str(require_dashboard).lower() in ("true", "1", "yes")

        uploaded_files = os.listdir(UPLOAD_DIR)
        if not uploaded_files:
            return JSONResponse(status_code=400, content={"message": "No uploaded file found. Please upload first."})

        file_id = f"processed_{uuid4().hex}.xlsx"
        number_of_relations = max(1, number_of_relations)

        # Process the Excel file
        processed_data = process_excel_file(
            UPLOAD_DIR,
            remove_fields,
            number_of_relations,
            description,
            require_dashboard_bool,
            output_filename=file_id
        )

        # Save processed data to MongoDB with proper user_id
        from db import store_processed_data
        store_processed_data(
            user_id=user_id,  # Now using actual Firebase UID
            file_name=uploaded_files[0],
            description=description,
            remove_fields=remove_fields,
            number_of_relations=number_of_relations,
            require_dashboard=require_dashboard_bool,
            file_id=file_id,
            processed_data=processed_data
        )

        return JSONResponse(status_code=200, content={"message": "processed", "file_id": file_id})

    except ValueError as ve:
        return JSONResponse(status_code=400, content={"message": f"Failed to process file: {str(ve)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal server error: {str(e)}"})

# ---------------- View Processed File ----------------
@app.get("/api/view-processed-file/{file_id}")
async def view_processed_file(file_id: str, decoded_token: dict = Depends(verify_firebase_token)):
    try:
        user_id = decoded_token.get('uid', 'anonymous')
        
        # Import here to avoid circular imports
        from db import get_user_processed_files, get_processed_data_by_id
        
        # Verify file belongs to user
        user_files = get_user_processed_files(user_id)
        file_exists = any(file['file_id'] == file_id for file in user_files)
        
        if not file_exists:
            raise HTTPException(status_code=404, detail="File not found or access denied")
        
        # Get processed data from MongoDB
        processed_data = get_processed_data_by_id(file_id)
        
        if not processed_data or 'processed_data' not in processed_data:
            raise HTTPException(status_code=404, detail="Processed file not found in database")
        
        # Return the processed data directly from MongoDB
        result = processed_data['processed_data']
        
        print(f"Retrieved data from MongoDB for file_id: {file_id}")
        print(f"Result keys: {result.keys()}")
        print(f"Result content: cleaned_data={len(result.get('cleaned_data', []))}, pivot_tables={len(result.get('pivot_tables', []))}, has_dashboard={result.get('has_dashboard', False)}")
        
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in view_processed_file: {e}")
        return JSONResponse(status_code=500, content={"message": f"Internal server error: {str(e)}"})

# ---------------- Get User's Processed Files ----------------
@app.get("/api/user-files")
async def get_user_files(decoded_token: dict = Depends(verify_firebase_token)):
    try:
        user_id = decoded_token.get('uid', 'anonymous')
        
        # Import here to avoid circular imports
        from db import get_user_processed_files
        
        files = get_user_processed_files(user_id)
        return JSONResponse(content={"files": files})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal server error: {str(e)}"})

# ---------------- Get User's Recent Files (Last 7 Days) ----------------
@app.get("/api/user-recent-files")
async def get_user_recent_files(decoded_token: dict = Depends(verify_firebase_token)):
    try:
        user_id = decoded_token.get('uid', 'anonymous')
        
        # Import here to avoid circular imports
        from db import get_user_recent_files
        
        recent_files = get_user_recent_files(user_id, days=7)
        return JSONResponse(content={"recent_files": recent_files})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal server error: {str(e)}"})

# ---------------- Download Processed File ----------------
@app.get("/api/download-processed-file/{file_id}")
async def download_processed_file(file_id: str, decoded_token: dict = Depends(verify_firebase_token)):
    try:
        user_id = decoded_token.get('uid', 'anonymous')
        
        # Import here to avoid circular imports
        from db import get_user_processed_files, get_processed_data_by_id
        import base64
        from fastapi.responses import Response
        
        # Verify file belongs to user
        user_files = get_user_processed_files(user_id)
        file_exists = any(file['file_id'] == file_id for file in user_files)
        
        if not file_exists:
            raise HTTPException(status_code=404, detail="File not found or access denied")
        
        # Get processed data from MongoDB
        processed_data = get_processed_data_by_id(file_id)
        
        if not processed_data or 'processed_data' not in processed_data:
            raise HTTPException(status_code=404, detail="Processed file not found in database")
        
        # Get file content from MongoDB
        file_content_base64 = processed_data['processed_data'].get('file_content_base64')
        if not file_content_base64:
            raise HTTPException(status_code=404, detail="File content not found in database")
        
        # Decode base64 content
        file_content = base64.b64decode(file_content_base64)
        
        # Get filename from processed data
        filename = processed_data['processed_data'].get('file_name', file_id)
        
        return Response(
            content=file_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal server error: {str(e)}"})

# ---------------- Delete File ----------------
@app.delete("/api/delete-file/{file_id}")
async def delete_file(file_id: str, decoded_token: dict = Depends(verify_firebase_token)):
    try:
        user_id = decoded_token.get('uid', 'anonymous')
        
        # Import here to avoid circular imports
        from db import get_user_processed_files, delete_user_file
        
        # Verify file belongs to user
        user_files = get_user_processed_files(user_id)
        file_exists = any(file['file_id'] == file_id for file in user_files)
        
        if not file_exists:
            raise HTTPException(status_code=404, detail="File not found or access denied")
        
        # Delete from database (file content is stored in MongoDB, so no local file to delete)
        success = delete_user_file(user_id, file_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete file from database")
        
        return JSONResponse(content={"message": "File deleted successfully from database"})
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal server error: {str(e)}"})

# ---------------- Get Processed Data from MongoDB ----------------
@app.get("/api/get-processed-data/{file_id}")
async def get_processed_data(file_id: str, decoded_token: dict = Depends(verify_firebase_token)):
    try:
        user_id = decoded_token.get('uid', 'anonymous')
        
        # Import here to avoid circular imports
        from db import get_user_processed_files, get_processed_data_by_id
        
        # Verify file belongs to user
        user_files = get_user_processed_files(user_id)
        file_exists = any(file['file_id'] == file_id for file in user_files)
        
        if not file_exists:
            raise HTTPException(status_code=404, detail="File not found or access denied")
        
        # Get processed data from MongoDB
        processed_data = get_processed_data_by_id(file_id)
        
        if not processed_data:
            raise HTTPException(status_code=404, detail="Processed data not found in database")
        
        return JSONResponse(content=processed_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in get_processed_data: {e}")
        return JSONResponse(status_code=500, content={"message": f"Internal server error: {str(e)}"})

# ---------------- Test MongoDB Data ----------------
@app.get("/api/test-mongodb-data/{file_id}")
async def test_mongodb_data(file_id: str, decoded_token: dict = Depends(verify_firebase_token)):
    try:
        user_id = decoded_token.get('uid', 'anonymous')
        
        # Import here to avoid circular imports
        from db import get_user_processed_files, get_processed_data_by_id
        
        # Verify file belongs to user
        user_files = get_user_processed_files(user_id)
        file_exists = any(file['file_id'] == file_id for file in user_files)
        
        if not file_exists:
            raise HTTPException(status_code=404, detail="File not found or access denied")
        
        # Get processed data from MongoDB
        processed_data = get_processed_data_by_id(file_id)
        
        if not processed_data:
            raise HTTPException(status_code=404, detail="Processed data not found in database")
        
        # Return the raw MongoDB document for testing
        return JSONResponse(content={
            "message": "MongoDB data retrieved successfully",
            "file_id": file_id,
            "user_id": user_id,
            "raw_data": processed_data
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in test_mongodb_data: {e}")
        return JSONResponse(status_code=500, content={"message": f"Internal server error: {str(e)}"})


# ---------------- Chat via data  ----------------

class ChatRequest(BaseModel):
    question: str
    file_id: str

class ChatResponse(BaseModel):
    answer: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, decoded_token: dict = Depends(verify_firebase_token)):
    try:
        user_id = decoded_token.get("uid", "anonymous")

        # Import DB here to avoid circulars
        from db import get_user_processed_files, get_processed_data_by_id

        # Verify file belongs to user
        user_files = get_user_processed_files(user_id)
        if not any(f["file_id"] == req.file_id for f in user_files):
            raise HTTPException(status_code=404, detail="File not found or access denied")

        processed_data = get_processed_data_by_id(req.file_id)
        if not processed_data:
            raise HTTPException(status_code=404, detail="Processed data not found")

        answer = answer_question(processed_data, req.question)
        return ChatResponse(answer=answer)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")
    

    
# ---------------- Run Uvicorn ----------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

