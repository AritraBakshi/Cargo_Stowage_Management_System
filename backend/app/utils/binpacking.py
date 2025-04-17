from app.models.items import Item, Position
from app.models.container import Container, Dimensions
from typing import Optional, List, Tuple, Dict, Set
from dataclasses import dataclass
from collections import defaultdict

@dataclass
class CornerPoint:
    """Represents a corner point in 3D space with available dimensions."""
    x: float
    y: float
    z: float
    width: float
    depth: float
    height: float

class BinPacker:
    """Optimized 3D bin packing algorithm using skyline and corner point placement."""
    
    def __init__(self, container: Container):
        """Initialize the bin packer with a container.
        
        Args:
            container: The container to pack items into
        """
        self.container = container
        self.occupied_positions: List[Position] = []
        self.skyline: List[CornerPoint] = [
            CornerPoint(0, 0, 0, 
                       container.dimensions.width,
                       container.dimensions.depth,
                       container.dimensions.height)
        ]

    def get_corner_points(self) -> List[CornerPoint]:
        """Get valid corner points for placement based on current skyline.
        
        Returns:
            List of valid corner points where items can be placed
        """
        corner_points = []
        for point in self.skyline:
            # Add points at each corner of the skyline
            if point.x < self.container.dimensions.width:
                corner_points.append(CornerPoint(
                    x=point.x + point.width,
                    y=point.y,
                    z=point.z,
                    width=self.container.dimensions.width - (point.x + point.width),
                    depth=point.depth,
                    height=point.height
                ))
            if point.y < self.container.dimensions.depth:
                corner_points.append(CornerPoint(
                    x=point.x,
                    y=point.y + point.depth,
                    z=point.z,
                    width=point.width,
                    depth=self.container.dimensions.depth - (point.y + point.depth),
                    height=point.height
                ))
        return corner_points

    def get_limited_rotations(self, item: Item) -> List[Dimensions]:
        """Get only the most sensible rotations for an item.
        
        Args:
            item: The item to get rotations for
            
        Returns:
            List of valid dimension rotations
        """
        dims = item.dimensions
        # Only return rotations that make sense (height should be vertical)
        return [
            Dimensions(width=dims.width, depth=dims.depth, height=dims.height),
            Dimensions(width=dims.depth, depth=dims.width, height=dims.height)
        ]

    def fits_at_position(self, item: Item, point: CornerPoint, rotation: Dimensions) -> bool:
        """Check if item fits at given position with given rotation.
        
        Args:
            item: The item to check
            point: The corner point to check
            rotation: The rotation to check
            
        Returns:
            True if the item fits at the position
        """
        # Check container boundaries
        if (point.x + rotation.width > self.container.dimensions.width or
            point.y + rotation.depth > self.container.dimensions.depth or
            point.z + rotation.height > self.container.dimensions.height):
            return False

        # Create position for the item
        new_pos = Position(
            start_coordinates=Dimensions(x=point.x, y=point.y, z=point.z),
            end_coordinates=Dimensions(
                x=point.x + rotation.width,
                y=point.y + rotation.depth,
                z=point.z + rotation.height
            )
        )

        # Check for overlaps with existing items
        return not any(overlaps(new_pos, pos) for pos in self.occupied_positions)

    def update_skyline(self, position: Position) -> None:
        """Update the skyline after placing an item.
        
        Args:
            position: The position of the newly placed item
        """
        self.skyline = []
        # Sort occupied positions by z-coordinate
        sorted_positions = sorted(self.occupied_positions, 
                                key=lambda p: p.start_coordinates.z)
        
        # Create new skyline points
        for pos in sorted_positions:
            self.skyline.append(CornerPoint(
                x=pos.start_coordinates.x,
                y=pos.start_coordinates.y,
                z=pos.end_coordinates.z,
                width=pos.end_coordinates.width - pos.start_coordinates.width,
                depth=pos.end_coordinates.depth - pos.start_coordinates.depth,
                height=self.container.dimensions.height - pos.end_coordinates.z
            ))

    def place_item(self, item: Item) -> bool:
        """Try to place an item using the optimized algorithm.
        
        Args:
            item: The item to place
            
        Returns:
            True if the item was placed successfully
        """
        corner_points = self.get_corner_points()
        rotations = self.get_limited_rotations(item)

        for point in corner_points:
            for rotation in rotations:
                if self.fits_at_position(item, point, rotation):
                    # Place the item
                    item.position = Position(
                        start_coordinates=Dimensions(
                            x=point.x,
                            y=point.y,
                            z=point.z
                        ),
                        end_coordinates=Dimensions(
                            x=point.x + rotation.width,
                            y=point.y + rotation.depth,
                            z=point.z + rotation.height
                        )
                    )
                    item.dimensions = rotation
                    self.occupied_positions.append(item.position)
                    self.update_skyline(item.position)
                    return True
        return False

def overlaps(p1: Position, p2: Position) -> bool:
    """Check if two positions overlap in 3D space.
    
    Args:
        p1: First position
        p2: Second position
        
    Returns:
        True if the positions overlap
    """
    return not (
        p1.end_coordinates.width <= p2.start_coordinates.width or
        p1.start_coordinates.width >= p2.end_coordinates.width or
        p1.end_coordinates.depth <= p2.start_coordinates.depth or
        p1.start_coordinates.depth >= p2.end_coordinates.depth or
        p1.end_coordinates.height <= p2.start_coordinates.height or
        p1.start_coordinates.height >= p2.end_coordinates.height
    )

def find_position_for_item(item: Item, container: Container) -> Optional[Position]:
    """Find a valid position for placing an item in a container using optimized binpacking.
    
    Uses corner point-based 3D bin packing algorithm for efficient placement.
    
    Args:
        item: Item to be placed
        container: Container to place the item in
        
    Returns:
        Position object if a valid position is found, None otherwise
    """
    packer = BinPacker(container)
    
    # Add existing items to the packer
    for existing_item in container.items:
        if existing_item.position:
            packer.occupied_positions.append(existing_item.position)
    
    # Try to place the item
    if packer.place_item(item):
        return item.position
    
    return None

def repack_items_in_container(container: Container) -> None:
    """Repack items in container using optimized algorithm.
    
    Args:
        container: The container to repack items in
    """
    packer = BinPacker(container)
    
    # Sort items by priority and volume (descending)
    items = sorted(
        container.items,
        key=lambda item: (
            -item.priority,
            -(item.dimensions.width * item.dimensions.depth * item.dimensions.height)
        )
    )
    
    # Try to place each item
    repacked_items = []
    for item in items:
        if packer.place_item(item):
            repacked_items.append(item)
    
    container.items = repacked_items
