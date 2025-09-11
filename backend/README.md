# Backend Setup Instructions

## Firebase Authentication Setup

### 1. Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Go to Service Accounts tab
5. Click "Generate new private key"
6. Download the JSON file
7. Rename it to `firebase-service-account.json`
8. Place it in the `backend/` directory

### 2. Update Firebase Config

Replace the placeholder values in `firebase-service-account.json` with your actual Firebase project credentials:

```json
{
  "type": "service_account",
  "project_id": "your-actual-project-id",
  "private_key_id": "your-actual-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-actual-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

## MongoDB Setup

### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster or use existing one
3. Get your connection string
4. Update the `MONGO_URI` in `db.py`:

```python
MONGO_URI = "mongodb+srv://username:password@your-cluster-url/"
```

### 2. Database and Collection

The system will automatically create:
- Database: `dataflow_db`
- Collection: `processed_files`

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start the server:
```bash
python main.py
```

## API Endpoints

### Authentication Required Endpoints

- `POST /api/process-data` - Process uploaded file (requires Firebase token)
- `GET /api/user-files` - Get user's processed files (requires Firebase token)
- `GET /api/download-processed-file/{file_id}` - Download processed file (requires Firebase token)

### Public Endpoints

- `GET /` - Health check
- `POST /api/upload` - Upload file

## How User ID Works

1. Frontend sends Firebase ID token in Authorization header
2. Backend verifies token using Firebase Admin SDK
3. User ID is extracted from verified token
4. Data is stored in MongoDB with proper user_id
5. Users can only access their own files

## Security Features

- Firebase token verification on all protected endpoints
- User-specific file access
- MongoDB user isolation
- CORS protection
