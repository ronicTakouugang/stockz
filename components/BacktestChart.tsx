"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface BacktestChartProps {
  data: {
    dates: string[];
    marketReturns: number[];
    strategyReturns: number[];
  };
}

const BacktestChart = ({ data }: BacktestChartProps) => {
  const chartData = data.dates.map((date, i) => ({
    date: date,
    market: data.marketReturns[i],
    strategy: data.strategyReturns[i],
  }));

  return (
    <div className="h-[400px] w-full bg-[#141414] rounded-xl p-4 border border-neutral-800">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#525252" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            minTickGap={30}
          />
          <YAxis 
            stroke="#525252" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line 
            type="monotone" 
            dataKey="market" 
            name="Buy & Hold (Market)"
            stroke="#3b82f6" 
            dot={false} 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="strategy" 
            name="SMA Strategy"
            stroke="#10b981" 
            dot={false} 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BacktestChart;
