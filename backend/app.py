import os
import json
import logging
import re
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import Optional

from models.prediction import StockPredictor
from models.sentiment import SentimentAnalyzer
from utils.backtest import run_backtest

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache directory
CACHE_DIR = "cache"
os.makedirs(CACHE_DIR, exist_ok=True)
CACHE_DIR_REAL_PATH = os.path.realpath(CACHE_DIR)

try:
    stock_predictor_instance = StockPredictor() # Renamed to avoid conflict with local 'predictor'
except Exception as e:
    logger.error(f"Failed to load stock predictor: {e}")
    stock_predictor_instance = None

try:
    sentiment_analyzer = SentimentAnalyzer()
except Exception as e:
    logger.error(f"Failed to load sentiment analyzer: {e}")
    sentiment_analyzer = None

class AnalysisRequest(BaseModel):
    symbol: str

def _sanitize_filename_part(part: str) -> str:
    """Sanitizes a string to be used as part of a filename."""
    return re.sub(r'[^\w.-]', '', part).strip()

def _get_safe_cache_path(symbol: str, category: str) -> Optional[str]:
    """
    Constructs a safe cache file path and verifies it's within CACHE_DIR.
    Returns None if the path is unsafe.
    """
    sanitized_symbol = _sanitize_filename_part(symbol)
    sanitized_category = _sanitize_filename_part(category)
    
    if not sanitized_symbol or not sanitized_category:
        logger.error(f"Sanitized symbol or category is empty: symbol='{symbol}', category='{category}'")
        return None

    filename = f"{sanitized_symbol}_{sanitized_category}.json"
    prospective_path = os.path.join(CACHE_DIR, filename)
    
    # Resolve the real path to prevent directory traversal
    resolved_path = os.path.realpath(prospective_path)

    # Ensure the resolved path is actually inside our intended cache directory
    if not resolved_path.startswith(CACHE_DIR_REAL_PATH):
        logger.error(f"Attempted path traversal detected: {prospective_path} resolved to {resolved_path}")
        return None
    
    return prospective_path


def get_cached_analysis(symbol: str, category: str, hours: int = 12):
    cache_path = _get_safe_cache_path(symbol, category)
    if not cache_path:
        return None
    
    if os.path.exists(cache_path):
        try:
            file_mod_time = os.path.getmtime(cache_path)
            if (datetime.now().timestamp() - file_mod_time) < (hours * 3600):
                with open(cache_path, 'r') as f:
                    return json.load(f)
            else:
                logger.info(f"Cache for {symbol}_{category} expired.")
        except FileNotFoundError:
            logger.warning(f"Cache file '{cache_path}' disappeared unexpectedly.")
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON from cache file '{cache_path}': {e}")
        except IOError as e:
            logger.error(f"I/O error reading cache file '{cache_path}': {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred while reading cache '{cache_path}': {e}")
    return None

def save_cached_analysis(symbol: str, category: str, data: dict):
    cache_path = _get_safe_cache_path(symbol, category)
    if not cache_path:
        logger.warning(f"Failed to get safe cache path for saving: symbol='{symbol}', category='{category}'")
        return
    
    try:
        with open(cache_path, 'w') as f:
            json.dump(data, f)
    except IOError as e:
        logger.error(f"I/O error writing to cache file '{cache_path}': {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred while saving cache '{cache_path}': {e}")

@app.get("/predict/{symbol}")
async def get_prediction(symbol: str, days: int = 30):
    if not stock_predictor_instance:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stock predictor model not loaded.")

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
    if sentiment_analyzer is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Sentiment analyzer model not loaded.")

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
