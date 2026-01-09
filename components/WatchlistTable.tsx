'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, BellPlus } from 'lucide-react';
import WatchlistButton from '@/components/WatchlistButton';
import { WATCHLIST_TABLE_HEADER } from '@/lib/constants';
import AlertModal from '@/components/AlertModal';

const WatchlistTable = ({ watchlist }: WatchlistTableProps) => {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{symbol: string, company: string, currentPrice?: number} | null>(null);

  const handleSetAlert = (stock: StockWithData) => {
    setSelectedStock({
      symbol: stock.symbol,
      company: stock.company,
      currentPrice: stock.currentPrice
    });
    setIsAlertModalOpen(true);
  };

  return (
    <div className="overflow-x-auto">
      <table className="watchlist-table">
        <thead>
          <tr className="table-header-row">
            {WATCHLIST_TABLE_HEADER.map((header) => (
              <th key={header} className="table-header px-6 py-4 text-xs font-semibold uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {watchlist.map((stock) => {
            const isPositive = stock.changePercent && stock.changePercent >= 0;

            return (
              <tr key={stock.symbol} className="table-row group">
                <td className="table-cell px-6 py-4">
                  <Link href={`/stocks/${stock.symbol}`} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-sm font-bold text-white">
                      {stock.symbol.substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white group-hover:text-green-400">
                        {stock.company}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="table-cell px-6 py-4">
                  <span className="rounded bg-gray-600/60 px-2 py-1 text-xs font-medium text-gray-300">
                    {stock.symbol}
                  </span>
                </td>
                <td className="table-cell px-6 py-4">
                  <span className="text-sm font-medium text-white">
                    {stock.priceFormatted || 'N/A'}
                  </span>
                </td>
                <td className="table-cell px-6 py-4">
                  <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    <span>{stock.changeFormatted || 'N/A'}</span>
                  </div>
                </td>
                <td className="table-cell px-6 py-4">
                  <span className="text-sm text-gray-400">{stock.marketCap || 'N/A'}</span>
                </td>
                <td className="table-cell px-6 py-4">
                  <span className="text-sm text-gray-400">{stock.peRatio || 'N/A'}</span>
                </td>
                <td className="table-cell px-6 py-4">
                    <button 
                      className="add-alert"
                      onClick={() => handleSetAlert(stock)}
                    >
                        <BellPlus className="h-3.5 w-3.5" />
                        <span>Set Alert</span>
                    </button>
                </td>
                <td className="table-cell px-6 py-4">
                  <WatchlistButton
                    symbol={stock.symbol}
                    company={stock.company}
                    isInWatchlist={true}
                    type="icon"
                    showTrashIcon={true}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {watchlist.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-800 border-x border-b border-gray-600 rounded-b-lg">
            <p className="text-gray-400">Your watchlist is empty.</p>
            <p className="text-sm text-gray-500 mt-2">Add stocks to track them here.</p>
        </div>
      )}
      {isAlertModalOpen && selectedStock && (
        <AlertModal
          open={isAlertModalOpen}
          setOpen={setIsAlertModalOpen}
          symbol={selectedStock.symbol}
          company={selectedStock.company}
          currentPrice={selectedStock.currentPrice}
        />
      )}
    </div>
  );
};

export default WatchlistTable;
