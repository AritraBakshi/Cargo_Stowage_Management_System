import { useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import Container3DView from "../Components/Utility/ContainerGraph";
export default function ItemPlacementWithContainerDetailsCSV() {
    const [formData, setFormData] = useState({
        itemId: "",
        userId: "",
        containerId: "",
        start: { width: 0, depth: 0, height: 0 },
        end: { width: 0, depth: 0, height: 0 },
    });

    const [status, setStatus] = useState(null);
    const [batchStatus, setBatchStatus] = useState(null);
    const [csvFile, setCsvFile] = useState(null);

    const [csvPreview, setCsvPreview] = useState([]);


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

    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
          setCsvFile(file);
      
          // Parse and preview top 5 rows
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              setCsvPreview(results.data.slice(0, 5)); // Limit to 5 rows
            },
          });
        }
      };
      
    const handleCsvSubmit = async (e) => {
        e.preventDefault();
        if (!csvFile) {
            setBatchStatus("error: no file selected");
            return;
        }

        setBatchStatus("loading");

        Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: async (result) => {
                const items = result.data.map((row) => ({
                    itemId: row.itemId,
                    userId: row.userId,
                    timestamp: row.timestamp || new Date().toISOString(),
                    containerId: row.containerId,
                    position: {
                        start_coordinates: {
                            width: Number(row.start_width),
                            depth: Number(row.start_depth),
                            height: Number(row.start_height),
                        },
                        end_coordinates: {
                            width: Number(row.end_width),
                            depth: Number(row.end_depth),
                            height: Number(row.end_height),
                        },
                    },
                }));

                const payload = { items };

                try {
                    const res = await axios.post("http://localhost:8000/api/batch-place", payload);
                    console.log("Batch placement response:", res.data);
                    setBatchStatus(res.data.success ? "success" : `failed: ${res.data.message}`);
                } catch (error) {
                    console.error("Batch placement error:", error);
                    setBatchStatus("error: failed to process batch");
                }
            },
            error: (error) => {
                console.error("CSV parse error:", error);
                setBatchStatus("error: failed to parse CSV");
            },
        });
    };

    return (
<div className="w-full mt-20 min-h-screen px-6 py-10 bg-gray-50 text-gray-800">
  <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 h-full">
    {/* Left Panel - Placement + CSV */}
    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-6">Place an Item</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        name="itemId"
                        placeholder="Item ID"
                        className="w-full border p-2 rounded"
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="userId"
                        placeholder="User ID"
                        className="w-full border p-2 rounded"
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="containerId"
                        placeholder="Container ID"
                        className="w-full border p-2 rounded"
                        onChange={handleChange}
                    />

                    <div className="grid grid-cols-3 gap-2">
                        <input
                            type="number"
                            name="start.width"
                            placeholder="Start Width"
                            className="border p-2 rounded"
                            onChange={handleChange}
                        />
                        <input
                            type="number"
                            name="start.depth"
                            placeholder="Start Depth"
                            className="border p-2 rounded"
                            onChange={handleChange}
                        />
                        <input
                            type="number"
                            name="start.height"
                            placeholder="Start Height"
                            className="border p-2 rounded"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <input
                            type="number"
                            name="end.width"
                            placeholder="End Width"
                            className="border p-2 rounded"
                            onChange={handleChange}
                        />
                        <input
                            type="number"
                            name="end.depth"
                            placeholder="End Depth"
                            className="border p-2 rounded"
                            onChange={handleChange}
                        />
                        <input
                            type="number"
                            name="end.height"
                            placeholder="End Height"
                            className="border p-2 rounded"
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                    >
                        Submit Placement
                    </button>
                    {status === "loading" && <p className="text-blue-500 mt-2">Placing item...</p>}
                    {status === "success" && (
                        <p className="text-green-600 mt-2">Item placed successfully!</p>
                    )}
                    {status === "error" && (
                        <p className="text-red-600 mt-2">Failed to place item. Check inputs or server.</p>
                    )}
                </form>

      <div className="mt-8 border-t pt-6 flex-grow">
        <h2 className="text-xl font-bold mb-4">Batch Place Items via CSV</h2>
        <form onSubmit={handleCsvSubmit} className="space-y-4">
          <input type="file" accept=".csv" onChange={handleCsvUpload} className="w-full border p-2 rounded" />
          <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
            Upload and Place Items
          </button>
        </form>

        {/* Status messages */}
        {batchStatus === "loading" && <p className="text-blue-500 mt-2">Processing batch placement...</p>}
        {batchStatus === "success" && <p className="text-green-600 mt-2">Batch placement successful!</p>}
        {(batchStatus?.startsWith("error") || batchStatus?.startsWith("failed")) && (
          <p className="text-red-600 mt-2">{batchStatus}</p>
        )}

        {/* CSV Preview */}
        {csvPreview.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-2">CSV Preview (first 5 rows)</h3>
            <div className="overflow-auto max-h-60 border rounded text-xs">
              <table className="w-full table-auto border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(csvPreview[0]).map((key, index) => (
                      <th key={index} className="border px-2 py-1">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((val, colIndex) => (
                        <td key={colIndex} className="border px-2 py-1">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Right Panel - Container Details */}
    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-6">Container Details</h2>

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

      {containerError && <p className="text-red-600">{containerError}</p>}

      {containerDetails && (
        <div className="text-sm space-y-2 flex flex-col flex-grow">
          <p><strong>Zone:</strong> {containerDetails.zone}</p>
          <p><strong>Dimensions:</strong> {containerDetails.dimensions.width} × {containerDetails.dimensions.depth} × {containerDetails.dimensions.height} cm</p>
          <p><strong>Occupied Volume:</strong> {containerDetails.occupied_volume.toFixed(2)} cm³</p>
          <p><strong>Items in Container:</strong> {containerDetails.items.length}</p>

          <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 flex-grow">
            {containerDetails.items.map((item, idx) => (
              <div key={idx} className="border-b py-1">
                <p><strong>{item.name}</strong> (ID: {item.item_id})</p>
                <p className="text-xs text-gray-600">Zone: {item.preferred_zone}, Priority: {item.priority}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-sm mb-2">3D Container View</h3>
            <Container3DView container={containerDetails} />
          </div>
        </div>
      )}
    </div>
  </div>
</div>

    );
}