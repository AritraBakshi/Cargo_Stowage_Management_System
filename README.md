# Space Station Cargo Management System

This implementation of the Space Station Cargo Management System API for the hackathon. It has been implemented in Python and webapp is implemented in ReactJS 

## Getting Started

1. Clone this repository
2. Build the Docker container: `docker build -t cargo-management .`
3. Run the container: `docker run -p 80:80 cargo-management`
4. Access the web app at http://localhost:80 and the API at http://localhost:80/api

### Folder Structure:
Backend folder is the api folder and frontend folder is the ui for the webapp

### Running locally for development
#### Backend
```
cd backend
pip install -r requirements.txt
python app/main.py
```
Backend API will be available on `http://localhost:8000/`

#### Frontend
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
## Performance Optimizations Implemented

The system has been optimized with the following improvements:

### 1. Placement Service & Bin Packing
- **Corner Point Placement:** Instead of checking every cm³, we only check "corner points" where items can be validly placed, reducing candidate positions from thousands to dozens.
- **Reduced Rotation Options:** Only checking the most sensible 2 rotations instead of all 6 possible rotations.
- **Skyline Algorithm:** Maintains a "skyline" of current top surfaces, only checking positions along the skyline.
- **Time Complexity:** Improved from O(n log n + n * V * m) to O(n log n + n * C * m) where C is significantly smaller than V.

### 2. Retrieval Service
- **Path Planning:** Optimized retrieval with a directed path planning approach.
- **Dependency-based Extraction:** Only move items directly blocking extraction path.
- **Prioritized Removal:** Items removed based on distance and priority for minimal disruption.
- **Time Complexity:** Improved from O(n * m + b²) to O(n * m + b log b).

### 3. Waste Management Service
- **Priority Queues:** Implemented priority queues for fast identification of expiring/overused items.
- **Incremental Updates:** Efficiently update tracking when items are modified.
- **Time Complexity:** Improved from O(n * m) to O(log n) for most operations.

### 4. Return Service
- **Greedy Knapsack Approach:** Sort waste items by mass-to-volume ratio and optimally fill containers.
- **Efficient Packing:** Uses the optimized bin packer for container space utilization.
- **Time Complexity:** Improved from O(n * m²) to O(n log n + n * m).

### 5. Overall System
- **Optimized Docker Configuration:** Single container solution that runs both frontend and backend.
- **Efficient Data Structures:** Optimized lookups and reduced redundant calculations.

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

| Service / Module        | Original Complexity       | Optimized Complexity          | Worst Case Scenario Description                          |
|-------------------------|---------------------------|-------------------------------|----------------------------------------------------------|
| **Placement**           | `O(n log n + n * V * m)`  | `O(n log n + n * C * m)`      | Sorting containers + Corner points bin-packing per item   |
| **Bin Packing**         | `O(V * m)`                | `O(C * m)`                    | Tries corner points × overlap checks (C << V)            |
| **Retrieval**           | `O(n * m + b²)`           | `O(n * m + b log b)`          | Linear search + optimized extraction of `b` blocking items|
| **Waste Management**    | `O(n * m)`                | `O(log n)` for most ops       | Priority queue operations for expiring/overused items     |
| **Return (Waste Move)** | `O(n * m²)`               | `O(n log n + n * m)`          | Greedy knapsack + optimized bin packing                   |

---

## Variable Definitions

- `n` = Number of containers  
- `m` = Maximum number of items per container  
- `V` = Number of candidate positions per container (brute force approach)  
- `C` = Number of corner points (optimized approach, C << V)
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
