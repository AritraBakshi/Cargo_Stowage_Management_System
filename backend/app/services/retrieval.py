from typing import List
from app.models.items import Item
from app.models.container import Container
from fastapi import HTTPException

class RetrievalService:
    def __init__(self, containers: List[Container]):
        self.containers = {c.container_id: c for c in containers}
    
    def is_accessible(self, item: Item) -> bool:
        # Check if an item is directly retrievable (not obstructed)
        container = self.containers.get(item.container_id)
        if not container:
            return False
        
        for other_item in container.items:
            if other_item.position.start_coordinates.depth < item.position.start_coordinates.depth:
                return False  # Something is blocking the item
        
        return True
    
    def retrieve_item(self, item_id: str) -> Item:
        # Locate item
        for container in self.containers.values():
            for item in container.items:
                if item.item_id == item_id:
                    if self.is_accessible(item):
                        container.items.remove(item)
                        return item
                    else:
                        raise HTTPException(status_code=400, detail="Item is obstructed, needs rearrangement.")
        
        raise HTTPException(status_code=404, detail="Item not found.")
