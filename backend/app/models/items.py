from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional
from datetime import datetime
from .container import Dimensions, ContainerRequest


class ItemRetrieveRequest(BaseModel):
    """Request model for retrieving an item."""
    item_id: str = Field(..., alias="itemId", description="Unique identifier of the item to retrieve")
    user_id: Optional[str] = Field(None, alias="userId", description="ID of the user requesting retrieval")
    timestamp: Optional[datetime] = Field(None, description="Timestamp of the retrieval request")


class Position(BaseModel):
    """Represents the position of an item within a container."""
    start_coordinates: Dimensions = Field(..., description="Starting coordinates of the item")
    end_coordinates: Dimensions = Field(..., description="Ending coordinates of the item")

    @validator('end_coordinates')
    def validate_end_coordinates(cls, v, values):
        """Validate that end coordinates are greater than start coordinates."""
        if 'start_coordinates' in values:
            start = values['start_coordinates']
            if v.width <= start.width or v.depth <= start.depth or v.height <= start.height:
                raise ValueError("End coordinates must be greater than start coordinates")
        return v


class Item(BaseModel):
    """Represents an item that can be stored in a container."""
    item_id: str = Field(..., description="Unique identifier of the item")
    name: str = Field(..., description="Name of the item")
    dimensions: Dimensions = Field(..., description="Dimensions of the item")
    mass: float = Field(..., gt=0, description="Mass of the item in kg")
    priority: int = Field(..., ge=0, description="Priority level of the item")
    expiry_date: Optional[datetime] = Field(None, description="Expiry date of the item")
    usage_limit: Optional[int] = Field(None, ge=0, description="Maximum number of times the item can be used")
    usage_count: int = Field(0, ge=0, description="Current usage count of the item")
    preferred_zone: str = Field(..., description="Preferred zone for storing the item")
    container_id: Optional[str] = Field(None, description="ID of the container where the item is stored")
    position: Optional[Position] = Field(None, description="Position of the item within its container")
    is_waste: bool = Field(False, description="Whether the item is marked as waste")
    waste_reason: Optional[str] = Field(None, description="Reason for marking the item as waste")

    @validator('usage_count')
    def validate_usage_count(cls, v, values):
        """Validate that usage count doesn't exceed usage limit."""
        if 'usage_limit' in values and values['usage_limit'] is not None:
            if v > values['usage_limit']:
                raise ValueError("Usage count cannot exceed usage limit")
        return v

    def calculate_volume(self) -> float:
        """Calculate the volume of the item.
        
        Returns:
            Volume in cubic units
        """
        return self.dimensions.width * self.dimensions.depth * self.dimensions.height
    
    def will_fit_in_container(self, container) -> bool:
        """Check if the item will fit in the given container.
        
        Args:
            container: Container to check against
            
        Returns:
            True if item will fit, False otherwise
        """
        item_volume = self.calculate_volume()
        available_volume = container.get_available_volume()
        return item_volume <= available_volume


class ItemInDB(Item):
    """Item model as stored in the database."""
    id: str = Field(..., alias="_id", description="Database ID of the item")


class ItemData(BaseModel):
    """Data transfer object for item information."""
    item_id: str = Field(..., alias="itemId", description="Unique identifier of the item")
    name: str = Field(..., description="Name of the item")
    width: float = Field(..., gt=0, description="Width of the item")
    depth: float = Field(..., gt=0, description="Depth of the item")
    height: float = Field(..., gt=0, description="Height of the item")
    mass: float = Field(..., gt=0, description="Mass of the item in kg")
    priority: int = Field(..., ge=0, description="Priority level of the item")
    expiry_date: Optional[str] = Field(None, description="Expiry date of the item")
    usage_limit: Optional[int] = Field(None, ge=0, alias="usageLimit", description="Maximum number of times the item can be used")
    preferred_zone: str = Field(..., alias="preferredZone", description="Preferred zone for storing the item")

    class Config:
        """Pydantic model configuration."""
        validate_by_name = True
        populate_by_name = True


class PlacementRequest(BaseModel):
    """Request model for placing items in containers."""
    items: List[ItemData] = Field(..., description="List of items to be placed")
    containers: List[ContainerRequest] = Field(..., description="List of containers to place items in")
