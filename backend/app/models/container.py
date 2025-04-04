from pydantic import BaseModel
from typing import List

class Container(BaseModel):
    id: int
    name: str
    items: List[int]
