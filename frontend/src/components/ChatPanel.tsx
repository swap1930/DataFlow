import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Upload, Download, Trash2, FileText, Calendar, Eye, CheckCircle, X } from 'lucide-react';
import { useTheme } from '../App';
import { useSidebar } from '../contexts/SidebarContext';
import { getUserProcessedFiles, downloadProcessedFile, deleteProcessedFile, ProcessedFile } from '../api/files';
import { useLocation } from 'react-router-dom';
import { askChat } from '../api/chat';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  fileId?: string;
}

const ChatPanel: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { isSidebarCollapsed } = useSidebar();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFileList, setShowFileList] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages with default AI message if no saved messages exist
  const initializeMessages = () => {
    const defaultMessage: Message = {
      id: '1',
      text: 'Hello! I\'m your AI data analysis assistant. I can help you understand your data, create insights, and answer questions about your processed files. How can I help you today?',
      sender: 'ai',
      timestamp: new Date()
    };
    
    // Always try to load saved messages first (for refresh/reload persistence)
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        const parsed: Message[] = JSON.parse(savedMessages);
        const restored = parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        if (restored.length > 0) {
          setMessages(restored);
          return;
        }
      } catch (err) {
        console.error("Failed to parse saved chat messages", err);
        localStorage.removeItem("chatMessages");
      }
    }
    
    // If no saved messages, start fresh
    setMessages([defaultMessage]);
    localStorage.setItem("chatMessages", JSON.stringify([defaultMessage]));
  };
  
  // 1️⃣ Load messages on mount
  useEffect(() => {
    initializeMessages();
  }, []);

  // 2️⃣ Save messages on every change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

 // 1️⃣ Load messages on mount
useEffect(() => {
  initializeMessages();
}, []);

// 2️⃣ Clear chat on route change (but not reload)
useEffect(() => {
  const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  const isReload = navEntries[0]?.type === "reload";

  if (!isReload) {
    clearChatMessages();
  }
}, [location.pathname]);


  
  // Check for file_id in URL parameters and selected file from localStorage on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fileIdFromUrl = urlParams.get('file_id');
    
    if (fileIdFromUrl) {
      // If file_id is in URL, try to find the file in processed files
      handleFileSelectFromId(fileIdFromUrl);
    } else {
      // Check for selected file from localStorage
      const savedSelectedFile = localStorage.getItem('selectedFile');
      if (savedSelectedFile) {
        try {
          const file = JSON.parse(savedSelectedFile);
          setSelectedFile(file);
          // Removed: addFileSelectedMessage call
        } catch (error) {
          console.error('Error parsing selected file:', error);
          localStorage.removeItem('selectedFile');
        }
      }
    }
  }, [location.search]);

  // Fetch processed files when file list is opened
  useEffect(() => {
    if (showFileList) {
      fetchProcessedFiles();
    }
  }, [showFileList]);

  const fetchProcessedFiles = async () => {
    setLoadingFiles(true);
    try {
      const files = await getUserProcessedFiles();
      setProcessedFiles(files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Removed: addFileSelectedMessage function entirely

  const clearChatMessages = () => {
    const defaultMessage: Message = {
      id: '1',
      text: 'Hello! I\'m your AI data analysis assistant. I can help you understand your data, create insights, and answer questions about your processed files. How can I help you today?',
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages([defaultMessage]);
    localStorage.setItem("chatMessages", JSON.stringify([defaultMessage]));
  };

  const handleFileSelect = (file: ProcessedFile) => {
    // Check if the same file is already selected
    if (selectedFile?.file_id === file.file_id) {
      setShowFileList(false);
      return;
    }

    // Clear all chat messages when selecting a different file
    clearChatMessages();
    
    setSelectedFile(file);
    localStorage.setItem('selectedFile', JSON.stringify(file));
    // Removed: addFileSelectedMessage call
    setShowFileList(false);
  };

  const handleFileDeselect = () => {
    // Clear chat when deselecting file
    clearChatMessages();
    
    setSelectedFile(null);
    localStorage.removeItem('selectedFile');
    const deselectMessage: Message = {
      id: Date.now().toString(),
      text: 'File selection cleared. You can select another file or ask general questions.',
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, deselectMessage]);
  };

  const handleFileSelectFromId = async (fileId: string) => {
    try {
      const files = await getUserProcessedFiles();
      const file = files.find(f => f.file_id === fileId);
      if (file) {
        handleFileSelect(file);
        // Clear the URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        console.warn(`File with ID ${fileId} not found.`);
      }
    } catch (error) {
      console.error('Failed to select file from URL:', error);
    }
  };

  // Detect screen size and handle resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
  
    // Require a selected file (as per your spec)
    if (!selectedFile) {
      const warn: Message = {
        id: Date.now().toString(),
        text: 'Please select a processed file first (click the upload icon) so I can ground my answers on your data.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, warn]);
      return;
    }
  
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      fileId: selectedFile.file_id
    };
  
    setMessages(prev => [...prev, userMessage]);
    const question = inputText; // keep a local copy
    setInputText('');
    setIsLoading(true);
  
    // Reset textarea height to default
    const textarea = document.querySelector('textarea');
    if (textarea) {
      (textarea as HTMLTextAreaElement).style.height = '64px';
    }
  
    try {
      const res = await askChat({ question, file_id: selectedFile.file_id });
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: res.answer || 'No answer returned.',
        sender: 'ai',
        timestamp: new Date(),
        fileId: selectedFile.file_id
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Something went wrong while calling the chat API.';
      const aiMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: `⚠️ ${detail}`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleFileList = () => {
    setShowFileList(!showFileList);
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      await downloadProcessedFile(fileId);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      try {
        const success = await deleteProcessedFile(fileId);
        if (success) {
          setProcessedFiles(prev => prev.filter(file => file.file_id !== fileId));
          // If deleted file was selected, clear selection
          if (selectedFile && selectedFile.file_id === fileId) {
            handleFileDeselect();
          }
          alert('File deleted successfully');
        } else {
          alert('Failed to delete file');
        }
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete file');
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`min-h-[calc(100vh-110px)] flex flex-col transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : ''
    }`}>

      {/* Selected File Banner */}
      {selectedFile && (
        <div className={`p-3 border-b  mb-5 transition-colors duration-300 ${
          isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
        }`} style={{
          // Ensure proper text wrapping on mobile
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <div className="min-w-0 flex-1">
                <p className={`font-medium transition-colors duration-300 text-xs sm:text-sm md:text-base leading-tight ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-800'
                }`}>
                  📁 {selectedFile.file_name} is selected
                </p>
                <p className={`text-xs transition-colors duration-300 mt-1 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  You can ask me anything about this file!
                </p>
              </div>
            </div>
            <button
              onClick={handleFileDeselect}
              className={`p-2 rounded-lg transition-colors duration-200 flex items-center justify-center flex-shrink-0 ml-2 ${
                isDarkMode 
                  ? 'bg-blue-800 hover:bg-blue-700 text-blue-200' 
                  : 'bg-blue-200 hover:bg-blue-300 text-blue-800'
              }`}
            >
              <span className="hidden sm:inline">Clear Selection</span>
              <X className="w-4 h-4 sm:hidden" />
            </button>
          </div>
        </div>
      )}

      {/* Messages - takes remaining space, with proper bottom padding for sticky input */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" style={{ paddingBottom: '100px' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-[80%] ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-500 text-white'
              }`}>
                {message.sender === 'user' ? (  
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className={`rounded-lg px-4 py-2 transition-colors duration-300 ${
                message.sender === 'user'
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-500 text-white'
                  : isDarkMode 
                    ? 'bg-gray-700 text-gray-200' 
                    : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user'
                    ? 'text-blue-100' 
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className={`rounded-lg px-4 py-2 transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* File List Modal */}
      {showFileList && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${
          isDarkMode ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-30'
        }`}>
          <div className={`max-w-4xl w-full mx-4 rounded-lg shadow-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between p-4 border-b transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Select a File to Chat About ({processedFiles.length})
              </h3>
              <button
                onClick={toggleFileList}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                ✕
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto scrollbar-hide">
              {/* Currently Selected File Display */}
              {selectedFile && (
                <div className={`mb-4 p-3 rounded-lg border-2 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-blue-900/20 border-blue-600' 
                    : 'bg-blue-50 border-blue-300'
                }`}>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <span className={`font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                      Currently Selected: {selectedFile.file_name}
                    </span>
                  </div>
                </div>
              )}

              {loadingFiles ? (
                <div className={`text-center py-8 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                  <p>Loading your files...</p>
                </div>
              ) : processedFiles.length === 0 ? (
              <div className={`text-center py-8 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No processed files found</p>
                  <p className="text-sm mt-1">Process some data to see your files here</p>
                </div>
              ) : (
                <div className="space-y-3 ">
                  {processedFiles.map((file) => (
                    <div
                      key={file.file_id}
                      className={`p-4 rounded-lg border transition-colors duration-300 cursor-pointer ${
                        selectedFile?.file_id === file.file_id
                          ? isDarkMode 
                            ? 'bg-blue-900/20 border-blue-600' 
                            : 'bg-blue-50 border-blue-300'
                          : isDarkMode 
                         ? 'bg-gray-700/50 hover:bg-gray-700 border-transparent hover:border-gray-600'
                        : 'bg-gray-50 hover:bg-gray-100 border-transparent hover:border-gray-200'
                      }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className={`w-4 h-4 ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`} />
                            <h4 className={`font-medium transition-colors duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-800'
                            }`}>
                              {file.file_name}
                            </h4>
                            {file.require_dashboard && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                isDarkMode 
                                  ? 'bg-green-900 text-green-300' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                Dashboard
                              </span>
                            )}
                            {selectedFile?.file_id === file.file_id && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                isDarkMode 
                                  ? 'bg-blue-900 text-blue-300' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                Selected
                              </span>
                            )}
                          </div>
                          
                          {file.description && (
                            <p className={`text-sm mb-2 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {truncateText(file.description, 100)}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                {formatDate(file.created_at)}
                              </span>
                            </div>
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              Relations: {file.number_of_relations}
                            </span>
                            {file.remove_fields && (
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                Fields removed: {file.remove_fields.split(',').length}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(file.file_id);
                            }}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              isDarkMode 
                                ? 'hover:bg-gray-600 text-gray-400 hover:text-blue-400' 
                                : 'hover:bg-gray-200 text-gray-500 hover:text-blue-600'
                            }`}
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileSelect(file);
                            }}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              isDarkMode 
                                ? 'hover:bg-gray-600 text-gray-400 hover:text-green-400' 
                                : 'hover:bg-gray-200 text-gray-500 hover:text-green-600'
                            }`}
                            title="Select this file for chat"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.file_id);
                            }}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              isDarkMode 
                                ? 'hover:bg-gray-600 text-gray-400 hover:text-red-400' 
                                : 'hover:bg-gray-200 text-gray-500 hover:text-red-600'
                            }`}
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
              </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Input at bottom with backdrop */}
      <div className={`sticky bottom-0 w-full z-10 ${
          isDarkMode ? 'bg-gray-900 border-t border-gray-700' : 'bg-white border-t border-gray-200'
      }`}>
        <div className="p-4">
          <div className="flex space-x-3">
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                // Auto-resize textarea based on content
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
              onKeyPress={handleKeyPress}
              placeholder={selectedFile ? `Ask me about ${selectedFile.file_name}...` : "Ask me about your data..."}
              className={`flex-1 resize-none rounded-lg border px-3 py-2 transition-colors duration-300 focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
              }`}
              rows={1}
              style={{ minHeight: '64px', maxHeight: '200px', overflow: 'hidden' }}
            />
            
            {/* Upload Icon Button */}
            <button
              onClick={toggleFileList}
              className={`px-3 py-3 rounded-lg transition-colors duration-200 self-end ${
                isDarkMode
                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              title="Select processed files for chat"
            >
              <Upload className="w-5 h-5" />
            </button>
            
            <button
  onClick={handleSendMessage}
  disabled={!inputText.trim() || isLoading || !selectedFile}
  className={`px-3 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed self-end ${
    isDarkMode
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-blue-500 hover:bg-blue-600 text-white'
  }`}
>
  <Send className="w-5 h-5" />
</button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;