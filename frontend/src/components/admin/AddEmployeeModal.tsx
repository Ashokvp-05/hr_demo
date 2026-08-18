"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    X, UserPlus, Mail, Lock, Phone, Building2,
    Briefcase, Users, Calendar, Eye, EyeOff,
    CheckCircle2, Loader2, AlertCircle, Shield,
    Edit3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AddEmployeeModalProps {
    token: string
    employee?: any
    onClose: () => void
    onSuccess: () => void
}

interface SelectOption { id: string; name: string }

const GlobalStyles = () => (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap');
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
    `}</style>
)

export default function AddEmployeeModal({ token, employee, onClose, onSuccess }: AddEmployeeModalProps) {
    const API = process.env.NEXT_PUBLIC_API_URL
    const isEditing = !!employee

    const [form, setForm] = useState({
        name: "", email: "", password: "", phone: "",
        roleId: "", deptId: "", designationId: "", managerId: "",
        employmentType: "FULL_TIME",
        joiningDate: new Date().toISOString().split("T")[0],
    })
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")

    const [roles, setRoles] = useState<SelectOption[]>([])
    const [depts, setDepts] = useState<SelectOption[]>([])
    const [designations, setDesignations] = useState<SelectOption[]>([])
    const [managers, setManagers] = useState<SelectOption[]>([])

    const h = { Authorization: `Bearer ${token}` }

    useEffect(() => {
        if (isEditing) {
            setForm({
                name: employee.name || "",
                email: employee.email || "",
                password: "",
                phone: employee.phone || "",
                roleId: employee.roleId || "",
                deptId: employee.deptId || "",
                designationId: employee.designationId || "",
                managerId: employee.managerId || "",
                employmentType: employee.profile?.employmentType || employee.employmentType || "FULL_TIME",
                joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            })
        }
    }, [employee])

    useEffect(() => {
        const load = async () => {
            try {
                const [rRes, dRes, dgRes, mRes] = await Promise.all([
                    fetch(`${API}/admin/roles`, { headers: h }),
                    fetch(`${API}/organization/departments`, { headers: h }),
                    fetch(`${API}/organization/designations`, { headers: h }),
                    fetch(`${API}/users?limit=ALL`, { headers: h }),
                ])
                if (rRes.ok) setRoles(await rRes.json())
                if (dRes.ok) setDepts(await dRes.json())
                if (dgRes.ok) setDesignations(await dgRes.json())
                if (mRes.ok) {
                    const d = await mRes.json()
                    setManagers(Array.isArray(d) ? d : (d.users || []))
                }
            } catch { /* silent */ }
        }
        load()
    }, [token])

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        
        if (!form.name.trim()) return setError("Full Name is required")
        if (!form.email.trim() || !form.email.includes("@")) return setError("A valid Email Address is required")
        if (!isEditing && (!form.password || form.password.length < 6)) return setError("Password must be at least 6 characters long")
        if (!form.roleId) return setError("Please select a Role")

        setLoading(true)
        try {
            const endpoint = isEditing ? `${API}/admin/employees/${employee.id}` : `${API}/admin/employees`
            const method = isEditing ? "PATCH" : "POST"
            
            const payload = { ...form }
            if (isEditing && !payload.password) delete (payload as any).password

            const res = await fetch(endpoint, {
                method,
                headers: { ...h, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to process employee record")
            
            setSuccess(true)
            toast.success(isEditing ? `✅ ${form.name} updated successfully!` : `✅ ${form.name} added successfully!`)
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const inputCls = "h-12 bg-slate-50/50 border-slate-100 text-slate-900 placeholder:text-slate-400 rounded-2xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium pr-10"
    const labelCls = "text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1 font-brand"
    const selectCls = "w-full h-12 bg-slate-50/50 border border-slate-100 text-slate-900 rounded-2xl text-sm px-4 focus:ring-4 focus:ring-indigo-500/5 outline-none appearance-none cursor-pointer font-medium transition-all"

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[400] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 font-body"
            >
                <GlobalStyles />
                <motion.div 
                    initial={{ scale: 0.98, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 20 }}
                    className="bg-white w-full max-w-2xl rounded-[40px] shadow-[0_32px_120px_rgba(0,0,0,0.15)] overflow-hidden border border-white"
                >
                    {/* Header */}
                    <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-5">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 font-brand leading-none">
                                    {isEditing ? "Edit Details" : "Add Employee"}
                                </h3>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-2 leading-none">
                                    {isEditing ? "Change information" : "Fill out the form below"}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10">
                        {error && (
                            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-10 mb-10">
                            <div className="space-y-6">
                                <div>
                                    <label className={labelCls}>Name</label>
                                    <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full Name" className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Email Address</label>
                                    <Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="name@company.com" className={inputCls} />
                                </div>
                                {(!isEditing || form.password) && (
                                    <div className="relative">
                                        <label className={labelCls}>Password {isEditing && "(Optional)"}</label>
                                        <div className="relative">
                                            <Input type={showPwd ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" className={inputCls} />
                                            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                                                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className={labelCls}>Phone Number</label>
                                    <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 000 000 0000" className={inputCls} />
                                </div>
                            </div>

                             <div className="space-y-6">
                                <div>
                                    <label className={labelCls}>Role</label>
                                    <select value={form.roleId} onChange={e => set("roleId", e.target.value)} className={selectCls}>
                                        <option value="">Select Role</option>
                                        {roles.filter(r => r.name !== 'SUPER_ADMIN').map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className={labelCls}>Job Title</label>
                                    <select value={form.designationId} onChange={e => set("designationId", e.target.value)} className={selectCls}>
                                        <option value="">Select Title</option>
                                        {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Employment Type</label>
                                    <select value={form.employmentType} onChange={e => set("employmentType", e.target.value)} className={selectCls}>
                                        <option value="FULL_TIME">Full-Time Employee</option>
                                        <option value="INTERN">Intern</option>
                                    </select>
                                </div>

                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Secure update</span>
                            </div>
                            <div className="flex gap-4">
                                <Button disabled={loading || success} className={cn(
                                    "h-14 px-12 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 font-brand",
                                    isEditing ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                                )}>
                                    {loading ? "..." : success ? "Done" : isEditing ? "Save Changes" : "Add Employee"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
