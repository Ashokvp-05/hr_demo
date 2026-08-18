"use client"

import { useState, useCallback } from "react"
import { Megaphone, Loader2, Zap, AlertTriangle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import { cn } from "@/lib/utils"

interface TeamAnnouncerProps {
    token: string;
    activeCount: number;
}

export function TeamAnnouncer({ token, activeCount }: TeamAnnouncerProps) {
    const [content, setContent] = useState("")
    const [priority, setPriority] = useState<"NORMAL" | "URGENT">("NORMAL")
    const [loading, setLoading] = useState(false)

    const handlePost = useCallback(async () => {
        if (!content.trim()) {
            toast.error("Announcement content cannot be empty")
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/announcements`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: priority === "URGENT" ? "Urgent Update" : "Team Announcement",
                    content,
                    priority,
                    type: priority === "URGENT" ? "ALERT" : "INFO"
                })
            })

            if (!res.ok) throw new Error("Failed to post announcement")

            toast.success("Broadcast successful. Team nodes notified.", {
                icon: <Zap className="w-4 h-4 text-emerald-500" />
            })
            setContent("")
        } catch (error) {
            console.error(error)
            toast.error("Telemetry failed. Broadcast not transmitted.")
        } finally {
            setLoading(false)
        }
    }, [content, priority, token])

    return (
        <div className="space-y-6 md:border-l md:pl-8 border-slate-100 dark:border-white/5 h-full flex flex-col">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <Megaphone className="w-4 h-4 text-indigo-500" /> Neural Broadcast
            </h4>

            <div className="flex-1 min-h-[160px] bg-slate-50/50 dark:bg-black/20 rounded-[2rem] p-6 border border-slate-200/50 dark:border-white/5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/30 transition-all shadow-inner flex flex-col">
                <textarea
                    className="w-full bg-transparent border-0 text-xs font-bold uppercase tracking-wider placeholder:text-slate-400 placeholder:opacity-50 focus:ring-0 resize-none flex-1 leading-relaxed dark:text-slate-200"
                    placeholder="Input strategic directive for the collective..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={loading}
                />

                <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-slate-200/50 dark:border-white/5 gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPriority("NORMAL")}
                            className={cn(
                                "px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border",
                                priority === "NORMAL"
                                    ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                                    : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/5 hover:border-indigo-500/30"
                            )}
                        >
                            Standard
                        </button>
                        <button
                            onClick={() => setPriority("URGENT")}
                            className={cn(
                                "px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2",
                                priority === "URGENT"
                                    ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20"
                                    : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/5 hover:border-rose-500/30"
                            )}
                        >
                            <AlertTriangle className={cn("w-3 h-3", priority === "URGENT" ? "animate-pulse" : "text-slate-300")} /> Urgent
                        </button>
                    </div>

                    <Button
                        size="sm"
                        className="h-10 text-[9px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest px-6 shadow-xl shadow-indigo-500/20 rounded-xl border-0 active:scale-95 transition-all"
                        onClick={handlePost}
                        disabled={loading || !content.trim()}
                    >
                        {loading ? (
                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-3.5 h-3.5 mr-2" />
                        )}
                        Transmit
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 opacity-60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Targeting {activeCount} identified nodes</span>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
            </div>
        </div>
    )
}
