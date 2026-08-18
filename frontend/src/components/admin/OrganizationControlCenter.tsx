"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Building2, Users, Briefcase,
    Plus, Search, Edit3, Trash2, ChevronRight,
    Loader2, AlertCircle, CheckCircle2, MoreVertical, ShieldCheck, Zap,
    Edit2, Globe, Command, Layers, Terminal, Network, Activity,
    ShieldAlert, Cpu, Workflow, X, LayoutDashboard, Database,
    BarChart3, CalendarDays, CalendarRange, UserSearch, Download, TrendingUp, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface OrgUnit {
    id: string
    name: string
    description?: string
    manager?: { id: string, name: string }
    _count?: { users: number }
    status?: "ACTIVE" | "INACTIVE"
    parentId?: string
    parent?: { id: string, name: string }
}

interface User {
    id: string
    name: string
    email: string
    status: string
    deptId?: string
    designationId?: string
    branchId?: string
    roleId?: string
}

const GlobalStyles = () => (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        
        :root {
            --brand-indigo: #4F46E5;
            --brand-indigo-soft: #EEF2FF;
            --surface-primary: #FFFFFF;
            --surface-secondary: #FAFAFB;
            --text-primary: #111827;
            --text-secondary: #6B7280;
        }

        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }

        .enterprise-card {
            background: #ffffff;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #F1F5F9;
            border-radius: 28px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
            position: relative;
            overflow: hidden;
        }
        
        .enterprise-card:hover {
            transform: translateY(-4px);
            border-color: #E2E8F0;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.04);
        }

        .glass-pill {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(0, 0, 0, 0.03);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F1F5F9; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #E2E8F0; }
    `}</style>
)

export default function OrganizationControlCenter({ token }: { token: string }) {
    const [activeTab, setActiveTab] = useState("departments")
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<OrgUnit[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [search, setSearch] = useState("")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [viewTeam, setViewTeam] = useState<OrgUnit | null>(null)
    const [reportDept, setReportDept] = useState<OrgUnit | null>(null)
    const [reportType, setReportType] = useState<"daily" | "monthly" | "individual" | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    const [newUnit, setNewUnit] = useState({ 
        name: "", 
        description: "", 
        managerId: "", 
        parentId: "", 
        status: "ACTIVE" 
    })

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true)
        setIsSyncing(true)
        try {
            const apiEndpoint = activeTab === "departments" ? "departments" : activeTab === "designations" ? "designations" : activeTab === "branches" ? "branches" : "roles"
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization/${apiEndpoint}`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            const result = await res.json()
            if (res.ok) setData(result)

            if (!isSilent) {
                const uRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?limit=ALL`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                const uData = await uRes.json()
                if (uRes.ok) setUsers(Array.isArray(uData) ? uData : (uData.users || []))
            }
        } catch (err) {
            if (!isSilent) toast.error("Network error occurred")
        } finally {
            setLoading(false)
            setTimeout(() => setIsSyncing(false), 2000)
        }
    }, [activeTab, token])

    useEffect(() => {
        fetchData()
        pollRef.current = setInterval(() => fetchData(true), 30000)
        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [fetchData])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newUnit.name.trim()) return toast.error("Unit title is required")
        
        try {
            const apiEndpoint = activeTab === "departments" ? "departments" : activeTab === "designations" ? "designations" : activeTab === "branches" ? "branches" : "roles"
            const body = { ...newUnit, managerId: newUnit.managerId || undefined, parentId: newUnit.parentId || undefined }
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization/${apiEndpoint}`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(body)
            })
            if (res.ok) {
                toast.success(`${activeTab.slice(0, -1)} added successfully!`)
                setIsAddOpen(false)
                setNewUnit({ name: "", description: "", managerId: "", parentId: "", status: "ACTIVE" })
                fetchData()
            } else {
                const result = await res.json()
                toast.error(result.error || "Action failed")
            }
        } catch (err) { toast.error("Network error occurred") }
    }

    const filteredData = Array.isArray(data) ? data.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    ) : []

    const stats = {
        total: data.length,
        active: data.filter(i => (i.status || "ACTIVE") === "ACTIVE").length,
        inactive: data.filter(i => i.status === "INACTIVE").length,
        employees: data.reduce((acc, curr) => acc + (curr._count?.users || 0), 0)
    }

    const labelCls = "text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2"
    const inputCls = "h-12 bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 rounded-2xl text-sm focus:bg-white focus:border-indigo-500 font-semibold transition-all"
    const selectCls = "w-full h-12 bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl text-sm px-4 focus:ring-2 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer font-bold transition-all"

    const getTeamMembers = (unitId: string) => {
        return users.filter(u => {
            if (activeTab === 'departments') return u.deptId === unitId
            if (activeTab === 'designations') return u.designationId === unitId
            if (activeTab === 'branches') return u.branchId === unitId
            if (activeTab === 'roles') return u.roleId === unitId
            return false
        })
    }

    return (
        <div className="min-h-full bg-[#fcfcfd] font-body pb-20 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />

            <div className="max-w-[1400px] mx-auto space-y-12 relative z-10">
                {/* 📊 ORGANIZATION STATISTICS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { label: `Total ${activeTab === 'departments' ? 'Teams' : 'Job Titles'}`, value: stats.total, icon: Command, color: "text-indigo-600", bg: "bg-indigo-50", trend: "Total" },
                        { label: "Active Teams", value: stats.active, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Active" },
                        { label: "Inactive", value: stats.inactive, icon: Layers, color: "text-slate-400", bg: "bg-slate-50", trend: "Inactive" },
                        { label: "People Count", value: stats.employees, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", trend: "Total People" },
                    ].map((s, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-8 rounded-[40px] border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-center gap-6 mb-6 relative z-10">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6 shadow-sm", s.bg)}>
                                    <s.icon className={cn("w-6 h-6", s.color)} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-slate-800 tracking-tight font-brand leading-none">{s.value}</h4>
                                    <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest mt-2">{s.label}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-bold px-2 py-0.5 rounded-full">{s.trend}</Badge>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all space-y-12">
                    {/* NAVIGATION & GLOBAL ACTIONS */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 transition-all hover:scale-110">
                                <Building2 className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-brand leading-none">Company Structure</h2>
                                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-widest mt-2">Manage Teams and Job Titles</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto">
                            <div className="relative group w-full md:w-80">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                <Input 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search teams..."
                                    className="h-14 pl-12 bg-slate-50 border-none rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-indigo-600/10 transition-all outline-none"
                                />
                            </div>

                            <Tabs value={activeTab} className="bg-slate-50 p-1.5 rounded-[20px] border border-slate-100" onValueChange={setActiveTab}>
                                <TabsList className="bg-transparent h-auto p-0 gap-1">
                                    {[
                                        { id: "departments", label: "Teams" },
                                        { id: "designations", label: "Job Titles" }
                                    ].map((tab) => (
                                        <TabsTrigger
                                            key={tab.id}
                                            value={tab.id}
                                            className="px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                                        >
                                            {tab.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>

                            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                <DialogTrigger asChild>
                                    <Button className="h-14 px-10 bg-slate-900 hover:bg-black text-white rounded-[20px] shadow-xl shadow-slate-200 font-bold uppercase text-[10px] tracking-widest gap-3 transition-all hover:scale-[1.02] active:scale-95">
                                        <Plus className="w-4 h-4" />
                                        Add New
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white border-none text-slate-900 max-w-2xl rounded-[40px] shadow-2xl p-0 overflow-hidden">
                                    <form onSubmit={handleAdd}>
                                        <div className="p-10 border-b border-slate-50 bg-slate-50/50">
                                            <DialogTitle className="text-2xl font-bold font-brand tracking-tight">Add New {activeTab === 'designations' ? 'Job Title' : 'Team'}</DialogTitle>
                                            <DialogDescription className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mt-2">Create a new team or job title.</DialogDescription>
                                        </div>
                                        <div className="p-12 space-y-10">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-3 col-span-2 md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name</label>
                                                    <Input className="bg-slate-50 border-none h-14 rounded-2xl text-lg font-bold text-slate-900 px-6 focus:ring-4 focus:ring-indigo-600/10 transition-all outline-none" placeholder="e.g. Creative Ops" value={newUnit.name} onChange={e => setNewUnit({ ...newUnit, name: e.target.value })} required />
                                                </div>
                                                <div className="space-y-3 col-span-2 md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lead</label>
                                                    <select className="w-full h-14 bg-slate-50 border-none text-slate-900 rounded-2xl text-sm px-6 focus:ring-4 focus:ring-indigo-600/10 outline-none font-bold transition-all cursor-pointer" value={newUnit.managerId} onChange={e => setNewUnit({ ...newUnit, managerId: e.target.value })}>
                                                        <option value="">Select Team Lead</option>
                                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                                <textarea className="w-full bg-slate-50 border-none min-h-[140px] rounded-[32px] text-sm font-bold text-slate-900 p-8 focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all resize-none" 
                                                    placeholder="Define the purpose of this unit..." value={newUnit.description} onChange={e => setNewUnit({ ...newUnit, description: e.target.value })} />
                                            </div>
                                            <Button type="submit" className="h-16 w-full bg-slate-900 text-white hover:bg-black font-bold text-[12px] tracking-widest uppercase rounded-[24px] shadow-2xl transition-all active:scale-95">Save</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* MAIN STRUCTURAL CONTENT */}
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {loading ? (
                                <div className="col-span-full h-96 flex flex-col items-center justify-center gap-8">
                                    <Loader2 className="w-14 h-14 animate-spin text-indigo-600" />
                                    <p className="text-[12px] font-bold uppercase tracking-widest text-slate-300 animate-pulse">Loading Teams...</p>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <div className="col-span-full h-[540px] border-2 border-dashed border-slate-100 rounded-[56px] flex flex-col items-center justify-center bg-slate-50/20 group hover:bg-white transition-all duration-700">
                                    <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center border border-slate-100 mb-8 shadow-sm group-hover:rotate-12 transition-all">
                                        <Network className="w-12 h-12 text-slate-200" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-brand">No Teams Found</h3>
                                    <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-4 max-w-xs text-center leading-relaxed">Start by creating your first team.</p>
                                    <Button onClick={() => setIsAddOpen(true)} className="mt-10 bg-indigo-600 text-white hover:bg-black rounded-2xl px-12 h-14 font-bold text-[11px] tracking-widest uppercase shadow-xl transition-all active:scale-95">Add New</Button>
                                </div>
                            ) : (
                                filteredData.map((item, idx) => (
                                    <motion.div 
                                        key={item.id} 
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white border border-slate-100 rounded-[40px] p-10 flex flex-col group min-h-[520px] hover:border-indigo-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-10">
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-800 tracking-tight font-brand group-hover:text-indigo-600 transition-colors">{item.name}</h4>
                                                <div className="flex items-center gap-3 mt-4">
                                                    <Badge className="bg-slate-50 text-slate-400 border-none text-[9px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-full">ID: {item.id.slice(-6).toUpperCase()}</Badge>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 transition-all">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-60 bg-white border border-slate-100 rounded-[28px] p-3 shadow-2xl">
                                                    <DropdownMenuItem className="p-4 gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-600 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer" onClick={() => setViewTeam(item)}>View Team</DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-50 my-2" />
                                                    <DropdownMenuItem className="p-4 gap-4 text-[11px] font-bold uppercase tracking-widest text-rose-500 rounded-2xl hover:bg-rose-50 cursor-pointer">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="flex-1 space-y-8">
                                            <p className="text-slate-500 text-[14px] leading-relaxed font-medium pl-6 border-l-2 border-indigo-50 group-hover:border-indigo-200 transition-all">
                                                "{item.description || "Manage your team members and work."}"
                                            </p>

                                            <div className="p-6 rounded-[28px] bg-slate-50/50 border border-slate-50 group-hover:bg-white group-hover:border-indigo-50 transition-all">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Team Lead</p>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm">
                                                        {item.manager?.name ? item.manager.name[0].toUpperCase() : '?'}
                                                    </div>
                                                    <span className={cn("text-[16px] font-bold tracking-tight font-brand", item.manager?.name ? "text-slate-800" : "text-slate-300")}>
                                                        {item.manager?.name || "Unassigned"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between px-2 pt-4">
                                                <div className="flex items-center gap-3">
                                                    <Users className="w-4 h-4 text-slate-300" />
                                                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{item._count?.users || 0} Members</span>
                                                </div>
                                                <Badge className={cn(
                                                    "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm",
                                                    (item.status || "ACTIVE") === "ACTIVE" ? "bg-emerald-600 text-white border-none" : "bg-slate-100 text-slate-400 border-none"
                                                )}>
                                                    {(item.status || "ACTIVE")}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="mt-10 space-y-4">
                                            <Button 
                                                onClick={() => setViewTeam(item)} 
                                                className="h-14 w-full bg-slate-900 hover:bg-black text-white rounded-[24px] font-bold text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95"
                                            >
                                                Manage Team
                                            </Button>

                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    onClick={() => { setReportDept(item); setReportType("daily") }}
                                                    className="flex flex-col items-center gap-2 p-4 rounded-[22px] bg-slate-50 hover:bg-indigo-600 hover:text-white transition-all group/btn shadow-sm"
                                                >
                                                    <CalendarDays className="w-4 h-4 text-slate-400 group-hover/btn:text-white transition-colors" />
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 group-hover/btn:text-white transition-colors">Daily</span>
                                                </button>
                                                <button
                                                    onClick={() => { setReportDept(item); setReportType("monthly") }}
                                                    className="flex flex-col items-center gap-2 p-4 rounded-[22px] bg-slate-50 hover:bg-indigo-600 hover:text-white transition-all group/btn shadow-sm"
                                                >
                                                    <CalendarRange className="w-4 h-4 text-slate-400 group-hover/btn:text-white transition-colors" />
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 group-hover/btn:text-white transition-colors">Monthly</span>
                                                </button>
                                                <button
                                                    onClick={() => { setReportDept(item); setReportType("individual") }}
                                                    className="flex flex-col items-center gap-2 p-4 rounded-[22px] bg-slate-50 hover:bg-indigo-600 hover:text-white transition-all group/btn shadow-sm"
                                                >
                                                    <UserSearch className="w-4 h-4 text-slate-400 group-hover/btn:text-white transition-colors" />
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 group-hover/btn:text-white transition-colors">Staff</span>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* TEAM MEMBERS MODAL */}
            <Dialog open={!!viewTeam} onOpenChange={() => setViewTeam(null)}>
                <DialogContent className="bg-white border-none text-slate-900 max-w-xl rounded-[48px] shadow-2xl p-0 overflow-hidden">
                    <div className="p-12 border-b border-slate-50 bg-slate-50/50">
                        <DialogTitle className="text-2xl font-bold font-brand tracking-tight leading-none">{viewTeam?.name}</DialogTitle>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-4 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                            Staff Members
                        </p>
                    </div>

                    <ScrollArea className="max-h-[60vh] p-12 bg-white">
                        <div className="space-y-6">
                            {viewTeam && getTeamMembers(viewTeam.id).length > 0 ? (
                                getTeamMembers(viewTeam.id).map((member, midx) => (
                                    <motion.div 
                                        key={member.id} 
                                        initial={{ opacity:0, x: -15 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        transition={{ delay: midx * 0.05 }}
                                        className="flex items-center justify-between p-6 bg-slate-50/50 border border-slate-100 rounded-[32px] hover:border-indigo-600 hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-sm group-hover:scale-110 transition-transform shadow-sm">
                                                {member.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-[16px] font-bold text-slate-800 tracking-tight font-brand leading-none">{member.name}</p>
                                                <p className="text-[11px] font-medium text-slate-400 mt-2">{member.email}</p>
                                            </div>
                                        </div>
                                        <Badge className={cn(
                                            "h-8 px-5 text-[9px] font-bold uppercase tracking-widest border-none shadow-sm rounded-full",
                                            member.status === 'ACTIVE' ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                                        )}>
                                            {member.status}
                                        </Badge>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-24 flex flex-col items-center justify-center opacity-40">
                                    <Users className="w-16 h-16 text-slate-200 mb-8 animate-pulse" />
                                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Empty</p>
                                    <p className="text-[11px] text-slate-300 font-bold mt-3">No employees assigned to this unit.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* PERFORMANCE REPORT MODAL */}
            <Dialog open={!!reportDept && !!reportType} onOpenChange={() => { setReportDept(null); setReportType(null) }}>
                <DialogContent className="bg-white border-none text-slate-900 max-w-2xl rounded-[48px] shadow-2xl p-0 overflow-hidden">
                    <div className={cn("p-10 border-b border-slate-50 flex items-center justify-between",
                        reportType === 'daily' ? 'bg-indigo-50/60' : 'bg-emerald-50/60'
                    )}>
                        <div className="flex items-center gap-6">
                            <div className={cn("w-14 h-14 rounded-[22px] flex items-center justify-center text-white shadow-xl",
                                reportType === 'daily' ? 'bg-indigo-600 shadow-indigo-100' : 'bg-emerald-600 shadow-emerald-100'
                            )}>
                                {reportType === 'daily' ? <CalendarDays className="w-6 h-6" /> : <CalendarRange className="w-6 h-6" />}
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold font-brand tracking-tight">{reportType} Report</DialogTitle>
                                <DialogDescription className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mt-2">{reportDept?.name}</DialogDescription>
                            </div>
                        </div>
                        <Button
                            onClick={() => toast.success(`Exporting ${reportType} report...`)}
                            className="bg-white text-slate-900 border border-slate-200 hover:bg-slate-900 hover:text-white px-8 h-12 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                        >
                            <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                    </div>

                    <ScrollArea className="max-h-[60vh] p-10 bg-white">
                        <div className="space-y-10">
                            <div className="grid grid-cols-3 gap-6">
                                {[
                                    { label: "Stability", value: "98.4%", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
                                    { label: "Efficiency", value: "92.1%", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
                                    { label: "Risks", value: "0", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
                                ].map((s, i) => (
                                    <div key={i} className="bg-slate-50/50 border border-slate-50 rounded-[28px] p-6 flex flex-col gap-4">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.bg)}>
                                            <s.icon className={cn("w-5 h-5", s.color)} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                                            <p className={cn("text-2xl font-bold tracking-tight font-brand mt-1", s.color)}>{s.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Performance Score</p>
                                {reportDept && getTeamMembers(reportDept.id).map((member, idx) => (
                                    <div key={member.id} className="flex items-center justify-between p-6 bg-[#fcfcfd] border border-slate-50 rounded-[32px] hover:border-indigo-100 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-indigo-600 font-bold text-xs">{member.name[0]}</div>
                                            <span className="text-[14px] font-semibold text-slate-900">{member.name}</span>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Score</p>
                                                <p className="text-[14px] font-bold text-indigo-600 font-brand leading-none">{95 - idx}%</p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    )
}

