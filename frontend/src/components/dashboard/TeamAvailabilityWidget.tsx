"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users } from "lucide-react"

const TEAM = [
    { name: "Sarah Connor", role: "Product Manager", status: "ONLINE" },
    { name: "John Doe", role: "Senior Dev", status: "MEETING" },
    { name: "Mike Ross", role: "Designer", status: "OFFLINE" },
    { name: "Rachel Green", role: "HR Lead", status: "LEAVE" },
]

export default function TeamAvailabilityWidget() {
    return (
        <Card className="premium-card shadow-2xl ring-1 ring-slate-200 dark:ring-indigo-500/10 h-full overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/30 dark:bg-black/20">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" /> Crew Intelligence
                        </CardTitle>
                        <CardDescription className="text-xl font-bold text-slate-900 dark:text-white mt-1">Live Availability</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {TEAM.map((member) => (
                    <div key={member.name} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="h-10 w-10 ring-1 ring-border group-hover:ring-indigo-500/50 transition-all">
                                    <AvatarFallback className="font-bold text-[10px] uppercase bg-slate-100 text-slate-500">{member.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${member.status === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                    member.status === 'MEETING' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                        member.status === 'LEAVE' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-slate-400'
                                    }`} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">{member.name}</div>
                                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{member.role}</div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${member.status === 'ONLINE' ? 'text-emerald-500' :
                                member.status === 'MEETING' ? 'text-amber-500' :
                                    member.status === 'LEAVE' ? 'text-rose-500' : 'text-slate-400'
                                }`}>{member.status}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
