"use client"

import { useState, useEffect } from "react"
import { Megaphone, Info, AlertTriangle, AlertCircle, CheckCircle2, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface Announcement {
    id: string
    title: string
    content: string
    type: string
    priority: string
}

export function AnnouncementBanner({ token }: { token: string }) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(true)

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/announcements`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                // Filter out locally dismissed announcements
                const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
                const activeAnnouncements = data.filter((a: Announcement) => !dismissed.includes(a.id))

                // Only show top 3 or specific priority ones that haven't been dismissed
                setAnnouncements(activeAnnouncements.slice(0, 3))
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (token) fetchAnnouncements()
    }, [token])

    useEffect(() => {
        if (announcements.length <= 1) return
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % announcements.length)
        }, 8000)
        return () => clearInterval(interval)
    }, [announcements])

    const handleDismiss = () => {
        const current = announcements[currentIndex]
        if (!current) return

        // Save to local storage
        const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
        if (!dismissed.includes(current.id)) {
            dismissed.push(current.id)
            localStorage.setItem('dismissed_announcements', JSON.stringify(dismissed))
        }

        // Remove from state immediately
        const updated = announcements.filter(a => a.id !== current.id)
        setAnnouncements(updated)

        // Reset index if needed
        if (currentIndex >= updated.length) {
            setCurrentIndex(0)
        }
    }

    if (announcements.length === 0) return null

    const current = announcements[currentIndex]

    const getColors = (type: string) => {
        switch (type) {
            case 'WARNING': return "bg-amber-500 text-white"
            case 'ALERT': return "bg-rose-600 text-white"
            case 'SUCCESS': return "bg-emerald-600 text-white"
            default: return "bg-indigo-600 text-white"
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'WARNING': return <AlertTriangle className="w-4 h-4" />
            case 'ALERT': return <AlertCircle className="w-4 h-4" />
            case 'SUCCESS': return <CheckCircle2 className="w-4 h-4" />
            default: return <Megaphone className="w-4 h-4" />
        }
    }

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className={`relative overflow-hidden ${getColors(current.type)} shadow-lg shadow-indigo-500/20`}
        >
            <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
                        {getIcon(current.type)}
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
                        >
                            <span className="font-bold uppercase tracking-widest text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                                Announcement
                            </span>
                            <span className="font-bold text-sm truncate">
                                {current.title}: <span className="font-medium opacity-90">{current.content}</span>
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="flex items-center gap-2">
                    {announcements.length > 1 && (
                        <div className="hidden md:flex gap-1 mr-4">
                            {announcements.map((_, idx) => (
                                <div key={idx} className={`h-1 w-4 rounded-full transition-all ${idx === currentIndex ? 'bg-white' : 'bg-white/30'}`} />
                            ))}
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                        onClick={handleDismiss}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}
