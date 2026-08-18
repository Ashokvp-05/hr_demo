"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Target, Star, MessageSquare, Send, Loader2, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"

export default function PerformanceReviewForm({ token, userId, userName, onClose, onSuccess }: any) {
    const [kpis, setKpis] = useState<any[]>([])
    const [ratings, setRatings] = useState<any>({})
    const [comments, setComments] = useState<any>({})
    const [overallComments, setOverallComments] = useState("")
    const [reviewCycle, setReviewCycle] = useState("Q1 2026")
    const [loading, setLoading] = useState(false)
    const [fetchingKpis, setFetchingKpis] = useState(true)

    useEffect(() => {
        const fetchKpis = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/performance/kpis`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (res.ok) setKpis(data)
            } catch (e) {
                toast.error("KPI retrieval failure")
            } finally {
                setFetchingKpis(false)
            }
        }
        fetchKpis()
    }, [token])

    const handleSubmit = async () => {
        const payload = {
            userId,
            reviewCycle,
            ratings: kpis.map(k => ({
                kpiId: k.id,
                rating: parseInt(ratings[k.id]) || 0,
                comments: comments[k.id] || "",
                weight: k.weight || 1
            })),
            comments: overallComments
        }

        if (payload.ratings.some(r => r.rating === 0)) {
            return toast.error("All KPI ratings must be populated")
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/performance/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success(`Performance review for ${userName} finalized`)
                onSuccess?.()
                onClose()
            } else {
                toast.error("Submission failed")
            }
        } catch (e) {
            toast.error("Network protocol error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[40px] shadow-xl my-auto"
            >
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-600 rounded-2xl shadow-xl shadow-rose-600/20">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Performance Audit</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Personnel Identity: {userName}</p>
                        </div>
                    </div>
                    <Button size="icon" variant="ghost" className="text-slate-500 hover:text-white" onClick={onClose}>
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* REVIEW CYCLE */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Review Temporal Cycle</label>
                        <Input
                            className="h-14 bg-slate-950 border-white/5 rounded-2xl px-6 text-sm font-bold text-white placeholder:text-slate-800"
                            placeholder="e.g. Q1 2026, Annual Review 2025"
                            value={reviewCycle}
                            onChange={(e) => setReviewCycle(e.target.value)}
                        />
                    </div>

                    {/* KPI RATINGS */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Objective Metrics (KPIs)</label>
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest text-right">Scale: 1 (Deficient) - 5 (Exceptional)</span>
                        </div>

                        {fetchingKpis ? (
                            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-rose-500/30" /></div>
                        ) : kpis.length === 0 ? (
                            <p className="text-xs text-slate-500 p-6 bg-slate-950 rounded-2xl border border-dashed border-white/5">No organizational KPIs configured. Contact Admin.</p>
                        ) : kpis.map((kpi) => (
                            <div key={kpi.id} className="p-6 bg-slate-950 rounded-[30px] border border-white/5 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{kpi.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{kpi.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setRatings({ ...ratings, [kpi.id]: v })}
                                                className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${ratings[kpi.id] === v ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-900 text-slate-500 hover:text-white border border-white/5'}`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Input
                                    className="bg-slate-900 border-white/5 h-10 text-[10px] font-bold uppercase tracking-tight"
                                    placeholder="Add KPI-specific audit notes..."
                                    value={comments[kpi.id] || ""}
                                    onChange={(e) => setComments({ ...comments, [kpi.id]: e.target.value })}
                                />
                            </div>
                        ))}
                    </div>

                    {/* OVERALL COMMENTS */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Executive Summary / Future Velocity</label>
                        <Textarea
                            className="bg-slate-950 border-white/5 rounded-2xl min-h-[120px] p-6 text-xs font-bold leading-relaxed resize-none focus:ring-1 focus:ring-rose-500"
                            placeholder="Detail overall performance impact and developmental vectors..."
                            value={overallComments}
                            onChange={(e) => setOverallComments(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-8 bg-slate-950/40 border-t border-white/5 flex gap-4">
                    <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest" onClick={onClose}>Abort Audit</Button>
                    <Button
                        disabled={loading}
                        onClick={handleSubmit}
                        className="flex-[2] h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest gap-2 shadow-xl shadow-rose-600/20"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Finalize Performance Review
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    )
}
