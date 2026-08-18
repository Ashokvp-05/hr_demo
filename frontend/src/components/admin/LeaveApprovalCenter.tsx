"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ClipboardList, CheckCircle2, XCircle, Clock,
    User, Calendar, Tag, Loader2, AlertCircle,
    MessageSquare, ChevronDown, Filter, Search, ArrowRight,
    Briefcase, ShieldCheck, Zap, RefreshCcw, UserCheck,
    CalendarDays, CornerDownRight, CloudOff, Info,
    ArrowUpDown, Ellipsis, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Download, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useWebSocket } from "@/hooks/useWebSocket"

interface LeaveRequest {
    id: string
    user: { name: string; email: string; department?: { name: string } }
    type: string
    startDate: string
    endDate: string
    reason?: string
    status: "PENDING" | "APPROVED" | "REJECTED"
    createdAt: string
    approvedBy?: string
    approvedByName?: string
    rejectionReason?: string
}

const TYPE_COLORS: Record<string, string> = {
    SICK: "text-rose-500",
    CASUAL: "text-indigo-500",
    EARNED: "text-emerald-500",
    MEDICAL: "text-amber-500",
    MATERNITY: "text-violet-500",
    PATERNITY: "text-orange-500",
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "New", color: "text-emerald-600", bg: "bg-emerald-50" },
    APPROVED: { label: "Approved", color: "text-emerald-600", bg: "bg-emerald-50" },
    REJECTED: { label: "Rejected", color: "text-rose-500", bg: "bg-rose-50" },
}

type SortKey = "name" | "type" | "department" | "days" | "startDate" | "endDate" | "status"
type SortDir = "asc" | "desc"

export default function LeaveApprovalCenter({ token }: { token: string }) {
    const API = process.env.NEXT_PUBLIC_API_URL
    const [leaves, setLeaves] = useState<LeaveRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL")
    const [search, setSearch] = useState("")
    const [rejectId, setRejectId] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState("")
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [actionMenuId, setActionMenuId] = useState<string | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    // Sorting
    const [sortKey, setSortKey] = useState<SortKey>("startDate")
    const [sortDir, setSortDir] = useState<SortDir>("desc")

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    const fetchLeaves = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API}/leaves/all`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.ok) setLeaves(await res.json())
        } catch { toast.error("Connection error") }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchLeaves() }, [token])

    // ── REAL-TIME WEBSOCKET ──
    const onWsMessage = useCallback((msg: { type: string; payload?: any }) => {
        if (msg.type === 'LEAVE_CREATED') {
            setLeaves(prev => {
                const exists = prev.some(l => l.id === msg.payload?.id)
                if (exists) return prev
                return [msg.payload, ...prev]
            })
            toast.info(`New leave request from ${msg.payload?.user?.name || 'an employee'}`)
        }
        if (msg.type === 'LEAVE_UPDATED') {
            setLeaves(prev => prev.map(l => l.id === msg.payload?.id ? { ...l, ...msg.payload } : l))
        }
        if (msg.type === 'LEAVE_DELETED') {
            setLeaves(prev => prev.filter(l => l.id !== msg.payload?.id))
        }
    }, [])

    const { status: wsStatus } = useWebSocket({ onMessage: onWsMessage, enabled: !!token })

    const approve = async (id: string) => {
        setActionLoading(id)
        try {
            const res = await fetch(`${API}/leaves/${id}/approve`, {
                method: "PUT", headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.ok) {
                toast.success("Leave approved")
                setLeaves(l => l.map(x => x.id === id ? { ...x, status: "APPROVED" } : x))
            }
        } catch { toast.error("Action failed") }
        finally { setActionLoading(null); setActionMenuId(null) }
    }

    const reject = async (id: string) => {
        if (!rejectReason.trim()) { toast.error("Reason required"); return }
        setActionLoading(id)
        try {
            const res = await fetch(`${API}/leaves/${id}/reject`, {
                method: "PUT", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ reason: rejectReason })
            })
            if (res.ok) {
                toast.success("Leave rejected")
                setLeaves(l => l.map(x => x.id === id ? { ...x, status: "REJECTED" } : x))
                setRejectId(null); setRejectReason("")
            }
        } catch { toast.error("Action failed") }
        finally { setActionLoading(null); setActionMenuId(null) }
    }

    const deleteLeave = async (id: string) => {
        setActionLoading(id)
        try {
            const res = await fetch(`${API}/leaves/${id}`, {
                method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.ok) {
                toast.success("Leave request deleted")
                setLeaves(l => l.filter(x => x.id !== id))
                setDeleteConfirmId(null)
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to delete")
            }
        } catch { toast.error("Action failed") }
        finally { setActionLoading(null) }
    }

    const getDays = (start: string, end: string) =>
        Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

    const formatLeaveType = (t: string) => {
        return t.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    }

    // Filter + Search
    const filtered = useMemo(() => {
        return leaves.filter(l =>
            (filter === "ALL" || l.status === filter) &&
            (!search || l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
                l.user?.department?.name?.toLowerCase().includes(search.toLowerCase()))
        )
    }, [leaves, filter, search])

    // Sorting
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let cmp = 0
            switch (sortKey) {
                case "name": cmp = (a.user?.name || "").localeCompare(b.user?.name || ""); break
                case "type": cmp = a.type.localeCompare(b.type); break
                case "department": cmp = (a.user?.department?.name || "").localeCompare(b.user?.department?.name || ""); break
                case "days": cmp = getDays(a.startDate, a.endDate) - getDays(b.startDate, b.endDate); break
                case "startDate": cmp = new Date(a.startDate).getTime() - new Date(b.startDate).getTime(); break
                case "endDate": cmp = new Date(a.endDate).getTime() - new Date(b.endDate).getTime(); break
                case "status": cmp = a.status.localeCompare(b.status); break
            }
            return sortDir === "asc" ? cmp : -cmp
        })
    }, [filtered, sortKey, sortDir])

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
    const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
        else { setSortKey(key); setSortDir("asc") }
    }

    const pendingCount = leaves.filter(l => l.status === "PENDING").length

    const SortHeader = ({ label, sortKeyVal }: { label: string; sortKeyVal: SortKey }) => (
        <th
            className="px-4 py-4 text-left cursor-pointer select-none group"
            onClick={() => toggleSort(sortKeyVal)}
        >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-700 transition-colors">
                {label}
                <ArrowUpDown className={cn("w-3 h-3 transition-colors", sortKey === sortKeyVal ? "text-indigo-500" : "text-slate-300")} />
            </div>
        </th>
    )

    return (
        <div className="min-h-full bg-[#fcfcfd] pb-10">
            <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">
                                Employee&apos;s Leave
                            </h1>
                            {wsStatus === "connected" && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
                                </span>
                            )}
                        </div>
                        {pendingCount > 0 && (
                            <p className="text-[11px] text-slate-400 mt-1.5">{pendingCount} pending request{pendingCount > 1 ? "s" : ""}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <Input
                                value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                                placeholder="Search"
                                className="h-10 w-52 pl-10 border-slate-200 rounded-xl bg-white text-sm placeholder:text-slate-300 focus-visible:ring-indigo-200"
                            />
                        </div>

                        {/* Download Report */}
                        <Button
                            variant="outline"
                            className="h-10 px-5 rounded-xl border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:border-indigo-200 gap-2"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download Report
                        </Button>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => { setFilter(s); setCurrentPage(1) }}
                                    className={cn(
                                        "h-8 px-4 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                                        filter === s
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {s === "PENDING" ? "New" : s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={fetchLeaves}
                            className="h-10 w-10 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl flex items-center justify-center shadow-sm transition-all"
                        >
                            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </button>
                    </div>
                </div>

                {/* ── TABLE ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Loading records...</p>
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-4">
                            <CalendarDays className="w-14 h-14 text-slate-200" />
                            <p className="text-sm font-semibold text-slate-400">No leave records found</p>
                            <p className="text-[11px] text-slate-300">Try adjusting your filters or search query</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            <SortHeader label="Name" sortKeyVal="name" />
                                            <SortHeader label="Leave Type" sortKeyVal="type" />
                                            <SortHeader label="Department" sortKeyVal="department" />
                                            <SortHeader label="Days" sortKeyVal="days" />
                                            <SortHeader label="Start" sortKeyVal="startDate" />
                                            <SortHeader label="End" sortKeyVal="endDate" />
                                            <SortHeader label="Status" sortKeyVal="status" />
                                            <th className="px-4 py-4 text-left">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Responded By</span>
                                            </th>
                                            <th className="px-4 py-4 text-left">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {paginated.map((leave, idx) => (
                                                <motion.tr
                                                    key={leave.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors group"
                                                >
                                                    {/* Name */}
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors shrink-0">
                                                                <span className="text-xs font-bold">{leave.user?.name?.[0]?.toUpperCase() || "E"}</span>
                                                            </div>
                                                            <span className="text-sm font-semibold text-slate-700">{leave.user?.name || "Employee"}</span>
                                                        </div>
                                                    </td>

                                                    {/* Leave Type */}
                                                    <td className="px-4 py-4">
                                                        <span className={cn("text-sm font-semibold", TYPE_COLORS[leave.type] || "text-slate-500")}>
                                                            {formatLeaveType(leave.type)}
                                                        </span>
                                                    </td>

                                                    {/* Department */}
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-slate-500">{leave.user?.department?.name || "—"}</span>
                                                    </td>

                                                    {/* Days */}
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm font-medium text-slate-600">{getDays(leave.startDate, leave.endDate)} Days</span>
                                                    </td>

                                                    {/* Start */}
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-slate-500">{formatDate(leave.startDate)}</span>
                                                    </td>

                                                    {/* End */}
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-slate-500">{formatDate(leave.endDate)}</span>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-4">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-sm",
                                                            leave.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                            leave.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                            "bg-rose-50 text-rose-600 border-rose-100"
                                                        )}>
                                                            <div className={cn("w-1.5 h-1.5 rounded-full",
                                                                leave.status === "PENDING" ? "bg-amber-500" :
                                                                leave.status === "APPROVED" ? "bg-emerald-500" :
                                                                "bg-rose-500"
                                                            )} />
                                                            {leave.status === "PENDING" ? "Pending" : leave.status === "APPROVED" ? "Approved" : "Rejected"}
                                                        </span>
                                                    </td>

                                                    {/* Responded By */}
                                                    <td className="px-4 py-4">
                                                        {leave.status !== "PENDING" && leave.approvedByName ? (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn(
                                                                        "w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0",
                                                                        leave.status === "APPROVED" ? "bg-emerald-500" : "bg-rose-500"
                                                                    )}>
                                                                        {leave.approvedByName?.[0]?.toUpperCase()}
                                                                    </div>
                                                                    <span className="text-[12px] font-semibold text-slate-700">{leave.approvedByName}</span>
                                                                </div>
                                                                {leave.rejectionReason && (
                                                                    <p className="text-[10px] text-rose-500 font-medium pl-8 leading-tight">
                                                                        &ldquo;{leave.rejectionReason}&rdquo;
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : leave.status === "PENDING" ? (
                                                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                                <Clock className="w-3 h-3" />
                                                                Awaiting
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-300">—</span>
                                                        )}
                                                    </td>

                                                    {/* Action */}
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {leave.status === "PENDING" && (
                                                                <>
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        onClick={() => approve(leave.id)} 
                                                                        disabled={actionLoading !== null}
                                                                        className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 shrink-0"
                                                                    >
                                                                        {actionLoading === leave.id ? (
                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                        )}
                                                                        Approve
                                                                    </Button>
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        onClick={() => setRejectId(leave.id)}
                                                                        disabled={actionLoading !== null}
                                                                        className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-1 shrink-0"
                                                                    >
                                                                        <XCircle className="w-3 h-3" />
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                onClick={() => setDeleteConfirmId(leave.id)}
                                                                disabled={actionLoading !== null}
                                                                className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                                                                title="Delete leave request"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>

                            {/* ── PAGINATION ── */}
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-[11px] font-medium text-emerald-500">
                                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} entries
                                </p>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronsLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                        .reduce<(number | "...")[]>((acc, p, i, arr) => {
                                            if (i > 0 && p - (arr[i - 1] || 0) > 1) acc.push("...")
                                            acc.push(p)
                                            return acc
                                        }, [])
                                        .map((p, i) =>
                                            p === "..." ? (
                                                <span key={`dots-${i}`} className="px-2 text-slate-300 text-sm">...</span>
                                            ) : (
                                                <button
                                                    key={p}
                                                    onClick={() => setCurrentPage(p)}
                                                    className={cn(
                                                        "w-9 h-9 rounded-lg text-sm font-semibold transition-all",
                                                        currentPage === p
                                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                                            : "text-slate-500 hover:bg-slate-100"
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            )
                                        )
                                    }

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── REJECT MODAL ── */}
                {rejectId && (
                    <>
                        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => { setRejectId(null); setRejectReason("") }} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl border border-slate-100 shadow-2xl p-8 w-[440px] animate-in fade-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Reject Leave Request</h3>
                            <p className="text-sm text-slate-400 mb-6">Please provide a reason for the rejection.</p>
                            <Input
                                autoFocus
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Enter reason..."
                                className="h-12 border-slate-200 rounded-xl text-sm mb-4"
                            />
                            <div className="flex items-center gap-3 justify-end">
                                <Button
                                    variant="ghost"
                                    onClick={() => { setRejectId(null); setRejectReason("") }}
                                    className="h-10 px-5 rounded-xl text-sm font-medium"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => reject(rejectId)}
                                    disabled={actionLoading === rejectId}
                                    className="h-10 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-100"
                                >
                                    {actionLoading === rejectId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reject"}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── DELETE CONFIRMATION MODAL ── */}
                {deleteConfirmId && (
                    <>
                        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setDeleteConfirmId(null)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl border border-slate-100 shadow-2xl p-8 w-[440px] animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                    <Trash2 className="w-5 h-5 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Delete Leave Request</h3>
                                    <p className="text-sm text-slate-400">This action cannot be undone.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 justify-end mt-6">
                                <Button
                                    variant="ghost"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="h-10 px-5 rounded-xl text-sm font-medium"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => deleteLeave(deleteConfirmId)}
                                    disabled={actionLoading === deleteConfirmId}
                                    className="h-10 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-100 gap-2"
                                >
                                    {actionLoading === deleteConfirmId ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5" /> Delete Permanently</>}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

