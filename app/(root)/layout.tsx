import Header from "@/components/Header";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {getWatchlist} from "@/lib/actions/watchlist.actions";
import {getAnonymousId} from "@/lib/actions/anonymous.actions";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const anonId = await getAnonymousId();

  const [initialStocks, watchlist] = await Promise.all([
      searchStocks(),
      getWatchlist(anonId)
  ]);

  const watchlistSymbols = watchlist.map((item: { symbol: string }) => item.symbol);
  const stocksWithWatchlistStatus = initialStocks.map(stock => ({
      ...stock,
      isInWatchlist: watchlistSymbols.includes(stock.symbol)
  }));

  return (
    <main className="min-h-screen text-gray-400">
        <Header initialStocks={stocksWithWatchlistStatus}/>
        <div className="container py-10">
            {children}
        </div>
    </main>
  );
};

export default Layout;
