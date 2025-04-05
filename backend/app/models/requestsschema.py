from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class wasteretunrreq(BaseModel):
    #Model for creating a waste return request
    undockingContainerId: str 
    undockingDate: Optional[datetime] = None
    maxWeight: str 
