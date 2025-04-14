from typing import List, Tuple
from app.models.items import Item
from app.models.container import Container, Dimensions, Position
from fastapi import HTTPException

class RetrievalService:
    def __init__(self, containers: List[Container]):
        self.containers = {c.container_id: c for c in containers}

    def is_accessible(self, item: Item, container: Container) -> bool:
        # Check if an item is directly retrievable (not obstructed)
        for other_item in container.items:
            if other_item.item_id != item.item_id:
                if self.is_blocking(item, other_item):
                    return False
        return True

    def is_blocking(self, target: Item, other: Item) -> bool:
        # Simplified: Blocking means in front along depth and overlaps in width/height
        t_start = target.position.start_coordinates
        t_end = target.position.end_coordinates
        o_start = other.position.start_coordinates
        o_end = other.position.end_coordinates

        return (
            o_start.depth < t_start.depth and
            not (o_end.width <= t_start.width or o_start.width >= t_end.width) and
            not (o_end.height <= t_start.height or o_start.height >= t_end.height)
        )

    def rearrange_to_retrieve(self, container: Container, target_item: Item) -> Tuple[List[Item], Item]:
        # Temporarily remove blocking items
        blocking_items = [item for item in container.items if self.is_blocking(target_item, item)]
        for blocking_item in blocking_items:
            container.items.remove(blocking_item)

        # Remove target item
        container.items.remove(target_item)

        # Try to reinsert blocking items (naive placement at origin + offset)
        reinserted = []
        for item in blocking_items:
            placed = False
            offset = 1.0  # Move slightly forward in depth for new position
            for z in range(0, int(container.dimensions.depth), int(item.dimensions.depth + offset)):
                new_start = Dimensions(0, z, 0)
                new_end = Dimensions(
                    new_start.width + item.dimensions.width,
                    new_start.depth + item.dimensions.depth,
                    new_start.height + item.dimensions.height
                )
                position = Position(start_coordinates=new_start, end_coordinates=new_end)

                item.position = position
                container.items.append(item)
                placed = True
                break

            if placed:
                reinserted.append(item)
            else:
                raise HTTPException(status_code=500, detail=f"Re-insertion failed for item {item.item_id}.")

        return reinserted, target_item

    def retrieve_item(self, item_id: str) -> Item:
        for container in self.containers.values():
            for item in container.items:
                if item.item_id == item_id:
                    if self.is_accessible(item, container):
                        container.items.remove(item)
                        return item
                    else:
                        _, retrieved = self.rearrange_to_retrieve(container, item)
                        return retrieved

        raise HTTPException(status_code=404, detail="Item not found.")
