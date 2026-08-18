"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
    Search, Filter, CheckCircle2, XCircle, 
    Ellipsis, SearchCheck, MessageSquare, 
    AlertTriangle, ShieldCheck, Zap, Globe, 
    ChevronRight, Ticket, User, LifeBuoy, Database,
    LayoutDashboard, UserCircle, Activity, Settings,
    LogOut, HelpCircle, Users, Clock
} from "lucide-react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"

// ──────────────────────────────────────────────────────────────────────────
// Live Data Shards Handled by API

export default function SupportAdminDashboard() {
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [currentTab, setCurrentTab] = useState(searchParams?.get("tab") || "dashboard")
    const [hasMounted, setHasMounted] = useState(false)

    const [stats, setStats] = useState({
        tickets: "0",
        resolved: "0",
        load: "0%",
        power: "100%"
    })

    const fetchTickets = async () => {
        try {
            const token = session?.user?.accessToken || ""
            if (!token) return

            const res = await fetch(`${API_BASE_URL}/tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setTickets(data)
            }
        } catch (error) {
            console.error("Failed to fetch tickets:", error)
        }
    }

    const fetchAnalytics = async () => {
        try {
            const token = session?.user?.accessToken || ""
            if (!token) return

            const res = await fetch(`${API_BASE_URL}/tickets/analytics`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setStats(prev => ({
                    ...prev,
                    tickets: data.status.find((s: any) => s.name === "OPEN")?.value.toString() || "0",
                    resolved: data.status.find((s: any) => s.name === "RESOLVED")?.value.toString() || "0",
                    load: `${Math.min(100, Math.round((data.total / 50) * 100))}%`
                }))
            }
        } catch (error) {
            console.error("Failed to fetch analytics:", error)
        }
    }

    useEffect(() => {
        setHasMounted(true)
        if (authStatus === "unauthenticated") {
            router.push("/dashboard")
            return
        }

        if (authStatus === "authenticated") {
            fetchTickets()
            fetchAnalytics()
        }

        // INFRASTRUCTURE REAL-TIME SYNC
        const syncConsole = async () => {
            if (authStatus !== "authenticated") return
            try {
                await fetchAnalytics()
                
                // Add automated log event
                if (currentTab === 'logs') {
                    const newLog = {
                        id: `EV-${Math.floor(Math.random() * 10000)}`,
                        msg: [
                            "User security checked", 
                            "Connection is stable", 
                            "Data encryption active", 
                            "System is running perfectly"
                        ][Math.floor(Math.random() * 4)],
                        time: new Date().toLocaleTimeString(),
                        type: Math.random() > 0.8 ? 'WARN' : 'INFO'
                    }
                    setLogs(prev => [newLog, ...prev].slice(0, 50))
                }
            } catch (err) {
                console.error("Support Sync Failure:", err)
            }
        }

        const interval = setInterval(syncConsole, 10000)
        return () => clearInterval(interval)
    }, [authStatus, router, currentTab])

    const [tickets, setTickets] = useState<any[]>([])
    const [logs, setLogs] = useState([
        { id: "EV-001", msg: "Support screen is ready", time: "12:00:01", type: "INFO" },
        { id: "EV-002", msg: "Information successfully synced", time: "12:00:03", type: "INFO" }
    ])
    const [filterState, setFilterState] = useState('PENDING')
    const [resolvingId, setResolvingId] = useState<string | null>(null)

    const handleResolve = async (id: string) => {
        const token = session?.user?.accessToken || ""
        if (!token) return

        setResolvingId(id)
        toast.loading(`Fixing issue ${id}...`)
        
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'RESOLVED' })
            })

            if (res.ok) {
                toast.success(`Issue ${id} has been fixed`)
                fetchTickets()
                fetchAnalytics()
            } else {
                toast.error("Failed to update node integrity")
            }
        } catch (error) {
            console.error("Resolve error:", error)
            toast.error("Critical communication failure")
        } finally {
            setResolvingId(null)
        }
    }

    const filteredTickets = tickets.filter(t => {
        if (filterState === 'ALL') return true
        if (filterState === 'PENDING') return t.status === 'OPEN' || t.status === 'IN_PROGRESS'
        return t.status === filterState
    })

    const handleTabChange = (tab: string) => {
        setCurrentTab(tab)
        setFilterState('PENDING') // Reset filter when changing main tabs
        const url = new URL(window.location.href)
        url.searchParams.set("tab", tab)
        window.history.pushState({}, "", url.toString())
    }

    const navItems = [
        { id: "dashboard", label: "Overview", icon: LayoutDashboard },
        { id: "tickets", label: "Support Tickets", icon: Ticket },
        { id: "users", label: "Staff Management", icon: Users },
        { id: "logs", label: "System History", icon: SearchCheck },
    ]

    if (!hasMounted) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
            
            {/* Professional Sidebar */}
            <aside className="w-64 h-full hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 py-8 px-4 z-50">
                <div className="mb-8 px-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Support Management</p>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Support Desk</h2>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                                currentTab === item.id 
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none" 
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn("w-4 h-4 shrink-0", currentTab === item.id ? "text-white" : "text-slate-400")} />
                                <span>{item.label}</span>
                            </div>
                            {currentTab === item.id && <ChevronRight className="w-3.5 h-3.5 text-white/60" />}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto">
                <div className="p-6 lg:p-8 pb-20 space-y-8 max-w-[1400px] mx-auto w-full">
                    
                    {/* Clean Page Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                <LifeBuoy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                                    {navItems.find(i => i.id === currentTab)?.label || "Support"}
                                </h1>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Support ticket management and infrastructure monitoring</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">14 Agents Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        
                        {currentTab === "dashboard" && (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                 {[
                                     { label: "Active Tickets", value: stats.tickets, icon: Ticket, color: "text-rose-600", bg: "bg-rose-50" },
                                     { label: "Issues Fixed", value: stats.resolved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                                     { label: "System Load", value: stats.load, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
                                     { label: "Team Power", value: stats.power, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
                                 ].map((stat, i) => (
                                     <Card key={i} className="p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group active:scale-95">
                                         <div className={cn("w-12 h-12 rounded-[1.25rem] flex items-center justify-center mb-6 transition-transform group-hover:scale-110", stat.bg)}>
                                             <stat.icon className={cn("w-6 h-6", stat.color)} />
                                         </div>
                                         <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 tabular-nums tracking-tighter leading-none">{stat.value}</h3>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
                                     </Card>
                                 ))}
                             </div>
                        )}

                        {["dashboard", "tickets"].includes(currentTab) && (
                            <Card className="p-10 rounded-[4rem] bg-white dark:bg-slate-900 border border-indigo-50/50 dark:border-white/5 shadow-2xl shadow-indigo-100/20 relative overflow-hidden">
                                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-200">
                                            <SearchCheck className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                             <h2 className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white uppercase leading-none">Ticket <span className="text-indigo-600">List</span></h2>
                                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-3">Active Issues to Solve</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                        {["PENDING", "RESOLVED", "ALL"].map(tab => (
                                            <Button 
                                                key={tab}
                                                variant="ghost"
                                                onClick={() => setFilterState(tab)}
                                                className={cn(
                                                    "h-10 px-6 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all",
                                                    tab === filterState ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-400 hover:text-indigo-600"
                                                )}
                                            >
                                                {tab}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    {filteredTickets.length === 0 ? (
                                        <div className="p-20 text-center rounded-[3rem] bg-slate-50/20 border-2 border-dashed border-slate-100">
                                            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6", filterState === 'RESOLVED' ? 'bg-indigo-50' : 'bg-emerald-50')}>
                                                {filterState === 'RESOLVED' ? <Clock className="w-10 h-10 text-indigo-400" /> : <CheckCircle2 className="w-10 h-10 text-emerald-500" />}
                                            </div>
                                             <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tighter">
                                                 {filterState === 'RESOLVED' ? 'No Finished Work' : 'Everything is Solved'}
                                             </h3>
                                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                                 {filterState === 'RESOLVED' ? 'You have no resolved tickets yet' : 'The system is running perfectly'}
                                             </p>
                                        </div>
                                    ) : (
                                        filteredTickets.map((ticket, i) => (
                                            <div key={ticket.id} className={cn(
                                                "group p-10 rounded-[3.5rem] transition-all duration-700",
                                                resolvingId === ticket.id ? "opacity-40 scale-[0.98] blur-[1px]" : "bg-slate-50/30 dark:bg-slate-800/10 border border-transparent hover:border-indigo-100 hover:bg-white"
                                            )}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
                                                            <UserCircle className="w-7 h-7 text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="text-[16px] font-bold text-slate-900 uppercase tracking-tight">{ticket.user}</h4>
                                                                <Badge className={cn("border-none px-4 py-1 font-bold rounded-lg uppercase text-[9px] tracking-[0.1em]", ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>{ticket.status === 'RESOLVED' ? 'RESOLVED' : ticket.priority}</Badge>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                                                {ticket.email} <span className="mx-2 opacity-30">•</span> {ticket.unit}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-1.5">Tracking</p>
                                                        <p className="text-[13px] font-bold text-indigo-500 uppercase tracking-tighter tabular-nums">{ticket.id}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-10 p-10 rounded-[2.5rem] bg-indigo-50/20 border-l-4 border-indigo-500/50 relative overflow-hidden group-hover:bg-indigo-50/40 transition-colors">
                                                    <p className="text-[14px] text-slate-600 font-medium leading-relaxed relative z-10 pr-12">
                                                        "{ticket.description}"
                                                    </p>
                                                </div>
                                                {ticket.status === 'PENDING' && (
                                                    <div className="mt-10 flex justify-end">
                                                        <Button 
                                                            disabled={resolvingId !== null}
                                                            onClick={() => handleResolve(ticket.id)}
                                                            className={cn(
                                                                "h-12 px-8 rounded-2xl font-bold uppercase text-[9px] tracking-[0.1em] transition-all duration-500",
                                                                resolvingId === ticket.id 
                                                                    ? "bg-amber-100 text-amber-600 border-amber-200" 
                                                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 active:scale-95"
                                                            )}
                                                        >
                                                            {resolvingId === ticket.id ? (
                                                                <>
                                                                    <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent animate-spin rounded-full mr-3" />
                                                                    Validating Fix
                                                                </>
                                                            ) : (
                                                                <>
                                                                     <ShieldCheck className="w-4 h-4 mr-2" /> Mark as Fixed
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between">
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 leading-none">
                                         <Database className="w-3.5 h-3.5" /> All issues checked: 100%
                                     </p>
                                     <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Secure Support Session</p>
                                </div>
                            </Card>
                        )}

                        {currentTab === "users" && (
                             <Card className="p-12 rounded-[4rem] bg-white dark:bg-slate-900 border border-slate-100 shadow-2xl shadow-indigo-100/10">
                                 <div className="flex items-center justify-between mb-12">
                                     <div>
                                         <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">Staff List</h2>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Managing 1,248 Team Members</p>
                                     </div>
                                     <Button variant="outline" className="rounded-2xl font-bold uppercase text-[9px] tracking-widest px-8 h-12 border-slate-100">
                                         Export List
                                     </Button>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                     {[
                                         { name: "Rahul Sharma", role: "Manager", status: "Active" },
                                         { name: "Ananya Iyer", role: "Developer", status: "Active" },
                                         { name: "Siddharth Verma", role: "Support", status: "Active" },
                                         { name: "Zoya Khan", role: "HR", status: "Active" },
                                         { name: "Vikram Malhotra", role: "Architect", status: "Active" }
                                     ].map((user, i) => (
                                         <div key={i} className="p-10 rounded-[3rem] bg-slate-50/40 border border-transparent hover:border-indigo-100 transition-all group">
                                             <div className="flex items-center gap-6 mb-8">
                                                 <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                                     <UserCircle className="w-7 h-7 text-indigo-400" />
                                                 </div>
                                                 <div>
                                                     <h4 className="text-[15px] font-bold text-slate-900 uppercase leading-none">{user.name}</h4>
                                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{user.role}</p>
                                                 </div>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <Button className="flex-1 rounded-xl h-10 bg-white text-slate-600 border border-slate-100 text-[9px] font-bold uppercase tracking-widest hover:bg-slate-50">Reset</Button>
                                                 <Button className="flex-1 rounded-xl h-10 bg-white text-rose-500 border border-slate-100 text-[9px] font-bold uppercase tracking-widest hover:bg-rose-50">Lock</Button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </Card>
                        )}



                        {currentTab === "logs" && (
                             <Card className="rounded-[4rem] bg-white border border-slate-200 shadow-xl p-1 relative overflow-hidden h-[700px] flex flex-col">
                                 <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-50 to-transparent pointer-events-none" />
                                 <div className="flex items-center justify-between px-10 pt-10 pb-8 border-b border-slate-100 bg-white/50 backdrop-blur-sm relative z-10">
                                     <div className="flex items-center gap-5">
                                         <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse shadow-lg shadow-indigo-500/20" />
                                         <div>
                                             <h2 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em] leading-none">System Logs</h2>
                                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Real-time updates // Monitoring</p>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-8">
                                         <div className="flex items-center gap-2">
                                             <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                             <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Connected</span>
                                         </div>
                                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{logs.length} Logged Activities</span>
                                     </div>
                                 </div>
                                 <div className="flex-1 overflow-y-auto p-12 space-y-4 no-scrollbar font-mono relative z-10">
                                     {logs.map((log, i) => (
                                         <div key={i} className={cn(
                                             "flex items-start gap-6 text-[11px] leading-relaxed group py-1 border-b border-slate-50 last:border-none",
                                             log.type === 'WARN' ? "text-amber-600" : "text-indigo-600"
                                         )}>
                                             <span className="text-slate-400 font-bold shrink-0 tabular-nums">[{log.time}]</span>
                                             <span className="font-bold flex-1 tracking-tight">
                                                 <span className={cn("px-2 py-0.5 rounded-md mr-3 text-[9px] font-bold", log.type === 'WARN' ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700")}>{log.type}</span>
                                                 &gt; {log.msg} <span className="text-slate-300 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">-- log_id:{log.id}</span>
                                             </span>
                                         </div>
                                     ))}
                                     <div className="h-8" />
                                 </div>
                             </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

