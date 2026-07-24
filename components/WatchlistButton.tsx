'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Star, Loader2, Trash2 } from 'lucide-react'
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions'
import { getAnonymousId } from '@/lib/actions/anonymous.actions'
import { toast } from 'sonner'

interface WatchlistButtonProps {
  symbol: string;
  company: string;
  isInWatchlist: boolean;
  showTrashIcon?: boolean;
  type?: 'button' | 'icon';
  onWatchlistChange?: (symbol: string, isInWatchlist: boolean) => void;
}

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist: initialIsInWatchlist,
  showTrashIcon,
  type = 'button',
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [isInWatchlist, setIsInWatchlist] = React.useState(initialIsInWatchlist)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    setIsInWatchlist(initialIsInWatchlist)
  }, [initialIsInWatchlist])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true)
    try {
      const userId = await getAnonymousId()
      if (isInWatchlist) {
        const res = await removeFromWatchlist({ userId, symbol })
        if (res.success) {
          setIsInWatchlist(false)
          onWatchlistChange?.(symbol, false)
          toast.success("Removed from watchlist", {
            description: `${symbol} has been removed from your watchlist.`,
          })
        }
      } else {
        const res = await addToWatchlist({ userId, symbol, company })
        if (res.success) {
          setIsInWatchlist(true)
          onWatchlistChange?.(symbol, true)
          toast.success("Added to watchlist", {
            description: `${symbol} has been added to your watchlist.`,
          })
        }
      }
    } catch (error) {
      toast.error("Error", {
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (type === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isInWatchlist ? (
          showTrashIcon ? (
            <Trash2 className="h-4 w-4 text-destructive" />
          ) : (
            <Star className="h-4 w-4 fill-green-500 text-green-500" />
          )
        ) : (
          <Star className="h-4 w-4" />
        )}
      </Button>
    )
  }

  return (
    <Button
      variant={isInWatchlist ? "outline" : "default"}
      className="w-full sm:w-auto"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isInWatchlist ? (
        <Star className="mr-2 h-4 w-4 fill-green-500 text-green-500" />
      ) : (
        <Star className="mr-2 h-4 w-4" />
      )}
      {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
    </Button>
  )
}

export default WatchlistButton
