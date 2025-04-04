from fastapi import FastAPI
from api.routes import router

app = FastAPI()

app.include_router(router, prefix="/api")

@app.get("/")
async def home():
    return {"message": "FastAPI Backend is Running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)