"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Brain, Zap, Loader2, Target, Flame, Activity, TrendingUp, BarChart3, Gauge } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export function ProductivityAnalytics({ token }: { token: string }) {
    const [loading, setLoading] = useState(true)
    const [efficiency, setEfficiency] = useState(0)
    const [metrics, setMetrics] = useState<any[]>([])
    const [trend, setTrend] = useState("")
    const [status, setStatus] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/dashboard/manager/productivity`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setEfficiency(data.efficiency)
                    setMetrics(data.metrics)
                    setTrend(data.trend)
                    setStatus(data.status)
                }
            } catch (e) {
                console.error("Failed to fetch productivity data", e)
            } finally {
                setLoading(false)
            }
        }
        if (token) fetchData()
    }, [token])

    if (loading) {
        return (
            <Card className="h-full premium-card flex flex-col items-center justify-center p-8">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8 opacity-20" />

            </Card>
        )
    }

    return (
        <Card className="premium-card shadow-2xl ring-1 ring-slate-200 dark:ring-indigo-500/10 h-full overflow-hidden flex flex-col">
            <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/30 dark:bg-black/20">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Gauge className="w-3.5 h-3.5 text-indigo-500" /> Operational Spectrum
                        </CardTitle>
                        <CardDescription className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                            {efficiency} <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Intensity Meta-Score</span>
                        </CardDescription>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-[8px] font-bold text-emerald-500 uppercase mt-2 tracking-widest">{trend}</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 pt-8 space-y-8">
                {/* Live Activity Pulse */}
                <div className="relative h-20 w-full overflow-hidden rounded-2xl bg-slate-50 dark:bg-black/40 border border-border/50 p-4">
                    <div className="absolute inset-0 opacity-20 dark:opacity-40 pointer-events-none">
                        <svg viewBox="0 0 100 20" className="w-full h-full text-indigo-500 dark:text-indigo-400">
                            <motion.path
                                d="M 0 10 Q 5 10 10 10 Q 15 10 20 5 Q 25 15 30 10 Q 35 10 40 10 Q 45 10 50 0 Q 55 20 60 10 Q 65 10 70 10 Q 75 10 80 15 Q 85 5 90 10 Q 95 10 100 10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                animate={{
                                    d: [
                                        "M 0 10 Q 5 10 10 10 Q 15 10 20 5 Q 25 15 30 10 Q 35 10 40 10 Q 45 10 50 0 Q 55 20 60 10 Q 65 10 70 10 Q 75 10 80 15 Q 85 5 90 10 Q 95 10 100 10",
                                        "M 0 10 Q 5 10 10 10 Q 15 5 20 15 Q 25 10 30 10 Q 35 0 40 20 Q 45 10 50 10 Q 55 5 60 15 Q 65 10 70 10 Q 75 0 80 20 Q 85 10 90 10 Q 95 5 100 15"
                                    ]
                                }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            />
                        </svg>
                    </div>
                    <div className="relative z-10 flex items-center justify-between h-full">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Live Pulse</p>
                            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tighter">{status}</p>
                        </div>
                        <div className="glass px-2 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase text-slate-700 dark:text-slate-300">Synchronized</span>
                        </div>
                    </div>
                </div>

                {/* Performance Spectrum */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Analytic Breakdown</h4>
                        <BarChart3 className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                    </div>

                    <div className="space-y-4">
                        {metrics.map((metric) => (
                            <div key={metric.label} className="group space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-indigo-500 transition-colors uppercase">
                                        {metric.label}
                                    </span>
                                    <span className="text-[10px] font-bold tabular-nums text-slate-700 dark:text-slate-300">
                                        {metric.value}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-black/20 rounded-full overflow-hidden p-0.5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${metric.value}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={`h-full rounded-full ${metric.color} ${metric.glow} shadow-lg`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Insight Footnote */}
                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                        <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">Peak Cognitive State Detected</span>
                    </div>
                    <Link href="/admin?tab=reports" className="text-[9px] font-bold uppercase text-indigo-600 hover:text-indigo-500 underline underline-offset-4">Full Audit</Link>
                </div>
            </CardContent>
        </Card>
    )
}
