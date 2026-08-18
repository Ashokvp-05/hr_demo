"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { format, startOfMonth, endOfMonth } from "date-fns"
import {
    Download,
    FileSpreadsheet,
    FileText,
    Calendar as CalendarIcon,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Clock,
    Zap,
    TrendingUp,
    FileSearch,
    History,
    SearchX
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { API_BASE_URL } from "@/lib/config"

export default function ReportsPage() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const [dateRange, setDateRange] = useState<{ from: Date, to: Date }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    })
    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    const token = (session?.user as any)?.accessToken

    useEffect(() => {
        const fetchReportData = async () => {
            if (!token) return
            setLoading(true)
            try {
                const res = await fetch(`${API_BASE_URL}/time/reports?start=${dateRange.from.toISOString()}&end=${dateRange.to.toISOString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setEntries(Array.isArray(data) ? data : (data.entries || []))
                    setCurrentPage(1)
                }
            } catch (e) {
                toast({ title: "Error", description: "Failed to load report data", variant: "destructive" })
            } finally {
                setLoading(false)
            }
        }
        fetchReportData()
    }, [token, dateRange, toast])

    const summary = useMemo(() => {
        let total = 0
        let ot = 0
        entries.forEach((e: any) => {
            const h = Number(e.hoursWorked || 0)
            total += h
            if (h > 9) ot += (h - 9)
        })
        return {
            totalHours: total.toFixed(1),
            overtimeHours: ot.toFixed(1),
            daysWorked: entries.length
        }
    }, [entries])

    const totalPages = Math.ceil(entries.length / itemsPerPage)
    const currentEntries = useMemo(() => {
        const lastIndex = currentPage * itemsPerPage
        const firstIndex = lastIndex - itemsPerPage
        return entries.slice(firstIndex, lastIndex)
    }, [entries, currentPage])

    const handleDownload = async (type: string) => {
        if (!token) return
        toast({ title: "In Progress", description: `Generating ${type} export...` })
        try {
            const formatType = type.toLowerCase() === 'excel' ? 'excel' : 'pdf'
            const res = await fetch(`${API_BASE_URL}/time/reports/${formatType}?start=${dateRange.from.toISOString()}&end=${dateRange.to.toISOString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error()
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Report_${format(dateRange.from, "MMM_yyyy")}.${formatType === 'excel' ? 'xlsx' : 'pdf'}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            toast({ title: "Success", description: "Download complete." })
        } catch (error) {
            toast({ title: "Failed", description: "Could not generate report.", variant: "destructive" })
        }
    }

    return (
        <div className="flex-1 min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-6 md:p-12 animate-in fade-in duration-500">
            {/* HARMONIZED HEADER (Same as Admin/Manager) */}
            <div className="max-w-[1400px] mx-auto space-y-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                Attendance Portfolio
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Personalized work summaries and professional document exports</p>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-wrap items-center gap-3">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-11 px-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-bold shadow-sm hover:border-indigo-200 transition-colors">
                                    <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                                    {format(dateRange.from, "MMMM yyyy")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="end">
                                <Calendar
                                    mode="single"
                                    selected={dateRange.from}
                                    onSelect={(d) => d && setDateRange({ from: startOfMonth(d), to: endOfMonth(d) })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-11">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload("Excel")}
                                className="rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-4 font-bold h-full"
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" /> .XLSX
                            </Button>
                            <div className="w-[1px] bg-slate-200 dark:bg-slate-800 my-1 mx-1" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload("PDF")}
                                className="rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-4 font-bold h-full"
                            >
                                <FileText className="w-4 h-4 mr-2" /> .PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-12 w-12 rounded-2xl" />
                                        <div className="space-y-2 text-right">
                                            <Skeleton className="h-3 w-20 ml-auto" />
                                            <Skeleton className="h-8 w-24 ml-auto" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        [
                            { label: "Total Hours", value: `${summary.totalHours}h`, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
                            { label: "Overtime", value: `${summary.overtimeHours}h`, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                            { label: "Days Worked", value: `${summary.daysWorked} Days`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" }
                        ].map((stat, i) => (
                            <Card key={i} className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden bg-white dark:bg-slate-900 transform transition-all hover:scale-[1.02] hover:shadow-md hover:ring-indigo-200/50">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* LEDGER TABLE */}
                <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">
                                    <FileSearch className="w-5 h-5" /> Work Log
                                </CardTitle>
                                <CardDescription className="text-xs font-medium mt-1">History of your time at work.</CardDescription>
                            </div>
                            {loading ? (
                                <Skeleton className="h-6 w-32 rounded-full" />
                            ) : (
                                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                    {entries.length} Ledger Entries
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40">
                                        <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-10">Date</th>
                                        <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Clock In</th>
                                        <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Clock Out</th>
                                        <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right pr-10">Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: itemsPerPage }).map((_, i) => (
                                            <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                                                <td className="p-5 pl-10"><Skeleton className="h-5 w-48" /></td>
                                                <td className="p-5 text-center flex justify-center"><Skeleton className="h-6 w-16" /></td>
                                                <td className="p-5 text-center"><Skeleton className="h-6 w-16 mx-auto" /></td>
                                                <td className="p-5 text-right pr-10"><Skeleton className="h-8 w-14 ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <>
                                            {currentEntries.map((row, idx) => (
                                                <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                                                    <td className="p-5 pl-10">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 transition-all group-hover:bg-indigo-500 group-hover:scale-150 shadow-[0_0_0_2px_transparent] group-hover:shadow-indigo-500/20" />
                                                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                                {format(new Date(row.clockIn), "EEEE, dd MMM yyyy")}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        <span className="text-[11px] font-bold font-mono px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100/50 dark:border-emerald-800/30">
                                                            {format(new Date(row.clockIn), "HH:mm")}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        {row.clockOut ? (
                                                            <span className="text-[11px] font-bold font-mono px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100/50 dark:border-rose-800/30">
                                                                {format(new Date(row.clockOut), "HH:mm")}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-lg border border-amber-100/50 dark:border-amber-800/30">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                Active
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-5 text-right pr-10">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
                                                            {Number(row.hoursWorked).toFixed(2)}h
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {entries.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-24 text-center">
                                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                                            <SearchX className="w-12 h-12" />
                                                            <p className="text-xs font-bold uppercase tracking-widest">No records found</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>

                    {/* PAGINATION */}
                    {!loading && totalPages > 1 && (
                        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/20 dark:bg-slate-900/20">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Displaying <span className="text-indigo-600 font-bold">Page {currentPage}</span> of {totalPages}
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="h-9 px-4 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold active:scale-95 shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="h-9 px-4 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold active:scale-95 shadow-sm"
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                <div className="flex items-center justify-between pt-8 opacity-40 grayscale border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <History className="w-4 h-4" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rudratic Technologies</p>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version 3.1.2</p>
                </div>
            </div>
        </div>
    )
}
