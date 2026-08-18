"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarIcon, ChevronRight, MapPin, Users, Clock, Video, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"

export function UpcomingEventsWidget() {
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const [filter, setFilter] = useState<'ALL' | 'TODAY'>('ALL')

    const events = [
        {
            id: 1,
            title: "Q3 Strategy Meeting",
            time: "10:00 AM",
            endTime: "11:30 AM",
            type: "MEETING",
            date: "Today",
            fullDate: "Oct 24, 2024",
            location: "Boardroom A / Zoom",
            attendees: ["Sarah P.", "Mike T.", "Director X"],
            description: "Quarterly review of marketing strategy and budget allocation.",
            link: "https://zoom.us/j/123456789"
        },
        {
            id: 2,
            title: "Team Lunch",
            time: "1:00 PM",
            endTime: "2:00 PM",
            type: "SOCIAL",
            date: "Today",
            fullDate: "Oct 24, 2024",
            location: "The Golden Fork",
            attendees: ["Entire Team"],
            description: "Monthly team bonding lunch. Pizza and drinks provided.",
            link: ""
        },
        {
            id: 3,
            title: "Performance Review",
            time: "2:00 PM",
            endTime: "3:00 PM",
            type: "REVIEW",
            date: "Feb 12",
            fullDate: "Feb 12, 2025",
            location: "Manager's Office",
            attendees: ["HR Manager", "You"],
            description: "Annual performance review and goal setting for 2025.",
            link: ""
        },
    ]

    const filteredEvents = filter === 'ALL' ? events : events.filter(e => e.date === 'Today')

    const getTypeColor = (type: string) => {
        if (type === 'MEETING') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
        if (type === 'REVIEW') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    }

    const getTypeIcon = (type: string) => {
        if (type === 'MEETING') return <Video className="w-3 h-3 mr-1" />
        if (type === 'REVIEW') return <Users className="w-3 h-3 mr-1" />
        return <Users className="w-3 h-3 mr-1" />
    }

    return (
        <>
            <Card className="premium-card shadow-2xl ring-1 ring-slate-200 dark:ring-indigo-500/10 h-full overflow-hidden flex flex-col">
                <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/30 dark:bg-black/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    Strategic Timeline
                                </CardTitle>
                                <CardDescription className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">Fleet Schedule</CardDescription>
                            </div>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1">
                            {['ALL', 'TODAY'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`text-[9px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-white dark:bg-indigo-600 shadow-sm text-indigo-600 dark:text-white' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                    <div className="divide-y divide-border/50 overflow-y-auto max-h-[400px]">
                        {filteredEvents.map((event) => (
                            <div
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className="flex items-center gap-5 p-5 hover:bg-indigo-500/5 transition-all group cursor-pointer border-l-4 border-transparent hover:border-indigo-500"
                            >
                                <div className="flex-shrink-0 w-14 text-center">
                                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{event.date}</span>
                                    <span className="block text-lg font-bold text-slate-900 dark:text-white mt-1">{event.time.split(' ')[0]}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                                        {event.title}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-bold tracking-widest border border-indigo-500/10 flex items-center ${getTypeColor(event.type)}`}>
                                            {getTypeIcon(event.type)}
                                            {event.type}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-medium flex items-center truncate">
                                            <MapPin className="w-3 h-3 mr-1 text-indigo-500" /> {event.location}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-4 h-4 text-indigo-500" />
                                </div>
                            </div>
                        ))}
                        {filteredEvents.length === 0 && (
                            <div className="p-12 text-center text-muted-foreground">
                                <p className="text-[10px] font-bold uppercase tracking-widest">Operational Gap Detected</p>
                                <p className="text-[10px] mt-1 opacity-50">No events in current protocol window.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-slate-50/30 dark:bg-black/20 border-t border-border/50">
                        <Button variant="ghost" className="w-full rounded-xl font-bold text-[9px] uppercase tracking-[0.2em] text-indigo-600 hover:bg-white dark:hover:bg-white/5" asChild>
                            <Link href="/calendar">Execute Full Calendar Access</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {selectedEvent?.type === 'MEETING' ? <Video className="w-5 h-5 text-indigo-500" /> : <CalendarIcon className="w-5 h-5 text-indigo-500" />}
                            {selectedEvent?.title}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2 mt-2">
                            <Clock className="w-4 h-4" /> {selectedEvent?.fullDate} &bull; {selectedEvent?.time} - {selectedEvent?.endTime}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-4 items-start gap-4">
                            <span className="text-xs font-bold uppercase text-muted-foreground col-span-1 mt-0.5">Location</span>
                            <span className="text-sm font-medium col-span-3 flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                {selectedEvent?.location}
                            </span>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <span className="text-xs font-bold uppercase text-muted-foreground col-span-1 mt-0.5">Attendees</span>
                            <div className="col-span-3 flex flex-wrap gap-1">
                                {selectedEvent?.attendees.map((person: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                                        {person}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
                            {selectedEvent?.description}
                        </div>
                    </div>

                    <DialogFooter className="flex-row sm:justify-end gap-2">
                        <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setSelectedEvent(null)}>
                            Close
                        </Button>
                        {selectedEvent?.link && (
                            <Button className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => window.open(selectedEvent.link, '_blank')}>
                                <Video className="w-4 h-4 mr-2" />
                                Join Meeting
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
