# from motor.motor_asyncio import AsyncIOMotorClient
# from pymongo.mongo_client import MongoClient
# from pymongo.server_api import ServerApi
# import os

# MONGO_URI = "mongodb+srv://arkabasak62:1234@cluster0.kakqi.mongodb.net/?appName=Cluster0"

# # Sync client (for testing, admin tasks)
# client = MongoClient(MONGO_URI, server_api=ServerApi('1'))

# # Async client (for FastAPI operations)
# async_client = AsyncIOMotorClient(MONGO_URI)
# db = async_client["ContainerDB"]  # Database will be created if not exist

# # Test connection
# try:
#     client.admin.command("ping")  # Sync Ping
#     print("✅ Successfully connected to MongoDB!")
# except Exception as e:
#     print(f"❌ MongoDB Connection Error: {e}")
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from pymongo.errors import ServerSelectionTimeoutError

# Default to Atlas URI
ATLAS_URI = "mongodb+srv://arkabasak62:1234@cluster0.kakqi.mongodb.net/?appName=Cluster0"
LOCAL_URI = "mongodb://localhost:27017"
DB_NAME = "ContainerDB"

# Attempt connection
try:
    # Sync client (used for initial ping check)
    client = MongoClient(ATLAS_URI, server_api=ServerApi('1'), serverSelectionTimeoutMS=3000)
    client.admin.command("ping")  # Ping MongoDB Atlas
    print("✅ Connected to MongoDB Atlas")

    # Use Atlas for async operations
    async_client = AsyncIOMotorClient(ATLAS_URI)
except ServerSelectionTimeoutError:
    print("⚠️ Atlas connection failed. Falling back to local MongoDB...")
    try:
        client = MongoClient(LOCAL_URI, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")
        print("✅ Connected to local MongoDB")
        async_client = AsyncIOMotorClient(LOCAL_URI)
    except Exception as e:
        print("❌ Failed to connect to both Atlas and Local MongoDB")
        raise e

# Export the async DB instance for use in your app
db = async_client[DB_NAME]
