import React, { useState, useEffect } from 'react';
import { User, LogOut, Sun, Moon, ChevronDown, Menu } from 'lucide-react';
import { useTheme } from '../App';
import { useNavigate } from 'react-router-dom';
import { signOutUser } from '../firebase/auth';

interface HeaderProps {
  isSidebarCollapsed?: boolean;
  onMobileSidebarToggle?: () => void;
}

interface UserData {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
}

const Header: React.FC<HeaderProps> = ({ isSidebarCollapsed = false, onMobileSidebarToggle }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Get user data from localStorage on component mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        setUserData(parsedUser);
        console.log('User data loaded:', parsedUser); // Debug log
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Get user's display name or fallback
  const getUserDisplayName = () => {
    if (userData?.name) return userData.name;
    if (userData?.email) return userData.email.split('@')[0]; // Use email prefix as fallback
    return 'User';
  };

  // Get user's profile image or fallback
  const getUserProfileImage = () => {
    if (userData?.photoURL) return userData.photoURL;
    return undefined;
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      // no-op; still proceed to clear local data and navigate
      console.error('Error during sign out:', error);
    }
    localStorage.removeItem('user');
    sessionStorage.clear();
    navigate('/login');
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`
      fixed top-0 right-0 h-16 border-b z-40 shadow-sm transition-all duration-300
      w-full lg:w-auto mb-10 lg:mb-0
      ${isSidebarCollapsed ? 'lg:left-16' : 'lg:left-80'} 
      left-0
      ${isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white/80 backdrop-blur-sm border-gray-200'}
    `}>
      <div className="flex h-full px-4 lg:px-6">
        {/* Mobile Hamburger Menu */}
        <div className="flex items-center lg:hidden">
          <button
            className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
            }`}
            onClick={onMobileSidebarToggle}
            aria-label="Open sidebar"
          >
            <Menu 
              size={24} 
              className={isDarkMode ? 'text-white' : 'text-gray-800'} 
            />
          </button>
        </div>

        {/* Title */}
        <div className="flex-1 flex items-center justify-start ml-4 lg:justify-start lg:ml-4">
          <h1 className={`
            text-lg lg:text-xl font-semibold transition-colors duration-300
            ${isDarkMode ? 'text-white' : 'text-gray-800'}
          `}>
            DataFlow Analytics
          </h1>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-300 hover:text-yellow-400' 
                : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
            }`}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* Profile Dropdown */}
          <div className="relative profile-dropdown">
            <button
              onClick={toggleProfileDropdown}
              className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                  : 'hover:bg-blue-50 text-gray-600 hover:text-gray-800'
              }`}
              aria-label="User profile menu"
            >
              <User size={20} />
              <span className="text-sm hidden lg:inline max-w-32 truncate">
                {getUserDisplayName()}
              </span>
              <ChevronDown 
                size={16} 
                className={`hidden lg:inline transition-transform duration-200 ${
                  isProfileDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className={`
                absolute right-0 mt-2 w-64 rounded-lg shadow-lg border transition-all duration-200 z-50
                ${isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
                }
              `}>
                <div className="p-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold overflow-hidden
                      ${isDarkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-600'
                      }
                    `}>
                      {getUserProfileImage() ? (
                        <img 
                          src={getUserProfileImage()} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getUserDisplayName().charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`
                        text-sm font-medium truncate
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}
                      `}>
                        {getUserDisplayName()}
                      </p>
                      <p className={`
                        text-xs truncate
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                      `}>
                        {userData?.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className={`
                    border-t mb-4
                    ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                  `}></div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className={`
                      w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
                      ${isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-300 hover:text-red-400' 
                        : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                      }
                    `}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;