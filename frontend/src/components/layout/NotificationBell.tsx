"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { Bell, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { API_BASE_URL } from "@/lib/config"
import { useWebSocket } from "@/hooks/useWebSocket"

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell({ token }: { token: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [mounted, setMounted] = useState(false)
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        setMounted(true)
        // Request browser notification permission once
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    // Show a native Windows/browser desktop notification
    const showDesktopNotification = (title: string, body: string) => {
        if (typeof window === 'undefined' || !('Notification' in window)) return
        if (Notification.permission !== 'granted') return
        try {
            const n = new window.Notification(title, {
                body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `hrms-${Date.now()}`,
                silent: false
            })
            // Auto-close after 6 seconds
            setTimeout(() => n.close(), 6000)
        } catch (e) {
            // Service worker context — ignore
        }
    }

    useEffect(() => {
        if (!token) return

        const controller = new AbortController()

        const fetchNotifications = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                })
                if (res.ok) {
                    const data: Notification[] = await res.json()
                    setNotifications(data)

                    const newUnread = data.filter(n => !n.isRead)
                    setUnreadCount(newUnread.length)

                    // Trigger desktop notifications for genuinely NEW items
                    newUnread.forEach(n => {
                        if (!seenIds.has(n.id)) {
                            showDesktopNotification(n.title, n.message || 'You have a new notification')
                        }
                    })
                    // Update seen set
                    setSeenIds(new Set(data.map(n => n.id)))
                } else {
                    console.warn(`Notifications: ${res.status}`)
                }
            } catch (e: any) {
                if (e?.name === 'AbortError') return
                console.warn("Notifications unavailable:", e?.message ?? e)
            }
        }

        fetchNotifications()
    }, [token])

    // Listen for real-time WebSocket notifications
    useWebSocket({
        onMessage: (msg: any) => {
            if (msg.type === "NEW_NOTIFICATION") {
                const newNotification = msg.payload;
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                if (!seenIds.has(newNotification.id)) {
                    showDesktopNotification(newNotification.title, newNotification.message || 'You have a new notification');
                    setSeenIds(prev => new Set(prev).add(newNotification.id));
                }
            }
        },
        enabled: !!token
    });

    const markAllRead = async () => {
        try {
            await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            })
            setNotifications(notifications.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (e) {
            console.error("Failed to mark all read")
        }
    }

    const markSingleRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (e) {
            console.error("Failed to mark read")
        }
    }

    const typeIcons: any = {
        INFO: <Info className="h-4 w-4 text-blue-500" />,
        WARNING: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        ALERT: <AlertTriangle className="h-4 w-4 text-red-500" />,
        SUCCESS: <CheckCircle className="h-4 w-4 text-emerald-500" />
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button suppressHydrationWarning variant="ghost" size="icon" className="relative rounded-full hover:bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-[10px] border-2 border-background">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                            Mark all read
                        </button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No notifications yet.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.isRead && markSingleRead(n.id)}
                                    className={`relative p-4 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${!n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 shrink-0">{typeIcons[n.type] || <Info className="h-4 w-4" />}</div>
                                        <div className="flex-1 space-y-1">
                                            <p className={`text-sm leading-none ${!n.isRead ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.message}</p>
                                            <div className="flex items-center gap-1 pt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Clock className="h-3 w-3" />
                                                <span className="text-[10px] uppercase tracking-wide">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                        {!n.isRead && (
                                            <div className="shrink-0 h-2 w-2 rounded-full bg-indigo-600 mt-1 animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-3 border-t text-center">
                    <Link href="/notifications" className="w-full">
                        <Button variant="ghost" size="sm" className="text-xs w-full text-muted-foreground">
                            View All History
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    )
}
