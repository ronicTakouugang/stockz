"use server";

import { getDateRange, validateArticle, formatArticle } from "@/lib/utils";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const options: RequestInit = revalidateSeconds
    ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
    : { cache: "no-store" };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const { from, to } = getDateRange(5);

    if (symbols && symbols.length > 0) {
      const cleanSymbols = symbols.map((s) => s.trim().toUpperCase());
      const allNews: MarketNewsArticle[] = [];
      const seenUrls = new Set<string>();

      // Loop max 6 times, round-robin through symbols
      for (let i = 0; i < 6; i++) {
        const symbol = cleanSymbols[i % cleanSymbols.length];
        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
        
        try {
          const newsItems = await fetchJSON<RawNewsArticle[]>(url, 3600); // Cache for 1 hour
          
          // Take one valid article per round that hasn't been seen
          const validArticle = newsItems.find(
            (item) => validateArticle(item) && !seenUrls.has(item.url!)
          );

          if (validArticle) {
            seenUrls.add(validArticle.url!);
            allNews.push(formatArticle(validArticle, true, symbol, i) as MarketNewsArticle);
          }
        } catch (err) {
          console.error(`Error fetching news for ${symbol}:`, err);
          continue;
        }
        
        if (allNews.length >= 6) break;
      }

      // If we still have space and symbols are many, we might need more rounds or just stop.
      return allNews.sort((a, b) => b.datetime - a.datetime);
    } else {
      // General market news
      const url = `${FINNHUB_BASE_URL}/news?category=general&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
      const newsItems = await fetchJSON<RawNewsArticle[]>(url, 3600);

      const formattedNews = newsItems
        .filter(validateArticle)
        .reduce((acc: MarketNewsArticle[], curr, index) => {
          if (acc.length >= 6) return acc;
          // Deduplicate by id/url/headline
          const isDuplicate = acc.some(
            (item) => item.id === curr.id || item.url === curr.url || item.headline === curr.headline
          );
          if (!isDuplicate) {
            acc.push(formatArticle(curr, false, undefined, index) as MarketNewsArticle);
          }
          return acc;
        }, []);

      return formattedNews;
    }
  } catch (error) {
    console.error("Failed to fetch news:", error);
    throw new Error("Failed to fetch news");
  }
}
