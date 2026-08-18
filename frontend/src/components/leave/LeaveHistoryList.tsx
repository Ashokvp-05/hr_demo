"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2, CalendarX2 } from "lucide-react"

interface LeaveRequest {
    id: string
    type: string
    startDate: string
    endDate: string
    status: string
    reason?: string
}

import { API_BASE_URL } from "@/lib/config"

export default function LeaveHistoryList({ token, refreshTrigger = 0 }: { token: string, refreshTrigger?: number }) {
    const [requests, setRequests] = useState<LeaveRequest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/leaves/my-requests`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setRequests(data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchRequests()
    }, [token, refreshTrigger])

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>

    if (requests.length === 0) return null

    return (
        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <CalendarX2 className="w-5 h-5 text-indigo-600 mr-2" />
                    Absence History
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {requests.map((req) => (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 transition-all group gap-4">
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 p-2 rounded-lg ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                                req.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' :
                                    req.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                                }`}>
                                <CalendarX2 className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-900 dark:text-white">{req.type}</span>
                                    <Badge variant={
                                        req.status === 'APPROVED' ? 'default' :
                                            req.status === 'REJECTED' ? 'destructive' :
                                                req.status === 'PENDING' ? 'secondary' : 'outline'
                                    } className={`text-[10px] h-5 font-bold ${req.status === 'PENDING' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : ''}`}>
                                        {req.status}
                                    </Badge>
                                </div>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-tight">
                                    {format(new Date(req.startDate), "MMM d, yyyy")} - {format(new Date(req.endDate), "MMM d, yyyy")}
                                </div>
                                {req.reason && (
                                    <p className="text-xs text-slate-400 mt-2 max-w-sm">"{req.reason}"</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
