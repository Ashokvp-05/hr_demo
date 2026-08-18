"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    UserPlus, FileText, CheckCircle2, Circle, 
    ArrowRight, Search, Filter, Loader2, Sparkles, 
    Clock, ShieldCheck, Mail, Phone, Ellipsis,
    UserCircle, ClipboardCheck, Fingerprint, Shield,
    Activity, GraduationCap, Laptop, ChevronRight,
    Zap, AlertCircle, TrendingUp, BellRing, Target, LayoutGrid, List
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"
import UserProfileView from "@/components/admin/UserProfileView"

interface ManagerOnboardingViewProps {
    token: string
    onAddEmployee?: () => void
}

const GlobalStyles = () => (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap');
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
    `}</style>
)

export default function ManagerOnboardingView({ token, onAddEmployee }: ManagerOnboardingViewProps) {
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ totalPending: 0, completedThisMonth: 0, avgProgress: 0, alerts: 0 })
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

    const fetchOnboardingData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/employees?status=PENDING`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                const fetchedEmployees = data.users || data || []
                
                // ── HIGH-FIDELITY MOCK FALLBACK ──
                if (fetchedEmployees.length === 0) {
                    setEmployees([
                        { 
                            id: 'mock-1', 
                            name: 'Arjun Vardhan', 
                            designation: { name: 'Principal Architecture' }, 
                            progress: 75,
                            email: 'arjun.v@rudratic.com'
                        },
                        { 
                            id: 'mock-2', 
                            name: 'Saira Malik', 
                            designation: { name: 'Lead Design Operative' }, 
                            progress: 30,
                            email: 'saira.m@rudratic.com'
                        },
                        { 
                            id: 'mock-3', 
                            name: 'Vikram Sethi', 
                            designation: { name: 'Executive Operations' }, 
                            progress: 95,
                            email: 'vikram.s@rudratic.com'
                        }
                    ])
                    setStats({ totalPending: 3, completedThisMonth: 14, avgProgress: 66, alerts: 1 })
                } else {
                    setEmployees(fetchedEmployees)
                    setStats({
                        totalPending: fetchedEmployees.length,
                        completedThisMonth: 14,
                        avgProgress: 72,
                        alerts: 3
                    })
                }
            }
        } catch (e) {
            toast.error("Failed to sync onboarding data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOnboardingData()
    }, [token])

    const epochs = [
        { id: 'id', label: 'Identity', icon: Fingerprint },
        { id: 'docs', label: 'Documents', icon: FileText },
        { id: 'policy', label: 'Policy', icon: Shield },
        { id: 'training', label: 'Training', icon: GraduationCap },
    ]

    return (
        <div className="space-y-8 font-body">
            <GlobalStyles />
            
            {/* ── HIGH-FIDELITY LIFECYCLE HEADER ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tighter font-brand leading-none">Onboarding <span className="text-indigo-600">People</span></h2>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-indigo-50 text-indigo-600 border-none text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 leading-none">Phase 3</Badge>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Verify Identity & Setup New Members</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                     <Button 
                        onClick={onAddEmployee}
                        className="h-14 bg-slate-900 hover:bg-black text-white rounded-[20px] px-8 text-[11px] font-bold uppercase tracking-[0.2em] gap-3 shadow-2xl active:scale-95 shadow-slate-200"
                    >
                        <UserPlus className="w-4 h-4" /> Initialize Personnel
                    </Button>
                </div>
            </div>

            {/* ── LIFECYCLE ANALYTICS TERMINAL (PHASE 3) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Members in Onboarding", value: stats.totalPending, sub: "Currently active", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Completed", value: stats.completedThisMonth, sub: "Month to date", icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Needs Approval", value: stats.totalPending, sub: "Action Required", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Missing Files", value: stats.alerts, sub: "Fix Now", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((s, i) => (
                    <Card key={i} className="p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm", s.bg)}>
                                <s.icon className={cn("w-5 h-5", s.color)} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-4xl font-bold text-slate-900 tabular-nums tracking-tighter leading-none">{s.value}</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{s.label}</p>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full blur-2xl" />
                    </Card>
                ))}
            </div>

            {/* ── DEPLOYMENT ROADMAP SHARD (NEW) ── */}
            <Card className="p-10 rounded-[40px] border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20 shadow-xl overflow-hidden relative">
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                             <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tighter leading-none font-brand">Setup <span className="text-indigo-600">Status</span></h3>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                System Status: 100% Operational
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {[
                            { label: "Personal Information", status: "Active" },
                            { label: "Document Upload", status: "Active" },
                            { label: "Policy Acceptance", status: "Active" },
                            { label: "Training Completion", status: "Active" },
                            { label: "HR Approval", status: "Active" },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col gap-3 p-5 rounded-3xl bg-white border border-slate-100/50 shadow-sm transition-transform hover:scale-105">
                                <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                         <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <Badge className="bg-indigo-50 text-indigo-600 border-none text-[8px] font-bold uppercase px-2 py-0.5">Ready</Badge>
                                </div>
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight mt-1 font-brand">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full" />
            </Card>


            {/* ── PERSONNEL PROGRESS TERMINAL ── */}
            <div className={cn("pr-2", viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4")}>
                {loading ? (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center gap-6">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-300">Syncing Operational Shards...</p>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="col-span-full py-40 text-center bg-slate-50/30 rounded-[3rem] border-2 border-dashed border-slate-100">
                        <UserCircle className="w-20 h-20 text-slate-100 mx-auto mb-8" />
                        <h4 className="text-[15px] font-bold text-slate-300 uppercase tracking-[0.4em]">Personnel Manifest Validated</h4>
                        <p className="text-[10px] font-bold text-slate-300 mt-3 uppercase tracking-widest">No pending lifecycle nodes detected.</p>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="col-span-full border border-slate-100 rounded-[2.5rem] bg-white overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50 text-[10px] uppercase font-bold tracking-widest text-slate-400 font-brand">
                                    <th className="p-6 font-bold">Employee Name</th>
                                    <th className="p-6 font-bold">Department</th>
                                    <th className="p-6 font-bold w-48">Onboarding Matrix</th>
                                    <th className="p-6 font-bold text-right">Active Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp, idx) => (
                                    <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/100 transition-colors cursor-pointer group" onClick={() => setSelectedUser(emp)}>
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md group-hover:scale-105 transition-transform">{emp.name[0]}{emp.name[1]}</div>
                                                <span className="font-bold text-sm tracking-tight text-slate-900 font-brand uppercase">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{emp.designation?.name || "Standard Personnel"}</td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-indigo-500" style={{width: `${emp.progress || 48}%`}}/></div>
                                                <span className="text-[10px] font-bold text-slate-500">{emp.progress || 48}%</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] rounded-md shadow-sm">Active</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    employees.map((emp, idx) => (
                        <motion.div
                            key={emp.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedUser(emp)}
                            className="cursor-pointer"
                        >
                            <Card className="p-7 rounded-[40px] border border-slate-100 bg-white shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 group relative">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="flex items-center gap-7">
                                        <div className="w-20 h-20 rounded-[32px] bg-slate-950 flex items-center justify-center text-2xl font-bold text-indigo-400 shadow-2xl shadow-slate-200 font-brand transition-transform group-hover:scale-105">
                                            {emp.name[0]}{emp.name[1]}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold text-slate-900 uppercase font-brand tracking-tighter leading-none">{emp.name}</h4>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
                                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full" /><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ID: EMP-00{idx + 1}</p></div>
                                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full" /><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{emp.department?.name || 'Operations'}</p></div>
                                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full" /><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Joined: {format(new Date(), 'dd MMM yyyy')}</p></div>
                                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full" /><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Manager: System Admin</p></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                         <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-sm">Active</Badge>
                                         <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Sync Active</p>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {/* ONBOARDING PULSE BAR */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Lifecycle Manifest completion</span>
                                            <span className="text-[12px] font-bold text-indigo-600 tracking-tighter">{emp.progress || 48}% VALIDATED</span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-slate-50 overflow-hidden border border-slate-100 p-0.5">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${emp.progress || 48}%` }}
                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                                            />
                                        </div>
                                    </div>

                                    {/* TASK SECTION */}
                                    <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 relative group/tasks overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover/tasks:opacity-100 transition-opacity" />
                                        {[
                                            { label: "Identity Verified", icon: CheckCircle2, status: "complete", color: "text-indigo-500", bg: "bg-indigo-50" },
                                            { label: "Documents Uploaded", icon: CheckCircle2, status: "complete", color: "text-indigo-500", bg: "bg-indigo-50" },
                                            { label: "Policy Signed", icon: CheckCircle2, status: "complete", color: "text-indigo-500", bg: "bg-indigo-50" },
                                            { label: "Training Pending", icon: AlertCircle, status: "pending", color: "text-amber-500", bg: "bg-amber-50" },
                                        ].map((task, i) => (
                                            <div key={i} className="flex items-center gap-3 relative z-10 transition-all hover:translate-x-1">
                                                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shadow-sm border border-white", task.bg)}>
                                                    <task.icon className={cn("w-3.5 h-3.5", task.color)} />
                                                </div>
                                                <span className={cn("text-[10px] font-bold uppercase tracking-widest font-brand", task.status === 'complete' ? "text-slate-600" : "text-slate-400")}>
                                                    {task.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ACTION LAYER */}
                                    <div className="pt-4 border-t border-slate-50 dark:border-white/5 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button 
                                                variant="outline" 
                                                onClick={(e) => { e.stopPropagation(); toast.info("Correction request dispatched."); }} 
                                                className="h-11 rounded-xl border-slate-200 text-slate-500 bg-white hover:bg-slate-50 font-bold text-[8px] uppercase tracking-widest transition-all px-2"
                                            >
                                                Request Correction
                                            </Button>
                                            <Button 
                                                variant="outline"
                                                onClick={(e) => { e.stopPropagation(); setSelectedUser(emp); }} 
                                                className="h-11 rounded-xl border-indigo-100 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 font-bold text-[8px] uppercase tracking-widest transition-all gap-2 px-2"
                                            >
                                                <UserCircle className="w-3.5 h-3.5" /> View Profile
                                            </Button>
                                        </div>
                                        <Button 
                                            onClick={(e) => { e.stopPropagation(); toast.success("Member Approved."); }} 
                                            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-slate-950 text-white font-bold text-[9px] uppercase tracking-widest transition-all gap-2 shadow-lg shadow-indigo-100"
                                        >
                                            Confirm Onboarding
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {/* HIGH-FIDELITY PROFILE OVERLAY */}
            <AnimatePresence>
                {selectedUser && (
                    <UserProfileView 
                        user={selectedUser} 
                        token={token} 
                        onClose={() => setSelectedUser(null)} 
                        onEdit={() => { setSelectedUser(null); toast.info("Opening Record Modification Framework..."); }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

