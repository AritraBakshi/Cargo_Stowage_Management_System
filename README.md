# Space Station Cargo Management System

This  implementation of the Space Station Cargo Management System API for the hackathon. It has been implemented in Python and webapp is implemented in ReactJS 

## Getting Started

1. Clone this repository
2. Build the Docker container: `docker build -t cargo-management .`
3. Run the container: `docker run -p 8000:8000 cargo-management`
4. Test the API at http://localhost:8000

### Folder Structure:
Backend folder is the api folder and frontend folder is the ui for the webapp
### Running the frontend
```
cd frontend
npm i
npm run dev
```
Frontend will be available on `http://localhost:5173/`
<br/>

## API Documentation

### Placement API
**Endpoint:** `POST /api/placement`

**Request:**
```json
[
    {
        "item_id": "1",
        "name": "Battery Pack",
        "width": 14.0,
        "depth": 31.0,
        "height": 54.0,
        "mass": 38.0,
        "priority": 90,
        "expiry_date": "2027-03-08T00:00:00",
        "usage_limit": 5,
        "usage_count": 0,
        "preferred_zone": "Medical Bay",
        "container_id": null,
        "position": null,
        "is_waste": false,
        "waste_reason": null
    },
    ...
]
```

**Response:**
```json
{
  "success": true,
  "placements": [
    {
      "itemId": "item-1",
      "containerId": "container-1",
      "position": {
        "startCoordinates": {"width": 0, "depth": 0, "height": 0},
        "endCoordinates": {"width": 10, "depth": 10, "height": 10}
      }
    }
  ]
}
```

**Endpoint:** `POST /import/containers & /import/items`

**Request:**
`.csv file as form-data`

**Response:**
```json
{"message": f"Successfully added {No_of_items} items."}
```


**Endpoint:** `POST "/api/items/{id}"`
**Description:**
This will fetch the item

**Endpoint:** `POST "/api/retrieve"`

**Request:**
```json
{
    "item_id":"1"
}
```

**Response:**
```json
{"succeess":True,"message": f"Item {item_id} retrieved successfully."}
```

**Endpoint:** `GET "/api/waste/identify"`
**Response:**
```json
{
  "success": True,
  "wasteItems": waste_items
}
```

**Endpoint:** `POST "/api/waste/return-plan"`
**Request:**
```json
{
    "undockingContainerId":<String>,
    "maxWeight":<int>
}
```
**Response:**
```json
{
  "container_id": <String>,
  "placed_items": <Array>,
  "total_mass": <Number>,
  "volume_utilization": <Number>,
  "plan_valid": <Bool>
}
```
## Features Implemented

Our solution implements all the APIs described in the problem statement:

- [x] Placement API
- [x] Search API
- [x] Retrieve API
- [x] Place API
- [x] Waste Management APIs
- [x] Import/Export APIs
- [x] Logging APIs
- [x] Time Simulation APIs

## Time Complexity Summary of Core Algorithms

| Service / Module        | Time Complexity              | Worst Case Scenario Description                          |
|-------------------------|------------------------------|----------------------------------------------------------|
| **Placement**           | `O(n log n + n * V * m)`     | Sorting containers + Brute-force bin-packing per item    |
| **Bin Packing**         | `O(V * m)`                   | Tries all positions (1cm granularity) × overlap checks   |
| **Retrieval**           | `O(n * m + b²)`              | Linear search + rearranging `b` blocking items           |
| **Waste Management**    | `O(n * m)`                   | Scan each item in every container for expiry/overuse     |
| **Return (Waste Move)** | `O(n * m²)`                  | Partition + re-packing each container (naive)            |

---

## Variable Definitions

- `n` = Number of containers  
- `m` = Maximum number of items per container  
- `V` = Number of candidate positions per container  
-  Approximated by grid resolution: `(W - w + 1)(D - d + 1)(H - h + 1)`  
- `b` = Number of blocking items (during retrieval)

---

## Worst Case Scenarios

- **Placement & Bin Packing:**  
  - Container is nearly full → all positions must be tested.
  - All rotations must be checked.
  - Overlap test per position against `m` items → `O(V * m)`

- **Retrieval:**  
  - Target item is deeply buried → many items (`b`) must be removed and re-packed.
  - Repacking blockers one-by-one → `O(b²)` in worst-case.

- **Return Service:**  
  - All containers have waste items → all must be repacked.
  - Worst case: every container has `m` items, leading to `O(n * m²)`.

---
