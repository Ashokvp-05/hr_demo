"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Clock,
    Check,
    X,
    Eye,
    Briefcase,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/config"
import { LeaveRequest } from "@/types/manager"

interface PendingRequestsListProps {
    token: string;
}

interface DisplayRequest {
    id: string;
    user: string;
    type: string;
    detail: string;
    status: string;
    badgeColor: string;
    icon: React.ElementType;
    original: LeaveRequest;
}

export function PendingRequestsList({ token }: PendingRequestsListProps) {
    const [requests, setRequests] = useState<DisplayRequest[]>([])
    const [loading, setLoading] = useState(true)

    const formatLeaveType = (type: string) => {
        switch (type) {
            case 'SICK': return 'Sick Leave';
            case 'CASUAL': return 'Casual Leave';
            case 'EARNED': return 'Earned Leave';
            case 'MEDICAL': return 'Medical Leave';
            case 'UNPAID': return 'Unpaid Leave';
            default: return 'Leave Request';
        }
    }

    const fetchRequests = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/leaves/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data: LeaveRequest[] = await res.json()
                const pending = data
                    .filter(r => r.status === 'PENDING')
                    .map(r => {
                        const isSick = r.type === 'SICK'
                        const start = new Date(r.startDate)
                        const end = new Date(r.endDate)
                        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

                        return {
                            id: r.id,
                            user: r.user.name || "Unknown User",
                            type: formatLeaveType(r.type),
                            detail: `${days} Day${days > 1 ? 's' : ''} • ${start.toLocaleDateString()}`,
                            status: isSick ? "Urgent" : "Review",
                            badgeColor: isSick
                                ? "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/50"
                                : "bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-900/50",
                            icon: isSick ? Clock : Briefcase,
                            original: r
                        }
                    })
                setRequests(pending)
            }
        } catch {
            console.error("Failed to fetch requests")
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        if (token) fetchRequests()
    }, [token, fetchRequests])

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        const req = requests.find(r => r.id === id)
        if (!req) return

        try {
            const res = await fetch(`${API_BASE_URL}/leaves/${id}/${action}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(action === 'reject' ? { reason: "Manager Action" } : {})
            })

            if (!res.ok) throw new Error("Action failed")

            toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} for ${req.user}`)
            setRequests(prev => prev.filter(r => r.id !== id))
        } catch {
            toast.error("Failed to update request status")
        }
    }

    if (loading) {
        return (
            <div className="p-12 text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Syncing Request Queue...</p>
            </div>
        )
    }

    if (requests.length === 0) {
        return (
            <div className="p-16 text-center flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center shadow-inner group">
                    <Check className="w-8 h-8 text-emerald-500 transform transition-transform group-hover:scale-110" />
                </div>
                <div className="space-y-1">
                    <p className="font-bold uppercase tracking-widest text-xs text-slate-600 dark:text-slate-400">Queue Neutralized</p>
                    <p className="text-[10px] font-bold opacity-60">All pending authorizations have been processed</p>
                </div>
            </div>
        )
    }

    return (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {requests.map((req) => (
                <div key={req.id} className="p-6 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all duration-300 group">
                    <div className="col-span-12 md:col-span-7 flex items-start gap-4">
                        <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-xl ring-1 ring-slate-100 dark:ring-white/5">
                                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${req.user}`} />
                                <AvatarFallback className="font-bold text-indigo-600">{req.user[0]}</AvatarFallback>
                            </Avatar>
                            <span className={cn(
                                "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-800",
                                req.status === "Urgent" ? "bg-rose-500" : "bg-indigo-500"
                            )} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{req.user}</h4>
                                <Badge variant="outline" className={cn("text-[8px] h-4 font-bold uppercase border-none", req.badgeColor)}>
                                    {req.status}
                                </Badge>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                                <req.icon className="w-3 h-3 text-indigo-500" />
                                {req.type}
                            </p>
                            <p className="text-[9px] font-mono font-bold text-slate-400 mt-1" suppressHydrationWarning>{req.detail}</p>
                        </div>
                    </div>

                    <div className="col-span-12 md:col-span-5 flex items-center justify-end gap-3">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                            onClick={() => toast.info(req.original.reason || "No details provided", { icon: <Eye className="w-4 h-4" /> })}
                        >
                            <Eye className="w-3.5 h-3.5 mr-2" /> Inspect
                        </Button>

                        <div className="flex gap-2">
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-9 w-9 p-0 rounded-xl border-slate-200 dark:border-white/5 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all hover:scale-105"
                                onClick={() => handleAction(req.id, 'reject')}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                className="h-9 w-9 p-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 border-0 transition-all hover:scale-105"
                                onClick={() => handleAction(req.id, 'approve')}
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
