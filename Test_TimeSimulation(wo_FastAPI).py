from datetime import datetime, timedelta
from typing import List
from copy import deepcopy

# Mock Models
class Item:
    def __init__(self, item_id, name, usage_limit, usage_count, expiry_date):
        self.item_id = item_id
        self.name = name
        self.usage_limit = usage_limit
        self.usage_count = usage_count
        self.expiry_date = expiry_date  # datetime object
        self.is_waste = False

class Container:
    def __init__(self, container_id, items):
        self.container_id = container_id
        self.items = items  # List[Item]

# Fake Data Setup
now = datetime.now()
items = [
    Item("item001", "Food Pack", usage_limit=5, usage_count=2, expiry_date=now + timedelta(days=2)),
    Item("item002", "Oxygen Tank", usage_limit=2, usage_count=2, expiry_date=now + timedelta(days=5)),
    Item("item003", "Tool Kit", usage_limit=10, usage_count=1, expiry_date=now + timedelta(days=10))
]
containers = [
    Container("container001", deepcopy(items))
]

# Time Simulation Logic
def simulate_time(containers: List[Container], current_date: datetime, days_to_simulate: int, items_to_use_per_day: List[str]):
    result = {
        "success": True,
        "newDate": (current_date + timedelta(days=days_to_simulate)).isoformat(),
        "changes": {
            "itemsUsed": [],
            "itemsExpired": [],
            "itemsDepletedToday": []
        }
    }

    temp_containers = deepcopy(containers)  # Don't affect real data
    for day in range(days_to_simulate):
        current_day = current_date + timedelta(days=day + 1)

        for container in temp_containers:
            for item in container.items:
                # Mark expired items
                if item.expiry_date and item.expiry_date < current_day and not item.is_waste:
                    item.is_waste = True
                    result["changes"]["itemsExpired"].append({"itemId": item.item_id, "name": item.name})

                # Use items if listed
                if item.item_id in items_to_use_per_day and not item.is_waste:
                    if item.usage_count < item.usage_limit:
                        item.usage_count += 1
                        result["changes"]["itemsUsed"].append({
                            "itemId": item.item_id,
                            "name": item.name,
                            "remainingUses": item.usage_limit - item.usage_count
                        })

                    if item.usage_count >= item.usage_limit:
                        item.is_waste = True
                        result["changes"]["itemsDepletedToday"].append({"itemId": item.item_id, "name": item.name})

    return result

# Run Test Simulation
output = simulate_time(
    containers=containers,
    current_date=datetime.now(),
    days_to_simulate=3,
    items_to_use_per_day=["item001", "item002"]
)

import json
print(json.dumps(output, indent=4))



#output:
'''
{
    "success": true,
    "newDate": "2025-04-17T18:49:25.116397",
    "changes": {
        "itemsUsed": [
            {
                "itemId": "item001",
                "name": "Food Pack",
                "remainingUses": 2
            }
        ],
        "itemsExpired": [
            {
                "itemId": "item001",
                "name": "Food Pack"
            }
        ],
        "itemsDepletedToday": [
            {
                "itemId": "item002",
                "name": "Oxygen Tank"
            }
        ]
    }
}
'''
