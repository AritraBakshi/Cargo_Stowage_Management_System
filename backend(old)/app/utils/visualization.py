import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from app.models.items import Item
from app.models.container import Container, Dimensions

def draw_box(ax, origin, dims, color):
    """Draw a 3D box given the origin and dimensions."""
    x, y, z = origin.width, origin.depth, origin.height
    dx, dy, dz = dims.width, dims.depth, dims.height

    # Define the vertices of the cuboid
    vertices = [
        [x, y, z],
        [x + dx, y, z],
        [x + dx, y + dy, z],
        [x, y + dy, z],
        [x, y, z + dz],
        [x + dx, y, z + dz],
        [x + dx, y + dy, z + dz],
        [x, y + dy, z + dz]
    ]

    # List of sides' polygons of figure
    faces = [
        [vertices[0], vertices[1], vertices[2], vertices[3]],
        [vertices[4], vertices[5], vertices[6], vertices[7]],
        [vertices[0], vertices[1], vertices[5], vertices[4]],
        [vertices[2], vertices[3], vertices[7], vertices[6]],
        [vertices[1], vertices[2], vertices[6], vertices[5]],
        [vertices[4], vertices[7], vertices[3], vertices[0]]
    ]

    ax.add_collection3d(Poly3DCollection(faces, facecolors=color, linewidths=1, edgecolors='black', alpha=0.6))

def visualize_container(container: Container, items: list[Item]):
    fig = plt.figure(figsize=(12, 8))
    ax = fig.add_subplot(111, projection='3d')
    ax.set_title(f"Container ID: {container.container_id} | Zone: {container.zone}")

    # Draw container boundary
    draw_box(ax, Dimensions(0, 0, 0), container.dimensions, 'lightgrey')

    # Draw each item
    colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'cyan', 'magenta']
    for idx, item in enumerate(items):
        if item.container_id != container.container_id or not item.position:
            continue
        origin = item.position.start_coordinates
        dims = item.position.end_coordinates
        draw_box(ax, origin, dims, colors[idx % len(colors)])

    ax.set_xlabel('Width (cm)')
    ax.set_ylabel('Depth (cm)')
    ax.set_zlabel('Height (cm)')
    ax.set_xlim([0, container.dimensions.width])
    ax.set_ylim([0, container.dimensions.depth])
    ax.set_zlim([0, container.dimensions.height])
    plt.tight_layout()
    plt.show()
