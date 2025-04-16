import { useState } from "react";
import axios from "axios";
import { blink } from "../Baselink";

const defaultItem = {
    item_id: "",
    name: "",
    width: null,
    depth: null,
    height: null,
    mass: null,
    priority: null,
    expiry_date: "",
    usage_limit: null,
    usage_count: null,
    preferred_zone: "",
};

export default function Recommendation() {
    const [items, setItems] = useState([{ ...defaultItem }]);
    const [status, setStatus] = useState("");
    const [placements, setPlacements] = useState([]);

    const handleChange = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;
        setItems(updated);
    };

    const handleAddItem = () => {
        setItems([...items, { ...defaultItem }]);
    };

    const handleDeleteItem = (index) => {
        const updated = items.filter((_, i) => i !== index);
        setItems(updated);
    };

    const handleSubmit = async () => {
        try {
            const res = await axios.post(`${blink}/placement`, items);
            console.log(res.data);
            setStatus("Items submitted successfully!");
            setPlacements(res.data.placements); // <-- Save placements
        } catch (err) {
            console.error(err);
            setStatus("Submission failed!");
            setPlacements([]); // clear placements if failed
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h1 className="text-2xl mt-24 font-bold mb-6 text-center">Item Placement Recomendation</h1>

            <div className="space-y-4">
                {items.map((item, idx) => (
                    <div className="flex justify-center">

                    <div
                        key={idx}
                        className="flex flex-wrap items-center bg-white rounded-lg shadow-sm p-3 hover:bg-gray-100 relative group"
                    >
                        <div className="flex flex-wrap gap-3 w-full">
                            <input
                                type="text"
                                placeholder="Item ID"
                                value={item.item_id}
                                onChange={(e) => handleChange(idx, "item_id", e.target.value)}
                                className="input w-28 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="text"
                                placeholder="Name"
                                value={item.name}
                                onChange={(e) => handleChange(idx, "name", e.target.value)}
                                className="input w-36 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="number"
                                placeholder="Width"
                                value={item.width}
                                onChange={(e) => handleChange(idx, "width", parseFloat(e.target.value))}
                                className="input w-20 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="number"
                                placeholder="Depth"
                                value={item.depth}
                                onChange={(e) => handleChange(idx, "depth", parseFloat(e.target.value))}
                                className="input w-20 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="number"
                                placeholder="Height"
                                value={item.height}
                                onChange={(e) => handleChange(idx, "height", parseFloat(e.target.value))}
                                className="input w-20 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="number"
                                placeholder="Mass"
                                value={item.mass}
                                onChange={(e) => handleChange(idx, "mass", parseFloat(e.target.value))}
                                className="input w-24 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="number"
                                placeholder="Priority"
                                value={item.priority}
                                onChange={(e) => handleChange(idx, "priority", parseInt(e.target.value))}
                                className="input w-24 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="date"
                                value={item.expiry_date?.split("T")[0] || ""}
                                pplaceholder="Expiry Date"
                                onChange={(e) => handleChange(idx, "expiry_date", `${e.target.value}T00:00:00`)}
                                className="input w-40 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="number"
                                placeholder="Limit"
                                value={item.usage_limit}
                                onChange={(e) => handleChange(idx, "usage_limit", parseInt(e.target.value))}
                                className="input w-24 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="number"
                                placeholder="Count"
                                value={item.usage_count}
                                onChange={(e) => handleChange(idx, "usage_count", parseInt(e.target.value))}
                                className="input w-24 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="text"
                                placeholder="Preffered1 Zone"
                                value={item.preferred_zone}
                                onChange={(e) => handleChange(idx, "preferred_zone", e.target.value)}
                                className="input w-32 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        {/* Delete button on hover */}
                        <button
                            onClick={() => handleDeleteItem(idx)}
                            className="absolute top-2 right-2 hidden group-hover:inline-block bg-red-500 text-white text-sm px-2 py-1 rounded"
                        >
                            Delete
                        </button>
                    </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-center gap-4">
                <button
                    onClick={handleAddItem}
                    className="bg-white hover:bg-gray-300 text-black border-2 border-black px-4 py-2 rounded"
                    >
                    Add Another Item
                </button>
                <button
                    onClick={handleSubmit}
                    className="bg-white hover:bg-gray-300 text-black border-2 border-black px-4 py-2 rounded"
                    >
                    Submit
                </button>
            </div>

            {/* Status message */}
            {status && <p className="mt-4 text-blue-600 font-medium text-center">{status}</p>}

            {placements.length > 0 && (
                <div className="mt-6 bg-white p-4 rounded shadow-md">
                    <h2 className="text-lg font-semibold mb-4 text-center">Item Placements</h2>
                    <ul className="space-y-3">
                        {placements.map((placement, idx) => (
                            <li key={idx} className="border border-gray-200 p-3 rounded">
                                <p className="font-medium">{placement.name} (ID: {placement.item_id})</p>
                                <p>Container ID: <span className="font-mono">{placement.container_id}</span></p>
                                <p>Position:</p>
                                <ul className="ml-4 text-sm">
                                    <li>
                                        Start → Width: {placement.position.start_coordinates.width}, Depth: {placement.position.start_coordinates.depth}, Height: {placement.position.start_coordinates.height}
                                    </li>
                                    <li>
                                        End → Width: {placement.position.end_coordinates.width}, Depth: {placement.position.end_coordinates.depth}, Height: {placement.position.end_coordinates.height}
                                    </li>
                                </ul>
                                {placement.is_waste && (
                                    <p className="text-red-500 font-semibold mt-1">⚠️ Marked as waste: {placement.waste_reason || "No reason given"}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

        </div>
    );
}
