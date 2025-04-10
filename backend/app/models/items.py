from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime
from .container import Dimensions,ContainerRequest


class ItemRetrieveRequest(BaseModel):
    itemId: str
    userId: Optional[str] =None
    timestamp: Optional[datetime] = None  # Accepts ISO format timestamps

class Position(BaseModel):
    #Position of an item within a container
    start_coordinates: Dimensions
    end_coordinates: Dimensions


class Item(BaseModel):
    item_id: str
    name: str
    dimensions: Dimensions
    mass: float
    priority: int
    expiry_date: Optional[datetime] = None
    usage_limit: Optional[int]
    usage_count: int = 0
    preferred_zone: str
    container_id: Optional[str] = None
    # container_id: str
    position: Optional[Position] = None
    is_waste: bool = False
    waste_reason: Optional[str] = None
    
    def cal_vol(self) -> float:
        return self.dimensions.width * self.dimensions.depth * self.dimensions.height
    
    def will_cont_fit(self, container) -> bool:
        item_volume = self.cal_vol()
        available_volume = container.get_avail_vol()
        return item_volume <= available_volume


class ItemInDB(Item):
    #Item model as stored in the database
    _id: str


class ItemData(BaseModel):
    item_id: str = Field(..., alias="itemId")
    name: str
    width: float
    depth: float
    height: float
    mass: float
    priority: int
    expiry_date: Optional[str] = None
    usage_limit: Optional[int] = Field(default=None, alias="usageLimit")
    preferred_zone: str = Field(..., alias="preferredZone")

    class Config:
        validate_by_name = True
        populate_by_name = True  # Required for Pydantic v2

class PlacementRequest(BaseModel):
    items: list[ItemData]
    containers: List[ContainerRequest]
