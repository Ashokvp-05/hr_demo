"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Building2, Users, Plus, Search, 
    Ellipsis, Loader2, Target,
    ExternalLink, Activity, TrendingUp,
    BarChart3, RefreshCcw, UserCheck, Briefcase,
    ChevronRight, Globe, Shield, Mail, UserCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function ManagerDepartmentView({ token }: { token: string }) {
    const [departments, setDepartments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newDept, setNewDept] = useState({ name: "", description: "" })
    const [creating, setCreating] = useState(false)
    const [search, setSearch] = useState("")
    const [selectedDept, setSelectedDept] = useState<any>(null)
    const [deptMembers, setDeptMembers] = useState<any[]>([])
    const [membersLoading, setMembersLoading] = useState(false)

    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/organization/departments`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setDepartments(data)
        } catch (e) {
            toast.error("Failed to load departments")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!newDept.name) return toast.error("Department name is required")
        setCreating(true)
        try {
            const res = await fetch(`${API_BASE_URL}/organization/departments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newDept)
            })
            if (res.ok) {
                toast.success("Department created successfully")
                setIsCreateOpen(false)
                setNewDept({ name: "", description: "" })
                fetchDepartments()
            } else {
                toast.error("Failed to create department")
            }
        } catch (e) {
            toast.error("Connection error")
        } finally {
            setCreating(false)
        }
    }

    useEffect(() => {
        fetchDepartments()
    }, [token])

    const viewDepartment = async (dept: any) => {
        setSelectedDept(dept)
        setMembersLoading(true)
        try {
            console.log("Viewing department", dept)
            const res = await fetch(`${API_BASE_URL}/users?limit=ALL`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Failed to fetch users")
            const data = await res.json()
            const users = Array.isArray(data) ? data : (data.users || data.data || [])
            const members = users.filter((u: any) => u.departmentId === dept.id || u.deptId === dept.id)
            setDeptMembers(members)
        } catch (e) {
            console.error("Error viewing department:", e)
            toast.error("Failed to load department members")
            setDeptMembers([])
        } finally {
            setMembersLoading(false)
        }
    }

    const filtered = departments.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
    )

    const totalEmployees = departments.reduce((sum, d) => sum + (d._count?.users || 0), 0)
    const activeDepts = departments.length

    const deptColors = [
        { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", accent: "#4f46e5" },
        { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", accent: "#059669" },
        { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", accent: "#7c3aed" },
        { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", accent: "#d97706" },
        { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", accent: "#e11d48" },
        { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-100", accent: "#0891b2" },
        { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100", accent: "#ea580c" },
        { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100", accent: "#0d9488" },
    ]

    return (
        <div className="min-h-full bg-[#fcfcfd] font-body pb-20 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10 relative z-10">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                            <Building2 className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-[26px] font-bold text-slate-800 tracking-tight font-brand leading-none">
                                Department Analytics
                            </h1>
                            <p className="text-[12px] font-medium text-slate-400 mt-2">
                                Department Overview · {departments.length} Departments
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchDepartments}
                            className="h-11 px-6 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                        >
                            <RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                            Refresh
                        </button>
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="h-11 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Department
                        </Button>
                    </div>
                </div>

                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Active Departments", value: activeDepts, sub: "Organizational Units", icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
                        { label: "Total Employees", value: totalEmployees, sub: "Across All Depts", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Avg Team Size", value: activeDepts > 0 ? Math.round(totalEmployees / activeDepts) : 0, sub: "Per Department", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
                        { label: "System Status", value: "98.2%", sub: "Operational Uptime", icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", stat.bg)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">{stat.value}</h2>
                            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{stat.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ── SEARCH & FILTER BAR ── */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search departments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-11 pl-11 bg-slate-50 border-slate-100 rounded-xl text-[12px] font-medium text-slate-600 focus:ring-indigo-500/10"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] px-4 py-2 rounded-full">
                            {filtered.length} of {departments.length} Departments
                        </Badge>
                    </div>
                </div>

                {/* ── DEPARTMENT CARDS ── */}
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-6">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                        <p className="text-[13px] font-medium text-slate-400">Loading departments...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-6 bg-white rounded-[40px] border border-dashed border-slate-200">
                        <Building2 className="w-16 h-16 text-slate-100" />
                        <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
                            {search ? "No matching departments" : "No departments created yet"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {filtered.map((dept, idx) => {
                                const colorSet = deptColors[idx % deptColors.length]
                                const memberCount = dept._count?.users || 0

                                return (
                                    <motion.div
                                        key={dept.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.06 }}
                                        className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all flex flex-col group relative overflow-hidden"
                                    >
                                        {/* Top accent line */}
                                        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[32px]" style={{ background: colorSet.accent }} />

                                        {/* Card Header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", colorSet.bg)}>
                                                    <Building2 className={cn("w-5 h-5", colorSet.text)} />
                                                </div>
                                                <div>
                                                    <h3 className="text-[16px] font-semibold text-slate-900 tracking-tight leading-tight">{dept.name}</h3>
                                                    <p className="text-[11px] font-medium text-emerald-600 mt-1">Active</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-300 hover:text-slate-600">
                                                <Ellipsis className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Description */}
                                        <p className="text-[12px] text-slate-400 font-normal leading-relaxed mb-6 line-clamp-2">
                                            {dept.description || "Core organizational management department for team coordination and project delivery."}
                                        </p>

                                        {/* Metrics Row */}
                                        <div className="grid grid-cols-3 gap-3 mb-6">
                                            <div className="bg-slate-50/80 rounded-xl p-3.5 text-center">
                                                <p className="text-[10px] font-medium text-slate-400 mb-1">Members</p>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-[15px] font-semibold text-slate-800">{memberCount}</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50/80 rounded-xl p-3.5 text-center">
                                                <p className="text-[10px] font-medium text-slate-400 mb-1">Projects</p>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-[15px] font-semibold text-slate-800">{Math.max(1, memberCount)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50/80 rounded-xl p-3.5 text-center">
                                                <p className="text-[10px] font-medium text-slate-400 mb-1">Status</p>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span className="text-[11px] font-medium text-emerald-600">Active</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Team Avatars & Action */}
                                        <div className="flex items-center justify-between pt-5 border-t border-slate-50 mt-auto">
                                            <div className="flex -space-x-2.5">
                                                {Array.from({ length: Math.min(memberCount, 4) }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold uppercase"
                                                        style={{ background: deptColors[(idx + i) % deptColors.length].accent, color: '#fff' }}
                                                    >
                                                        {dept.name[0]}
                                                    </div>
                                                ))}
                                                {memberCount > 4 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                                                        +{memberCount - 4}
                                                    </div>
                                                )}
                                                {memberCount === 0 && (
                                                    <div className="text-[11px] font-medium text-slate-300">No members yet</div>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => viewDepartment(dept)}
                                                className="h-8 px-4 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1"
                                            >
                                                View <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* CREATE DIALOG */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-white border-none text-slate-900 max-w-lg rounded-[40px] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.15)] p-0 overflow-hidden font-body">
                    <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 font-brand">
                                    New Department
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Create a new organizational unit
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Department Name</Label>
                            <Input
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 px-6 font-bold text-slate-900 focus:ring-4 focus:ring-indigo-600/10 transition-all outline-none"
                                placeholder="e.g. Engineering & Cloud"
                                value={newDept.name}
                                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Description</Label>
                            <Textarea
                                className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-100 p-6 font-medium text-slate-900"
                                placeholder="Define the core objectives of this department..."
                                value={newDept.description}
                                onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="p-8 border-t border-slate-100 bg-[#f8fafc] flex items-center justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreateOpen(false)}
                            className="h-12 px-8 rounded-2xl font-bold uppercase text-[10px] tracking-widest text-slate-400"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={creating}
                            className="h-12 px-10 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-95"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Department"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DEPARTMENT DETAIL DIALOG */}
            <Dialog open={!!selectedDept} onOpenChange={() => setSelectedDept(null)}>
                <DialogContent className="bg-white border-none text-slate-900 max-w-lg rounded-[40px] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.15)] p-0 overflow-hidden font-body">
                    <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 font-brand">
                                    {selectedDept ? String(selectedDept.name || "Unnamed Department") : ""}
                                </DialogTitle>
                                <DialogDescription className="text-[12px] font-medium text-slate-400 mt-1">
                                    {selectedDept ? String(selectedDept.description || "Core organizational department") : ""}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-8">
                        {/* Department Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 rounded-2xl p-4 text-center">
                                <p className="text-[10px] font-medium text-slate-400 mb-1">Members</p>
                                <p className="text-2xl font-bold text-slate-900">{selectedDept?._count?.users || 0}</p>
                            </div>
                            <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                                <p className="text-[10px] font-medium text-slate-400 mb-1">Status</p>
                                <p className="text-[13px] font-semibold text-emerald-600">Active</p>
                            </div>
                            <div className="bg-indigo-50 rounded-2xl p-4 text-center">
                                <p className="text-[10px] font-medium text-slate-400 mb-1">Created</p>
                                <p className="text-[13px] font-semibold text-indigo-600">
                                    {selectedDept?.createdAt ? new Date(selectedDept.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Team Members */}
                        <div>
                            <p className="text-[12px] font-semibold text-slate-500 mb-4">Team Members</p>
                            {membersLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                </div>
                            ) : deptMembers.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-2xl">
                                    <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[12px] font-medium text-slate-400">No members assigned yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                                    {deptMembers.map((member: any) => (
                                        <div key={member.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-[12px] font-semibold text-indigo-600 shrink-0">
                                                {member.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-slate-900 truncate">{String(member.name || '')}</p>
                                                <p className="text-[11px] font-medium text-slate-400 truncate">{String(member.email || '')}</p>
                                            </div>
                                            <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-medium px-3 py-1 rounded-lg shrink-0">
                                                {typeof member.designation === 'string' ? member.designation : String(member.designation?.name || (typeof member.role === 'string' ? member.role : member.role?.name) || 'Employee')}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-[#f8fafc] flex justify-end">
                        <Button
                            onClick={() => setSelectedDept(null)}
                            className="h-11 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-medium text-[12px] shadow-lg transition-all"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

