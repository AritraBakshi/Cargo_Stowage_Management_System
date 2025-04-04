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

router = APIRouter()

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
