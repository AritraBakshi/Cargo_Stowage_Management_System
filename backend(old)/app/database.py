from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os

MONGO_URI = "mongodb+srv://arkabasak62:1234@cluster0.kakqi.mongodb.net/?appName=Cluster0"

# Sync client (for testing, admin tasks)
client = MongoClient(MONGO_URI, server_api=ServerApi('1'))

# Async client (for FastAPI operations)
async_client = AsyncIOMotorClient(MONGO_URI)
db = async_client["ContainerDB"]  # Database will be created if not exist

# Test connection
try:
    client.admin.command("ping")  # Sync Ping
    print("✅ Successfully connected to MongoDB!")
except Exception as e:
    print(f"❌ MongoDB Connection Error: {e}")
