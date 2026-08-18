"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    ShieldCheck,
    FileText,
    UserCircle,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Zap,
    Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { getProfileLinkByRole } from "@/lib/role-redirect"

interface Ticket {
    id: string
    title: string
    status: string
    priority: string
}

export default function ProfessionalStatusWidget({ token }: { token: string }) {
    const { data: session } = useSession()
    const role = (session?.user as any)?.role
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [profileScore, setProfileScore] = useState(75) // Example hardcoded, ideally from API
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setTickets(data.filter((t: any) => t.status !== 'CLOSED').slice(0, 2))
                }
            } catch (e) {
                console.error("Failed to fetch tickets")
            } finally {
                setLoading(false)
            }
        }
        fetchTickets()
    }, [token])

    const profileLink = getProfileLinkByRole(role)

    return (
        <Card className="premium-card shadow-2xl ring-1 ring-slate-200 dark:ring-indigo-500/10 h-full overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/30 dark:bg-black/20">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Professional Persona
                        </CardTitle>
                        <CardDescription className="text-xl font-bold text-slate-900 dark:text-white mt-1">Status & Protocol</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
                {/* Profile Completion */}
                <div className="space-y-3">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Profile Integrity</p>
                            <div className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">{profileScore}<span className="text-lg text-indigo-500">%</span></div>
                        </div>
                        <Button variant="link" className="text-[9px] font-bold uppercase text-indigo-600 p-0 h-auto hover:no-underline" asChild>
                            <Link href={profileLink}>Execute Full Audit</Link>
                        </Button>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                            style={{ width: `${profileScore}%` }}
                        />
                    </div>
                </div>

                {/* Intelligence Core */}
                <div className="space-y-5 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" /> Intelligence Core
                        </h4>
                        <div className="flex items-center gap-1.5 glass px-2 py-0.5 rounded-full border border-indigo-500/20">
                            <Activity className="w-3 h-3 text-indigo-500" />
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-indigo-600 dark:text-indigo-400">8.6 Peak</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Intensity Score</span>
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">7.8</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `78%` }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground leading-none">Consistency</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `85%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">85%</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground leading-none">Intensity</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: `65%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">65%</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground leading-none">Focus</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `92%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">92%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Requests */}
                <div className="space-y-5">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <FileText className="w-3 h-3 text-indigo-500" /> Command Tickets
                    </h4>

                    {loading ? (
                        <div className="space-y-3">
                            <div className="h-14 bg-slate-50 dark:bg-white/5 animate-pulse rounded-2xl" />
                            <div className="h-14 bg-slate-50 dark:bg-white/5 animate-pulse rounded-2xl" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="py-8 text-center bg-slate-50/30 dark:bg-black/20 border border-dashed border-border/50 rounded-2xl">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Ecosystem Clear</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map(ticket => (
                                <div key={ticket.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-slate-50/30 dark:bg-black/20 hover:border-indigo-500/30 transition-all group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={ticket.status === 'OPEN' ? 'text-amber-500' : 'text-indigo-500'}>
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                                                {ticket.title}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[8px] uppercase font-bold text-indigo-600 bg-indigo-500/10 px-1.5 py-0.5 rounded tracking-widest">{ticket.status}</span>
                                                <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">{ticket.priority} Protocol</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" size="sm" className="h-11 text-[9px] uppercase font-bold tracking-widest border-indigo-500/20 hover:bg-indigo-500/5 rounded-xl" asChild>
                        <Link href="/help">Help Protocol</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="h-11 text-[9px] uppercase font-bold tracking-widest border-indigo-500/20 hover:bg-indigo-500/5 rounded-xl" asChild>
                        <Link href="/reports">Activity Log</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
