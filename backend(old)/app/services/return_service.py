from typing import List
from app.models.items import Item
from app.models.container import Container
from app.utils import binpacking2  # Import your packing logic

class ReturnService:
    def __init__(self, containers: List[Container]):
        self.containers = {c.container_id: c for c in containers}
        if "waste" not in self.containers:
            self.containers["waste"] = Container(container_id="waste", zone="Waste Zone", dimensions=(1000, 1000, 1000))
        self.waste_container = self.containers["waste"]

    def move_waste_to_return_container(self):
        for container_id, container in list(self.containers.items()):
            if container_id == "waste":
                continue
            remaining_items = []
            removed_items = []
            for item in container.items:
                if item.is_waste:
                    self.waste_container.items.append(item)
                    removed_items.append(item)
                else:
                    remaining_items.append(item)

            if removed_items:
                container.items = remaining_items
                binpacking2.repack_items_in_container(container)  # Rearrange remaining items

    def show_waste_contents(self) -> List[Item]:
        return self.waste_container.items

    def clear_waste(self):
        self.waste_container.items.clear()
