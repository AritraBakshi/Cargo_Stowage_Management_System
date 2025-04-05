import pandas as pd
import re
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from datetime import datetime
from database import db
from io import StringIO
from typing import List
# To directly call items and container
from ..models.items import ItemData, Item, Dimensions, Position
from ..models.containers import Container
from app.services.placement import PlacementService
from api.services.retrieval import RetrievalService
from api.services.waste_management import WasteManager
from api.services.return_service import ReturnService


router = APIRouter()
placement_service = PlacementService()

@router.post("/additems")
async def add_items(file: UploadFile = File(...)):
    content = await file.read()
    decoded_content = content.decode("utf-8")
    df = pd.read_csv(StringIO(decoded_content))

    # Load containers from DB and convert to model instances
    containers_raw = await db.containers.find().to_list(length=1000)
    containers: List[Container] = [
        Container(
            container_id=c["_id"],
            zone=c["zone"],
            dimensions=Dimensions(**c["dimensions"]),
            occupied_volume=c.get("occupied_volume", 0.0)
        )
        for c in containers_raw
    ]

    items_to_insert = []
    for index, row in df.iterrows():
        try:
            # Parse usage limit
            usage_limit_str = row["Usage Limit"]
            match = re.search(r'\d+', usage_limit_str)
            if not match:
                raise ValueError(f"Invalid Usage Limit: {usage_limit_str}")
            usage_limit = int(match.group())

            # Parse expiry date
            expiry_date_str = row.get("Expiry Date (ISO Format)")
            expiry_date = None
            if expiry_date_str and expiry_date_str != "N/A":
                expiry_date = datetime.fromisoformat(expiry_date_str)

            # Build ItemData and convert to Item model
            item_data = ItemData(
                item_id=str(row["Item ID"]),
                name=row["Name"],
                width=row["Width (cm)"],
                depth=row["Depth (cm)"],
                height=row["Height (cm)"],
                mass=row["Mass (kg)"],
                priority=row["Priority (1-100)"],
                expiry_date=expiry_date_str if expiry_date_str != "N/A" else None,
                usage_limit=usage_limit,
                preferred_zone=row["Preferred Zone"]
            )

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
                expiry_date=expiry_date,
                usage_limit=item_data.usage_limit,
                preferred_zone=item_data.preferred_zone
            )

            # Placement logic
            placed = False
            sorted_containers = sorted(
                containers,
                key=lambda c: c.get_avail_vol(),
                reverse=True
            )

            for container in sorted_containers:
                if container.zone != item.preferred_zone:
                    continue
                if item.will_cont_fit(container):
                    # Naive placement at origin
                    item.container_id = container.container_id
                    item.position = Position(
                        start_coordinates=Dimensions(0, 0, 0),
                        end_coordinates=item.dimensions
                    )
                    container.occupied_volume += item.cal_vol()
                    placed = True
                    break

            if not placed:
                raise ValueError(f"Item {item.item_id} could not be placed.")

            # Convert to dict and prepare for DB
            item_dict = item.dict()
            if item.expiry_date:
                item_dict["expiry_date"] = item.expiry_date.isoformat()

            items_to_insert.append(item_dict)

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Row {index + 2} error: {str(e)}"
            )

    if not items_to_insert:
        raise HTTPException(status_code=400, detail="No valid items found.")

    try:
        result = await db.items.insert_many(items_to_insert)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB insertion failed: {str(e)}")

    # Optionally: Update containers in DB with new occupied_volume
    for container in containers:
        await db.containers.update_one(
            {"_id": container.container_id},
            {"$set": {"occupied_volume": container.occupied_volume}}
        )

    return {"message": f"Successfully placed {len(result.inserted_ids)} items."}



@router.post("/placeitems")
async def place_items_endpoint(items: List[ItemData]):
    containers_raw = await db.containers.find().to_list(length=1000)
    containers: List[Container] = [
        Container(
            container_id=c["_id"],
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
            placed_items.append(item.dict())
        except ValueError as e:
            continue

    if not placed_items:
        raise HTTPException(status_code=400, detail="No items could be placed.")

    # Insert to DB
    await db.items.insert_many(placed_items)

    for container in containers:
        await db.containers.update_one(
            {"_id": container.container_id},
            {"$set": {"occupied_volume": container.occupied_volume}}
        )

    return {"message": f"Placed {len(placed_items)} items."}


@router.post("/retrieve_item/{item_id}")
async def retrieve_item_endpoint(item_id: str):
    containers_raw = await db.containers.find().to_list(length=1000)
    containers = [
        Container(
            container_id=c["_id"],
            zone=c["zone"],
            dimensions=Dimensions(**c["dimensions"]),
            occupied_volume=c.get("occupied_volume", 0.0),
            items=c.get("items", [])
        )
        for c in containers_raw
    ]
    
    retrieval_service = RetrievalService(containers)
    item = retrieval_service.retrieve_item(item_id)

    await db.items.delete_one({"item_id": item_id})

    await db.containers.update_one(
        {"_id": item.container_id},
        {"$pull": {"items": {"item_id": item_id}}}
    )

    return {"message": f"Item {item_id} retrieved successfully."}


@router.post("/dispose_waste")
async def dispose_waste_items():
    from datetime import datetime
    items_raw = await db.items.find().to_list(length=1000)
    now = datetime.utcnow()

    to_dispose = []
    for item in items_raw:
        expired = item.get("expiry_date") and datetime.fromisoformat(item["expiry_date"]) < now
        used_up = item.get("usage_limit", 0) <= item.get("usage_count", 0)
        if expired or used_up:
            to_dispose.append(item["item_id"])
            await db.items.update_one(
                {"item_id": item["item_id"]},
                {"$set": {"is_waste": True, "waste_reason": "expired" if expired else "usage limit exceeded"}}
            )

    return {"disposed_items": to_dispose}

# To initialize containers with item
async def load_containers_with_items() -> List[Container]:
    containers_raw = await db.containers.find().to_list(length=1000)
    items_raw = await db.items.find().to_list(length=1000)

    container_map = {
        c["_id"]: Container(
            container_id=c["_id"],
            zone=c["zone"],
            dimensions=Dimensions(**c["dimensions"]),
            occupied_volume=c.get("occupied_volume", 0.0),
            items=[]
        )
        for c in containers_raw
    }

    for item in items_raw:
        container_id = item.get("container_id")
        if container_id in container_map:
            container_map[container_id].items.append(Item(**item))

    return list(container_map.values())

@router.post("/return/waste-items")
async def move_waste_items_to_container():
    containers = await load_containers_with_items()
    return_service = ReturnService(containers)
    return_service.move_waste_to_return_container()

    # Update DB after moving items
    for container in containers:
        await db.containers.update_one(
            {"_id": container.container_id},
            {"$set": {
                "occupied_volume": container.occupied_volume,
                "items": [item.dict() for item in container.items]
            }}
        )

    return {"message": "Waste items moved and containers updated."}


@router.get("/return/waste-container")
async def view_waste_container_contents():
    containers = await load_containers_with_items()
    return_service = ReturnService(containers)
    items = return_service.show_waste_contents()
    return {"waste_container": [item.dict() for item in items]}


@router.delete("/return/waste-container")
async def clear_waste_container():
    containers = await load_containers_with_items()
    return_service = ReturnService(containers)
    return_service.clear_waste()

    await db.containers.update_one(
        {"_id": "waste"},
        {"$set": {"items": []}}
    )

    return {"message": "Waste container cleared."}

