from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional
from datetime import datetime


class Dimensions(BaseModel):
    """Represents the dimensions of a 3D object."""
    width: float = Field(..., gt=0, description="Width of the object")
    depth: float = Field(..., gt=0, description="Depth of the object")
    height: float = Field(..., gt=0, description="Height of the object")

    @validator('width', 'depth', 'height')
    def validate_dimensions(cls, v):
        """Validate that dimensions are positive and within reasonable limits."""
        if v <= 0:
            raise ValueError("Dimensions must be positive")
        if v > 1000:  # Reasonable maximum size in meters
            raise ValueError("Dimension exceeds maximum allowed size")
        return v
    
class Container(BaseModel):
    """Represents a container for storing items."""
    container_id: str = Field(..., description="Unique identifier for the container")
    zone: str = Field(..., description="Zone where the container is located")
    dimensions: Dimensions = Field(..., description="Dimensions of the container")
    occupied_volume: float = Field(0.0, ge=0, description="Volume occupied by items")
    items: List[Dict] = Field(default_factory=list, description="Items stored in the container")

    @validator('occupied_volume')
    def validate_occupied_volume(cls, v, values):
        """Validate that occupied volume doesn't exceed total volume."""
        if 'dimensions' in values:
            total_volume = values['dimensions'].width * values['dimensions'].depth * values['dimensions'].height
            if v > total_volume:
                raise ValueError("Occupied volume cannot exceed total volume")
        return v

    def calculate_total_volume(self) -> float:
        """Calculate the total volume of the container.
        
        Returns:
            Total volume in cubic units
        """
        return self.dimensions.width * self.dimensions.depth * self.dimensions.height

    def get_available_volume(self) -> float:
        """Calculate the available volume in the container.
        
        Returns:
            Available volume in cubic units
        """
        return self.calculate_total_volume() - self.occupied_volume

    def update_occupied_volume(self) -> None:
        """Update the occupied volume based on current items."""
        self.occupied_volume = sum(
            item.get('dimensions', {}).get('width', 0) *
            item.get('dimensions', {}).get('depth', 0) *
            item.get('dimensions', {}).get('height', 0)
            for item in self.items
        )
    
class ContainerData(BaseModel):
    """Data transfer object for container information."""
    container_id: str = Field(..., description="Unique identifier for the container")
    zone: str = Field(..., description="Zone where the container is located")
    width: float = Field(..., gt=0, description="Width of the container")
    depth: float = Field(..., gt=0, description="Depth of the container")
    height: float = Field(..., gt=0, description="Height of the container")


class ContainerRequest(BaseModel):
    """Request model for container operations."""
    container_id: str = Field(..., alias="containerId", description="Unique identifier for the container")
    zone: str = Field(..., description="Zone where the container is located")
    width: float = Field(..., gt=0, description="Width of the container")
    depth: float = Field(..., gt=0, description="Depth of the container")
    height: float = Field(..., gt=0, description="Height of the container")

    class Config:
        """Pydantic model configuration."""
        populate_by_name = True
        validate_by_name = True
