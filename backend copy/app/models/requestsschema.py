from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.items import Position

class wasteretunrreq(BaseModel):
    #Model for creating a waste return request
    undockingContainerId: str 
    undockingDate: Optional[datetime] = None
    maxWeight: str 

class PlaceItemRequest(BaseModel):
    itemId: str
    userId: str
    timestamp: datetime
    containerId: str
    position: Position
