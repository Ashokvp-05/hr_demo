"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Star, Shield, Zap, Rocket, Award, Loader2, MessageSquare, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/config"
import { formatDistanceToNow } from "date-fns"
import GiveKudosModal from "./GiveKudosModal"

const CATEGORY_MAP: any = {
    "TEAMWORK": { label: "Teamwork", icon: Zap, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    "EXCELLENCE": { label: "Excellence", icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
    "LEADERSHIP": { label: "Leadership", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    "INNOVATION": { label: "Innovation", icon: Rocket, color: "text-rose-400", bg: "bg-rose-500/10" },
    "RELIABILITY": { label: "Reliability", icon: Award, color: "text-amber-400", bg: "bg-amber-500/10" }
}

export default function KudosWall({ token }: { token: string }) {
    const [feed, setFeed] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    const fetchFeed = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/kudos/feed`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setFeed(data)
        } catch (e) {
            console.error("Feed sync error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFeed()
    }, [token])

    return (
        <div className="space-y-10">
            {/* HERO BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Recognition <span className="text-indigo-600">Wall</span></h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Immutable proof of excellence</p>
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 text-[11px] font-bold uppercase tracking-widest gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                >
                    <Heart className="w-5 h-5 fill-current" />
                    Recognize Personnel
                </Button>
            </div>

            {/* FEED CONTAINER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-slate-700">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500/30" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Deciphering culturall patterns...</p>
                    </div>
                ) : feed.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-6 text-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-slate-200 dark:border-white/5">
                        <MessageSquare className="w-16 h-16 opacity-5" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.4em]">Awaiting first recognition cycle</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {feed.map((kudos, idx) => {
                            const cat = CATEGORY_MAP[kudos.category] || CATEGORY_MAP["TEAMWORK"]
                            return (
                                <motion.div
                                    key={kudos.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-8 rounded-[40px] shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all group overflow-hidden relative"
                                >
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />

                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex gap-4">
                                            <div className="relative h-14 w-14">
                                                <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl animate-pulse" />
                                                <div className="relative h-full w-full rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold text-xl uppercase">
                                                    {kudos.toUser.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider uppercase group-hover:text-indigo-600 transition-colors">{kudos.toUser.name}</h4>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{kudos.toUser.designation || "Executive"}</p>
                                            </div>
                                        </div>
                                        <div className={`p-4 rounded-2xl ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform`}>
                                            <cat.icon className="w-6 h-6" />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-[28px] border border-slate-100 dark:border-white/5 mb-8">
                                        <p className="text-slate-600 dark:text-slate-300 text-xs font-bold leading-relaxed">"{kudos.message}"</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">From:</span>
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">{kudos.fromUser.name}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDistanceToNow(new Date(kudos.createdAt))} ago</span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                )}
            </div>

            {/* MODAL */}
            {showModal && (
                <GiveKudosModal
                    token={token}
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchFeed}
                />
            )}
        </div>
    )
}
