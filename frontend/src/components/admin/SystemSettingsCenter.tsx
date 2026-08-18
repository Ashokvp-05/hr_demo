import { useState, useEffect } from "react"
import { Building2, ShieldCheck, Calendar, Clock, Plus, X, Mail, Loader2, Database } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch as UISwitch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export function SystemSettingsCenter({ token }: { token: string }) {
    const [isSaving, setIsSaving] = useState(false)

    // Form States
    const [companyName, setCompanyName] = useState("Rudratic Enterprise")
    const [address, setAddress] = useState("Cyber Hub Sector 5")
    const [timeZone, setTimeZone] = useState("UTC+05:30 (IST)")
    const [currency, setCurrency] = useState("INR (₹)")
    const [leaveLevels, setLeaveLevels] = useState({ sick: 12, casual: 12, paid: 15 })
    const [carryForward, setCarryForward] = useState(true)
    const [shiftStart, setShiftStart] = useState("09:00")
    const [shiftEnd, setShiftEnd] = useState("18:00")
    const [lateProtocol, setLateProtocol] = useState(true)
    const [overtime, setOvertime] = useState(false)
    const [weeklyOffs, setWeeklyOffs] = useState<number[]>([5, 6]) // 0-based for M T W T F S S

    // Holiday States
    const [holidays, setHolidays] = useState<any[]>([])
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false)
    const [holidayForm, setHolidayForm] = useState({ name: "", date: "" })
    const [isSavingHoliday, setIsSavingHoliday] = useState(false)

    // SMTP States
    const [smtpServer, setSmtpServer] = useState("")
    const [smtpPort, setSmtpPort] = useState("587")
    const [smtpUsername, setSmtpUsername] = useState("")
    const [smtpPassword, setSmtpPassword] = useState("")
    const [senderEmail, setSenderEmail] = useState("")
    const [enableTls, setEnableTls] = useState(true)
    const [isTestingSmtp, setIsTestingSmtp] = useState(false)

    // Demo Reset States
    const [isResettingDemo, setIsResettingDemo] = useState(false)
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

    const handleResetDemoData = async () => {
        setIsResettingDemo(true)
        const toastId = toast.loading("Resetting and seeding demo database...")
        try {
            const secret = process.env.NEXT_PUBLIC_ADMIN_APPROVE_SECRET || "rudratic-admin-2026"
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api"
            const res = await fetch(`${apiBase}/demo/reset?secret=${secret}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                toast.success("Demo database reset successfully!", { id: toastId })
                setIsResetDialogOpen(false)
                setTimeout(() => window.location.reload(), 1500)
            } else {
                toast.error(data.error || "Reset failed", { id: toastId })
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to connect to reset endpoint", { id: toastId })
        } finally {
            setIsResettingDemo(false)
        }
    }

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/holidays`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                const data = await res.json()
                setHolidays(Array.isArray(data) ? data : (data.holidays || []))
            } catch (err) {}
        }
        
        const fetchSmtpSettings = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/settings/email`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    if (data.server) {
                        setSmtpServer(data.server)
                        setSmtpPort(data.port?.toString() || "587")
                        setSmtpUsername(data.username || "")
                        setSenderEmail(data.senderEmail || "")
                        setEnableTls(data.enableTls ?? true)
                    }
                }
            } catch (err) {}
        }

        fetchHolidays()
        fetchSmtpSettings()
    }, [token])

    const saveHoliday = async () => {
        if (!holidayForm.name || !holidayForm.date) return toast.error("Please provide both name and date")
        setIsSavingHoliday(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/holidays`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(holidayForm)
            })
            if (res.ok) {
                toast.success("Holiday successfully added!")
                setIsHolidayModalOpen(false)
                setHolidayForm({ name: "", date: "" })
                const updatedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/holidays`, { headers: { "Authorization": `Bearer ${token}` }})
                const updatedData = await updatedRes.json()
                setHolidays(Array.isArray(updatedData) ? updatedData : (updatedData.holidays || []))
            } else {
                const errData = await res.json().catch(() => ({ error: "Unknown server error" }))
                toast.error(errData.error || `Failed to add holiday (${res.status})`)
            }
        } catch (err) {
            toast.error("Network connection error")
        } finally {
            setIsSavingHoliday(false)
        }
    }

    const testSmtpConnection = async () => {
        if (!smtpServer || !smtpPort) return toast.error("Server and Port are required to test connection")
        setIsTestingSmtp(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/settings/test-smtp`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ server: smtpServer, port: smtpPort, username: smtpUsername, password: smtpPassword, senderEmail, enableTls })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success("SMTP Connection Successful!")
            } else {
                toast.error(data.error || "SMTP Connection Failed")
            }
        } catch (err) {
            toast.error("Network connection error")
        } finally {
            setIsTestingSmtp(false)
        }
    }

    const saveSmtpSettings = async () => {
        if (!smtpServer || !smtpPort || !senderEmail) return toast.error("Server, Port, and Sender Email are required")
        const toastId = toast.loading("Saving SMTP Settings...")
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/settings/email`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ server: smtpServer, port: smtpPort, username: smtpUsername, password: smtpPassword, senderEmail, enableTls })
            })
            if (res.ok) {
                toast.success("SMTP Settings Saved!", { id: toastId })
            } else {
                toast.error("Failed to save SMTP settings", { id: toastId })
            }
        } catch (err) {
            toast.error("Network connection error", { id: toastId })
        }
    }

    // Role Models & States
    const [roles, setRoles] = useState([
        { id: 1, name: "Super Admin", access: "Full System View/Edit", users: 2, color: "emerald", permissions: { viewAll: true, editUsers: true, managePayroll: true, modifyPolicies: true } },
        { id: 2, name: "Admin", access: "Organization Management", users: 3, color: "indigo", permissions: { viewAll: true, editUsers: true, managePayroll: true, modifyPolicies: false } },
        { id: 3, name: "HR Manager", access: "Personnel & Payroll", users: 5, color: "violet", permissions: { viewAll: true, editUsers: true, managePayroll: true, modifyPolicies: false } },
        { id: 4, name: "Manager", access: "Team Management & Reports", users: 8, color: "amber", permissions: { viewAll: true, editUsers: false, managePayroll: false, modifyPolicies: false } },
        { id: 5, name: "Standard Employee", access: "Self-Service Only", users: 156, color: "slate", permissions: { viewAll: false, editUsers: false, managePayroll: false, modifyPolicies: false } }
    ])
    
    // Modal States
    const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<any>(null)
    const [roleForm, setRoleForm] = useState({ name: "", access: "", color: "indigo", permissions: { viewAll: false, editUsers: false, managePayroll: false, modifyPolicies: false } })

    const handleSave = () => {
        setIsSaving(true)
        const toastId = toast.loading("Saving settings...")
        setTimeout(() => {
            setIsSaving(false)
            toast.success("Settings updated successfully", { id: toastId })
        }, 1500)
    }

    const toggleOffDay = (idx: number) => {
        if (weeklyOffs.includes(idx)) {
            setWeeklyOffs(weeklyOffs.filter(i => i !== idx))
        } else {
            setWeeklyOffs([...weeklyOffs, idx])
        }
    }



    const openRoleSheet = (role: any = null) => {
        if (role) {
            setEditingRole(role.id)
            setRoleForm({ name: role.name, access: role.access, color: role.color, permissions: { ...role.permissions } })
        } else {
            setEditingRole(null)
            setRoleForm({ name: "", access: "", color: "indigo", permissions: { viewAll: false, editUsers: false, managePayroll: false, modifyPolicies: false } })
        }
        setIsRoleSheetOpen(true)
    }

    const saveRole = () => {
        if (!roleForm.name) return toast.error("Role Name is required")
        
        if (editingRole) {
            setRoles(roles.map(r => r.id === editingRole ? { ...r, ...roleForm } : r))
            toast.success(`Role '${roleForm.name}' updated`)
        } else {
            setRoles([...roles, { id: Date.now(), users: 0, ...roleForm }])
            toast.success("New role created successfully")
        }
        setIsRoleSheetOpen(false)
    }

    const deleteRole = (id: number) => {
        setRoles(roles.filter(r => r.id !== id))
        setIsRoleSheetOpen(false)
        toast.success("Role removed successfully")
    }

    return (
        <div className="bg-[#f0f2f8] h-full flex flex-col font-sans mb-12">
            <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 leading-none font-brand">Settings</h2>
                    <p className="text-[11px] font-medium text-slate-500 mt-3 leading-none font-body">Manage your organizational settings and policies.</p>
                </div>
                <Button onClick={handleSave} className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[20px] px-10 text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-200">
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 custom-scrollbar pb-10">

                {/* 1. Company Profile */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Building2 className="w-5 h-5" /></div>
                        <h4 className="text-[14px] font-bold text-slate-800 uppercase tracking-widest">1. Company Profile</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Company Name</label>
                            <Input className="h-14 bg-slate-50 border-none rounded-[16px] font-bold px-6 text-sm" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Physical Address</label>
                            <Input className="h-14 bg-slate-50 border-none rounded-[16px] font-bold px-6 text-sm" value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Time Zone</label>
                                <select className="w-full h-14 bg-slate-50 border-none rounded-[16px] font-bold px-6 text-[12px] outline-none appearance-none" value={timeZone} onChange={e => setTimeZone(e.target.value)}>
                                    <option>UTC+05:30 (IST)</option>
                                    <option>UTC+00:00 (GMT)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Currency</label>
                                <select className="w-full h-14 bg-slate-50 border-none rounded-[16px] font-bold px-6 text-[12px] outline-none appearance-none" value={currency} onChange={e => setCurrency(e.target.value)}>
                                    <option>INR (₹)</option>
                                    <option>USD ($)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Roles & Permissions */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck className="w-5 h-5" /></div>
                            <h4 className="text-[14px] font-bold text-slate-800 uppercase tracking-widest">2. Roles & Permissions</h4>
                        </div>
                        <Button onClick={() => openRoleSheet()} variant="outline" size="sm" className="h-8 rounded-lg text-[9px] font-bold uppercase tracking-widest"><Plus className="w-3 h-3 mr-1" /> New Role</Button>
                    </div>
                    <div className="space-y-4">
                        {roles.map((role) => (
                            <div key={role.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50/50 rounded-[20px] border border-slate-50">
                                <div>
                                    <p className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">{role.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{role.access}</p>
                                </div>
                                <div className="mt-3 sm:mt-0 flex gap-3 items-center">
                                    <Badge className="bg-white text-slate-600 border-slate-200 uppercase text-[9px] font-bold shadow-none">{role.users} Users</Badge>
                                    <Button onClick={() => openRoleSheet(role)} variant="ghost" size="sm" className="h-8 text-[9px] font-bold uppercase bg-slate-100 hover:bg-slate-200">Edit Access</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Leave Policy */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Calendar className="w-5 h-5" /></div>
                        <h4 className="text-[14px] font-bold text-slate-800 uppercase tracking-widest">3. Leave Policy</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { key: "sick", type: "Sick Leave", count: leaveLevels.sick },
                            { key: "casual", type: "Casual Leave", count: leaveLevels.casual },
                            { key: "paid", type: "Paid Leave", count: leaveLevels.paid }
                        ].map((lv, i) => (
                            <div key={i} className="p-5 bg-slate-50 rounded-[24px] text-center border border-slate-100">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{lv.type}</span>
                                <Input type="number" value={lv.count} onChange={e => setLeaveLevels(prev => ({ ...prev, [lv.key]: Number(e.target.value) }))} className="h-12 bg-white border-slate-200 rounded-xl text-center font-bold text-indigo-600 mx-auto w-20 text-lg" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[20px] border border-slate-50">
                            <div>
                                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">Allow Carry Forward</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Move unutilized PL to next cycle</p>
                            </div>
                            <UISwitch checked={carryForward} onCheckedChange={setCarryForward} />
                        </div>
                    </div>
                </div>

                {/* 4. Attendance Rules */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock className="w-5 h-5" /></div>
                        <h4 className="text-[14px] font-bold text-slate-800 uppercase tracking-widest">4. Attendance Rules</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Shift Start</label>
                            <Input type="time" className="h-12 bg-slate-50 border-none rounded-xl font-bold px-4 text-sm" value={shiftStart} onChange={e => setShiftStart(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Shift End</label>
                            <Input type="time" className="h-12 bg-slate-50 border-none rounded-xl font-bold px-4 text-sm" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-slate-50 mt-4">
                        <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[20px] border border-slate-50">
                            <div>
                                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">Late Policy</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Half-day deduction after 3 late logs</p>
                            </div>
                            <UISwitch checked={lateProtocol} onCheckedChange={setLateProtocol} />
                        </div>
                        <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[20px] border border-slate-50">
                            <div>
                                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">Overtime Compensation</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Paid extra for work post 6:30 PM</p>
                            </div>
                            <UISwitch checked={overtime} onCheckedChange={setOvertime} />
                        </div>
                    </div>
                </div>


                {/* 6. Email & SMTP Configuration */}
                <div className="xl:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl"><Mail className="w-5 h-5" /></div>
                            <h4 className="text-[14px] font-bold text-slate-800 uppercase tracking-widest">6. Email & SMTP Configuration</h4>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={testSmtpConnection} disabled={isTestingSmtp} variant="outline" size="sm" className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest px-6 hover:bg-slate-50">
                                {isTestingSmtp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Test Connection
                            </Button>
                            <Button onClick={saveSmtpSettings} className="h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest px-6 shadow-lg shadow-violet-200">
                                Save SMTP
                            </Button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">SMTP Server</label>
                                <Input value={smtpServer} onChange={e => setSmtpServer(e.target.value)} placeholder="e.g. smtp.gmail.com" className="h-14 bg-slate-50 border-none rounded-[16px] font-bold px-6 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">SMTP Port</label>
                                <Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="e.g. 465 or 587" className="h-14 bg-slate-50 border-none rounded-[16px] font-bold px-6 text-sm" />
                            </div>
                            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[20px] border border-slate-50 mt-2">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">Enable TLS/SSL</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Required for Gmail & secure providers</p>
                                </div>
                                <UISwitch checked={enableTls} onCheckedChange={setEnableTls} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">SMTP Username</label>
                                <Input value={smtpUsername} onChange={e => setSmtpUsername(e.target.value)} placeholder="Your email or API key" className="h-14 bg-slate-50 border-none rounded-[16px] font-bold px-6 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">SMTP Password</label>
                                <Input type="password" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)} placeholder="Leave blank to keep existing password" className="h-14 bg-slate-50 border-none rounded-[16px] font-bold px-6 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Sender Email</label>
                                <Input value={senderEmail} onChange={e => setSenderEmail(e.target.value)} placeholder="e.g. your_email@gmail.com" className="h-14 bg-slate-50 border-none rounded-[16px] font-bold px-6 text-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7. Demo Environment Controls */}
                <div className="xl:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Database className="w-5 h-5" /></div>
                        <h4 className="text-[14px] font-bold text-slate-800 uppercase tracking-widest">7. Demo Environment Controls</h4>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <p className="text-[13px] font-bold text-slate-800 uppercase tracking-tight">Reset Demo Database</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Restore default demo data (12 employees, 30 days of attendance, leave requests, 3 months of payslips).</p>
                        </div>
                        <Button
                            onClick={() => setIsResetDialogOpen(true)}
                            disabled={isResettingDemo}
                            className="h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest px-6 shadow-lg shadow-rose-200"
                        >
                            {isResettingDemo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Reset Demo Data
                        </Button>
                    </div>
                </div>

            </div>

            {/* ROLE SHEET */}
            <Sheet open={isRoleSheetOpen} onOpenChange={setIsRoleSheetOpen}>
                <SheetContent className="bg-white border-l border-slate-50 w-full sm:max-w-[500px] p-0 shadow-2xl overflow-y-auto custom-scrollbar">
                    <SheetHeader className="pt-12 px-8 pb-8 border-b border-slate-50/50 bg-slate-50/30">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100/50 shrink-0">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <SheetTitle className="text-xl font-bold uppercase tracking-tight text-slate-800 leading-tight">Role Settings</SheetTitle>
                                <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">{editingRole ? "Update existing role permissions" : "Create new user role"}</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="p-8 space-y-10">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role Name</label>
                                <Input value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} className="h-12 bg-slate-50 border-none rounded-xl font-bold px-4 text-sm" placeholder="e.g. Finance Auditor" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                                <Input value={roleForm.access} onChange={e => setRoleForm({ ...roleForm, access: e.target.value })} className="h-12 bg-slate-50 border-none rounded-xl font-bold px-4 text-sm" placeholder="e.g. Manage payroll and employees..." />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-50 pb-2">Permissions</p>
                            <div className="space-y-4">
                                {[
                                    { key: "viewAll", label: "View All Users", sub: "Can view records of all employees" },
                                    { key: "editUsers", label: "Manage Personnel", sub: "Can add, edit, or remove employees" },
                                    { key: "managePayroll", label: "Payroll Control", sub: "Can manage salary and payments" },
                                    { key: "modifyPolicies", label: "Edit Settings", sub: "Can change global rules and policies" }
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-50 rounded-[16px]">
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{p.label}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">{p.sub}</p>
                                        </div>
                                        <UISwitch 
                                            checked={(roleForm.permissions as any)[p.key]} 
                                            onCheckedChange={val => setRoleForm({ ...roleForm, permissions: { ...roleForm.permissions, [p.key]: val } })} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex gap-4 pt-4 border-t border-slate-50">
                            <Button className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest" onClick={saveRole}>
                                Save Role
                            </Button>
                            {editingRole && editingRole !== 1 && (
                                <Button className="h-12 w-12 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center p-0" onClick={() => deleteRole(editingRole)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
                <DialogContent className="max-w-md bg-white border-none rounded-[32px] p-8 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-800 font-brand">Add New Holiday</DialogTitle>
                        <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Register a public holiday</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 my-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest pl-2">Holiday Title</label>
                            <Input 
                                value={holidayForm.name} 
                                onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })} 
                                placeholder="e.g. Independence Day" 
                                className="h-12 bg-slate-50 border-none rounded-xl text-sm font-bold placeholder:text-slate-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest pl-2">Holiday Date</label>
                            <Input 
                                type="date"
                                value={holidayForm.date} 
                                onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })} 
                                className="h-12 bg-slate-50 border-none rounded-xl text-sm font-bold"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            onClick={saveHoliday} 
                            disabled={isSavingHoliday}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-200"
                        >
                            {isSavingHoliday ? "Adding..." : "Save Holiday"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DEMO RESET CONFIRMATION DIALOG */}
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent className="max-w-md bg-white border-none rounded-[32px] p-8 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-800 font-brand">Reset Demo Database?</DialogTitle>
                        <DialogDescription className="text-xs font-bold text-rose-500 uppercase tracking-widest">Warning: This action is destructive</DialogDescription>
                    </DialogHeader>
                    <div className="my-6">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Are you sure you want to reset the demo database? This will clear any changes made during this demo session and repopulate the portal with clean sample records (employees, logs, leave records, and payslips).
                        </p>
                    </div>
                    <DialogFooter className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsResetDialogOpen(false)}
                            className="flex-1 h-12 rounded-xl text-[11px] font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleResetDemoData}
                            disabled={isResettingDemo}
                            className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-rose-200"
                        >
                            {isResettingDemo ? "Resetting..." : "Confirm Reset"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
