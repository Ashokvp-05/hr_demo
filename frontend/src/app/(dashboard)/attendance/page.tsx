"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import AttendanceHistoryTable from "@/components/dashboard/AttendanceHistoryTable"
import { CalendarCheck, Clock, Activity, Zap, Cpu } from "lucide-react"
import AttendanceCalendar from "@/components/dashboard/AttendanceCalendar"
import AttendanceMonthlyPulse from "@/components/dashboard/AttendanceMonthlyPulse"
import { format } from "date-fns"

export default function AttendancePage() {
    const { data: session, status } = useSession()
    const [mount, setMount] = useState(false)

    useEffect(() => { setMount(true) }, [])

    if (!mount || status === "loading") return null

    const token = (session?.user as any)?.accessToken || ""

    return (
        <div className="flex-1 min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-4 md:p-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="max-w-[1600px] mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-950 p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-5 bg-indigo-600 rounded-[1.5rem] shadow-2xl shadow-indigo-600/20">
                        <Clock className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Attendance</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track your shifts, attendance, and work logs</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 tracking-widest">Live Sync</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                {/* Main Table Content */}
                <div className="md:col-span-8 space-y-8">
                    <AttendanceHistoryTable token={token} />
                </div>

                {/* Sidebar Metrics */}
                <div className="md:col-span-4 space-y-8">
                    <AttendanceMonthlyPulse token={token} />
                    
                    <div className="bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Monthly Matrix</h3>
                            <Zap className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="p-10">
                            <AttendanceCalendar token={token} />
                            <div className="flex gap-8 justify-center mt-10 pt-8 border-t border-slate-50 dark:border-white/5">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Present
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" /> Holiday
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> Absent
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)
}
