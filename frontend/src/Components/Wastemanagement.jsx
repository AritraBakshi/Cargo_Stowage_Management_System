import React, { useState } from "react";
import axios from "axios";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function WasteManagement() {
  const [wasteItems, setWasteItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [containerId, setContainerId] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [returnPlan, setReturnPlan] = useState(null);
  const [planError, setPlanError] = useState("");

  const identifyWaste = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/waste/identify");
      if (res.data.wasteItems && res.data.wasteItems.length > 0) {
        setWasteItems(res.data.wasteItems);
        setSuccessMessage("Waste items identified successfully.");
      } else {
        setWasteItems([]);
        setErrorMessage("Failed to identify waste.");
      }
    } catch (err) {
      setErrorMessage("Error while fetching waste data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitReturnPlan = async () => {
    setPlanError("");
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/waste/return-plan", {
        undockingContainerId: containerId,
        maxWeight: maxWeight
      });
      setReturnPlan(res.data);
    } catch (err) {
      console.error(err);
      setPlanError("Failed to fetch return plan.");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-center mt-16">♻️ Waste Management</h1>

      {/* Section 1 - Identify Waste */}
      <div className="bg-white p-5 rounded-lg shadow mb-10">
        <h2 className="text-xl font-semibold mb-4">🕵️ Identify Waste</h2>
        <button
          onClick={identifyWaste}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Identifying..." : "Identify Waste"}
        </button>

        {successMessage && <p className="mt-3 text-green-600">{successMessage}</p>}
        {errorMessage && <p className="mt-3 text-red-600">{errorMessage}</p>}

        {wasteItems.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">🗑 Waste Items List</h3>
            <ul className="space-y-4">
              {wasteItems.map((item, index) => (
                <li key={index} className="border rounded p-4 bg-gray-50 shadow-sm">
                  <p><strong>Item ID:</strong> {item.itemId}</p>
                  <p><strong>Name:</strong> {item.name}</p>
                  <p><strong>Reason:</strong> {item.reason}</p>
                  <p><strong>Container ID:</strong> {item.containerId}</p>
                  <div className="ml-4 mt-2">
                    <p><strong>Position:</strong></p>
                    <ul className="list-disc ml-4">
                      <li><strong>Start:</strong> ({item.position.startCoordinates.width}, {item.position.startCoordinates.depth}, {item.position.startCoordinates.height})</li>
                      <li><strong>End:</strong> ({item.position.endCoordinates.width}, {item.position.endCoordinates.depth}, {item.position.endCoordinates.height})</li>
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Section 2 - Plan Return Waste Items */}
      <div className="bg-white p-5 rounded-lg shadow mb-10">
        <h2 className="text-xl font-semibold mb-4">📦 Plan Return Waste Items</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Undocking Container ID"
            className="border px-3 py-2 rounded w-full sm:w-auto"
            value={containerId}
            onChange={(e) => setContainerId(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Weight"
            className="border px-3 py-2 rounded w-full sm:w-auto"
            value={maxWeight}
            onChange={(e) => setMaxWeight(e.target.value)}
          />
          <button
            onClick={submitReturnPlan}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Submit Plan
          </button>
        </div>
        {planError && <p className="text-red-600">{planError}</p>}
        {returnPlan && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">🧩 Return Plan</h3>
            <p><strong>Container ID:</strong> {returnPlan.container_id}</p>
            <p><strong>Total Mass:</strong> {returnPlan.total_mass} kg</p>
            <p><strong>Volume Utilization:</strong> {returnPlan.volume_utilization}</p>
            <p><strong>Plan Valid:</strong> {returnPlan.plan_valid ? "Yes" : "No"}</p>

            <ul className="space-y-4 mt-4">
              {returnPlan.placed_items.map((item, index) => (
                <li key={index} className="border p-4 bg-gray-50 rounded shadow-sm">
                  <p><strong>Name:</strong> {item.name}</p>
                  <p><strong>Mass:</strong> {item.mass} kg</p>
                  <p><strong>Priority:</strong> {item.priority}</p>
                  <p><strong>Preferred Zone:</strong> {item.preferred_zone}</p>
                </li>
              ))}
            </ul>

            {/* 3D Visualization */}
            <div className="h-96 mt-6 border rounded overflow-hidden">
            <Canvas camera={{ position: [150, 150, 150], fov: 50, near: 0.1, far: 1000 }}>
    <ambientLight />
    <pointLight position={[100, 100, 100]} />
    <OrbitControls />
    
    {/* Add container wireframe */}
    <mesh position={[50, 50, 50]}>
      <boxGeometry args={[100, 100, 100]} />
      <meshBasicMaterial color="gray" wireframe opacity={0.3} transparent />
    </mesh>

    {/* Add axis helper */}
    <axesHelper args={[150]} />

    {/* Add placed waste items */}
    {returnPlan.placed_items.map((item, index) => {
      const { width, depth, height } = item.dimensions;
      const { width: x, depth: y, height: z } = item.position.start_coordinates;
      return (
        <mesh
          key={index}
          position={[x + width / 2, z + height / 2, y + depth / 2]}
        >
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      );
    })}
  </Canvas>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
