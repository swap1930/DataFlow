import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, BarChart3, AlertTriangle, CheckCircle, Lightbulb, Sparkles } from 'lucide-react';
import { useTheme } from '../App';
import { getCurrentUserToken } from '../firebase/auth';
import { API_BASE_URL } from '../api/config';

interface AIInsight {
  type: string;
  category: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  confidence: number;
  reasoning?: string;
  recommendation?: string;
  data?: any;
}

interface ChartRecommendation {
  chart_type: string;
  score: number;
  priority: 'high' | 'medium' | 'low';
  description: string;
  reasoning: string;
  example_config?: any;
}

interface AnalysisRecommendation {
  analysis_type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  reasoning: string;
}

interface AIIntelligenceProps {
  fileId: string;
}

const AIIntelligence: React.FC<AIIntelligenceProps> = ({ fileId }) => {
  const { isDarkMode } = useTheme();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [chartRecommendations, setChartRecommendations] = useState<ChartRecommendation[]>([]);
  const [analysisRecommendations, setAnalysisRecommendations] = useState<AnalysisRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'charts' | 'analysis'>('insights');

  const fetchAIInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getCurrentUserToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/ai/insights/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }

      const data = await response.json();
      setInsights(data.insights || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = await getCurrentUserToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/ai/recommendations/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChartRecommendations(data.recommendations?.charts || []);
        setAnalysisRecommendations(data.recommendations?.analysis || []);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  useEffect(() => {
    if (fileId) {
      fetchAIInsights();
      fetchRecommendations();
    }
  }, [fileId]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'error':
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return <CheckCircle size={16} className="text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  if (loading) {
    return (
      <div className={`rounded-xl p-6 border shadow-sm transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white/70 backdrop-blur-sm border-gray-200'
      }`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className={`text-lg font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Generating AI Insights...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border shadow-sm transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white/70 backdrop-blur-sm border-gray-200'
    }`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10  flex items-center justify-center">
          <Brain size={20} className={`${isDarkMode ? 'text-white' : 'text-black'}`} />

          </div>
          <div>
            <h2 className={`text-xl font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              AI Intelligence
            </h2>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Powered by machine learning and data science
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex">
        {[
          { id: 'insights', label: 'Insights', icon: Sparkles },
          { id: 'charts', label: 'Charts', icon: BarChart3 },
          { id: 'analysis', label: 'Analysis', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === tab.id
                ? isDarkMode
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-blue-600 border-b-2 border-blue-600'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb size={48} className={`mx-auto mb-4 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p className={`text-lg font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  No insights generated yet
                </p>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Upload and process a file to get AI-powered insights
                </p>
              </div>
            ) : (
              insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600'
                      : getSeverityColor(insight.severity)
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(insight.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {insight.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {insight.message}
                      </p>
                      {insight.recommendation && (
                        <div className={`mt-2 p-3 rounded-lg border-l-4 ${
                          isDarkMode 
                            ? 'bg-blue-900/20 border-blue-400' 
                            : 'bg-blue-50 border-blue-400'
                        }`}>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-700'
                          }`}>
                            <strong>Recommendation:</strong> {insight.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="space-y-4">
            {chartRecommendations.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 size={48} className={`mx-auto mb-4 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p className={`text-lg font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  No chart recommendations available
                </p>
              </div>
            ) : (
              chartRecommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {rec.chart_type.replace('_', ' ').toUpperCase()}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          getPriorityColor(rec.priority)
                        }`}>
                          {rec.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {Math.round(rec.score * 100)}% match
                        </span>
                      </div>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {rec.description}
                      </p>
                      <p className={`text-xs mt-1 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <strong>Why:</strong> {rec.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            {analysisRecommendations.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp size={48} className={`mx-auto mb-4 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p className={`text-lg font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  No analysis recommendations available
                </p>
              </div>
            ) : (
              analysisRecommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {rec.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          getPriorityColor(rec.priority)
                        }`}>
                          {rec.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {Math.round(rec.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {rec.description}
                      </p>
                      <p className={`text-xs mt-1 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <strong>Why:</strong> {rec.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIIntelligence;
