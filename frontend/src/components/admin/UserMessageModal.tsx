"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, User, Send, X, MessageSquare, Loader2, Building2, AlignLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { API_BASE_URL } from "@/lib/config"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MessageModalProps {
    token: string
    onClose: () => void
    defaultRecipientId?: string
}

export default function UserMessageModal({ token, onClose, defaultRecipientId }: MessageModalProps) {
    const [recipientType, setRecipientType] = useState<"individual" | "group">("individual")
    const [searchQuery, setSearchQuery] = useState("")
    const [employees, setEmployees] = useState<any[]>([])
    const [selectedRecipient, setSelectedRecipient] = useState<any>(null)
    const [selectedDepartment, setSelectedDepartment] = useState<string>("")
    
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (recipientType === "individual" && searchQuery.length > 1) {
            fetchEmployees()
        }
    }, [searchQuery, recipientType])

    const fetchEmployees = async () => {
        setLoading(true)
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
            setLoading(false)
        }
    }

    const handleSend = async () => {
        if (!subject || !message) {
            toast.error("Please fill in subject and message")
            return
        }

        if (recipientType === 'individual' && !selectedRecipient) {
             toast.error("Please select an employee")
             return
        }

        if (recipientType === 'group' && !selectedDepartment) {
             toast.error("Please select a department")
             return
        }

        setSending(true)
        // Simulated API call for sending message (Backend implementation is required)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success(`Message sent ${recipientType === 'individual' ? `to ${selectedRecipient.name}` : `to ${selectedDepartment} department`}`)
            onClose()
        } catch (error) {
            toast.error("Failed to send message")
        } finally {
            setSending(false)
        }
    }

    const departments = ["Engineering", "HR", "Marketing", "Sales", "Finance", "Global All"]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Send Communication</h2>
                            <p className="text-xs text-slate-500">Dispatch message to individual or group</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    
                    {/* Targeting Type */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">Target Audience</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => { setRecipientType("individual"); setSelectedRecipient(null) }}
                                className={cn("flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all", recipientType === "individual" ? "border-indigo-600 bg-indigo-50 shadow-sm" : "border-slate-100 hover:border-slate-200 bg-white")}
                            >
                                <User className={cn("w-6 h-6 mb-2", recipientType === "individual" ? "text-indigo-600" : "text-slate-400")} />
                                <span className={cn("text-sm font-semibold", recipientType === "individual" ? "text-indigo-700" : "text-slate-600")}>Specific Employee</span>
                            </button>
                            <button 
                                onClick={() => { setRecipientType("group"); setSelectedDepartment("") }}
                                className={cn("flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all", recipientType === "group" ? "border-indigo-600 bg-indigo-50 shadow-sm" : "border-slate-100 hover:border-slate-200 bg-white")}
                            >
                                <Users className={cn("w-6 h-6 mb-2", recipientType === "group" ? "text-indigo-600" : "text-slate-400")} />
                                <span className={cn("text-sm font-semibold", recipientType === "group" ? "text-indigo-700" : "text-slate-600")}>Department / Group</span>
                            </button>
                        </div>
                    </div>

                    {/* Recipient Selection */}
                    {recipientType === "individual" ? (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700">Select Employee</label>
                            {selectedRecipient ? (
                                <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-100 bg-indigo-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                                            {selectedRecipient.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{selectedRecipient.name}</p>
                                            <p className="text-xs text-slate-500">{selectedRecipient.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedRecipient(null)} className="h-8 px-2 text-indigo-600 hover:bg-indigo-100">Change</Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Input 
                                        placeholder="Search by name or email..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-11"
                                    />
                                    {loading ? (
                                        <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
                                    ) : (
                                        employees.length > 0 && searchQuery.length > 1 && (
                                            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-50 max-h-[160px] overflow-y-auto">
                                                {employees.map(emp => (
                                                    <button 
                                                        key={emp.id}
                                                        onClick={() => setSelectedRecipient(emp)}
                                                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-medium text-xs">
                                                            {emp.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                                                            <p className="text-xs text-slate-500">{emp.email}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700">Select Department</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {departments.map(dept => (
                                    <button
                                        key={dept}
                                        onClick={() => setSelectedDepartment(dept)}
                                        className={cn("px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2", selectedDepartment === dept ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white")}
                                    >
                                        <Building2 className="w-4 h-4 opacity-70" />
                                        {dept}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message Body */}
                    <div className="space-y-4 pt-2">
                         <div className="space-y-1.5">
                              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                  Subject Line
                              </label>
                              <Input 
                                  placeholder="Brief title for communication..." 
                                  value={subject}
                                  onChange={(e) => setSubject(e.target.value)}
                                  className="h-11 shadow-sm"
                              />
                         </div>
                         <div className="space-y-1.5">
                              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                  <AlignLeft className="w-4 h-4 text-slate-400" /> Message Payload
                              </label>
                              <Textarea 
                                  placeholder="Type your message here..." 
                                  value={message}
                                  onChange={(e) => setMessage(e.target.value)}
                                  className="min-h-[140px] shadow-sm resize-none"
                              />
                         </div>
                    </div>

                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={sending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={sending} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px] shadow-md shadow-indigo-600/20">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Dispatch Message
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
