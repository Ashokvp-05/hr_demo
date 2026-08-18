"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LifeBuoy, PlusCircle, List, CheckCircle2, Clock, XCircle, AlertCircle, Loader2, Copy, BarChart3, Link as LinkIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/config"

export default function FloatingTicketButton() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const { toast } = useToast()
    const token = (session?.user as any)?.accessToken

    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(false)
    const [tickets, setTickets] = useState<any[]>([])

    // Form State
    const [newTicket, setNewTicket] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "BUG",
        module: "",
        attachments: "" // Simple text link for now
    })

    const isHidden = !session || pathname === "/super-admin" || pathname === "/admin"

    const fetchTickets = async () => {
        if (!token) return
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setTickets(data)
            }
        } catch (error) {
            console.error("Failed to fetch tickets")
        } finally {
            setLoading(false)
        }
    }

    // Fetch tickets when dialog opens
    useEffect(() => {
        if (open) {
            fetchTickets()
            setNewTicket(prev => ({ ...prev, module: window.location.pathname }))
        }
    }, [open, token])

    const handleSubmit = async () => {
        if (!newTicket.title || !newTicket.description) {
            toast({ title: "Error", description: "Please fill in all details", variant: "destructive" })
            return
        }

        setSubmitting(true)
        try {
            const payload = {
                ...newTicket,
                module: window.location.pathname, // Ensure current path is captured
                attachments: newTicket.attachments ? [newTicket.attachments] : [] // Backend expects Json array
            }

            const res = await fetch(`${API_BASE_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const createdTicket = await res.json()
                const ticketToken = `ISS-${createdTicket.ticketNumber}`

                toast({
                    title: "Ticket Created!",
                    description: `Reference Token: ${ticketToken}. We will look into it.`
                })
                setOpen(false)
                setNewTicket({
                    title: "", description: "", priority: "MEDIUM", category: "BUG",
                    module: "", attachments: ""
                })
                fetchTickets()
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to submit ticket", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    const copyToken = (ticketNumber: number) => {
        const tokenStr = `ISS-${ticketNumber}`
        navigator.clipboard.writeText(tokenStr)
        toast({ title: "Copied!", description: `Token ${tokenStr} copied to clipboard.` })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            case 'IN_PROGRESS': return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            case 'RESOLVED': return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            case 'CLOSED': return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    if (isHidden) return null

    const openCount = tickets.filter(t => t.status === 'OPEN').length
    const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all duration-300 hover:scale-110 group border-2 border-white/20 active:scale-95"
                    title="Help & Support"
                >
                    <LifeBuoy className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="font-semibold text-sm hidden group-hover:block animate-in fade-in slide-in-from-right-2 duration-300">Support</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
                <div className="p-6 pb-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <LifeBuoy className="w-6 h-6 text-indigo-600" />
                            Support Center
                        </DialogTitle>
                        <DialogDescription>
                            Track issues and report problems directly to the development team.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Tabs defaultValue="new" className="w-full">
                    <div className="px-6 pt-4">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="new">Report Issue</TabsTrigger>
                            <TabsTrigger value="list">My Tickets</TabsTrigger>
                            <TabsTrigger value="stats">Overview</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="new" className="p-6 pt-4 space-y-4 focus-visible:ring-0 focus-visible:outline-none">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                            <Input
                                placeholder="Brief summary of the issue..."
                                value={newTicket.title}
                                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                className="font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                                <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BUG">🐛 Bug Report</SelectItem>
                                        <SelectItem value="FEATURE">💡 Feature Request</SelectItem>
                                        <SelectItem value="ACCOUNT">👤 Account Issue</SelectItem>
                                        <SelectItem value="OTHER">📝 Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Priority</label>
                                <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="CRITICAL">🔥 Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                            <Textarea
                                placeholder="Steps to reproduce, expected behavior..."
                                className="min-h-[100px] resize-none"
                                value={newTicket.description}
                                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" /> Attachments (URL)
                            </label>
                            <Input
                                placeholder="Link to screenshot or log (optional)"
                                value={newTicket.attachments}
                                onChange={(e) => setNewTicket({ ...newTicket, attachments: e.target.value })}
                            />
                        </div>
                        <div className="pt-2">
                            <Button
                                onClick={handleSubmit}
                                className="w-full bg-indigo-600 hover:bg-black text-white h-12 rounded-xl font-bold transition-all active:scale-95"
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                                {submitting ? "Transmitting..." : "Initialize Support Ticket"}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="list" className="p-0 focus-visible:ring-0 focus-visible:outline-none">
                        <ScrollArea className="h-[400px] w-full p-6 pt-2">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <p className="text-sm">Loading tickets...</p>
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed rounded-xl m-2">
                                    <CheckCircle2 className="w-10 h-10 mb-2 opacity-50" />
                                    <p className="font-medium">No tickets found</p>
                                    <p className="text-xs opacity-70">You haven't reported any issues yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tickets.map((ticket) => (
                                        <div key={ticket.id} className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1 group/token cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); copyToken(ticket.ticketNumber) }}
                                                        title="Click to copy token"
                                                    >
                                                        #{ticket.ticketNumber}
                                                        <Copy className="w-2.5 h-2.5 opacity-0 group-hover/token:opacity-100" />
                                                    </span>
                                                    <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                        {ticket.title}
                                                    </h4>
                                                </div>
                                                <Badge variant="secondary" className={`${getStatusColor(ticket.status)} text-[10px] font-bold px-2 py-0.5 border-0`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                                                {ticket.description}
                                            </p>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/50 mt-2">
                                                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                    {ticket.module && <span className="opacity-50 truncate max-w-[100px]">{ticket.module}</span>}
                                                </div>
                                                {ticket.comments?.length > 0 && (
                                                    <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full">
                                                        {ticket.comments.length} updates
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="stats" className="p-6 pt-4 space-y-4 focus-visible:ring-0 focus-visible:outline-none">
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Open Tickets</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-2xl font-bold text-indigo-600">{openCount}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Resolved</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-2xl font-bold text-emerald-600">{resolvedCount}</div>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                            <CardContent className="p-4 flex items-center justify-center min-h-[150px] text-muted-foreground text-sm">
                                <div className="text-center">
                                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>Advanced metrics available in Admin Console</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
