import plotly.graph_objects as go

# Container dimensions
container = {
    "container_id": "contB",
    "width": 100.0,
    "depth": 250.0,
    "height": 200.0
}

# Data for items (from your input)
placements = [
    {
        "item_id": "1", "name": "Medical Supplies",
        "position": {"start_coordinates": {"width": 0.0, "depth": 0.0, "height": 0.0},
                     "end_coordinates": {"width": 21.0, "depth": 17.0, "height": 26.0}},
        "priority": 5, "expiry_date": "2026-08-23"
    },
    {
        "item_id": "2", "name": "Water Container",
        "position": {"start_coordinates": {"width": 0.0, "depth": 0.0, "height": 26.0},
                     "end_coordinates": {"width": 26.0, "depth": 27.0, "height": 38.0}},
        "priority": 100, "expiry_date": "2027-10-29"
    },
    {
        "item_id": "3", "name": "First Aid Kit",
        "position": {"start_coordinates": {"width": 0.0, "depth": 0.0, "height": 38.0},
                     "end_coordinates": {"width": 37.0, "depth": 43.0, "height": 85.0}},
        "priority": 44, "expiry_date": "2027-10-03"
    },
    {
        "item_id": "4", "name": "Oxygen Cylinder",
        "position": {"start_coordinates": {"width": 0.0, "depth": 0.0, "height": 85.0},
                     "end_coordinates": {"width": 31.0, "depth": 21.0, "height": 113.0}},
        "priority": 78, "expiry_date": "2025-06-09"
    },
    {
        "item_id": "5", "name": "Food Packet",
        "position": {"start_coordinates": {"width": 0.0, "depth": 0.0, "height": 113.0},
                     "end_coordinates": {"width": 12.0, "depth": 21.0, "height": 177.0}},
        "priority": 61, "expiry_date": "2025-09-25"
    },
    {
        "item_id": "6", "name": "Battery Pack",
        "position": {"start_coordinates": {"width": 0.0, "depth": 21.0, "height": 85.0},
                     "end_coordinates": {"width": 34.0, "depth": 58.0, "height": 123.0}},
        "priority": 64, "expiry_date": "2026-02-13"
    },
    {
        "item_id": "7", "name": "Battery Pack",
        "position": {"start_coordinates": {"width": 0.0, "depth": 21.0, "height": 123.0},
                     "end_coordinates": {"width": 98.0, "depth": 65.0, "height": 161.0}},
        "priority": 43, "expiry_date": "2026-09-29"
    },
    {
        "item_id": "8", "name": "Food Packet",
        "position": {"start_coordinates": {"width": 0.0, "depth": 21.0, "height": 161.0},
                     "end_coordinates": {"width": 46.0, "depth": 61.0, "height": 191.0}},
        "priority": 38, "expiry_date": "2025-05-28"
    },
    {
        "item_id": "9", "name": "Oxygen Cylinder",
        "position": {"start_coordinates": {"width": 0.0, "depth": 43.0, "height": 0.0},
                     "end_coordinates": {"width": 27.0, "depth": 56.0, "height": 49.0}},
        "priority": 57, "expiry_date": "2025-09-04"
    },
    {
        "item_id": "10", "name": "Food Packet",
        "position": {"start_coordinates": {"width": 0.0, "depth": 0.0, "height": 177.0},
                     "end_coordinates": {"width": 41.0, "depth": 14.0, "height": 197.0}},
        "priority": 76, "expiry_date": "2025-09-04"
    },
    {
        "item_id": "11", "name": "Food Packet",
        "position": {"start_coordinates": {"width": 0.0, "depth": 56.0, "height": 0.0},
                     "end_coordinates": {"width": 69.0, "depth": 83.0, "height": 46.0}},
        "priority": 64, "expiry_date": "2026-08-02"
    },
]

# Generate 3D boxes
fig = go.Figure()
colors = ['red', 'blue', 'green', 'orange', 'purple', 'cyan', 'yellow', 'pink', 'gray', 'lime', 'brown']

for i, item in enumerate(placements):
    start = item['position']['start_coordinates']
    end = item['position']['end_coordinates']

    x0, x1 = start['width'], end['width']
    y0, y1 = start['depth'], end['depth']
    z0, z1 = start['height'], end['height']

    fig.add_trace(go.Mesh3d(
        x=[x0, x1, x1, x0, x0, x1, x1, x0],
        y=[y0, y0, y1, y1, y0, y0, y1, y1],
        z=[z0, z0, z0, z0, z1, z1, z1, z1],
        i=[0, 0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 6],
        j=[1, 2, 3, 2, 5, 3, 6, 0, 5, 6, 6, 7],
        k=[2, 3, 0, 5, 6, 6, 7, 4, 6, 7, 7, 4],
        color=colors[i % len(colors)],
        opacity=0.5,
        flatshading=True,
        name=item['name'],
        hovertext=f"{item['name']}<br>Priority: {item['priority']}<br>Expiry: {item['expiry_date']}",
        hoverinfo='text'
    ))

# Add transparent container outline
cw, cd, ch = container["width"], container["depth"], container["height"]
fig.add_trace(go.Mesh3d(
    x=[0, cw, cw, 0, 0, cw, cw, 0],
    y=[0, 0, cd, cd, 0, 0, cd, cd],
    z=[0, 0, 0, 0, ch, ch, ch, ch],
    i=[0, 0, 0, 4, 4, 2, 1, 3, 5, 6, 7, 5],
    j=[1, 2, 3, 5, 6, 3, 5, 2, 6, 7, 4, 1],
    k=[2, 3, 0, 6, 7, 1, 6, 0, 7, 4, 5, 0],
    opacity=0.1,
    color='gray',
    name='Container Boundary'))

fig.update_layout(
    scene=dict(
        xaxis_title='Width',
        yaxis_title='Depth',
        zaxis_title='Height',
        aspectmode='data'
    ),
    margin=dict(l=0, r=0, b=0, t=30),
    title='3D Item Placement in Container "contB"',
    showlegend=False
)

fig.show()
