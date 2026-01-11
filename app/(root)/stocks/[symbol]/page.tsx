import React from 'react';
import TradingViewWidget from "@/components/TradingViewWidget";
import {
    BASELINE_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG, COMPANY_FINANCIALS_WIDGET_CONFIG, COMPANY_PROFILE_WIDGET_CONFIG,
    SYMBOL_INFO_WIDGET_CONFIG, TECHNICAL_ANALYSIS_WIDGET_CONFIG
} from "@/lib/constants";
import WatchlistButton from "@/components/WatchlistButton";
import {fetchStockDetails} from "@/lib/actions/finnhub.actions";
import {auth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {isSymbolInWatchlist} from "@/lib/actions/watchlist.actions";
import PredictionDashboard from "@/components/PredictionDashboard";
import { TrendingUp } from "lucide-react";

import StockDetailsTabs from "@/components/stocks/StockDetailsTabs";

const StockDetails = async ({ params }: StockDetailsPageProps) => {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();

    // Fetch stock details
    const stock = await fetchStockDetails(upperSymbol);

    // Fetch user and watchlist status
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const userId = session?.user?.id;
    const isInWatchlist = userId ? await isSymbolInWatchlist(userId, upperSymbol) : false;

    return (
        <section className="w-full flex flex-col gap-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1">
                    <TradingViewWidget
                        scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js"
                        config={SYMBOL_INFO_WIDGET_CONFIG(upperSymbol)}
                        height={160}
                    />
                </div>
                <div className="pb-4">
                    <WatchlistButton
                        symbol={upperSymbol}
                        company={stock?.name || upperSymbol}
                        isInWatchlist={isInWatchlist}
                    />
                </div>
            </div>

            <StockDetailsTabs
                overview={
                    <div className="flex flex-col gap-10">
                        <TradingViewWidget
                            scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
                            config={CANDLE_CHART_WIDGET_CONFIG(upperSymbol)}
                            height={600}
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <TradingViewWidget
                                scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js"
                                config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(upperSymbol)}
                                height={450}
                            />
                            <TradingViewWidget
                                scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js"
                                config={BASELINE_WIDGET_CONFIG(upperSymbol)}
                                height={450}
                            />
                        </div>
                    </div>
                }
                forecast={
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">AI Prediction Engine</h2>
                                <p className="text-sm text-gray-400">Advanced ML & Technical Analysis Forecast</p>
                            </div>
                        </div>
                        <PredictionDashboard symbol={upperSymbol} />
                    </div>
                }
                financials={
                    <div className="grid grid-cols-1 gap-10">
                        <TradingViewWidget
                            scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-financials.js"
                            config={COMPANY_FINANCIALS_WIDGET_CONFIG(upperSymbol)}
                            height={800}
                        />
                    </div>
                }
                company={
                    <div className="grid grid-cols-1 gap-10">
                        <TradingViewWidget
                            scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js"
                            config={COMPANY_PROFILE_WIDGET_CONFIG(upperSymbol)}
                            height={600}
                        />
                    </div>
                }
            />
        </section>
    );
};

export default StockDetails;
