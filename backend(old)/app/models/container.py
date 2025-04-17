from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime


class Dimensions(BaseModel):
    width: float
    depth: float
    height: float
    
class Container(BaseModel):
    container_id: str
    zone: str
    dimensions: Dimensions
    occupied_volume: float = 0.0

    def cal_total_vol(self) -> float:
        return self.dimensions.width * self.dimensions.depth * self.dimensions.height
    
    def get_avail_vol(self) -> float:
        total_volume = self.dimensions.width * self.dimensions.depth * self.dimensions.height
        return total_volume - self.occupied_volume
    
class ContainerData(BaseModel):
    container_id: str
    zone: str
    width: float
    depth: float
    height: float