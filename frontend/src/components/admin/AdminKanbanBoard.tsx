"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Ticket, Plus, X, Clock, AlertTriangle, CheckCircle2, Archive,
    Send, MessageSquare, User, Loader2, Flame, ArrowUpRight,
    ChevronDown, Search
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/config"

type T = {
    id: string; title: string; description: string; priority: string;
    status: string; category: string; token?: string; ticketNumber?: number;
    createdAt: string;
    user?: { name: string; email: string };
    assignedTo?: { name: string; email: string } | null;
    comments?: { id: string; content: string; createdAt: string; user: { name: string } }[];
}
const COLS = [
    { id: "OPEN", label: "Open", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
    { id: "IN_PROGRESS", label: "In Progress", icon: Loader2, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
    { id: "RESOLVED", label: "Resolved", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
    { id: "CLOSED", label: "Closed", icon: Archive, color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400" },
]
const PRI: Record<string, { l: string; c: string; b: string; i: any }> = {
    CRITICAL: { l: "Critical", c: "text-red-700", b: "bg-red-100", i: Flame },
    HIGH: { l: "High", c: "text-orange-700", b: "bg-orange-100", i: ArrowUpRight },
    MEDIUM: { l: "Medium", c: "text-amber-700", b: "bg-amber-100", i: ChevronDown },
    LOW: { l: "Low", c: "text-slate-500", b: "bg-slate-100", i: ChevronDown },
}
const CC: Record<string, string> = {
    BUG: "bg-red-100 text-red-700", FEATURE: "bg-purple-100 text-purple-700",
    ACCOUNT: "bg-sky-100 text-sky-700", PAYROLL: "bg-emerald-100 text-emerald-700",
    ATTENDANCE: "bg-indigo-100 text-indigo-700", OTHER: "bg-slate-100 text-slate-600",
}
function ago(d: string) { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 60) return `${m}m`; const h = Math.floor(m / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d` }

export default function AdminKanbanBoard({ token }: { token: string }) {
    const [tickets, setTickets] = useState<T[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [sel, setSel] = useState<T | null>(null)
    const [sq, setSq] = useState("")
    const [fp, setFp] = useState("ALL")
    const [ct, setCt] = useState("")
    const [sc, setSc] = useState(false)

    const fetch_ = useCallback(async () => {
        if (!token) return
        try { const r = await fetch(`${API_BASE_URL}/tickets`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) setTickets(await r.json()) } catch { } finally { setLoading(false) }
    }, [token])
    useEffect(() => { fetch_() }, [fetch_])

    const create = async (e: React.FormEvent) => {
        e.preventDefault(); const f = e.target as HTMLFormElement; setCreating(true)
        try {
            const r = await fetch(`${API_BASE_URL}/tickets`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: (f.elements.namedItem('title') as HTMLInputElement).value, description: (f.elements.namedItem('description') as HTMLTextAreaElement).value, priority: (f.elements.namedItem('priority') as HTMLSelectElement).value, category: (f.elements.namedItem('category') as HTMLSelectElement).value, module: "HELP_DESK" }) })
            if (r.ok) { toast.success("Ticket created!"); f.reset(); setShowCreate(false); fetch_() } else toast.error("Failed")
        } catch { toast.error("Network error") } finally { setCreating(false) }
    }
    const chgStatus = async (id: string, s: string) => {
        try { const r = await fetch(`${API_BASE_URL}/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: s }) }); if (r.ok) { toast.success(`→ ${s.replace("_"," ")}`); fetch_() } } catch { toast.error("Failed") }
    }
    const addComment = async () => {
        if (!sel || !ct.trim()) return; setSc(true)
        try { const r = await fetch(`${API_BASE_URL}/tickets/${sel.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ content: ct }) })
            if (r.ok) { setCt(""); const u = await fetch(`${API_BASE_URL}/tickets/${sel.id}`, { headers: { Authorization: `Bearer ${token}` } }); if (u.ok) setSel(await u.json()); fetch_() }
        } catch { toast.error("Failed") } finally { setSc(false) }
    }

    const fl = tickets.filter(t => { if (sq && !t.title.toLowerCase().includes(sq.toLowerCase()) && !t.token?.toLowerCase().includes(sq.toLowerCase())) return false; if (fp !== "ALL" && t.priority !== fp) return false; return true })

    return (
        <div className="font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center"><Ticket className="w-4 h-4 text-white" /></div>
                    <div><h2 className="text-sm font-bold text-slate-900">Service Desk</h2><p className="text-[10px] text-slate-500">Kanban Board</p></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input value={sq} onChange={e => setSq(e.target.value)} placeholder="Search..." className="h-8 pl-9 pr-3 text-xs bg-slate-100 border-0 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" /></div>
                    <select value={fp} onChange={e => setFp(e.target.value)} className="h-8 px-3 text-[10px] font-semibold uppercase bg-slate-100 border-0 rounded-lg text-slate-600 cursor-pointer">
                        <option value="ALL">All</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select>
                    <Button onClick={() => setShowCreate(true)} className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold gap-1.5"><Plus className="w-3.5 h-3.5" />Create</Button>
                </div>
            </div>

            {/* Board */}
            {loading ? <div className="flex items-center justify-center h-[50vh]"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                    {COLS.map(col => { const ct2 = fl.filter(t => t.status === col.id); return (
                        <div key={col.id} className="flex flex-col min-h-[60vh]">
                            <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-xl border-t-2", col.border, "bg-white")}>
                                <div className="flex items-center gap-2"><div className={cn("w-2.5 h-2.5 rounded-full", col.dot)} /><span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{col.label}</span>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{ct2.length}</span></div></div>
                            <div className={cn("flex-1 rounded-b-xl p-2 space-y-2 border border-t-0", col.bg, col.border)}>
                                <AnimatePresence>{ct2.map(t => { const p = PRI[t.priority] || PRI.MEDIUM; const PI = p.i; return (
                                    <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        onClick={() => setSel(t)} className="bg-white rounded-lg p-3 border border-slate-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-indigo-500 font-mono">{t.token || `ISS-${t.ticketNumber}`}</span>
                                            <span className={cn("inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded", p.b, p.c)}><PI className="w-2.5 h-2.5" />{p.l}</span></div>
                                        <h4 className="text-[13px] font-semibold text-slate-800 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{t.title}</h4>
                                        <div className="flex items-center justify-between">
                                            <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", CC[t.category] || CC.OTHER)}>{t.category}</span>
                                            <div className="flex items-center gap-2">
                                                {(t.comments?.length ?? 0) > 0 && <span className="flex items-center gap-0.5 text-[10px] text-slate-400"><MessageSquare className="w-3 h-3" />{t.comments!.length}</span>}
                                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{ago(t.createdAt)}</span></div></div>
                                        {t.user && <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100">
                                            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center"><span className="text-[9px] font-bold text-indigo-600">{t.user.name?.charAt(0)}</span></div>
                                            <span className="text-[10px] text-slate-500 font-medium truncate">{t.user.name}</span></div>}
                                    </motion.div>) })}</AnimatePresence>
                                {ct2.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-slate-400"><col.icon className={cn("w-8 h-8 mb-2 opacity-30", col.color)} /><p className="text-[10px] font-semibold uppercase tracking-wider">No tickets</p></div>}
                            </div></div>) })}
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>{showCreate && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-600" />Create Ticket</h2><button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button></div>
                        <form onSubmit={create} className="p-6 space-y-4">
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Title</label><Input name="title" required placeholder="Brief summary" className="h-10 rounded-lg text-sm" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Priority</label><select name="priority" className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="MEDIUM">Medium</option><option value="LOW">Low</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></div>
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label><select name="category" className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="BUG">Bug</option><option value="FEATURE">Feature</option><option value="ACCOUNT">Account</option><option value="PAYROLL">Payroll</option><option value="ATTENDANCE">Attendance</option><option value="OTHER">Other</option></select></div></div>
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label><Textarea name="description" required placeholder="Describe..." className="min-h-[120px] rounded-lg text-sm" /></div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="h-9 px-4 text-xs rounded-lg">Cancel</Button>
                                <Button type="submit" disabled={creating} className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg gap-1.5">{creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}{creating ? "..." : "Create"}</Button></div>
                        </form></motion.div></motion.div>)}</AnimatePresence>

            {/* Detail Modal */}
            <AnimatePresence>{sel && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSel(null)}>
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] border border-slate-200 flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-3"><span className="text-xs font-bold text-indigo-500 font-mono bg-indigo-50 px-2.5 py-1 rounded-lg">{sel.token}</span>
                                <Badge className={cn("text-[9px] font-bold border-0", COLS.find(c => c.id === sel.status)?.bg, COLS.find(c => c.id === sel.status)?.color)}>{sel.status.replace("_"," ")}</Badge></div>
                            <button onClick={() => setSel(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button></div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            <h2 className="text-lg font-bold text-slate-900">{sel.title}</h2>
                            <div className="flex items-center gap-3 text-xs text-slate-500">{sel.user && <span className="flex items-center gap-1"><User className="w-3 h-3" />{sel.user.name}</span>}<span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(sel.createdAt).toLocaleDateString()}</span></div>
                            <div className="bg-slate-50 rounded-xl p-4"><p className="text-sm text-slate-700 whitespace-pre-wrap">{sel.description}</p></div>
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Change Status</label>
                                <div className="flex gap-2">{COLS.map(c => (<button key={c.id} onClick={() => { chgStatus(sel.id, c.id); setSel({ ...sel, status: c.id }) }}
                                    className={cn("flex-1 h-9 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border", sel.status === c.id ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300")}>{c.label}</button>))}</div></div>
                            <div><h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" />Activity ({sel.comments?.length || 0})</h3>
                                <div className="space-y-3">{sel.comments?.map(c => (<div key={c.id} className="flex gap-3"><div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"><span className="text-[10px] font-bold text-indigo-600">{c.user.name?.charAt(0)}</span></div>
                                    <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2"><div className="flex items-center justify-between mb-1"><span className="text-[11px] font-semibold text-slate-700">{c.user.name}</span><span className="text-[10px] text-slate-400">{ago(c.createdAt)}</span></div><p className="text-xs text-slate-600">{c.content}</p></div></div>))}</div></div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 shrink-0"><div className="flex gap-2">
                            <Input value={ct} onChange={e => setCt(e.target.value)} placeholder="Add a comment..." className="flex-1 h-9 rounded-lg text-sm" onKeyDown={e => e.key === 'Enter' && addComment()} />
                            <Button onClick={addComment} disabled={sc || !ct.trim()} className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">{sc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}</Button></div></div>
                    </motion.div></motion.div>)}</AnimatePresence>
        </div>
    )
}
