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
      console.log(res.data);
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
        maxWeight: maxWeight,
      });
      console.log(res.data);
      setReturnPlan(res.data);
    } catch (err) {
      console.error(err);
      setPlanError("Failed to fetch return plan.");
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-10 mt-16">♻️ Waste Management</h1>

      {/* Identify Waste Section */}
      <section className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-12">
        <h2 className="text-2xl font-semibold mb-4">🕵️ Identify Waste</h2>
        <button
          onClick={identifyWaste}
          className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2 rounded shadow"
          disabled={loading}
        >
          {loading ? "Identifying..." : "Identify Waste"}
        </button>

        {successMessage && <p className="text-green-600 mt-4">{successMessage}</p>}
        {errorMessage && <p className="text-red-600 mt-4">{errorMessage}</p>}

        {wasteItems.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">🗑 Waste Items</h3>
            <ul className="space-y-4">
              {wasteItems.map((item, index) => (
                <li key={index} className="bg-gray-50 border rounded-lg p-4 shadow-sm">
                  <p><strong>Item ID:</strong> {item.itemId}</p>
                  <p><strong>Name:</strong> {item.name}</p>
                  <p><strong>Reason:</strong> {item.reason}</p>
                  <p><strong>Container ID:</strong> {item?.containerId}</p>
                  <div className="mt-2 ml-2">
                    <p><strong>Position:</strong></p>
                    <ul className="list-disc list-inside ml-2">
                      <li><strong>Start:</strong> ({item.position?.startCoordinates?.width}, {item.position?.startCoordinates?.depth}, {item.position?.startCoordinates?.height})</li>
                      <li><strong>End:</strong> ({item.position?.endCoordinates?.width}, {item.position?.endCoordinates?.depth}, {item.position?.endCoordinates?.height})</li>
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Return Plan Section */}
      <section className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-12">
        <h2 className="text-2xl font-semibold mb-4">📦 Plan Return of Waste Items</h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Undocking Container ID"
            value={containerId}
            onChange={(e) => setContainerId(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-4 py-2"
          />
          <input
            type="number"
            placeholder="Max Weight"
            value={maxWeight}
            onChange={(e) => setMaxWeight(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-4 py-2"
          />
          <button
            onClick={submitReturnPlan}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded shadow"
          >
            Submit Plan
          </button>
        </div>

        {planError && <p className="text-red-600">{planError}</p>}

        {returnPlan && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3">🧩 Return Plan</h3>
            <p><strong>Container ID:</strong> {returnPlan.container_id}</p>
            <p><strong>Total Mass:</strong> {returnPlan.total_mass} kg</p>
            <p><strong>Volume Utilization:</strong> {returnPlan.volume_utilization}</p>
            <p><strong>Plan Valid:</strong> {returnPlan.plan_valid ? "Yes" : "No"}</p>

            <ul className="space-y-4 mt-4">
              {returnPlan.placed_items.map((item, index) => (
                <li key={index} className="bg-gray-50 border rounded-lg p-4 shadow-sm">
                  <p><strong>Name:</strong> {item.name}</p>
                  <p><strong>Mass:</strong> {item.mass} kg</p>
                  <p><strong>Priority:</strong> {item.priority}</p>
                  <p><strong>Preferred Zone:</strong> {item.preferred_zone}</p>
                </li>
              ))}
            </ul>

            {/* 3D View */}
            <div className="h-[500px] mt-6 border rounded-lg overflow-hidden">
              <Canvas camera={{ position: [150, 150, 150], fov: 50 }}>
                <ambientLight />
                <pointLight position={[100, 100, 100]} />
                <OrbitControls />

                {/* Container - Updated to use dynamic dimensions */}
                <mesh position={[
                  returnPlan.container_dimensions.width / 2,
                  returnPlan.container_dimensions.height / 2,
                  returnPlan.container_dimensions.depth / 2
                ]}>
                  <boxGeometry args={[
                    returnPlan.container_dimensions.width,
                    returnPlan.container_dimensions.height,
                    returnPlan.container_dimensions.depth
                  ]} />
                  <meshBasicMaterial color="gray" wireframe opacity={0.3} transparent />
                </mesh>

                {/* Axes Helper */}
                <axesHelper args={[150]} />

                {returnPlan.placed_items.map((item, index) => {
  const { width, depth, height } = item.dimensions;
  const { width: x, depth: y, height: z } = item.position.start_coordinates;

  // Generate a random hex color
  const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;

  return (
    <mesh
      key={index}
      position={[x + width / 2, z + height / 2, y + depth / 2]}
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={randomColor} />
    </mesh>
  );
})}

              </Canvas>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}