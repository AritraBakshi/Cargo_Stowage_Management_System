import pandas as pd
import re
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from datetime import datetime
from database import db
from io import StringIO
from typing import List
from ..models.items import ItemData

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
            match = re.search(r'\d+', usage_limit_str)
            if not match:
                raise ValueError(f"Invalid Usage Limit format: {usage_limit_str}")
            usage_limit = int(match.group())

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