import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Download, ArrowLeft, ArrowRight, FileSpreadsheet, Eye, Home, BarChart3, Table, Database, Bot } from "lucide-react";
import { useTheme } from '../App';
import { API_BASE_URL } from '../api/config';
import { getCurrentUserToken } from '../firebase/auth';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Preview: React.FC = () => {
  const { isDarkMode } = useTheme();
  const query = useQuery();
  const navigate = useNavigate();
  const fileId = query.get("file_id") || "";
  const [data, setData] = useState<any[]>([]);
  const [pivotTables, setPivotTables] = useState<any[]>([]);
  const [hasDashboard, setHasDashboard] = useState(false);
  const [sheets, setSheets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cleaned' | 'pivot' | 'dashboard'>('cleaned');

  // Pagination
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // 🔹 Example: process file request
  const handleProcess = async () => {
    try {
      const btn = document.getElementById('reprocess-btn');
      if (btn) {
        btn.setAttribute('disabled', 'true');
        btn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> <span class="hidden sm:inline">Re-Processing...</span>';
      }

      const token = await getCurrentUserToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      formData.append('remove_fields', '');
      formData.append('number_of_relations', '3');
      formData.append('description', 'Reprocessed from preview');
      formData.append('require_dashboard', 'true');

      const res = await fetch(`${API_BASE_URL}/process-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err.message || err.detail || 'Processing failed');
      }

      const json = await res.json();
      const newFileId = json.file_id;
      if (!newFileId) throw new Error('No file_id returned');

      // Navigate to same page with the new file_id to trigger fresh preview
      navigate(`?file_id=${encodeURIComponent(newFileId)}`);
    } catch (err: any) {
      alert(err.message || 'Re-process request failed');
    } finally {
      const btn = document.getElementById('reprocess-btn');
      if (btn) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <span class="hidden sm:inline">Re-Process</span>';
      }
    }
  };

  useEffect(() => {
    if (!fileId) {
      setError("No file specified.");
      setLoading(false);
      return;
    }
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const token = await getCurrentUserToken();
        if (!token) {
          throw new Error('User not authenticated');
        }

        const res = await fetch(
          `${API_BASE_URL}/get-processed-data/${encodeURIComponent(fileId)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to fetch preview");
        }
        const json = await res.json();
        console.log("API Response:", json);
        
        // Extract data from MongoDB structure
        const processedData = json.processed_data || {};
        
        setData(processedData.cleaned_data || []);
        
        // Handle pivot tables from MongoDB structure
        const pivotData = processedData.pivot_tables || [];
        
        // Use structured pivot data directly for Excel-like display
        setPivotTables(pivotData);
        
        // Save relation stats for banner
        const reqR = Number(processedData.requested_relations || 0);
        const genR = Number(processedData.generated_relations || pivotData.length || 0);
        (window as any).__pivot_relations_info = { reqR, genR };
        
        setHasDashboard(processedData.has_dashboard || false);
        setSheets(processedData.sheets || []);
        
        console.log("Processed data from MongoDB:", processedData);
      } catch (err: any) {
        setError(err.message || "Error fetching preview");
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [fileId]);

  const handleDownload = async () => {
    try {
      // Show loading state
      const downloadBtn = document.getElementById('download-btn');
      if (downloadBtn) {
        downloadBtn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> <span class="hidden sm:inline">Downloading...</span>';
        downloadBtn.setAttribute('disabled', 'true');
      }

      const token = await getCurrentUserToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const res = await fetch(
        `${API_BASE_URL}/download-processed-file/${encodeURIComponent(fileId)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to download file");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileId;
      a.click();
      window.URL.revokeObjectURL(url);
      
      // Show success message
     
    } catch (err: any) {
      alert('❌ ' + (err.message || "Download failed"));
    } finally {
      // Reset button
      const downloadBtn = document.getElementById('download-btn');
      if (downloadBtn) {
        downloadBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> <span class="hidden sm:inline">Download XLSX</span>';
        downloadBtn.removeAttribute('disabled');
      }
    }
  };

  if (loading) return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-8 text-center max-w-sm w-full`}>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2`}>Loading Preview...</h3>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Please wait while we fetch your processed data</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-8 text-center max-w-md w-full`}>
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2`}>Error Loading Preview</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-center">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
  
  if (!data.length && !pivotTables.length) return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-8 text-center max-w-md w-full`}>
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-600 text-xl">📄</span>
        </div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2`}>No Data Found</h3>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>The processed file appears to be empty or contains no data.</p>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  const columns = Object.keys(data[0]);

  const start = page * pageSize;
  const pageData = data.slice(start, start + pageSize);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-full mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-4 sm:p-6 mb-6`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
              <div>
                <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Processed File Preview</h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs sm:text-sm break-all`}>File ID: {fileId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-sm flex-1 sm:flex-initial"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
              <button
                id="download-btn"
                onClick={handleDownload}
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm flex-1 sm:flex-initial"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download XLSX</span>
              </button>
              <button
                id="reprocess-btn"
                onClick={handleProcess}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm flex-1 sm:flex-initial"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Re-Process</span>
              </button>
              <button
                onClick={() => {
                  // Set the current file as selected for chat
                  if (fileId) {
                    const currentFile = {
                      file_id: fileId,
                      file_name: `File ${fileId}`,
                      description: 'File from preview page',
                      created_at: new Date().toISOString(),
                      number_of_relations: 0,
                      require_dashboard: hasDashboard,
                      remove_fields: ''
                    };
                    localStorage.setItem('selectedFile', JSON.stringify(currentFile));
                  }
                  navigate('/chat');
                }}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-sm flex-1 sm:flex-initial"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">AI Chat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border mb-6`}>
          <div className=" dark:border-gray-700">
            <nav className="flex items-center justify-between px-4 sm:px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('cleaned')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex-1 ${
                  activeTab === 'cleaned'
                    ? isDarkMode
                      ? 'border-blue-500 text-blue-400'
                      : 'border-blue-500 text-blue-600'
                    : isDarkMode
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Database className="w-6 h-6 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Cleaned Data</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('pivot')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex-1 ${
                  activeTab === 'pivot'
                    ? isDarkMode
                      ? 'border-blue-500 text-blue-400'
                      : 'border-blue-500 text-blue-600'
                    : isDarkMode
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Table className="w-6 h-6 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Pivot Tables</span>
                </div>
              </button>
              
              {hasDashboard && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex-1 ${
                    activeTab === 'dashboard'
                      ? isDarkMode
                        ? 'border-blue-500 text-blue-400'
                        : 'border-blue-500 text-blue-600'
                      : isDarkMode
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <BarChart3 className="w-6 h-6 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </div>
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'cleaned' && (
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border overflow-hidden`}>
          <div className="overflow-x-auto custom-scrollbar" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: isDarkMode ? '#4B5563 #374151' : '#CBD5E1 #F1F5F9'
          }}>
            <style>{`
              .custom-scrollbar::-webkit-scrollbar {
                height: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: ${isDarkMode ? '#374151' : '#F1F5F9'};
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: ${isDarkMode ? '#6B7280' : '#CBD5E1'};
                border-radius: 4px;
                border: 1px solid ${isDarkMode ? '#4B5563' : '#E2E8F0'};
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: ${isDarkMode ? '#9CA3AF' : '#94A3B8'};
              }
              .custom-scrollbar::-webkit-scrollbar-corner {
                background: ${isDarkMode ? '#374151' : '#F1F5F9'};
              }
            `}</style>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  {columns.map((col) => (
                    <th key={col} className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                {pageData.map((row, idx) => (
                  <tr key={idx} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-150`}>
                    {columns.map((col) => (
                      <td key={col} className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Pivot Tables Tab */}
        {activeTab === 'pivot' && (
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border overflow-hidden`}>
            {pivotTables.length > 0 && pivotTables[0].title ? (
              // Proper pivot tables display with actual data
              <div className="space-y-8 p-6">
                {/* Relations info banner */}
                {(() => {
                  const info = (window as any).__pivot_relations_info;
                  if (info && info.reqR > 0 && info.genR < info.reqR) {
                    return (
                      <div className={`mb-4 ${isDarkMode ? 'bg-blue-900/30 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'} border rounded-md px-4 py-3`}>
                        Requested {info.reqR} relations, generated {info.genR}. Showing available relations.
                      </div>
                    );
                  }
                  return null;
                })()}
                {pivotTables.map((pivotTable: any, tableIndex: number) => (
                  <div key={tableIndex} className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg overflow-hidden`}>
                    {/* Pivot Table Title */}
                    <div className={`${isDarkMode ? 'bg-gray-600 text-gray-100' : 'bg-gray-100 text-gray-800'} px-4 py-3 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <h3 className="text-lg font-semibold flex items-center">
                        <Table className="w-5 h-5 mr-2" />
                        {pivotTable.title}
                      </h3>
                    </div>
                    
                    {/* Pivot Table Content - Show actual data */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <tr>
                            <th className={`px-4 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider border-r ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                              {pivotTable.index_column || 'Index'}
                            </th>
                            {pivotTable.column_headers?.map((header: string, colIndex: number) => (
                              <th key={colIndex} className={`px-4 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider ${colIndex === pivotTable.column_headers.length - 1 ? '' : `border-r ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}`}>
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={`${isDarkMode ? 'bg-gray-700 divide-gray-600' : 'bg-white divide-gray-200'} divide-y`}>
                          {pivotTable.data?.map((row: any, rowIndex: number) => (
                            <tr key={rowIndex} className={`${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'} transition-colors duration-150 ${rowIndex % 2 === 0 ? (isDarkMode ? 'bg-gray-700' : 'bg-white') : (isDarkMode ? 'bg-gray-800' : 'bg-gray-50')}`}>
                              <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} border-r ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                {row.index}
                              </td>
                              {pivotTable.column_headers?.map((header: string, colIndex: number) => (
                                <td key={colIndex} className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-center ${colIndex === pivotTable.column_headers.length - 1 ? '' : `border-r ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}`}>
                                  {row[header] || 0}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Fallback message when no pivot tables
              <div className="p-8 text-center">
                <Table className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                  No Pivot Tables Found
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Pivot tables will appear here after processing your data.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && hasDashboard && (
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6`}>
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2`}>
                Dashboard Generated
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                Your dashboard has been created with charts and visualizations. 
                Download the Excel file to view the complete dashboard with interactive charts.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  💡 <strong>Tip:</strong> The dashboard contains multiple charts and visualizations 
                  that are best viewed in Microsoft Excel or Google Sheets.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pagination - Only show for cleaned data */}
        {activeTab === 'cleaned' && data.length > 0 && (
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-4 mt-6`}>
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-center sm:text-left`}>
              Showing <span className="font-medium">{start + 1}</span> to{" "}
              <span className="font-medium">{Math.min(start + pageSize, data.length)}</span> of{" "}
              <span className="font-medium">{data.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium ${isDarkMode ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'} border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} px-2`}>
                <span className="hidden sm:inline">Page </span>{page + 1} of {Math.ceil(data.length / pageSize)}
              </span>
              <button
                disabled={start + pageSize >= data.length}
                onClick={() => setPage((p) => p + 1)}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium ${isDarkMode ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'} border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
              >
                <span className="hidden sm:inline">Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Preview;