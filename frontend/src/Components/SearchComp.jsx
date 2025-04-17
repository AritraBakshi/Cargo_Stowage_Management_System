import { useState } from "react";
import axios from "axios";

export default function SearchRetrieve() {
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [retrieveId, setRetrieveId] = useState("");
  const [retrievedItem, setRetrievedItem] = useState(null);
  const [searchStatus, setSearchStatus] = useState("");
  const [retrieveStatus, setRetrieveStatus] = useState("");

  const handleSearch = async () => {
    if (!searchId.trim()) return setSearchStatus("Please enter an item ID to search.");
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/search", {
        params: { itemId: searchId }
      });

      if (!res.data.found) {
        setSearchResult(null);
        setSearchStatus("Item not found.");
        return;
      }

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
        itemId: retrieveId,
      });

      if (res.data?.success) {
        const fetchRes = await axios.get("http://127.0.0.1:8000/api/search", {
          params: { itemId: retrieveId }
        });

        if (fetchRes.data?.found) {
          setRetrievedItem(fetchRes.data.item);
          setRetrieveStatus(res.data.message);
        } else {
          setRetrievedItem(null);
          setRetrieveStatus("Item retrieved but not found in DB anymore.");
        }
      } else {
        setRetrievedItem(null);
        setRetrieveStatus(res.data?.message || "Unknown response from server.");
      }
    } catch (err) {
      console.error(err);
      setRetrievedItem(null);
      setRetrieveStatus("Retrieval failed or item fully retrieved.");
    }
  };

  const ItemDetails = ({ item }) => (
    <div className="mt-4 text-sm space-y-2 bg-gray-100 rounded-md p-4">
      <Detail label="Item ID" value={item.itemId} />
      <Detail label="Name" value={item.name} />
      <Detail label="Mass" value={item.mass} />
      <Detail label="Priority" value={item.priority} />
      <Detail label="Expiry Date" value={item.expiryDate} />
      <Detail label="Usage Limit" value={item.usageLimit} />
      <Detail label="Usage Count" value={item.usageCount} />
      <Detail label="Preferred Zone" value={item.zone} />
      <Detail label="Container ID" value={item.containerId} />
      <Detail label="Is Waste" value={item.isWaste ? "Yes" : "No"} />
      {item.wasteReason && <Detail label="Waste Reason" value={item.wasteReason} />}

      {item.dimensions && (
        <div className="mt-2">
          <strong className="block">Dimensions:</strong>
          <ul className="ml-4 list-disc text-gray-700">
            <li>Width: {item.dimensions.width}</li>
            <li>Depth: {item.dimensions.depth}</li>
            <li>Height: {item.dimensions.height}</li>
          </ul>
        </div>
      )}

      {item.position && (
        <div className="mt-2">
          <strong className="block">Position:</strong>
          <ul className="ml-4 list-disc text-gray-700">
            <li>
              <strong>Start:</strong> ({item.position.startCoordinates.width},{" "}
              {item.position.startCoordinates.depth},{" "}
              {item.position.startCoordinates.height})
            </li>
            <li>
              <strong>End:</strong> ({item.position.endCoordinates.width},{" "}
              {item.position.endCoordinates.depth},{" "}
              {item.position.endCoordinates.height})
            </li>
          </ul>
        </div>
      )}
    </div>
  );

  const Detail = ({ label, value }) => (
    <p>
      <span className="font-medium text-gray-800">{label}:</span>{" "}
      <span className="text-gray-700">{value}</span>
    </p>
  );

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="mt-6 opacity-0">.</div>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-12 text-gray-800 mt-16">🔍 Search & 📦 Retrieve Items</h1>

        {/* Search */}
        <section className="bg-white p-6 rounded-xl shadow mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Item by ID</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter Item ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
          {searchStatus && <p className="mt-3 text-blue-600">{searchStatus}</p>}
          {searchResult && <ItemDetails item={searchResult} />}
        </section>

        {/* Retrieve */}
        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Retrieve Item by ID</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter Item ID"
              value={retrieveId}
              onChange={(e) => setRetrieveId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={handleRetrieve}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              Retrieve
            </button>
          </div>
          {retrieveStatus && <p className="mt-3 text-green-600">{retrieveStatus}</p>}
          {retrievedItem && <ItemDetails item={retrievedItem} />}
        </section>
      </div>
    </div>
  );
}
