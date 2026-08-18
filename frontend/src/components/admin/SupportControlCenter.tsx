"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Ticket, MessageSquare, Clock, AlertCircle, CheckCircle2, 
    Filter, Search, User, UserPlus, ChevronRight, Ellipsis,
    Send, Info, ShieldAlert, Activity, BarChart3, TrendingUp,
    Settings, Play, Download, Plus, Loader2, Save, Trash2,
    Bug, Lock, Unlock, Zap, Headphones, Cpu, AlertTriangle,
    RefreshCcw, Globe, CornerDownRight, ArrowRight, CalendarDays
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import { cn } from "@/lib/utils"

const AVATAR_COLORS = [
    "bg-indigo-50 border-indigo-100 text-indigo-600",
    "bg-emerald-50 border-emerald-100 text-emerald-600",
    "bg-rose-50 border-rose-100 text-rose-600",
    "bg-amber-50 border-amber-100 text-amber-600",
    "bg-violet-50 border-violet-100 text-violet-600",
]

const getAvatarColor = (name: string) => {
    if (!name) return AVATAR_COLORS[0]
    const charCode = name.charCodeAt(0)
    return AVATAR_COLORS[charCode % AVATAR_COLORS.length]
}

const PRIORITY_THEMES: Record<string, string> = {
    LOW: "bg-slate-50 text-slate-400 border-none",
    MEDIUM: "bg-indigo-50 text-indigo-600 border-none",
    HIGH: "bg-amber-50 text-amber-600 border-none",
    CRITICAL: "bg-rose-50 text-rose-600 border-none",
}

const STATUS_THEMES: Record<string, string> = {
    OPEN: "bg-indigo-50 text-indigo-600 border-none",
    IN_PROGRESS: "bg-amber-50 text-amber-600 border-none",
    RESOLVED: "bg-emerald-50 text-emerald-600 border-none",
    CLOSED: "bg-slate-100 text-slate-400 border-none",
}

interface TicketComment {
    id: string
    userId: string
    content: string
    isInternal: boolean
    createdAt: string
    user: { name: string, avatarUrl?: string }
}

interface TicketData {
    id: string
    userId: string
    ticketNumber: number
    token: string
    title: string
    description: string
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    category: 'BUG' | 'FEATURE' | 'ACCOUNT' | 'PAYROLL' | 'ATTENDANCE' | 'OTHER'
    createdAt: string
    user: { name: string, email: string, avatarUrl?: string }
    assignedTo?: { name: string, email: string }
    comments: TicketComment[]
}

const GlobalStyles = () => (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        
        .enterprise-card {
            background: #ffffff;
            border: 1px solid #F1F5F9;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .enterprise-card:hover {
            border-color: #E2E8F0;
            box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.05);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F1F5F9; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
    `}</style>
)

export default function SupportControlCenter({ token }: { token: string }) {
    const [tickets, setTickets] = useState<TicketData[]>([])
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('OPEN')

    const fetchData = async () => {
        setLoading(true)
        try {
            const [tRes, aRes] = await Promise.all([
                fetch(`${API_BASE_URL}/tickets`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/tickets/analytics`, { headers: { Authorization: `Bearer ${token}` } })
            ])
            if (tRes.ok) setTickets(await tRes.json())
            if (aRes.ok) setAnalytics(await aRes.json())
        } catch (e) {
            toast.error("Failed to load tickets. System offline.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [token])

    const filtered = tickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                             t.token.toLowerCase().includes(search.toLowerCase()) ||
                             t.user?.name?.toLowerCase().includes(search.toLowerCase())
        const matchesTab = filter === 'ALL' || t.status === filter
        return matchesSearch && matchesTab
    })

    const activeNodesCount = tickets.filter(t => t.status === 'OPEN').length

    return (
        <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm h-full flex flex-col font-body">
            <GlobalStyles />
            
            {/* ── HIGH-DENSITY HEADER (LEAVE STYLE) ── */}
            <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white shrink-0">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-50">
                        <Headphones className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 font-brand">Support Center</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {activeNodesCount} Open · {tickets.length} Total
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full xl:w-auto">

                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar">
                        {(["OPEN", "IN_PROGRESS", "RESOLVED", "ALL"] as const).map(s => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={cn("h-9 px-4 md:px-6 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shrink-0",
                                    filter === s ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600 hover:bg-white/50")}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── SCROLLABLE MANIFEST (LEAVE STYLE) ── */}
            <ScrollArea className="flex-1 bg-slate-50/10 custom-scrollbar">
                <div className="p-6 md:p-8 space-y-5">
                    {loading && tickets.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Loading tickets...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-6">
                            <div className="w-24 h-24 bg-indigo-50 rounded-[40px] flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-indigo-500/10 rounded-[40px] animate-ping" />
                                <ShieldAlert className="w-10 h-10 text-indigo-600 relative z-10" />
                            </div>
                            <div className="text-center">
                                <p className="text-[12px] font-bold uppercase tracking-widest text-slate-800">No Tickets Found</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 font-body">No tickets match your filter</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map((ticket, idx) => (
                                <TicketCard key={ticket.id} ticket={ticket} token={token} onUpdate={fetchData} />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* ── FOOTER PROTOCOL (LEAVE STYLE) ── */}
            <div className="p-6 border-t border-slate-50 bg-white flex justify-between items-center px-10 shrink-0">
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">System Secure</span>
                <button onClick={fetchData} className="flex items-center gap-2.5 text-[10px] font-bold text-indigo-600 uppercase tracking-widest transition-all hover:scale-105 active:scale-95 group font-brand">
                    Refresh
                </button>
            </div>
        </div>
    )
}

function TicketCard({ ticket, token, onUpdate }: { ticket: TicketData, token: string, onUpdate: () => void }) {
    const [actionLoading, setActionLoading] = useState(false)

    const handleQuickResolve = async () => {
        setActionLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: 'RESOLVED' })
            })
            if (res.ok) {
                toast.success("Ticket resolved successfully")
                onUpdate()
            }
        } catch { toast.error("Communication failure") }
        finally { setActionLoading(false) }
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="enterprise-card p-6 md:p-8 rounded-[28px] group bg-white shadow-sm ring-1 ring-slate-100/50 relative overflow-hidden"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-12 relative z-10">
                
                {/* CORE INFO GROUP */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start md:items-center gap-5 flex-col md:flex-row">
                        {/* Dynamic Avatar with Multi-Hue System */}
                        <div className={cn(
                            "w-12 h-12 rounded-[18px] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-transparent transition-all duration-300 group-hover:scale-110",
                            getAvatarColor(ticket.user.name)
                        )}>
                            {ticket.user?.name?.[0]?.toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-1.5">
                                <h4 className="text-[17px] font-bold text-slate-900 tracking-tight font-brand group-hover:text-indigo-600 transition-colors uppercase truncate leading-none">
                                    {ticket.title}
                                </h4>
                                <Badge className={cn("text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg", PRIORITY_THEMES[ticket.priority])}>
                                    {ticket.priority}
                                </Badge>
                                <Badge className={cn("text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg", STATUS_THEMES[ticket.status])}>
                                    {ticket.status.replace('_', ' ')}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                                <span className="text-indigo-500 font-bold tracking-widest uppercase text-[10px] bg-indigo-50/50 px-2 py-0.5 rounded-lg">{ticket.token}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                                <span className="font-bold text-slate-600 uppercase tracking-tight">{ticket.user.name}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                                <span className="truncate">{ticket.user.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* COMPACT METRICS */}
                    <div className="mt-5 flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100/50">
                            <CalendarDays className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Registered: {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category:</Label>
                            <span className="text-[11px] font-bold text-slate-800 tracking-tight font-brand uppercase px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                {ticket.category}
                            </span>
                        </div>
                    </div>

                    {/* PAYLOAD PREVIEW (LEAVE STYLE) */}
                    {ticket.description && (
                        <div className="mt-5 flex items-start gap-3 pl-4 border-l-2 border-indigo-50 leading-relaxed">
                            <CornerDownRight className="w-4 h-4 text-slate-200 mt-1 shrink-0" />
                            <p className="text-[13.5px] text-slate-500 font-medium line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                                "{ticket.description}"
                            </p>
                        </div>
                    )}
                </div>

                {/* ACTION BLOCK - LEAVE STYLE ARRANGEMENT */}
                <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                        {ticket.status !== 'RESOLVED' && (
                            <Button 
                                onClick={handleQuickResolve} 
                                disabled={actionLoading}
                                className="h-14 px-10 bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all active:scale-95 font-brand shadow-xl shadow-slate-200"
                            >
                                {actionLoading ? "..." : "Resolve"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            
        </motion.div>
    )
}

function TicketDetailSheet({ ticket, token, onUpdate }: { ticket: TicketData, token: string, onUpdate: () => void }) {
    const [comment, setComment] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleUpdate = async (data: any) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
            })
            if (res.ok) {
                toast.success("State Synchronized")
                onUpdate()
            }
        } catch (e) {}
    }

    const addComment = async (isInternal = false) => {
        if (!comment) return
        setSubmitting(true)
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/${ticket.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: comment, isInternal })
            })
            if (res.ok) {
                setComment("")
                onUpdate()
                toast.success("Message sent")
            }
        } catch (e) {} finally { setSubmitting(false) }
    }

    const statusThemes: Record<string, string> = {
        OPEN: "bg-indigo-600 text-white",
        IN_PROGRESS: "bg-amber-500 text-white",
        RESOLVED: "bg-emerald-600 text-white",
        CLOSED: "bg-slate-500 text-white"
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="h-12 px-8 text-indigo-600 hover:bg-indigo-50 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-indigo-100/30 font-brand">
                    View
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-white border-l border-slate-100 w-full sm:max-w-[700px] p-0 shadow-2xl flex flex-col font-body">
                {/* ── SHEET HEADER ── */}
                <div className="pt-20 px-10 pb-10 border-b border-slate-50 bg-[#f8fafc] shrink-0">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <Badge className={cn("text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border-none shadow-sm", statusThemes[ticket.status])}>
                                {ticket.status}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-4 py-1.5 rounded-xl">
                                ID: {ticket.token}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 leading-tight font-brand">
                            {ticket.title}
                        </h2>
                    </div>
                </div>

                {/* ── SCROLLABLE BODY ── */}
                <ScrollArea className="flex-1 custom-scrollbar">
                    <div className="p-10 space-y-12">
                        {/* ── METADATA GRID ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</Label>
                                <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center gap-4">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-md", getAvatarColor(ticket.user.name).replace('bg-indigo-50', 'bg-indigo-600').replace('text-indigo-600', 'text-white'))}>
                                        {ticket.user.name?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-slate-800 uppercase truncate">{ticket.user.name}</p>
                                        <p className="text-[10px] font-medium text-slate-400 truncate">{ticket.user.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                                        <button 
                                            key={p}
                                            onClick={() => handleUpdate({ priority: p })}
                                            className={cn(
                                                "h-12 rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all",
                                                ticket.priority === p 
                                                    ? "bg-slate-900 text-white shadow-lg scale-105" 
                                                    : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── DESCRIPTION ── */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Issue Details</Label>
                            <div className="p-8 bg-indigo-50/30 rounded-[32px] border border-indigo-100/50 text-[14px] font-medium text-slate-700 leading-relaxed shadow-sm">
                                "{ticket.description}"
                            </div>
                        </div>

                        {/* ── STATE TRANSITION ── */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Status Control</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { s: 'OPEN', label: 'Open' },
                                    { s: 'IN_PROGRESS', label: 'Investigating' },
                                    { s: 'RESOLVED', label: 'Resolve' }
                                ].map((action) => (
                                    <Button 
                                        key={action.s}
                                        variant="outline"
                                        className={cn(
                                            "h-16 rounded-[20px] flex flex-col items-center justify-center gap-1 transition-all border-slate-100",
                                            ticket.status === action.s 
                                                ? "bg-white border-indigo-600 ring-1 ring-indigo-600 shadow-xl shadow-indigo-100" 
                                                : "bg-slate-50 hover:bg-white"
                                        )}
                                        onClick={() => handleUpdate({ status: action.s })}
                                    >
                                        <span className={cn("text-[9px] font-bold uppercase tracking-widest", ticket.status === action.s ? "text-indigo-600" : "text-slate-400")}>{action.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* ── AUDIT TRAIL ── */}
                        <div className="space-y-8 pt-6 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activity History</Label>
                                <Badge className="bg-slate-100 text-slate-600 text-[9px] font-bold uppercase px-4 py-1 rounded-full border-none">{ticket.comments.length} Messages</Badge>
                            </div>

                            <div className="space-y-8">
                                {ticket.comments.map((c, i) => (
                                    <div key={i} className={cn("flex gap-5", c.userId === ticket.userId ? "justify-start" : "justify-end flex-row-reverse")}>
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] text-white shadow-sm shrink-0", getAvatarColor(c.user.name).replace('bg-', 'bg-').replace('text-', 'text-white').includes('indigo') ? 'bg-indigo-600' : 'bg-slate-800')}>
                                            {c.user.name[0]}
                                        </div>
                                        <div className={cn("space-y-2 max-w-[85%]", c.userId !== ticket.userId && "flex flex-col items-end")}>
                                            <div className={cn(
                                                "p-6 rounded-[28px] relative shadow-sm",
                                                c.userId === ticket.userId 
                                                    ? "bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100" 
                                                    : "bg-slate-900 text-white rounded-tr-none shadow-xl shadow-slate-200",
                                                c.isInternal && "bg-amber-50 text-amber-900 border-amber-200 ring-4 ring-amber-100/50"
                                            )}>
                                                {c.isInternal && <Badge className="absolute -top-3 right-4 bg-amber-500 text-white text-[8px] font-bold uppercase px-3 py-1 shadow-md border-none">Internal</Badge>}
                                                <p className="text-[13px] font-medium leading-relaxed">{c.content}</p>
                                            </div>
                                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest px-2">{new Date(c.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* ── INPUT CHANNEL ── */}
                <div className="p-8 bg-[#f8fafc] border-t border-slate-100 shrink-0">
                    <div className="relative group">
                        <Input 
                            placeholder="Type a message..." 
                            className="h-20 bg-white border-slate-200 rounded-[28px] px-8 text-[12px] font-bold tracking-widest uppercase shadow-sm focus-visible:ring-indigo-600/20 placeholder:text-slate-300"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addComment()}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                className="h-14 px-5 rounded-2xl bg-white border border-slate-200 hover:bg-amber-50 text-amber-600 text-[9px] font-bold uppercase tracking-widest transition-all"
                                onClick={() => addComment(true)}
                            >
                                Internal
                            </Button>
                            <Button 
                                disabled={submitting || !comment} 
                                className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-8 shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                                onClick={() => addComment(false)}
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest">{submitting ? "..." : "Send"}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

