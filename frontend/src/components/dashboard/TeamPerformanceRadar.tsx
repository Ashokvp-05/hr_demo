"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    BarChart3,
    Zap,
    ChevronDown,
    ChevronUp,
    Share2,
    TrendingUp,
    AlertCircle
} from "lucide-react"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PerformanceMetric {
    id: number
    subject: string
    score: number
    target: number
    trend: string
    history: number[]
    status: string
    statusColor: string
    barColor: string
    lineColor: string
    impactingUsers: string[]
    forecast: string
    drivers: string[]
}

export function TeamPerformanceRadar({ token }: { token: string }) {
    const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<number | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/dashboard/manager/performance`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setPerformanceData(data)
                }
            } catch (e) {
                console.error("Failed to fetch performance data", e)
            } finally {
                setLoading(false)
            }
        }
        if (token) fetchData()
    }, [token])

    // Simple Sparkline Component
    const Sparkline = ({ data, color }: { data: number[], color: string }) => {
        if (!data || data.length === 0) return null;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 60; // width 60px
            const y = 20 - ((d - min) / (max - min || 1)) * 20; // height 20px
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg width="60" height="20" className="overflow-visible opacity-80">
                <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center min-h-[350px] animate-pulse bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800">
                <Loader2 className="animate-spin text-slate-300 w-8 h-8" />
                <p className="text-xs font-semibold text-slate-400 mt-4">Analyzing performance metrics...</p>
            </div>
        )
    }

    return (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex flex-col rounded-[1.5rem] overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600" /> Team Pulse
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500 mt-1">
                            Live KPI Performance vs Targets
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-500/20">
                            October
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600">
                            <Share2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pt-6 flex flex-col gap-6 overflow-y-auto">

                {performanceData.map((item) => {
                    const isExpanded = expandedId === item.id;
                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "group relative p-3 -mx-3 rounded-2xl transition-all duration-200 cursor-pointer border border-transparent",
                                isExpanded ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 shadow-sm" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                            )}
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        >
                            <div className="flex items-end justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.subject}</p>
                                        <Sparkline data={item.history} color={item.lineColor} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">{item.score}%</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-sm ${item.statusColor}`}>
                                            {item.trend}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <p className={`text-[10px] font-bold uppercase tracking-wider ${item.statusColor}`}>
                                            {item.status}
                                        </p>
                                        {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                                    </div>
                                    {/* Impacting Users Stack */}
                                    {item.impactingUsers.length > 0 && !isExpanded ? (
                                        <div className="flex items-center -space-x-2">
                                            {item.impactingUsers.map((u: string, i: number) => (
                                                <Avatar key={i} className="w-6 h-6 border-2 border-white dark:border-slate-900 shadow-sm">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u}`} />
                                                    <AvatarFallback className="text-[8px] bg-indigo-100 text-indigo-700">{u[0]}</AvatarFallback>
                                                </Avatar>
                                            ))}
                                        </div>
                                    ) : (
                                        !isExpanded && <p className="text-[10px] font-medium text-slate-400">Target: {item.target}%</p>
                                    )}
                                </div>
                            </div>

                            {/* Advanced Progress Bar with Target Marker */}
                            <div className="relative h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-visible">
                                <div
                                    className={`absolute left-0 top-0 h-full rounded-full ${item.barColor} transition-all duration-1000 ease-out shadow-sm`}
                                    style={{ width: `${item.score}%` }}
                                />
                                {/* Target Marker */}
                                <div
                                    className="absolute top-[-3px] h-4 w-1 bg-slate-900 dark:bg-white rounded-full z-10 border border-white dark:border-slate-900"
                                    style={{ left: `${item.target}%` }}
                                    title={`Target: ${item.target}%`}
                                />
                            </div>

                            {/* Deep Dive Content */}
                            {isExpanded && (
                                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-start gap-2">
                                            <TrendingUp className="w-3.5 h-3.5 text-indigo-500 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Forecast</p>
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    {item.forecast}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Key Drivers</p>
                                                <ul className="list-disc list-inside">
                                                    {item.drivers.map((d: string, i: number) => (
                                                        <li key={i} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                            {d}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* AI Executive Insight */}
                <div className="mt-4 p-5 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex gap-4 items-start shadow-sm">
                    <div className="p-2.5 bg-white dark:bg-orange-500/20 rounded-xl shrink-0 shadow-sm border border-orange-100 dark:border-orange-500/10">
                        <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Management Attention</h4>
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                            Burnout risk has escalated <span className="text-orange-600 font-bold">+12%</span> this week. Frank, Grace, and Heidi are exceeding safe working hours.
                        </p>
                        <div className="mt-3 flex gap-3">
                            <Button size="sm" variant="default" className="bg-orange-600 hover:bg-orange-700 text-white border-0 h-8 text-xs font-bold rounded-lg px-4 shadow-sm shadow-orange-200 dark:shadow-none">
                                Review Workloads
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs font-bold rounded-lg px-4 bg-white hover:bg-slate-50 border-slate-200 text-slate-600">
                                Snooze Alert
                            </Button>
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
