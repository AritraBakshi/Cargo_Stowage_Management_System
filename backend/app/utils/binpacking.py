from app.models.items import Item, Position
from app.models.container import Container, Dimensions
from typing import Optional
import itertools

# A simple in-memory representation of occupied spaces per container
# (In a full system, you'd track this in the Container object or DB)
container_occupancy = {}

# Modified rotate_dimensions function
def rotate_dimensions(dimensions: Dimensions):
    return [
        Dimensions(
            width=dims[0],
            depth=dims[1],
            height=dims[2]
        )
        for dims in set(itertools.permutations([
            dimensions.width,
            dimensions.depth,
            dimensions.height
        ]))
    ]

def find_position_for_item(item: Item, container: Container) -> Optional[Position]:
    key = container.container_id
    if key not in container_occupancy:
        container_occupancy[key] = []

    occupied = container_occupancy[key]

    for dims in rotate_dimensions(item.dimensions):
        # Simple brute-force 3D placement: scan grid at 1cm resolution
        max_x = int(container.dimensions.width - dims.width) + 1
        max_y = int(container.dimensions.depth - dims.depth) + 1
        max_z = int(container.dimensions.height - dims.height) + 1

        for x in range(0, max_x):
            for y in range(0, max_y):
                for z in range(0, max_z):
                    # candidate = Position(
                    #     start_coordinates=Dimensions(x, y, z),
                    #     end_coordinates=Dimensions(x + dims.width, y + dims.depth, z + dims.height)
                    # )

                    candidate = Position(
                            start_coordinates=Dimensions(
                                width=x,
                                depth=y,
                                height=z
                                 
                            ),
                            end_coordinates=Dimensions(
                                width=x + dims.width,
                                depth=y + dims.depth,
                                height=z + dims.height
                            )
                    )

                    if not any(overlaps(candidate, occ) for occ in occupied):
                        occupied.append(candidate)
                        return candidate

    return None

def overlaps(p1: Position, p2: Position) -> bool:
    return not (
        p1.end_coordinates.width <= p2.start_coordinates.width or
        p1.start_coordinates.width >= p2.end_coordinates.width or
        p1.end_coordinates.depth <= p2.start_coordinates.depth or
        p1.start_coordinates.depth >= p2.end_coordinates.depth or
        p1.end_coordinates.height <= p2.start_coordinates.height or
        p1.start_coordinates.height >= p2.end_coordinates.height
    )
