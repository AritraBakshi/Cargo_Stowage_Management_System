from fastapi import APIRouter
from database import db
from utils.csv_export import dicts_to_csv_response

router = APIRouter()

@router.get("/export/containers")
async def export_containers():
    containers = await db["containers"].find().to_list(None)
    export_data = []

    for c in containers:
        dims = c.get("dimensions", {})
        export_data.append({
            "container_id": c.get("container_id", ""),
            "zone": c.get("zone", ""),
            "dimensions": f'{dims.get("width", 0)}x{dims.get("depth", 0)}x{dims.get("height", 0)}',
            "num_items": len(c.get("items", []))
        })

    headers = ["container_id", "zone", "dimensions", "num_items"]
    return dicts_to_csv_response(export_data, headers, "containers.csv")


@router.get("/export/items")
async def export_items():
    containers = await db["containers"].find().to_list(None)
    export_data = []

    for c in containers:
        for item in c.get("items", []):
            dims = item.get("dimensions", {})
            export_data.append({
                "item_id": item.get("item_id", ""),
                "name": item.get("name", ""),
                "container_id": c.get("container_id", ""),
                "dimensions": f'{dims.get("width", 0)}x{dims.get("depth", 0)}x{dims.get("height", 0)}',
                "mass": item.get("mass", ""),
                "priority": item.get("priority", ""),
                "expiry_date": item.get("expiry_date", ""),
                "usage_limit": item.get("usage_limit", ""),
                "usage_count": item.get("usage_count", ""),
                "is_waste": item.get("is_waste", ""),
                "waste_reason": item.get("waste_reason", "")
            })

    headers = ["item_id", "name", "container_id", "dimensions", "mass", "priority", "expiry_date", "usage_limit", "usage_count", "is_waste", "waste_reason"]
    return dicts_to_csv_response(export_data, headers, "items.csv")
