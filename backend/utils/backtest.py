import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta

def run_backtest(symbol, strategy='sma_crossover'):
    # Fetch historical data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365) # 1 year backtest
    data = yf.download(symbol, start=start_date, end=end_date, progress=False)
    
    if data.empty:
        return None

    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    # Simple Strategy: SMA 20/50 Crossover
    data['SMA20'] = data['Close'].rolling(window=20).mean()
    data['SMA50'] = data['Close'].rolling(window=50).mean()
    
    data['Signal'] = 0.0
    data['Signal'] = np.where(data['SMA20'] > data['SMA50'], 1.0, 0.0)
    data['Position'] = data['Signal'].diff()
    
    # Calculate Returns
    data['Market Returns'] = data['Close'].pct_change()
    data['Strategy Returns'] = data['Market Returns'] * data['Signal'].shift(1)
    
    # Cumulative Returns
    cumulative_market_returns = (1 + data['Market Returns']).cumprod() - 1
    cumulative_strategy_returns = (1 + data['Strategy Returns']).cumprod() - 1
    
    # Performance Metrics
    total_return = cumulative_strategy_returns.iloc[-1]
    annual_return = (1 + total_return) ** (252 / len(data)) - 1
    annual_vol = data['Strategy Returns'].std() * np.sqrt(252)
    sharpe_ratio = annual_return / annual_vol if annual_vol != 0 else 0
    
    # Max Drawdown
    cum_returns = (1 + data['Strategy Returns']).cumprod()
    peak = cum_returns.expanding(min_periods=1).max()
    drawdown = (cum_returns/peak) - 1
    max_drawdown = drawdown.min()
    
    # Win Rate
    wins = data[data['Strategy Returns'] > 0]['Strategy Returns'].count()
    losses = data[data['Strategy Returns'] < 0]['Strategy Returns'].count()
    win_rate = wins / (wins + losses) if (wins + losses) > 0 else 0
    
    return {
        "symbol": symbol,
        "total_return": float(total_return * 100),
        "annual_return": float(annual_return * 100),
        "sharpe_ratio": float(sharpe_ratio),
        "max_drawdown": float(max_drawdown * 100),
        "win_rate": float(win_rate * 100),
        "history": {
            "dates": data.index.strftime('%Y-%m-%d').tolist(),
            "market_returns": (cumulative_market_returns * 100).fillna(0).tolist(),
            "strategy_returns": (cumulative_strategy_returns * 100).fillna(0).tolist()
        }
    }
