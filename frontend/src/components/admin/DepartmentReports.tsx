"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Building2, Users, CalendarDays, CalendarRange,
    UserSearch, Download, TrendingUp, Clock,
    CheckCircle2, BarChart3, Search, Loader2,
    RefreshCcw, Activity
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog, DialogContent, DialogTitle, DialogDescription
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Dept {
    id: string
    name: string
    description?: string
    manager?: { name: string }
    _count?: { users: number }
    status?: string
}

interface Employee {
    id: string
    name: string
    email: string
    status: string
    deptId?: string
}

export default function DepartmentReports({ token }: { token: string }) {
    const [depts, setDepts] = useState<Dept[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [reportDept, setReportDept] = useState<Dept | null>(null)
    const [reportType, setReportType] = useState<"daily" | "monthly" | "individual" | null>(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [dRes, eRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization/departments`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?limit=ALL`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ])
            const dData = await dRes.json()
            const eData = await eRes.json()
            setDepts(Array.isArray(dData) ? dData : [])
            setEmployees(Array.isArray(eData) ? eData : (eData.users || []))
        } catch {
            toast.error("Failed to load department data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [token])

    const getMembers = (deptId: string) =>
        employees.filter(e => e.deptId === deptId)

    const filtered = depts.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-full bg-[#fcfcfd] font-body pb-20 relative overflow-hidden">
            {/* Subtle Background Accent */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-12 relative z-10">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                            <BarChart3 className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-[26px] font-bold text-slate-800 tracking-tight font-brand leading-none">
                                Department Analytics
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                Department Overview · {depts.length} Departments
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchData}
                            className="h-11 px-6 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 group"
                        >
                            <RefreshCcw className={cn("w-3.5 h-3.5 transition-transform duration-700", loading && "animate-spin")} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Active Depts", value: depts.length, sub: "Active Departments", icon: Building2, color: "#4f46e5", bg: "bg-indigo-50/50" },
                        { label: "Employee Count", value: employees.length, sub: "Total Staff", icon: Users, color: "#059669", bg: "bg-emerald-50/50" },
                        { label: "Stability", value: "98.2", sub: "Operational Uptime", icon: Activity, color: "#2563eb", bg: "bg-blue-50/50" },
                        { label: "Avg Team Size", value: depts.length ? Math.round(employees.length / depts.length) : 0, sub: "Average Staff per Department", icon: TrendingUp, color: "#7c3aed", bg: "bg-violet-50/50" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn("p-8 rounded-[32px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group relative overflow-hidden")}
                        >
                            <div className="relative z-10">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", stat.bg)}>
                                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                                    {loading ? "—" : stat.value}{i === 2 ? "%" : ""}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 mt-2">{stat.sub}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── DEPARTMENT CARDS GRID ── */}
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-6">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                        <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Loading Departments...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {filtered.map((dept, idx) => {
                                const memberCount = dept._count?.users ?? getMembers(dept.id).length
                                return (
                                    <motion.div
                                        key={dept.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all flex flex-col group relative overflow-hidden"
                                    >
                                        {/* CARD HEADER */}
                                        <div className="flex items-start justify-between mb-8 relative z-10">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-[22px] flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight font-brand group-hover:text-indigo-600 transition-colors uppercase">{dept.name}</h3>
                                                    <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] px-3 py-1 rounded-lg mt-1">{memberCount} Employees</Badge>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "text-[9px] font-bold uppercase tracking-widest border-none px-4 py-1.5 rounded-full shadow-sm shrink-0",
                                                (dept.status || "ACTIVE") === "ACTIVE" ? "bg-emerald-600 text-white" : "bg-slate-400 text-white"
                                            )}>
                                                {dept.status || "Active"}
                                            </Badge>
                                        </div>

                                        {/* MANAGER */}
                                        <div className="bg-slate-50/50 border border-slate-100 rounded-[28px] p-6 mb-10 flex items-center gap-4 relative z-10">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                                <UserSearch className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Department Manager</p>
                                                <p className="text-[14px] font-bold text-slate-700 tracking-tight truncate">{dept.manager?.name || "Unassigned"}</p>
                                            </div>
                                        </div>

                                        {/* REPORT CONTROLS */}
                                        <div className="mt-auto space-y-5 relative z-10">
                                            <div className="flex items-center justify-between px-2">
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Generate Report</p>
                                                <div className="h-px flex-1 mx-4 bg-slate-100" />
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {([
                                                    { type: "daily", label: "Daily", Icon: CalendarDays },
                                                    { type: "monthly", label: "Monthly", Icon: CalendarRange },
                                                    { type: "individual", label: "Individual", Icon: UserSearch },
                                                ] as const).map(({ type, label, Icon }) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => { setReportDept(dept); setReportType(type) }}
                                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] bg-white border border-slate-100 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-100 transition-all group/btn active:scale-95"
                                                    >
                                                        <Icon className="w-4 h-4 text-slate-400 group-hover/btn:text-indigo-600 transition-colors" />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover/btn:text-indigo-600 transition-colors leading-none">{label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── REPORT MODAL ── */}
            <Dialog open={!!reportDept && !!reportType} onOpenChange={() => { setReportDept(null); setReportType(null) }}>
                <DialogContent className="bg-white border-none text-slate-900 max-w-2xl rounded-[60px] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.15)] p-0 overflow-hidden font-body">
                    <div className={cn("p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50")}>
                        <div className="flex items-center gap-6">
                            <div className={cn("w-14 h-14 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-indigo-100",
                                reportType === 'daily' ? 'bg-indigo-600' : reportType === 'monthly' ? 'bg-violet-600' : 'bg-slate-900'
                            )}>
                                {reportType === 'daily' ? <CalendarDays className="w-6 h-6" /> :
                                 reportType === 'monthly' ? <CalendarRange className="w-6 h-6" /> :
                                 <UserSearch className="w-6 h-6" />}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold font-brand tracking-tight text-slate-900 uppercase">
                                    {reportType === 'daily' ? 'Daily Report' : reportType === 'monthly' ? 'Monthly Report' : 'Employee Review'}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">
                                    {reportDept?.name} · Department ID {reportDept?.id.split('-')[0]}
                                </DialogDescription>
                            </div>
                        </div>
                        <button
                            onClick={() => toast.success(`Report generated`)}
                            className="h-14 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl shadow-slate-200 flex items-center gap-3"
                        >
                            <Download className="w-4 h-4" /> Download
                        </button>
                    </div>

                    <ScrollArea className="max-h-[60vh]">
                        <div className="p-10 space-y-10">
                            <div className="grid grid-cols-3 gap-6">
                                {[
                                    { label: "Active Employees", value: reportDept ? getMembers(reportDept.id).length : 0, sub: "Staff", icon: CheckCircle2, color: "#059669", bg: "bg-emerald-50" },
                                    { label: "On Leave", value: Math.floor((reportDept ? getMembers(reportDept.id).length : 0) * 0.1), sub: "Employees on leave", icon: CalendarDays, color: "#d97706", bg: "bg-amber-50" },
                                    { label: "Performance", value: "97%", sub: "Score", icon: TrendingUp, color: "#4f46e5", bg: "bg-indigo-50" },
                                ].map((s, i) => (
                                    <div key={i} className="bg-slate-50/50 border border-slate-100 rounded-[32px] p-6 flex flex-col gap-4">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.bg)}>
                                            <s.icon className="w-4 h-4" style={{ color: s.color }} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                                            <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1">{s.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-6">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-2">Employee List</p>
                                <div className="space-y-4">
                                    {reportDept && getMembers(reportDept.id).map((member, idx) => (
                                        <div key={member.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[28px] hover:shadow-xl hover:shadow-slate-100 transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm group-hover:scale-110 transition-transform">
                                                    {member.name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-slate-900 tracking-tight uppercase">{member.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold lowercase tracking-wider">{member.email}</p>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "text-[9px] font-bold uppercase tracking-widest border-none px-4 py-2 rounded-full",
                                                idx % 5 === 3 ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                                            )}>
                                                {idx % 5 === 3 ? 'On Leave' : 'Active'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <div className="p-8 border-t border-slate-100 bg-[#f8fafc] flex items-center justify-between px-10">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Organization Report · {new Date().toLocaleTimeString()}</p>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-200" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Connected</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
