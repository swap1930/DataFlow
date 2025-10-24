import os

# Frontend origin for CORS - Support multiple deployment platforms
FRONTEND_ORIGINS = (
    os.getenv("FRONTEND_ORIGINS") or 
    os.getenv("FRONTEND_ORIGIN") or 
    os.getenv("RENDER_FRONTEND") or 
    os.getenv("VERCEL_URL") or
    os.getenv("NETLIFY_URL") or
    "http://localhost:5173,http://localhost:3000,https://localhost:5173"
)

# Add common deployment URLs
DEPLOYMENT_URLS = [
    "https://excelprocess.netlify.app",
    
]

# Combine with environment URLs
if FRONTEND_ORIGINS:
    all_origins = FRONTEND_ORIGINS.split(",") + DEPLOYMENT_URLS
    FRONTEND_ORIGINS = ",".join(set(all_origins))

# Mongo connection - Support multiple deployment platforms
MONGO_URI = (
    os.getenv("MONGO_URI") or 
    os.getenv("RENDER_MONGO_URI") or 
    os.getenv("MONGODB_URI") or
    os.getenv("DATABASE_URL") or
    "mongodb://localhost:27017"
)


