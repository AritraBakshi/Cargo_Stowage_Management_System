from typing import List
from app.models.items import Item, Position
from app.models.container import Container, Dimensions
from app.utils.binpacking import find_position_for_item

class PlacementService:
    def place_item(self, item: Item, containers: List[Container]) -> Item:
        # Sort containers by available volume and preferred zone
        sorted_containers = sorted(
            containers,
            key=lambda c: (c.zone != item.preferred_zone, -c.get_avail_vol())
        )

        for container in sorted_containers:
            if not item.will_cont_fit(container):
                continue

            # Try to find a valid position with 3D binpacking logic
            position = find_position_for_item(item, container)
            if position:
                item.container_id = container.container_id
                item.position = position
                container.occupied_volume += item.cal_vol()
                return item

        raise ValueError("No valid container found for item.")
