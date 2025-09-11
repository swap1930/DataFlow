from pymongo import MongoClient
from datetime import datetime
from config import MONGO_URI

DB_NAME = "dataflow_db"
COLLECTION_NAME = "processed_files"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

def insert_processed_file(user_id: str, file_name: str, description: str, remove_fields: str,
                          number_of_relations: int, require_dashboard: bool, file_id: str):
    """
    Store processed file info in MongoDB linked to a specific Firebase user.
    """
    data = {
        "user_id": user_id,               # link with Firebase user
        "file_name": file_name,
        "description": description,
        "remove_fields": remove_fields,
        "number_of_relations": number_of_relations,
        "require_dashboard": require_dashboard,
        "file_id": file_id,
        "created_at": datetime.utcnow()
    }
    result = collection.insert_one(data)
    return str(result.inserted_id)

def get_user_processed_files(user_id: str):
    """
    Get all processed files for a specific user from MongoDB.
    """
    try:
        # Find all documents for the specific user, sorted by creation date (newest first)
        cursor = collection.find(
            {"user_id": user_id},
            {"_id": 0}  # Exclude MongoDB _id field
        ).sort("created_at", -1)
        
        # Convert cursor to list of dictionaries
        files = list(cursor)
        
        # Convert datetime objects to string for JSON serialization
        for file in files:
            if "created_at" in file:
                file["created_at"] = file["created_at"].isoformat()
        
        return files
    except Exception as e:
        print(f"Error fetching user files: {e}")
        return []

def get_user_recent_files(user_id: str, days: int = 7):
    """
    Get recent processed files for a specific user from last N days.
    """
    try:
        from datetime import datetime, timedelta
        
        # Calculate date N days ago
        days_ago = datetime.utcnow() - timedelta(days=days)
        
        # Find documents for the specific user from last N days
        cursor = collection.find(
            {
                "user_id": user_id,
                "created_at": {"$gte": days_ago}
            },
            {
                "_id": 0,
                "file_name": 1,
                "description": 1,
                "created_at": 1,
                "file_id": 1
            }
        ).sort("created_at", -1)
        
        # Convert cursor to list of dictionaries
        files = list(cursor)
        
        # Convert datetime objects to string for JSON serialization
        for file in files:
            if "created_at" in file:
                file["created_at"] = file["created_at"].isoformat()
        
        return files
    except Exception as e:
        print(f"Error fetching recent user files: {e}")
        return []

def delete_user_file(user_id: str, file_id: str):
    """
    Delete a specific file for a user from MongoDB.
    """
    try:
        # Delete the document
        result = collection.delete_one({
            "user_id": user_id,
            "file_id": file_id
        })
        
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting user file: {e}")
        return False

def get_processed_data_by_id(file_id: str):
    """
    Get processed data for a specific file from MongoDB.
    """
    try:
        # Find the document by file_id
        document = collection.find_one(
            {"file_id": file_id},
            {"_id": 0}  # Exclude MongoDB _id field
        )
        
        if not document:
            return None
        
        # Convert datetime objects to string for JSON serialization
        if "created_at" in document:
            document["created_at"] = document["created_at"].isoformat()
        
        return document
    except Exception as e:
        print(f"Error fetching processed data: {e}")
        return None

def store_processed_data(user_id: str, file_name: str, description: str, remove_fields: str,
                        number_of_relations: int, require_dashboard: bool, file_id: str, processed_data: dict):
    """
    Store processed file data in MongoDB linked to a specific Firebase user.
    """
    data = {
        "user_id": user_id,               # link with Firebase user
        "file_name": file_name,
        "description": description,
        "remove_fields": remove_fields,
        "number_of_relations": number_of_relations,
        "require_dashboard": require_dashboard,
        "file_id": file_id,
        "created_at": datetime.utcnow(),
        "processed_data": processed_data  # Store the actual processed data
    }
    result = collection.insert_one(data)
    return str(result.inserted_id)
