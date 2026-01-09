"use client"

import { useEffect, useState } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import {Button} from "@/components/ui/button";
import {Loader2,  TrendingUp} from "lucide-react";
import Link from "next/link";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {useDebounce} from "@/hooks/useDebounce";

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(false)
    const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);

    const isSearchMode = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                setOpen(v => !v)
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    useEffect(() => {
        if (!open) {
            setSearchTerm("");
            setStocks(initialStocks);
        }
    }, [open, initialStocks]);

    const handleSearch = async () => {
        if(!isSearchMode) {
            setStocks(initialStocks);
            return;
        }

        setLoading(true)
        try {
            const results = await searchStocks(searchTerm.trim());
            setStocks(results);
        } catch {
            setStocks([])
        } finally {
            setLoading(false)
        }
    }

    const debouncedSearch = useDebounce(handleSearch, 300);

    useEffect(() => {
        debouncedSearch();
    }, [searchTerm, debouncedSearch]);

    const handleSelectStock = () => {
        setOpen(false);
    }

    return (
        <>
            {renderAs === 'text' ? (
                <span 
                    onClick={() => setOpen(true)} 
                    className="search-text"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setOpen(true);
                        }
                    }}
                >
            {label}
          </span>
            ): (
                <Button onClick={() => setOpen(true)} className="search-btn">
                    {label}
                </Button>
            )}
            <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
                <div className="search-field">
                    <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search stocks..." className="search-input" />
                </div>
                <CommandList className="search-list">
                    {loading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        </div>
                    )}
                    {!loading && displayStocks?.length === 0 && (
                        <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                            {isSearchMode ? 'No results found' : 'No stocks available'}
                        </CommandEmpty>
                    )}
                    {!loading && displayStocks && displayStocks.length > 0 && (
                        <ul>
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {isSearchMode ? 'Search results' : 'Popular stocks'}
                                {` `}({displayStocks.length})
                            </div>
                            {displayStocks.map((stock) => (
                                <li key={stock.symbol} className="search-item">
                                    <Link
                                        href={`/stocks/${stock.symbol}`}
                                        onClick={handleSelectStock}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
                                    >
                                        <TrendingUp className="h-4 w-4 text-gray-400" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                {stock.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {stock.symbol} | {stock.exchange} | {stock.type}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}