"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    TrendingUp, Star, Users, CheckCircle, 
    Plus, Search, Filter, Loader2, Sparkles,
    BarChart3, Target, MessageSquare, AlertCircle,
    ChevronDown, Edit3, Send, Trophy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/config"

interface PerformanceReview {
    id: string
    userId: string
    user: { name: string; email: string, designation?: { name: string } }
    reviewer: { name: string }
    reviewCycle: string
    overallRating: number
    status: 'DRAFT' | 'SUBMITTED' | 'FINALIZED'
    comments: string
    ratings: any[]
}

interface KPI {
    id: string
    name: string
    description: string
    weight: number
}

export default function PerformanceHub({ token }: { token: string }) {
    const [loading, setLoading] = useState(true)
    const [reviews, setReviews] = useState<PerformanceReview[]>([])
    const [kpis, setKpis] = useState<KPI[]>([])
    const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'kpis'>('pipeline')
    const [isSaving, setIsSaving] = useState(false)

    const h = { Authorization: `Bearer ${token}` }

    const fetchPerformance = async () => {
        setLoading(true)
        try {
            const [revRes, kpiRes] = await Promise.all([
                fetch(`${API_BASE_URL}/performance/all`, { headers: h }),
                fetch(`${API_BASE_URL}/performance/kpis`, { headers: h })
            ])
            if (revRes.ok) setReviews(await revRes.json())
            if (kpiRes.ok) setKpis(await kpiRes.json())
        } catch { toast.error("Performance data sync error") }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchPerformance() }, [token])

    const handleFinalize = async (id: string, hrComments?: string) => {
        setIsSaving(true)
        try {
            const res = await fetch(`${API_BASE_URL}/performance/review/${id}/status`, {
                method: "PATCH",
                headers: { ...h, "Content-Type": "application/json" },
                body: JSON.stringify({ status: 'FINALIZED', hrComments })
            })
            if (res.ok) {
                toast.success("Review Finalized")
                fetchPerformance()
            } else {
                const d = await res.json()
                toast.error(d.error || "Finalization failed")
            }
        } catch { toast.error("Connection error") }
        finally { setIsSaving(false) }
    }

    const StatCard = ({ icon: Icon, label, value, color }: any) => (
        <Card className="border-none bg-white shadow-sm rounded-3xl overflow-hidden group">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", color)}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{label}</p>
                        <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="min-h-full bg-[#fcfcfd] font-body pb-20 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-full h-[600px] bg-gradient-to-bl from-rose-50/20 via-indigo-50/10 to-transparent pointer-events-none" />

            <div className="max-w-[1400px] mx-auto space-y-12 relative z-10">
                {/* 🏆 PERFORMANCE TELEMETRY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { label: "Active Goals", value: kpis.length, icon: Target, color: "text-indigo-600", bg: "bg-indigo-50", trend: "Performance Indicators" },
                        { label: "Total Reviews", value: reviews.length, icon: Users, color: "text-rose-600", bg: "bg-rose-50", trend: "Current Cycle" },
                        { label: "Average Rating", value: (reviews.reduce((acc, r) => acc + r.overallRating, 0) / (reviews.length || 1)).toFixed(1), icon: Star, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Team Health" },
                        { label: "Completed", value: reviews.filter(r => r.status === 'FINALIZED').length, icon: Trophy, color: "text-amber-600", bg: "bg-amber-50", trend: "Finalized Reviews" },
                    ].map((s, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-10 rounded-[48px] border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                        >
                            <div className="flex items-center gap-6 mb-6">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-12", s.bg)}>
                                    <s.icon className={cn("w-6 h-6", s.color)} />
                                </div>
                                <div>
                                    <h4 className="text-3xl font-bold text-slate-900 tracking-tight font-brand leading-none">{s.value}</h4>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-2">{s.label}</p>
                                </div>
                            </div>
                            <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-bold px-2 py-0.5 rounded-full">{s.trend}</Badge>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all space-y-12">
                    {/* HUB HEADER & NAVIGATION */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-rose-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-rose-200 transition-all hover:scale-110">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight font-brand leading-none">Performance Tracking</h2>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Manage team performance and goals</p>
                            </div>
                        </div>

                        <div className="flex bg-slate-50 p-1.5 rounded-[22px] border border-slate-100">
                            {[
                                { id: 'pipeline', label: 'Current Reviews' },
                                { id: 'kpis', label: 'KPI Management' }
                            ].map((tab) => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveSubTab(tab.id as any)}
                                    className={cn(
                                        "px-8 py-3 rounded-[18px] text-[10px] font-bold uppercase tracking-widest transition-all",
                                        activeSubTab === tab.id ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                    )}
                                >{tab.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* INTERFACE CONTENT */}
                    <AnimatePresence mode="wait">
                        {activeSubTab === 'pipeline' ? (
                            <motion.div 
                                key="pipeline"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {loading ? (
                                    <div className="py-40 flex flex-col items-center justify-center gap-8">
                                        <Loader2 className="w-14 h-14 animate-spin text-rose-500" />
                                        <p className="text-[12px] font-bold uppercase tracking-widest text-slate-300">Loading Reviews...</p>
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="py-40 border-2 border-dashed border-slate-100 rounded-[56px] flex flex-col items-center justify-center bg-slate-50/20 group hover:bg-white transition-all duration-700">
                                        <Sparkles className="w-16 h-16 text-slate-200 mb-8 group-hover:rotate-12 transition-transform" />
                                        <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">No Reviews Found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-8">
                                        {reviews.map((r, idx) => (
                                            <motion.div 
                                                key={r.id} 
                                                initial={{ opacity: 0, x: -15 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="p-10 bg-white border border-slate-100 rounded-[40px] hover:border-rose-100 hover:shadow-2xl hover:shadow-rose-100/30 transition-all group relative overflow-hidden"
                                            >
                                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10 relative z-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-16 h-16 rounded-[22px] bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-xl shadow-sm group-hover:rotate-6 transition-transform">
                                                            {r.user.name[0]}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight uppercase font-brand leading-none">{r.user.name}</h3>
                                                            <div className="flex items-center gap-3 mt-4">
                                                                <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-full">{r.user.designation?.name || 'Personnel'}</Badge>
                                                                <div className="h-1 w-1 rounded-full bg-slate-200" />
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{r.reviewCycle}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn(
                                                        "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border-none shadow-sm",
                                                        r.status === 'FINALIZED' ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                                                    )}>
                                                        {r.status}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
                                                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-50 group-hover:bg-white group-hover:border-rose-50 transition-all">
                                                            <p className="text-[9px] font-bold uppercase text-rose-500 tracking-widest mb-4 flex items-center gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                Final Score
                                                            </p>
                                                            <div className="flex items-baseline gap-3">
                                                                <span className="text-4xl font-bold text-slate-900 font-brand tracking-tight leading-none">{r.overallRating.toFixed(1)}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ 5.0 Rating</span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-50 group-hover:bg-white group-hover:border-indigo-50 transition-all">
                                                            <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-3">
                                                                <MessageSquare className="w-3 h-3" /> Lead Comments
                                                            </p>
                                                            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">&quot;{r.comments || 'No qualitative analysis provided.'}&quot;</p>
                                                        </div>
                                                    </div>
                                                    <div className="lg:col-span-4 flex flex-col gap-3">
                                                        <Button variant="outline" className="rounded-[20px] h-14 text-[10px] font-bold uppercase tracking-widest text-slate-600 border-slate-100 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">Full Audit Log</Button>
                                                        {r.status === 'SUBMITTED' && (
                                                            <Button 
                                                                disabled={isSaving}
                                                                onClick={() => handleFinalize(r.id)}
                                                                className="rounded-[20px] h-14 bg-rose-600 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-rose-100 transition-all active:scale-95"
                                                            >
                                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve Review"}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="kpis"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                            >
                                {kpis.map((k, kidx) => (
                                    <motion.div 
                                        key={k.id} 
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: kidx * 0.05 }}
                                        className="p-10 bg-white border border-slate-100 rounded-[40px] hover:border-indigo-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group flex flex-col"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform shadow-sm">
                                            <Target className="w-7 h-7 text-indigo-600" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900 tracking-tight uppercase font-brand leading-none mb-4 group-hover:text-indigo-600 transition-colors">{k.name}</h4>
                                        <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-8 flex-1 border-l-2 border-indigo-50 pl-6 group-hover:border-indigo-200 transition-all">{k.description}</p>
                                        <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-50">
                                            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Weighting</span>
                                            <Badge className="bg-indigo-600 text-white border-none text-[10px] font-bold px-4 py-1 rounded-full">{k.weight}%</Badge>
                                        </div>
                                    </motion.div>
                                ))}
                                <button className="border-2 border-dashed border-slate-100 rounded-[40px] p-12 flex flex-col items-center justify-center gap-6 group hover:border-rose-200 hover:bg-slate-50 transition-all duration-700 min-h-[400px]">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-rose-50 transition-colors shadow-sm">
                                        <Plus className="w-8 h-8 text-slate-300 group-hover:text-rose-500 group-hover:rotate-90 transition-all duration-500" />
                                    </div>
                                    <p className="text-[11px] font-bold uppercase text-slate-400 tracking-widest group-hover:text-rose-600">Add Goal</p>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── PERFORMANCE SIGNATURES ── */}
            <div className="max-w-[1400px] mx-auto mt-12 flex items-center justify-between px-10">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">System Status: Online</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Analysis Complete</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-full border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase text-slate-900 tracking-widest">Cycle: Q4 2024</span>
                </div>
            </div>
        </div>
    )
}
