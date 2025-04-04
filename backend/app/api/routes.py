import pandas as pd
import re
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from datetime import datetime
from database import db
from io import StringIO
from typing import List
from app.models.items import ItemData
from app.models.container import Container
from app.services.placement import PlacementService
from app.models.items import Dimensions, Position, Item

placement_service = PlacementService()
router = APIRouter()

@router.post("/additems")
async def add_items(file: UploadFile = File(...)):

    # Read CSV content
    content = await file.read()
    decoded_content = content.decode("utf-8")
    df = pd.read_csv(StringIO(decoded_content))
    items = []
    for index, row in df.iterrows():
        try:
            # Parse usage_limit using regex

            usage_limit_str = row["Usage Limit"]
            usage_limit_str = str(usage_limit_str).strip()
            match = re.search(r'\d+', usage_limit_str)
            # print("this is match", match)
            if not match:
                raise ValueError(f"Invalid Usage Limit format: {usage_limit_str}")
            usage_limit = int(match.group())
            # print("this is usage limit", usage_limit)
            # Parse expiry_date
            expiry_date_str = row.get("Expiry Date (ISO Format)")
            expiry_date = None
            if expiry_date_str and pd.notna(expiry_date_str):
                try:
                    expiry_date = datetime.fromisoformat(expiry_date_str)
                except ValueError as e:
                    raise ValueError(f"Invalid expiry date: {e}")

            # Create ItemData instance
            item_data = ItemData(
                item_id=str(row["Item ID"]),
                name=row["Name"],
                width=row["Width (cm)"],
                depth=row["Depth (cm)"],
                height=row["Height (cm)"],
                mass=row["Mass (kg)"],
                priority=row["Priority (1-100)"],
                expiry_date=expiry_date_str if expiry_date_str else None,
                usage_limit=usage_limit,
                preferred_zone=row["Preferred Zone"],
            )

            # Prepare item dict with nested dimensions and parsed expiry_date
            item_dict = item_data.dict()
            item_dict["expiry_date"] = expiry_date

            # Nest dimensions
            width = item_dict.pop("width")
            depth = item_dict.pop("depth")
            height = item_dict.pop("height")
            item_dict["dimensions"] = {
                "width": width,
                "depth": depth,
                "height": height
            }

            items.append(item_dict)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Row {index + 2} error: {str(e)}"
            )

    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid items found in CSV."
        )

    # Insert into MongoDB
    try:
        result = await db.items.insert_many(items)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insertion failed: {str(e)}"
        )

    return {"message": f"Successfully added {len(result.inserted_ids)} items."}

@router.post('/addcontainers')
async def add_containers(file: UploadFile = File(...)):
    # Read CSV content
    content = await file.read()
    decoded_content = content.decode("utf-8")
    df = pd.read_csv(StringIO(decoded_content))
    containers = []
    for index, row in df.iterrows():
        try:
            # Create Container instance
            container = {
                "container_id": str(row["Container ID"]),
                "zone": row["Zone"],
                "dimensions": {
                    "width": row["Width(cm)"],
                    "depth": row["Depth(cm)"],
                    "height": row["Height(cm)"]
                },
                "occupied_volume": 0.0
            }
            containers.append(container)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Row {index + 2} error: {str(e)}"
            )

    if not containers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid containers found in CSV."
        )

    # Insert into MongoDB
    try:
        result = await db.containers.insert_many(containers)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insertion failed: {str(e)}"
        )

    return {"message": f"Successfully added {len(result.inserted_ids)} containers."}

@router.get("/containers")
async def get_containers():
    containers_raw = await db.containers.find().to_list(length=1000)
    containers: List[Container] = [
        Container(
            container_id=c["container_id"],
            zone=c["zone"],
            dimensions=Dimensions(**c["dimensions"]),
            occupied_volume=c.get("occupied_volume", 0.0)
        )
        for c in containers_raw
    ]
    return {"containers": [container.dict() for container in containers]}

@router.get("/items")
async def get_items():
    items_raw = await db.items.find().to_list(length=1000)
    # print("this is items raw", items_raw)
    items: List[Item] = [
        Item(
            item_id=i["item_id"],
            name=i["name"],
            dimensions=Dimensions(**i["dimensions"]),
            mass=i["mass"],
            priority=i["priority"],
            expiry_date=i.get("expiry_date"),
            usage_limit=i.get("usage_limit"),
            preferred_zone=i.get("preferred_zone"),
            container_id=i.get("container_id"),
            position=Position(**i["position"]) if "position" in i else None
        )
        for i in items_raw
    ]
    return {"items": [item.dict() for item in items]}  

@router.get("/items/{item_id}")
async def get_item(item_id: str):
    item = await db.items.find_one({"_id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item_data = Item(
        item_id=item["_id"],
        name=item["name"],
        dimensions=Dimensions(**item["dimensions"]),
        mass=item["mass"],
        priority=item["priority"],
        expiry_date=item.get("expiry_date"),
        usage_limit=item.get("usage_limit"),
        preferred_zone=item.get("preferred_zone"),
        container_id=item.get("container_id"),
        position=Position(**item["position"]) if "position" in item else None
    )
    return {"item": item_data.model_dump()}

@router.post("/placeitems")
async def place_items_endpoint(items: List[ItemData]):
    containers_raw = await db.containers.find().to_list(length=1000)
    containers: List[Container] = [
        Container(
            container_id=c["container_id"],
            zone=c["zone"],
            dimensions=Dimensions(**c["dimensions"]),
            occupied_volume=c.get("occupied_volume", 0.0)
        )
        for c in containers_raw
    ]

    placed_items = []
    for item_data in items:
        item = Item(
            item_id=item_data.item_id,
            name=item_data.name,
            dimensions=Dimensions(
                width=item_data.width,
                depth=item_data.depth,
                height=item_data.height
            ),
            mass=item_data.mass,
            priority=item_data.priority,
            expiry_date=item_data.expiry_date,
            usage_limit=item_data.usage_limit,
            preferred_zone=item_data.preferred_zone
        )

        try:
            item = placement_service.place_item(item, containers)
            placed_items.append(item.model_dump())
        except ValueError as e:
            continue
        
    print("this is placed items", placed_items)
    if not placed_items:
        raise HTTPException(status_code=400, detail="No items could be placed.")

    # Insert to DB
    for placed_item in placed_items:
        try:
            await db.items.update_one({"item_id": placed_item["item_id"]},
                {"$set": {
                    "container_id": placed_item["container_id"],
                    "position": placed_item["position"]
                }}
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")

    for container in containers:
        await db.containers.update_one(
            {"container_id": container.container_id},
            {"$set": {"occupied_volume": container.occupied_volume}}
        )

    return {"message": f"Placed {len(placed_items)} items."}
