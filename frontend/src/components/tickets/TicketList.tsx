"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Ticket, Clock, CheckCircle2, XCircle, ChevronRight, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function TicketList() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(false)

    return (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
            <div className="p-10 pb-6 border-b border-slate-50 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold uppercase text-slate-900 dark:text-white">Ticket <span className="text-indigo-600">Registry</span></h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Manage organizational support requests</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input className="h-10 pl-9 bg-slate-50 dark:bg-slate-950 border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest" placeholder="Search ID..." />
                    </div>
                    <Button variant="outline" className="h-10 rounded-xl font-bold uppercase text-[10px] tracking-widest px-6">Filter ▽</Button>
                </div>
            </div>
            <CardContent className="p-10">
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                    <Ticket className="w-12 h-12 text-slate-200" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active support tickets found in this shard</p>
                </div>
            </CardContent>
        </Card>
    )
}
