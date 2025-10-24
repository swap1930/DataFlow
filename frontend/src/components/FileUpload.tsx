import React, { useCallback, useState } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';
import { useTheme } from '../App';
import { getCurrentUserToken } from '../firebase/auth';
import { API_BASE_URL } from '../api/config';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const { isDarkMode } = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file)) {
        setUploadedFile(file);
        onFileUpload(file);
      }
    }
  }, [onFileUpload]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidFileType(file)) {
        setUploadedFile(file);

        // Send file to backend
        const formData = new FormData();
        formData.append('file', file);

        try {
          const token = await getCurrentUserToken();
          console.log('🔑 Upload token check:', token ? 'Token exists' : 'No token');
          
          if (!token) {
            console.error('❌ No authentication token available');
            alert('User not authenticated. Please login again.');
            return;
          }

          console.log('📤 Uploading file to:', `${API_BASE_URL}/upload`);
          console.log('🔑 Using token:', token.substring(0, 20) + '...');

          const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          console.log('📡 Upload response status:', response.status);

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Upload successful:', result);
            onFileUpload(file); // Pass file to parent component
          } else {
            const errorText = await response.text();
            console.error('❌ Upload failed:', response.status, errorText);
            alert(`Failed to upload file: ${response.status} - ${errorText}`);
          }
        } catch (error) {
          console.error('❌ Error uploading file:', error);
          alert(`Error uploading file: ${error}`);
        }
      }
    }
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`rounded-xl p-6 border shadow-sm transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white/70 backdrop-blur-sm border-gray-200'
    }`}>
      <h2 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
        isDarkMode ? 'text-white' : 'text-gray-800'
      }`}>File Upload</h2>
      
      {!uploadedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive
              ? isDarkMode
                ? 'border-blue-400 bg-blue-900/20'
                : 'border-blue-400 bg-blue-50'  
              : isDarkMode
                ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <Upload size={48} className={`mx-auto mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`} />
          
          <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Drop your file here, or click to browse
          </h3>
          <p className={`mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Supports CSV, Excel (.xlsx, .xls) files up to 50MB
          </p>
          
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200">
            Choose File
          </button>
        </div>
      ) : (
        <div className={`rounded-xl p-4 border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <h4 className={`font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>{uploadedFile.name}</h4>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {formatFileSize(uploadedFile.size)} • Uploaded successfully
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'hover:bg-gray-600 text-gray-400 hover:text-red-400' 
                  : 'hover:bg-gray-200 text-gray-500 hover:text-red-500'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;