import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, FileText, Download, Trash2, RefreshCw, Bot } from 'lucide-react';
import { useTheme } from '../App';
import { useNavigate } from 'react-router-dom';
import { getUserProcessedFiles, ProcessedFile, downloadProcessedFile, deleteProcessedFile } from '../api/files';

const ChatHistory: React.FC = () => {
  const navigate = useNavigate();
  
  const { isDarkMode } = useTheme();


  const handlenew = () => {
    navigate('/dashboard');
  };

  const handlepreview = () => {
    navigate('/preview');
  };

  // Handle file download
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await downloadProcessedFile(fileId);
      console.log(`File ${fileName} downloaded successfully`);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // Handle file deletion
  const handleDelete = async (fileId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      try {
        const success = await deleteProcessedFile(fileId);
        if (success) {
          // Remove file from local state
          setFiles(files.filter(file => file.file_id !== fileId));
          console.log(`File ${fileName} deleted successfully`);
        } else {
          alert('Failed to delete file');
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file. Please try again.');
      }
    }
  };

  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all files when component mounts
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const allFiles = await getUserProcessedFiles();
      setFiles(allFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="space-y-6">
{/* Header */}
<div
  className={`rounded-xl p-6 border shadow-sm transition-colors duration-300 ${
    isDarkMode
      ? "bg-gray-800 border-gray-700"
      : "bg-white/70 backdrop-blur-sm border-gray-200"
  }`}
>
  <div className="flex items-center justify-between">
    <div>
      <h1
        className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
          isDarkMode ? "text-white" : "text-gray-800"
        }`}
      >
        Chat History
      </h1>
      <p
        className={`transition-colors duration-300 ${
          isDarkMode ? "text-gray-300" : "text-gray-600"
        }`}
      >
        View and manage your previous data analysis sessions
      </p>
    </div>
    <div className="flex items-center space-x-3">
      {/* Refresh Button */}
      <button
        onClick={fetchFiles}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isDarkMode
            ? "hover:bg-gray-700 text-gray-400 hover:text-blue-400"
            : "hover:bg-gray-100 text-gray-500 hover:text-blue-600"
        }`}
        title="Refresh files"
      >
        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
      </button>

      {/* AI Chat Button */}
      <button
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center justify-center"
        onClick={() => navigate('/chat')}
      >
        {/* Show text on desktop */}
        <span className="hidden sm:block">AI Chat</span>
        {/* Show icon on mobile */}
        <Bot className="w-5 h-5 block sm:hidden" />
      </button>

      {/* New Analysis Button */}
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
        onClick={handlenew}
      >
        {/* Show text on desktop */}
        <span className="hidden sm:block">New Analysis</span>
        {/* Show + icon on mobile */}
        <span className="block sm:hidden text-xl font-bold">+</span>
      </button>
    </div>
  </div>
</div>

      {/* Chat List */}
      <div className="space-y-4">
        {loading ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <span>Loading your files...</span>
          </div>
        ) : files.length > 0 ? (
          files.map((file) => (
            <div
              key={file.file_id}
              className={`rounded-xl p-6 border shadow-sm transition-all duration-200 group ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white/70 backdrop-blur-sm border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <MessageSquare size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold group-hover:text-blue-600 transition-colors ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {file.file_name}
                      </h3>
                      <div className={`flex items-center space-x-4 text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <div className="flex items-center space-x-1">
                          <Calendar size={16} />
                          <span>{new Date(file.created_at).toLocaleDateString()} at {new Date(file.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className={`mb-4 leading-relaxed transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {file.description || 'No description available'}
                  </p>
                  
                  {/* File Details Section */}
                  <div className={`mb-4 p-3 rounded-lg transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className={`w-4 h-4 ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`} />
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          {new Date(file.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          isDarkMode ? 'bg-green-400' : 'bg-green-600'
                        }`}></div>
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          Relations: {file.number_of_relations || 0}
                        </span>
                      </div>
                      
                      {file.remove_fields && (
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isDarkMode ? 'bg-orange-400' : 'bg-orange-600'
                          }`}></div>
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                            Fields removed: {file.remove_fields.split(',').length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        isDarkMode 
                          ? 'bg-green-900/20 text-green-400 border-green-800' 
                          : 'bg-green-100 text-green-700 border-green-200'
                      }`}>
                        Completed
                      </span>
                      
                      {file.require_dashboard && (
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          isDarkMode 
                            ? 'bg-blue-900/20 text-blue-400 border-blue-800' 
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                          Dashboard
                        </span>
                      )}
                    </div>
                    
                                         <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         className={`p-2 rounded-lg transition-all duration-200 ${
                           isDarkMode 
                             ? 'hover:bg-gray-700 text-gray-400 hover:text-purple-400' 
                             : 'hover:bg-gray-100 text-gray-500 hover:text-purple-600'
                         }`} 
                         onClick={() => navigate(`/chat?file_id=${encodeURIComponent(file.file_id)}`)}
                         title="Chat with AI about this file"
                       >
                         <Bot className="w-4 h-4" />
                       </button>
                       <button 
                         className={`p-2 rounded-lg transition-all duration-200 ${
                           isDarkMode 
                             ? 'hover:bg-gray-700 text-gray-400 hover:text-blue-400' 
                             : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'
                         }`} 
                         onClick={() => navigate(`/preview?file_id=${encodeURIComponent(file.file_id)}`)}
                         title="View file"
                       >
                         <FileText size={18} />
                       </button>
                       <button 
                         className={`p-2 rounded-lg transition-all duration-200 ${
                           isDarkMode 
                             ? 'hover:bg-gray-700 text-gray-400 hover:text-green-400' 
                             : 'hover:bg-gray-100 text-gray-500 hover:text-green-600'
                         }`}
                         onClick={() => handleDownload(file.file_id, file.file_name)}
                         title="Download file"
                       >
                         <Download size={18} />
                       </button>
                       <button 
                         className={`p-2 rounded-lg transition-all duration-200 ${
                           isDarkMode 
                             ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' 
                             : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'
                         }`}
                         onClick={() => handleDelete(file.file_id, file.file_name)}
                         title="Delete file"
                       >
                         <Trash2 size={18} />
                       </button>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No files found</h3>
            <p className="text-sm">Start by processing some data to see your history here</p>
            <button 
              onClick={handlenew}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              Start New Analysis
            </button>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default ChatHistory;