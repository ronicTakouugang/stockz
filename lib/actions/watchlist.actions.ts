"use server";
import { connectToDatabase } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";
import { revalidatePath } from "next/cache";

export async function addToWatchlist({ userId, symbol, company }: { userId: string, symbol: string, company: string }) {
  try {
    await connectToDatabase();
    
    const existing = await Watchlist.findOne({ userId, symbol: symbol.toUpperCase() });
    if (existing) return { success: true };

    await Watchlist.create({
      userId,
      symbol: symbol.toUpperCase(),
      company,
    });

    revalidatePath("/watchlist");
    return { success: true };
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return { success: false, error: "Failed to add to watchlist" };
  }
}

export async function removeFromWatchlist({ userId, symbol }: { userId: string, symbol: string }) {
  try {
    await connectToDatabase();
    
    await Watchlist.findOneAndDelete({ userId, symbol: symbol.toUpperCase() });

    revalidatePath("/watchlist");
    return { success: true };
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return { success: false, error: "Failed to remove from watchlist" };
  }
}

export async function getWatchlist(userId: string) {
  try {
    await connectToDatabase();
    const watchlist = await Watchlist.find({ userId }).sort({ addedAt: -1 });
    return JSON.parse(JSON.stringify(watchlist));
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return [];
  }
}

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
