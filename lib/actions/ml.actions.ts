"use server";

import { fetchStockCandles } from "@/lib/actions/finnhub.actions";
import { 
  calculateSMA, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands, 
  calculateATR 
} from "@/lib/ml/indicators";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import Usage from "@/database/models/usage.model";
import { connectToDatabase } from "@/database/mongoose";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getStockAnalysis(symbol: string, days: number = 30) {
  try {
    // 0. Check Usage Limit
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please sign in to use AI analysis." };
    }

    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0];

    await connectToDatabase();

    const usage = await Usage.findOne({ userId, date: today });
    const currentCount = usage?.count || 0;
    const LIMIT = 5;

    if (currentCount >= LIMIT) {
      return { 
        success: false, 
        error: `Daily AI quota reached (${LIMIT}/${LIMIT}). Please try again tomorrow.` 
      };
    }

    // 1. Try Python Backend first as it's now optimized and provides fallback data
    let pythonData = null;
    try {
      const pyRes = await fetch(`http://localhost:8000/full-analysis/${symbol}?days=${days}`);
      if (pyRes.ok) {
        pythonData = await pyRes.json();
      }
    } catch (e) {
      console.error("Python backend connection failed:", e);
    }

    // 2. Try to fetch candles from Finnhub (only if python fallback is missing)
    const to = Math.floor(Date.now() / 1000);
    const from = to - (365 * 24 * 60 * 60); // 1 year of data

    let candles = null;
    let spyCandles = null;

    if (pythonData?.history?.close && pythonData.history.close.length > 0) {
      console.log(`Using Python backend data for ${symbol}`);
      candles = {
        s: 'ok',
        o: pythonData.history.open || pythonData.history.close,
        c: pythonData.history.close,
        h: pythonData.history.high,
        l: pythonData.history.low,
        v: pythonData.history.volume,
        t: pythonData.history.timestamps
      };
    } else {
      candles = await fetchStockCandles(symbol, 'D', from, to);
    }

    if (pythonData?.spy_history?.close && pythonData.spy_history.close.length > 0) {
      spyCandles = {
        s: 'ok',
        c: pythonData.spy_history.close
      };
    } else {
      spyCandles = await fetchStockCandles('SPY', 'D', from, to);
    }

    if (!candles || candles.s !== 'ok') {
      return { success: false, error: "Failed to fetch market data from all sources" };
    }

    const { c: close, h: high, l: low, v: volume, t: timestamps } = candles;
    const spyClose = spyCandles?.c || [];

    // Calculate Indicators
    const sma20 = calculateSMA(close, 20);
    const sma50 = calculateSMA(close, 50);
    const ema20 = calculateEMA(close, 20);
    const rsi14 = calculateRSI(close, 14);
    const macd = calculateMACD(close);
    const bb = calculateBollingerBands(close, 20);
    const atr = calculateATR(high, low, close, 14);

    // Calculate Correlation (simple pearson for last 30 days)
    let correlation = 0;
    if (spyClose.length >= 30 && close.length >= 30) {
      const s1 = close.slice(-30);
      const s2 = spyClose.slice(-30);
      const m1 = s1.reduce((a, b) => a + b, 0) / 30;
      const m2 = s2.reduce((a, b) => a + b, 0) / 30;
      const num = s1.reduce((a, b, i) => a + (b - m1) * (s2[i] - m2), 0);
      const den = Math.sqrt(s1.reduce((a, b) => a + Math.pow(b - m1, 2), 0) * s2.reduce((a, b) => a + Math.pow(b - m2, 2), 0));
      correlation = den !== 0 ? num / den : 0;
    }

    // Get latest values
    const lastIdx = close.length - 1;
    const currentPrice = close[lastIdx];
    
    const analysisData = {
      symbol,
      currentPrice,
      sma20: sma20[lastIdx],
      sma50: sma50[lastIdx],
      ema20: ema20[lastIdx],
      rsi: rsi14[lastIdx],
      macd: macd.macd[lastIdx],
      macdSignal: macd.signal[lastIdx],
      bbUpper: bb.upper[lastIdx],
      bbLower: bb.lower[lastIdx],
      atr: atr[lastIdx],
      volume: volume[lastIdx],
      correlationWithSPY: correlation,
      recentPrices: close.slice(-10),
    };

    // AI Analysis using Gemini (augmented with Python ML results if available)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      You are an expert quantitative data scientist and technical analyst.
      Analyze the following technical indicators and ML model outputs for ${symbol} and provide a market prediction for the next ${days} days.
      
      Technical Data:
      Current Price: ${analysisData.currentPrice}
      SMA 20: ${analysisData.sma20}, SMA 50: ${analysisData.sma50}
      RSI (14): ${analysisData.rsi}
      MACD: ${analysisData.macd}, Signal: ${analysisData.macdSignal}
      ATR (Volatility): ${analysisData.atr}
      
      ${pythonData && pythonData.prediction ? `
      Prophet Prediction Model (Horizon: ${days} days):
      - Predicted Price (end of horizon): ${pythonData.prediction.predicted_price}
      - Expected Return: ${pythonData.prediction.expected_return}%
      - Model Confidence: ${pythonData.prediction.confidence}%
      - Risk Level: ${pythonData.prediction.risk_level}
      ` : ''}
      
      ${pythonData && pythonData.sentiment && !pythonData.sentiment.error ? `
      Sentiment Analysis (FinBERT):
      - Sentiment: ${pythonData.sentiment.sentiment}
      - Score: ${pythonData.sentiment.score} (positive: ${pythonData.sentiment.positive}, negative: ${pythonData.sentiment.negative})
      ` : ''}
      
      ${pythonData && pythonData.backtest ? `
      Backtesting Metrics (SMA Crossover):
      - Total Return: ${pythonData.backtest.total_return}%
      - Sharpe Ratio: ${pythonData.backtest.sharpe_ratio}
      - Win Rate: ${pythonData.backtest.win_rate}%
      ` : ''}
      
      Provide your final synthesized analysis in the following JSON format:
      {
        "signal": "BUY" | "SELL" | "HOLD",
        "confidence": number (0-100),
        "riskLevel": "Low" | "Medium" | "High",
        "expectedReturn": number (percentage for next ${days} days),
        "marketRegime": "Trending Up" | "Trending Down" | "Sideways" | "Volatile",
        "reasoning": "Brief explanation combining technicals, Prophet prediction, and sentiment",
        "timeframe": "${days}D"
      }
      Return ONLY the raw JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Increment usage only after successful AI response
    await Usage.findOneAndUpdate(
      { userId, date: today },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const prediction = JSON.parse(jsonStr);

    return {
      success: true,
      data: {
        ...analysisData,
        prediction,
        pythonData, // Include raw python data for the dashboard
        history: {
          timestamps: timestamps.slice(-250),
          prices: close.slice(-250),
          open: candles.o.slice(-250),
          high: candles.h.slice(-250),
          low: candles.l.slice(-250),
          sma20: sma20.slice(-250),
          bbUpper: bb.upper.slice(-250),
          bbLower: bb.lower.slice(-250)
        }
      }
    };

  } catch (error: any) {
    console.error("Analysis failed:", error);
    
    // Check for Gemini 429 quota error
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
      return { 
        success: false, 
        error: "Global AI quota exceeded. The system-wide limit for the free tier has been reached. Please try again later." 
      };
    }

    return { success: false, error: "AI Analysis failed. Please try again." };
  }
}
