"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CheckCircle2, Circle, Rocket, Loader2, Calendar, ShieldCheck, Cpu, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"

export default function OnboardingCenter({ token }: { token: string }) {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    const fetchTasks = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/lifecycle/onboarding/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setTasks(data)
        } catch (e) {
            toast.error("Lifecycle synchronization failure")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [token])

    const handleComplete = async (taskId: string) => {
        setProcessing(taskId)
        try {
            const res = await fetch(`${API_BASE_URL}/lifecycle/onboarding/tasks/${taskId}/complete`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                toast.success("Protocol segment finalized")
                fetchTasks()
            }
        } catch (e) {
            toast.error("Execution collision")
        } finally {
            setProcessing(null)
        }
    }

    const completedCount = tasks.filter(t => t.isCompleted).length
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-700">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500/30" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Calibrating onboarding vectors...</p>
        </div>
    )

    if (tasks.length === 0) return null

    return (
        <div className="space-y-10">
            {/* HUD HEADER */}
            <div className="bg-indigo-600 dark:bg-indigo-700 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden group shadow-2xl shadow-indigo-500/20">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />

                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                            <Rocket className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold uppercase tracking-tighter">Mission <span className="underline decoration-indigo-300 decoration-4">Onboarding</span></h2>
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-100 opacity-60">Identity realization protocol in progress</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-xl">
                        <div className="flex justify-between items-end px-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{completedCount} of {tasks.length} Segments Resolved</p>
                            <p className="text-2xl font-bold">{Math.round(progress)}%</p>
                        </div>
                        <Progress value={progress} className="h-3 bg-white/10 rounded-full" />
                    </div>
                </div>
            </div>

            {/* TASK LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                    {tasks.map((task, idx) => (
                        <motion.button
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            disabled={task.isCompleted || processing === task.id}
                            onClick={() => handleComplete(task.id)}
                            className={`p-8 rounded-[2.5rem] border text-left transition-all group relative overflow-hidden ${task.isCompleted
                                ? 'bg-emerald-500/5 border-emerald-500/10 cursor-default opacity-60'
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10'
                                }`}
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all ${task.isCompleted
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-slate-50 dark:bg-black/40 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'
                                        }`}>
                                        {task.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold uppercase tracking-wider ${task.isCompleted ? 'text-emerald-600 line-through' : 'text-slate-900 dark:text-white'}`}>{task.title}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {task.isCompleted ? `Resolved at ${new Date(task.completedAt).toLocaleDateString()}` : "Action Required"}
                                        </p>
                                    </div>
                                </div>
                                {processing === task.id ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> : <ChevronRight className={`w-5 h-5 transition-transform ${task.isCompleted ? 'opacity-0' : 'text-slate-200 group-hover:translate-x-1 group-hover:text-indigo-500'}`} />}
                            </div>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-6 py-6 opacity-30 justify-center">
                <Cpu className="w-5 h-5 text-slate-500" />
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.6em]">Lifecycle Integration Core v.4.0</p>
            </div>
        </div>
    )
}
