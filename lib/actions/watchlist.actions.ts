"use server";

import { connectToDatabase } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    const user = await db.collection("user").findOne({ email });
    if (!user) {
      return [];
    }

    const userId = user._id.toString();
    const watchlist = await Watchlist.find({ userId });

    return watchlist.map((item) => item.symbol);
  } catch (error) {
    console.error(`Error fetching watchlist for email ${email}:`, error);
    return [];
  }
}

export async function isSymbolInWatchlist(userId: string, symbol: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const item = await Watchlist.findOne({ userId, symbol: symbol.toUpperCase() });
    return !!item;
  } catch (error) {
    console.error(`Error checking watchlist status for user ${userId} and symbol ${symbol}:`, error);
    return false;
  }
}
