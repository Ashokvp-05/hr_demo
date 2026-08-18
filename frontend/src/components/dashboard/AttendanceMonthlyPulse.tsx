"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Activity, Clock, Calendar, CheckCircle2, Loader2, Zap } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { cn } from "@/lib/utils"

interface AttendanceMonthlyPulseProps {
    token: string
}

export default function AttendanceMonthlyPulse({ token }: AttendanceMonthlyPulseProps) {
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR'>('MONTH')

    const fetchHistory = useCallback(async () => {
        if (!token) return
        try {
            const res = await fetch(`${API_BASE_URL}/time/history?limit=365`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) setHistory(await res.json())
        } catch (err) {
            console.error("Failed to fetch pulse intelligence")
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchHistory()
        const interval = setInterval(fetchHistory, 60000) // 1 minute auto-sync
        return () => clearInterval(interval)
    }, [fetchHistory])

    const stats = useMemo(() => {
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const filteredData = history.filter(h => {
            if (!h.clockIn) return false
            const d = new Date(h.clockIn)
            if (viewMode === 'MONTH') {
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear
            }
            return d.getFullYear() === currentYear
        })
        
        const presentCount = filteredData.length
        // Approximate work days: 22/month, 260/year
        const totalExpectedDays = viewMode === 'MONTH' ? 22 : 260 
        const absentCount = Math.max(0, totalExpectedDays - presentCount)
        
        return [
            { name: "Present", value: presentCount, color: "#10b981" },
            { name: "Absent/Expected", value: absentCount, color: "#f43f5e" }
        ]
    }, [history, viewMode])

    const totalPresent = stats[0].value
    const totalAbsent = stats[1].value
    const ratio = Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) || 0

    if (loading) return (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white min-h-[400px] flex flex-col items-center justify-center gap-4 border border-white/5 shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Initializing Core...</span>
        </div>
    )

    return (
        <div className="bg-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden group shadow-2xl border border-white/5 min-h-[400px] flex flex-col transition-all hover:border-indigo-500/30">
            {/* Background Glow */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] group-hover:bg-indigo-600/20 transition-all duration-700" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 relative z-10">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-white flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                        {viewMode === 'MONTH' ? 'Monthly' : 'Yearly'} Presence Pulse
                    </h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Real-Time Analytics Shard</p>
                </div>
                
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner self-stretch sm:self-auto">
                    <button 
                        onClick={() => setViewMode('MONTH')}
                        className={cn(
                            "flex-1 sm:px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-300",
                            viewMode === 'MONTH' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 translate-y-[-1px]" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        Month
                    </button>
                    <button 
                        onClick={() => setViewMode('YEAR')}
                        className={cn(
                            "flex-1 sm:px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-300",
                            viewMode === 'YEAR' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 translate-y-[-1px]" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        Year
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row items-center gap-8 relative z-10">
                <div className="w-full lg:w-[55%] h-[200px] sm:h-[240px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats}
                                innerRadius="75%"
                                outerRadius="95%"
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                                animationBegin={0}
                                animationDuration={800}
                                startAngle={90}
                                endAngle={450}
                            >
                                {stats.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.color} 
                                        className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                                    />
                                ))}
                            </Pie>
                            <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ 
                                    backgroundColor: '#0f172a', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    borderRadius: '16px', 
                                    fontSize: '10px', 
                                    fontWeight: '900',
                                    textTransform: 'uppercase'
                                }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none">
                        <span className="text-3xl sm:text-4xl font-bold block tracking-tighter leading-none">{ratio}%</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ratio</span>
                    </div>
                </div>

                <div className="w-full lg:w-[45%] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                    <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group/stat shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-tight">Present</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tighter">{totalPresent}</span>
                            <span className="text-[11px] text-slate-600 font-bold uppercase">Days</span>
                        </div>
                    </div>
                    
                    <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group/stat shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-tight">Expected</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tighter">{totalAbsent}</span>
                            <span className="text-[11px] text-slate-600 font-bold uppercase">Days</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        {viewMode === 'MONTH' 
                            ? `Cycle: ${new Date().toLocaleString('default', { month: 'long' })}` 
                            : `Cycle: Fiscal ${new Date().getFullYear()}`}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Sync Active</span>
                </div>
            </div>
        </div>
    )
}
