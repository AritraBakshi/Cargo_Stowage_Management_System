from app.models.items import Item, Position
from app.models.container import Container, Dimensions
from typing import Optional, List
import itertools

# Local occupancy tracker (per container) for internal rearrangement only
def rotate_dimensions(dimensions: Dimensions):
    return [
        Dimensions(
            width=d[0],
            depth=d[1],
            height=d[2]
        ) for d in set(itertools.permutations([
            dimensions.width,
            dimensions.depth,
            dimensions.height
        ]))
    ]

def repack_items_in_container(container: Container):
    occupied: List[Position] = []
    repacked_items: List[Item] = []

    items = sorted(container.items, key=lambda item: item.priority, reverse=True)

    for item in items:
        for dims in rotate_dimensions(item.dimensions):
            max_x = int(container.dimensions.width - dims.width) + 1
            max_y = int(container.dimensions.depth - dims.depth) + 1
            max_z = int(container.dimensions.height - dims.height) + 1

            for x in range(0, max_x):
                for y in range(0, max_y):
                    for z in range(0, max_z):
                        pos = Position(
                            start_coordinates=Dimensions(x, y, z),
                            end_coordinates=Dimensions(x + dims.width, y + dims.depth, z + dims.height)
                        )

                        if not any(overlaps(pos, o) for o in occupied):
                            item.position = pos
                            item.dimensions = dims
                            repacked_items.append(item)
                            occupied.append(pos)
                            break
                    else:
                        continue
                    break
                else:
                    continue
                break
            else:
                continue
            break

    container.items = repacked_items

def overlaps(p1: Position, p2: Position) -> bool:
    return not (
        p1.end_coordinates.width <= p2.start_coordinates.width or
        p1.start_coordinates.width >= p2.end_coordinates.width or
        p1.end_coordinates.depth <= p2.start_coordinates.depth or
        p1.start_coordinates.depth >= p2.end_coordinates.depth or
        p1.end_coordinates.height <= p2.start_coordinates.height or
        p1.start_coordinates.height >= p2.end_coordinates.height
    )
