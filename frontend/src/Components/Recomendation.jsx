import { useState } from "react";
import axios from "axios";
import { blink } from "../Baselink";
import Papa from "papaparse";
import { FaUpload, FaEye, FaEyeSlash, FaFileCsv } from "react-icons/fa";
import ItemVisualizer3D from "./Utility/ItemVisualizer";
import { Loader } from "lucide-react";

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

const defaultContainer = {
    container_id: "",
    zone: "",
    width: null,
    depth: null,
    height: null,
};

export default function Recommendation() {
    const [containers, setContainers] = useState([{ ...defaultContainer }]);
    const [items, setItems] = useState([{ ...defaultItem }]);
    const [status, setStatus] = useState("");
    const [placements, setPlacements] = useState([]);
    const [containerPreview, setContainerPreview] = useState([]);
    const [itemPreview, setItemPreview] = useState([]);
    const [showContainerPreview, setShowContainerPreview] = useState(false);
    const [showItemPreview, setShowItemPreview] = useState(false);
    const [containerFileName, setContainerFileName] = useState("");
    const [itemFileName, setItemFileName] = useState("");


    const [updateStatus, setUpdateStatus] = useState(false);
    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;
        setItems(updated);
    };

    const handleContainerChange = (index, field, value) => {
        const updated = [...containers];
        updated[index][field] = value;
        setContainers(updated);
    };

    const handleItemsCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setItemFileName(file.name);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => {
                // Normalize headers to match expected property names
                const headerMap = {
                    "Item ID": "item_id",
                    "Name": "name",
                    "Width (cm)": "width",
                    "Depth (cm)": "depth",
                    "Height (cm)": "height",
                    "Mass (kg)": "mass",
                    "Priority (1-100)": "priority",
                    "Expiry Date (ISO Format)": "expiry_date",
                    "Usage Limit": "usage_limit",
                    "Preferred Zone": "preferred_zone",
                    "Usage Count": "usage_count" // Optional, as it may not be in CSV
                };
                // Normalize header by removing extra spaces and matching case-insensitively
                const normalized = header.trim().toLowerCase();
                for (const [csvHeader, propName] of Object.entries(headerMap)) {
                    if (csvHeader.toLowerCase() === normalized || normalized === propName) {
                        return propName;
                    }
                }
                return normalized.replace(/\s+/g, "_"); // Fallback: replace spaces with underscores
            },
            complete: function (results) {
                const parsed = results.data;
                const newItems = [];

                parsed.forEach((row) => {
                    if (row.item_id) {
                        newItems.push({
                            item_id: row.item_id || "",
                            name: row.name || "",
                            width: parseFloat(row.width) || null,
                            depth: parseFloat(row.depth) || null,
                            height: parseFloat(row.height) || null,
                            mass: parseFloat(row.mass) || null,
                            priority: parseInt(row.priority) || null,
                            expiry_date: row.expiry_date ? `${row.expiry_date}T00:00:00` : "",
                            usage_limit: row.usage_limit ? parseInt(row.usage_limit.replace(" uses", "")) || null : null,
                            usage_count: parseInt(row.usage_count) || null, // Handle missing usage_count
                            preferred_zone: row.preferred_zone || "",
                        });
                    }
                });

                if (newItems.length > 0) {
                    setItems(newItems);
                    setItemPreview(parsed);
                    setShowItemPreview(true);
                    setStatus("Items CSV uploaded successfully.");
                } else {
                    setStatus("No valid items found in CSV.");
                }
            },
            error: function (error) {
                console.error("Error parsing items CSV:", error);
                setStatus("Failed to parse Items CSV.");
                setItemPreview([]);
                setShowItemPreview(false);
            },
        });
    };

    const handleContainersCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setContainerFileName(file.name);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => {
                // Normalize headers to match expected property names
                const headerMap = {
                    "Container ID": "container_id",
                    "Zone": "zone",
                    "Width(cm)": "width",
                    "Depth(cm)": "depth",
                    "Height(cm)": "height"
                };
                // Normalize header by removing extra spaces and matching case-insensitively
                const normalized = header.trim().toLowerCase().replace(/\(cm\)/g, "");
                for (const [csvHeader, propName] of Object.entries(headerMap)) {
                    if (csvHeader.toLowerCase().replace(/\(cm\)/g, "") === normalized || normalized === propName) {
                        return propName;
                    }
                }
                return normalized.replace(/\s+/g, "_"); // Fallback: replace spaces with underscores
            },
            complete: function (results) {
                const parsed = results.data;
                const newContainers = [];

                parsed.forEach((row) => {
                    if (row.container_id) {
                        newContainers.push({
                            container_id: row.container_id || "",
                            zone: row.zone || "",
                            width: parseFloat(row.width) || null,
                            depth: parseFloat(row.depth) || null,
                            height: parseFloat(row.height) || null,
                        });
                    }
                });

                if (newContainers.length > 0) {
                    setContainers(newContainers);
                    setContainerPreview(parsed);
                    setShowContainerPreview(true);
                    setStatus("Containers CSV uploaded successfully.");
                } else {
                    setStatus("No valid containers found in CSV.");
                }
            },
            error: function (error) {
                console.error("Error parsing containers CSV:", error);
                setStatus("Failed to parse Containers CSV.");
                setContainerPreview([]);
                setShowContainerPreview(false);
            },
        });
    };

    const handleAddItem = () => setItems([...items, { ...defaultItem }]);
    const handleAddContainer = () => setContainers([...containers, { ...defaultContainer }]);

    const handleDeleteItem = (index) => setItems(items.filter((_, i) => i !== index));
    const handleDeleteContainer = (index) => setContainers(containers.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        setUpdateStatus(prev => !prev);
        try {
            const payload = {
                containers: containers.map(c => ({
                    container_id: c.container_id,
                    zone: c.zone,
                    width: c.width,
                    depth: c.depth,
                    height: c.height
                })),
                items
            };

            console.log("Payload:", payload);
            const response = await axios.post(`${blink}/placement`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log("Response:", response.data);
            setPlacements(response.data.placements || []);
            setStatus("Items placed successfully.");
            setUpdateStatus(false);
        } catch (err) {
            console.error(err);
            setStatus("Failed to place items.");
            setPlacements([]);
            setUpdateStatus(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 pt-24">
            <div className="mt-20"></div>
            <h1 className="text-3xl font-bold text-center mb-8">Item Placement Recommendation</h1>

            {/* CONTAINERS SECTION */}
            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4 text-center">Container Details</h2>
                {containers.map((container, idx) => (
                    <div key={idx} className="flex justify-center">
                        <div className="flex flex-wrap gap-3 bg-white p-4 rounded shadow mb-4 relative group max-w-5xl mx-auto">
                            <input type="text" placeholder="Container ID" value={container.container_id}
                                onChange={(e) => handleContainerChange(idx, "container_id", e.target.value)}
                                className="input w-36 border px-2 py-1 rounded text-sm" />
                            <input type="text" placeholder="Zone" value={container.zone}
                                onChange={(e) => handleContainerChange(idx, "zone", e.target.value)}
                                className="input w-28 border px-2 py-1 rounded text-sm" />
                            <input type="number" placeholder="Width" value={container.width}
                                onChange={(e) => handleContainerChange(idx, "width", parseFloat(e.target.value))}
                                className="input w-20 border px-2 py-1 rounded text-sm" />
                            <input type="number" placeholder="Depth" value={container.depth}
                                onChange={(e) => handleContainerChange(idx, "depth", parseFloat(e.target.value))}
                                className="input w-20 border px-2 py-1 rounded text-sm" />
                            <input type="number" placeholder="Height" value={container.height}
                                onChange={(e) => handleContainerChange(idx, "height", parseFloat(e.target.value))}
                                className="input w-20 border px-2 py-1 rounded text-sm" />
                            <button onClick={() => handleDeleteContainer(idx)}
                                className="absolute top-2 right-2 hidden group-hover:inline-block bg-red-500 text-white px-2 py-1 text-sm rounded">
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                <div className="flex justify-center">
                    <button onClick={handleAddContainer}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        Add Container
                    </button>
                </div>
            </section>

            {/* ITEMS SECTION */}
            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4 text-center">Item Details</h2>
                {items.map((item, idx) => (
                    <div key={idx} className="flex justify-center">
                        <div className="flex flex-wrap gap-3 bg-white p-4 rounded shadow mb-4 relative group max-w-6xl mx-auto">
                            <input type="text" placeholder="Item ID" value={item.item_id}
                                onChange={(e) => handleItemChange(idx, "item_id", e.target.value)}
                                className="input w-28 border px-2 py-1 rounded text-sm" />
                            <input type="text" placeholder="Name" value={item.name}
                                onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                                className="input w-36 border px-2 py-1 rounded text-sm" />
                            <input type="number" placeholder="Width" value={item.width}
                                onChange={(e) => handleItemChange(idx, "width", parseFloat(e.target.value))}
                                className="input w-20 border px-2 py-1 rounded text-sm" />
                            <input type="number" placeholder="Depth" value={item.depth}
                                onChange={(e) => handleItemChange(idx, "depth", parseFloat(e.target.value))}
                                className="input w-20 border px-2 py-1 rounded text-sm" />
                            <input type="number" placeholder="Height" value={item.height}
                                onChange={(e) => handleItemChange(idx, "height", parseFloat(e.target.value))}
                                className="input w-20 border px-2 py-1 rounded text-sm" />
                            <input type="number" placeholder="Mass" value={item.mass}
                                onChange={(e) => handleItemChange(idx, "mass", parseFloat(e.target.value))}
                                className="input w-24 border px-2 py-1 rounded text-sm" />
                            <input type="number" placeholder="Priority" value={item.priority}
                                onChange={(e) => handleItemChange(idx, "priority", parseInt(e.target.value))}
                                className="input w-24 border px-2 py-1 rounded text-sm" />
                            <input type="date" value={item.expiry_date?.split("T")[0] || ""}
                                onChange={(e) => handleItemChange(idx, "expiry_date", `${e.target.value}T00:00:00`)}
                                className="input w-40 border px-2 py-1 rounded text-sm" />
                            <input type="number" placeholder="Usage Limit" value={item.usage_limit}
                                onChange={(e) => handleItemChange(idx, "usage_limit", parseInt(e.target.value))}
                                className="input w-28 border px-2 py-1 rounded text-sm" />
                            <input type="number" placeholder="Usage Count" value={item.usage_count}
                                onChange={(e) => handleItemChange(idx, "usage_count", parseInt(e.target.value))}
                                className="input w-28 border px-2 py-1 rounded text-sm" />
                            <input type="text" placeholder="Preferred Zone" value={item.preferred_zone}
                                onChange={(e) => handleItemChange(idx, "preferred_zone", e.target.value)}
                                className="input w-36 border px-2 py-1 rounded text-sm" />
                            <button onClick={() => handleDeleteItem(idx)}
                                className="absolute top-2 right-2 hidden group-hover:inline-block bg-red-500 text-white px-2 py-1 text-sm rounded">
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                <div className="flex justify-center">
                    <button onClick={handleAddItem}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        Add Item
                    </button>
                </div>
            </section>

            <div className="flex flex-row justify-center items-start gap-6 mb-6 flex-wrap">
                {/* CONTAINER CSV UPLOAD AND PREVIEW */}
                <section className="w-full sm:w-1/2 lg:w-1/3 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4 text-center">Upload Containers CSV</h2>
                    <div className="flex justify-center items-center gap-6 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                            <FaUpload />
                            Choose CSV File
                            <input type="file" accept=".csv" onChange={handleContainersCSVUpload} className="hidden" />
                        </label>
                        {containerPreview.length > 0 && (
                            <button
                                onClick={() => setShowContainerPreview(!showContainerPreview)}
                                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                            >
                                {showContainerPreview ? <FaEyeSlash /> : <FaEye />}
                                {showContainerPreview ? "Hide Preview" : "Show Preview"}
                            </button>
                        )}
                    </div>
                    {containerFileName && (
                        <p className="text-center text-sm text-gray-600 mb-3">Uploaded: {containerFileName}</p>
                    )}
                    {showContainerPreview && containerPreview.length > 0 && (
                        <div className="overflow-hidden max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <FaFileCsv /> Containers Preview
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto border-collapse">
                                    <thead>
                                        <tr className="bg-gray-200 sticky top-0">
                                            {Object.keys(containerPreview[0]).map((key) => (
                                                <th key={key} className="border px-4 py-3 text-sm font-semibold text-left">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {containerPreview.map((row, idx) => (
                                            <tr key={idx} className="even:bg-gray-50 hover:bg-gray-100">
                                                {Object.values(row).map((value, i) => (
                                                    <td key={i} className="border px-4 py-2 text-sm">{value}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>

                {/* ITEM CSV UPLOAD AND PREVIEW */}
                <section className="w-full sm:w-1/2 lg:w-1/3 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4 text-center">Upload Items CSV</h2>
                    <div className="flex justify-center items-center gap-6 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                            <FaUpload />
                            Choose CSV File
                            <input type="file" accept=".csv" onChange={handleItemsCSVUpload} className="hidden" />
                        </label>
                        {itemPreview.length > 0 && (
                            <button
                                onClick={() => setShowItemPreview(!showItemPreview)}
                                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                            >
                                {showItemPreview ? <FaEyeSlash /> : <FaEye />}
                                {showItemPreview ? "Hide Preview" : "Show Preview"}
                            </button>
                        )}
                    </div>
                    {itemFileName && (
                        <p className="text-center text-sm text-gray-600 mb-3">Uploaded: {itemFileName}</p>
                    )}
                    {showItemPreview && itemPreview.length > 0 && (
                        <div className="overflow-hidden max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <FaFileCsv /> Items Preview
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto border-collapse">
                                    <thead>
                                        <tr className="bg-gray-200 sticky top-0">
                                            {Object.keys(itemPreview[0]).map((key) => (
                                                <th key={key} className="border px-4 py-3 text-sm font-semibold text-left">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemPreview.map((row, idx) => (
                                            <tr key={idx} className="even:bg-gray-50 hover:bg-gray-100">
                                                {Object.values(row).map((value, i) => (
                                                    <td key={i} className="border px-4 py-2 text-sm">{value}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </div>



            {/* SUBMIT */}
            <div className="text-center mb-10">
                {updateStatus ? (
                    <div className="flex justify-center items-center gap-2">
                        <span>Loading...</span>
                        <Loader size={30}/>

                    </div>
                ) :(

                <button onClick={handleSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded text-lg">
                    Submit for Placement
                </button>
                ) }
                {status && <p className="mt-4 text-lg text-blue-700 font-medium">{status}</p>}
            </div>

            {/* PLACEMENTS RESULT */}
            {placements.length > 0 && (
                <>
                    <section className="bg-white p-6 rounded shadow">
                        <h2 className="text-xl font-semibold mb-4 text-center">Item Placements</h2>
                        <ul className="space-y-4">
                            {placements.map((placement, idx) => (
                                <li key={idx} className="border p-4 rounded">
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
                                        <p className="text-red-500 font-semibold mt-1">
                                            ⚠️ Marked as waste: {placement.waste_reason || "No reason given"}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                    <ItemVisualizer3D items={placements} />

                </>
            )}
        </div>
    );
}