"use server";

export async function getBacktestResults(symbol: string) {
  try {
    const res = await fetch(`http://localhost:8000/backtest/${symbol.toUpperCase()}`);
    if (!res.ok) {
      return { success: false, error: "Failed to fetch backtest results from backend" };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Backtest action failed:", error);
    return { success: false, error: "Connection to backtesting engine failed" };
  }
}
