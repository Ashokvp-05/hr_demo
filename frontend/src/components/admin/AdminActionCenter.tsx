"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Clock, Calendar, Check, X,
    MoreVertical, Eye, ShieldCheck,
    AlertCircle, UserCheck, Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface LeaveRequest {
    id: string
    userId: string
    user: { name: string, email: string }
    startDate: string
    endDate: string
    type: string
    reason: string
    status: string
}

export default function AdminActionCenter({ token, pendingLeaves = [] }: { token: string, pendingLeaves: LeaveRequest[], pendingUsers?: any[], minimal?: boolean }) {
    const [localLeaves, setLocalLeaves] = useState<LeaveRequest[]>(pendingLeaves)

    const handleAction = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-v2/approve-v2/${requestId}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.ok) {
                toast.success(`Leave request ${action.toLowerCase()} successfully`)
                setLocalLeaves(prev => prev.filter(l => l.id !== requestId))
            } else {
                toast.error("Process failed")
            }
        } catch (err) { toast.error("Connection lost") }
    }

    return (
        <div className="space-y-4">
            {localLeaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
                    <p className="text-[10px] font-bold uppercase tracking-widest">All caught up</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {localLeaves.map((leave, idx) => (
                        <motion.div
                            key={leave.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-indigo-500/20 transition-all duration-300 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wide text-sm">{leave.user?.name || "User"}</h4>
                                        <Badge className="text-[8px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/10 h-4">Pending</Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{leave.type} LEAVE</span>
                                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-800" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-auto flex items-center justify-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/5">
                                <Button size="sm" variant="outline" className="h-10 border-slate-200 dark:border-white/5 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-[9px] font-bold uppercase tracking-widest px-4 rounded-xl">View Details</Button>
                                <Button onClick={() => handleAction(leave.id, 'REJECTED')} size="sm" variant="ghost" className="h-10 border-slate-200 dark:border-white/5 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-[9px] font-bold uppercase tracking-widest px-4 rounded-xl text-rose-500">Reject</Button>
                                <Button onClick={() => handleAction(leave.id, 'APPROVED')} size="sm" className="h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest px-4">Approve</Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
