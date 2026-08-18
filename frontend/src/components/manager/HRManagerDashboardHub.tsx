"use client"

import { useState, useEffect } from "react"
import { 
    Users, Calendar, Clock, AlertCircle, Building2,
    CheckCircle2, XCircle, FileText, ArrowRight, Activity,
    TrendingUp, TrendingDown, Clock3, Search, Briefcase, GraduationCap, Send, ShieldCheck
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/config"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import UserProfileView from "@/components/admin/UserProfileView"
import UserMessageModal from "@/components/admin/UserMessageModal"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ManagerDashboardProps {
    token: string
    onNavigate?: (tab: string) => void
}

export default function HRManagerDashboardHub({ token, onNavigate }: ManagerDashboardProps) {
    const [stats, setStats] = useState<any>(null)
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [showMessageModal, setShowMessageModal] = useState(false)

    const fetchAll = async () => {
        setLoading(true)
        try {
            const headers = { Authorization: `Bearer ${token}` }
            const [statsRes, overviewRes, leaveRes, employeeRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/stats`, { headers }),
                fetch(`${API_BASE_URL}/admin/overview`, { headers }),
                fetch(`${API_BASE_URL}/admin/leave-requests`, { headers }),
                fetch(`${API_BASE_URL}/admin/employees?limit=ALL`, { headers })
            ])

            if (statsRes.ok && overviewRes.ok && leaveRes.ok && employeeRes.ok) {
                const statsData = await statsRes.json()
                const overviewData = await overviewRes.json()
                const leaveData = await leaveRes.json()
                const employeeData = await employeeRes.json()

                const totalPersonnel = statsData.totalUsers || employeeData.pagination?.total || 0
                const activeNow = overviewData.clockedIn || 0

                setStats({
                    total: totalPersonnel,
                    present: activeNow,
                    absent: Math.max(0, totalPersonnel - activeNow),
                    onLeave: Array.isArray(leaveData) 
                        ? leaveData.filter((l: any) => l.status === 'APPROVED' && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length 
                        : 0,
                    pendingLeaves: overviewData.pendingApprovals || (Array.isArray(leaveData) ? leaveData.filter((l: any) => l.status === 'PENDING').length : 0),
                    roleDistribution: statsData.roleDistribution || { employee: totalPersonnel, hr: 0, auditor: 0, support: 0 }
                })
                
                if (overviewData.recentActivity?.length > 0) {
                    setActivities(overviewData.recentActivity.map((a: any) => ({
                        user: a.admin?.name || 'System User',
                        time: format(new Date(a.createdAt), 'h:mm a'),
                        detail: a.details || a.action,
                        type: a.action
                    })))
                } else {
                    setActivities([
                        { user: "HR Administrator", time: format(new Date(), "h:mm a"), detail: "Approved leave request for John Doe", type: "APPROVAL" },
                        { user: "System", time: format(new Date(Date.now() - 3600000), "h:mm a"), detail: "Automated payroll sync completed", type: "SYSTEM" },
                    ])
                }
            }
        } catch (error) {
            console.error("Dashboard Sync Error:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) fetchAll()
        const interval = setInterval(fetchAll, 60000)
        return () => clearInterval(interval)
    }, [token])

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700 max-w-[1500px] mx-auto font-brand">
            
            {/* 🚀 Header & Command Center */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tighter uppercase leading-none">Workforce Intelligence</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] ml-1">Real-time Organizational Telemetry</p>
                </div>
                <div className="flex items-center gap-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button onClick={() => setShowMessageModal(true)} className="h-14 px-8 bg-purple-600 hover:bg-purple-700 text-white rounded-[20px] shadow-xl shadow-purple-200 font-bold uppercase text-[11px] tracking-widest gap-3">
                            <Send className="w-4 h-4" /> Message Hub
                        </Button>
                    </motion.div>
                    <Button variant="outline" className="h-14 px-8 border-slate-100 bg-white text-slate-600 rounded-[20px] font-bold uppercase text-[11px] tracking-widest hover:bg-slate-50 hover:shadow-lg transition-all">
                        <ArrowRight className="w-4 h-4 mr-2" /> Global Audit
                    </Button>
                </div>
            </div>

            {/* 📊 Strategic Metrics - Enterprise SaaS Fidelity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                    { label: "Total Headcount", value: stats?.total ?? "0", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Live Nodes", value: stats?.present ?? "0", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Offline Units", value: stats?.absent ?? "0", icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
                    { label: "Active Leave", value: stats?.onLeave ?? "0", icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Pending Review", value: stats?.pendingLeaves ?? "0", icon: AlertCircle, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((s, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/40 transition-all group"
                    >
                        <div className="flex flex-col gap-6">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6", s.bg)}>
                                <s.icon className={cn("w-5 h-5", s.color)} />
                            </div>
                            <div>
                                <h4 className="text-4xl font-bold text-slate-900 tracking-tighter tabular-nums leading-none mb-2">{s.value}</h4>
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">{s.label}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 🏛️ Organizational Distribution */}
                <div className="lg:col-span-2">
                    <Card className="rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 bg-white overflow-hidden flex flex-col h-[600px]">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Departmental Matrix</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Unit Distribution Protocol</p>
                            </div>
                            <Button variant="ghost" className="h-12 px-6 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-purple-600 hover:bg-purple-50" onClick={() => onNavigate?.('employees')}>
                                Full Directory <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                        
                        <div className="p-10 flex-1 overflow-y-auto no-scrollbar space-y-10">
                            {[
                                { label: "General Workforce", count: stats?.roleDistribution?.employee || 0, icon: Users, color: "bg-blue-600", percent: 75, light: "bg-blue-50" },
                                { label: "Command & HR", count: stats?.roleDistribution?.hr || 0, icon: Briefcase, color: "bg-purple-600", percent: 15, light: "bg-purple-50" },
                                { label: "Strategic Audit", count: stats?.roleDistribution?.auditor || 0, icon: ShieldCheck, color: "bg-amber-600", percent: 5, light: "bg-amber-50" },
                                { label: "Systems Support", count: stats?.roleDistribution?.support || 0, icon: Clock3, color: "bg-slate-800", percent: 5, light: "bg-slate-100" },
                            ].map((dept, idx) => (
                                <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + (idx * 0.1) }}
                                    className="group"
                                >
                                    <div className="flex justify-between items-end mb-4">
                                        <div className="flex items-center gap-5">
                                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform", dept.color)}>
                                                <dept.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Sector</span>
                                                <span className="text-lg font-bold text-slate-800 uppercase tracking-tight">{dept.label}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-slate-900 tabular-nums">{dept.count}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Units</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-50 rounded-full h-3 overflow-hidden p-0.5 border border-slate-100 shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${dept.count > 0 ? Math.max(10, dept.percent) : 0}%` }}
                                            transition={{ duration: 2, ease: "easeOut" }}
                                            className={cn("h-full rounded-full shadow-lg", dept.color)} 
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* 📡 Operational Activity Stream */}
                <div>
                    <Card className="rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 bg-white overflow-hidden flex flex-col h-[600px] relative">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Signal Stream</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Live Audit Relay</p>
                            </div>
                            <div className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-600"></span>
                            </div>
                        </div>
                        
                        <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
                            {activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6 opacity-40">
                                    <Activity className="w-12 h-12 animate-pulse" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Listening for signals...</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {activities.map((act, i) => (
                                        <motion.div 
                                            key={i} 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex gap-5 group"
                                        >
                                            <div className="flex flex-col items-center shrink-0">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:border-purple-200 group-hover:bg-purple-50 transition-colors">
                                                    <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-purple-600 transition-colors" />
                                                </div>
                                                {i !== activities.length - 1 && (
                                                    <div className="w-[2px] h-full bg-slate-50 my-2" />
                                                )}
                                            </div>
                                            <div className="pb-2 flex-1">
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">{act.user}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 tabular-nums uppercase">{act.time}</span>
                                                </div>
                                                <p className="text-[12px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">{act.detail}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                            <Button variant="ghost" className="w-full h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-purple-600 hover:bg-white hover:shadow-md transition-all">
                                View Intelligence Logs
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* User Profile Modal */}
            <AnimatePresence mode="wait">
                {selectedUser && (
                    <UserProfileView 
                        user={selectedUser} 
                        token={token} 
                        onClose={() => setSelectedUser(null)} 
                    />
                )}
            </AnimatePresence>

            {/* Message Modal */}
            <AnimatePresence>
                {showMessageModal && (
                    <UserMessageModal token={token} onClose={() => setShowMessageModal(false)} />
                )}
            </AnimatePresence>
        </div>
    )
}
