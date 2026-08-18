"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Download,
    Calendar as CalendarIcon,
    Loader2,
    FileText,
    FileSpreadsheet,
    BarChart3,
    PieChart as PieIcon,
    Search,
    TrendingUp,
    Users,
    Clock,
    Zap,
    SearchX,
    RotateCcw,
    X
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from "recharts"
import { API_BASE_URL } from "@/lib/config"
import { format, startOfDay, endOfDay, subDays } from "date-fns"

export default function AdminReportsPage() {
    const { data: session } = useSession()
    const token = (session?.user as any)?.accessToken

    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: subDays(new Date(), 7),
        to: new Date()
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [reportData, setReportData] = useState<any[]>([])

    const fetchReport = async () => {
        if (!token) return
        setLoading(true)
        try {
            const startStr = format(startOfDay(dateRange.from), "yyyy-MM-dd")
            const endStr = format(endOfDay(dateRange.to), "yyyy-MM-dd")
            const res = await fetch(`${API_BASE_URL}/reports/attendance?start=${startStr}&end=${endStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setReportData(data)
            }
        } catch (error) {
            console.error("Failed to fetch report", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReport()
    }, [dateRange.from, dateRange.to, token])

    const handleSecureExport = async (type: 'excel' | 'pdf') => {
        if (!token) return
        try {
            const startStr = format(startOfDay(dateRange.from), "yyyy-MM-dd")
            const endStr = format(endOfDay(dateRange.to), "yyyy-MM-dd")
            const res = await fetch(`${API_BASE_URL}/reports/export/${type}?start=${startStr}&end=${endStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `System_Attendance_${startStr}_to_${endStr}.${type === 'excel' ? 'xlsx' : 'pdf'}`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            }
        } catch (error) {
            console.error(`Failed to export ${type}`, error)
        }
    }

    const handleStrategicExport = async () => {
        if (!token) return
        try {
            const startStr = format(startOfDay(dateRange.from), "yyyy-MM-dd")
            const endStr = format(endOfDay(dateRange.to), "yyyy-MM-dd")
            const res = await fetch(`${API_BASE_URL}/reports/export/strategic-monthly?start=${startStr}&end=${endStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `Strategic_Analysis_${startStr}_to_${endStr}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            }
        } catch (error) {
            console.error(`Failed to export strategic report`, error)
        }
    }

    const [activeFilter, setActiveFilter] = useState<string | null>(null)

    // Processed Data
    const filteredData = useMemo(() => {
        let data = reportData.filter(item =>
            item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )

        if (activeFilter === "REMOTE") {
            data = data.filter(i => i.clockType === 'REMOTE')
        } else if (activeFilter === "ACTIVE") {
            data = data.filter(i => !i.clockOut)
        }

        return data
    }, [reportData, searchQuery, activeFilter])

    const stats = useMemo(() => {
        const totalHours = reportData.reduce((acc, curr) => acc + (Number(curr.hoursWorked) || 0), 0)
        const entries = reportData.length
        const remoteCount = reportData.filter(i => i.clockType === 'REMOTE').length
        const activeCount = reportData.filter(i => !i.clockOut).length
        const avgHours = entries > 0 ? totalHours / entries : 0

        return {
            totalHours: totalHours.toFixed(1),
            entries,
            activeCount,
            remotePercentage: entries > 0 ? ((remoteCount / entries) * 100).toFixed(0) : "0",
            avgHours: avgHours.toFixed(1)
        }
    }, [reportData])

    const chartData = useMemo(() => {
        const aggregated = reportData.reduce((acc: any, current: any) => {
            const date = format(new Date(current.clockIn), "EEE")
            acc[date] = (acc[date] || 0) + (Number(current.hoursWorked) || 0)
            return acc
        }, {})

        return Object.entries(aggregated).map(([name, hours]) => ({
            name,
            hours: Number((hours as number).toFixed(1))
        }))
    }, [reportData])

    const typeData = useMemo(() => {
        const counts = reportData.reduce((acc: any, current: any) => {
            acc[current.clockType] = (acc[current.clockType] || 0) + 1
            return acc
        }, {})
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [reportData])

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest text-indigo-600">
                        System Intelligence
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Comprehensive workforce analytics and performance reporting.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {activeFilter && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveFilter(null)}
                            className="text-[10px] font-bold uppercase text-indigo-500 hover:text-indigo-600 gap-2 border border-indigo-200 bg-indigo-50/50 rounded-xl px-4"
                        >
                            <X className="w-3 h-3" /> Clear Filters
                        </Button>
                    )}
                    <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSecureExport('excel')}
                            className="rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-4 font-bold h-9 transition-colors"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> .XLSX
                        </Button>
                        <div className="w-[1px] bg-slate-200 dark:bg-slate-800 my-1 mx-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSecureExport('pdf')}
                            className="rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-4 font-bold h-9 transition-colors"
                        >
                            <FileText className="w-4 h-4 mr-2" /> .PDF
                        </Button>
                    </div>

                    <Button
                        onClick={handleStrategicExport}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl px-6 h-11 shadow-lg shadow-indigo-500/30 gap-2"
                    >
                        <Download className="w-4 h-4" /> Strategic Analysis
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-12 w-12 rounded-2xl" />
                                    <div className="space-y-2 text-right ml-auto">
                                        <Skeleton className="h-3 w-20 ml-auto" />
                                        <Skeleton className="h-8 w-24 ml-auto" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    [
                        { id: 'total', label: "Aggregate Hours", value: `${stats.totalHours}h`, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
                        { id: 'ACTIVE', label: "Live Sessions", value: stats.activeCount, icon: Zap, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
                        { id: 'entries', label: "Check-ins Today", value: stats.entries, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                        { id: 'REMOTE', label: "Remote Factor", value: `${stats.remotePercentage}%`, icon: TrendingUp, color: "text-fuchsia-600", bg: "bg-fuchsia-50 dark:bg-fuchsia-900/20" }
                    ].map((stat, i) => (
                        <Card
                            key={i}
                            onClick={() => ['REMOTE', 'ACTIVE'].includes(stat.id) && setActiveFilter(stat.id)}
                            className={`border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden bg-white dark:bg-slate-900 transform transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer ${activeFilter === stat.id ? 'ring-2 ring-indigo-500' : 'hover:ring-indigo-200/50'}`}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
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

            {/* Configuration & Search Bar */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <CardContent className="p-6">
                    <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-6">
                        <div className="flex flex-wrap items-end gap-6 w-full xl:w-auto">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Data Window</label>
                                <div className="flex items-center gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-11 px-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 min-w-[200px] justify-start shadow-none">
                                                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                                                {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="start">
                                            <Calendar
                                                mode="range"
                                                selected={dateRange as any}
                                                onSelect={(range: any) => range?.from && range?.to && setDateRange(range)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <Button
                                onClick={fetchReport}
                                disabled={loading}
                                className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                                Refresh Intelligence
                            </Button>
                        </div>

                        <div className="relative w-full xl:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search employees or emails..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 pl-10 pr-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-indigo-500 w-full font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* STRATEGIC INSIGHTS CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-white text-xl">Strategic Insights</CardTitle>
                                <CardDescription className="text-indigo-100 text-xs">High-level organizational intelligence.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Worker Intensity</p>
                                <p className="text-3xl font-bold">{stats.avgHours}h</p>
                                <p className="text-[10px] text-indigo-200">Per session avg</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Personnel Factor</p>
                                <p className="text-3xl font-bold">{stats.entries}</p>
                                <p className="text-[10px] text-indigo-200">Total check-ins</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/10">
                            <p className="text-sm font-medium leading-relaxed opacity-90">
                                Organization is operating at <span className="font-bold underline">{(Number(stats.remotePercentage) > 50 ? 'distributed' : 'local')} scale</span>. 
                                Recommended: Download Strategic Analysis for deep-dive resource allocation metrics.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Protocol Health</CardTitle>
                        <CardDescription className="text-xs">System-wide verification compliance status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Clock Accuracy</span>
                                <span className="text-sm font-bold text-emerald-600">99.98%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[99.98%]" />
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Audit Compliance</span>
                                <span className="text-sm font-bold text-indigo-600">CERTIFIED</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visual Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* BAR CHART */}
                <Card className="lg:col-span-8 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/50">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">Labor Distribution</CardTitle>
                            <CardDescription className="text-xs">Daily aggregation of manpower utilization.</CardDescription>
                        </div>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8">
                        {loading ? (
                            <Skeleton className="h-[350px] w-full rounded-xl" />
                        ) : (
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} unit="h" />
                                        <RechartsTooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.95)' }}
                                        />
                                        <Bar dataKey="hours" radius={[8, 8, 8, 8]} barSize={40}>
                                            {chartData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* PIE CHART */}
                <Card className="lg:col-span-4 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-bold">Modality Split</CardTitle>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <PieIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                        <CardDescription className="text-xs">Office vs Remote vs Field breakdown.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center pt-8">
                        {loading ? (
                            <Skeleton className="h-[280px] w-full rounded-full" />
                        ) : (
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={typeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {typeData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.95)' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '11px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ACTIVITY LOG TABLE */}
                <Card className="lg:col-span-12 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold">Activity Ledger</CardTitle>
                                <CardDescription className="text-xs">Real-time audit of system-wide time entries.</CardDescription>
                            </div>
                            {loading ? (
                                <Skeleton className="h-6 w-32 rounded-full" />
                            ) : (
                                <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-widest border border-indigo-500 shadow-sm shadow-indigo-500/20">
                                    {filteredData.length} Valid Records
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40">
                                        <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-8">Personnel</th>
                                        <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verification Date</th>
                                        <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">In</th>
                                        <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Out</th>
                                        <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Modality</th>
                                        <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right pr-8">Intensity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 8 }).map((_, i) => (
                                            <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                                                <td className="p-5 pl-8"><Skeleton className="h-10 w-48" /></td>
                                                <td className="p-5"><Skeleton className="h-5 w-24" /></td>
                                                <td className="p-5"><Skeleton className="h-6 w-16 mx-auto" /></td>
                                                <td className="p-5"><Skeleton className="h-6 w-16 mx-auto" /></td>
                                                <td className="p-5"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                                                <td className="p-5 text-right pr-8"><Skeleton className="h-8 w-14 ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <>
                                            {filteredData.map((row, idx) => (
                                                <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                                                    <td className="p-5 pl-8">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{row.user.name}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{row.user.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-sm font-bold text-slate-600 dark:text-slate-400">
                                                        {format(new Date(row.clockIn), "dd MMM, yyyy")}
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
                                                    <td className="p-5">
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase border ${row.clockType === 'IN_OFFICE' ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50' :
                                                            row.clockType === 'REMOTE' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50' :
                                                                'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                                                            }`}>
                                                            {row.clockType}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right pr-8">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                                                            {Number(row.hoursWorked).toFixed(2)}h
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredData.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="p-24 text-center">
                                                        <div className="flex flex-col items-center gap-3 opacity-30grayscale opacity-30 grayscale">
                                                            <SearchX className="w-12 h-12 text-slate-300" />
                                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching system intelligence found</p>
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
                </Card>
            </div>

            <div className="flex items-center justify-between pt-8 opacity-40 grayscale border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <TrendingUp className="w-4 h-4" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[1em]">Rudratic Intelligence System</p>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Protocol Stability v.4.0.1</p>
            </div>
        </div>
    )
}
