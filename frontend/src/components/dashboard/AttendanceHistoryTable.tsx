"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    RefreshCw 
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

interface TimeEntry {
    id: string
    clockIn: string
    clockOut: string | null
    hoursWorked: number | null
    clockType: string
    status: string
}

export default function AttendanceHistoryTable({ token }: { token: string }) {
    const [history, setHistory] = useState<TimeEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const fetchHistory = async (month: number, year: number) => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API_BASE_URL}/time/history?limit=100&month=${month}&year=${year}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setHistory(Array.isArray(data) ? data : (data.history || []))
            } else {
                setError("Inaccessible temporal logs. Service response failed.")
            }
        } catch (err) {
            setError("Connection severed. Unable to reach core data node.")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const now = new Date()
    const isCurrentMonth = currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear()
    const monthName = format(currentDate, "MMMM yyyy")

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const performPoll = async () => {
            if (!isMounted || document.visibilityState !== 'visible') return;

            try {
                const res = await fetch(`${API_BASE_URL}/time/history?limit=100&month=${currentDate.getMonth()}&year=${currentDate.getFullYear()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.ok && isMounted) {
                    const data = await res.json();
                    setHistory(Array.isArray(data) ? data : (data.history || []));
                }
            } catch (err) {
                // Silently ignore background network errors to avoid overlay
                console.warn("[Background Sync] Node temporarily unreachable.");
            } finally {
                if (isMounted && isCurrentMonth) {
                    timeoutId = setTimeout(performPoll, 10000);
                }
            }
        };

        // Initial fetch
        fetchHistory(currentDate.getMonth(), currentDate.getFullYear());

        // Start polling if current month
        if (isCurrentMonth) {
            timeoutId = setTimeout(performPoll, 10000);
        }

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [token, currentDate, refreshTrigger, isCurrentMonth])

    const handlePrevMonth = () => {
        const d = new Date(currentDate)
        d.setMonth(d.getMonth() - 1)
        setCurrentDate(d)
    }

    const handleNextMonth = () => {
        const d = new Date(currentDate)
        d.setMonth(d.getMonth() + 1)
        setCurrentDate(d)
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>

    return (
        <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 dark:bg-slate-800/20 rounded-t-xl px-6 py-4">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Attendance Log</CardTitle>
                        {isCurrentMonth && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-pulse-slow">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[8px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Live</span>
                            </div>
                        )}
                    </div>
                    <span className="text-xl font-bold uppercase text-slate-900 dark:text-white mt-1">{monthName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                            onClick={handlePrevMonth}
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                            onClick={() => setRefreshTrigger(t => t + 1)}
                            disabled={loading}
                        >
                            <RefreshCw className={cn("w-4 h-4 text-slate-600 dark:text-slate-400", loading && "animate-spin")} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                            onClick={handleNextMonth}
                        >
                            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Clock In</TableHead>
                            <TableHead>Clock Out</TableHead>
                            <TableHead className="text-right">Total Hours</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {error ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-3 text-rose-500">
                                        <AlertCircle className="w-8 h-8 opacity-20" />
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{error}</p>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="mt-2 h-7 text-[9px] font-bold uppercase tracking-widest border-rose-200 text-rose-600 hover:bg-rose-50"
                                            onClick={() => setRefreshTrigger(t => t + 1)}
                                        >
                                            Restart Node Sync
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <AlertCircle className="w-8 h-8" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No entries found for {monthName}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((entry) => {
                                const date = new Date(entry.clockIn).toLocaleDateString()
                                const timeIn = new Date(entry.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                const timeOut = entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"
                                const hours = entry.hoursWorked ? Number(entry.hoursWorked).toFixed(2) : "-"
                                const isLate = new Date(entry.clockIn).getHours() > 9 || (new Date(entry.clockIn).getHours() === 9 && new Date(entry.clockIn).getMinutes() > 30) // Late if after 9:30 AM

                                return (
                                    <TableRow key={entry.id}>
                                        <TableCell className="font-medium">{date}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            {timeIn}
                                            {isLate && <Badge variant="destructive" className="h-5 px-1 text-[10px]">Late</Badge>}
                                        </TableCell>
                                        <TableCell>{timeOut}</TableCell>
                                        <TableCell className="text-right font-mono">{hours}h</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {entry.clockType}
                                                </Badge>
                                                {entry.status === 'COMPLETED' ?
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                                                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin-slow" />
                                                }
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
