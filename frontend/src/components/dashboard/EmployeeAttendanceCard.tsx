"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Clock, Timer, LogOut, CheckCircle, AlertTriangle, Loader2, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/config"

export default function EmployeeAttendanceCard({ token }: { token: string }) {
    const [status, setStatus] = useState<'IDLE' | 'ACTIVE' | 'LOADING'>('LOADING')
    const [startTime, setStartTime] = useState<string | null>(null)
    const [elapsed, setElapsed] = useState("00:00:00")

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/dashboard/employee`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                const data = await res.json()
                if (data.activeEntry) {
                    setStatus('ACTIVE')
                    setStartTime(data.activeEntry.clockIn)
                } else {
                    setStatus('IDLE')
                }
            } catch (err) { setStatus('IDLE') }
        }
        fetchStatus()
    }, [token])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (status === 'ACTIVE' && startTime) {
            interval = setInterval(() => {
                const start = new Date(startTime).getTime()
                const now = new Date().getTime()
                const diff = now - start
                const h = Math.floor(diff / 3600000).toString().padStart(2, '0')
                const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
                setElapsed(`${h}:${m}:${s}`)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [status, startTime])

    const handleClockAction = async (action: 'IN' | 'OUT') => {
        if (status === 'LOADING') return

        const isClockIn = action === 'IN'
        if (isClockIn && status === 'ACTIVE') return
        if (!isClockIn && status === 'IDLE') return

        setStatus('LOADING')

        try {
            let location = { lat: null as number | null, lng: null as number | null }
            if (isClockIn) {
                try {
                    const pos = await new Promise<GeolocationPosition>((res, rej) => {
                        navigator.geolocation.getCurrentPosition(res, rej, { 
                            enableHighAccuracy: false,
                            timeout: 5000,
                            maximumAge: 0
                        })
                    })
                    location = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                } catch (err: any) {
                    console.warn("GPS bypassed:", err.message)
                    if (err.code === 1) {
                        toast.error("Location access denied. Status updated with limited telemetry.")
                    } else {
                        toast.warning("Temporal node sync without GPS enrichment.")
                    }
                }
            }

            const endpoint = isClockIn ? '/attendance-v2/clock-in-v2' : '/time/clock-out'
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ 
                    lat: location.lat ?? null, 
                    lng: location.lng ?? null,
                    type: 'IN_OFFICE',
                    workLocation: 'Main Office Terminal' 
                })
            })

            if (res.ok) {
                const data = await res.json()
                if (isClockIn) {
                    setStartTime(data.clockIn)
                    setStatus('ACTIVE')
                    toast.success("Attendance start recorded")
                } else {
                    setStatus('IDLE')
                    setStartTime(null)
                    setElapsed("00:00:00")
                    toast.success("Attendance cycle completed")
                }
            } else {
                toast.error("Process failed. Please verify connection.")
                setStatus(isClockIn ? 'IDLE' : 'ACTIVE')
            }
        } catch (err) {
            toast.error("Network synchronization error")
            setStatus(isClockIn ? 'IDLE' : 'ACTIVE')
        }
    }

    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col items-center">
            {/* Background Accent */}
            <div className={cn("absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 transition-colors duration-1000",
                status === 'ACTIVE' ? "bg-emerald-500" : "bg-primary")} />

            <div className="flex flex-col items-center text-center w-full space-y-6">
                {/* Visual Indicator */}
                <div className="relative">
                    <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                        status === 'ACTIVE' ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20" : "bg-slate-50 border-border dark:bg-white/5")}>
                        {status === 'ACTIVE' ? (
                            <Timer className="w-8 h-8 text-emerald-600 dark:text-emerald-500 animate-pulse" />
                        ) : (
                            <Clock className="w-8 h-8 text-muted-foreground opacity-40" />
                        )}
                    </div>
                </div>

                {/* Clock Display */}
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight tabular-nums font-mono text-foreground">{elapsed}</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        {status === 'ACTIVE' ? 'Shift Active' : status === 'LOADING' ? 'Synchronizing...' : 'Session Ended'}
                    </p>
                </div>

                {/* Primary Action Buttons - Dual Mode */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    <Button
                        onClick={() => handleClockAction('IN')}
                        disabled={status !== 'IDLE'}
                        className={cn("h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2 transition-all shadow-sm",
                            status === 'IDLE' ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20" : "bg-slate-100 dark:bg-white/5 text-muted-foreground opacity-50")}>
                        {status === 'LOADING' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Check In
                    </Button>

                    <Button
                        onClick={() => handleClockAction('OUT')}
                        disabled={status !== 'ACTIVE'}
                        className={cn("h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2 transition-all shadow-sm",
                            status === 'ACTIVE' ? "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/10" : "bg-slate-100 dark:bg-white/5 text-muted-foreground opacity-50")}>
                        {status === 'LOADING' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                        Check Out
                    </Button>
                </div>

                {/* Footer Metadata */}
                <div className="w-full pt-5 border-t border-border flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <div className="flex flex-col items-start gap-1">
                        <span className="opacity-60 text-[8px]">Start Time</span>
                        <span className="text-foreground">{startTime ? new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="opacity-60 text-[8px]">GPS Status</span>
                        {status === 'ACTIVE' ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-bold px-1.5 h-4 uppercase tracking-tight">Active</Badge>
                        ) : (
                            <span className="text-foreground">Standby</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
