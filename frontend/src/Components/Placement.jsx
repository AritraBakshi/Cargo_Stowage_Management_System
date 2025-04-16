import { useState } from "react";
import axios from "axios";
import Container3DView from "./Utility/ContainerGraph";
export default function ItemPlacementWithContainerDetails() {
    const [formData, setFormData] = useState({
        itemId: "",
        userId: "",
        containerId: "",
        start: { width: 0, depth: 0, height: 0 },
        end: { width: 0, depth: 0, height: 0 },
    });

    const [status, setStatus] = useState(null);

    const [containerIdQuery, setContainerIdQuery] = useState("");
    const [containerDetails, setContainerDetails] = useState(null);
    const [containerError, setContainerError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes(".")) {
            const [section, key] = name.split(".");
            setFormData((prev) => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [key]: Number(value),
                },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");

        const payload = {
            itemId: formData.itemId,
            userId: formData.userId,
            timestamp: new Date().toISOString(),
            containerId: formData.containerId,
            position: {
                start_coordinates: formData.start,
                end_coordinates: formData.end,
            },
        };

        try {
            const res = await axios.post("http://localhost:8000/api/place", payload);
            setStatus(res.data.success ? "success" : "failed");
        } catch (error) {
            console.error("Placement error:", error);
            setStatus("error");
        }
    };

    const fetchContainerDetails = async () => {
        setContainerError(null);
        setContainerDetails(null);
        if (!containerIdQuery) return;

        try {
            const res = await axios.get(`http://localhost:8000/api/containers/${containerIdQuery}`);
            setContainerDetails(res.data.container);
        } catch (err) {
            console.error(err);
            setContainerError("Container not found or failed to fetch.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Item Placement Form */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Place an Item</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" name="itemId" placeholder="Item ID" className="w-full border p-2 rounded" onChange={handleChange} />
                        <input type="text" name="userId" placeholder="User ID" className="w-full border p-2 rounded" onChange={handleChange} />
                        <input type="text" name="containerId" placeholder="Container ID" className="w-full border p-2 rounded" onChange={handleChange} />

                        <div className="grid grid-cols-3 gap-2">
                            <input type="number" name="start.width" placeholder="Start Width" className="border p-2 rounded" onChange={handleChange} />
                            <input type="number" name="start.depth" placeholder="Start Depth" className="border p-2 rounded" onChange={handleChange} />
                            <input type="number" name="start.height" placeholder="Start Height" className="border p-2 rounded" onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <input type="number" name="end.width" placeholder="End Width" className="border p-2 rounded" onChange={handleChange} />
                            <input type="number" name="end.depth" placeholder="End Depth" className="border p-2 rounded" onChange={handleChange} />
                            <input type="number" name="end.height" placeholder="End Height" className="border p-2 rounded" onChange={handleChange} />
                        </div>

                        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Submit Placement</button>
                        {status === "loading" && <p className="text-blue-500 mt-2">Placing item...</p>}
                        {status === "success" && <p className="text-green-600 mt-2">Item placed successfully!</p>}
                        {status === "error" && <p className="text-red-600 mt-2">Failed to place item. Check inputs or server.</p>}
                    </form>
                </div>

                {/* Container Details Fetch */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Container Details</h2>
                    <div className="flex space-x-2 mb-4">
                        <input
                            type="text"
                            placeholder="Enter Container ID"
                            className="w-full border p-2 rounded"
                            value={containerIdQuery}
                            onChange={(e) => setContainerIdQuery(e.target.value)}
                        />
                        <button
                            onClick={fetchContainerDetails}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Get Info
                        </button>
                    </div>

                    {containerError && <p className="text-red-500">{containerError}</p>}

                    {containerDetails && (
                        <div className="text-sm space-y-2">
                            <p><strong>Zone:</strong> {containerDetails.zone}</p>
                            <p><strong>Dimensions:</strong> {containerDetails.dimensions.width} × {containerDetails.dimensions.depth} × {containerDetails.dimensions.height} cm</p>
                            <p><strong>Occupied Volume:</strong> {containerDetails.occupied_volume.toFixed(2)} cm³</p>
                            <p><strong>Items in Container:</strong> {containerDetails.items.length}</p>

                            <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2">
                                {containerDetails.items.map((item, idx) => (
                                    <div key={idx} className="border-b py-1">
                                        <p><strong>{item.name}</strong> (ID: {item.item_id})</p>
                                        <p className="text-xs text-gray-600">Zone: {item.preferred_zone}, Priority: {item.priority}</p>
                                    </div>
                                ))}
                            </div>
                            {
                                containerDetails ? (
                                    <div className="mt-4">
                                        <h3 className="font-semibold text-sm mb-1">3D Container View</h3>
                                        <Container3DView container={containerDetails} />
                                    </div>
                                ) : (null)
                            }
                        </div>
                    )}
                </div>
            </div>
    );
}
