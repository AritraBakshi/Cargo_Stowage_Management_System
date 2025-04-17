import { useState } from "react";
import axios from "axios";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function ContainerDetails() {
  const [containerId, setContainerId] = useState("");
  const [containerData, setContainerData] = useState(null);
  const [status, setStatus] = useState("");

  const fetchContainerDetails = async () => {
    if (!containerId.trim()) return setStatus("Please enter a container ID.");
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/containers/${containerId}`);
      setContainerData(res.data.container);
      setStatus("Container fetched successfully!");
    } catch (err) {
      console.error(err);
      setStatus("Failed to fetch container.");
      setContainerData(null);
    }
  };

  // Box for items in 3D - now accepts a color prop
  const ItemBox = ({ item, color }) => {
    const { width, depth, height } = item.dimensions;
    const start = item.position.start_coordinates;

    return (
      <mesh position={[start.width + width / 2, start.height + height / 2, start.depth + depth / 2]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  };

  // Define a list of colors to cycle through
  const itemColors = ["orange", "blue", "green", "red", "purple", "teal"];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-8 text-center mt-24">Container Details</h1>

      {/* 🔍 Search Section */}
      <div className="bg-white p-4 rounded shadow mb-10">
        <h2 className="text-xl font-semibold mb-4">🔍 Search Container by ID</h2>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Enter Container ID"
            value={containerId}
            onChange={(e) => setContainerId(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={fetchContainerDetails}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Search
          </button>
        </div>
        {status && <p className="mt-2 text-blue-600">{status}</p>}
      </div>

      {/* 🧱 Container Info */}
      {containerData && (
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">📦 Container Info</h2>
          <p><strong>Container ID:</strong> {containerData.container_id}</p>
          <p><strong>Zone:</strong> {containerData.zone}</p>
          <p><strong>Occupied Volume:</strong> {containerData.occupied_volume}</p>

          <div>
            <strong>Dimensions:</strong>
            <ul className="ml-4 list-disc">
              <li>Width: {containerData.dimensions.width}</li>
              <li>Depth: {containerData.dimensions.depth}</li>
              <li>Height: {containerData.dimensions.height}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mt-6 mb-2">📦 Items in Container</h3>
            {containerData.items.map((item) => (
              <div key={item.item_id} className="border border-gray-300 rounded p-3 mb-4">
                <p><strong>Item ID:</strong> {item.item_id}</p>
                <p><strong>Mass:</strong> {item.mass}</p>
                <p><strong>Priority:</strong> {item.priority}</p>
                <p><strong>Expiry Date:</strong> {item.expiry_date}</p>
                <p><strong>Usage Limit:</strong> {item.usage_limit}</p>

                <div className="mt-2">
                  <strong>Dimensions:</strong>
                  <ul className="ml-4 list-disc">
                    <li>Width: {item.dimensions.width}</li>
                    <li>Depth: {item.dimensions.depth}</li>
                    <li>Height: {item.dimensions.height}</li>
                  </ul>
                </div>

                <div className="mt-2">
                  <strong>Position:</strong>
                  <ul className="ml-4 list-disc">
                    <li>
                      <strong>Start:</strong> ({item.position.start_coordinates.width}, {item.position.start_coordinates.depth}, {item.position.start_coordinates.height})
                    </li>
                    <li>
                      <strong>End:</strong> ({item.position.end_coordinates.width}, {item.position.end_coordinates.depth}, {item.position.end_coordinates.height})
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* 3D Visualization */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">📐 3D Visualization</h3>
            <div className="w-full h-[500px] border rounded overflow-hidden">
              <Canvas camera={{ position: [300, 300, 300], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[100, 100, 100]} />
                <OrbitControls />
                <mesh position={[
                  containerData.dimensions.width / 2,
                  containerData.dimensions.height / 2,
                  containerData.dimensions.depth / 2,
                ]}>
                  <boxGeometry
                    args={[
                      containerData.dimensions.width,
                      containerData.dimensions.height,
                      containerData.dimensions.depth,
                    ]}
                  />
                  <meshStandardMaterial color="lightgray" wireframe />
                </mesh>

                {/* Items with different colors */}
                {containerData.items.map((item, idx) => (
                  <ItemBox
                    key={idx}
                    item={item}
                    color={itemColors[idx % itemColors.length]}
                  />
                ))}
              </Canvas>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
