"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, X, Search, Heart, Star, Shield, Target, Award, Rocket, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"

const CATEGORIES = [
    { id: "TEAMWORK", label: "Teamwork", icon: Zap, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { id: "EXCELLENCE", label: "Excellence", icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
    { id: "LEADERSHIP", label: "Leadership", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { id: "INNOVATION", label: "Innovation", icon: Rocket, color: "text-rose-400", bg: "bg-rose-500/10" },
    { id: "RELIABILITY", label: "Reliability", icon: Award, color: "text-amber-400", bg: "bg-amber-500/10" }
]

export default function GiveKudosModal({ token, onClose, onSuccess }: any) {
    const [search, setSearch] = useState("")
    const [users, setUsers] = useState<any[]>([])
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [category, setCategory] = useState("TEAMWORK")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [fetchingUsers, setFetchingUsers] = useState(false)

    useEffect(() => {
        if (search.length > 2) {
            const timeout = setTimeout(async () => {
                setFetchingUsers(true)
                try {
                    const res = await fetch(`${API_BASE_URL}/users/search?q=${search}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    const data = await res.json()
                    setUsers(Array.isArray(data) ? data : [])
                } catch (e) {
                    toast.error("Resource discovery failure")
                } finally {
                    setFetchingUsers(false)
                }
            }, 300)
            return () => clearTimeout(timeout)
        } else {
            setUsers([])
        }
    }, [search, token])

    const handleSubmit = async () => {
        if (!selectedUser || !message) return toast.error("Identity or message missing")
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/kudos/give`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    toUserId: selectedUser.id,
                    message,
                    category
                })
            })

            if (res.ok) {
                toast.success(`Recognition broadcast to ${selectedUser.name}!`)
                onSuccess?.()
                onClose()
            } else {
                toast.error("Transmission failed")
            }
        } catch (e) {
            toast.error("Network synchronization error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[40px] shadow-xl overflow-hidden relative"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] pointer-events-none" />

                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20">
                            <Heart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Grant Kudos</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Public recognition protocol</p>
                        </div>
                    </div>
                    <Button size="icon" variant="ghost" className="text-slate-500 hover:text-white" onClick={onClose}>
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                <div className="p-10 space-y-8">
                    {/* RECIPIENT SEARCH */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Target Personnel</label>
                        {selectedUser ? (
                            <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-bold">
                                        {selectedUser.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-white text-xs font-bold uppercase tracking-wide">{selectedUser.name}</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{selectedUser.designation}</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-500/5 text-[9px] font-bold uppercase" onClick={() => setSelectedUser(null)}>Reset</Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                                <Input
                                    className="h-14 bg-slate-950 border-white/5 rounded-2xl pl-12 text-sm font-bold placeholder:text-slate-800"
                                    placeholder="Search Identity by Name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <AnimatePresence>
                                    {(search.length > 2 && users.length > 0) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 p-2"
                                        >
                                            {users.map((u: any) => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => { setSelectedUser(u); setSearch(""); setUsers([]); }}
                                                    className="w-full p-4 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-all text-left group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-700 group-hover:text-indigo-400 transition-colors">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-[11px] font-bold uppercase tracking-wide">{u.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{u.designation || "Personnel"}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* CATEGORY SELECTION */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Recognition Pillar</label>
                        <div className="grid grid-cols-3 gap-3">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id)}
                                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center group ${category === cat.id ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-600/20' : 'bg-slate-950 border-white/5 hover:border-white/20'}`}
                                >
                                    <cat.icon className={`w-5 h-5 ${category === cat.id ? 'text-white' : cat.color}`} />
                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${category === cat.id ? 'text-white' : 'text-slate-500'}`}>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* MESSAGE */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Broadcast Message</label>
                        <Textarea
                            className="bg-slate-950 border-white/5 rounded-2xl min-h-[120px] p-6 text-xs font-bold leading-relaxed resize-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Detail the exceptional output or cultural impact..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-8 bg-slate-950/40 border-t border-white/5 flex gap-4">
                    <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest" onClick={onClose}>Abort</Button>
                    <Button
                        disabled={loading}
                        onClick={handleSubmit}
                        className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest gap-2 shadow-xl shadow-indigo-600/20"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                        Transmit Recognition
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    )
}
