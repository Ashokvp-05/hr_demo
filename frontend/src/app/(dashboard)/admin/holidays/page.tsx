"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Calendar as CalendarIcon, Loader2, Search, RefreshCw, Wifi, ChevronLeft, ChevronRight, PartyPopper } from "lucide-react"
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths, isToday, isBefore } from "date-fns"
import { API_BASE_URL } from "@/lib/config"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useWebSocket } from "@/hooks/useWebSocket"

export default function HolidaysPage() {
    const { data: session } = useSession()
    const token = (session?.user as any)?.accessToken

    const [holidays, setHolidays] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: "", date: "" })
    const [search, setSearch] = useState("")
    const [calMonth, setCalMonth] = useState(new Date())

    const fetchHolidays = useCallback(async () => {
        if (!token) return
        try {
            const res = await fetch(`${API_BASE_URL}/holidays`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) {
                const data = await res.json()
                setHolidays(Array.isArray(data) ? data : (data.holidays || []))
            }
        } catch { console.error("Failed to fetch holidays") }
        finally { setLoading(false) }
    }, [token])

    useEffect(() => { fetchHolidays() }, [fetchHolidays])

    const onWsMessage = useCallback((msg: any) => {
        if (msg.type === "HOLIDAY_CREATED" || msg.type === "HOLIDAY_DELETED" || msg.type === "DASHBOARD_STATS") {
            fetchHolidays()
        }
    }, [fetchHolidays])
    useWebSocket({ onMessage: onWsMessage })

    const handleAdd = async () => {
        if (!form.name.trim() || !form.date) return toast.error("Please provide both name and date")
        setSaving(true)
        try {
            const res = await fetch(`${API_BASE_URL}/holidays`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: form.name, date: new Date(form.date).toISOString(), year: new Date(form.date).getFullYear() })
            })
            if (res.ok) {
                toast.success("Holiday added successfully!")
                setForm({ name: "", date: "" })
                setShowForm(false)
                fetchHolidays()
            } else {
                const err = await res.json().catch(() => ({}))
                toast.error(err.error || "Failed to add holiday")
            }
        } catch { toast.error("Network error") }
        finally { setSaving(false) }
    }

    const handleDelete = async (id: string) => {
        setDeleteId(id)
        try {
            const res = await fetch(`${API_BASE_URL}/holidays/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) {
                setHolidays(prev => prev.filter(h => h.id !== id))
                toast.success("Holiday removed successfully")
            } else {
                const err = await res.json().catch(() => ({}))
                console.error("[Holiday Delete] Failed:", res.status, err)
                toast.error(err.error || `Delete failed (${res.status})`)
            }
        } catch (e) {
            console.error("[Holiday Delete] Network error:", e)
            toast.error("Failed to delete — network error")
        }
        finally { setDeleteId(null) }
    }

    // Calendar
    const monthStart = startOfMonth(calMonth)
    const monthEnd = endOfMonth(calMonth)
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startPad = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1
    const holidayDates = holidays.map(h => new Date(h.date))
    const isHolidayDay = (d: Date) => holidayDates.some(hd => isSameDay(hd, d))
    const getHolidayName = (d: Date) => holidays.find(h => isSameDay(new Date(h.date), d))?.name

    // Stats
    const upcoming = holidays.filter(h => !isBefore(new Date(h.date), new Date())).length
    const past = holidays.filter(h => isBefore(new Date(h.date), new Date())).length
    const thisMonth = holidays.filter(h => isSameMonth(new Date(h.date), new Date())).length

    // Filtered list
    const filtered = holidays
        .filter(h => h.name?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return (
        <div className="min-h-full font-body pb-20 bg-[#F8FAFC]">
            <div className="w-full max-w-[1700px] mx-auto space-y-6">

                {/* ── KPI CARDS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Total Holidays</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{holidays.length}</h3>
                            <p className="text-[10px] font-semibold text-indigo-500 mt-1">This Year</p>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <PartyPopper className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Upcoming</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{upcoming}</h3>
                            <p className="text-[10px] font-semibold text-emerald-500 mt-1">Remaining</p>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">This Month</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{thisMonth}</h3>
                            <p className="text-[10px] font-semibold text-amber-500 mt-1">{format(new Date(), 'MMMM')}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Completed</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{past}</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-1">Already Passed</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                    {/* ── CALENDAR VISUAL ── */}
                    <div className="xl:col-span-5 bg-white border border-slate-200/60 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer select-none"><ChevronLeft className="w-4 h-4" /></button>
                                <h3 className="text-lg font-bold text-slate-800 min-w-[160px] text-center">{format(calMonth, 'MMMM yyyy')}</h3>
                                <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer select-none"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                            <button onClick={() => setCalMonth(new Date())} className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline cursor-pointer select-none">Today</button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                    <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                                {monthDays.map(day => {
                                    const hol = isHolidayDay(day)
                                    const today = isToday(day)
                                    const holName = getHolidayName(day)
                                    return (
                                        <div
                                            key={day.toISOString()}
                                            title={holName || undefined}
                                            className={cn(
                                                "relative h-11 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all",
                                                hol ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105" :
                                                today ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200" :
                                                "text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {format(day, 'd')}
                                            {hol && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-white" />}
                                        </div>
                                    )
                                })}
                            </div>
                            {/* Legend */}
                            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-indigo-600" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Holiday</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-emerald-200 border-2 border-emerald-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── HOLIDAY LIST ── */}
                    <div className="xl:col-span-7 bg-white border border-slate-200/60 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
                        <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-slate-800">All Holidays</h2>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative group w-full md:w-[220px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 pl-9 bg-slate-50/50 border border-slate-200/60 rounded-xl text-[13px] font-medium" />
                                </div>
                                <Button onClick={() => setShowForm(true)} className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 text-[11px] font-bold uppercase tracking-wider shadow-md shadow-indigo-200 gap-1.5 cursor-pointer select-none">
                                    <Plus className="w-4 h-4" /> Add Holiday
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ maxHeight: '460px' }}>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Loading holidays...</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-2xl">
                                    <CalendarIcon className="w-10 h-10 text-slate-200 mb-3" />
                                    <p className="text-sm font-bold text-slate-400">No holidays found</p>
                                    <p className="text-[11px] text-slate-300 mt-1">Add your first holiday to get started</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {filtered.map((h, idx) => {
                                        const d = new Date(h.date)
                                        const isPast = isBefore(d, new Date())
                                        return (
                                            <motion.div
                                                key={h.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className={cn(
                                                    "flex items-center justify-between p-5 rounded-2xl border transition-all group hover:shadow-lg hover:-translate-y-0.5",
                                                    isPast ? "bg-slate-50/50 border-slate-100 opacity-60" : "bg-white border-slate-200/60"
                                                )}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm border",
                                                        isPast ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                                                    )}>
                                                        <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{format(d, 'MMM')}</span>
                                                        <span className="text-xl font-extrabold leading-none mt-0.5">{format(d, 'dd')}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[14px] font-bold text-slate-800">{h.name}</h4>
                                                        <p className="text-[11px] font-semibold text-slate-400 mt-1">{format(d, 'EEEE, dd MMMM yyyy')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {isPast ? (
                                                        <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-400 border border-slate-200">Passed</span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">Upcoming</span>
                                                    )}
                                                    <button
                                                        onClick={() => { if(window.confirm(`Delete "${h.name}"?`)) handleDelete(h.id) }}
                                                        disabled={deleteId === h.id}
                                                        className="w-9 h-9 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer select-none"
                                                    >
                                                        {deleteId === h.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-slate-400">
                                Showing <span className="text-slate-700 font-bold">{filtered.length}</span> of <span className="text-slate-700 font-bold">{holidays.length}</span> holidays
                            </p>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Wifi className="w-3 h-3 text-emerald-500" /> Real-time sync
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── ADD HOLIDAY MODAL ── */}
                {showForm && (
                    <>
                        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setShowForm(false)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl border border-slate-100 shadow-2xl p-8 w-[460px] animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <Plus className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Add New Holiday</h3>
                                    <p className="text-sm text-slate-400">This will be visible to all employees</p>
                                </div>
                            </div>
                            <div className="space-y-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Holiday Name</label>
                                    <Input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Independence Day" className="h-12 border-slate-200 rounded-xl text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Date</label>
                                    <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="h-12 border-slate-200 rounded-xl text-sm font-bold" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 justify-end">
                                <Button variant="ghost" onClick={() => setShowForm(false)} className="h-10 px-5 rounded-xl text-sm font-medium cursor-pointer select-none">Cancel</Button>
                                <Button onClick={handleAdd} disabled={saving} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-100 gap-2 cursor-pointer select-none">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Holiday</>}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
