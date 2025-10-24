import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import json

class SmartRecommendations:
    """
    Smart data recommendations system for charts, analysis, and insights
    """
    
    def __init__(self):
        self.chart_recommendations = {
            'line_chart': {
                'conditions': ['time_series', 'continuous_data', 'trend_analysis'],
                'priority': 'high',
                'description': 'Perfect for showing trends over time'
            },
            'bar_chart': {
                'conditions': ['categorical_data', 'comparison'],
                'priority': 'high',
                'description': 'Great for comparing categories'
            },
            'pie_chart': {
                'conditions': ['categorical_data', 'percentage_distribution'],
                'priority': 'medium',
                'description': 'Best for showing proportions'
            },
            'scatter_plot': {
                'conditions': ['correlation_analysis', 'two_numeric_columns'],
                'priority': 'high',
                'description': 'Ideal for correlation analysis'
            },
            'histogram': {
                'conditions': ['distribution_analysis', 'single_numeric_column'],
                'priority': 'medium',
                'description': 'Shows data distribution'
            },
            'heatmap': {
                'conditions': ['correlation_matrix', 'multiple_numeric_columns'],
                'priority': 'medium',
                'description': 'Visualizes correlations between variables'
            }
        }
    
    def recommend_charts(self, dataframe: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Recommend appropriate charts based on data characteristics
        """
        recommendations = []
        
        # Analyze data characteristics
        data_characteristics = self._analyze_data_characteristics(dataframe)
        
        # Generate chart recommendations
        for chart_type, config in self.chart_recommendations.items():
            score = self._calculate_chart_score(data_characteristics, config['conditions'])
            
            if score > 0.3:  # Minimum threshold for recommendation
                recommendations.append({
                    'chart_type': chart_type,
                    'score': score,
                    'priority': config['priority'],
                    'description': config['description'],
                    'reasoning': self._generate_reasoning(data_characteristics, config['conditions']),
                    'data_requirements': self._get_data_requirements(chart_type),
                    'example_config': self._get_example_config(chart_type, dataframe)
                })
        
        # Sort by score and priority
        recommendations.sort(key=lambda x: (x['score'], x['priority']), reverse=True)
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def recommend_analysis(self, dataframe: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Recommend analysis techniques based on data
        """
        recommendations = []
        
        data_characteristics = self._analyze_data_characteristics(dataframe)
        
        # Statistical analysis recommendations
        if data_characteristics['has_numeric_data']:
            recommendations.append({
                'analysis_type': 'descriptive_statistics',
                'title': 'Descriptive Statistics',
                'description': 'Get summary statistics for numeric columns',
                'priority': 'high',
                'confidence': 0.9,
                'reasoning': 'Numeric data detected - perfect for statistical analysis'
            })
        
        # Correlation analysis
        if data_characteristics['numeric_columns_count'] >= 2:
            recommendations.append({
                'analysis_type': 'correlation_analysis',
                'title': 'Correlation Analysis',
                'description': 'Find relationships between numeric variables',
                'priority': 'high',
                'confidence': 0.8,
                'reasoning': f'Multiple numeric columns ({data_characteristics["numeric_columns_count"]}) - ideal for correlation analysis'
            })
        
        # Time series analysis
        if data_characteristics['has_time_series']:
            recommendations.append({
                'analysis_type': 'time_series_analysis',
                'title': 'Time Series Analysis',
                'description': 'Analyze trends and patterns over time',
                'priority': 'high',
                'confidence': 0.9,
                'reasoning': 'Time series data detected - perfect for trend analysis'
            })
        
        # Categorical analysis
        if data_characteristics['has_categorical_data']:
            recommendations.append({
                'analysis_type': 'categorical_analysis',
                'title': 'Categorical Analysis',
                'description': 'Analyze distribution and patterns in categories',
                'priority': 'medium',
                'confidence': 0.8,
                'reasoning': f'Categorical data detected ({data_characteristics["categorical_columns_count"]} columns)'
            })
        
        # Anomaly detection
        if data_characteristics['has_numeric_data'] and data_characteristics['row_count'] > 50:
            recommendations.append({
                'analysis_type': 'anomaly_detection',
                'title': 'Anomaly Detection',
                'description': 'Identify unusual patterns or outliers',
                'priority': 'medium',
                'confidence': 0.7,
                'reasoning': 'Sufficient numeric data for anomaly detection'
            })
        
        return recommendations
    
    def recommend_insights(self, dataframe: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Recommend specific insights to look for
        """
        insights = []
        
        data_characteristics = self._analyze_data_characteristics(dataframe)
        
        # Data quality insights
        if data_characteristics['missing_data_percentage'] > 5:
            insights.append({
                'insight_type': 'data_quality',
                'title': 'Data Quality Check',
                'description': 'Investigate missing data patterns',
                'priority': 'high',
                'reasoning': f'High missing data rate ({data_characteristics["missing_data_percentage"]:.1f}%)'
            })
        
        # Distribution insights
        if data_characteristics['has_numeric_data']:
            insights.append({
                'insight_type': 'distribution_analysis',
                'title': 'Distribution Analysis',
                'description': 'Check if data follows normal distribution',
                'priority': 'medium',
                'reasoning': 'Numeric data available for distribution analysis'
            })
        
        # Seasonal patterns
        if data_characteristics['has_time_series']:
            insights.append({
                'insight_type': 'seasonal_patterns',
                'title': 'Seasonal Patterns',
                'description': 'Look for seasonal trends and cycles',
                'priority': 'medium',
                'reasoning': 'Time series data suitable for seasonal analysis'
            })
        
        # Business insights
        if data_characteristics['has_categorical_data']:
            insights.append({
                'insight_type': 'segment_analysis',
                'title': 'Segment Analysis',
                'description': 'Compare performance across different segments',
                'priority': 'high',
                'reasoning': 'Categorical data enables segment comparison'
            })
        
        return insights
    
    def _analyze_data_characteristics(self, dataframe: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze characteristics of the dataframe
        """
        characteristics = {
            'row_count': len(dataframe),
            'column_count': len(dataframe.columns),
            'has_numeric_data': False,
            'has_categorical_data': False,
            'has_time_series': False,
            'numeric_columns_count': 0,
            'categorical_columns_count': 0,
            'missing_data_percentage': 0,
            'duplicate_rows_percentage': 0
        }
        
        # Analyze column types
        numeric_cols = dataframe.select_dtypes(include=[np.number]).columns
        categorical_cols = dataframe.select_dtypes(include=['object', 'category']).columns
        
        characteristics['numeric_columns_count'] = len(numeric_cols)
        characteristics['categorical_columns_count'] = len(categorical_cols)
        characteristics['has_numeric_data'] = len(numeric_cols) > 0
        characteristics['has_categorical_data'] = len(categorical_cols) > 0
        
        # Check for time series
        for col in dataframe.columns:
            if dataframe[col].dtype == 'datetime64[ns]' or 'date' in col.lower() or 'time' in col.lower():
                characteristics['has_time_series'] = True
                break
        
        # Calculate missing data percentage
        total_cells = dataframe.size
        missing_cells = dataframe.isnull().sum().sum()
        characteristics['missing_data_percentage'] = (missing_cells / total_cells) * 100
        
        # Calculate duplicate rows percentage
        duplicate_count = dataframe.duplicated().sum()
        characteristics['duplicate_rows_percentage'] = (duplicate_count / len(dataframe)) * 100
        
        return characteristics
    
    def _calculate_chart_score(self, characteristics: Dict[str, Any], conditions: List[str]) -> float:
        """
        Calculate score for a chart type based on data characteristics
        """
        score = 0.0
        
        for condition in conditions:
            if condition == 'time_series' and characteristics['has_time_series']:
                score += 0.4
            elif condition == 'continuous_data' and characteristics['has_numeric_data']:
                score += 0.3
            elif condition == 'categorical_data' and characteristics['has_categorical_data']:
                score += 0.3
            elif condition == 'trend_analysis' and characteristics['has_time_series'] and characteristics['has_numeric_data']:
                score += 0.3
            elif condition == 'comparison' and characteristics['has_categorical_data']:
                score += 0.2
            elif condition == 'percentage_distribution' and characteristics['has_categorical_data']:
                score += 0.2
            elif condition == 'correlation_analysis' and characteristics['numeric_columns_count'] >= 2:
                score += 0.3
            elif condition == 'two_numeric_columns' and characteristics['numeric_columns_count'] >= 2:
                score += 0.2
            elif condition == 'distribution_analysis' and characteristics['has_numeric_data']:
                score += 0.2
            elif condition == 'single_numeric_column' and characteristics['numeric_columns_count'] >= 1:
                score += 0.2
            elif condition == 'correlation_matrix' and characteristics['numeric_columns_count'] >= 3:
                score += 0.3
            elif condition == 'multiple_numeric_columns' and characteristics['numeric_columns_count'] >= 3:
                score += 0.2
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _generate_reasoning(self, characteristics: Dict[str, Any], conditions: List[str]) -> str:
        """
        Generate human-readable reasoning for recommendations
        """
        reasoning_parts = []
        
        if 'time_series' in conditions and characteristics['has_time_series']:
            reasoning_parts.append("Time series data detected")
        
        if 'continuous_data' in conditions and characteristics['has_numeric_data']:
            reasoning_parts.append(f"Numeric data available ({characteristics['numeric_columns_count']} columns)")
        
        if 'categorical_data' in conditions and characteristics['has_categorical_data']:
            reasoning_parts.append(f"Categorical data available ({characteristics['categorical_columns_count']} columns)")
        
        if 'correlation_analysis' in conditions and characteristics['numeric_columns_count'] >= 2:
            reasoning_parts.append("Multiple numeric columns for correlation analysis")
        
        return "; ".join(reasoning_parts) if reasoning_parts else "General data visualization"
    
    def _get_data_requirements(self, chart_type: str) -> Dict[str, Any]:
        """
        Get data requirements for a chart type
        """
        requirements = {
            'line_chart': {
                'min_columns': 2,
                'required_types': ['numeric', 'datetime'],
                'description': 'Requires at least one numeric column and one time/date column'
            },
            'bar_chart': {
                'min_columns': 2,
                'required_types': ['numeric', 'categorical'],
                'description': 'Requires one categorical column and one numeric column'
            },
            'pie_chart': {
                'min_columns': 1,
                'required_types': ['categorical'],
                'description': 'Requires one categorical column'
            },
            'scatter_plot': {
                'min_columns': 2,
                'required_types': ['numeric', 'numeric'],
                'description': 'Requires two numeric columns'
            },
            'histogram': {
                'min_columns': 1,
                'required_types': ['numeric'],
                'description': 'Requires one numeric column'
            },
            'heatmap': {
                'min_columns': 3,
                'required_types': ['numeric'],
                'description': 'Requires multiple numeric columns for correlation matrix'
            }
        }
        
        return requirements.get(chart_type, {
            'min_columns': 1,
            'required_types': ['any'],
            'description': 'General chart requirements'
        })
    
    def _get_example_config(self, chart_type: str, dataframe: pd.DataFrame) -> Dict[str, Any]:
        """
        Get example configuration for a chart type
        """
        configs = {
            'line_chart': {
                'x_axis': self._find_date_column(dataframe),
                'y_axis': self._find_numeric_column(dataframe),
                'title': 'Trend Analysis',
                'description': 'Shows trend over time'
            },
            'bar_chart': {
                'x_axis': self._find_categorical_column(dataframe),
                'y_axis': self._find_numeric_column(dataframe),
                'title': 'Category Comparison',
                'description': 'Compares values across categories'
            },
            'pie_chart': {
                'category': self._find_categorical_column(dataframe),
                'title': 'Distribution Analysis',
                'description': 'Shows proportion of categories'
            },
            'scatter_plot': {
                'x_axis': self._find_numeric_column(dataframe),
                'y_axis': self._find_numeric_column(dataframe, exclude_first=True),
                'title': 'Correlation Analysis',
                'description': 'Shows relationship between two variables'
            },
            'histogram': {
                'column': self._find_numeric_column(dataframe),
                'title': 'Distribution Analysis',
                'description': 'Shows distribution of values'
            },
            'heatmap': {
                'columns': self._find_multiple_numeric_columns(dataframe),
                'title': 'Correlation Matrix',
                'description': 'Shows correlations between variables'
            }
        }
        
        return configs.get(chart_type, {})
    
    def _find_date_column(self, dataframe: pd.DataFrame) -> Optional[str]:
        """Find a date/time column in the dataframe"""
        for col in dataframe.columns:
            if dataframe[col].dtype == 'datetime64[ns]' or 'date' in col.lower() or 'time' in col.lower():
                return col
        return None
    
    def _find_numeric_column(self, dataframe: pd.DataFrame, exclude_first: bool = False) -> Optional[str]:
        """Find a numeric column in the dataframe"""
        numeric_cols = dataframe.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            return None
        
        start_index = 1 if exclude_first and len(numeric_cols) > 1 else 0
        return numeric_cols[start_index] if start_index < len(numeric_cols) else numeric_cols[0]
    
    def _find_categorical_column(self, dataframe: pd.DataFrame) -> Optional[str]:
        """Find a categorical column in the dataframe"""
        categorical_cols = dataframe.select_dtypes(include=['object', 'category']).columns
        return categorical_cols[0] if len(categorical_cols) > 0 else None
    
    def _find_multiple_numeric_columns(self, dataframe: pd.DataFrame, max_cols: int = 5) -> List[str]:
        """Find multiple numeric columns in the dataframe"""
        numeric_cols = dataframe.select_dtypes(include=[np.number]).columns
        return list(numeric_cols[:max_cols])
