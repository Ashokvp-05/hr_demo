"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Search, Ticket, Plus, X, Clock, AlertTriangle, CheckCircle2,
    Archive, Send, MessageSquare, User, Loader2, Flame,
    ArrowUpRight, ChevronDown, Ellipsis
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/config"
import dynamic from "next/dynamic"

const EmployeeTicketView = dynamic(() => import("@/components/EmployeeTicketView"), { ssr: false })

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR_MANAGER", "HR", "MANAGER", "HELPDESK_ADMIN", "OPS_ADMIN", "HR_ADMIN"]

type TicketType = {
    id: string; title: string; description: string; priority: string;
    status: string; category: string; token?: string; ticketNumber?: number;
    createdAt: string; module?: string;
    user?: { name: string; email: string };
    assignedTo?: { name: string; email: string } | null;
    comments?: { id: string; content: string; createdAt: string; user: { name: string } }[];
}

const COLUMNS = [
    { id: "OPEN", label: "Open", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
    { id: "IN_PROGRESS", label: "In Progress", icon: Loader2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500" },
    { id: "RESOLVED", label: "Resolved", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
    { id: "CLOSED", label: "Closed", icon: Archive, color: "text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/50", border: "border-slate-200 dark:border-slate-700", dot: "bg-slate-400" },
]

const PRI: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    CRITICAL: { label: "Critical", color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/40", icon: Flame },
    HIGH: { label: "High", color: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-900/40", icon: ArrowUpRight },
    MEDIUM: { label: "Medium", color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/40", icon: ChevronDown },
    LOW: { label: "Low", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800", icon: ChevronDown },
}

const CAT_COLORS: Record<string, string> = {
    BUG: "bg-red-100 text-red-700", FEATURE: "bg-purple-100 text-purple-700",
    ACCOUNT: "bg-sky-100 text-sky-700", PAYROLL: "bg-emerald-100 text-emerald-700",
    ATTENDANCE: "bg-indigo-100 text-indigo-700", OTHER: "bg-slate-100 text-slate-600",
}

function timeAgo(d: string) {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`
}

export default function HelpPage() {
    const { data: session } = useSession()
    const role = ((session?.user as any)?.role || "").toUpperCase()
    const token = (session?.user as any)?.accessToken || ""
    const isAdmin = ADMIN_ROLES.includes(role)

    // Employee view
    if (!isAdmin) return <EmployeeTicketView token={token} />

    // Admin Kanban Board
    return <AdminKanbanBoard token={token} />
}

function AdminKanbanBoard({ token }: { token: string }) {
    const [tickets, setTickets] = useState<TicketType[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [selected, setSelected] = useState<TicketType | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterPriority, setFilterPriority] = useState("ALL")
    const [commentText, setCommentText] = useState("")
    const [sendingComment, setSendingComment] = useState(false)

    const fetchTickets = useCallback(async () => {
        if (!token) return
        try {
            const res = await fetch(`${API_BASE_URL}/tickets`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setTickets(await res.json())
        } catch { } finally { setLoading(false) }
    }, [token])

    useEffect(() => { fetchTickets() }, [fetchTickets])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        const f = e.target as HTMLFormElement
        setCreating(true)
        try {
            const res = await fetch(`${API_BASE_URL}/tickets`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    title: (f.elements.namedItem('title') as HTMLInputElement).value,
                    description: (f.elements.namedItem('description') as HTMLTextAreaElement).value,
                    priority: (f.elements.namedItem('priority') as HTMLSelectElement).value,
                    category: (f.elements.namedItem('category') as HTMLSelectElement).value,
                    module: "HELP_DESK"
                })
            })
            if (res.ok) { toast.success("Ticket created!"); f.reset(); setShowCreate(false); fetchTickets() }
            else toast.error("Failed")
        } catch { toast.error("Network error") } finally { setCreating(false) }
    }

    const handleStatusChange = async (ticketId: string, status: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status })
            })
            if (res.ok) { toast.success(`Ticket moved to ${status.replace("_", " ")}`); fetchTickets() }
        } catch { toast.error("Failed to update") }
    }

    const handleAddComment = async () => {
        if (!selected || !commentText.trim()) return
        setSendingComment(true)
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/${selected.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: commentText })
            })
            if (res.ok) {
                setCommentText("")
                const u = await fetch(`${API_BASE_URL}/tickets/${selected.id}`, { headers: { Authorization: `Bearer ${token}` } })
                if (u.ok) setSelected(await u.json())
                fetchTickets()
            }
        } catch { toast.error("Failed") } finally { setSendingComment(false) }
    }

    const filtered = tickets.filter(t => {
        if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.token?.toLowerCase().includes(searchQuery.toLowerCase())) return false
        if (filterPriority !== "ALL" && t.priority !== filterPriority) return false
        return true
    })

    const getCol = (status: string) => filtered.filter(t => t.status === status)

    return (
        <div className="min-h-full bg-[#f4f5f7] dark:bg-slate-950 font-sans">
            {/* Top Bar */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center"><Ticket className="w-4 h-4 text-white" /></div>
                        <div><h1 className="text-sm font-bold text-slate-900 dark:text-white">Service Desk</h1><p className="text-[10px] text-slate-500">Board View · Admin</p></div>
                    </div>
                    <div className="flex items-center gap-3 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tickets..."
                                className="w-full h-8 pl-9 pr-3 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 dark:text-slate-200" />
                        </div>
                        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                            className="h-8 px-3 text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer">
                            <option value="ALL">All Priority</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
                        </select>
                    </div>
                    <Button onClick={() => setShowCreate(true)} className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold gap-1.5"><Plus className="w-3.5 h-3.5" />Create</Button>
                </div>
            </div>

            {/* Kanban */}
            <div className="max-w-[1800px] mx-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                        {COLUMNS.map(col => {
                            const colTickets = getCol(col.id)
                            return (
                                <div key={col.id} className="flex flex-col min-h-[70vh]">
                                    <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-xl border-t-2", col.border, "bg-white dark:bg-slate-900")}>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2.5 h-2.5 rounded-full", col.dot)} />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{col.label}</span>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{colTickets.length}</span>
                                        </div>
                                    </div>
                                    <div className={cn("flex-1 rounded-b-xl p-2 space-y-2", col.bg, "border border-t-0", col.border)}>
                                        <AnimatePresence>
                                            {colTickets.map(ticket => {
                                                const pri = PRI[ticket.priority] || PRI.MEDIUM
                                                const PI = pri.icon
                                                return (
                                                    <motion.div key={ticket.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                        onClick={() => setSelected(ticket)}
                                                        className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-150 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold text-indigo-500 font-mono">{ticket.token || `ISS-${ticket.ticketNumber}`}</span>
                                                            <span className={cn("inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded", pri.bg, pri.color)}><PI className="w-2.5 h-2.5" />{pri.label}</span>
                                                        </div>
                                                        <h4 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{ticket.title}</h4>
                                                        <div className="flex items-center justify-between">
                                                            <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", CAT_COLORS[ticket.category] || CAT_COLORS.OTHER)}>{ticket.category}</span>
                                                            <div className="flex items-center gap-2">
                                                                {(ticket.comments?.length ?? 0) > 0 && <span className="flex items-center gap-0.5 text-[10px] text-slate-400"><MessageSquare className="w-3 h-3" />{ticket.comments!.length}</span>}
                                                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{timeAgo(ticket.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                        {ticket.user && (
                                                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center"><span className="text-[9px] font-bold text-indigo-600">{ticket.user.name?.charAt(0)}</span></div>
                                                                <span className="text-[10px] text-slate-500 font-medium truncate">{ticket.user.name}</span>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )
                                            })}
                                        </AnimatePresence>
                                        {colTickets.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                                <col.icon className={cn("w-8 h-8 mb-2 opacity-30", col.color)} />
                                                <p className="text-[10px] font-semibold uppercase tracking-wider">No tickets</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-600" />Create Ticket</h2><button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button></div>
                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Title</label><Input name="title" required placeholder="Brief summary" className="h-10 rounded-lg text-sm" /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Priority</label><select name="priority" className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="MEDIUM">Medium</option><option value="LOW">Low</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></div>
                                    <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label><select name="category" className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="BUG">Bug</option><option value="FEATURE">Feature</option><option value="ACCOUNT">Account</option><option value="PAYROLL">Payroll</option><option value="ATTENDANCE">Attendance</option><option value="OTHER">Other</option></select></div>
                                </div>
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label><Textarea name="description" required placeholder="Describe the issue..." className="min-h-[120px] rounded-lg text-sm" /></div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="h-9 px-4 text-xs rounded-lg">Cancel</Button>
                                    <Button type="submit" disabled={creating} className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg gap-1.5">{creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}{creating ? "Creating..." : "Create"}</Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail Modal with Status Control */}
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] border border-slate-200 flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-indigo-500 font-mono bg-indigo-50 px-2.5 py-1 rounded-lg">{selected.token}</span>
                                    <Badge className={cn("text-[9px] font-bold border-0", COLUMNS.find(c => c.id === selected.status)?.bg, COLUMNS.find(c => c.id === selected.status)?.color)}>{selected.status.replace("_", " ")}</Badge>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selected.title}</h2>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    {selected.user && <span className="flex items-center gap-1"><User className="w-3 h-3" />{selected.user.name}</span>}
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(selected.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4"><p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selected.description}</p></div>
                                {/* Status Controls */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Change Status</label>
                                    <div className="flex gap-2">
                                        {COLUMNS.map(c => (
                                            <button key={c.id} onClick={() => { handleStatusChange(selected.id, c.id); setSelected({ ...selected, status: c.id }) }}
                                                className={cn("flex-1 h-9 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border",
                                                    selected.status === c.id ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300")}>
                                                {c.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Comments */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" />Activity ({selected.comments?.length || 0})</h3>
                                    <div className="space-y-3">
                                        {selected.comments?.map(c => (
                                            <div key={c.id} className="flex gap-3">
                                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"><span className="text-[10px] font-bold text-indigo-600">{c.user.name?.charAt(0)}</span></div>
                                                <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                                                    <div className="flex items-center justify-between mb-1"><span className="text-[11px] font-semibold text-slate-700">{c.user.name}</span><span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span></div>
                                                    <p className="text-xs text-slate-600">{c.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
                                <div className="flex gap-2">
                                    <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 h-9 rounded-lg text-sm" onKeyDown={e => e.key === 'Enter' && handleAddComment()} />
                                    <Button onClick={handleAddComment} disabled={sendingComment || !commentText.trim()} className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                                        {sendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

