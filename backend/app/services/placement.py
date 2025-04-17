from typing import List, Optional
from app.models.items import Item, Position
from app.models.container import Container, Dimensions
from app.utils.binpacking import find_position_for_item


class OptimizedPlacementService:
    """
    Service for managing item placement in containers with optimized algorithms.
    
    Provides functionality to place items in suitable containers
    based on available space, preferred zones, and other criteria
    using corner-point placement optimization.
    """
    
    def place_item(self, item: Item, containers: List[Container]) -> Optional[Item]:
        """
        Place an item in the most suitable container using optimized bin packing.
        
        Args:
            item: Item to be placed
            containers: List of available containers
            
        Returns:
            Updated item with container and position information, or None if 
            placement failed
            
        Raises:
            ValueError: If no suitable container is found
        """
        # Sort containers by preferred zone match and available volume
        sorted_containers = sorted(
            containers,
            key=lambda c: (
                c.zone != item.preferred_zone,  # Preferred zone first
                -c.get_available_volume()       # Then by available volume (descending)
            )
        )

        for container in sorted_containers:
            # Skip containers that don't have enough space
            if not item.will_fit_in_container(container):
                continue

            # Try to find a valid position with optimized 3D binpacking logic
            position = find_position_for_item(item, container)
            if position:
                # Update item with placement information
                item.container_id = container.container_id
                item.position = position
                
                # Update container's occupied volume
                container.occupied_volume += item.calculate_volume()
                
                # Add item to container items list
                container.items.append(item)
                return item

        # No suitable container found
        raise ValueError(f"No valid container found for item {item.item_id}.")
