"use client";

import React, { useState } from 'react';
import { Activity, Search, Loader2, AlertTriangle, TrendingUp, TrendingDown, Percent, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BacktestChart from "@/components/BacktestChart";
import { getBacktestResults } from '@/lib/actions/backtest.actions';

const BacktestingPage = () => {
    const [symbol, setSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleBacktest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!symbol) return;

        setLoading(true);
        setError(null);
        try {
            const res = await getBacktestResults(symbol);
            if (res.success) {
                setResults(res.data);
            } else {
                setError(res.error || "Failed to run backtest. Ensure the symbol is correct and the backend is running.");
            }
        } catch (err) {
            setError("Connection to backtesting engine failed. Is the Python server running on port 8000?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="w-full flex flex-col gap-10 pb-10">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Activity className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Strategy Backtesting</h2>
                        <p className="text-sm text-gray-400">Validate quantitative strategies against historical data</p>
                    </div>
                </div>
            </div>

            <div className="max-w-md bg-gray-900/50 p-6 rounded-xl border border-gray-800">
                <form onSubmit={handleBacktest} className="flex flex-col gap-4">
                    <label className="text-sm font-medium text-gray-300">Enter Stock Symbol</label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="e.g. AAPL, TSLA, BTC-USD" 
                            value={symbol} 
                            onChange={(e) => setSymbol(e.target.value)}
                            className="bg-gray-950 border-gray-700 text-white"
                        />
                        <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white min-w-[120px]">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                                <Search className="h-4 w-4 mr-2" />
                                Run Test
                            </>}
                        </Button>
                    </div>
                    <p className="text-[10px] text-gray-500 italic">Current Strategy: Dual Moving Average Crossover (20/50 SMA)</p>
                </form>
            </div>

            {error && (
                <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <p>{error}</p>
                </div>
            )}

            {results && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Return</span>
                                <Percent className="h-4 w-4 text-purple-400" />
                            </div>
                            <div className={`text-2xl font-black mt-2 ${results.total_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {results.total_return >= 0 ? '+' : ''}{results.total_return.toFixed(2)}%
                            </div>
                        </div>
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Sharpe Ratio</span>
                                <TrendingUp className="h-4 w-4 text-blue-400" />
                            </div>
                            <div className="text-2xl font-black mt-2 text-blue-400">
                                {results.sharpe_ratio.toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Win Rate</span>
                                <BarChart3 className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div className="text-2xl font-black mt-2 text-emerald-400">
                                {results.win_rate.toFixed(1)}%
                            </div>
                        </div>
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Max Drawdown</span>
                                <TrendingDown className="h-4 w-4 text-red-400" />
                            </div>
                            <div className="text-2xl font-black mt-2 text-red-400">
                                {results.max_drawdown.toFixed(2)}%
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <div className="flex flex-col mb-6">
                            <h3 className="text-lg font-semibold text-white">Performance Visualization</h3>
                            <p className="text-sm text-gray-400">Cumulative Strategy Returns vs Buy & Hold</p>
                        </div>
                        <BacktestChart 
                            data={{
                                dates: results.history.dates,
                                marketReturns: results.history.market_returns,
                                strategyReturns: results.history.strategy_returns,
                            }} 
                        />
                    </div>
                </div>
            )}
        </section>
    );
};

export default BacktestingPage;
