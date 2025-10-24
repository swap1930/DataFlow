import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import warnings
warnings.filterwarnings('ignore')

class InsightsGenerator:
    """
    AI-powered insights generator for data analysis
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        
    def analyze_data(self, dataframe: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Generate comprehensive insights from the data
        """
        insights = []
        
        # Basic data quality insights
        insights.extend(self._generate_data_quality_insights(dataframe))
        
        # Trend analysis
        insights.extend(self._analyze_trends(dataframe))
        
        # Anomaly detection
        insights.extend(self._detect_anomalies(dataframe))
        
        # Statistical insights
        insights.extend(self._generate_statistical_insights(dataframe))
        
        # Pattern recognition
        insights.extend(self._recognize_patterns(dataframe))
        
        return insights
    
    def _generate_data_quality_insights(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Generate data quality insights"""
        insights = []
        
        # Missing values analysis
        missing_data = df.isnull().sum()
        total_rows = len(df)
        
        if missing_data.sum() > 0:
            high_missing_cols = missing_data[missing_data > total_rows * 0.1]
            if len(high_missing_cols) > 0:
                insights.append({
                    "type": "data_quality",
                    "category": "missing_data",
                    "title": "High Missing Data Detected",
                    "message": f"Columns with >10% missing data: {', '.join(high_missing_cols.index)}",
                    "severity": "warning",
                    "confidence": 0.9,
                    "recommendation": "Consider data imputation or removing these columns"
                })
        
        # Duplicate rows
        duplicate_count = df.duplicated().sum()
        if duplicate_count > 0:
            insights.append({
                "type": "data_quality",
                "category": "duplicates",
                "title": "Duplicate Rows Found",
                "message": f"Found {duplicate_count} duplicate rows ({duplicate_count/len(df)*100:.1f}% of data)",
                "severity": "info",
                "confidence": 1.0,
                "recommendation": "Review and remove duplicates if necessary"
            })
        
        return insights
    
    def _analyze_trends(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Analyze trends in time series data"""
        insights = []
        
        # Look for date/time columns
        date_columns = []
        for col in df.columns:
            if df[col].dtype == 'datetime64[ns]' or 'date' in col.lower() or 'time' in col.lower():
                date_columns.append(col)
        
        if not date_columns:
            return insights
        
        # Analyze trends for numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for date_col in date_columns[:1]:  # Use first date column
            for num_col in numeric_cols[:3]:  # Analyze first 3 numeric columns
                try:
                    # Sort by date
                    sorted_df = df.sort_values(date_col)
                    
                    if len(sorted_df) < 3:
                        continue
                    
                    # Calculate trend
                    x = np.arange(len(sorted_df))
                    y = sorted_df[num_col].values
                    
                    # Remove NaN values
                    mask = ~np.isnan(y)
                    if np.sum(mask) < 3:
                        continue
                    
                    x_clean = x[mask]
                    y_clean = y[mask]
                    
                    # Linear regression for trend
                    model = LinearRegression()
                    model.fit(x_clean.reshape(-1, 1), y_clean)
                    slope = model.coef_[0]
                    
                    # Calculate trend strength
                    y_pred = model.predict(x_clean.reshape(-1, 1))
                    r_squared = model.score(x_clean.reshape(-1, 1), y_clean)
                    
                    if abs(slope) > 0 and r_squared > 0.3:  # Significant trend
                        trend_direction = "increasing" if slope > 0 else "decreasing"
                        trend_strength = "strong" if r_squared > 0.7 else "moderate" if r_squared > 0.5 else "weak"
                        
                        insights.append({
                            "type": "trend",
                            "category": "time_series",
                            "title": f"{trend_direction.capitalize()} Trend Detected",
                            "message": f"{num_col} shows {trend_strength} {trend_direction} trend (R² = {r_squared:.2f})",
                            "severity": "info",
                            "confidence": min(r_squared, 0.95),
                            "data": {
                                "column": num_col,
                                "trend_direction": trend_direction,
                                "trend_strength": trend_strength,
                                "r_squared": r_squared,
                                "slope": slope
                            },
                            "recommendation": f"Consider analyzing factors driving this {trend_direction} trend"
                        })
                        
                except Exception as e:
                    continue
        
        return insights
    
    def _detect_anomalies(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect anomalies in the data"""
        insights = []
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) == 0:
            return insights
        
        try:
            # Use first few numeric columns for anomaly detection
            analysis_cols = numeric_cols[:5]
            analysis_data = df[analysis_cols].dropna()
            
            if len(analysis_data) < 10:
                return insights
            
            # Fit anomaly detector
            self.anomaly_detector.fit(analysis_data)
            anomaly_scores = self.anomaly_detector.decision_function(analysis_data)
            anomaly_predictions = self.anomaly_detector.predict(analysis_data)
            
            # Count anomalies
            anomaly_count = np.sum(anomaly_predictions == -1)
            anomaly_percentage = (anomaly_count / len(analysis_data)) * 100
            
            if anomaly_count > 0:
                insights.append({
                    "type": "anomaly",
                    "category": "outliers",
                    "title": "Anomalies Detected",
                    "message": f"Found {anomaly_count} anomalous data points ({anomaly_percentage:.1f}% of data)",
                    "severity": "warning" if anomaly_percentage > 5 else "info",
                    "confidence": 0.8,
                    "data": {
                        "anomaly_count": int(anomaly_count),
                        "anomaly_percentage": round(anomaly_percentage, 2),
                        "total_points": len(analysis_data),
                        "columns_analyzed": list(analysis_cols)
                    },
                    "recommendation": "Review anomalous points for data quality issues or interesting patterns"
                })
                
        except Exception as e:
            pass
        
        return insights
    
    def _generate_statistical_insights(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Generate statistical insights"""
        insights = []
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols[:3]:  # Analyze first 3 numeric columns
            try:
                data = df[col].dropna()
                if len(data) < 2:
                    continue
                
                # Basic statistics
                mean_val = data.mean()
                std_val = data.std()
                min_val = data.min()
                max_val = data.max()
                
                # Coefficient of variation
                cv = (std_val / mean_val) * 100 if mean_val != 0 else 0
                
                # Distribution insights
                if cv > 50:
                    insights.append({
                        "type": "statistical",
                        "category": "variability",
                        "title": "High Variability Detected",
                        "message": f"{col} shows high variability (CV = {cv:.1f}%)",
                        "severity": "info",
                        "confidence": 0.8,
                        "data": {
                            "column": col,
                            "coefficient_of_variation": round(cv, 2),
                            "mean": round(mean_val, 2),
                            "std": round(std_val, 2)
                        },
                        "recommendation": "Consider segmenting data or investigating sources of variability"
                    })
                
                # Range insights
                range_val = max_val - min_val
                if range_val > mean_val * 10:  # Very wide range
                    insights.append({
                        "type": "statistical",
                        "category": "range",
                        "title": "Wide Data Range",
                        "message": f"{col} has a very wide range ({min_val:.2f} to {max_val:.2f})",
                        "severity": "info",
                        "confidence": 0.7,
                        "data": {
                            "column": col,
                            "min": round(min_val, 2),
                            "max": round(max_val, 2),
                            "range": round(range_val, 2)
                        },
                        "recommendation": "Consider log transformation or outlier analysis"
                    })
                    
            except Exception as e:
                continue
        
        return insights
    
    def _recognize_patterns(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Recognize patterns in the data"""
        insights = []
        
        # Look for categorical columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        
        for col in categorical_cols[:2]:  # Analyze first 2 categorical columns
            try:
                value_counts = df[col].value_counts()
                total_values = len(df[col].dropna())
                
                # Check for dominant categories
                if len(value_counts) > 1:
                    top_category = value_counts.iloc[0]
                    top_percentage = (top_category / total_values) * 100
                    
                    if top_percentage > 70:
                        insights.append({
                            "type": "pattern",
                            "category": "distribution",
                            "title": "Dominant Category Detected",
                            "message": f"{col} is dominated by '{value_counts.index[0]}' ({top_percentage:.1f}% of data)",
                            "severity": "info",
                            "confidence": 0.9,
                            "data": {
                                "column": col,
                                "dominant_category": value_counts.index[0],
                                "dominant_percentage": round(top_percentage, 2),
                                "total_categories": len(value_counts)
                            },
                            "recommendation": "Consider stratified analysis or investigate category imbalance"
                        })
                
                # Check for uniform distribution
                if len(value_counts) > 5:
                    expected_count = total_values / len(value_counts)
                    chi_square_stat = sum((count - expected_count) ** 2 / expected_count for count in value_counts)
                    
                    if chi_square_stat < len(value_counts) * 0.5:  # Low chi-square suggests uniform distribution
                        insights.append({
                            "type": "pattern",
                            "category": "distribution",
                            "title": "Uniform Distribution",
                            "message": f"{col} shows relatively uniform distribution across categories",
                            "severity": "info",
                            "confidence": 0.7,
                            "data": {
                                "column": col,
                                "categories": len(value_counts),
                                "chi_square_statistic": round(chi_square_stat, 2)
                            },
                            "recommendation": "Good balance - suitable for comparative analysis"
                        })
                        
            except Exception as e:
                continue
        
        return insights
