import Header from "@/components/Header";
import {auth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {getWatchlistSymbolsByEmail} from "@/lib/actions/watchlist.actions";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
      headers : await headers (),
  });
  if(!session?.user) redirect('/sign-in');

  const [initialStocks, watchlistSymbols] = await Promise.all([
      searchStocks(),
      getWatchlistSymbolsByEmail(session.user.email)
  ]);

  const stocksWithWatchlistStatus = initialStocks.map(stock => ({
      ...stock,
      isInWatchlist: watchlistSymbols.includes(stock.symbol)
  }));

  const user = {
      id : session.user.id,
      name : session.user.name,
      email : session.user.email
  }
  return (
    <main className="min-h-screen text-gray-400">
        <Header user={user} initialStocks={stocksWithWatchlistStatus}/>
        <div className="container py-10">
            {children}
        </div>
    </main>
  );
};

export default Layout;