'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ALERT_TYPE_OPTIONS } from '@/lib/constants'
import { createAlert } from '@/lib/actions/alert.actions'
import { toast } from 'sonner'
import { authClient } from '@/lib/better-auth/auth-client'

const AlertModal = ({
    open,
    setOpen,
    symbol,
    company,
    currentPrice,
}: {
    open: boolean
    setOpen: (open: boolean) => void
    symbol: string
    company: string
    currentPrice?: number
}) => {
    const [loading, setLoading] = useState(false)
    const [alertName, setAlertName] = useState(`${symbol} Price Alert`)
    const [alertType, setAlertType] = useState<'upper' | 'lower'>('upper')
    const [threshold, setThreshold] = useState(currentPrice?.toString() || '')

    const { data: session } = authClient.useSession()

    const handleCreateAlert = async () => {
        if (!session?.user) {
            toast.error('You must be logged in to set an alert')
            return
        }

        if (!threshold || isNaN(parseFloat(threshold))) {
            toast.error('Please enter a valid price threshold')
            return
        }

        setLoading(true)
        try {
            const result = await createAlert({
                symbol,
                company,
                alertName,
                alertType,
                threshold: parseFloat(threshold),
            })

            if (result.success) {
                toast.success(`Alert set for ${symbol}`)
                setOpen(false)
            } else {
                toast.error(result.error || 'Failed to set alert')
            }
        } catch (error) {
            toast.error('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
                <DialogHeader>
                    <DialogTitle>Set Price Alert for {symbol}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Alert Name</Label>
                        <Input
                            id="name"
                            value={alertName}
                            onChange={(e) => setAlertName(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Alert Type</Label>
                        <Select
                            value={alertType}
                            onValueChange={(value: 'upper' | 'lower') => setAlertType(value)}
                        >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                <SelectValue placeholder="Select alert type" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                {ALERT_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="threshold">Price Threshold</Label>
                        <Input
                            id="threshold"
                            type="number"
                            step="0.01"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                        />
                        {currentPrice && (
                            <p className="text-xs text-gray-400">
                                Current Price: ${currentPrice}
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="border-gray-700 text-white hover:bg-gray-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateAlert}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {loading ? 'Setting...' : 'Set Alert'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default AlertModal
