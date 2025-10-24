import os

# Frontend origin for CORS
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS") or os.getenv("FRONTEND_ORIGIN") or os.getenv("RENDER_FRONTEND") or "http://localhost:5173,http://localhost:3000,https://localhost:5173"

# Mongo connection
MONGO_URI = os.getenv("MONGO_URI", os.getenv("RENDER_MONGO_URI", "mongodb://localhost:27017"))


