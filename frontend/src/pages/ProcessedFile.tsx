import React, { useEffect, useState } from 'react';

const ProcessedFile: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProcessedFile = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/view-processed-file');
        if (response.ok) {
          const result = await response.json();
          setData(result.data);
        } else {
          alert('Failed to fetch processed file.');
        }
      } catch (error) {
        console.error('Error fetching processed file:', error);
        alert('Error fetching processed file.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcessedFile();
  }, []);

  const handleDownload = () => {
    window.location.href = 'http://localhost:8000/api/process-data';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Processed File</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
            <thead>
              <tr>
                {data.length > 0 &&
                  Object.keys(data[0]).map((key) => (
                    <th key={key} className="border border-gray-300 px-4 py-2 text-left">
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, idx) => (
                    <td key={idx} className="border border-gray-300 px-4 py-2">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={handleDownload}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download Processed File
          </button>
        </>
      )}
    </div>
  );
};

export default ProcessedFile;
