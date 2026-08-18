"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { Bell, Check, Clock, Info, AlertTriangle, CheckCircle, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/config"

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const { data: session } = useSession()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("all")
    const [search, setSearch] = useState("")

    const token = (session?.user as any)?.accessToken

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!token) return
            try {
                const res = await fetch(`${API_BASE_URL}/notifications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setNotifications(Array.isArray(data) ? data : (data.notifications || []))
                }
            } catch (error) {
                console.error("Failed to fetch notifications")
            } finally {
                setLoading(false)
            }
        }
        fetchNotifications()
    }, [token])

    const markAllRead = async () => {
        try {
            await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: "PATCH",
                headers: { 'Authorization': `Bearer ${token}` }
            })
            setNotifications(notifications.map(n => ({ ...n, isRead: true })))
        } catch (e) {
            console.error("Failed to mark all read")
        }
    }

    const markSingleRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: "PATCH",
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error("Failed to mark read")
        }
    }

    const typeColors: any = {
        INFO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        WARNING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        ALERT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
        SUCCESS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
    }

    const typeIcons: any = {
        INFO: <Info className="h-4 w-4" />,
        WARNING: <AlertTriangle className="h-4 w-4" />,
        ALERT: <AlertTriangle className="h-4 w-4" />,
        SUCCESS: <CheckCircle className="h-4 w-4" />
    }

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === "all" || n.type === filter || (filter === "unread" && !n.isRead)
        const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
    })

    if (loading) return <div className="p-10 text-center animate-pulse">Loading notifications...</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Notifications</h2>
                    <p className="text-muted-foreground">Stay updated with your latest alerts and messages.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={markAllRead}>
                        <Check className="mr-2 h-4 w-4" />
                        Mark all as read
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">

                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Notifications</SelectItem>
                        <SelectItem value="unread">Unread Only</SelectItem>
                        <SelectItem value="INFO">Information</SelectItem>
                        <SelectItem value="SUCCESS">Success</SelectItem>
                        <SelectItem value="WARNING">Warning</SelectItem>
                        <SelectItem value="ALERT">Alerts</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                        <Bell className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                        <h3 className="text-lg font-medium">No notifications found</h3>
                        <p className="text-muted-foreground">You're all caught up!</p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => markSingleRead(notification.id, notification.isRead)}
                            className={`
                                relative flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-all cursor-pointer
                                ${!notification.isRead
                                    ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800'
                                    : 'bg-slate-50/50 dark:bg-slate-900/50 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                                }
                            `}
                        >
                            <div className={`
                                shrink-0 w-10 h-10 rounded-full flex items-center justify-center border
                                ${typeColors[notification.type]}
                            `}>
                                {typeIcons[notification.type]}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className={`text-sm font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {notification.title}
                                    </h4>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className={`text-sm ${!notification.isRead ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                                    {notification.message}
                                </p>
                            </div>

                            {!notification.isRead && (
                                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-900/20" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
