"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users, Plus, Search, Filter, MoreVertical,
    AtSign, Shield, Phone, Calendar, Briefcase,
    Building, MapPin, Loader2, UserPlus, FileDown,
    Trash2, Edit3, UserCheck, UserX, Crown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface User {
    id: string
    name: string
    email: string
    status: string
    deptId?: string
    department?: { name: string }
    designationId?: string
    designation?: { name: string }
    branchId?: string
    branch?: { name: string }
    role?: { name: string }
    joiningDate?: string
    createdAt: string
}

const GlobalStyles = () => (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }

        .glass-table-row {
            background: rgba(255, 255, 255, 0.02);
            transition: all 0.2s ease;
        }
        .glass-table-row:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: scale(1.002);
        }
    `}</style>
)

export default function UserManagement({ token, userRole = "" }: { token: string, userRole?: string }) {
    const canManage = !['HR', 'HR_ADMIN', 'AUDITOR'].includes((userRole || "").toUpperCase())
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: "", email: "", password: "changeMe123!",
        deptId: "", designationId: "", branchId: "",
        roleName: "EMPLOYEE"
    })

    const [depts, setDepts] = useState<{ id: string, name: string }[]>([])
    const [desigs, setDesigs] = useState<{ id: string, name: string }[]>([])
    const [branches, setBranches] = useState<{ id: string, name: string }[]>([])

    const fetchOrgData = useCallback(async () => {
        try {
            const [dRes, dsRes, bRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization/departments`, { headers: { "Authorization": `Bearer ${token}` } }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization/designations`, { headers: { "Authorization": `Bearer ${token}` } }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization/branches`, { headers: { "Authorization": `Bearer ${token}` } })
            ])
            const [d, ds, b] = await Promise.all([dRes.json(), dsRes.json(), bRes.json()])
            setDepts(Array.isArray(d) ? d : [])
            setDesigs(Array.isArray(ds) ? ds : [])
            setBranches(Array.isArray(b) ? b : [])
        } catch (err) { console.error("Org fetch failed") }
    }, [token])

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?limit=ALL`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setUsers(data.users || [])
            else toast.error("Failed to load users")
        } catch (err) { toast.error("Network error") }
        finally { setLoading(false) }
    }, [token])

    useEffect(() => {
        fetchUsers()
        fetchOrgData()
    }, [fetchUsers, fetchOrgData])

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast.success("Staff account created successfully")
                setIsAddOpen(false)
                fetchUsers()
            } else {
                const err = await res.json()
                toast.error(err.error || "Provisioning failed")
            }
        } catch (err) { toast.error("Network error") }
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-full bg-[#fcfcfd] font-body pb-20 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />

            <div className="max-w-[1400px] mx-auto space-y-10 relative z-10 px-4">
                <GlobalStyles />

                {/* ── HEADER & SEARCH ── */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-indigo-100">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-[26px] font-bold text-slate-800 font-brand leading-none">
                                Employee Directory
                            </h1>
                            <p className="text-slate-500 font-medium text-[11px] mt-2">
                                Manage staff profiles and access levels
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="relative w-full md:w-[400px] group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <Input
                                placeholder="Search by name, email or ID..."
                                className="pl-11 h-14 bg-white border-slate-100 text-slate-900 rounded-[20px] focus:ring-4 focus:ring-indigo-500/10 font-bold text-[11px] uppercase tracking-widest shadow-sm transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button variant="outline" className="h-14 px-8 border-slate-100 bg-white text-slate-400 hover:text-slate-900 rounded-[20px] shadow-sm gap-2 font-bold text-[10px] uppercase tracking-widest flex-1 lg:flex-none transition-all">
                                <FileDown className="w-4 h-4" />
                                Export Records
                            </Button>

                            {canManage && (
                                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="h-14 px-10 bg-slate-900 hover:bg-black text-white rounded-[20px] shadow-xl shadow-slate-200 font-bold uppercase text-[10px] tracking-widest flex-1 lg:flex-none font-brand transition-all active:scale-95">
                                            Add New Staff
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white border-none text-slate-900 max-w-2xl rounded-[40px] overflow-hidden p-0 shadow-2xl">
                                        <form onSubmit={handleAddUser}>
                                            <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                                                <DialogHeader>
                                                    <DialogTitle className="text-2xl font-bold tracking-tight font-brand text-slate-800">Add New Staff</DialogTitle>
                                                    <DialogDescription className="text-slate-400 font-semibold text-[10px] uppercase tracking-widest mt-2">Enter the employee details below.</DialogDescription>
                                                </DialogHeader>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 p-10">
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                                        <Input className="bg-slate-50 border-none h-14 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="e.g. John Doe" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                                        <Input className="bg-slate-50 border-none h-14 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 transition-all" type="email" placeholder="john@company.com" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Role</label>
                                                        <Select value={formData.roleName} onValueChange={(v) => setFormData({ ...formData, roleName: v })}>
                                                            <SelectTrigger className="bg-slate-50 border-none h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest px-6">
                                                                <SelectValue placeholder="Select Role" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white border-slate-100 rounded-2xl">
                                                                <SelectItem value="EMPLOYEE">Regular Staff</SelectItem>
                                                                <SelectItem value="HR_ADMIN">HR Manager</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Department</label>
                                                        <Select value={formData.deptId} onValueChange={(v) => setFormData({ ...formData, deptId: v })}>
                                                            <SelectTrigger className="bg-slate-50 border-none h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest px-6">
                                                                <SelectValue placeholder="None" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white border-slate-100 rounded-2xl">
                                                                {depts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Job Title</label>
                                                        <Select value={formData.designationId} onValueChange={(v) => setFormData({ ...formData, designationId: v })}>
                                                            <SelectTrigger className="bg-slate-50 border-none h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest px-6">
                                                                <SelectValue placeholder="None" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white border-slate-100 rounded-2xl">
                                                                {desigs.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Branch</label>
                                                        <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
                                                            <SelectTrigger className="bg-slate-50 border-none h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest px-6">
                                                                <SelectValue placeholder="None" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white border-slate-100 rounded-2xl">
                                                                {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-10 bg-slate-50/50 flex">
                                                <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-black h-16 rounded-[24px] font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95">Add Employee</Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── EMPLOYEE LIST TABLE ── */}
                <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                    {loading ? (
                        <div className="h-[500px] flex flex-col items-center justify-center gap-6 text-slate-400 font-brand">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                            <p className="font-bold text-[12px] uppercase tracking-widest">Loading Employee List...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="h-[500px] flex flex-col items-center justify-center text-center p-12">
                            <div className="p-8 bg-slate-50 rounded-full mb-8 border border-slate-100 opacity-50">
                                <Users className="w-16 h-16 text-slate-300" />
                            </div>
                            <h4 className="text-slate-800 font-bold tracking-tight text-xl font-brand leading-none">No employees found</h4>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-3 max-w-sm leading-relaxed">No staff match your search or filters at this time.</p>
                            <Button variant="link" onClick={() => setSearch("")} className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest mt-6">Reset Search</Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/30 border-b border-slate-100">
                                        <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                                        <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                                        <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                                        <th className="px-10 py-6 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredUsers.map((user, idx) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="group hover:bg-[#fcfcfd] transition-all duration-300"
                                        >
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="relative">
                                                        <Avatar className="h-14 w-14 border border-slate-100 shadow-sm group-hover:scale-110 transition-all duration-500">
                                                            <AvatarImage src={(user as any).avatarUrl} />
                                                            <AvatarFallback className="bg-slate-50 text-[11px] font-bold text-slate-400 leading-none">
                                                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {user.status === 'ACTIVE' && (
                                                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[15px] font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors duration-300 font-brand">
                                                                {user.name}
                                                            </span>
                                                            {user.role?.name === 'ADMIN' && (
                                                                <div className="p-1.5 bg-amber-50 rounded-lg shadow-sm">
                                                                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3 truncate">
                                                            {user.designation?.name || 'New Staff'}
                                                            <span className="text-slate-200">•</span>
                                                            <span className="lowercase font-medium">{user.email}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2.5 text-slate-600">
                                                        <Building className="w-4 h-4 text-indigo-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                                                            {user.department?.name || 'General Staff'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 text-slate-400">
                                                        <MapPin className="w-4 h-4" />
                                                        <span className="text-[11px] font-bold uppercase tracking-wide">
                                                            {user.branch?.name || 'Office'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <Badge className={cn(
                                                    "border-none px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm",
                                                    user.status === 'ACTIVE' ? "bg-emerald-600 text-white" :
                                                        user.status === 'PENDING' ? "bg-amber-100 text-amber-700" :
                                                            "bg-rose-600 text-white"
                                                )}>
                                                    {user.status}
                                                </Badge>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2.5 text-slate-900">
                                                        <Calendar className="w-4 h-4 text-indigo-400" />
                                                        <span className="text-[12px] font-bold tracking-tight">
                                                            {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : "Starting soon"}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Added: {new Date(user.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="p-8 border-t border-slate-50 bg-slate-50/10 flex flex-col sm:flex-row justify-between items-center px-10 gap-6 mt-auto">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-brand">Total: {filteredUsers.length} Employees</p>
                        <div className="flex gap-4">
                            <Button variant="outline" size="sm" className="h-11 px-8 border-slate-100 bg-white text-[10px] font-bold uppercase text-slate-400 tracking-widest hover:bg-slate-50 hover:text-slate-900 rounded-xl shadow-sm transition-all">Previous</Button>
                            <Button variant="outline" size="sm" className="h-11 px-8 border-slate-100 bg-white text-[10px] font-bold uppercase text-slate-400 tracking-widest hover:bg-slate-50 hover:text-slate-900 rounded-xl shadow-sm transition-all">Next</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
