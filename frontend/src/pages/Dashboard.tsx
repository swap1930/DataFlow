import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import DataProcessingForm from '../components/DataProcessingForm';
import { useTheme } from '../App';
import { BarChart3, Upload, Database, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  return (
    <div className="space-y-8">
      {/* Welcome Section - Simplified */}
      <div className={`rounded-2xl p-8 border transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white/90 border-gray-200'
      }`}>
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Data Analytics Dashboard
              </h1>
              <div className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-cyan-400' : 'text-blue-600'
              }`}>
                Transform your data into actionable insights
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/40' 
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            ● System Ready
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-center mb-6">
          <div className="text-center">
            <div className={`inline-flex p-3 rounded-xl transition-colors duration-300 mb-3 ${
              isDarkMode 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              <BarChart3 size={28} />
            </div>
            <h1 className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              DataFlow
            </h1>
          </div>
        </div>
        
        {/* Description */}
        <p className={`text-lg leading-relaxed mb-6 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Upload your CSV or Excel files and configure your data processing preferences. 
          Our advanced analytics engine powered by machine learning will help you discover 
          hidden patterns, trends, and actionable insights from your data.
        </p>

        {/* Stats Section */}
        <div className="flex flex-wrap gap-4 mb-6 md:grid md:grid-cols-3">
          <div className={`flex-1 min-w-[120px] p-4 rounded-xl transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-slate-700/50' 
              : 'bg-white/60 border border-gray-200'
          }`}>
            <div className={`text-2xl font-semibold ${
              isDarkMode ? 'text-cyan-400' : 'text-blue-600'
            }`}>50MB</div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Max File Size</div>
          </div>
          <div className={`flex-1 min-w-[120px] p-4 rounded-xl transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-slate-700/50' 
              : 'bg-white/60 border border-gray-200'
          }`}>
            <div className={`text-2xl font-semibold ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>5 Formats</div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Supported Types</div>
          </div>
          <div className={`flex-1 min-w-[120px] p-4 rounded-xl transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-slate-700/50' 
              : 'bg-white/60 border border-gray-200'
          }`}>
            <div className={`text-2xl font-semibold ${
              isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
            }`}>Real-time</div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Processing</div>
          </div>
        </div>
        
        {/* Feature Pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/70 text-cyan-300 border border-slate-700' 
              : 'bg-white/60 text-gray-700'
          }`}>
            <Upload size={16} />
            <span>Easy Upload</span>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/70 text-purple-300 border border-slate-700' 
              : 'bg-white/60 text-gray-700'
          }`}>
            <Database size={16} />
            <span>Smart Processing</span>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/70 text-emerald-300 border border-slate-700' 
              : 'bg-white/60 text-gray-700'
          }`}>
            <TrendingUp size={16} />
            <span>Real-time Analytics</span>
          </div>
        </div>

        {/* Supported Formats */}
        <div className={`p-4 rounded-xl transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-800/30 border border-slate-700/50' 
            : 'bg-blue-50/50 border border-blue-200/50'
        }`}>
          <h3 className={`text-sm font-semibold mb-2 ${
            isDarkMode ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            Supported File Formats
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {['CSV', 'Excel (.xlsx)', 'Excel (.xls)', 'TSV', 'JSON'].map((format) => (
              <span key={format} className={`px-2 py-1 rounded-md transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-slate-700 text-slate-300' 
                  : 'bg-white text-gray-600'
              }`}>
                {format}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <FileUpload onFileUpload={setUploadedFile} />

      {/* Data Processing Form */}
      {uploadedFile && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <DataProcessingForm uploadedFile={uploadedFile} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;