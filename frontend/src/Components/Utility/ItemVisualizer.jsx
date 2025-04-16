import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Text } from "@react-three/drei";

const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const ItemBox = ({ item, index }) => {
  const {  dimensions, name } = item;
  console.log(item)
  const position = [
    item.position.start_coordinates.width + dimensions.width / 2,
    item.position.start_coordinates.height + dimensions.height / 2,
    item.position.start_coordinates.depth + dimensions.depth / 2,
  ];

  return (
    <group>
      <Box args={[dimensions.width, dimensions.height, dimensions.depth]} position={position}>
        <meshStandardMaterial color={colors[index % colors.length]} transparent opacity={0.7} />
      </Box>
      <Text
        position={[position[0], position[1] + dimensions.height / 2 + 2, position[2]]}
        fontSize={2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
};

const ItemVisualizer3D = ({ items }) => {
  const [selectedContainer, setSelectedContainer] = useState(null);

  const containerOptions = [...new Set(items.map((item) => item.container_id))];

  const filteredItems = selectedContainer
    ? items.filter((item) => item.container_id === selectedContainer)
    : [];

    console.log("Filtered Items:", filteredItems); // Debugging line

  return (
    <div className="w-full h-[80vh]">
      <div className="mb-4">
        <label htmlFor="container" className="font-bold">Select Container:</label>
        <select
          id="container"
          className="ml-2 border p-2"
          onChange={(e) => setSelectedContainer(e.target.value)}
        >
          <option value="">-- Choose --</option>
          {containerOptions.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      <Canvas camera={{ position: [50, 50, 50], fov: 50 }}>
        <ambientLight />
        <pointLight position={[100, 100, 100]} />
        <OrbitControls />
        {filteredItems.map((item, i) => (
          <ItemBox key={item.item_id} item={item} index={i} />
        ))}
      </Canvas>
    </div>
    
  );
};

export default ItemVisualizer3D;
