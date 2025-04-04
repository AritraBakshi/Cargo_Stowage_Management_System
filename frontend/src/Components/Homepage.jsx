import { useState } from "react";
import Papa from "papaparse";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === "text/csv") {
      setFile(uploadedFile);
      parseCSV(uploadedFile);
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-center mb-4">Upload Items & Containers</h1>
        <label className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500">
          <input type="file" className="hidden" onChange={handleFileChange} accept=".csv" />
          {file ? <p className="text-green-600">{file.name}</p> : <p>Click or drag a CSV file here to upload</p>}
        </label>
        {
            file ? (
                <div className=" flex justify-center  max-w-2xl pt-2.5 ">
                <button className="p-3 rounded-2xl bg-blue-500" onClick={()=>{console.log("uploaded file is", file)}} > Submit </button>
            </div>
            ) : (null)
        }

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
                    <th key={index} className="p-2 border">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    {Object.values(row).map((value, colIndex) => (
                      <td key={colIndex} className="p-2 border">{value}</td>
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
