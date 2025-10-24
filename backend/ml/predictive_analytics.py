import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import warnings
warnings.filterwarnings('ignore')

class PredictiveAnalytics:
    """
    Predictive analytics service for forecasting and predictions
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        
    def predict_sales(self, data: pd.DataFrame, target_column: str = None) -> Dict[str, Any]:
        """
        Predict future sales based on historical data
        """
        try:
            # Auto-detect target column if not provided
            if not target_column:
                target_column = self._detect_target_column(data)
            
            if not target_column:
                return {"error": "No suitable target column found for prediction"}
            
            # Prepare data
            prepared_data = self._prepare_time_series_data(data, target_column)
            
            if prepared_data is None:
                return {"error": "Insufficient data for prediction"}
            
            # Train model
            predictions = self._train_and_predict(prepared_data, target_column)
            
            return {
                "success": True,
                "target_column": target_column,
                "predictions": predictions,
                "model_performance": predictions.get("performance", {}),
                "forecast_periods": len(predictions.get("future_values", []))
            }
            
        except Exception as e:
            return {"error": f"Prediction failed: {str(e)}"}
    
    def predict_trends(self, data: pd.DataFrame, columns: List[str] = None) -> Dict[str, Any]:
        """
        Predict trends for multiple columns
        """
        try:
            if not columns:
                numeric_cols = data.select_dtypes(include=[np.number]).columns
                columns = list(numeric_cols[:3])  # First 3 numeric columns
            
            trend_predictions = {}
            
            for col in columns:
                try:
                    trend_data = self._analyze_column_trend(data, col)
                    if trend_data:
                        trend_predictions[col] = trend_data
                except Exception as e:
                    continue
            
            return {
                "success": True,
                "trend_predictions": trend_predictions,
                "analyzed_columns": list(trend_predictions.keys())
            }
            
        except Exception as e:
            return {"error": f"Trend prediction failed: {str(e)}"}
    
    def predict_anomalies(self, data: pd.DataFrame, columns: List[str] = None) -> Dict[str, Any]:
        """
        Predict potential anomalies in future data
        """
        try:
            if not columns:
                numeric_cols = data.select_dtypes(include=[np.number]).columns
                columns = list(numeric_cols[:3])
            
            anomaly_predictions = {}
            
            for col in columns:
                try:
                    anomaly_data = self._predict_column_anomalies(data, col)
                    if anomaly_data:
                        anomaly_predictions[col] = anomaly_data
                except Exception as e:
                    continue
            
            return {
                "success": True,
                "anomaly_predictions": anomaly_predictions,
                "risk_level": self._calculate_overall_risk(anomaly_predictions)
            }
            
        except Exception as e:
            return {"error": f"Anomaly prediction failed: {str(e)}"}
    
    def _detect_target_column(self, data: pd.DataFrame) -> Optional[str]:
        """
        Auto-detect the best target column for prediction
        """
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        
        # Look for common target column names
        target_keywords = ['sales', 'revenue', 'amount', 'value', 'price', 'cost', 'profit']
        
        for col in numeric_cols:
            col_lower = col.lower()
            if any(keyword in col_lower for keyword in target_keywords):
                return col
        
        # If no keyword match, return first numeric column with sufficient data
        for col in numeric_cols:
            if data[col].notna().sum() > len(data) * 0.8:  # At least 80% non-null
                return col
        
        return None
    
    def _prepare_time_series_data(self, data: pd.DataFrame, target_column: str) -> Optional[pd.DataFrame]:
        """
        Prepare data for time series prediction
        """
        try:
            # Look for date/time column
            date_columns = []
            for col in data.columns:
                if data[col].dtype == 'datetime64[ns]' or 'date' in col.lower() or 'time' in col.lower():
                    date_columns.append(col)
            
            if not date_columns:
                # Create a simple index-based time series
                prepared_data = data[[target_column]].copy()
                prepared_data['time_index'] = range(len(prepared_data))
                prepared_data = prepared_data.dropna()
                
                if len(prepared_data) < 5:
                    return None
                
                return prepared_data
            
            # Use actual date column
            date_col = date_columns[0]
            prepared_data = data[[date_col, target_column]].copy()
            prepared_data = prepared_data.sort_values(date_col).dropna()
            
            if len(prepared_data) < 5:
                return None
            
            # Create time index
            prepared_data['time_index'] = range(len(prepared_data))
            
            return prepared_data
            
        except Exception as e:
            return None
    
    def _train_and_predict(self, data: pd.DataFrame, target_column: str) -> Dict[str, Any]:
        """
        Train model and make predictions
        """
        try:
            X = data[['time_index']].values
            y = data[target_column].values
            
            # Split data
            split_point = int(len(X) * 0.8)
            X_train, X_test = X[:split_point], X[split_point:]
            y_train, y_test = y[:split_point], y[split_point:]
            
            if len(X_train) < 3:
                return {"error": "Insufficient training data"}
            
            # Train multiple models
            models = {
                'linear': LinearRegression(),
                'random_forest': RandomForestRegressor(n_estimators=10, random_state=42)
            }
            
            best_model = None
            best_score = -np.inf
            model_results = {}
            
            for name, model in models.items():
                try:
                    model.fit(X_train, y_train)
                    y_pred = model.predict(X_test)
                    
                    if len(y_test) > 0:
                        mse = mean_squared_error(y_test, y_pred)
                        r2 = r2_score(y_test, y_pred)
                        
                        model_results[name] = {
                            'mse': mse,
                            'r2': r2,
                            'predictions': y_pred.tolist()
                        }
                        
                        if r2 > best_score:
                            best_score = r2
                            best_model = model
                            
                except Exception as e:
                    continue
            
            if best_model is None:
                return {"error": "No model could be trained"}
            
            # Make future predictions
            last_time_index = X[-1, 0]
            future_periods = min(5, len(X) // 4)  # Predict next 5 periods or 25% of data length
            
            future_X = np.array([[last_time_index + i + 1] for i in range(future_periods)])
            future_predictions = best_model.predict(future_X)
            
            # Calculate confidence intervals (simplified)
            residuals = y_train - best_model.predict(X_train)
            std_residuals = np.std(residuals)
            
            confidence_intervals = []
            for pred in future_predictions:
                confidence_intervals.append({
                    'lower': pred - 1.96 * std_residuals,
                    'upper': pred + 1.96 * std_residuals
                })
            
            return {
                'future_values': future_predictions.tolist(),
                'confidence_intervals': confidence_intervals,
                'performance': model_results,
                'best_model': 'linear' if best_score == model_results.get('linear', {}).get('r2', -np.inf) else 'random_forest',
                'r2_score': best_score,
                'trend_direction': 'increasing' if future_predictions[-1] > future_predictions[0] else 'decreasing'
            }
            
        except Exception as e:
            return {"error": f"Training failed: {str(e)}"}
    
    def _analyze_column_trend(self, data: pd.DataFrame, column: str) -> Optional[Dict[str, Any]]:
        """
        Analyze trend for a specific column
        """
        try:
            col_data = data[column].dropna()
            if len(col_data) < 3:
                return None
            
            # Simple trend analysis
            x = np.arange(len(col_data))
            y = col_data.values
            
            model = LinearRegression()
            model.fit(x.reshape(-1, 1), y)
            
            slope = model.coef_[0]
            r2 = model.score(x.reshape(-1, 1), y)
            
            # Predict next few values
            future_x = np.array([[len(col_data) + i] for i in range(3)])
            future_y = model.predict(future_x)
            
            return {
                'current_trend': 'increasing' if slope > 0 else 'decreasing',
                'trend_strength': r2,
                'slope': slope,
                'future_predictions': future_y.tolist(),
                'confidence': min(r2, 0.95)
            }
            
        except Exception as e:
            return None
    
    def _predict_column_anomalies(self, data: pd.DataFrame, column: str) -> Optional[Dict[str, Any]]:
        """
        Predict potential anomalies for a specific column
        """
        try:
            col_data = data[column].dropna()
            if len(col_data) < 5:
                return None
            
            # Calculate statistical thresholds
            mean_val = col_data.mean()
            std_val = col_data.std()
            
            # Define anomaly thresholds
            upper_threshold = mean_val + 2 * std_val
            lower_threshold = mean_val - 2 * std_val
            
            # Count current anomalies
            current_anomalies = ((col_data > upper_threshold) | (col_data < lower_threshold)).sum()
            anomaly_rate = current_anomalies / len(col_data)
            
            # Predict future anomaly risk
            recent_data = col_data.tail(min(10, len(col_data) // 2))
            recent_volatility = recent_data.std() / recent_data.mean() if recent_data.mean() != 0 else 0
            
            risk_level = 'low'
            if anomaly_rate > 0.1 or recent_volatility > 0.5:
                risk_level = 'high'
            elif anomaly_rate > 0.05 or recent_volatility > 0.3:
                risk_level = 'medium'
            
            return {
                'current_anomaly_rate': anomaly_rate,
                'recent_volatility': recent_volatility,
                'risk_level': risk_level,
                'upper_threshold': upper_threshold,
                'lower_threshold': lower_threshold,
                'confidence': 0.8
            }
            
        except Exception as e:
            return None
    
    def _calculate_overall_risk(self, anomaly_predictions: Dict[str, Any]) -> str:
        """
        Calculate overall risk level from anomaly predictions
        """
        if not anomaly_predictions:
            return 'low'
        
        risk_levels = [pred.get('risk_level', 'low') for pred in anomaly_predictions.values()]
        
        if 'high' in risk_levels:
            return 'high'
        elif 'medium' in risk_levels:
            return 'medium'
        else:
            return 'low'
