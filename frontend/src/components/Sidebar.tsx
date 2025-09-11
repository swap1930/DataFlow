import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Upload,
  History,
  Settings,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { useTheme } from '../App';
import { signOutUser } from '../firebase/auth';
import { getRecentFiles, RecentFile } from '../api/files';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
  isOpen?: boolean; // mobile sidebar open/close
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapseChange, isMobile = false, onMobileClose, isOpen = false }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRibbon, setShowRibbon] = useState(false);
  const [actuallyMobile, setActuallyMobile] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Detect actual mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setActuallyMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!showSettings) return;
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  const handleCollapse = (collapsed: boolean) => {
    if (actuallyMobile) {
      // Mobile view: just close the sidebar completely
      onMobileClose?.();
    } else {
      // Desktop view: collapse/expand with ribbon
      setIsCollapsed(collapsed);
      onCollapseChange?.(collapsed);
      
      // Show ribbon when collapsing in desktop view
      if (collapsed) {
        setShowRibbon(true);
      } else {
        setShowRibbon(false);
      }
    }
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
    localStorage.removeItem('user');
    sessionStorage.clear();
    setShowSettings(false);
    
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
    
    navigate('/login');
    console.log('User logged out successfully');
  };

  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecentFiles = async () => {
      setLoading(true);
      try {
        const files = await getRecentFiles();
        setRecentFiles(files);
      } catch (error) {
        console.error('Error fetching recent files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentFiles();
  }, []);

  const handleRibbonClick = (action?: string) => {
    if (action === 'expand' || !action) {
      // Expand sidebar
      handleCollapse(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {actuallyMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={onMobileClose}
        ></div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        .custom-scrollbar.dark::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.3);
        }
        .custom-scrollbar.dark::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.5);
        }
      `}</style>

      {/* Icon Ribbon - Only show in desktop when collapsed */}
      {!actuallyMobile && showRibbon && (
        <div className={`fixed left-0 top-0 h-full w-16 border-r z-45 shadow-sm transition-all duration-300 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/90 backdrop-blur-sm border-gray-200'
        }`}>
          <div className="flex flex-col h-full">
            {/* Logo in ribbon */}
            <div className={`border-b p-4 transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => handleRibbonClick('expand')}
                className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                title="Expand Sidebar"
              >
                <BarChart3 size={20} className="text-white" />
              </button>
            </div>

            {/* Navigation Icons */}
            <nav className="space-y-2 p-2">
              <NavLink
                to="/dashboard"
                onClick={() => handleRibbonClick()}
                className={({ isActive }) =>
                  `flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? isDarkMode
                        ? 'bg-blue-900/50 text-blue-400 border border-blue-800'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
                title="Data Upload"
              >
                <Upload size={20} />
              </NavLink>

              <NavLink
                to="/chat-history"
                onClick={() => handleRibbonClick()}
                className={({ isActive }) =>
                  `flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? isDarkMode
                        ? 'bg-blue-900/50 text-blue-400 border border-blue-800'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
                title="Chat History"
              >
                <History size={20} />
              </NavLink>
            </nav>

            {/* Settings at bottom */}
            <div className={`border-t transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } mt-auto`}>
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => {
                    handleRibbonClick();
                    handleSettingsClick();
                  }}
                  className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    showSettings
                      ? isDarkMode
                        ? 'bg-blue-900/50 text-blue-400 border border-blue-800'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                  title="Settings"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Sidebar - Hidden on mobile until opened */}
      <aside className={`
        fixed left-0 top-0 h-full border-r z-50 shadow-sm transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-80'}
        ${actuallyMobile ? 
          `${isOpen ? 'translate-x-0' : '-translate-x-full'} w-80` : 
          `${showRibbon ? '-translate-x-full' : 'translate-x-0'}`
        }
        ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/90 backdrop-blur-sm border-gray-200'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`border-b transition-colors duration-300 ${isCollapsed ? 'p-4' : 'p-6'
            } ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
            <div className="flex items-center h-10">
              {!isCollapsed && (
                <>
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart3 size={20} className="text-white" />
                  </div>
                  <span className={`text-xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'} ml-3`}>
                    DataFlow
                  </span>
                  {/* Collapse (close) icon */}
                  {!isCollapsed && (
                    <button
                      onClick={() => {
                        handleCollapse(true); // This will handle both mobile and desktop properly
                      }}
                      className={`p-1 rounded-lg transition-all duration-200 ${!actuallyMobile ? 'ml-24' : 'ml-auto'}
                        ${isDarkMode
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                        }`}
                      aria-label={actuallyMobile ? "Close sidebar" : "Collapse sidebar"}
                    >
                      {actuallyMobile ? (
                        // X icon for mobile (close)
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      ) : (
                        // Collapse icon for desktop
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <line x1="9" y1="4" x2="9" y2="20" />
                        </svg>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className={`space-y-2 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <NavLink
              to="/dashboard"
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                  ? isDarkMode
                    ? 'bg-blue-900/50 text-blue-400 border border-blue-800'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
              title={isCollapsed ? "Data Upload" : ""}
            >
              <Upload size={20} />
              {!isCollapsed && <span>Data Upload</span>}
            </NavLink>

            <NavLink
              to="/chat-history"
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                  ? isDarkMode
                    ? 'bg-blue-900/50 text-blue-400 border border-blue-800'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
              title={isCollapsed ? "Chat History" : ""}
            >
              <History size={20} />
              {!isCollapsed && <span>Chat History</span>}
            </NavLink>
          </nav>

          {/* Chat History */}
          {!isCollapsed && (
            <div className={`flex-1 p-4 overflow-y-auto custom-scrollbar ${isDarkMode ? 'dark' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium uppercase tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  Recent Files
                </h3>
                <button 
                  onClick={() => {
                    setLoading(true);
                    getRecentFiles().then(files => {
                      setRecentFiles(files);
                      setLoading(false);
                    }).catch(() => setLoading(false));
                  }}
                  className={`p-1 rounded transition-colors duration-200 ${isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  title="Refresh recent files"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2v6h-6"></path>
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                    <path d="M3 22v-6h6"></path>
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                {loading ? (
                  <div className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-xs">Loading recent files...</span>
                  </div>
                ) : recentFiles.length > 0 ? (
                  recentFiles.map((file) => (
                    <div
                      key={file.file_id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${isDarkMode
                        ? 'bg-gray-700/50 hover:bg-gray-700 border-transparent hover:border-gray-600'
                        : 'bg-gray-50 hover:bg-gray-100 border-transparent hover:border-gray-200'
                        }`}
                      onClick={() => navigate(`/preview?file_id=${encodeURIComponent(file.file_id)}`)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                            {file.file_name}
                          </h4>
                          <p className={`text-xs mt-1 line-clamp-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            {file.description || 'No description available'}
                          </p>
                          <p className={`text-xs mt-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                            {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p className="text-xs">No recent files found</p>
                    <p className="text-xs mt-1">Process some data to see it here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings - Bottom */}
          <div className={`border-t transition-colors duration-300 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mt-auto`}>
            <div className="relative" ref={settingsRef}>
              <button
                onClick={handleSettingsClick}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all duration-200 ${
                  showSettings
                    ? isDarkMode
                      ? 'bg-blue-900/50 text-blue-400 border border-blue-800'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
                title={isCollapsed ? "Settings" : ""}
              >
                <Settings size={20} />
                {!isCollapsed && <span>Settings</span>}
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className={`absolute bottom-full left-0 right-0 mb-2 p-2 rounded-lg border shadow-lg ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                } ${isCollapsed ? 'w-48 left-0' : ''}`}>
                  <div className="space-y-1">
                    <button
                      onClick={toggleTheme}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-200 ${
                        isDarkMode
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                      <span className="text-sm">
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </span>
                    </button>
                    {/* Collapse/Close Panel Option */}
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        if (actuallyMobile) {
                          onMobileClose && onMobileClose();
                        } else {
                          handleCollapse(true);
                        }
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-200 ${
                        isDarkMode
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {actuallyMobile ? (
                          // X icon for mobile
                          <>
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </>
                        ) : (
                          // Collapse icon for desktop
                          <>
                            <rect x="3" y="4" width="18" height="16" rx="2" />
                            <line x1="9" y1="4" x2="9" y2="20" />
                          </>
                        )}
                      </svg>
                      <span className="text-sm">{actuallyMobile ? 'Close sidebar' : 'Close the panel'}</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-200 ${
                        isDarkMode
                          ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                          : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      <LogOut size={16} />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;