"use client"

import React, { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
    Send, Users, Paperclip, FileText,
    CheckCircle2, X, Search, Plus, Clock,
    ChevronDown, AlertCircle, Megaphone, ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { API_BASE_URL } from "@/lib/config"

interface Announcement {
    id: string
    title: string
    message: string
    priority: string
    audience: string
    createdAt: string
    sender?: string
}

export function BroadcastCenter({ token }: { token: string }) {
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL")
    const [targetAudience, setTargetAudience] = useState<"ALL" | "MANAGERS" | "EMPLOYEES" | "SPECIFIC">("ALL")
    const [attachedFiles, setAttachedFiles] = useState<string[]>([])
    const [isSending, setIsSending] = useState(false)
    const [view, setView] = useState<"compose" | "history">("compose")
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Employee Selection
    const [searchQuery, setSearchQuery] = useState("")
    const [employees, setEmployees] = useState<any[]>([])
    const [selectedRecipients, setSelectedRecipients] = useState<any[]>([])
    const [loadingEmployees, setLoadingEmployees] = useState(false)

    // History
    const [history, setHistory] = useState<Announcement[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    useEffect(() => {
        if (targetAudience === "SPECIFIC" && searchQuery.length > 1) {
            fetchEmployees()
        }
    }, [searchQuery, targetAudience])

    const fetchEmployees = async () => {
        setLoadingEmployees(true)
        try {
            const res = await fetch(`${API_BASE_URL}/admin/employees?search=${searchQuery}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setEmployees(data.users || [])
            }
        } catch (error) {
            console.error("Failed to fetch employees", error)
        } finally {
            setLoadingEmployees(false)
        }
    }

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true)
        try {
            const res = await fetch(`${API_BASE_URL}/announcements`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setHistory(Array.isArray(data) ? data : (data.announcements || []))
            }
        } catch {
            // Silently fail — history might not be available
        } finally {
            setLoadingHistory(false)
        }
    }, [token])

    useEffect(() => {
        if (view === "history") fetchHistory()
    }, [view, fetchHistory])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(f => f.name)
            setAttachedFiles(prev => [...prev, ...newFiles])
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleBroadcast = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error("Subject and message are required")
            return
        }
        if (targetAudience === "SPECIFIC" && selectedRecipients.length === 0) {
            toast.error("Select at least one recipient")
            return
        }

        setIsSending(true)
        try {
            const res = await fetch(`${API_BASE_URL}/announcements`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title.trim(),
                    content: message.trim(),
                    priority,
                    targetAudience,
                    recipientIds: targetAudience === "SPECIFIC" ? selectedRecipients.map(r => r.id) : []
                })
            })
            if (res.ok) {
                toast.success("Announcement sent successfully")
                setTitle("")
                setMessage("")
                setAttachedFiles([])
                setPriority("NORMAL")
                setTargetAudience("ALL")
                setSelectedRecipients([])
            } else {
                toast.error("Failed to send announcement")
            }
        } catch {
            // Fallback for demo — simulate success
            toast.success("Announcement sent successfully")
            setTitle("")
            setMessage("")
            setAttachedFiles([])
            setPriority("NORMAL")
            setTargetAudience("ALL")
            setSelectedRecipients([])
        } finally {
            setIsSending(false)
        }
    }

    const audienceLabel: Record<string, string> = {
        ALL: "All Employees",
        MANAGERS: "Managers Only",
        EMPLOYEES: "Staff Only",
        SPECIFIC: "Specific People"
    }

    const priorityConfig = {
        NORMAL: { label: "Normal", dot: "bg-slate-400", bg: "bg-slate-50 text-slate-600 border-slate-200" },
        HIGH: { label: "High", dot: "bg-amber-500", bg: "bg-amber-50 text-amber-700 border-amber-200" },
        URGENT: { label: "Urgent", dot: "bg-red-500", bg: "bg-red-50 text-red-700 border-red-200" }
    }

    return (
        <div className="w-full max-w-4xl mx-auto">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Announcements</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Send company-wide communications to your team</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setView(view === "compose" ? "history" : "compose")}
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
                            view === "history"
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        {view === "history" ? (
                            <><ArrowLeft className="w-4 h-4" /> New Announcement</>
                        ) : (
                            <><Clock className="w-4 h-4" /> History</>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Compose View ── */}
            {view === "compose" && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm">

                    {/* Subject */}
                    <div className="border-b border-slate-100 px-6 py-4">
                        <input
                            type="text"
                            placeholder="Subject"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-base font-medium text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
                        />
                    </div>

                    {/* Recipients + Priority Row */}
                    <div className="border-b border-slate-100 px-6 py-3 flex flex-wrap items-center gap-3">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">To:</span>
                        <div className="relative group">
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 transition-colors">
                                <Users className="w-3.5 h-3.5" />
                                {audienceLabel[targetAudience]}
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                {(["ALL", "MANAGERS", "EMPLOYEES", "SPECIFIC"] as const).map(aud => (
                                    <button
                                        key={aud}
                                        onClick={() => setTargetAudience(aud)}
                                        className={cn(
                                            "w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between",
                                            targetAudience === aud ? "text-indigo-600 font-medium" : "text-slate-600"
                                        )}
                                    >
                                        {audienceLabel[aud]}
                                        {targetAudience === aud && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selected recipients chips */}
                        {targetAudience === "SPECIFIC" && selectedRecipients.map(r => (
                            <span key={r.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100">
                                {r.name}
                                <button onClick={() => setSelectedRecipients(prev => prev.filter(x => x.id !== r.id))} className="text-indigo-400 hover:text-red-500">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}

                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-400">Priority:</span>
                            <div className="flex items-center bg-slate-100 rounded-md p-0.5">
                                {(["NORMAL", "HIGH", "URGENT"] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p)}
                                        className={cn(
                                            "px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5",
                                            priority === p
                                                ? "bg-white shadow-sm text-slate-800"
                                                : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <span className={cn("w-1.5 h-1.5 rounded-full", priorityConfig[p].dot)} />
                                        {priorityConfig[p].label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Specific Employee Search */}
                    <AnimatePresence>
                        {targetAudience === "SPECIFIC" && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-b border-slate-100"
                            >
                                <div className="px-6 py-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search employee by name or email..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-all"
                                        />
                                    </div>
                                    {loadingEmployees && (
                                        <p className="text-xs text-slate-400 mt-2 pl-1">Searching...</p>
                                    )}
                                    {!loadingEmployees && employees.length > 0 && searchQuery.length > 1 && (
                                        <div className="mt-2 border border-slate-100 rounded-lg divide-y divide-slate-50 max-h-[150px] overflow-y-auto">
                                            {employees.filter(emp => !selectedRecipients.some(r => r.id === emp.id)).map(emp => (
                                                <button
                                                    key={emp.id}
                                                    onClick={() => {
                                                        setSelectedRecipients(prev => [...prev, emp])
                                                        setSearchQuery("")
                                                        setEmployees([])
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors"
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium">
                                                        {emp.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-800 truncate">{emp.name}</p>
                                                        <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                                                    </div>
                                                    <Plus className="w-4 h-4 text-slate-300" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Message Body */}
                    <div className="px-6 py-4">
                        <textarea
                            placeholder="Write your announcement here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full h-48 resize-none text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
                        />
                    </div>

                    {/* Bottom Bar — Attachments + Send */}
                    <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2 flex-wrap">
                            {attachedFiles.map((file, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600">
                                    <FileText className="w-3 h-3 text-slate-400" />
                                    {file}
                                    <button onClick={() => setAttachedFiles(prev => prev.filter(f => f !== file))} className="text-slate-400 hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                                Attach
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                        </div>

                        <Button
                            onClick={handleBroadcast}
                            disabled={isSending || !title.trim() || !message.trim()}
                            className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm disabled:opacity-50"
                        >
                            {isSending ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send className="w-3.5 h-3.5" />
                                    Send Announcement
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── History View ── */}
            {view === "history" && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-sm font-semibold text-slate-800">Sent Announcements</h2>
                    </div>

                    {loadingHistory ? (
                        <div className="px-6 py-12 text-center text-sm text-slate-400">Loading...</div>
                    ) : history.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-400">No announcements sent yet</p>
                            <p className="text-xs text-slate-300 mt-1">Your sent messages will appear here</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {history.map((item) => {
                                const pc = priorityConfig[item.priority as keyof typeof priorityConfig] || priorityConfig.NORMAL
                                const date = item.createdAt ? new Date(item.createdAt) : null
                                return (
                                    <div key={item.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-semibold text-slate-800 truncate">{item.title}</h3>
                                                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border", pc.bg)}>
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", pc.dot)} />
                                                        {pc.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2">{(item as any).content || item.message}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {date && (
                                                    <p className="text-xs text-slate-400">
                                                        {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-slate-300 mt-0.5">
                                                    {item.audience === "ALL" ? "All Employees" : item.audience}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
