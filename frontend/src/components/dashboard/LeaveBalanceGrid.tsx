"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Umbrella, Heart, Plane, PieChart, Loader2, ChevronRight, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface LeaveBalance {
    id: string
    leaveTypeId: string
    leaveTypeConfig: { name: string, code: string }
    total: number
    used: number
    pending: number
}

export default function LeaveBalanceGrid({ token }: { token: string }) {
    const [balances, setBalances] = useState<LeaveBalance[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBalances = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/employee`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                const data = await res.json()
                setBalances(data.leaveBalances || [])
            } catch (err) { console.error(err) }
            finally { setLoading(false) }
        }
        fetchBalances()
    }, [token])

    const getIcon = (code: string) => {
        const c = code.toUpperCase()
        if (c.includes('SICK')) return <Heart className="w-4 h-4 text-rose-500" />
        if (c.includes('PL') || c.includes('VACATION') || c.includes('ANNUAL')) return <Plane className="w-4 h-4 text-primary" />
        return <Umbrella className="w-4 h-4 text-emerald-500" />
    }

    if (loading) return (
        <div className="h-48 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border border-dashed">
            <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loading Balances...</p>
        </div>
    )

    if (balances.length === 0) return (
        <div className="h-48 bg-slate-50 dark:bg-white/5 border border-border border-dashed rounded-2xl flex items-center justify-center text-center p-8">
            <p className="text-muted-foreground font-medium text-xs">No leave entitlements found for the current period.</p>
        </div>
    )

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {balances.map((lb, idx) => {
                const available = lb.total - lb.used - lb.pending
                const usedPercentage = (lb.used / lb.total) * 100
                return (
                    <motion.div
                        key={lb.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-card border border-border p-5 rounded-2xl hover:shadow-sm transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg">
                                    {getIcon(lb.leaveTypeConfig.code)}
                                </div>
                                <h4 className="text-sm font-bold text-foreground">{lb.leaveTypeConfig.name}</h4>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider py-0 px-2 h-5 border-border">
                                {lb.leaveTypeConfig.code}
                            </Badge>
                        </div>

                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-2xl font-bold text-foreground">{available}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Days Available</span>
                        </div>

                        <div className="space-y-3">
                            <Progress value={usedPercentage} className="h-1.5" />
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                <span>Used: {lb.used}d</span>
                                <span>Total: {lb.total}d</span>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
