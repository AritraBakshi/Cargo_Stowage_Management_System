from datetime import datetime, timedelta
from typing import List, Optional
from app.models.items import Item
from app.models.container import Container

class TimeSimulator:
    def __init__(self, containers: List[Container]):
        self.containers = containers
        self.current_date = datetime.now()

    def simulate_time_progression(self, num_days: Optional[int], to_timestamp: Optional[str], items_to_use_daily: List[dict]):
        simulated_date = self.current_date
        if to_timestamp:
            simulated_end_date = datetime.fromisoformat(to_timestamp)
            num_days = (simulated_end_date - simulated_date).days
        else:
            simulated_end_date = simulated_date + timedelta(days=num_days or 1)

        used_items = []
        expired_items = []
        depleted_today = []

        for _ in range(num_days):
            simulated_date += timedelta(days=1)
            items_used_today = self._simulate_item_usage(items_to_use_daily)
            used_items.extend(items_used_today)

            for container in self.containers:
                for item in container.items:
                    if item.expiry_date and item.expiry_date < simulated_date:
                        if item not in expired_items:
                            expired_items.append(item)

                    if item.usage_count >= item.usage_limit:
                        if item not in depleted_today:
                            depleted_today.append(item)

        return {
            "success": True,
            "newDate": simulated_date.isoformat(),
            "changes": {
                "itemsUsed": [{"itemId": item.item_id, "name": item.name, "remainingUses": item.usage_limit - item.usage_count} for item in used_items],
                "itemsExpired": [{"itemId": item.item_id, "name": item.name} for item in expired_items],
                "itemsDepletedToday": [{"itemId": item.item_id, "name": item.name} for item in depleted_today],
            }
        }

    def _simulate_item_usage(self, items_to_use):
        used = []
        for container in self.containers:
            for item in container.items:
                for usage_request in items_to_use:
                    if item.item_id == usage_request.get("itemId") or item.name == usage_request.get("name"):
                        if item.usage_count < item.usage_limit:
                            item.usage_count += 1
                            used.append(item)
        return used
