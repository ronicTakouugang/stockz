"use client";

import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Bar,
  Cell,
} from 'recharts';

interface PredictionChartProps {
  data: {
    timestamps: number[];
    prices: number[];
    open?: number[];
    high?: number[];
    low?: number[];
    sma20: (number | null)[];
    bbUpper: (number | null)[];
    bbLower: (number | null)[];
  };
  forecast?: {
    ds: number[];
    yhat: number[];
    yhat_lower: number[];
    yhat_upper: number[];
  };
  timeframe?: string;
}

const CustomTooltip = ({ active, payload, label, chartData }) => {
  if (active && payload && payload.length) {
    const entry = chartData.find(d => d.date === label);
    return (
      <div className="p-2 bg-[#171717] border border-[#262626] rounded-lg text-xs shadow-lg">
        <p className="text-[#a3a3a3] mb-1">{label}</p>
        {payload.map((pld) => {
          let value;
          const color = pld.color || pld.stroke || pld.fill;

          if (pld.dataKey === 'wick') {
              return (
                  <p key={pld.dataKey} style={{ color: entry?.color }}>
                      {`High/Low: ${entry?.low?.toFixed(2)} - ${entry?.high?.toFixed(2)}`}
                  </p>
              );
          }
          if (pld.dataKey === 'candle') {
              return (
                  <p key={pld.dataKey} style={{ color: entry?.color }}>
                      {`Open/Close: ${entry?.open?.toFixed(2)} - ${entry?.price?.toFixed(2)}`}
                  </p>
              );
          }

          if (typeof pld.value === 'number') {
            value = pld.value.toFixed(2);
          } else {
            return null; // Don't render if no value
          }

          return (
            <p key={pld.dataKey} style={{ color }}>
              {`${pld.name}: ${value}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};


const PredictionChart = ({ data, forecast, timeframe = '1M' }: PredictionChartProps) => {
  // Normalize date to start of day in UTC to avoid timezone issues
  const normalizeDate = (t: number) => {
    const d = new Date(t * 1000);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000;
  };

  // Combine historical data and forecast data
  const historicalData = data.timestamps.map((t, i) => ({
    date: normalizeDate(t),
    price: data.prices[i],
    open: data.open?.[i],
    high: data.high?.[i],
    low: data.low?.[i],
    sma20: data.sma20[i],
    type: 'historical'
  }));

  const forecastData = forecast ? forecast.ds.map((t, i) => ({
    date: normalizeDate(t),
    predicted: forecast.yhat[i],
    lower: forecast.yhat_lower[i],
    upper: forecast.yhat_upper[i],
    type: 'forecast'
  })) : [];

  // Merge them for the chart
  const allTimestamps = Array.from(new Set([
    ...historicalData.map(d => d.date),
    ...forecastData.map(d => d.date)
  ])).sort((a, b) => a - b);

  const lastHistoricalTimestamp = historicalData.length > 0 
    ? historicalData[historicalData.length - 1].date 
    : 0;

  let chartData = allTimestamps.map(t => {
    const h = historicalData.find(d => d.date === t);
    const f = forecastData.find(d => d.date === t);
    
    // Use price if available, otherwise use open (fallback)
    const currentPrice = h?.price;
    const currentOpen = h?.open || currentPrice;
    const isUp = currentPrice && currentOpen ? currentPrice >= currentOpen : true;
    
    return {
      timestamp: t,
      date: new Date(t * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC' 
      }),
      price: currentPrice,
      open: currentOpen,
      high: h?.high,
      low: h?.low,
      candle: currentOpen && currentPrice ? [Math.min(currentOpen, currentPrice), Math.max(currentOpen, currentPrice)] : null,
      wick: h?.high && h?.low ? [h.low, h.high] : null,
      color: isUp ? "#10b981" : "#ef4444",
      sma20: h?.sma20,
      predicted: f?.predicted,
      lower: f?.lower,
      upper: f?.upper,
      isFuture: t > lastHistoricalTimestamp
    };
  });

  // Filter based on timeframe for historical part, but always show future forecast
  const now = normalizeDate(Math.floor(Date.now() / 1000));
  const oneDay = 24 * 60 * 60;
  
  if (timeframe === '1D') {
    chartData = chartData.filter(d => d.timestamp >= lastHistoricalTimestamp - oneDay);
  } else if (timeframe === '1W') {
    chartData = chartData.filter(d => d.timestamp >= lastHistoricalTimestamp - (7 * oneDay));
  } else if (timeframe === '1M') {
    chartData = chartData.filter(d => d.timestamp >= lastHistoricalTimestamp - (30 * oneDay));
  }
  // Default 'ALL' or other values show full history (250 points we now pass)

  const todayLabel = chartData.find(d => d.timestamp === lastHistoricalTimestamp)?.date;

  return (
    <div className="w-full bg-transparent p-0">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#525252" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis 
            hide 
            domain={['auto', 'auto']}
          />
          <Tooltip 
            content={<CustomTooltip chartData={chartData} />}
          />
          
          {/* Uncertainty Interval - Rendered first so it's in background */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.05}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#141414"
            fillOpacity={1}
            connectNulls
          />

          {/* Candles */}
          <Bar dataKey="wick" barSize={1} name="High/Low">
            {chartData.map((entry, index) => (
              <Cell key={`wick-${index}`} fill={entry.color} />
            ))}
          </Bar>
          <Bar dataKey="candle" barSize={6} name="Open/Close">
            {chartData.map((entry, index) => (
              <Cell key={`candle-${index}`} fill={entry.color} />
            ))}
          </Bar>

          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
            name="Actual Price"
            connectNulls
          />
          
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            name="AI Forecast"
            strokeDasharray="5 5"
            connectNulls
          />

          <Line 
            type="monotone" 
            dataKey="sma20" 
            stroke="#eab308" 
            dot={false} 
            strokeWidth={1}
            strokeDasharray="3 3"
            name="SMA 20"
          />
          
          {todayLabel && (
            <ReferenceLine 
              x={todayLabel} 
              stroke="#525252" 
              strokeDasharray="3 3" 
              label={{ position: 'top', value: 'Today', fill: '#525252', fontSize: 10 }} 
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PredictionChart;