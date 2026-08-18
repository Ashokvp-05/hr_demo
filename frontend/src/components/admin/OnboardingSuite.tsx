"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    UserPlus, ShieldAlert, Loader2, Clock,
    Sparkles, ChevronDown, Check, X, Edit3,
    FileText, Building2, Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/config"

interface Candidate {
    id: string
    name: string
    email: string
    dept: string
    designation: string
    role: string
    status: string
}

interface LeaveBalance {
    id: string
    total: number
    used: number
    pending: number
    leaveTypeConfig: { name: string; code: string }
}

export default function OnboardingSuite({ token }: { token: string }) {
    const [loading, setLoading] = useState(true)
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [leaveMap, setLeaveMap] = useState<Record<string, LeaveBalance[]>>({})
    const [leaveLoading, setLeaveLoading] = useState<Record<string, boolean>>({})
    const [leaveEdits, setLeaveEdits] = useState<Record<string, number>>({})
    const [savingLeave, setSavingLeave] = useState(false)
    const [initializingLeave, setInitializingLeave] = useState<Record<string, boolean>>({})

    const [form, setForm] = useState({ name: "", email: "", password: "", roleId: "", deptId: "", designationId: "" })
    const [isDeploying, setIsDeploying] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [metadata, setMetadata] = useState<{ roles: any[]; depts: any[]; designations: any[] }>({ roles: [], depts: [], designations: [] })

    const h = { Authorization: `Bearer ${token}` }

    const fetchSync = async () => {
        setLoading(true)
        try {
            const [usersRes, rolesRes, dRes, dgRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/employees`, { headers: h }),
                fetch(`${API_BASE_URL}/admin/roles`, { headers: h }),
                fetch(`${API_BASE_URL}/organization/departments`, { headers: h }),
                fetch(`${API_BASE_URL}/organization/designations`, { headers: h }),
            ])
            if (usersRes.ok) {
                const d = await usersRes.json()
                const list = Array.isArray(d) ? d : (d.users || [])
                setCandidates(list.slice(0, 10).map((u: any) => ({
                    id: u.id, 
                    name: u.name,
                    email: u.email,
                    dept: u.department?.name || "N/A",
                    designation: u.designation?.name || "N/A",
                    role: u.role?.name || "Member",
                    status: u.status || "ACTIVE"
                })))
            }
            if (rolesRes.ok && dRes.ok && dgRes.ok) {
                setMetadata({ roles: await rolesRes.json(), depts: await dRes.json(), designations: await dgRes.json() })
            }
        } catch { toast.error("Update failed") }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchSync() }, [token])

    // Fetch leave balances when expanding an employee row
    const handleExpand = async (id: string) => {
        if (expandedId === id) { setExpandedId(null); return }
        setExpandedId(id)
        if (leaveMap[id]) return // already loaded
        setLeaveLoading(prev => ({ ...prev, [id]: true }))
        try {
            const res = await fetch(`${API_BASE_URL}/admin/employees/${id}/leave-balances`, { headers: h })
            if (res.ok) {
                const data = await res.json()
                setLeaveMap(prev => ({ ...prev, [id]: data }))
                // Seed edits with current totals
                const edits: Record<string, number> = {}
                data.forEach((b: LeaveBalance) => { edits[b.id] = b.total })
                setLeaveEdits(prev => ({ ...prev, ...edits }))
            } else {
                toast.error("Cannot load leave data")
            }
        } catch { toast.error("Connection error") }
        finally { setLeaveLoading(prev => ({ ...prev, [id]: false })) }
    }

    const handleSaveLeave = async (employeeId: string) => {
        const balances = leaveMap[employeeId]
        if (!balances) return
        setSavingLeave(true)
        try {
            const payload = balances.map(b => ({ id: b.id, total: leaveEdits[b.id] ?? b.total }))
            const res = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}/leave-balances`, {
                method: "PATCH",
                headers: { ...h, "Content-Type": "application/json" },
                body: JSON.stringify({ balances: payload })
            })
            if (res.ok) {
                // Refresh local data
                const updated = balances.map(b => ({ ...b, total: leaveEdits[b.id] ?? b.total }))
                setLeaveMap(prev => ({ ...prev, [employeeId]: updated }))
                toast.success("Leave balances updated")
            } else {
                const d = await res.json()
                toast.error(d.error || "Failed to save")
            }
        } catch { toast.error("Connection error") }
        finally { setSavingLeave(false) }
    }

    const handleInitLeaves = async (employeeId: string) => {
        setInitializingLeave(prev => ({ ...prev, [employeeId]: true }))
        try {
            const res = await fetch(`${API_BASE_URL}/leave-v2/initialize-balances`, {
                method: "POST",
                headers: { ...h, "Content-Type": "application/json" },
                body: JSON.stringify({ userId: employeeId })
            })
            if (res.ok) {
                toast.success("Leave balances initialized with company defaults")
                // Re-fetch the balances for this employee
                const balRes = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}/leave-balances`, { headers: h })
                if (balRes.ok) {
                    const data = await balRes.json()
                    setLeaveMap(prev => ({ ...prev, [employeeId]: data }))
                    const edits: Record<string, number> = {}
                    data.forEach((b: LeaveBalance) => { edits[b.id] = b.total })
                    setLeaveEdits(prev => ({ ...prev, ...edits }))
                }
            } else {
                const d = await res.json()
                toast.error(d.error || "Failed to initialize")
            }
        } catch { toast.error("Connection error") }
        finally { setInitializingLeave(prev => ({ ...prev, [employeeId]: false })) }
    }

    const handleDeploy = async () => {
        if (!form.name || !form.email || !form.password || !form.roleId) {
            toast.error("Name, Email, Password, and Role are required")
            return
        }
        setIsDeploying(true)
        try {
            const res = await fetch(`${API_BASE_URL}/admin/employees`, {
                method: "POST",
                headers: { ...h, "Content-Type": "application/json" },
                body: JSON.stringify(form)
            })
            const data = await res.json()
            if (res.ok) {
                setShowSuccess(true)
                toast.success(`${form.name} has been onboarded successfully`)
                setForm({ name: "", email: "", password: "", roleId: "", deptId: "", designationId: "" })
                fetchSync()
                setTimeout(() => setShowSuccess(false), 3000)
            } else {
                toast.error(data.error || "Onboarding failed")
            }
        } catch { toast.error("Connection error") }
        finally { setIsDeploying(false) }
    }

    const inp = "h-11 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none px-4 w-full focus:border-indigo-500/50 transition-colors"
    const lbl = "text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block"
    const sel = "h-11 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none px-3 w-full cursor-pointer appearance-none focus:border-indigo-500/50 transition-colors"

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* ── ONBOARD FORM ── */}
                <div className="xl:col-span-5">
                    <Card className="border-none bg-slate-900 text-white rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/15 to-transparent pointer-events-none" />
                        <CardHeader className="p-10 pb-6 relative z-10">
                            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                                <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
                                Add Employee
                                {showSuccess && <Sparkles className="w-5 h-5 text-emerald-400 animate-bounce" />}
                            </CardTitle>
                            <CardDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                                Create a new employee profile
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-10 pt-0 relative z-10">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className={lbl}>Full Name</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter name" className={inp} />
                                </div>
                                <div>
                                    <label className={lbl}>Role</label>
                                    <select value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} className={sel}>
                                        <option value="" className="bg-slate-900">Select Role</option>
                                        {metadata.roles.filter(r => r.name !== 'SUPER_ADMIN').map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={lbl}>Department</label>
                                    <select value={form.deptId} onChange={e => setForm({ ...form, deptId: e.target.value })} className={sel}>
                                        <option value="" className="bg-slate-900">Select Dept.</option>
                                        {metadata.depts.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={lbl}>Email Address</label>
                                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" className={inp} />
                                </div>
                                <div>
                                    <label className={lbl}>Password</label>
                                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className={inp} />
                                </div>
                                <div className="col-span-2">
                                    <label className={lbl}>Job Title (Optional)</label>
                                    <select value={form.designationId} onChange={e => setForm({ ...form, designationId: e.target.value })} className={sel}>
                                        <option value="" className="bg-slate-900">Select Title</option>
                                        {metadata.designations.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <Button
                                onClick={handleDeploy}
                                disabled={isDeploying}
                                className="w-full h-13 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20 mt-7 transition-all active:scale-95 py-4"
                            >
                                {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Employee"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* ── EMPLOYEE LIST ── */}
                <div className="xl:col-span-7">
                    <Card className="border-none bg-white shadow-xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden flex flex-col h-full">
                        <CardHeader className="px-10 py-8 border-b border-slate-50 flex flex-row items-center justify-between shrink-0">
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Employee Directory</CardTitle>
                                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Select an employee to manage leave balances
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase text-slate-400">Live</span>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0 overflow-y-auto flex-1">
                            {loading ? (
                                <div className="p-20 flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Loading directory…</p>
                                </div>
                            ) : candidates.length === 0 ? (
                                <div className="p-20 text-center">
                                    <p className="text-[11px] font-bold uppercase text-slate-400 tracking-widest">No employees found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {candidates.map((c) => (
                                        <div key={c.id}>
                                            {/* ── ROW ── */}
                                            <button
                                                onClick={() => handleExpand(c.id)}
                                                className="w-full flex items-center gap-4 px-8 py-5 hover:bg-slate-50/70 transition-colors text-left group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0 group-hover:scale-110 transition-transform">
                                                    {c.name[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-bold text-slate-900 truncate">{c.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{c.role}</p>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border-none shadow-none shrink-0",
                                                    c.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                                )}>
                                                    {c.status}
                                                </Badge>
                                                <ChevronDown className={cn(
                                                    "w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0",
                                                    expandedId === c.id && "rotate-180"
                                                )} />
                                            </button>

                                            {/* ── EXPANDED LEAVE PANEL ── */}
                                            <AnimatePresence initial={false}>
                                                {expandedId === c.id && (
                                                    <motion.div
                                                        key="panel"
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.28, ease: "easeInOut" }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="bg-slate-50/60 border-t border-slate-100 px-8 py-6">
                                                            {/* ── EMPLOYEE DETAILS ── */}
                                                            <div className="grid grid-cols-3 gap-6 mb-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                                                                        <FileText className="w-3 h-3 text-indigo-400" /> Email
                                                                    </p>
                                                                    <p className="text-[12px] font-bold text-slate-700">{c.email}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                                                                        <Building2 className="w-3 h-3 text-indigo-400" /> Department
                                                                    </p>
                                                                    <p className="text-[12px] font-bold text-slate-700">{c.dept}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                                                                        <Briefcase className="w-3 h-3 text-indigo-400" /> Job Title
                                                                    </p>
                                                                    <p className="text-[12px] font-bold text-slate-700">{c.designation}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 mb-5">
                                                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                                                                    Leave Balances — {new Date().getFullYear()}
                                                                </span>
                                                                <Edit3 className="w-3 h-3 text-slate-400 ml-1" />
                                                            </div>

                                                            {leaveLoading[c.id] ? (
                                                                <div className="flex items-center gap-3 py-4">
                                                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                                                    <span className="text-[10px] font-bold uppercase text-slate-400">Loading balances…</span>
                                                                </div>
                                                            ) : !leaveMap[c.id] || leaveMap[c.id].length === 0 ? (
                                                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                                                            <Clock className="w-5 h-5 text-amber-500" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[13px] font-bold text-slate-800 mb-1">No leave balances found</p>
                                                                            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                                                                                This employee doesn&apos;t have leave balances set up yet. Initialize now to assign
                                                                                the company default entitlements (Sick, Casual, Earned).
                                                                            </p>
                                                                            <Button
                                                                                onClick={() => handleInitLeaves(c.id)}
                                                                                disabled={initializingLeave[c.id]}
                                                                                className="h-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-[9px] tracking-widest px-5 shadow-sm transition-all active:scale-95"
                                                                            >
                                                                                {initializingLeave[c.id] ? (
                                                                                    <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Initializing…</>
                                                                                ) : (
                                                                                    <><Sparkles className="w-3 h-3 mr-1.5" />Apply Default Leave</>
                                                                                )}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="grid grid-cols-3 gap-4 mb-5">
                                                                        {leaveMap[c.id].map((b) => (
                                                                            <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                                                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                                                                                    {b.leaveTypeConfig?.name || b.leaveTypeConfig?.code}
                                                                                </p>
                                                                                {/* Editable total */}
                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                    <span className="text-[10px] text-slate-500 font-bold">Total</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        min={0}
                                                                                        value={leaveEdits[b.id] ?? b.total}
                                                                                        onChange={e => setLeaveEdits(prev => ({ ...prev, [b.id]: parseInt(e.target.value) || 0 }))}
                                                                                        className="w-16 h-8 rounded-lg border border-slate-200 text-center text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-colors"
                                                                                    />
                                                                                </div>
                                                                                <div className="flex gap-3 text-[10px] font-bold text-slate-400">
                                                                                    <span>Used <span className="text-amber-600">{b.used}</span></span>
                                                                                    <span>Left <span className="text-emerald-600">{Math.max(0, (leaveEdits[b.id] ?? b.total) - b.used - b.pending)}</span></span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="flex gap-3">
                                                                        <Button
                                                                            onClick={() => handleSaveLeave(c.id)}
                                                                            disabled={savingLeave}
                                                                            className="h-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-[9px] tracking-widest px-5 shadow-sm transition-all active:scale-95"
                                                                        >
                                                                            {savingLeave ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1.5" />Save Changes</>}
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            onClick={() => setExpandedId(null)}
                                                                            className="h-9 text-slate-500 hover:text-slate-700 rounded-xl font-bold uppercase text-[9px] tracking-widest px-5"
                                                                        >
                                                                            <X className="w-3 h-3 mr-1.5" />Dismiss
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>

                        <div className="border-t border-slate-50 px-10 py-5 flex justify-between items-center bg-slate-50/30 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ShieldAlert className="w-3 h-3" /> System Secure
                            </span>
                            <button onClick={fetchSync} className="text-[10px] font-bold uppercase text-indigo-600 hover:underline">
                                Re-Sync
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
