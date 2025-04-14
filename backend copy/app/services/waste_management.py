from datetime import datetime
from typing import List
from app.models.items import Item
from app.models.container import Container

class WasteManagementService:
    def __init__(self, containers: List[Container]):
        self.containers = {c.container_id: c for c in containers}

    def mark_as_waste(self, item: Item, reason: str):
        item.is_waste = True
        item.waste_reason = reason

    def dispose_waste(self):
        for container in self.containers.values():
            container.items = [item for item in container.items if not item.is_waste]

    def process_expired_items(self):
        for container in self.containers.values():
            for item in container.items:
                if item.expiry_date and item.expiry_date < datetime.now():
                    self.mark_as_waste(item, "Expired")

    def process_overused_items(self):
        for container in self.containers.values():
            for item in container.items:
                if item.usage_count >= item.usage_limit:
                    self.mark_as_waste(item, "Usage Limit Exceeded")

    def scan_all_waste(self) -> List[Item]:
        waste_items = []
        for container in self.containers.values():
            for item in container.items:
                if item.expiry_date and item.expiry_date < datetime.now():
                    self.mark_as_waste(item, "Expired")
                    waste_items.append(item)
                elif item.usage_count >= item.usage_limit:
                    self.mark_as_waste(item, "Usage Limit Exceeded")
                    waste_items.append(item)
        return waste_items
