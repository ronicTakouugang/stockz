from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from models.prediction import StockPredictor
from models.sentiment import SentimentAnalyzer
from utils.backtest import run_backtest
import uvicorn
import os
import json
from datetime import datetime, timedelta

app = FastAPI()

# Cache directory
CACHE_DIR = "cache"
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

try:
    sentiment_analyzer = SentimentAnalyzer()
except Exception as e:
    print(f"Failed to load sentiment analyzer: {e}")
    sentiment_analyzer = None

class AnalysisRequest(BaseModel):
    symbol: str

def get_cached_analysis(symbol: str, category: str, hours: int = 12):
    cache_path = os.path.join(CACHE_DIR, f"{symbol}_{category}.json")
    if os.path.exists(cache_path):
        file_mod_time = os.path.getmtime(cache_path)
        if (datetime.now().timestamp() - file_mod_time) < (hours * 3600):
            try:
                with open(cache_path, 'r') as f:
                    return json.load(f)
            except:
                pass
    return None

def save_cached_analysis(symbol: str, category: str, data: dict):
    cache_path = os.path.join(CACHE_DIR, f"{symbol}_{category}.json")
    try:
        with open(cache_path, 'w') as f:
            json.dump(data, f)
    except:
        pass

@app.get("/predict/{symbol}")
async def get_prediction(symbol: str, days: int = 30):
    cached = get_cached_analysis(symbol, f"prediction_{days}", 1)
    if cached:
        return cached
        
    predictor = StockPredictor(symbol)
    if predictor.train(epochs=5):
        prediction = predictor.predict(days=days)
        if prediction:
            save_cached_analysis(symbol, f"prediction_{days}", prediction)
            return prediction
    raise HTTPException(status_code=404, detail="Prediction failed")

@app.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str):
    cached = get_cached_analysis(symbol, "sentiment", 6)
    if cached:
        return cached

    sentiment = sentiment_analyzer.get_sentiment(symbol)
    if "error" in sentiment:
        raise HTTPException(status_code=500, detail=sentiment["error"])
    
    save_cached_analysis(symbol, "sentiment", sentiment)
    return sentiment

@app.get("/backtest/{symbol}")
async def get_backtest(symbol: str):
    cached = get_cached_analysis(symbol, "backtest", 24)
    if cached:
        return cached

    results = run_backtest(symbol)
    if results:
        save_cached_analysis(symbol, "backtest", results)
        return results
    raise HTTPException(status_code=404, detail="Backtest failed")

@app.get("/full-analysis/{symbol}")
async def get_full_analysis(symbol: str, days: int = 30):
    try:
        # Check for full analysis cache (shorter TTL as it combines everything)
        cached = get_cached_analysis(symbol, f"full_{days}", 1)
        if cached:
            return cached

        predictor = StockPredictor(symbol)
        # train() now handles its own model persistence
        predictor.train(epochs=5)
        prediction = predictor.predict(days=days)
        
        sentiment = sentiment_analyzer.get_sentiment(symbol) if sentiment_analyzer else {"sentiment": "Neutral", "score": 0.0, "count": 0, "status": "Model Offline"}
        backtest = run_backtest(symbol)
        
        # Get historical data for the frontend fallback
        history_data = predictor.fetch_data(period="1y")
        if not history_data.empty:
            history = {
                "timestamps": (history_data.index.astype(int) // 10**9).tolist(),
                "open": history_data['Open'].values.flatten().tolist() if 'Open' in history_data.columns else history_data['Close'].values.flatten().tolist(),
                "close": history_data['Close'].values.flatten().tolist(),
                "high": history_data['High'].values.flatten().tolist(),
                "low": history_data['Low'].values.flatten().tolist(),
                "volume": history_data['Volume'].values.flatten().tolist(),
            }
        else:
            history = {
                "timestamps": [],
                "close": [],
                "high": [],
                "low": [],
                "volume": [],
            }

        # Get SPY history for correlation fallback
        spy_predictor = StockPredictor("SPY")
        spy_history_data = spy_predictor.fetch_data(period="1y")
        if not spy_history_data.empty:
            spy_history = {
                "timestamps": (spy_history_data.index.astype(int) // 10**9).tolist(),
                "close": spy_history_data['Close'].values.flatten().tolist(),
            }
        else:
            spy_history = {
                "timestamps": [],
                "close": [],
            }
        
        result = {
            "prediction": prediction,
            "sentiment": sentiment,
            "backtest": backtest,
            "history": history,
            "spy_history": spy_history
        }
        
        save_cached_analysis(symbol, f"full_{days}", result)
        return result
    except Exception as e:
        print(f"Full analysis error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
