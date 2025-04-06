import { useState } from "react";
import Papa from "papaparse";
import axios from "axios";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isItemUpload, setIsItemUpload] = useState(false); // default is container upload

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === "text/csv") {
      setFile(uploadedFile);
      parseCSV(uploadedFile);
      setUploadStatus("");
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

  const parseCSV = (file) => {
    Papa.parse(file, {
      complete: (result) => {
        setData(result.data);
      },
      header: true,
      skipEmptyLines: true,
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const endpoint = isItemUpload
      ? "http://127.0.0.1:8000/api/import/items"
      : "http://127.0.0.1:8000/api/import/containers";

    try {
      const res = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Server Response:", res.data);
      setUploadStatus(res.data.message || "File uploaded successfully!");
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadStatus("Failed to upload file.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-center mb-4">
          Upload Items & Containers
        </h1>

        {/* Checkbox for Items */}
        <div className="flex items-center justify-center mb-4">
          <input
            id="isItem"
            type="checkbox"
            checked={isItemUpload}
            onChange={(e) => setIsItemUpload(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="isItem" className="text-sm text-gray-700">
            Uploading <span className="font-semibold">{isItemUpload ? "Items" : "Containers"}</span>
          </label>
        </div>

        <label className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500">
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".csv"
          />
          {file ? (
            <p className="text-green-600">{file.name}</p>
          ) : (
            <p>Click or drag a CSV file here to upload</p>
          )}
        </label>

        {file && (
          <div className="flex justify-center pt-4">
            <button
              className="p-3 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 transition"
              onClick={handleUpload}
            >
              Submit
            </button>
          </div>
        )}

        {uploadStatus && (
          <p className="mt-4 text-center text-sm font-medium text-blue-600">
            {uploadStatus}
          </p>
        )}
      </div>

      {/* Display CSV Data */}
      {data.length > 0 && (
        <div className="mt-6 w-3xl bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">CSV Preview</h2>
          <div className="overflow-auto max-h-60 border rounded">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  {Object.keys(data[0]).map((key, index) => (
                    <th key={index} className="p-2 border">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    {Object.values(row).map((value, colIndex) => (
                      <td key={colIndex} className="p-2 border">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
