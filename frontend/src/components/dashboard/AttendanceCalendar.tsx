"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { isSameDay, parseISO } from "date-fns"
import { Loader2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface AttendanceCalendarProps {
    token: string
}

export default function AttendanceCalendar({ token }: AttendanceCalendarProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [history, setHistory] = useState<any[]>([])
    const [holidays, setHolidays] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return
            setLoading(true)
            try {
                const [histRes, holRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/time/history?limit=365`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/holidays`, { headers: { Authorization: `Bearer ${token}` } })
                ])
                if (histRes.ok) setHistory(await histRes.json())
                if (holRes.ok) setHolidays(await holRes.json())
            } catch (err) {
                console.error("Failed to fetch calendar intelligence")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [token])

    const presentDays = history
        .filter(entry => entry.clockIn && entry.status !== 'RESET')
        .map(entry => {
            const d = new Date(entry.clockIn)
            d.setHours(0, 0, 0, 0) // Normalize for accurate day-matching
            return d
        })

    const holidayDays = holidays.map(h => {
        const d = new Date(h.date)
        d.setHours(0, 0, 0, 0)
        return d
    })

    const activeHoliday = holidays.find(h => date && isSameDay(new Date(h.date), date))

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Matrix...</span>
        </div>
    )

    return (
        <div className="flex flex-col items-center gap-6">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-3xl border-none p-0 scale-110 md:scale-100"
                modifiers={{
                    present: presentDays,
                    holiday: holidayDays,
                }}
                modifiersClassNames={{
                    present: "bg-emerald-500 text-white hover:bg-emerald-600 rounded-full font-bold shadow-lg shadow-emerald-500/20",
                    holiday: "bg-indigo-600 text-white hover:bg-indigo-700 rounded-full font-bold ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-lg shadow-indigo-600/20",
                }}
            />
            {activeHoliday && (
                <div className="w-full p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-3 animate-in zoom-in-95 duration-200">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
                        {activeHoliday.name}
                    </span>
                </div>
            )}
        </div>
    )
}
