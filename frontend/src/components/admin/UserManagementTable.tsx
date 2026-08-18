"use client"

import { useState, useEffect, useMemo } from "react"
import useSWR from "swr"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Search, Plus, 
    Edit3, UserX,
    Loader2, RefreshCcw,
    UserCheck, FileDown, Trash2,
    Users, ShieldCheck, AlertCircle, Building2, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import AddEmployeeModal from "./AddEmployeeModal"
import { useRouter } from "next/navigation"

export default function UserManagementTable({ token, userRole }: { token: string, userRole: string }) {
    const API = process.env.NEXT_PUBLIC_API_URL
    const router = useRouter()
    const canManage = !['HR', 'HR_ADMIN', 'AUDITOR'].includes(userRole.toUpperCase())
    const [search, setSearch] = useState("")
    const [editUser, setEditUser] = useState<any>(null)
    const [deactivateUser, setDeactivateUser] = useState<any>(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [deptFilter, setDeptFilter] = useState("ALL")
    const [statusFilter, setStatusFilter] = useState("ALL")
    
    const fetcher = async (url: string) => {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || err.message || `HTTP ${res.status}`)
        }
        return res.json()
    }
    const { data: usersData, error, mutate: fetchUsers, isValidating } = useSWR(
        token ? `${API}/users?limit=ALL` : null, 
        fetcher, { 
        revalidateOnFocus: false,
        keepPreviousData: true
    })
    
    const users: any[] = Array.isArray(usersData) ? usersData : (usersData?.users || [])
    const loading = !usersData && !error

    const departments = Array.from(new Set(users.map(u => u.department?.name).filter(Boolean)))

    const filtered = users.filter(u => {
        const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
        const matchDept = deptFilter === "ALL" || u.department?.name === deptFilter
        const matchStatus = statusFilter === "ALL" || u.status === statusFilter
        return matchSearch && matchDept && matchStatus
    })

    const stats = useMemo(() => {
        const total = users.length
        const active = users.filter(u => u.status === 'ACTIVE').length
        const inactive = users.filter(u => u.status === 'INACTIVE' || u.status === 'SUSPENDED').length
        const deptCount = departments.length
        const activePct = total > 0 ? ((active / total) * 100).toFixed(1) : "0.0"
        const inactivePct = total > 0 ? ((inactive / total) * 100).toFixed(1) : "0.0"
        return { total, active, inactive, deptCount, activePct, inactivePct }
    }, [users, departments])

    const handleExport = () => {
        const toExport = filtered
        if (toExport.length === 0) return toast.error("No data to export")
        
        const headers = ["Name", "Email", "Role", "Status", "Department", "Job Title"]
        const rows = toExport.map(u => [
            `"${u.name || ''}"`, `"${u.email || ''}"`, `"${u.role?.name || u.role || ''}"`,
            `"${u.status || ''}"`, `"${u.department?.name || ''}"`, `"${u.designation?.name || ''}"`
        ])
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `employees_export_${new Date().getTime()}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Exported ${toExport.length} personnel records`)
    }

    return (
        <div className="min-h-full font-body pb-20 bg-[#F8FAFC]">
            <div className="w-full max-w-[1700px] mx-auto space-y-6">

                {/* ── 4 KPI CARDS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Card 1: Total Employees */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Total Employees</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{stats.total}</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-1">All Registered</p>
                        </div>
                    </div>

                    {/* Card 2: Active */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Active</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{stats.active}</h3>
                            <p className="text-[10px] font-semibold text-emerald-500 mt-1">{stats.activePct}% of Total</p>
                        </div>
                    </div>

                    {/* Card 3: Inactive */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Inactive</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{stats.inactive}</h3>
                            <p className="text-[10px] font-semibold text-rose-500 mt-1">{stats.inactivePct}% of Total</p>
                        </div>
                    </div>

                    {/* Card 4: Departments */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Departments</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{stats.deptCount}</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-1">Active Departments</p>
                        </div>
                    </div>
                </div>

                {/* ── FILTER BAR ── */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
                    
                    {/* Department Selector */}
                    <div className="flex flex-col gap-1.5 w-full group">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Department</label>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="h-12 w-full pl-12 pr-10 bg-slate-50/50 border border-slate-200/60 rounded-xl text-[13px] font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                            >
                                <option value="ALL">All Departments</option>
                                {departments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Status Selector */}
                    <div className="flex flex-col gap-1.5 w-full group">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-12 w-full pl-12 pr-10 bg-slate-50/50 border border-slate-200/60 rounded-xl text-[13px] font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 w-full h-12">
                        <Button 
                            onClick={handleExport}
                            variant="outline" 
                            className="h-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 rounded-xl px-4 text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-white transition-all"
                        >
                            <FileDown className="w-4 h-4 shrink-0" />
                            Export
                        </Button>
                        <Button 
                            onClick={() => fetchUsers()}
                            variant="outline" 
                            className="h-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 rounded-xl px-4 text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-white transition-all"
                        >
                            <RefreshCcw className={cn("w-4 h-4 shrink-0", isValidating && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>

                    {/* Add Employee */}
                    {canManage && (
                        <Button 
                            onClick={() => setIsAddOpen(true)}
                            className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 text-[13px] font-bold uppercase tracking-wider shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4 shrink-0" />
                            Add Employee
                        </Button>
                    )}
                </div>

                {/* ── TABLE CARD ── */}
                <div className="bg-white border border-slate-200/60 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Employee Directory</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Showing {filtered.length} of {users.length} employees
                            </p>
                        </div>
                        <div className="relative group w-full md:w-[320px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <Input 
                                placeholder="Search by name or email..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 pl-11 bg-slate-50/50 border border-slate-200/60 rounded-xl text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-indigo-100 transition-all w-full placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[5%]">#</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[25%]">Employee</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[20%]">Email</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[15%]">Department</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[12%]">Role</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[10%]">Status</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right w-[13%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-24 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-3" />
                                            <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Loading employees...</p>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-slate-400 font-semibold">
                                            No employees found matching current parameters.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((user: any, idx: number) => (
                                        <motion.tr 
                                            key={user.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            {/* Index */}
                                            <td className="py-4 px-6 text-[13px] font-bold text-slate-400">
                                                {idx + 1}
                                            </td>

                                            {/* Employee Name + Avatar */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-[14px] shrink-0 shadow-sm",
                                                        user.status === 'ACTIVE' ? "bg-indigo-500" : "bg-slate-400"
                                                    )}>
                                                        {user.name?.substring(0, 1).toUpperCase() || "U"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[14px] font-bold text-slate-800 block truncate">{user.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{user.id?.substring(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Email */}
                                            <td className="py-4 px-6 text-[13px] font-medium text-slate-500 truncate max-w-[200px]">
                                                {user.email}
                                            </td>

                                            {/* Department */}
                                            <td className="py-4 px-6 text-[13px] font-semibold text-slate-600">
                                                {user.department?.name || 'General'}
                                            </td>

                                            {/* Role */}
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-100">
                                                    {user.role?.name || "Employee"}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-6">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                                                    user.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                    "bg-rose-50 text-rose-700 border-rose-100"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", 
                                                        user.status === 'ACTIVE' ? "bg-emerald-500" : "bg-rose-500"
                                                    )} />
                                                    {user.status || "ACTIVE"}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditUser(user); }}
                                                        title="Edit"
                                                        className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeactivateUser(user); }}
                                                        title="Delete Employee"
                                                        className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            router.push(`/admin?tab=employee-details&userId=${user.id}`)
                                                        }}
                                                        title="View Details"
                                                        className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODALS ── */}
            <AnimatePresence>
                {(isAddOpen || editUser || deactivateUser) && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
                        >
                            {(isAddOpen || editUser) && (
                                <AddEmployeeModal 
                                    token={token} 
                                    employee={editUser} 
                                    onClose={() => {
                                        setEditUser(null);
                                        setIsAddOpen(false);
                                    }} 
                                    onSuccess={() => {
                                        setEditUser(null);
                                        setIsAddOpen(false);
                                        fetchUsers();
                                    }} 
                                />
                            )}
                            {deactivateUser && (() => {
                                return (
                                <div className="bg-white rounded-3xl p-10 max-w-md mx-auto border border-slate-200/60 shadow-[0_32px_80px_rgba(0,0,0,0.1)]">
                                    <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center mb-8 mx-auto">
                                        <Trash2 className="w-10 h-10 text-rose-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 text-center tracking-tight mb-3 leading-none">
                                        Delete Employee Permanently?
                                    </h3>
                                    <p className="text-[13px] text-slate-500 text-center mb-4 font-medium leading-relaxed">
                                        You are about to permanently delete <span className="font-bold text-slate-900">{deactivateUser.name}</span> ({deactivateUser.email}).
                                    </p>
                                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-8">
                                        <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider text-center">
                                            ⚠️ This action is irreversible. All employee data including attendance, payslips, leave records, and documents will be permanently removed.
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button 
                                            variant="outline"
                                            onClick={() => setDeactivateUser(null)}
                                            className="h-12 rounded-xl text-[12px] font-bold uppercase tracking-wider border-slate-200 hover:bg-slate-50 transition-all"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`${API}/admin/users/${deactivateUser.id}`, {
                                                        method: 'DELETE',
                                                        headers: { 
                                                            "Authorization": `Bearer ${token}`,
                                                            "Content-Type": "application/json"
                                                        }
                                                    })
                                                    if (!res.ok) {
                                                        const err = await res.json().catch(() => ({}))
                                                        throw new Error(err.error || "Failed to delete")
                                                    }
                                                    toast.success(`${deactivateUser.name} has been permanently deleted`)
                                                    setDeactivateUser(null)
                                                    fetchUsers()
                                                } catch (err: any) {
                                                    toast.error(err.message || "Failed to delete employee")
                                                }
                                            }}
                                            className="h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[12px] font-bold uppercase tracking-wider shadow-md shadow-rose-100 transition-all"
                                        >
                                            Delete Permanently
                                        </Button>
                                    </div>
                                </div>
                                );
                            })()}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
