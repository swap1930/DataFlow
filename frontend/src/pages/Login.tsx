import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, BarChart3, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useTheme } from "../App";
import { signIn, signInWithGoogle, signInWithGitHub, testFirebaseSetup } from "../firebase/auth";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
    
    // Test Firebase setup on component mount
    testFirebaseSetup();
  }, [navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn(email, password);
      if (result.success) {
        // Save user data in localStorage
        localStorage.setItem("user", JSON.stringify(result.user));
        alert("Login successful!");
        navigate("/dashboard"); // Redirect to dashboard
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Login failed. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        // Save user data in localStorage
        localStorage.setItem(
          "user",
          JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
          })
        );
        alert("Google login successful!");
        navigate("/dashboard");
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Google login failed. Please try again.");
      console.error("Google login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signInWithGitHub();
      if (result.success) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
          })
        );
        alert("GitHub login successful!");
        navigate("/dashboard");
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("GitHub login failed. Please try again.");
      console.error("GitHub login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        isDarkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
      }`}
    >
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 p-3 rounded-full shadow-lg transition-all duration-200 ${
          isDarkMode
            ? "bg-gray-800 text-yellow-400 hover:bg-gray-700 hover:text-yellow-300"
            : "bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        }`}
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <BarChart3 size={32} className="text-white" />
          </div>
          <h2
            className={`text-3xl font-bold transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Welcome Back
          </h2>
          <p
            className={`mt-2 transition-colors duration-300 ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Sign in to your DataFlow account
          </p>
        </div>

        {/* Login Form */}
        <div
          className={`rounded-xl p-8 border shadow-sm backdrop-blur-sm transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-800/70 border-gray-700"
              : "bg-white/70 border-gray-200"
          }`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-6"
          >
            {/* Error Message */}
            {error && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  isDarkMode
                    ? "bg-red-900/20 text-red-400 border border-red-800"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-400"
                  }`}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                  }`}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={20}
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-400"
                  }`}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-3 border rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-gray-300 hover:text-gray-200"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className={`w-4 h-4 text-blue-600 border rounded focus:ring-blue-500 transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
                <label
                  htmlFor="remember-me"
                  className={`ml-2 text-sm transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            {/* Social Login Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border transition-all duration-200 ${
                  isDarkMode
                    ? "bg-white text-gray-800 hover:bg-gray-100 border-gray-600"
                    : "bg-white text-gray-800 hover:bg-gray-50 border-gray-300"
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Google</span>
              </button>

              <button
                type="button"
                onClick={handleGitHubLogin}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border transition-all duration-200 ${
                  isDarkMode
                    ? "bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
                    : "bg-gray-900 text-white hover:bg-gray-800 border-gray-700"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="font-medium">GitHub</span>
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p
              className={`transition-colors duration-300 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
