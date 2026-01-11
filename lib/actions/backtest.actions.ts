"use server";

export async function getBacktestResults(symbol: string) {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return { success: false, error: "BACKEND_URL environment variable is not set" };
    }
    const sanitizedUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const res = await fetch(`${sanitizedUrl}/backtest/${symbol.toUpperCase()}`);
    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `Failed to fetch from backend: ${res.status} ${errorText}` };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Backtest action failed:", error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "Connection to backtesting engine failed" };
  }
}
