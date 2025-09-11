import React, { useState } from 'react';
import { Settings, Database, BarChart3, Trash2, TrendingUp, ArrowRight } from 'lucide-react';
import { useTheme } from '../App';
import { useNavigate } from 'react-router-dom';

import { getCurrentUser, getCurrentUserToken } from '../firebase/auth';


interface DataProcessingFormProps {
  uploadedFile: File;
}

const DataProcessingForm: React.FC<DataProcessingFormProps> = ({ uploadedFile }) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [removeFields, setRemoveFields] = useState('');
  const [numberOfRelations, setNumberOfRelations] = useState(1);
  const [description, setDescription] = useState('');
  const [requireDashboard, setRequireDashboard] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
  
    try {
      // 1) Get current user and token first
      const currentUser = getCurrentUser();
      const token = await getCurrentUserToken();
      
      if (!currentUser || !token) {
        alert("You must be logged in to process the file!");
        setIsProcessing(false);
        return;
      }

      console.log("Current user:", currentUser.uid);
      console.log("User email:", currentUser.email);
  
      // 2) Upload the file first
      const uploadForm = new FormData();
      uploadForm.append('file', uploadedFile);
  
      const uploadRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://dataflow-1.onrender.com/api'}/upload`, {
        method: 'POST',
        body: uploadForm,
      });
  
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Failed to upload file');
      }
  
      // 3) Call process endpoint with token in headers
      const processForm = new FormData();
      processForm.append('remove_fields', removeFields);
      processForm.append('number_of_relations', numberOfRelations.toString());
      processForm.append('description', description);
      processForm.append('require_dashboard', requireDashboard.toString());
  
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://dataflow-1.onrender.com/api'}/process-data`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Firebase token for authentication
        },
        body: processForm,
      });
      
  
      if (response.ok) {
        const json = await response.json();
        const fileId = json.file_id;
        navigate(`/preview?file_id=${encodeURIComponent(fileId)}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to process file: ${errorData.detail || errorData.message}`);
      }
  
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className={`rounded-xl p-6 border shadow-sm transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white/70 backdrop-blur-sm border-gray-200'
    }`}>
      <div className="flex items-center space-x-3 mb-6">
        <Settings size={24} className="text-blue-600" />
        <h2 className={`text-xl font-semibold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>Data Processing Configuration</h2>
      </div>
        
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Info */}
        <div className={`rounded-lg p-4 border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <Database size={20} className="text-green-600" />
            <div>
              <h3 className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Processing: {uploadedFile.name}</h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Configure your data processing options below</p>
            </div>
          </div>
        </div>

        {/* Remove Fields */}
        <div className="space-y-3">
          <label className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <Trash2 size={16} className="text-red-500" />
            <span>Remove Fields Name</span>
          </label>
          <input
            type="text"
            value={removeFields}
            onChange={(e) => setRemoveFields(e.target.value)}
            placeholder="e.g., Empty columns, ID field, Timestamp"
            className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }`}
          />
          <p className={`text-xs transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>Specify which fields/columns to remove from your data</p>
        </div>

        {/* Number of Relations */}
        <div className="space-y-3">
          <label className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <TrendingUp size={16} className="text-purple-600" />
            <span>Number of Relations</span>
          </label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setNumberOfRelations(Math.max(1, numberOfRelations - 1))}
              className={`w-10 h-10 border rounded-lg transition-all duration-200 flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              -
            </button>
            <input
              type="number"
              value={numberOfRelations}
              onChange={(e) => setNumberOfRelations(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="20"
              className={`flex-1 px-4 py-3 border rounded-lg text-center transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                  : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              }`}
            />
            <button
              type="button"
              onClick={() => setNumberOfRelations(Math.min(20, numberOfRelations + 1))}
              className={`w-10 h-10 border rounded-lg transition-all duration-200 flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              +
            </button>
          </div>
          <p className={`text-xs transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>Specify how many data relationships you want to analyze</p>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Analysis Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you want to analyze or any specific requirements..."
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg resize-none transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }`}
          />
        </div>

        {/* Dashboard Requirement Checkbox */}
        <div className={`rounded-lg p-4 border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="dashboard"
                checked={requireDashboard}
                onChange={(e) => setRequireDashboard(e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="dashboard" className={`flex items-center space-x-2 font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <BarChart3 size={20} className="text-blue-600" />
                <span>Dashboard Required</span>
              </label>
            </div>
            <div className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Recommended
            </div>
          </div>
          <p className={`text-sm mt-2 ml-8 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Generate a comprehensive dashboard with charts, graphs, and key insights
          </p>
        </div>

        {/* Proceed Button */}
        <div className={`flex items-center justify-between pt-4 border-t transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Processing will begin immediately after submission
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Proceed</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DataProcessingForm;