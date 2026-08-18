"use client"

import { useEffect, useState } from "react"
import { TrendingUp, CheckCircle2, ClipboardList, Loader2, Download, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const API = process.env.NEXT_PUBLIC_API_URL

const COLORS = ["bg-indigo-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"]

export default function PerformanceModule({ token }: { token: string }) {
    const [reviews, setReviews] = useState<any[]>([])
    const [kpis, setKpis] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true)
            try {
                const [revRes, kpiRes] = await Promise.all([
                    fetch(`${API}/performance/all`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API}/performance/kpis`, { headers: { Authorization: `Bearer ${token}` } }),
                ])
                if (revRes.ok) setReviews(await revRes.json())
                if (kpiRes.ok) setKpis(await kpiRes.json())
            } catch { toast.error("Failed to load performance data") }
            finally { setLoading(false) }
        }
        fetchAll()
    }, [token])

    if (loading) return (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-300">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Loading Performance...</p>
        </div>
    )

    const completed = reviews.filter(r => r.status === "COMPLETED" || r.status === "SUBMITTED").length
    const avgRating = reviews.length
        ? (reviews.reduce((acc, r) => acc + (parseFloat(r.overallRating) || 0), 0) / reviews.length).toFixed(1)
        : "—"

    // Group by department name (via user.department.name if available)
    const deptMap: Record<string, { score: number; count: number }> = {}
    reviews.forEach(r => {
        const dept = r.user?.department?.name || "General"
        if (!deptMap[dept]) deptMap[dept] = { score: 0, count: 0 }
        deptMap[dept].score += parseFloat(r.overallRating) || 0
        deptMap[dept].count += 1
    })
    const deptStats = Object.entries(deptMap).map(([dept, v], i) => ({
        dept,
        score: v.count ? +(v.score / v.count).toFixed(1) : 0,
        employees: v.count,
        color: COLORS[i % COLORS.length]
    }))

    const stats = [
        { label: "Avg Performance Score", value: avgRating, sub: "out of 10 · all reviews", icon: Star, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Reviews Completed", value: completed, sub: `of ${reviews.length} total reviews`, icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "KPIs Configured", value: kpis.length, sub: "Active performance indicators", icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-50" },
    ]

    return (
        <div className="space-y-6">
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-4", s.bg)}>
                            <s.icon className={cn("w-4 h-4", s.color)} />
                        </div>
                        <p className="text-2xl font-bold text-slate-900 tracking-tight">{s.value}</p>
                        <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{s.label}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* DEPT BREAKDOWN */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Department Score Breakdown</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Average rating per department · Live from review data</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1.5">
                        <Download className="w-3 h-3" /> Export
                    </Button>
                </div>

                {deptStats.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-slate-300">
                        <p className="text-[11px] font-bold uppercase tracking-widest">No review data yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deptStats.map((d, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="w-32 shrink-0">
                                    <p className="text-[12px] font-bold text-slate-700">{d.dept}</p>
                                    <p className="text-[10px] text-slate-400">{d.employees} reviews</p>
                                </div>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all duration-700", d.color)}
                                        style={{ width: `${(d.score / 10) * 100}%` }} />
                                </div>
                                <span className="text-sm font-bold text-slate-700 w-14 text-right">{d.score}/10</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* KPIs LIST */}
            {kpis.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4">Active KPIs</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {kpis.map((kpi: any, i: number) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[12px] font-bold text-slate-800">{kpi.name}</p>
                                {kpi.description && <p className="text-[10px] text-slate-400 mt-1">{kpi.description}</p>}
                                <p className="text-[9px] font-bold text-indigo-500 mt-2 uppercase tracking-widest">Weight: {kpi.weight}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
