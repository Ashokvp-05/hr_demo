"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Lock, Search, Plus, Shield, Key,
    Trash2, ShieldCheck, Instagram, Github, Linkedin, AlertCircle, Save, X,
    Users, UserPlus, XCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Account {
    id: string
    platform: string
    team: string
    status: string
    email: string
    username: string
    notes: string
    authorizedUsers: string[]
}

// Initial Mock Data
const INITIAL_ACCOUNTS: Account[] = [
    {
        id: "1",
        platform: "Instagram",
        team: "Marketing",
        status: "Active",
        email: "marketing@company.com",
        username: "@company_official",
        notes: "Official social media account.",
        authorizedUsers: ["Sarah M. (Marketing Lead)", "John D. (Content Manager)"]
    },
    {
        id: "2",
        platform: "LinkedIn",
        team: "HR Team",
        status: "Active",
        email: "hr@company.com",
        username: "company-linkedin-admin",
        notes: "Used for corporate recruiting.",
        authorizedUsers: ["Priya K. (HR Manager)", "Amit S. (Recruiter)"]
    },
    {
        id: "3",
        platform: "GitHub",
        team: "Dev Team",
        status: "Active",
        email: "dev@company.com",
        username: "company-github-org",
        notes: "Enterprise repository access.",
        authorizedUsers: ["Raj P. (CTO)", "Dev Team (All)"]
    }
]

export default function AccountVault({ token }: { token: string }) {
    const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS)
    const [searchQuery, setSearchQuery] = useState("")
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    
    const [formData, setFormData] = useState<Account>({
        id: "", platform: "", team: "", status: "Active", email: "", username: "", notes: "", authorizedUsers: []
    })
    const [newUserInput, setNewUserInput] = useState("")
    const [viewNewUserInput, setViewNewUserInput] = useState("")
    const [viewAccount, setViewAccount] = useState<Account | null>(null)

    const filteredAccounts = accounts.filter(acc => 
        acc.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.team.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const openAddModal = () => {
        setFormData({ id: "", platform: "", team: "", status: "Active", email: "", username: "", notes: "", authorizedUsers: [] })
        setIsEditing(false)
        setNewUserInput("")
        setIsModalOpen(true)
    }

    const openEditModal = (e: React.MouseEvent, account: Account) => {
        e.stopPropagation()
        setFormData({ ...account, authorizedUsers: [...(account.authorizedUsers || [])] })
        setIsEditing(true)
        setNewUserInput("")
        setIsModalOpen(true)
    }

    const addAuthorizedUser = () => {
        const trimmed = newUserInput.trim()
        if (!trimmed) return
        if (formData.authorizedUsers.includes(trimmed)) {
            toast.error("User already added.")
            return
        }
        setFormData({ ...formData, authorizedUsers: [...formData.authorizedUsers, trimmed] })
        setNewUserInput("")
    }

    const removeAuthorizedUser = (user: string) => {
        setFormData({ ...formData, authorizedUsers: formData.authorizedUsers.filter(u => u !== user) })
    }

    const openViewModal = (account: Account) => {
        setViewAccount(account)
        setIsViewModalOpen(true)
    }

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (confirm("Are you sure you want to permanently delete this account?")) {
            setAccounts(prev => prev.filter(a => a.id !== id))
            toast.success("Account deleted successfully.")
        }
    }

    const handleSave = () => {
        if (!formData.platform || !formData.team) {
            toast.error("Platform and Team are required.")
            return
        }

        if (isEditing) {
            setAccounts(prev => prev.map(a => a.id === formData.id ? formData : a))
            toast.success("Account updated successfully.")
        } else {
            const newAccount = { ...formData, id: Math.random().toString(36).substr(2, 9) }
            setAccounts([...accounts, newAccount])
            toast.success("New account added securely.")
        }
        setIsModalOpen(false)
    }

    const getPlatformIcon = (platform: string) => {
        const p = platform.toLowerCase()
        if (p.includes("instagram")) return <Instagram className="w-5 h-5 text-pink-500" />
        if (p.includes("github")) return <Github className="w-5 h-5 text-slate-800" />
        if (p.includes("linkedin")) return <Linkedin className="w-5 h-5 text-blue-600" />
        return <Shield className="w-5 h-5 text-slate-400" />
    }

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* ── HEADER ── */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-slate-900/10 transition-colors" />
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20 flex items-center justify-center shrink-0">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-brand">Account Vault</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Secure credential management and platform access control.
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search accounts..."
                            className="pl-11 h-12 bg-slate-50/50 border-slate-200 rounded-xl text-[13px] font-medium"
                        />
                    </div>
                    <Button onClick={openAddModal} className="bg-slate-900 hover:bg-indigo-600 text-white rounded-xl h-12 px-6 shadow-md shadow-slate-900/20 transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Account
                    </Button>
                </div>
            </header>

            {/* ── ACCOUNTS TABLE ── */}
            <div className="flex-1 bg-white border border-slate-200/80 rounded-[2rem] shadow-sm flex flex-col overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="col-span-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Platform</div>
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Team</div>
                    <div className="col-span-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Authorized Users</div>
                    <div className="col-span-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</div>
                    <div className="col-span-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</div>
                </div>

                <div className="divide-y divide-slate-100">
                    <AnimatePresence>
                        {filteredAccounts.map((account, idx) => (
                            <motion.div 
                                key={account.id}
                                onClick={() => openViewModal(account)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-slate-50/50 transition-colors group cursor-pointer"
                            >
                                {/* Platform */}
                                <div className="col-span-3 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                        {getPlatformIcon(account.platform)}
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{account.platform}</h3>
                                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{account.username || "No username set"}</p>
                                    </div>
                                </div>

                                {/* Team */}
                                <div className="col-span-2">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[12px] font-bold border border-slate-200/60">
                                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                        {account.team}
                                    </div>
                                </div>

                                {/* Authorized Users */}
                                <div className="col-span-3">
                                    {account.authorizedUsers && account.authorizedUsers.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {account.authorizedUsers.slice(0, 2).map((user, i) => (
                                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-100">
                                                    <Users className="w-3 h-3" />
                                                    {user.split('(')[0].trim()}
                                                </span>
                                            ))}
                                            {account.authorizedUsers.length > 2 && (
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold">
                                                    +{account.authorizedUsers.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-slate-400 italic">No access assigned</span>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="col-span-1">
                                    <Badge variant="secondary" className={cn(
                                        "px-2.5 py-1 text-[11px] font-bold border-none",
                                        account.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", account.status === "Active" ? "bg-emerald-500" : "bg-rose-500")} />
                                        {account.status}
                                    </Badge>
                                </div>


                                {/* Actions */}
                                <div className="col-span-3 flex items-center justify-end gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={(e) => handleDelete(e, account.id)}
                                        className="h-9 w-9 rounded-xl text-rose-500 border-slate-200 hover:bg-rose-50 hover:border-rose-200"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredAccounts.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                            <Lock className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-[14px] font-medium text-slate-500">No accounts stored securely yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── CREATE / EDIT MODAL ── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border border-slate-200/60 rounded-[28px] shadow-2xl bg-white/80 backdrop-blur-3xl">
                    
                    <div className="relative pt-8 pb-6 px-8 border-b border-slate-100/80 bg-gradient-to-b from-slate-50/50 to-transparent">
                        <DialogHeader className="relative z-10">
                            <div className="flex items-center gap-4 mb-1">
                                <div className="w-10 h-10 rounded-[14px] bg-slate-900 shadow-lg shadow-slate-900/20 flex items-center justify-center">
                                    {isEditing ? <Lock className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-white" />}
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                                        {isEditing ? "Edit Account" : "Add Account"}
                                    </DialogTitle>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Secure Vault</p>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="px-8 py-6 space-y-5 bg-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Platform</label>
                                <Input 
                                    value={formData.platform}
                                    onChange={e => setFormData({...formData, platform: e.target.value})}
                                    placeholder="e.g. Instagram"
                                    className="h-11 bg-transparent border-slate-200/80 rounded-xl text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Team</label>
                                <Select value={formData.team} onValueChange={v => setFormData({...formData, team: v})}>
                                    <SelectTrigger className="h-11 bg-transparent border-slate-200/80 rounded-xl text-[13px] font-medium focus:ring-2 focus:ring-slate-900">
                                        <SelectValue placeholder="Select team" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100">
                                        <SelectItem value="Marketing">Marketing</SelectItem>
                                        <SelectItem value="HR Team">HR Team</SelectItem>
                                        <SelectItem value="Dev Team">Dev Team</SelectItem>
                                        <SelectItem value="IT Admin">IT Admin</SelectItem>
                                        <SelectItem value="Finance">Finance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Login Username / Email</label>
                            <Input 
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                                placeholder="Username or Email"
                                className="h-11 bg-transparent border-slate-200/80 rounded-xl text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-slate-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
                            <div className="flex gap-3">
                                <Button 
                                    variant={formData.status === "Active" ? "default" : "outline"}
                                    onClick={() => setFormData({...formData, status: "Active"})}
                                    className={cn("flex-1 rounded-xl h-10 text-[12px] font-bold", formData.status === "Active" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50")}
                                >
                                    Active
                                </Button>
                                <Button 
                                    variant={formData.status === "Suspended" ? "default" : "outline"}
                                    onClick={() => setFormData({...formData, status: "Suspended"})}
                                    className={cn("flex-1 rounded-xl h-10 text-[12px] font-bold", formData.status === "Suspended" ? "bg-rose-500 hover:bg-rose-600 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50")}
                                >
                                    Suspended
                                </Button>
                            </div>
                        </div>

                        {/* Authorized Users */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                Authorized Users
                            </label>
                            <div className="flex gap-2">
                                <Input 
                                    value={newUserInput}
                                    onChange={e => setNewUserInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAuthorizedUser(); } }}
                                    placeholder="e.g. John D. (Marketing Lead)"
                                    className="h-10 bg-transparent border-slate-200/80 rounded-xl text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-slate-900 flex-1"
                                />
                                <Button type="button" onClick={addAuthorizedUser} variant="outline" className="h-10 px-4 rounded-xl text-[12px] font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 shrink-0">
                                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                    Add
                                </Button>
                            </div>
                            {formData.authorizedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {formData.authorizedUsers.map((user, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-[12px] font-semibold border border-indigo-100 group/tag">
                                            <Users className="w-3 h-3 text-indigo-400" />
                                            {user}
                                            <button onClick={() => removeAuthorizedUser(user)} className="ml-0.5 text-indigo-300 hover:text-rose-500 transition-colors">
                                                <XCircle className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1">Press Enter or click Add to assign people who can access these credentials.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Notes (Optional)</label>
                            <Textarea 
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                placeholder="Any additional context..."
                                className="resize-none h-20 bg-transparent border-slate-200/80 rounded-xl text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-slate-900"
                            />
                        </div>
                    </div>

                    <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100/80 flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="h-11 rounded-2xl px-6 text-[12px] font-bold text-slate-500 hover:bg-slate-200">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="h-11 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white px-8 text-[12px] font-bold shadow-xl shadow-slate-900/20 transition-all">
                            <Save className="w-4 h-4 mr-2" />
                            {isEditing ? "Save Changes" : "Secure Account"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* ── VIEW CREDENTIALS MODAL ── */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border border-slate-200/60 rounded-[28px] shadow-2xl bg-white">
                    {viewAccount && (
                        <>
                            <div className="relative px-8 pt-8 pb-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[16px] bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                                        {getPlatformIcon(viewAccount.platform)}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-bold text-slate-900">{viewAccount.platform}</DialogTitle>
                                        <p className="text-[12px] font-medium text-slate-500 mt-0.5">{viewAccount.team}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                {/* Editable Username */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Username / Email</label>
                                    <Input 
                                        value={viewAccount.username || viewAccount.email || ""}
                                        onChange={e => {
                                            const updated = { ...viewAccount, username: e.target.value }
                                            setViewAccount(updated)
                                            setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a))
                                        }}
                                        placeholder="Enter username or email"
                                        className="h-12 bg-slate-50 border-slate-200/60 rounded-xl text-[14px] font-medium text-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-200"
                                    />
                                </div>

                                {/* Editable Notes */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Notes</label>
                                    <Textarea 
                                        value={viewAccount.notes || ""}
                                        onChange={e => {
                                            const updated = { ...viewAccount, notes: e.target.value }
                                            setViewAccount(updated)
                                            setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a))
                                        }}
                                        placeholder="Add notes about this account..."
                                        className="resize-none h-20 bg-slate-50 border-slate-200/60 rounded-xl text-[13px] font-medium text-slate-600 leading-relaxed focus-visible:ring-2 focus-visible:ring-indigo-200"
                                    />
                                </div>

                                {/* Authorized Users — Inline Editable */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        Who Can Handle This Account
                                    </label>

                                    {/* Add New Person Input */}
                                    <div className="flex gap-2">
                                        <Input 
                                            value={viewNewUserInput}
                                            onChange={e => setViewNewUserInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    const trimmed = viewNewUserInput.trim()
                                                    if (!trimmed) return
                                                    if (viewAccount.authorizedUsers.includes(trimmed)) {
                                                        toast.error("Person already added.")
                                                        return
                                                    }
                                                    const updated = { ...viewAccount, authorizedUsers: [...viewAccount.authorizedUsers, trimmed] }
                                                    setViewAccount(updated)
                                                    setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a))
                                                    setViewNewUserInput("")
                                                    toast.success(`${trimmed.split('(')[0].trim()} added successfully`)
                                                }
                                            }}
                                            placeholder="e.g. Alex R. (Designer)"
                                            className="h-10 bg-white border-slate-200/80 rounded-xl text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-indigo-200 flex-1"
                                        />
                                        <Button 
                                            type="button" 
                                            onClick={() => {
                                                const trimmed = viewNewUserInput.trim()
                                                if (!trimmed) return
                                                if (viewAccount.authorizedUsers.includes(trimmed)) {
                                                    toast.error("Person already added.")
                                                    return
                                                }
                                                const updated = { ...viewAccount, authorizedUsers: [...viewAccount.authorizedUsers, trimmed] }
                                                setViewAccount(updated)
                                                setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a))
                                                setViewNewUserInput("")
                                                toast.success(`${trimmed.split('(')[0].trim()} added successfully`)
                                            }}
                                            className="h-10 px-4 rounded-xl text-[12px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0"
                                        >
                                            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                            Add
                                        </Button>
                                    </div>

                                    {viewAccount.authorizedUsers && viewAccount.authorizedUsers.length > 0 ? (
                                        <div className="space-y-2">
                                            {viewAccount.authorizedUsers.map((user, i) => {
                                                const namePart = user.split('(')[0].trim()
                                                const rolePart = user.includes('(') ? user.split('(')[1]?.replace(')', '').trim() : ''
                                                return (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[11px] shrink-0">
                                                            {namePart[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[13px] font-bold text-slate-800 truncate">{namePart}</p>
                                                            {rolePart && <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">{rolePart}</p>}
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                const updated = { ...viewAccount, authorizedUsers: viewAccount.authorizedUsers.filter(u => u !== user) }
                                                                setViewAccount(updated)
                                                                setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a))
                                                                toast.success(`${namePart} removed`)
                                                            }}
                                                            className="text-rose-400 hover:text-rose-600 transition-colors shrink-0"
                                                            title="Remove person"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex justify-end">
                                <Button onClick={() => setIsViewModalOpen(false)} className="h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-8 text-[12px] font-bold shadow-md shadow-indigo-600/20 transition-all">
                                    Close Vault
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
