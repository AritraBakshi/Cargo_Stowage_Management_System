import pandas as pd
import random
from datetime import datetime, timedelta

# Generate sample data
items = []
zones = ["Crew Quarters", "Airlock", "Medical Bay", "Cargo Hold", "Engineering", "Command Center"]
names = ["Food Packet", "Oxygen Cylinder", "First Aid Kit", "Water Container", "Tool Kit", "Medical Supplies", "Battery Pack"]
usage_limits = ["5 uses", "10 uses", "30 uses", "50 uses", "100 uses", "N/A"]

for i in range(1, 101):
    item_id = f"{i:03}"
    name = random.choice(names)
    width = random.randint(5, 50)
    depth = random.randint(5, 50)
    height = random.randint(5, 100)
    mass = random.randint(1, 50)
    priority = random.randint(1, 100)
    expiry_date = (datetime.now() + timedelta(days=random.randint(0, 1000))).strftime("%Y-%m-%d") if random.random() > 0.2 else "N/A"
    usage_limit = random.choice(usage_limits)
    preferred_zone = random.choice(zones)

    items.append({
        "Item ID": item_id,
        "Name": name,
        "Width (cm)": width,
        "Depth (cm)": depth,
        "Height (cm)": height,
        "Mass (kg)": mass,
        "Priority (1-100)": priority,
        "Expiry Date (ISO Format)": expiry_date,
        "Usage Limit": usage_limit,
        "Preferred Zone": preferred_zone
    })

# Create DataFrame
df_items = pd.DataFrame(items)

# Save to CSV
df_items.to_csv("items_data.csv", index=False)
print("CSV file saved as items_data.csv")
