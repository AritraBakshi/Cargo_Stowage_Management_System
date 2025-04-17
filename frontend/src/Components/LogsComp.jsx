import React, { useState } from "react";
import axios from "axios";

export default function LogViewer() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [itemId, setItemId] = useState("");
  const [userId, setUserId] = useState("");
  const [actionType, setActionType] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const actionTypes = ["placement", "retrieval", "rearrangement", "disposal"];

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setLogs([]);

    try {
      const params = {
        startDate,
        endDate,
        ...(itemId && { itemId }),
        ...(userId && { userId }),
        ...(actionType && { actionType }),
      };

      const res = await axios.get("http://127.0.0.1:8000/api/logs", { params });
      console.log(res.data); // Debugging line to check the response
      if (res.data && res.data.length > 0) {
        setLogs(res.data);
        setSuccessMessage("Logs retrieved successfully.");
      } else {
        setSuccessMessage("No logs found for the given criteria.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.detail || "Error fetching logs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setErrorMessage("Start date and end date are required.");
      return;
    }
    fetchLogs();
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-10 mt-16">📜 Log Viewer</h1>

      {/* Log Filter Section */}
      <section className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-12">
        <h2 className="text-2xl font-semibold mb-4">🔍 Filter Logs</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Start Date (ISO format)
              </label>
              <input
                type="text"
                placeholder="e.g., 2023-10-01T00:00:00Z"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                End Date (ISO format)
              </label>
              <input
                type="text"
                placeholder="e.g., 2023-10-02T23:59:59Z"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Item ID (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter Item ID"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                User ID (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Action Type (Optional)
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2"
            >
              <option value="">All Actions</option>
              {actionTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded shadow"
            disabled={loading}
          >
            {loading ? "Fetching Logs..." : "Fetch Logs"}
          </button>
        </form>

        {errorMessage && <p className="text-red-600 mt-4">{errorMessage}</p>}
        {successMessage && <p className="text-green-600 mt-4">{successMessage}</p>}
      </section>

      {/* Logs Display Section */}
      {logs.length > 0 && (
        <section className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h2 className="text-2xl font-semibold mb-4">📋 Logs</h2>
          <ul className="space-y-4">
            {logs.map((log, index) => (
              <li key={index} className="bg-gray-50 border rounded-lg p-4 shadow-sm">
                <p><strong>Timestamp:</strong> {new Date(log.timestamp).toISOString()}</p>
                <p><strong>Action Type:</strong> {log.actionType}</p>
                {log.itemId && <p><strong>Item ID:</strong> {log.itemId}</p>}
                {log.userId && <p><strong>User ID:</strong> {log.userId}</p>}
                {/* {log.details && <p><strong>Details:</strong> {log.details.reason}</p>} */}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}