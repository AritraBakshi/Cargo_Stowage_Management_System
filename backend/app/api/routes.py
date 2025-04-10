import pandas as pd
import re
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from datetime import datetime
from database import db
from io import StringIO
from typing import List, Optional
from typing import Dict
from app.models.items import ItemData,ItemRetrieveRequest
from app.models.items import PlacementRequest
from app.models.container import Container
from app.services.placement import PlacementService
from app.services.retrieval import RetrievalService
from app.models.items import Dimensions, Position, Item
from datetime import datetime
from pymongo import UpdateOne  # Required import
from fastapi import Query
from app.models.requestsschema import PlaceItemRequest
from app.models.log import LogModel


async def log_action(user_id: Optional[str], action_type: str, item_id: str, details: Dict[str, Optional[str]] = {}):
    log = LogModel(
        timestamp=datetime.utcnow(),
        userId=user_id,
        actionType=action_type,
        itemId=item_id,
        details=details
    )
    await db.logs.insert_one(log.model_dump())

    
placement_service = PlacementService()
router = APIRouter()

@router.post("/import/items")
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

@router.post('/import/containers')
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
            occupied_volume=c.get("occupied_volume", 0.0),
            items=c.get("items")  # Load existing items from the database
        )
        for c in containers_raw
    ]
    return {"containers": [container.dict() for container in containers]}

@router.get("/items")
async def get_items(item_id: Optional[str] = Query(None, description="The ID of the item to retrieve")):
    if item_id:
        item = await db.items.find_one({"item_id": item_id})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        item_data = Item(
            item_id=item["item_id"],
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
    
    # If no item_id, return list of items
    items_raw = await db.items.find().to_list(length=1000)
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
    return {"items": [item.model_dump() for item in items]}

@router.get("/search")
async def search_item(
    item_id: Optional[str] = Query(None, alias="itemId"),
    item_name: Optional[str] = Query(None, alias="itemName"),
    user_id: Optional[str] = Query(None, alias="userId")  # Currently unused, can be used to filter further
):
    print("hit")
    if not item_id and not item_name:
        raise HTTPException(status_code=400, detail="Either itemId or itemName must be provided.")

    query = {}
    if item_id:
        query["item_id"] = item_id
    elif item_name:
        query["name"] = item_name

    item = await db.items.find_one(query)
    if not item:
        return {"success": True, "found": False, "item": None}

    response_item = {
        "itemId": item["item_id"],
        "name": item["name"],
        "containerId": item.get("container_id"),
        "zone": item.get("preferred_zone"),
        "usageLimit": item.get("usage_limit"),
        "expiryDate": item.get("expiry_date"),
        "mass": item["mass"],
        "priority": item["priority"],
        "usageCount": item.get("usage_count", 0),
        "dimensions": {
            "width": item["dimensions"]["width"],
            "depth": item["dimensions"]["depth"],
            "height": item["dimensions"]["height"]
        },
        "isWaste": item.get("is_waste", False),
        "wasteReason": item.get("waste_reason"),

        "position": {
            "startCoordinates": item["position"]["start_coordinates"],
            "endCoordinates": item["position"]["end_coordinates"]
        } if "position" in item else None
    }

    return {
        "success": True,
        "found": True,
        "item": response_item
    }

@router.get("/containers/{container_id}")
async def get_container(container_id: str):
    # Fetch container from database
    container = await db.containers.find_one({"container_id": container_id})
    
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    
    # Convert to Container model
    container_data = Container(
        container_id=container["container_id"],
        zone=container["zone"],
        dimensions=Dimensions(**container["dimensions"]),
        occupied_volume=container.get("occupied_volume", 0.0),
        items=container.get("items", [])  # Handle missing items field
    )
    
    return {"container": container_data.model_dump()}


# @router.post("/placement")
# async def place_items_endpoint(items: List[ItemData]):
#     containers_raw = await db.containers.find().to_list(length=1000)
#     containers: List[Container] = [
#         Container(
#             container_id=c["container_id"],
#             zone=c["zone"],
#             dimensions=Dimensions(**c["dimensions"]),
#             occupied_volume=c.get("occupied_volume", 0.0)
#         )
#         for c in containers_raw
#     ]

#     placed_items = []
#     for item_data in items:
#         item = Item(
#             item_id=item_data.item_id,
#             name=item_data.name,
#             dimensions=Dimensions(
#                 width=item_data.width,
#                 depth=item_data.depth,
#                 height=item_data.height
#             ),
#             mass=item_data.mass,
#             priority=item_data.priority,
#             expiry_date=item_data.expiry_date,
#             usage_limit=item_data.usage_limit,
#             preferred_zone=item_data.preferred_zone
#         )

#         try:
#             item = placement_service.place_item(item, containers)
#             placed_items.append(item.model_dump())
#         except ValueError as e:
#             continue
        
#     print("this is placed items", placed_items)
#     if not placed_items:
#         raise HTTPException(status_code=400, detail="No items could be placed.")

#     # Prepare bulk operations using UpdateOne
#     bulk_item_operations = [
#         UpdateOne(
#             {"item_id": placed_item["item_id"]},
#             {"$set": {
#                 "container_id": placed_item["container_id"],
#                 "position": placed_item["position"]
#             }}
#         )
#         for placed_item in placed_items
#     ]

#     bulk_container_operations = [
#         UpdateOne(
#             {"container_id": container.container_id},
#             {"$set": {"occupied_volume": container.occupied_volume}}
#         )
#         for container in containers
#     ]

#     # Execute bulk writes with Motor's async bulk_write
#     try:
#         if bulk_item_operations:
#             await db.items.bulk_write(bulk_item_operations, ordered=False)
        
#         if bulk_container_operations:
#             await db.containers.bulk_write(bulk_container_operations, ordered=False)

#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Bulk update failed: {str(e)}"
#         )

#     return {"success":True,"placements":placed_items}

# @router.post("/placement")
# async def place_items_endpoint(request: PlacementRequest):
#     items = request.items
#     containers_raw = await db.containers.find().to_list(length=1000)
#     containers: List[Container] = [
#         Container(
#             container_id=c["container_id"],
#             zone=c["zone"],
#             dimensions=Dimensions(**c["dimensions"]),
#             occupied_volume=c.get("occupied_volume", 0.0),
#             items=c.get("items", [])  # Load existing items from the database
#         )
#         for c in containers_raw
#     ]

#     placed_items = []
#     for item_data in items:
#         item = Item(
#             item_id=item_data.item_id,
#             name=item_data.name,
#             dimensions=Dimensions(
#                 width=item_data.width,
#                 depth=item_data.depth,
#                 height=item_data.height
#             ),
#             mass=item_data.mass,
#             priority=item_data.priority,
#             expiry_date=item_data.expiry_date,
#             usage_limit=item_data.usage_limit,
#             preferred_zone=item_data.preferred_zone
#         )

#         try:
#             item = placement_service.place_item(item, containers)
#             placed_items.append(item.model_dump())  # <-- Position is still a Pydantic model here

#             # Find the container the item was placed into
#             container = next(
#                 (cont for cont in containers if cont.container_id == item.container_id),
#                 None
#             )
#             if container:
#                 # Append item details to the container's items list
#                 item_info = {
#                     "item_id": item.item_id,
#                     "position": item.position.model_dump(),  # Correct: dict
#                     "dimensions": {
#                         "width": item.dimensions.width,
#                         "depth": item.dimensions.depth,
#                         "height": item.dimensions.height
#                     },
#                     "mass": item.mass,
#                     "priority": item.priority,
#                     "expiry_date": item.expiry_date,
#                     "usage_limit": item.usage_limit
#                 }
#                 container.items.append(item_info)
#         except ValueError as e:
#             continue
        
#     if not placed_items:
#         raise HTTPException(status_code=400, detail="No items could be placed.")
#     # print("this is placed items", placed_items)
#     # print('this is container item', containers)
#     # Prepare bulk operations
#     bulk_item_operations = [
#         UpdateOne(
#             {"item_id": placed_item["item_id"]},
#             {"$set": {
#                 "container_id": placed_item["container_id"],
#                 "position": placed_item["position"]  # Fix: Convert here
#             }}
#         )
#         for placed_item in placed_items
#     ]

#     bulk_container_operations = [
#         UpdateOne(
#             {"container_id": container.container_id},
#             {"$set": {
#                 "occupied_volume": container.occupied_volume,
#                 "items": container.items  # Update the items array
#             }}
#         )
#         for container in containers
#     ]


#     try:
#         if bulk_item_operations:
#             await db.items.bulk_write(bulk_item_operations, ordered=False)
        
#         if bulk_container_operations:
#             await db.containers.bulk_write(bulk_container_operations, ordered=False)
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Bulk update failed: {str(e)}"
#         )

#     return {"success": True, "placements": placed_items}

@router.post("/placement")
async def place_items_endpoint(request: PlacementRequest):
    # Convert incoming containers to Container models
    containers: List[Container] = [
        Container(
            container_id=c.container_id,
            zone=c.zone,
            dimensions=Dimensions(
                width=c.width,
                depth=c.depth,
                height=c.height
            )
        )
        for c in request.containers
    ]

    placed_items = []

    for item_data in request.items:
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

            container = next((c for c in containers if c.container_id == item.container_id), None)
            if container:
                item_info = {
                    "item_id": item.item_id,
                    "position": item.position.model_dump() if item.position else None,
                    "dimensions": {
                        "width": item.dimensions.width,
                        "depth": item.dimensions.depth,
                        "height": item.dimensions.height
                    },
                    "mass": item.mass,
                    "priority": item.priority,
                    "expiry_date": item.expiry_date,
                    "usage_limit": item.usage_limit
                }
                container.items.append(item_info)
        except ValueError:
            continue

    if not placed_items:
        raise HTTPException(status_code=400, detail="No items could be placed.")

    return {"success": True, "placements": placed_items}

# @router.post("/retrieve")
# async def retrieve_item_endpoint(body:ItemRetrieveRequest):
#     item_id = body.itemId
#     # print("this is item id", item_id)
#     # print(await db.items.find_one({"item_id": "1"}))
#     fetcheditem = await db.items.find_one({"item_id": item_id})
#     # Fetch containers from MongoDB and convert to Container models
#     containers_raw = await db.containers.find().to_list(length=1000)
#     containers = [
#         Container(
#             container_id=c["container_id"],
#             zone=c["zone"],
#             dimensions=Dimensions(**c["dimensions"]),
#             occupied_volume=c.get("occupied_volume", 0.0),
#             items=[item for item in c.get("items",[])]  # Convert items to Item models
#         )
#         for c in containers_raw
#     ]
    
#     retrieval_service = RetrievalService(containers)
#     item = retrieval_service.retrieve_item(item_id) #retreved item withoout container id but updated usage
#     # print("this is item before upadte", item)
#     new_fetched_item = await db.items.find_one({"item_id": item_id})
#     # print("usage limit is ", item["usage_limit"])
#     if item["usage_limit"] >= -1:
#         # Update the item in the database\
#         # print("entered if block")
#         await db.items.update_one(
#             {"item_id": item_id},
#             {"$set": {
#                 "usage_limit": item["usage_limit"]
#             }}
#         )

#         await db.containers.update_one(
#             {
#                 "container_id": new_fetched_item["container_id"],
#                 "items.item_id": item_id
#             },
#             {"$set": {
#                 "items.$.usage_limit": item["usage_limit"]                
#                 }
#             }
#         )
#     else:
#         # # Remove the item from the database
#         # await db.items.delete_one({"item_id": item_id})
#         # # print("this is item after deletion", item)
#         # await db.containers.update_one(
#         #     {"container_id": new_fetched_item["container_id"]},
#         #     # {"$pull": {"items": {"item_id": item_id}}}
#         #     {"$set": {
#         #         "items.$.usage_limit": item["usage_limit"],
#         #         }
#         #     }
#         # )
#         raise HTTPException(status_code=404, detail="Item Fully Retirieved or not found")


#     # print("item after update", new_fetched_item)
#     # Update database after retrieval
    
#     # await db.items.delete_one({"item_id": item_id})

#     # Update the container's items list
#     # print("this is item", new_fetched_item)
#     # print("type of items", type(item))
#     # await db.containers.update_one(
#     #     {"container_id": new_fetched_item["container_id"]},
#     #     {"$pull": {"items": {"item_id": item_id}}}
#     # )

#     return {"succeess":True,"message": f"Item {item_id} retrieved successfully."}

@router.post("/retrieve")
async def retrieve_item_endpoint(body: ItemRetrieveRequest):
    item_id = body.itemId
    fetcheditem = await db.items.find_one({"item_id": item_id})

    # Fetch containers from MongoDB and convert to Container models
    containers_raw = await db.containers.find().to_list(length=1000)
    containers = [
        Container(
            container_id=c["container_id"],
            zone=c["zone"],
            dimensions=Dimensions(**c["dimensions"]),
            occupied_volume=c.get("occupied_volume", 0.0),
            items=[item for item in c.get("items", [])]
        )
        for c in containers_raw
    ]

    retrieval_service = RetrievalService(containers)
    item = retrieval_service.retrieve_item(item_id)
    new_fetched_item = await db.items.find_one({"item_id": item_id})
    print("this is item before upadte", item)
    if item["usage_limit"] >= -1:
        # Update the item in the database
        await db.items.update_one(
            {"item_id": item_id},
            {"$set": {
                "usage_limit": item["usage_limit"]
            }}
        )

        await db.containers.update_one(
            {
                "container_id": new_fetched_item["container_id"],
                "items.item_id": item_id
            },
            {"$set": {
                "items.$.usage_limit": item["usage_limit"]
            }}
        )

        # ✅ Logging the successful retrieval
        await log_action(
            user_id=None,  # You can replace this with actual user ID if available
            action_type="retrieval",
            item_id=item_id,
            details={
                "container_id": new_fetched_item["container_id"],
                "usage_limit_after": str(item["usage_limit"]),
                "reason": "Item retrieved"
            }
        )
    else:
        # ❌ Logging the failed retrieval attempt
        await log_action(
            user_id=None,
            action_type="retrieval_failed",
            item_id=item_id,
            details={
                "reason": "Item Fully Retrieved or not found"
            }
        )

        raise HTTPException(status_code=404, detail="Item Fully Retirieved or not found")

    return {"succeess": True, "message": f"Item {item_id} retrieved successfully."}



@router.get("/waste/identify")
async def identify_waste():
    now = datetime.utcnow()
    all_items = await db.items.find().to_list(length=1000)
    waste_items = []
    bulk_operations = []

    for item in all_items:
        waste_reason = None
        if item.get("expiry_date") and item["expiry_date"] < now:
            waste_reason = "Expired"
        elif item.get("usage_limit") is not None and item["usage_limit"] <= 0:
            waste_reason = "Out of Uses"

        if waste_reason:
            bulk_operations.append(UpdateOne(
                {"item_id": item["item_id"]},
                {"$set": {"waste_reason": waste_reason, "is_waste": True}}
            ))

            # Build position data if exists
            position = {}
            if "position" in item:
                pos = item["position"]
                position = {
                    "startCoordinates": {
                        "width": pos["start_coordinates"]["width"],
                        "depth": pos["start_coordinates"]["depth"],
                        "height": pos["start_coordinates"]["height"]
                    },
                    "endCoordinates": {
                        "width": pos["end_coordinates"]["width"],
                        "depth": pos["end_coordinates"]["depth"],
                        "height": pos["end_coordinates"]["height"]
                    }
                }

            waste_items.append({
                "itemId": item["item_id"],
                "name": item.get("name", "Unnamed Item"),
                "reason": waste_reason,
                "containerId": item.get("container_id", "Unknown"),
                "position": position
            })

    if bulk_operations:
        try:
            result = await db.items.bulk_write(bulk_operations)
            return {
                "success": True,
                "wasteItems": waste_items
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    return {
        "success": True,
        "wasteItems": waste_items
    }

@router.post("/place")
async def place_item(req: PlaceItemRequest):
    # Step 1: Fetch item
    item = await db.items.find_one({"item_id": req.itemId})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    # Step 2: Fetch target container
    container = await db.containers.find_one({"container_id": req.containerId})
    if not container:
        raise HTTPException(status_code=404, detail="Container not found.")

    # Step 3: Check for coordinate collisions
    new_start = req.position.start_coordinates
    new_end = req.position.end_coordinates

    def is_overlap(pos1, pos2):
        def overlaps_1d(a_start, a_end, b_start, b_end):
            return not (a_end <= b_start or b_end <= a_start)

        return (
            overlaps_1d(pos1["start"]["width"], pos1["end"]["width"], pos2["start"]["width"], pos2["end"]["width"]) and
            overlaps_1d(pos1["start"]["depth"], pos1["end"]["depth"], pos2["start"]["depth"], pos2["end"]["depth"]) and
            overlaps_1d(pos1["start"]["height"], pos1["end"]["height"], pos2["start"]["height"], pos2["end"]["height"])
        )

    new_pos = {
        "start": new_start.model_dump(),
        "end": new_end.model_dump()
    }

    for existing_item in container.get("items", []):
        if "position" not in existing_item:
            continue
        existing_pos = {
            "start": existing_item["position"]["start_coordinates"],
            "end": existing_item["position"]["end_coordinates"]
        }
        if is_overlap(existing_pos, new_pos) and existing_item["item_id"] != req.itemId:
            raise HTTPException(status_code=400, detail="Coordinates already occupied. Could not place.")

    # Step 4: Remove item from previous container if already placed
    if item.get("container_id"):
        await db.containers.update_one(
            {"container_id": item["container_id"]},
            {"$pull": {"items": {"item_id": req.itemId}}}
        )

    # Step 5: Update item document with new placement
    await db.items.update_one(
        {"item_id": req.itemId},
        {
            "$set": {
                "container_id": req.containerId,
                "position": {
                    "start_coordinates": new_start.model_dump(),
                    "end_coordinates": new_end.model_dump()
                },
                "last_placed_by": req.userId,
                "last_placed_at": req.timestamp.isoformat()
            }
        }
    )

    # Step 6: Push full item into the new container's item list
    await db.containers.update_one(
        {"container_id": req.containerId},
        {
            "$push": {
                "items": {
                    "item_id": item["item_id"],
                    "name": item["name"],
                    "dimensions": item["dimensions"],
                    "mass": item["mass"],
                    "priority": item["priority"],
                    "expiry_date": item.get("expiry_date"),
                    "usage_limit": item.get("usage_limit"),
                    "usage_count": item.get("usage_count", 0),
                    "preferred_zone": item["preferred_zone"],
                    "container_id": req.containerId,
                    "position": {
                        "start_coordinates": new_start.model_dump(),
                        "end_coordinates": new_end.model_dump()
                    },
                    "is_waste": item.get("is_waste", False),
                    "waste_reason": item.get("waste_reason"),
                    "placed_by": req.userId,
                    "timestamp": req.timestamp.isoformat()
                }
            }
        }
    )

    # Step 7: Log the placement
    await log_action(
        user_id=req.userId,
        action_type="placement",
        item_id=req.itemId,
        details={
            "container_id": req.containerId,
            "position": {
                "start_coordinates": new_start.model_dump(),
                "end_coordinates": new_end.model_dump()
            }
        }
    )

    return {"success": True, "message": "Item placed successfully."}


from app.models.requestsschema import wasteretunrreq

@router.post("/waste/return-plan")
async def returnplan(body: wasteretunrreq):
    undocking_container_id = body.undockingContainerId
    max_weight = body.maxWeight

    # Fetch and validate container
    cont_raw = await db.containers.find_one({"container_id": undocking_container_id})
    if not cont_raw:
        raise HTTPException(status_code=404, detail="Container not found")
    if cont_raw.get("occupied_volume", 0) > 0:
        raise HTTPException(status_code=400, detail="Container must be empty")

    # Create fresh container model for simulation
    container = Container(
        container_id=cont_raw["container_id"],
        zone=cont_raw["zone"],
        dimensions=Dimensions(**cont_raw["dimensions"]),
        occupied_volume=0.0,
        items=[]
    )

    # Fetch and validate waste items
    waste_items = await db.items.find({"is_waste": True}).to_list(length=1000)
    total_mass = sum(item.get("mass", 0) for item in waste_items)
    if total_mass > int(max_weight):
        raise HTTPException(
            status_code=400,
            detail=f"Total mass {total_mass}kg exceeds limit {max_weight}kg"
        )

    # Convert to Item objects
    items_to_place = []
    for w_item in waste_items:
        items_to_place.append(Item(
            item_id=w_item["item_id"],
            name=w_item.get("name", "Waste Item"),
            dimensions=Dimensions(**w_item["dimensions"]),
            mass=w_item["mass"],
            priority=w_item.get("priority", 0),
            expiry_date=w_item.get("expiry_date"),
            usage_limit=w_item.get("usage_limit"),
            preferred_zone=w_item.get("preferred_zone"),
            position=Position(**w_item["position"]) if w_item.get("position") else None
        ))

    # Simulate placement
    placed_items = []
    for item in items_to_place:
        try:
            placed_item = placement_service.place_item(item, [container])
            
            # Update container simulation
            container.items.append({
                "item_id": placed_item.item_id,
                "position": placed_item.position.model_dump(),
                "dimensions": placed_item.dimensions.model_dump(),
                "mass": placed_item.mass,
                "priority": placed_item.priority
            })
            container.occupied_volume += (
                placed_item.dimensions.width *
                placed_item.dimensions.depth *
                placed_item.dimensions.height
            )
            placed_items.append(placed_item.model_dump())
        except ValueError as e:
            continue

    if not placed_items:
        raise HTTPException(status_code=400, detail="No items could be placed")
    
    if len(placed_items) != len(waste_items):
        raise HTTPException(status_code=400, detail="Not all waste items could be placed")

    # Calculate metrics
    total_volume = (
        container.dimensions.width *
        container.dimensions.depth *
        container.dimensions.height
    )
    utilization = container.occupied_volume / total_volume * 100

    return {
        "container_id": undocking_container_id,
        "placed_items": placed_items,
        "total_mass": total_mass,
        "volume_utilization": f"{utilization:.2f}%",
        "plan_valid": len(placed_items) == len(waste_items)
    }


from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from models.log import LogModel

router = APIRouter()

@router.get("/logs", response_model=List[LogModel])
async def get_logs(
    startDate: str = Query(..., description="Start date in ISO format"),
    endDate: str = Query(..., description="End date in ISO format"),
    itemId: Optional[str] = None,
    userId: Optional[str] = None,
    actionType: Optional[str] = Query(
        None,
        description='Optional filter: "placement", "retrieval", "rearrangement", "disposal"'
    )
):
    try:
        start_dt = datetime.fromisoformat(startDate)
        end_dt = datetime.fromisoformat(endDate)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")

    query = {
        "timestamp": {
            "$gte": start_dt,
            "$lte": end_dt
        }
    }

    if itemId:
        query["itemId"] = itemId
    if userId:
        query["userId"] = userId
    if actionType:
        query["actionType"] = actionType

    logs_cursor = db.logs.find(query).sort("timestamp", -1)
    logs = await logs_cursor.to_list(length=None)

    return logs
