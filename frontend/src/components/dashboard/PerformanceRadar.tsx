"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Target, TrendingUp, Award, User, Star, Loader2, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { API_BASE_URL } from "@/lib/config"

export default function PerformanceRadar({ token }: { token: string }) {
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/performance/my-reviews`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setReviews(data)
        } catch (e) {
            console.error("Performance sync error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReviews()
    }, [token])

    const latestReview = reviews[0]

    return (
        <div className="space-y-10">
            {/* HERO STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-indigo-500/10 rounded-2xl">
                            <Star className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aggregate Velocity</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">
                                {latestReview ? latestReview.overallRating : "0.00"}
                            </h3>
                        </div>
                    </div>
                    <Progress value={latestReview ? parseFloat(latestReview.overallRating) * 20 : 0} className="h-2 bg-slate-100 dark:bg-white/5" />
                </Card>

                <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 overflow-hidden relative group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl">
                            <Target className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">KPI Realization</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">
                                {latestReview ? latestReview.ratings.length : "0"} / 5
                            </h3>
                        </div>
                    </div>
                    <Progress value={(latestReview?.ratings.length || 0) * 20} className="h-2 bg-slate-100 dark:bg-white/5" />
                </Card>

                <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 overflow-hidden relative group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-amber-500/10 rounded-2xl">
                            <TrendingUp className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Growth Vector</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">OPTIMAL</h3>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`h-2 flex-1 rounded-full ${i <= 4 ? 'bg-amber-500' : 'bg-slate-100 dark:bg-white/5'}`} />
                        ))}
                    </div>
                </Card>
            </div>

            {/* REVIEWS TIMELINE */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Review <span className="text-indigo-600">History</span></h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chronological performance snapshots</p>
                    </div>
                    <Button variant="ghost" className="text-[10px] font-bold uppercase text-indigo-500 tracking-widest">View Full Archive</Button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="py-10 flex flex-col items-center justify-center gap-4 text-slate-700">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500/30" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6 text-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-slate-200 dark:border-white/5">
                            <AlertCircle className="w-12 h-12 opacity-5" />
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Initial performance cycle pending</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-6 rounded-[30px] flex items-center justify-between group hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[20px] bg-slate-50 dark:bg-black/40 flex flex-col items-center justify-center border border-slate-100 dark:border-white/5 group-hover:bg-indigo-600 transition-colors">
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white/50 uppercase leading-none">CYCLE</span>
                                        <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-white uppercase leading-none mt-1">{review.reviewCycle}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{review.reviewer.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{review.reviewer.designation}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-10">
                                    <div className="hidden lg:block">
                                        <div className="flex gap-2">
                                            {review.ratings.slice(0, 3).map((r: any, idx: number) => (
                                                <div key={idx} className="px-3 py-1 bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5 flex items-center gap-2">
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase">{r.kpi.name}</span>
                                                    <span className="text-[9px] font-bold text-indigo-500">{r.rating}/5</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tighter">{review.overallRating}</p>
                                        <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-[0.2em]">FINALIZED</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
