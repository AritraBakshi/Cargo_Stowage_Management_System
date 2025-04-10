# models/log.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional,Dict, Any

class LogModel(BaseModel):
    timestamp: datetime
    userId: Optional[str] = None
    actionType: str  # "placement", "retrieval", etc.
    itemId: str
    details: Dict[str, Any] 
