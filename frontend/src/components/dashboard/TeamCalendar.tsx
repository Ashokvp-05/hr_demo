"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { Calendar as CalendarIcon, Info, Users, PartyPopper, AlertCircle } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface CalendarEvent {
    id: string
    title: string
    start: string
    end: string
    type: 'LEAVE' | 'HOLIDAY' | 'EVENT'
    color: string
}

export default function TeamCalendar() {
    const { data: session } = useSession()
    const token = (session?.user as any)?.accessToken

    const [date, setDate] = useState<Date | undefined>(new Date())
    const [month, setMonth] = useState<Date>(new Date())
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)

    const fetchCalendarData = useCallback(async () => {
        if (!token) return
        try {
            const start = format(startOfMonth(month), 'yyyy-MM-dd')
            const end = format(endOfMonth(month), 'yyyy-MM-dd')

            const res = await fetch(`${API_BASE_URL}/calendar?start=${start}&end=${end}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setEvents(data)
            }
        } catch {
            console.error("Failed to fetch calendar data")
        } finally {
            setLoading(false)
        }
    }, [token, month])

    useEffect(() => {
        fetchCalendarData()
    }, [fetchCalendarData])

    const selectedDayEvents = events.filter(event => {
        if (!date) return false
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end)
        const checkDate = new Date(date)
        checkDate.setHours(0, 0, 0, 0)
        eventStart.setHours(0, 0, 0, 0)
        eventEnd.setHours(0, 0, 0, 0)

        return checkDate >= eventStart && checkDate <= eventEnd
    })

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'LEAVE': return <Users className="w-4 h-4 text-blue-500" />
            case 'HOLIDAY': return <PartyPopper className="w-4 h-4 text-rose-500" />
            case 'EVENT': return <Info className="w-4 h-4 text-indigo-500" />
            default: return <AlertCircle className="w-4 h-4 text-slate-500" />
        }
    }

    if (loading) {
        return (
            <Card className="col-span-1 md:col-span-1 h-full shadow-lg border-0 bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 animate-pulse">
                <CardHeader className="pb-3 px-6">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-6">
                    <Skeleton className="h-[280px] w-full rounded-xl" />
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-1 md:col-span-1 h-full shadow-lg border-0 bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="pb-3 px-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-indigo-600" />
                            Team Calendar
                        </CardTitle>
                        <CardDescription>Upcoming leaves, holidays & events</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div className="flex flex-col gap-6">
                    <div className="flex justify-center border rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            month={month}
                            onMonthChange={setMonth}
                            className="w-full"
                            modifiers={{
                                holiday: events.filter(e => e.type === 'HOLIDAY').map(e => new Date(e.start)),
                                leave: events.filter(e => e.type === 'LEAVE').map(e => new Date(e.start)),
                                eventGroup: events.filter(e => e.type === 'EVENT').map(e => new Date(e.start)),
                            }}
                            modifiersClassNames={{
                                holiday: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900 rounded-md",
                                leave: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-900 rounded-md",
                                eventGroup: "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-900 rounded-md"
                            }}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                {date ? format(date, 'MMM d, yyyy') : 'Select a date'}
                            </h4>
                            <Badge variant="outline" className="text-[10px] font-bold">
                                {selectedDayEvents.length} Events
                            </Badge>
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 thin-scrollbar">
                            {selectedDayEvents.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-dashed">
                                    <p className="text-xs text-muted-foreground">Nothing scheduled for this day</p>
                                </div>
                            ) : (
                                selectedDayEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-colors shadow-sm"
                                    >
                                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                                            {getEventIcon(event.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                                                {event.title}
                                            </p>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                                                {event.type}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Leaves</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Holidays</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Events</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
