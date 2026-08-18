"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { API_BASE_URL } from "@/lib/config"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

interface LeaveRequest {
    id: string
    type: string
    startDate: string
    endDate: string
    reason: string
    status: string
    rejectionReason?: string
    createdAt: string
}

export default function LeaveHistoryTable({ token }: { token: string }) {
    const [requests, setRequests] = useState<LeaveRequest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/leaves/history`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setRequests(data)
            }
        } catch (err) {
            console.error("Failed to load requests")
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loader2 className="animate-spin" />

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Note</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center">No leave requests found</TableCell></TableRow>
                    ) : (
                        requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell><Badge variant="outline">{req.type}</Badge></TableCell>
                                <TableCell>{format(new Date(req.startDate), "MMM dd, yyyy")}</TableCell>
                                <TableCell>{format(new Date(req.endDate), "MMM dd, yyyy")}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={req.reason}>{req.reason}</TableCell>
                                <TableCell>
                                    <Badge variant={req.status === 'APPROVED' ? 'default' : req.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                        {req.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{req.rejectionReason || "-"}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
