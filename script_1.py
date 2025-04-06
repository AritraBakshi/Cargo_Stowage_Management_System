import pandas as pd
import random

# Define zones and generate container IDs
zones = ["Crew Quarters", "Airlock", "Medical Bay", "Cargo Hold", "Engineering", "Laboratory"]
container_ids = [f"cont{chr(65 + i)}" for i in range(15)]  # Generates contA, contB, ..., contZ

# Generate sample data
containers = []
for i in range(len(container_ids)):
    zone = random.choice(zones)
    container_id = container_ids[i]
    width = random.choice([50, 100, 150, 200])  # Possible widths
    depth = 85  # Constant as per example
    height = 200  # Constant as per example

    containers.append({
        "Zone": zone,
        "Container ID": container_id,
        "Width(cm)": width,
        "Depth(cm)": depth,
        "Height(cm)": height
    })

# Create DataFrame
df_containers = pd.DataFrame(containers)

# Save to CSV
df_containers.to_csv("containers_data.csv", index=False)
print("CSV file saved as containers_data.csv")
