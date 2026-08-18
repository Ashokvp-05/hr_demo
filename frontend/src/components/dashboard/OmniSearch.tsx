"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search, Users, Briefcase, DollarSign, Activity,
    Zap, Shield, Settings, Command, X, ArrowRight,
    Target, Heart, Rocket, Landmark, BarChart3
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function OmniSearch() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const router = useRouter()

    const navItems = [
        { label: "Executive Intelligence", path: "/admin?tab=intelligence", icon: Activity, color: "indigo" },
        { label: "Personnel Directory", path: "/admin?tab=users", icon: Users, color: "blue" },
        { label: "Payroll Control", path: "/admin?tab=payroll", icon: DollarSign, color: "emerald" },
        { label: "Executive Reports", path: "/admin?tab=reports", icon: BarChart3, color: "indigo" },
        { label: "Talent Acquisition", path: "/admin?tab=lifecycle", icon: Briefcase, color: "sky" },
        { label: "Recognition Wall", path: "/dashboard", icon: Heart, color: "pink" },
        { label: "Onboarding Mission", path: "/dashboard", icon: Rocket, color: "orange" },
        { label: "Workflow Portal", path: "/dashboard", icon: Landmark, color: "violet" },
        { label: "Infrastructure Settings", path: "/admin?tab=system", icon: Settings, color: "slate" }
    ]

    const filtered = navItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
    )

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const handleNavigate = (path: string) => {
        router.push(path)
        setOpen(false)
        setQuery("")
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="hidden lg:flex items-center gap-4 px-6 h-12 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-400 hover:text-indigo-500 transition-all hover:ring-2 hover:ring-indigo-500/20"
            >
                <Search className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Protocol Search...</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/10">
                    <Command className="w-2.5 h-2.5" />
                    <span className="text-[10px] font-bold">K</span>
                </div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-6 bg-slate-950/60 backdrop-blur-xl"
                        onClick={() => setOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[40px] shadow-4xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center gap-6">
                                <Search className="w-6 h-6 text-indigo-500" />
                                <input
                                    autoFocus
                                    placeholder="Search command palette..."
                                    className="flex-1 bg-transparent border-none outline-none text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <div className="px-3 py-1 bg-slate-50 dark:bg-black/40 rounded-xl text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-white/5">ESC</div>
                            </div>

                            <div className="max-h-[50vh] overflow-y-auto p-6 scrollbar-hide">
                                {filtered.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                        <X className="w-10 h-10 text-slate-200 dark:text-slate-800" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Zero matches for this signal</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {filtered.map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleNavigate(item.path)}
                                                className="w-full flex items-center justify-between p-5 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-white/5 group transition-all"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`p-4 bg-${item.color}-500/10 rounded-2xl text-${item.color}-500 group-hover:bg-${item.color}-500 group-hover:text-white transition-all`}>
                                                        <item.icon className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">{item.label}</span>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md text-[9px] font-bold border border-slate-200 dark:border-white/10">↑↓</kbd>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Navigate</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md text-[9px] font-bold border border-slate-200 dark:border-white/10">↵</kbd>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select</span>
                                    </div>
                                </div>
                                <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em]">OmniSearch v5.0</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
