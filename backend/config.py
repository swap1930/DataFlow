import os

# Frontend origin for CORS
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", os.getenv("RENDER_FRONTEND", "http://localhost:5173"))

# Mongo connection
MONGO_URI = os.getenv("MONGO_URI", os.getenv("RENDER_MONGO_URI", "mongodb://localhost:27017"))


