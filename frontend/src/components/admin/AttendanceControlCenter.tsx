"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import {
    Users, Loader2, Download, Search, Calendar, Clock, MapPin, UserCheck, AlertCircle,
    Building2, Home, Wifi, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useWebSocket } from "@/hooks/useWebSocket"
import { API_BASE_URL } from "@/lib/config"
import {
    format, startOfDay, endOfDay, differenceInMinutes
} from "date-fns"
import { Input } from "@/components/ui/input"

export default function AttendanceControlCenter({ token, initialTab = "attendance" }: { token: string; initialTab?: string }) {
    const [loading, setLoading] = useState(true)
    const [overview, setOverview] = useState<any>(null)
    const [liveSessions, setLiveSessions] = useState<any[]>([])
    const [dateEntries, setDateEntries] = useState<any[]>([])
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [logDeptFilter, setLogDeptFilter] = useState("ALL")
    const [locationFilter, setLocationFilter] = useState("ALL")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [searchQuery, setSearchQuery] = useState("")
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date())
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (initialTab === "attendance-present") {
            setStatusFilter("PRESENT")
        } else if (initialTab === "attendance-absent") {
            setStatusFilter("ABSENT")
        } else {
            setStatusFilter("ALL")
        }
    }, [initialTab])

    const fetchDateAttendance = useCallback(async (date: Date) => {
        try {
            const headers = { "Authorization": `Bearer ${token}` }
            const dateStr = format(date, "yyyy-MM-dd")
            const res = await fetch(`${API_BASE_URL}/time-entries/attendance-by-date?date=${dateStr}`, { headers })
            if (res.ok) {
                const entries = await res.json()
                setDateEntries(entries)
            }
        } catch (err) {
            console.error(err)
        }
    }, [token])

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const headers = { "Authorization": `Bearer ${token}` }
            const [overviewRes, usersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/overview`, { headers }),
                fetch(`${API_BASE_URL}/users?limit=ALL`, { headers })
            ])
            if (overviewRes.ok) {
                const o = await overviewRes.json()
                setOverview(o)
                setLiveSessions(o.liveSessions || [])
            }
            if (usersRes.ok) {
                const ud = await usersRes.json()
                setAllUsers(Array.isArray(ud) ? ud : (ud?.users || []))
            }
            await fetchDateAttendance(selectedDate)
        } catch (err) {
            console.error(err)
            if (!silent) toast.error("Connection synchronization failed")
        }
        finally { setLoading(false) }
    }, [token, selectedDate, fetchDateAttendance])

    useEffect(() => {
        fetchData()
        const iv = setInterval(() => fetchData(true), 5000)
        return () => clearInterval(iv)
    }, [fetchData])

    useEffect(() => {
        fetchDateAttendance(selectedDate)
    }, [selectedDate, fetchDateAttendance])

    const handleExport = useCallback(async () => {
        try {
            const startStr = format(startOfDay(selectedDate), "yyyy-MM-dd")
            const endStr = format(endOfDay(selectedDate), "yyyy-MM-dd")
            const res = await fetch(`${API_BASE_URL}/reports/export/excel?start=${startStr}&end=${endStr}`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `Attendance_Matrix_${startStr}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success("Intelligence report exported successfully")
            } else { toast.error("Failed to generate export") }
        } catch { toast.error("Export protocol failure") }
    }, [token, selectedDate])

    const handleWsMessage = useCallback((msg: any) => {
        if (msg.type === "DASHBOARD_STATS") {
            fetchData(true)
        }
    }, [fetchData])

    useWebSocket({ onMessage: handleWsMessage })

    const departments = Array.from(new Set(allUsers.map((u: any) => u.department?.name).filter(Boolean)))
    const activeUsers = allUsers.filter((u: any) => u.status === 'ACTIVE')

    // Build a map of userId -> date entry (from the new date-based API)
    // Falls back to liveSessions from overview API if the date-based API has no data
    const dateEntryMap = useMemo(() => {
        const map = new Map<string, any>()
        
        const todayStr = format(new Date(), "yyyy-MM-dd")
        const selectedStr = format(selectedDate, "yyyy-MM-dd")
        const isToday = todayStr === selectedStr

        if (dateEntries.length > 0) {
            // Use the date-based API data (preferred)
            dateEntries.forEach((entry: any) => {
                const uid = entry.user?.id || entry.userId
                if (!map.has(uid)) {
                    map.set(uid, entry)
                }
            })
        } else if (isToday && liveSessions.length > 0) {
            // Fallback: use liveSessions from overview API for today
            liveSessions.forEach((session: any) => {
                const uid = session.id || session.userId
                if (!map.has(uid)) {
                    map.set(uid, session)
                }
            })
        }
        
        return map
    }, [dateEntries, liveSessions, selectedDate])

    const unfilteredRows = useMemo(() => {
        // Determine if 1 hour grace period has passed (absent only after 10:00 AM)
        const todayStr = format(new Date(), "yyyy-MM-dd")
        const selectedStr = format(selectedDate, "yyyy-MM-dd")
        const isToday = todayStr === selectedStr
        const currentHour = now.getHours()
        const graceHourPassed = !isToday || currentHour >= 10 // Past dates always show absent; today only after 10 AM

        let rows = (activeUsers || []).map((u: any) => {
            const entry = dateEntryMap.get(u.id)
            let status: 'Present' | 'Absent' | 'Late' | 'Not Yet' = graceHourPassed ? 'Absent' : 'Not Yet'
            let remarks = '-'
            
            if (entry) {
                const clockInTime = new Date(entry.clockIn)
                const targetTime = new Date(clockInTime)
                targetTime.setHours(9, 0, 0, 0)
                
                if (clockInTime > targetTime) {
                    status = 'Late'
                    const diffMin = differenceInMinutes(clockInTime, targetTime)
                    remarks = `Late by ${diffMin}m`
                } else {
                    status = 'Present'
                    remarks = 'Full Day'
                }
            }
            
            return { ...u, session: entry || null, attendanceStatus: status, remarks }
        })

        return rows.filter((u: any) => {
            const matchesDept = logDeptFilter === 'ALL' || u.department?.name === logDeptFilter
            return matchesDept
        })
    }, [activeUsers, dateEntryMap, logDeptFilter, now, selectedDate])

    const processedRows = useMemo(() => {
        return unfilteredRows.filter((u: any) => {
            let matchesStatus = true
            if (statusFilter !== 'ALL') {
                if (statusFilter === 'PRESENT') {
                    matchesStatus = u.attendanceStatus === 'Present' || u.attendanceStatus === 'Late' || u.attendanceStatus === 'Not Yet'
                } else if (statusFilter === 'LATE') {
                    matchesStatus = u.attendanceStatus === 'Late'
                } else if (statusFilter === 'ABSENT') {
                    matchesStatus = u.attendanceStatus === 'Absent'
                }
            }

            let matchesLocation = true
            if (locationFilter !== 'ALL') {
                if (locationFilter === 'IN_OFFICE') {
                    matchesLocation = u.session?.clockType === 'IN_OFFICE'
                } else if (locationFilter === 'REMOTE') {
                    matchesLocation = u.session?.clockType === 'REMOTE'
                }
            }
            
            const matchesSearch = (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                                  (u.id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
            
            return matchesStatus && matchesLocation && matchesSearch
        })
    }, [unfilteredRows, statusFilter, locationFilter, searchQuery])

    const stats = useMemo(() => {
        const total = unfilteredRows.length
        const present = unfilteredRows.filter((r: any) => r.attendanceStatus === 'Present' || r.attendanceStatus === 'Late').length
        const absent = unfilteredRows.filter((r: any) => r.attendanceStatus === 'Absent').length
        const late = unfilteredRows.filter((r: any) => r.attendanceStatus === 'Late').length
        const notYet = unfilteredRows.filter((r: any) => r.attendanceStatus === 'Not Yet').length
        
        let totalWorkingMin = 0
        unfilteredRows.forEach((r: any) => {
            if (r.session) {
                const clockInTime = new Date(r.session.clockIn)
                const clockOutTime = r.session.clockOut ? new Date(r.session.clockOut) : now
                const diff = differenceInMinutes(clockOutTime, clockInTime)
                if (diff > 0) {
                    totalWorkingMin += diff
                }
            }
        })
        
        const h = Math.floor(totalWorkingMin / 60)
        const m = Math.round(totalWorkingMin % 60)
        const displayWorkingHours = `${h}h ${m}m`

        const presentPct = total > 0 ? ((present / total) * 100).toFixed(2) : "0.00"
        const absentPct = total > 0 ? ((absent / total) * 100).toFixed(2) : "0.00"
        const latePct = total > 0 ? ((late / total) * 100).toFixed(2) : "0.00"

        const onsite = unfilteredRows.filter((r: any) => r.session?.clockType === 'IN_OFFICE').length
        const remote = unfilteredRows.filter((r: any) => r.session?.clockType === 'REMOTE').length

        return {
            total,
            present,
            presentPct,
            absent,
            absentPct,
            late,
            latePct,
            onsite,
            remote,
            workingHours: displayWorkingHours
        }
    }, [unfilteredRows, now])

    const handleSearchClick = () => {
        fetchData()
        toast.info("Roster data refreshed")
    }

    return (
        <div className="min-h-full font-body pb-20 bg-[#F8FAFC]">
            <div className="w-full max-w-[1700px] mx-auto space-y-6">
                
                {/* ── 5 KPI CARDS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    
                    {/* Card 1: Total Employees */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Total Employees</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{stats.total}</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-1">Active Roster</p>
                        </div>
                    </div>

                    {/* Card 2: Present Today */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Present Today</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{stats.present}</h3>
                            <p className="text-[10px] font-semibold text-emerald-500 mt-1">{stats.presentPct}% of Total</p>
                        </div>
                    </div>

                    {/* Card 3: Absent Today */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Absent Today</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{stats.absent}</h3>
                            <p className="text-[10px] font-semibold text-rose-500 mt-1">{stats.absentPct}% of Total</p>
                        </div>
                    </div>

                    {/* Card 4: Onsite Today */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Onsite Today</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{stats.onsite}</h3>
                            <p className="text-[10px] font-semibold text-violet-500 mt-1">🏢 Work From Office</p>
                        </div>
                    </div>

                    {/* Card 5: Work From Home */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                            <Home className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Work From Home</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{stats.remote}</h3>
                            <p className="text-[10px] font-semibold text-sky-500 mt-1">🏠 Remote Employees</p>
                        </div>
                    </div>
                </div>

                {/* ── FILTER PROTOCOLS ── */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5 items-end">
                    
                    {/* Date Selector */}
                    <div className="flex flex-col gap-1.5 w-full group">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                            <input 
                                type="date"
                                value={format(selectedDate, "yyyy-MM-dd")}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (val) setSelectedDate(new Date(val))
                                }}
                                className="h-12 w-full pl-12 pr-4 bg-slate-50/50 border border-slate-200/60 rounded-xl text-[13px] font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Department Selector */}
                    <div className="flex flex-col gap-1.5 w-full group">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Department</label>
                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                            <select
                                value={logDeptFilter}
                                onChange={(e) => setLogDeptFilter(e.target.value)}
                                className="h-12 w-full pl-12 pr-10 bg-slate-50/50 border border-slate-200/60 rounded-xl text-[13px] font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                            >
                                <option value="ALL">All Departments</option>
                                {departments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Location Selector */}
                    <div className="flex flex-col gap-1.5 w-full group">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                            <select
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="h-12 w-full pl-12 pr-10 bg-slate-50/50 border border-slate-200/60 rounded-xl text-[13px] font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                            >
                                <option value="ALL">All Locations</option>
                                <option value="IN_OFFICE">🏢 Onsite (Office)</option>
                                <option value="REMOTE">🏠 Work From Home</option>
                            </select>
                        </div>
                    </div>

                    {/* Status Selector */}
                    <div className="flex flex-col gap-1.5 w-full group">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status</label>
                        <div className="relative">
                            <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-12 w-full pl-12 pr-10 bg-slate-50/50 border border-slate-200/60 rounded-xl text-[13px] font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                            >
                                <option value="ALL">All Status</option>
                                <option value="PRESENT">Present</option>
                                <option value="LATE">Late</option>
                                <option value="ABSENT">Absent</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 w-full h-12">
                        <Button 
                            onClick={handleSearchClick}
                            className="h-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 text-[13px] font-bold uppercase tracking-wider shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
                        >
                            <Search className="w-4 h-4 shrink-0" />
                            Search
                        </Button>
                        <Button 
                            onClick={handleExport}
                            variant="outline" 
                            className="h-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 rounded-xl px-4 text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-white transition-all"
                        >
                            <Download className="w-4 h-4 shrink-0" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* ── TABLE CARD ── */}
                <div className="bg-white border border-slate-200/60 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Attendance List</h2>
                                <p className="text-sm text-slate-400 mt-1">List of employee attendance for selected date.</p>
                            </div>
                            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative group w-full md:w-[280px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <Input 
                                    placeholder="Search employees..." 
                                    value={searchQuery}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                    className="h-11 pl-11 bg-slate-50/50 border border-slate-200/60 rounded-xl text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-indigo-100 transition-all w-full placeholder:text-slate-400"
                                />
                            </div>
                            <button
                                onClick={() => { fetchData(); toast.info("Data refreshed") }}
                                className="h-11 w-11 bg-slate-50 border border-slate-200/60 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-xl flex items-center justify-center transition-all shrink-0"
                                title="Refresh data"
                            >
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[5%]">#</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[12%]">Employee ID</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[18%]">Employee Name</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[13%]">Department</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[10%]">Check In</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[10%]">Check Out</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[10%]">Working Hours</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[12%]">Location</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[10%]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="py-24 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-3" />
                                            <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Loading Attendance matrix...</p>
                                        </td>
                                    </tr>
                                ) : processedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-20 text-center text-slate-400 font-semibold">
                                            No personnel found matching current parameters.
                                        </td>
                                    </tr>
                                ) : (
                                    processedRows.map((user: any, idx: number) => {
                                        const isPresent = user.attendanceStatus === 'Present' || user.attendanceStatus === 'Late'
                                        const checkInTimeStr = user.session?.clockIn 
                                            ? format(new Date(user.session.clockIn), 'hh:mm a') 
                                            : '-'
                                        const checkOutTimeStr = user.session?.clockOut 
                                            ? format(new Date(user.session.clockOut), 'hh:mm a') 
                                            : '-'
                                        
                                        let workingHrsStr = '-'
                                        const hrs = user.session?.hoursWorked || user.session?.totalHours
                                        if (hrs) {
                                            const h = Math.floor(Number(hrs))
                                            const m = Math.round((Number(hrs) % 1) * 60)
                                            workingHrsStr = `${h}h ${m}m`
                                        } else if (user.session?.clockIn && !user.session?.clockOut) {
                                            const diffMin = differenceInMinutes(new Date(), new Date(user.session.clockIn))
                                            const h = Math.floor(diffMin / 60)
                                            const m = diffMin % 60
                                            workingHrsStr = `${h}h ${m}m`
                                        }

                                        return (
                                            <motion.tr 
                                                key={user.id || idx}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="hover:bg-slate-50/50 transition-colors group"
                                            >
                                                {/* Index */}
                                                <td className="py-4 px-6 text-[13px] font-bold text-slate-400">
                                                    {idx + 1}
                                                </td>

                                                {/* ID */}
                                                <td className="py-4 px-6 text-[13px] font-bold text-slate-600 uppercase">
                                                    {user.id?.substring(0, 8) || `EMP${String(idx+1).padStart(3, '0')}`}
                                                </td>

                                                {/* Profile */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-[14px] shrink-0 shadow-sm",
                                                            user.attendanceStatus === 'Present' ? "bg-emerald-500" :
                                                            user.attendanceStatus === 'Late' ? "bg-amber-500" : "bg-rose-400"
                                                        )}>
                                                            {user.name?.substring(0, 1).toUpperCase() || "U"}
                                                        </div>
                                                        <span className="text-[14px] font-bold text-slate-800">{user.name}</span>
                                                    </div>
                                                </td>

                                                {/* Department */}
                                                <td className="py-4 px-6 text-[13px] font-semibold text-slate-600">
                                                    {user.department?.name || 'General'}
                                                </td>

                                                {/* Check In */}
                                                <td className="py-4 px-6 text-[13px] font-semibold text-slate-700">
                                                    {checkInTimeStr}
                                                </td>

                                                {/* Check Out */}
                                                <td className="py-4 px-6 text-[13px] font-semibold text-slate-700">
                                                    {checkOutTimeStr}
                                                </td>

                                                {/* Working Hours */}
                                                <td className="py-4 px-6 text-[13px] font-bold text-slate-700">
                                                    {workingHrsStr}
                                                </td>

                                                {/* Location */}
                                                <td className="py-4 px-6">
                                                    {user.session?.clockType ? (
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                                                            user.session.clockType === 'REMOTE'
                                                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                                                : "bg-violet-50 text-violet-700 border-violet-100"
                                                        )}>
                                                            <span className="text-[11px]">
                                                                {user.session.clockType === 'REMOTE' ? '🏠' : '🏢'}
                                                            </span>
                                                            {user.session.clockType === 'REMOTE' ? 'Work From Home' : 'Onsite'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-300 font-semibold">—</span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="py-4 px-6">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                                                        user.attendanceStatus === 'Present' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                        user.attendanceStatus === 'Late' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                        user.attendanceStatus === 'Not Yet' ? "bg-slate-50 text-slate-600 border-slate-200" :
                                                        "bg-rose-50 text-rose-700 border-rose-100"
                                                    )}>
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", 
                                                            user.attendanceStatus === 'Present' ? "bg-emerald-500" :
                                                            user.attendanceStatus === 'Late' ? "bg-amber-500" :
                                                            user.attendanceStatus === 'Not Yet' ? "bg-slate-400" : "bg-rose-500"
                                                        )} />
                                                        {user.attendanceStatus}
                                                    </span>
                                                </td>


                                            </motion.tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── TABLE FOOTER ── */}
                    <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-400">
                            Showing <span className="text-slate-700 font-bold">{processedRows.length}</span> of <span className="text-slate-700 font-bold">{unfilteredRows.length}</span> employees
                        </p>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Wifi className="w-3 h-3 text-emerald-500" />
                                Auto-refresh: 5s
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Last sync: {format(now, 'hh:mm:ss a')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
