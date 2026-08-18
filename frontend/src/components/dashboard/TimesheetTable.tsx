"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { API_BASE_URL } from "@/lib/config"

interface TimeEntry {
    id: string
    clockIn: string
    clockOut: string | null
    hoursWorked: string | null
    clockType: "IN_OFFICE" | "REMOTE"
    status: "ACTIVE" | "COMPLETED" | "RESET"
}

export default function TimesheetTable({ token }: { token: string }) {
    const [entries, setEntries] = useState<TimeEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/time/history?limit=30`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Failed to fetch history")
            const data = await res.json()
            setEntries(Array.isArray(data) ? data : (data.entries || []))
        } catch (err) {
            setError("Failed to load history")
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
    if (error) return <div className="text-red-500 p-4">{error}</div>

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">No entries found</TableCell>
                        </TableRow>
                    ) : (
                        entries.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{format(new Date(entry.clockIn), "MMM dd, yyyy")}</TableCell>
                                <TableCell>{format(new Date(entry.clockIn), "HH:mm:ss")}</TableCell>
                                <TableCell>{entry.clockOut ? format(new Date(entry.clockOut), "HH:mm:ss") : "-"}</TableCell>
                                <TableCell>{entry.hoursWorked ? `${Number(entry.hoursWorked).toFixed(2)} hrs` : "Running"}</TableCell>
                                <TableCell>
                                    <Badge variant={entry.clockType === "REMOTE" ? "secondary" : "default"}>
                                        {entry.clockType}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={entry.status === "ACTIVE" ? "outline" : "secondary"}>
                                        {entry.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
