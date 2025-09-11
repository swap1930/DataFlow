import { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChatHistory from './pages/ChatHistory';
import ProcessedFile from './pages/ProcessedFile';
import ChatPanel from './components/ChatPanel';
import { onAuthStateChange, signOutUser } from './firebase/auth';
import Preview from './components/Preview.js';
import Loader from './components/Loader'; // Import the Loader component

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('dataflow-theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('dataflow-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user: any) => {
      if (user) {
        localStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }));
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    }
  };

  if (isLoading) {
    return (
      <Loader
        size="h-32 w-32"
        borderColor={isDarkMode ? 'border-blue-400' : 'border-blue-600'}
        borderWidth="border-b-2"
        ariaLabel="Loading application"
        className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}
      />
    );
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div
          className={`min-h-screen transition-colors duration-300 ${
            isDarkMode
              ? 'bg-gray-900'
              : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
          }`}
        >
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <Login onLogin={() => setIsAuthenticated(true)} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/signup"
              element={
                !isAuthenticated ? (
                  <Signup onSignup={() => {}} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Protected routes */}
            {isAuthenticated ? (
              <>
                {/* Routes with header + sidebar */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="chat-history" element={<ChatHistory />} />
                  <Route path="chat" element={<ChatPanel />} />
                </Route>

                {/* Standalone routes (no header, no sidebar) */}
                <Route path="/processed-file" element={<ProcessedFile />} />
                <Route path="/preview" element={<Preview />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;