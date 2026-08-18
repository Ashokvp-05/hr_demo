"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, MessageSquare, AlertCircle, Plus, ChevronRight, CheckCircle2, Loader2, Sparkles, Send, HardDrive, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"

export default function SupportOrbit({ token }: { token: string }) {
    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showNew, setShowNew] = useState(false)
    const [aiThinking, setAiThinking] = useState(false)
    const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", category: "OTHER" })

    const fetchTickets = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/tickets`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            setTickets(Array.isArray(data) ? data : [])
        } catch (e) {
            toast.error("Support protocol link severed")
            setTickets([])
        }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchTickets() }, [token])

    const askAI = () => {
        setAiThinking(true)
        setTimeout(() => {
            setAiThinking(false)
            toast.info("AI Strategic Agent: Recommendation - Consult Section 4.2 of the Security Protocol.")
        }, 2000)
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">Support <span className="text-primary">Center</span></h3>
                    <p className="text-xs font-medium text-muted-foreground mt-1">Submit inquiries and technical assistance requests</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button onClick={askAI} variant="outline" className="h-10 border-border/60 bg-card hover:bg-accent text-xs font-semibold rounded-xl px-4 gap-2">
                        {aiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                        AI Assistant
                    </Button>
                    <Button onClick={() => setShowNew(true)} className="h-10 bg-primary hover:bg-primary/90 text-white rounded-xl px-5 text-xs font-bold gap-2 shadow-sm">
                        <Plus className="w-4 h-4" /> New Ticket
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {Array.isArray(tickets) && tickets.length === 0 ? (
                    <div className="py-16 text-center bg-accent/50 rounded-[2rem] border border-dashed border-border/40">
                        <Cpu className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">No active support requests</p>
                    </div>
                ) : Array.isArray(tickets) && tickets.map((ticket, i) => (
                    <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-card p-5 rounded-2xl border border-border/40 flex items-center justify-between group hover:border-primary/20 hover:shadow-sm transition-all shadow-sm"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`p-3.5 rounded-xl ${ticket.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500' :
                                ticket.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-foreground leading-none">{ticket.title}</h4>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-2.5">
                                    <span className="text-primary/70">#{ticket.token || ticket.ticketNumber}</span> • {ticket.category} • {new Date(ticket.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="h-7 px-3 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-accent/50 border-border/30">{ticket.status}</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
