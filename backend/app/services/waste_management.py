from datetime import datetime
from typing import List, Dict, Set, Optional
from app.models.items import Item
from app.models.container import Container
from dataclasses import dataclass
from queue import PriorityQueue
import heapq

@dataclass
class WasteItem:
    """Represents an item that has been marked as waste."""
    item: Item
    expiry_date: Optional[datetime]
    usage_count: int
    usage_limit: int
    priority: int

class OptimizedWasteManagementService:
    """Service for managing waste items using optimized priority queues."""

    def __init__(self, containers: List[Container]):
        """Initialize the waste management service.
        
        Args:
            containers: List of containers to manage
        """
        self.containers: Dict[str, Container] = {
            c.container_id: c for c in containers
        }
        self.expiry_queue: PriorityQueue = PriorityQueue()
        self.usage_queue: PriorityQueue = PriorityQueue()
        self.waste_items: Set[str] = set()
        self._initialize_queues()

    def _initialize_queues(self) -> None:
        """Initialize priority queues for expiry and usage tracking."""
        for container in self.containers.values():
            for item in container.items:
                if item["item_id"] not in self.waste_items:
                    # Add to expiry queue if item has expiry date
                    if item.get("expiry_date"):
                        heapq.heappush(
                            self.expiry_queue.queue,
                            (item["expiry_date"], item["item_id"], item)
                        )
                    
                    # Add to usage queue
                    usage_remaining = item["usage_limit"] - item["usage_count"]
                    heapq.heappush(
                        self.usage_queue.queue,
                        (usage_remaining, item["item_id"], item)
                    )

    def mark_as_waste(self, item: Item, reason: str) -> None:
        """Mark an item as waste and update tracking.
        
        Args:
            item: The item to mark as waste
            reason: The reason for marking as waste
        """
        item["is_waste"] = True
        item["waste_reason"] = reason
        self.waste_items.add(item["item_id"])
        
        # Remove from queues if present
        self._remove_from_queues(item["item_id"])

    def _remove_from_queues(self, item_id: str) -> None:
        """Remove an item from both priority queues.
        
        Args:
            item_id: ID of the item to remove
        """
        # Remove from expiry queue
        new_expiry_queue = []
        while self.expiry_queue.queue:
            _, id_, item = heapq.heappop(self.expiry_queue.queue)
            if id_ != item_id:
                heapq.heappush(new_expiry_queue, (item["expiry_date"], id_, item))
        self.expiry_queue.queue = new_expiry_queue

        # Remove from usage queue
        new_usage_queue = []
        while self.usage_queue.queue:
            _, id_, item = heapq.heappop(self.usage_queue.queue)
            if id_ != item_id:
                usage_remaining = item["usage_limit"] - item["usage_count"]
                heapq.heappush(new_usage_queue, (usage_remaining, id_, item))
        self.usage_queue.queue = new_usage_queue

    def process_expired_items(self) -> List[Item]:
        """Process expired items using priority queue.
        
        Returns:
            List of items that have expired
        """
        expired_items = []
        current_date = datetime.now()
        
        while self.expiry_queue.queue:
            expiry_date, item_id, item = heapq.heappop(self.expiry_queue.queue)
            if expiry_date > current_date:
                # Put back items that haven't expired yet
                heapq.heappush(self.expiry_queue.queue, (expiry_date, item_id, item))
                break
                
            if item_id not in self.waste_items:
                self.mark_as_waste(item, "Expired")
                expired_items.append(item)
                
        return expired_items

    def process_overused_items(self) -> List[Item]:
        """Process overused items using priority queue.
        
        Returns:
            List of items that have exceeded usage limits
        """
        overused_items = []
        
        while self.usage_queue.queue:
            usage_remaining, item_id, item = heapq.heappop(self.usage_queue.queue)
            if usage_remaining > 0:
                # Put back items that haven't exceeded usage limit
                heapq.heappush(self.usage_queue.queue, (usage_remaining, item_id, item))
                break
                
            if item_id not in self.waste_items:
                self.mark_as_waste(item, "Usage Limit Exceeded")
                overused_items.append(item)
                
        return overused_items

    def scan_all_waste(self) -> List[Item]:
        """Scan for all waste items using optimized queues.
        
        Returns:
            List of all waste items
        """
        waste_items = []
        
        # Process expired items
        waste_items.extend(self.process_expired_items())
        
        # Process overused items
        waste_items.extend(self.process_overused_items())
        
        return waste_items

    def dispose_waste(self) -> None:
        """Remove waste items from containers and update queues."""
        for container in self.containers.values():
            container.items = [
                item for item in container.items 
                if not item.get("is_waste", False)
            ]
            # Update queues after disposal
            self._initialize_queues()
