from app.utils.visualization import visualize_container
from database import db

async def visualize_example():
    container_doc = await db.containers.find_one()
    items_doc = await db.items.find({"container_id": container_doc["_id"]}).to_list(length=100)

    from app.models.container import Container, Dimensions
    from app.models.items import Item, Position

    container = Container(
        container_id=container_doc["_id"],
        zone=container_doc["zone"],
        dimensions=Dimensions(**container_doc["dimensions"]),
        occupied_volume=container_doc.get("occupied_volume", 0.0)
    )

    items = [Item(**item) for item in items_doc]

    visualize_container(container, items)
