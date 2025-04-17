from typing import List, Dict, Optional, Tuple
from app.models.items import Item
from app.models.container import Container, Dimensions
from app.utils.binpacking import find_position_for_item, BinPacker

class OptimizedReturnService:
    """
    Service for managing the return and waste handling process.
    
    Provides functionality to move waste items to a dedicated waste container
    and manage waste return operations using an optimized greedy knapsack approach.
    """
    
    def __init__(self, containers: List[Container]):
        """
        Initialize the return service with available containers.
        
        Args:
            containers: List of available containers in the system
        """
        # Create dictionary for efficient container lookup
        self.containers: Dict[str, Container] = {c.container_id: c for c in containers}
        
        # Initialize waste container if not present
        if "waste" not in self.containers:
            waste_dimensions = Dimensions(width=1000.0, depth=1000.0, height=1000.0)
            self.containers["waste"] = Container(
                container_id="waste", 
                zone="Waste Zone", 
                dimensions=waste_dimensions,
                occupied_volume=0.0,
                items=[]
            )
            
        # Store reference to waste container for convenience
        self.waste_container: Container = self.containers["waste"]

    def move_waste_to_return_container(self) -> List[Item]:
        """
        Move all items marked as waste to the waste container.
        
        Returns:
            List of items that were moved to the waste container
        """
        moved_items: List[Item] = []
        
        # Process all containers except the waste container
        for container_id, container in list(self.containers.items()):
            if container_id == "waste":
                continue
                
            remaining_items = []
            container_moved_items = []
            
            # Separate waste items from regular items
            for item in container.items:
                if item.is_waste:
                    # Update item's container reference
                    item.container_id = "waste"
                    self.waste_container.items.append(item)
                    container_moved_items.append(item)
                    moved_items.append(item)
                else:
                    remaining_items.append(item)

            # If items were moved, update the container
            if container_moved_items:
                container.items = remaining_items
                
                # Recalculate occupied volume
                self._recalculate_container_volume(container)
                self._recalculate_container_volume(self.waste_container)
        
        return moved_items

    def create_return_plan(self, undocking_container_id: str, max_weight: float) -> Dict:
        """
        Create an optimized return plan for waste items using a greedy knapsack approach.
        
        Args:
            undocking_container_id: ID of the container to use for return
            max_weight: Maximum weight allowed for the return container
            
        Returns:
            Dictionary with return plan details
        """
        # Get or create the undocking container
        if undocking_container_id not in self.containers:
            raise ValueError(f"Container {undocking_container_id} not found")
            
        undocking_container = self.containers[undocking_container_id]
        
        # Reset the undocking container
        undocking_container.items = []
        undocking_container.occupied_volume = 0.0
        
        # Sort waste items by mass-to-volume ratio (descending)
        # This implements a greedy approach to maximize mass utilization
        sorted_waste_items = sorted(
            self.waste_container.items,
            key=lambda item: item.mass / (item.dimensions.width * item.dimensions.depth * item.dimensions.height),
            reverse=True
        )
        
        # Initialize container for bin packing
        packer = BinPacker(undocking_container)
        
        # Pack items into the undocking container
        placed_items = []
        total_mass = 0.0
        
        for item in sorted_waste_items:
            # Check weight constraint
            if total_mass + item.mass <= max_weight:
                # Try to place the item
                if packer.place_item(item):
                    # Update item reference
                    item.container_id = undocking_container_id
                    placed_items.append(item)
                    total_mass += item.mass
                    
                    # Remove from waste container
                    self.waste_container.items.remove(item)
        
        # Update container with placed items
        undocking_container.items = placed_items
        
        # Recalculate volumes
        self._recalculate_container_volume(undocking_container)
        self._recalculate_container_volume(self.waste_container)
        
        # Calculate volume utilization
        total_volume = undocking_container.dimensions.width * undocking_container.dimensions.depth * undocking_container.dimensions.height
        volume_utilization = (undocking_container.occupied_volume / total_volume) * 100 if total_volume > 0 else 0
        
        # Create return plan
        return {
            "container_id": undocking_container_id,
            "placed_items": placed_items,
            "total_mass": total_mass,
            "volume_utilization": volume_utilization,
            "plan_valid": True
        }

    def show_waste_contents(self) -> List[Item]:
        """
        Get all items currently in the waste container.
        
        Returns:
            List of waste items
        """
        return self.waste_container.items

    def clear_waste(self) -> int:
        """
        Remove all items from the waste container.
        
        Returns:
            Number of items removed
        """
        count = len(self.waste_container.items)
        self.waste_container.items.clear()
        self.waste_container.occupied_volume = 0.0
        return count
        
    def _recalculate_container_volume(self, container: Container) -> None:
        """
        Recalculate the occupied volume of a container based on its items.
        
        Args:
            container: Container to update
        """
        total_volume = 0.0
        for item in container.items:
            if hasattr(item, 'calculate_volume'):
                total_volume += item.calculate_volume()
            elif hasattr(item, 'dimensions'):
                # Fallback if calculate_volume method is not available
                dims = item.dimensions
                total_volume += dims.width * dims.depth * dims.height
                
        container.occupied_volume = total_volume
