'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Check, Loader2 } from 'lucide-react'

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist: initialIsInWatchlist,
  showTrashIcon,
  type = 'button',
  onWatchlistChange,
}: WatchlistButtonProps) => {
  // Placeholder implementation
  const [isInWatchlist, setIsInWatchlist] = React.useState(initialIsInWatchlist)
  const [loading, setLoading] = React.useState(false)

  const handleToggle = async () => {
    setLoading(true)
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newState = !isInWatchlist
    setIsInWatchlist(newState)
    onWatchlistChange?.(symbol, newState)
    setLoading(false)
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
                <Check className="h-4 w-4 text-green-500" />
            ) : (
                <Plus className="h-4 w-4" />
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
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
    </Button>
  )
}

export default WatchlistButton
