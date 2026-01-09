import React from 'react';
import TradingViewWidget from "@/components/TradingViewWidget";
import {
    BASELINE_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG, COMPANY_FINANCIALS_WIDGET_CONFIG, COMPANY_PROFILE_WIDGET_CONFIG,
    SYMBOL_INFO_WIDGET_CONFIG, TECHNICAL_ANALYSIS_WIDGET_CONFIG
} from "@/lib/constants";
import WatchlistButton from "@/components/WatchlistButton";

const StockDetails = async ({ params }: StockDetailsPageProps) => {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();

    return (
        <section className="w-full flex flex-col gap-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column */}
                <div className="lg:col-span-2 flex flex-col gap-10">
                    <TradingViewWidget
                        scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js"
                        config={SYMBOL_INFO_WIDGET_CONFIG(upperSymbol)}
                        height={200}
                    />
                    <TradingViewWidget
                        scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
                        config={CANDLE_CHART_WIDGET_CONFIG(upperSymbol)}
                        height={500}
                    />
                    <TradingViewWidget
                        scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js"
                        config={BASELINE_WIDGET_CONFIG(upperSymbol)}
                        height={400}
                    />
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-4">
                        <WatchlistButton
                            symbol={upperSymbol}
                            company={upperSymbol} // Using symbol as placeholder for company name
                            isInWatchlist={false} // Defaulting to false, status could be fetched if there was an action
                        />
                        <TradingViewWidget
                            scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js"
                            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(upperSymbol)}
                            height={450}
                        />
                    </div>
                    <TradingViewWidget
                        scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js"
                        config={COMPANY_PROFILE_WIDGET_CONFIG(upperSymbol)}
                        height={400}
                    />
                    <TradingViewWidget
                        scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-financials.js"
                        config={COMPANY_FINANCIALS_WIDGET_CONFIG(upperSymbol)}
                        height={600}
                    />
                </div>
            </div>
        </section>
    );
};

export default StockDetails;
