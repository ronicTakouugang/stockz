import React from 'react';
import PredictionDashboard from "@/components/PredictionDashboard";
import { BrainCircuit } from "lucide-react";

const GlobalPredictionsPage = () => {
    const featuredStocks = ['AAPL'];

    return (
        <section className="w-full flex flex-col gap-10 pb-10">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <BrainCircuit className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Global Market Predictions</h2>
                        <p className="text-sm text-gray-400">AI-driven forecasts for market leaders</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-16">
                {featuredStocks.map((symbol) => (
                    <div key={symbol} className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-bold text-white bg-gray-800 px-4 py-1 rounded-lg border border-gray-700">{symbol}</h3>
                            <div className="h-px flex-1 bg-gray-800" />
                        </div>
                        <PredictionDashboard symbol={symbol} />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default GlobalPredictionsPage;
