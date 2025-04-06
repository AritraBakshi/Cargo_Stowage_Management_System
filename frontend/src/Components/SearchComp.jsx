import { useState } from "react";
import axios from "axios";

export default function SearchRetrieve() {
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [retrieveId, setRetrieveId] = useState("");
  const [retrievedItem, setRetrievedItem] = useState(null);
  const [searchStatus, setSearchStatus] = useState("");
  const [retrieveStatus, setRetrieveStatus] = useState("");

  // Search by item_id
  const handleSearch = async () => {
    if (!searchId.trim()) return setSearchStatus("Please enter an item ID to search.");
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/items/${searchId}`);
      setSearchResult(res.data.item);
      setSearchStatus("Search successful!");
    } catch (err) {
      console.error(err);
      setSearchResult(null);
      setSearchStatus("Search failed!");
    }
  };

  const handleRetrieve = async () => {
    if (!retrieveId.trim()) return setRetrieveStatus("Please enter an item ID to retrieve.");
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/retrieve", {
        item_id: retrieveId,
      });
  
      // If item is already used
      if (res.data?.message === "Item Fully Retirieved or not found" || res.data?.used) {
        setRetrievedItem(null);
        setRetrieveStatus("Item Fully Retirieved or not found");
      } else {
        setRetrievedItem(res.data);
        setRetrieveStatus("Item retrieved successfully!");
      }
    } catch (err) {
      console.error(err);
      setRetrievedItem(null);
      setRetrieveStatus("Retrieval failed! or fully Retrieved");
    }
  };
  

  // Reusable component for item details
  const ItemDetails = ({ item }) => (
    <div className="mt-4 text-sm leading-relaxed space-y-1">
      <p><strong>Item ID:</strong> {item.item_id}</p>
      <p><strong>Name:</strong> {item.name}</p>
      <p><strong>Mass:</strong> {item.mass}</p>
      <p><strong>Priority:</strong> {item.priority}</p>
      <p><strong>Expiry Date:</strong> {item.expiry_date}</p>
      <p><strong>Usage Limit:</strong> {item.usage_limit}</p>
      <p><strong>Usage Count:</strong> {item.usage_count}</p>
      <p><strong>Preferred Zone:</strong> {item.preferred_zone}</p>
      <p><strong>Container ID:</strong> {item.container_id}</p>
      <p><strong>Is Waste:</strong> {item.is_waste ? "Yes" : "No"}</p>
      {item.waste_reason && <p><strong>Waste Reason:</strong> {item.waste_reason}</p>}
      <div>
        <strong>Dimensions:</strong>
        <ul className="ml-4 list-disc">
          <li>Width: {item.dimensions?.width}</li>
          <li>Depth: {item.dimensions?.depth}</li>
          <li>Height: {item.dimensions?.height}</li>
        </ul>
      </div>
      <div>
        <strong>Position:</strong>
        <ul className="ml-4 list-disc">
          <li><strong>Start:</strong> ({item.position?.start_coordinates?.width}, {item.position?.start_coordinates?.depth}, {item.position?.start_coordinates?.height})</li>
          <li><strong>End:</strong> ({item.position?.end_coordinates?.width}, {item.position?.end_coordinates?.depth}, {item.position?.end_coordinates?.height})</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-8 text-center mt-24">Search and Retrieve Items</h1>

      {/* 🔍 Search Section */}
      <div className="bg-white p-4 rounded shadow mb-10">
        <h2 className="text-xl font-semibold mb-4">🔍 Search Item by ID</h2>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Enter Item ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSearch}
            className="bg-white hover:bg-gray-300 text-black border-2 border-black px-4 py-2 rounded"
          >
            Search
          </button>
        </div>
        {searchStatus && <p className="mt-2 text-blue-600">{searchStatus}</p>}
        {searchResult && <ItemDetails item={searchResult} />}
      </div>

      {/* 📦 Retrieve Section */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">📦 Retrieve Item by ID</h2>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Enter Item ID"
            value={retrieveId}
            onChange={(e) => setRetrieveId(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={handleRetrieve}
            className="bg-white hover:bg-gray-300 text-black border-2 border-black px-4 py-2 rounded"
          >
            Retrieve
          </button>
        </div>
        {retrieveStatus && <p className="mt-2 text-green-600">{retrieveStatus}</p>}
        {retrievedItem && <ItemDetails item={retrievedItem} />}
      </div>
    </div>
  );
}
