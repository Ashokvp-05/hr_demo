"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Plus, Briefcase, ChevronRight, CheckCircle2, AlertCircle, Calendar, Play, StopCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"

export default function TimesheetOrbit({ token }: { token: string }) {
    const [entries, setEntries] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showLog, setShowLog] = useState(false)
    const [form, setForm] = useState({ projectId: "", taskId: "", hours: "", description: "" })

    const fetchData = async () => {
        try {
            const [projRes, entriesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/enterprise/projects`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/enterprise/timesheets/me`, { headers: { Authorization: `Bearer ${token}` } })
            ])
            const projData = await projRes.json()
            const entData = await entriesRes.json()
            setProjects(projData)
            setEntries(entData)
        } catch (e) {
            toast.error("Telemetry link severed")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [token])

    const handleSubmit = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/enterprise/timesheets`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            })
            if (res.ok) {
                toast.success("Temporal signal synchronized")
                setShowLog(false)
                fetchData()
            }
        } catch (e) { toast.error("Synchronization collision") }
    }

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Timesheet <span className="text-indigo-600">Orbit</span></h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Billable telemetry & effort distribution</p>
                </div>
                <Button onClick={() => setShowLog(true)} className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 text-[10px] font-bold uppercase tracking-widest gap-2 shadow-xl shadow-indigo-600/20">
                    <Plus className="w-4 h-4" /> Log Effort
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {entries.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5">
                        <Clock className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zero active temporal signals logged</p>
                    </div>
                ) : entries.map((entry, i) => (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl hover:ring-2 hover:ring-indigo-500/20 transition-all"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500">
                                <Play className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="h-7 px-3 rounded-lg text-[8px] font-bold border-emerald-500/20 text-emerald-500 uppercase">{entry.status}</Badge>
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter uppercase">{entry.project.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{entry.hours} hrs • {new Date(entry.date).toLocaleDateString()}</p>
                        <div className="mt-8 pt-8 border-t border-slate-50 dark:border-white/5">
                            <p className="text-[10px] font-bold text-slate-400 line-clamp-2 leading-relaxed">"{entry.description || "Experimental node operation logs..."}"</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {showLog && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] p-10 space-y-8 shadow-4xl border border-slate-200 dark:border-white/5">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold uppercase text-slate-900 dark:text-white">Temporal <span className="text-indigo-600">Sync</span></h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowLog(false)}><StopCircle className="w-6 h-6 text-slate-400" /></Button>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase text-slate-500">Target Project</label>
                                    <select
                                        className="w-full h-14 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl px-6 outline-none text-xs font-bold uppercase tracking-widest"
                                        onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                                    >
                                        <option value="">Select Protocol Target</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Temporal Units (Hrs)</label>
                                        <Input type="number" step="0.5" className="h-14 bg-slate-50 dark:bg-black/40 rounded-2xl px-6 text-xs font-bold" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Operation Date</label>
                                        <Input type="date" className="h-14 bg-slate-50 dark:bg-black/40 rounded-2xl px-6 text-xs font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase text-slate-500">Mission Logs</label>
                                    <Textarea className="min-h-[120px] bg-slate-50 dark:bg-black/40 rounded-2xl p-6 text-xs font-bold" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                </div>
                            </div>
                            <Button onClick={handleSubmit} className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl">Transmit Temporal Signal</Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
