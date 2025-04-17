from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.items import Position


class WasteReturnRequest(BaseModel):
    """
    Model for creating a waste return request.
    
    Used when returning waste items to their origin.
    """
    undocking_container_id: str = Field(
        ..., 
        alias="undockingContainerId",
        description="ID of the container to undock"
    )
    undocking_date: Optional[datetime] = Field(
        None, 
        alias="undockingDate",
        description="Date when the container will be undocked"
    )
    max_weight: float = Field(
        ..., 
        alias="maxWeight",
        description="Maximum weight allowed for the waste return"
    )


class PlaceItemRequest(BaseModel):
    """
    Model for placing a single item in a container.
    
    Contains information needed to place an item in a specific container.
    """
    item_id: str = Field(
        ..., 
        alias="itemId",
        description="ID of the item to place"
    )
    user_id: str = Field(
        ..., 
        alias="userId",
        description="ID of the user making the request"
    )
    timestamp: datetime = Field(
        ...,
        description="Timestamp of when the request was made"
    )
    container_id: str = Field(
        ..., 
        alias="containerId",
        description="ID of the container to place the item in"
    )
    position: Position = Field(
        ...,
        description="Position where to place the item in the container"
    )
    
    class Config:
        """Pydantic model configuration."""
        populate_by_name = True
        validate_by_name = True


class BatchPlaceItemRequest(BaseModel):
    """
    Model for placing multiple items in containers.
    
    Contains a list of item placement requests to process in batch.
    """
    items: List[PlaceItemRequest] = Field(
        ...,
        description="List of item placement requests"
    )
    
    class Config:
        """Pydantic model configuration."""
        populate_by_name = True
        validate_by_name = True