"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Heart, Plane, Umbrella, Plus,
    Search, Edit3, Trash2,
    Loader2, AlertCircle, CheckCircle2,
    ShieldCheck, Timer, Info,
    ChevronRight, ArrowRight, Settings2,
    CalendarCheck, Sparkles, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface LeaveType {
    id: string
    name: string
    code: string
    totalDays: number
    accrualRate: number
    isCarryForward: boolean
}

export default function LeavePolicyManager({ token }: { token: string }) {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        totalDays: 12,
        accrualRate: 1.0,
        isCarryForward: false
    })

    const fetchLeaveTypes = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-v2/leave-types`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setLeaveTypes(data)
            else toast.error("Failed to load policies")
        } catch (err) { toast.error("Connection error") }
        finally { setLoading(false) }
    }, [token])

    useEffect(() => {
        fetchLeaveTypes()
    }, [fetchLeaveTypes])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-v2/leave-types`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast.success("Leave policy created")
                setIsAddOpen(false)
                fetchLeaveTypes()
            } else {
                toast.error("Failed to create policy")
            }
        } catch (err) { toast.error("Connection error") }
    }

    const getIcon = (code: string) => {
        const c = code.toUpperCase();
        if (c.includes('SICK')) return <Heart className="w-6 h-6 text-rose-400" />
        if (c.includes('PL') || c.includes('VACATION')) return <Plane className="w-6 h-6 text-indigo-400" />
        return <Umbrella className="w-6 h-6 text-emerald-400" />
    }

    return (
        <div className="space-y-8 glass-card p-10 rounded-[40px] border border-white/5 bg-slate-950/60 backdrop-blur-3xl shadow-xl relative overflow-hidden">
            {/* AMBIENT GLOW */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[160px] rounded-full pointer-events-none" />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white uppercase tracking-tight font-brand text-indigo-50 leading-none">Leave Policies</h2>
                    </div>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest ml-11">Manage company leave policies and accrual rates</p>
                </div>

                <div className="flex items-center gap-4">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-600/20 font-bold uppercase text-[10px] tracking-widest gap-2">
                                <Plus className="w-4 h-4" />
                                Add Leave Type
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-lg rounded-[32px]">
                            <form onSubmit={handleCreate}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Policy Settings</DialogTitle>
                                    <DialogDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Define annual quotas and accrual rates.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Leave Name</label>
                                            <Input className="bg-slate-950 border-white/5 h-14 rounded-2xl text-md font-bold" placeholder="e.g. wellness Leave" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Policy Code</label>
                                            <Input className="bg-slate-950 border-white/5 h-14 rounded-2xl text-md font-bold" placeholder="WL-01" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Annual Quota (Days)</label>
                                            <Input type="number" className="bg-slate-950 border-white/5 h-14 rounded-2xl text-md font-bold" value={formData.totalDays} onChange={e => setFormData({ ...formData, totalDays: parseInt(e.target.value) })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Monthly Accrual Rate</label>
                                            <Input type="number" step="0.1" className="bg-slate-950 border-white/5 h-14 rounded-2xl text-md font-bold" value={formData.accrualRate} onChange={e => setFormData({ ...formData, accrualRate: parseFloat(e.target.value) })} />
                                        </div>
                                    </div>

                                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Carry Forward</span>
                                            <p className="text-[8px] text-slate-500 uppercase font-bold">Accumulate unused days into following cycle</p>
                                        </div>
                                        <Switch checked={formData.isCarryForward} onCheckedChange={v => setFormData({ ...formData, isCarryForward: v })} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="w-full bg-white text-black hover:bg-slate-200 h-14 rounded-[20px] font-bold uppercase text-[11px] tracking-widest">Save Policy</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                {loading ? (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center gap-4 text-slate-600">
                        <Loader2 className="w-12 h-12 animate-spin text-emerald-500/50" />
                        <p className="font-bold text-[10px] uppercase tracking-widest">Loading policies...</p>
                    </div>
                ) : leaveTypes.length === 0 ? (
                    <div className="col-span-full h-72 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center p-10 group hover:border-emerald-500/20 transition-all duration-500">
                        <div className="p-8 bg-slate-900 rounded-[32px] border border-white/5 mb-6 group-hover:scale-110 transition-transform duration-700">
                            <Umbrella className="w-12 h-12 text-slate-800" />
                        </div>
                        <h4 className="text-white font-bold uppercase tracking-tight text-xl leading-none">No Leave Policies</h4>
                        <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest mt-3 max-w-sm">Add leave policies to manage employee balances and company welfare policies.</p>
                    </div>
                ) : (
                    leaveTypes.map((lt, idx) => (
                        <motion.div
                            key={lt.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="group bg-slate-900/40 border border-white/5 rounded-[40px] p-8 hover:bg-slate-900/60 transition-all shadow-4xl relative"
                        >
                            <div className="flex justify-between items-start mb-12">
                                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 shadow-inner group-hover:bg-slate-900 transition-colors">
                                    {getIcon(lt.code)}
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-600 hover:text-white hover:bg-white/5 rounded-xl">
                                        <Settings2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-600 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1 mb-10">
                                <h4 className="text-2xl font-bold text-white tracking-tight uppercase truncate">{lt.name}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{lt.code}</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Standard Policy</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-5 bg-slate-950/60 rounded-[28px] border border-white/5">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Annual Cap</span>
                                    <div className="flex items-end gap-1.5">
                                        <span className="text-3xl font-bold text-white leading-none tracking-tight">{lt.totalDays}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">Days</span>
                                    </div>
                                </div>
                                <div className="p-5 bg-slate-950/60 rounded-[28px] border border-white/5">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Accrual</span>
                                    <div className="flex items-end gap-1.5">
                                        <span className="text-3xl font-bold text-emerald-400 leading-none tracking-tight">{lt.accrualRate}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">Mthly</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-2xl border border-white/5">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Carry Forward</span>
                                {lt.isCarryForward ? (
                                    <div className="flex items-center gap-1.5 text-emerald-500">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Active</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Disabled</span>
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-500">
                                <Button variant="link" className="p-0 text-emerald-400 font-bold uppercase text-[10px] tracking-widest gap-2">
                                    View Analytics
                                    <ArrowRight className="w-3 h-3" />
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* ADVISORY SECTION */}
            <div className="mt-16 p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[32px] flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="p-5 bg-indigo-600/20 rounded-2xl border border-indigo-600/20">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin-slow" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h5 className="text-white font-bold uppercase tracking-tight text-lg mb-1">Accrual System</h5>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">The system automatically synchronizes employee balances on the 1st of every month based on designated accrual rates.</p>
                </div>
                <Button className="h-12 border-indigo-500/20 bg-indigo-600/10 hover:bg-indigo-600/30 text-indigo-400 text-[9px] font-bold uppercase tracking-widest px-8 rounded-2xl">Manual Sync</Button>
            </div>
        </div>
    )
}
