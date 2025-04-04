from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Welcome to FastAPI"}

@router.get("/items/{item_id}")
async def get_item(item_id: int):
    return {"item_id": item_id, "name": f"Item {item_id}"}
