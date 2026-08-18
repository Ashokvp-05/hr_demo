"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Clock, Activity, BarChart3, TrendingUp, Bug } from "lucide-react"
import { motion } from "framer-motion"
import { API_BASE_URL } from "@/lib/config"

interface TicketAnalyticsData {
    total: number
    status: { name: string; value: number }[]
    priority: { name: string; value: number }[]
    category: { name: string; value: number }[]
}

export function TicketAnalytics({ token }: { token: string }) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<TicketAnalyticsData | null>(null)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Adjust port if necessary, typically 4000 for backend
                const res = await fetch(`${API_BASE_URL}/tickets/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                }
            } catch (error) {
                console.error("Failed to fetch ticket analytics")
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [token])

    if (loading) {
        return (
            <Card className="h-full premium-card flex flex-col items-center justify-center p-8 min-h-[300px]">
                <Activity className="animate-pulse text-indigo-500 w-8 h-8 opacity-50" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4">Analyzing System Health...</p>
            </Card>
        )
    }

    if (!data) return null

    // Calculate percentages for bars
    const getPercentage = (val: number) => Math.round((val / data.total) * 100) || 0

    const openCount = data.status.find(s => s.name === "OPEN")?.value || 0
    const resolvedCount = (data.status.find(s => s.name === "RESOLVED")?.value || 0) + (data.status.find(s => s.name === "CLOSED")?.value || 0)

    // Sort priorities to show High/Critical first
    const criticalCount = data.priority.find(p => p.name === "CRITICAL")?.value || 0
    const highCount = data.priority.find(p => p.name === "HIGH")?.value || 0

    return (
        <Card className="premium-card shadow-lg ring-1 ring-slate-200 dark:ring-indigo-500/10 h-full overflow-hidden flex flex-col bg-white dark:bg-slate-900/50">
            <CardHeader className="pb-2 border-b border-border/50 bg-slate-50/50 dark:bg-white/5">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                            <Bug className="w-3.5 h-3.5" /> System Health Tracker
                        </CardTitle>
                        <CardDescription className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            {data.total} <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Total Issues</span>
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{getPercentage(resolvedCount)}%</span>
                            <span className="text-[8px] uppercase font-bold text-muted-foreground">Resolution Rate</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 pt-6 space-y-6">

                {/* Status Pills */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span className="text-xs font-bold text-rose-900 dark:text-rose-100">Open</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-rose-600">{openCount}</span>
                            <span className="text-[10px] font-bold text-rose-600/70 uppercase">Tickets</span>
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">Resolved</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-emerald-600">{resolvedCount}</span>
                            <span className="text-[10px] font-bold text-emerald-600/70 uppercase">Tickets</span>
                        </div>
                    </div>
                </div>

                {/* Priority Breakdown */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority Distribution</h4>
                        {(criticalCount > 0 || highCount > 0) && (
                            <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full animate-pulse">
                                {criticalCount + highCount} Critical/High
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        {data.priority.map((p) => (
                            <div key={p.name} className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                                    <span className="text-slate-500">{p.name}</span>
                                    <span className="text-slate-700 dark:text-slate-300">{p.value}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${getPercentage(p.value)}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full rounded-full ${p.name === 'CRITICAL' ? 'bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)]' :
                                            p.name === 'HIGH' ? 'bg-orange-500' :
                                                p.name === 'MEDIUM' ? 'bg-amber-400' : 'bg-slate-400'
                                            }`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total Stats Footer */}
                <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Last computed: Just now</span>
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Live Monitor</span>
                </div>

            </CardContent>
        </Card>
    )
}
