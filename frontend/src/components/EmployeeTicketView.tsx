"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Ticket, Plus, X, Clock, Send, MessageSquare, User, Loader2, Flame, ArrowUpRight, ChevronDown, CheckCircle2, AlertTriangle, Archive } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/config"

type TicketType = {
    id: string; title: string; description: string; priority: string;
    status: string; category: string; token?: string; ticketNumber?: number;
    createdAt: string;
    user?: { name: string; email: string };
    comments?: { id: string; content: string; createdAt: string; user: { name: string } }[];
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    CRITICAL: { label: "Critical", color: "text-red-700", bg: "bg-red-100" },
    HIGH: { label: "High", color: "text-orange-700", bg: "bg-orange-100" },
    MEDIUM: { label: "Medium", color: "text-amber-700", bg: "bg-amber-100" },
    LOW: { label: "Low", color: "text-slate-500", bg: "bg-slate-100" },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    OPEN: { label: "Open", color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle },
    IN_PROGRESS: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", icon: Loader2 },
    RESOLVED: { label: "Resolved", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
    CLOSED: { label: "Closed", color: "text-slate-500", bg: "bg-slate-100", icon: Archive },
}

function timeAgo(d: string) {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`
}

export default function EmployeeTicketView({ token }: { token: string }) {
    const [tickets, setTickets] = useState<TicketType[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [selected, setSelected] = useState<TicketType | null>(null)
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
        const title = (f.elements.namedItem('title') as HTMLInputElement).value
        const priority = (f.elements.namedItem('priority') as HTMLSelectElement).value
        const category = (f.elements.namedItem('category') as HTMLSelectElement).value
        const description = (f.elements.namedItem('description') as HTMLTextAreaElement).value
        setCreating(true)
        try {
            const res = await fetch(`${API_BASE_URL}/tickets`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title, description, priority, category, module: "HELP_DESK" })
            })
            if (res.ok) { toast.success("Ticket raised successfully!"); f.reset(); setShowCreate(false); fetchTickets() }
            else toast.error("Failed to create ticket")
        } catch { toast.error("Network error") } finally { setCreating(false) }
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

    return (
        <div className="min-h-full bg-[#f8fafc] p-6 lg:p-10 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">My Tickets</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Raise and track your support requests</p>
                        </div>
                    </div>
                    <Button onClick={() => setShowCreate(true)} className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Raise Ticket
                    </Button>
                </div>

                {/* Ticket List */}
                {loading ? (
                    <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                        <Ticket className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-sm font-bold text-slate-700">No tickets yet</h3>
                        <p className="text-xs text-slate-400 mt-1">Click "Raise Ticket" to create your first support request</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tickets.map(t => {
                            const pri = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM
                            const st = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN
                            const StIcon = st.icon
                            return (
                                <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    onClick={() => setSelected(t)}
                                    className="bg-white rounded-xl p-5 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[10px] font-bold text-indigo-500 font-mono">{t.token || `ISS-${t.ticketNumber}`}</span>
                                                <Badge className={cn("text-[9px] font-bold border-0 px-2 py-0.5", st.bg, st.color)}>
                                                    <StIcon className="w-2.5 h-2.5 mr-1" />{st.label}
                                                </Badge>
                                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", pri.bg, pri.color)}>{pri.label}</span>
                                            </div>
                                            <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{t.title}</h4>
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{t.description}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(t.createdAt)}</span>
                                            {(t.comments?.length ?? 0) > 0 && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 justify-end"><MessageSquare className="w-3 h-3" />{t.comments!.length}</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-600" />Raise Ticket</h2>
                                <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
                            </div>
                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Subject</label>
                                    <Input name="title" required placeholder="Brief summary of the issue" className="h-10 rounded-lg text-sm" /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                                        <select name="priority" className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                                            <option value="MEDIUM">Medium</option><option value="LOW">Low</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                                        </select></div>
                                    <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
                                        <select name="category" className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                                            <option value="OTHER">Other</option><option value="BUG">Bug</option><option value="FEATURE">Feature</option><option value="ACCOUNT">Account</option><option value="PAYROLL">Payroll</option><option value="ATTENDANCE">Attendance</option>
                                        </select></div>
                                </div>
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
                                    <Textarea name="description" required placeholder="Describe your issue..." className="min-h-[120px] rounded-lg text-sm" /></div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="h-9 px-4 text-xs rounded-lg">Cancel</Button>
                                    <Button type="submit" disabled={creating} className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg gap-1.5">
                                        {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}{creating ? "Submitting..." : "Submit Ticket"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail Modal */}
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] border border-slate-200 flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-indigo-500 font-mono bg-indigo-50 px-2.5 py-1 rounded-lg">{selected.token}</span>
                                    <Badge className={cn("text-[9px] font-bold border-0", STATUS_CONFIG[selected.status]?.bg, STATUS_CONFIG[selected.status]?.color)}>{selected.status.replace("_"," ")}</Badge>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <h2 className="text-lg font-bold text-slate-900">{selected.title}</h2>
                                <div className="bg-slate-50 rounded-xl p-4"><p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.description}</p></div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" />Comments ({selected.comments?.length || 0})</h3>
                                    <div className="space-y-3">
                                        {selected.comments?.map(c => (
                                            <div key={c.id} className="flex gap-3">
                                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-bold text-indigo-600">{c.user.name?.charAt(0)}</span>
                                                </div>
                                                <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[11px] font-semibold text-slate-700">{c.user.name}</span>
                                                        <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600">{c.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
                                <div className="flex gap-2">
                                    <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..."
                                        className="flex-1 h-9 rounded-lg text-sm" onKeyDown={e => e.key === 'Enter' && handleAddComment()} />
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
