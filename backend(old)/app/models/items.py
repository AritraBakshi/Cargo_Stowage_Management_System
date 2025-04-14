from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime
from .container import Dimensions


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
    usage_limit: int
    usage_count: int = 0
    preferred_zone: str
    container_id: Optional[str] = None
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
    #Model for creating an item
    item_id: str
    name: str
    width: float
    depth: float
    height: float
    mass: float
    priority: int
    expiry_date: Optional[str] = None
    usage_limit: int
    preferred_zone: str