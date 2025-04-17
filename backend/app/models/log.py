# models/log.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any


class LogModel(BaseModel):
    """
    Model representing a log entry for system actions.
    
    Used to track and audit user actions and system events.
    """
    timestamp: datetime = Field(
        ..., 
        description="The time when the action occurred"
    )
    user_id: Optional[str] = Field(
        None, 
        alias="userId", 
        description="ID of the user who performed the action"
    )
    action_type: str = Field(
        ..., 
        alias="actionType", 
        description="Type of action performed (e.g., 'placement', 'retrieval')"
    )
    item_id: str = Field(
        ..., 
        alias="itemId", 
        description="ID of the item involved in the action"
    )
    details: Dict[str, Any] = Field(
        ..., 
        description="Additional details about the action"
    )
    
    class Config:
        """Pydantic model configuration."""
        populate_by_name = True
        validate_by_name = True 
