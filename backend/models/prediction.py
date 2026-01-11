import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import os
from prophet import Prophet
import logging

# Suppress Prophet logging to keep output clean
logging.getLogger('prophet').setLevel(logging.ERROR)
logging.getLogger('cmdstanpy').setLevel(logging.ERROR)

class StockPredictor:
    def __init__(self, symbol, timeframe='1y'):
        self.symbol = symbol
        self.timeframe = timeframe
        self.look_back = 60
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.save_dir = os.path.join(base_dir, "saved_models")

    def fetch_data(self, period="2y"):
        try:
            # Prophet works better with more data, 2y is a good default for daily predictions
            data = yf.download(self.symbol, period=period, progress=False)
            if data.empty:
                # Fallback for some symbols or periods
                data = yf.download(self.symbol, start=(datetime.now() - timedelta(days=730)).strftime('%Y-%m-%d'), progress=False)
            
            if not data.empty and isinstance(data.columns, pd.MultiIndex):
                # Flatten MultiIndex columns (yfinance 0.2.0+ often returns them)
                data.columns = data.columns.get_level_values(0)
                
            return data
        except Exception as e:
            print(f"Error fetching data for {self.symbol}: {e}")
            return pd.DataFrame()

    def train(self, epochs=5, batch_size=32, force=False):
        # Prophet fits very quickly for single series, so we can fit it during prediction.
        # This method is kept to maintain API compatibility with the existing backend.
        return True

    def predict(self, days=30):
        data = self.fetch_data(period="2y")
        if data.empty:
            return None
            
        # Prepare data for Prophet: needs columns 'ds' and 'y'
        # Prophet expects 'ds' (datestamp) and 'y' (value to predict)
        df_prophet = data.reset_index()[['Date', 'Close']]
        df_prophet.columns = ['ds', 'y']
        
        # Remove timezone if exists (Prophet requirement)
        if df_prophet['ds'].dt.tz is not None:
            df_prophet['ds'] = df_prophet['ds'].dt.tz_localize(None)
            
        try:
            # Initialize and fit model
            model = Prophet(
                daily_seasonality=False,
                weekly_seasonality=True,
                yearly_seasonality=True,
                interval_width=0.95
            )
            model.fit(df_prophet)
            
            # Predict for the next N days
            future = model.make_future_dataframe(periods=days)
            forecast = model.predict(future)
            
            # Extract historical fit and future predictions
            # We want to return a list of dates and their corresponding yhat values
            forecast_data = {
                "ds": (forecast['ds'].astype(int) // 10**9).tolist(),
                "yhat": forecast['yhat'].tolist(),
                "yhat_lower": forecast['yhat_lower'].tolist(),
                "yhat_upper": forecast['yhat_upper'].tolist(),
            }
            
            # Get the last current price and the next predicted price (tomorrow)
            current_price = float(df_prophet['y'].iloc[-1])
            # Index of tomorrow is len(df_prophet)
            # Use min to avoid index out of bounds if days < 1 (though shouldn't happen)
            predicted_idx = min(len(df_prophet), len(forecast) - 1)
            predicted_price = float(forecast['yhat'].iloc[predicted_idx])
            
            # Calculate expected return percentage for the selected horizon
            final_predicted_price = float(forecast['yhat'].iloc[-1])
            expected_return = float(((final_predicted_price - current_price) / current_price) * 100)
            
            # Calculate volatility for risk assessment
            returns = data['Close'].pct_change().dropna()
            volatility = float(returns.std())
            
            # Confidence score based on Prophet's uncertainty interval at the end of horizon
            uncertainty = float(forecast['yhat_upper'].iloc[-1] - forecast['yhat_lower'].iloc[-1])
            uncertainty_percent = uncertainty / final_predicted_price if final_predicted_price != 0 else 0
            
            # Score: 100 - (scaled uncertainty and volatility)
            confidence = max(40, min(95, 100 - (uncertainty_percent * 500) - (volatility * 1000)))
            
            # Risk level based on volatility
            if volatility > 0.03:
                risk_level = "High"
            elif volatility > 0.015:
                risk_level = "Medium"
            else:
                risk_level = "Low"
                
            return {
                "predicted_price": predicted_price,
                "expected_return": expected_return,
                "confidence": float(confidence),
                "risk_level": risk_level,
                "signal": "BUY" if expected_return > 1 else "SELL" if expected_return < -1 else "HOLD",
                "current_price": current_price,
                "market_regime": self.get_market_regime(data),
                "forecast": forecast_data
            }
        except Exception as e:
            print(f"Prophet prediction error for {self.symbol}: {e}")
            return None

    def get_market_regime(self, data):
        try:
            # Extract close prices correctly
            close_prices = data['Close']
            
            # Use last 60 days for SMA calculation
            last_prices = close_prices.tail(60)
            if last_prices.empty:
                return "Unknown"

            sma20 = last_prices.rolling(window=20).mean().iloc[-1]
            sma50 = last_prices.rolling(window=50).mean().iloc[-1]
            current_price = last_prices.iloc[-1]
            
            if current_price > sma20 > sma50:
                return "Trending Up"
            elif current_price < sma20 < sma50:
                return "Trending Down"
            elif abs(sma20 - sma50) / (sma50 if sma50 != 0 else 1) < 0.02:
                return "Sideways"
            else:
                return "Volatile"
        except Exception as e:
            print(f"Error calculating market regime: {e}")
            return "Unknown"
