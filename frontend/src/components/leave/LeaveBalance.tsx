"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress" // Assuming I'll need to create this or use simple divs

import { API_BASE_URL } from "@/lib/config"

interface Balance {
    sick: number
    sickUsed: number
    casual: number
    casualUsed: number
    earned: number
    earnedUsed: number
}

export default function LeaveBalance({ token, refreshTrigger = 0 }: { token: string, refreshTrigger?: number }) {
    const [balance, setBalance] = useState<Balance | null>(null)

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/leaves/balance`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setBalance(data)
                }
            } catch (e) {
                console.error("Failed to fetch balance", e)
            }
        }
        fetchBalance()
    }, [token, refreshTrigger])

    if (!balance) return null

    return (
        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Leave Entitlement Archive ({new Date().getFullYear()})</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-400">Medical Leave</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{balance.sickUsed} <span className="text-slate-400 font-normal">/ {balance.sick}</span></span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (balance.sickUsed / (balance.sick || 1)) * 100)}%` }} 
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-400">Casual Leave</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{balance.casualUsed} <span className="text-slate-400 font-normal">/ {balance.casual}</span></span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (balance.casualUsed / (balance.casual || 1)) * 100)}%` }} 
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-400">Earned Leave</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{balance.earnedUsed} <span className="text-slate-400 font-normal">/ {balance.earned}</span></span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (balance.earnedUsed / (balance.earned || 1)) * 100)}%` }} 
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
