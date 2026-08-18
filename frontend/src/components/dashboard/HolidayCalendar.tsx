"use client"

import { useEffect, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { format } from "date-fns"
import { API_BASE_URL } from "@/lib/config"

interface Holiday {
    id: string
    name: string
    date: string
    isFloater: boolean
}

export default function HolidayCalendar({ token }: { token: string }) {
    const [holidays, setHolidays] = useState<Holiday[]>([])
    const [date, setDate] = useState<Date | undefined>(new Date())

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/holidays?year=${new Date().getFullYear()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setHolidays(data)
                }
            } catch (err) {
                console.error("Failed to load holidays")
            }
        }
        fetchHolidays()
    }, [token])

    // Convert holidays to Date objects for the calendar
    const holidayDates = holidays.map(h => new Date(h.date))

    const getHolidayForDate = (day: Date) => {
        return holidays.find(h => new Date(h.date).toDateString() === day.toDateString())
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Holiday Calendar {new Date().getFullYear()}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    modifiers={{
                        holiday: holidayDates
                    }}
                    modifiersStyles={{
                        holiday: { color: 'red', fontWeight: 'bold' }
                    }}

                />

                <div className="mt-4 w-full">
                    <h4 className="text-sm font-semibold mb-2">Upcoming Holidays</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {holidays
                            .filter(h => new Date(h.date) >= new Date())
                            .map(h => (
                                <div key={h.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                                    <span>{h.name}</span>
                                    <span className="text-muted-foreground">{format(new Date(h.date), "MMM dd")}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
