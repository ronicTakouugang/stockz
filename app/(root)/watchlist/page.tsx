import React from 'react';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getWatchlist } from '@/lib/actions/watchlist.actions';
import { fetchStockQuote, fetchStockFinancials } from '@/lib/actions/finnhub.actions';
import WatchlistTable from '@/components/WatchlistTable';
import { formatPrice, formatChangePercent, formatMarketCapValue, getFormattedTodayDate } from '@/lib/utils';

const WatchlistPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  const userId = session.user.id;
  const rawWatchlist = await getWatchlist(userId);

  const enrichedWatchlist = await Promise.all(
    rawWatchlist.map(async (item: any) => {
      const [quote, financials] = await Promise.all([
        fetchStockQuote(item.symbol),
        fetchStockFinancials(item.symbol),
      ]);

      return {
        ...item,
        currentPrice: quote?.c,
        changePercent: quote?.dp,
        priceFormatted: quote?.c ? formatPrice(quote.c) : 'N/A',
        changeFormatted: quote?.dp ? formatChangePercent(quote.dp) : 'N/A',
        marketCap: financials?.metric?.marketCapitalization
          ? formatMarketCapValue(financials.metric.marketCapitalization * 1_000_000)
          : 'N/A',
        peRatio: financials?.metric?.peExclExtraTTM
          ? financials.metric.peExclExtraTTM.toFixed(2)
          : 'N/A',
      };
    })
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="watchlist-title">Your Watchlist</h1>
        <p className="text-gray-400">
          Tracking {enrichedWatchlist.length} stocks as of {getFormattedTodayDate()}
        </p>
      </div>

      <WatchlistTable watchlist={enrichedWatchlist} />
    </div>
  );
};

export default WatchlistPage;
