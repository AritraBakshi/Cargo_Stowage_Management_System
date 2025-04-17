from fastapi import FastAPI
from contextlib import asynccontextmanager
from api.routes import router
# from pymongo.mongo_client import MongoClient
# from pymongo.server_api import ServerApi
# from motor.motor_asyncio import AsyncIOMotorClient
import os
from database import db
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:5173",
    "*"
]

# 🔐 MongoDB connection string (secured via .env file)
MONGO_URI = "mongodb+srv://arkabasak62:1234@cluster0.kakqi.mongodb.net/?appName=Cluster0"

@asynccontextmanager
async def lifespan(app: FastAPI):

    yield  # Hand control over to FastAPI during execution


# Create FastAPI app with lifespan context
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")

@app.get("/")
async def home():
    return {"message": "FastAPI Backend is Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
