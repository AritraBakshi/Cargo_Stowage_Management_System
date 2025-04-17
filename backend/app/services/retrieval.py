from typing import List, Tuple, Set, Dict, Optional
from app.models.items import Item, Position
from app.models.container import Container, Dimensions
from fastapi import HTTPException
from collections import deque
from dataclasses import dataclass
from enum import Enum, auto

class Direction(Enum):
    """Represents the six possible directions in 3D space."""
    FRONT = auto()
    BACK = auto()
    LEFT = auto()
    RIGHT = auto()
    UP = auto()
    DOWN = auto()

@dataclass
class BlockingItem:
    """Represents an item that is blocking another item's retrieval."""
    item: Item
    direction: Direction
    distance: float

class OptimizedRetrievalService:
    """Service for retrieving items from containers using optimized path planning."""

    def __init__(self, containers: List[Container]):
        """Initialize the retrieval service.
        
        Args:
            containers: List of containers to manage
        """
        self.containers: Dict[str, Container] = {
            c.container_id: c for c in containers
        }

    def get_blocking_items(self, target: Item, container: Container) -> List[BlockingItem]:
        """Find items blocking the target item with their relative positions.
        
        Args:
            target: The item to retrieve
            container: The container containing the item
            
        Returns:
            List of items blocking the target item
        """
        blocking_items = []
        target_pos = target["position"]
        
        for other in container.items:
            if other["item_id"] == target["item_id"]:
                continue
                
            other_pos = other["position"]
            
            # Check each direction for blocking items
            for direction in Direction:
                if self._is_blocking_in_direction(target_pos, other_pos, direction):
                    distance = self._calculate_distance(target_pos, other_pos, direction)
                    blocking_items.append(BlockingItem(other, direction, distance))
                    
        return blocking_items

    def _calculate_distance(self, pos1: dict, pos2: dict, direction: Direction) -> float:
        """Calculate the distance between two positions in a given direction.
        
        Args:
            pos1: First position
            pos2: Second position
            direction: Direction to calculate distance in
            
        Returns:
            Distance between positions
        """
        if direction == Direction.FRONT:
            return pos1["start_coordinates"]["depth"] - pos2["end_coordinates"]["depth"]
        elif direction == Direction.BACK:
            return pos2["start_coordinates"]["depth"] - pos1["end_coordinates"]["depth"]
        elif direction == Direction.LEFT:
            return pos1["start_coordinates"]["width"] - pos2["end_coordinates"]["width"]
        elif direction == Direction.RIGHT:
            return pos2["start_coordinates"]["width"] - pos1["end_coordinates"]["width"]
        elif direction == Direction.UP:
            return pos1["start_coordinates"]["height"] - pos2["end_coordinates"]["height"]
        else:  # DOWN
            return pos2["start_coordinates"]["height"] - pos1["end_coordinates"]["height"]

    def _is_blocking_in_direction(self, target_pos: dict, other_pos: dict, direction: Direction) -> bool:
        """Check if an item is blocking in a specific direction.
        
        Args:
            target_pos: Position of target item
            other_pos: Position of potentially blocking item
            direction: Direction to check
            
        Returns:
            True if the item is blocking in the given direction
        """
        if direction == Direction.FRONT:
            return (other_pos["start_coordinates"]["depth"] < target_pos["start_coordinates"]["depth"] and
                   self._overlaps_in_plane(target_pos, other_pos, "width", "height"))
        elif direction == Direction.BACK:
            return (other_pos["start_coordinates"]["depth"] > target_pos["end_coordinates"]["depth"] and
                   self._overlaps_in_plane(target_pos, other_pos, "width", "height"))
        elif direction == Direction.LEFT:
            return (other_pos["start_coordinates"]["width"] < target_pos["start_coordinates"]["width"] and
                   self._overlaps_in_plane(target_pos, other_pos, "depth", "height"))
        elif direction == Direction.RIGHT:
            return (other_pos["start_coordinates"]["width"] > target_pos["end_coordinates"]["width"] and
                   self._overlaps_in_plane(target_pos, other_pos, "depth", "height"))
        elif direction == Direction.UP:
            return (other_pos["start_coordinates"]["height"] < target_pos["start_coordinates"]["height"] and
                   self._overlaps_in_plane(target_pos, other_pos, "width", "depth"))
        else:  # DOWN
            return (other_pos["start_coordinates"]["height"] > target_pos["end_coordinates"]["height"] and
                   self._overlaps_in_plane(target_pos, other_pos, "width", "depth"))

    @staticmethod
    def _overlaps_in_plane(pos1: dict, pos2: dict, dim1: str, dim2: str) -> bool:
        """Check if two positions overlap in a 2D plane.
        
        Args:
            pos1: First position
            pos2: Second position
            dim1: First dimension to check
            dim2: Second dimension to check
            
        Returns:
            True if the positions overlap in the plane
        """
        return not (
            pos1["end_coordinates"][dim1] <= pos2["start_coordinates"][dim1] or
            pos1["start_coordinates"][dim1] >= pos2["end_coordinates"][dim1] or
            pos1["end_coordinates"][dim2] <= pos2["start_coordinates"][dim2] or
            pos1["start_coordinates"][dim2] >= pos2["end_coordinates"][dim2]
        )

    def find_optimal_path(self, target: Item, container: Container) -> List[str]:
        """Find optimal path to retrieve target item using A* inspired approach.
        
        Args:
            target: The item to retrieve
            container: The container containing the item
            
        Returns:
            List of item IDs to move in optimal order
        """
        blocking_items = self.get_blocking_items(target, container)
        
        # Sort blocking items by distance and priority
        blocking_items.sort(key=lambda x: (x.distance, -x.item["priority"]))
        
        # Create dependency graph
        dependency_graph = self._build_dependency_graph(blocking_items)
        
        # Get items to move in optimal order
        return self._get_ordered_moves(dependency_graph)

    def _build_dependency_graph(self, blocking_items: List[BlockingItem]) -> Dict[str, Set[str]]:
        """Build a graph of item dependencies.
        
        Args:
            blocking_items: List of blocking items
            
        Returns:
            Dictionary mapping item IDs to sets of dependent item IDs
        """
        graph: Dict[str, Set[str]] = {}
        for item in blocking_items:
            graph[item.item["item_id"]] = set()
            for other in blocking_items:
                if item.item["item_id"] != other.item["item_id"]:
                    if self._items_dependent(item, other):
                        graph[item.item["item_id"]].add(other.item["item_id"])
        return graph

    def _items_dependent(self, item1: BlockingItem, item2: BlockingItem) -> bool:
        """Check if two items have a dependency relationship.
        
        Args:
            item1: First item
            item2: Second item
            
        Returns:
            True if item2 blocks item1's movement
        """
        pos1 = item1.item["position"]
        pos2 = item2.item["position"]
        
        # Check if item2 blocks item1's movement in its direction
        if item1.direction == Direction.FRONT:
            return pos2["start_coordinates"]["depth"] < pos1["start_coordinates"]["depth"]
        elif item1.direction == Direction.BACK:
            return pos2["start_coordinates"]["depth"] > pos1["end_coordinates"]["depth"]
        elif item1.direction == Direction.LEFT:
            return pos2["start_coordinates"]["width"] < pos1["start_coordinates"]["width"]
        elif item1.direction == Direction.RIGHT:
            return pos2["start_coordinates"]["width"] > pos1["end_coordinates"]["width"]
        elif item1.direction == Direction.UP:
            return pos2["start_coordinates"]["height"] < pos1["start_coordinates"]["height"]
        else:  # DOWN
            return pos2["start_coordinates"]["height"] > pos1["end_coordinates"]["height"]

    def _get_ordered_moves(self, dependency_graph: Dict[str, Set[str]]) -> List[str]:
        """Get items to move in optimal order using topological sort.
        
        Args:
            dependency_graph: Graph of item dependencies
            
        Returns:
            List of item IDs in optimal move order
        """
        visited: Set[str] = set()
        temp: Set[str] = set()
        order: List[str] = []
        
        def visit(item_id: str) -> None:
            """Visit a node in the dependency graph."""
            if item_id in temp:
                raise HTTPException(
                    status_code=500,
                    detail="Circular dependency detected in item movement"
                )
            if item_id in visited:
                return
                
            temp.add(item_id)
            for dep in dependency_graph.get(item_id, set()):
                visit(dep)
            temp.remove(item_id)
            visited.add(item_id)
            order.append(item_id)
            
        for item_id in dependency_graph:
            if item_id not in visited:
                visit(item_id)
                
        return order

    def retrieve_item(self, item_id: str) -> Item:
        """Retrieve an item using the optimized path planning approach.
        
        Args:
            item_id: ID of the item to retrieve
            
        Returns:
            The retrieved item
            
        Raises:
            HTTPException: If item is not found or retrieval fails
        """
        # Find container and item
        container, item = self._find_item(item_id)
        if not container or not item:
            raise HTTPException(
                status_code=404,
                detail=f"Item {item_id} not found"
            )
            
        # Find optimal path to retrieve item
        items_to_move = self.find_optimal_path(item, container)
        
        # Temporarily remove items in optimal order
        temp_storage = []
        for move_item_id in items_to_move:
            move_item = next(i for i in container.items if i["item_id"] == move_item_id)
            container.items.remove(move_item)
            temp_storage.append(move_item)
        
        # Remove target item
        container.items.remove(item)
        
        # Replace items in reverse order
        for move_item in reversed(temp_storage):
            container.items.append(move_item)
        
        # Update usage count
        item["usage_limit"] = int(item["usage_limit"]) - 1
        return item

    def _find_item(self, item_id: str) -> Tuple[Optional[Container], Optional[Item]]:
        """Find a container and item by item ID.
        
        Args:
            item_id: ID of the item to find
            
        Returns:
            Tuple of (container, item) if found, (None, None) otherwise
        """
        for container in self.containers.values():
            for item in container.items:
                if item["item_id"] == item_id:
                    return container, item
        return None, None
