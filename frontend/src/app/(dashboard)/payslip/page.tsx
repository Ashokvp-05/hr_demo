
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Loader2, ShieldCheck, Calendar, DollarSign, Plus, Search, Trash2, History, ArrowRight, ExternalLink, Zap, Check, User, Building, Lock, Eye } from "lucide-react"
import { format, subYears } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { API_BASE_URL } from "@/lib/config"

import { PayslipDetailedView } from "@/components/dashboard/PayslipDetailedView"

export default function PayslipPage() {
    const { data: session } = useSession()
    const [payslips, setPayslips] = useState<any[]>([])
    const [pendingRelease, setPendingRelease] = useState<any[]>([])
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [selectedPayslip, setSelectedPayslip] = useState<any>(null)
    const [genData, setGenData] = useState({
        userId: "",
        month: format(new Date(), "MMMM"),
        year: new Date().getFullYear().toString(),
        amount: ""
    })
    const [generating, setGenerating] = useState(false)
    const [requestingLegacy, setRequestingLegacy] = useState(false)
    const [releasing, setReleasing] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const role = (session?.user?.role || "USER").toUpperCase()
    // EXTREME PRIVACY: Only HR and Super Admin can manage/view others' payslips
    const canManage = ['HR', 'HR_ADMIN', 'SUPER_ADMIN'].includes(role)
    const canIssue = ['HR', 'HR_ADMIN', 'SUPER_ADMIN'].includes(role)
    const isHR = ['HR', 'HR_ADMIN'].includes(role)

    useEffect(() => {
        setMounted(true)
        const init = async () => {
            const token = (session?.user as any)?.accessToken
            if (!token) return

            try {
                // Fetch Released Payslips (Employee View)
                const res = await fetch(`${API_BASE_URL}/payroll/my-payslips`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setPayslips(Array.isArray(data) ? data : (data.payslips || []))
                } else {
                    const oldRes = await fetch(`${API_BASE_URL}/payslips/my`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    if (oldRes.ok) {
                        const data = await oldRes.json()
                        setPayslips(Array.isArray(data) ? data : (data.payslips || []))
                    }
                }

                // Management Queue fetch (Admins + Managers)
                if (canManage) {
                    const queueRes = await fetch(`${API_BASE_URL}/payslips/all?status=DRAFT`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    if (queueRes.ok) {
                        const data = await queueRes.json()
                        setPendingRelease(Array.isArray(data) ? data : (data.payslips || []))
                    }
                }

                // Global Users fetch (High limit for dropdown)
                if (canIssue) {
                    const usersRes = await fetch(`${API_BASE_URL}/users?limit=ALL`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    if (usersRes.ok) {
                        const data = await usersRes.json()
                        setAllUsers(Array.isArray(data) ? data : (data.users || []))
                    } else {
                        // Handle server-side denial (like role mismatch)
                        const err = await usersRes.json().catch(() => ({}));
                        console.warn("Personnel Sync Restricted:", err.error || "Access Denied");
                    }
                }
            } catch (e) {
                console.error(e)
                toast.error("Connectivity issue - Check connection")
            } finally {
                setLoading(false)
            }
        }
        if (session) init()
    }, [session, canIssue, canManage])

    const handleDownload = async (id: string, filename: string) => {
        const token = (session?.user as any)?.accessToken
        if (!token) return

        try {
            const res = await fetch(`${API_BASE_URL}/payslips/${id}/download`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Download failed")

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success("Handoff successful - Document secured")
        } catch (e) {
            toast.error("Download failed - Vault error")
        }
    }

    const handleRelease = async (id: string) => {
        const token = (session?.user as any)?.accessToken
        setReleasing(id)
        try {
            const res = await fetch(`${API_BASE_URL}/payslips/${id}/release`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                setPendingRelease(prev => prev.filter(p => p.id !== id))
                toast.success("Document released to employee vault")
            } else {
                toast.error("Release failed - Proxy mismatch")
            }
        } catch (e) {
            toast.error("Network instability")
        } finally {
            setReleasing(null)
        }
    }

    const handleRequestLegacy = async () => {
        setRequestingLegacy(true)
        const token = (session?.user as any)?.accessToken
        try {
            const res = await fetch(`${API_BASE_URL}/tickets`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: "Legacy Payslip Access Request",
                    description: "Employee requesting access to payslips older than 1 year for archival review.",
                    priority: "MEDIUM",
                    category: "OTHER",
                    module: "PAYROLL"
                })
            })
            if (res.ok) toast.success("Access request logged - Pending review")
            else toast.error("Request failed - Try again later")
        } catch (e) {
            toast.error("Network failure")
        } finally {
            setRequestingLegacy(false)
        }
    }

    const handleGenerate = async () => {
        if (!genData.userId || !genData.month || !genData.amount) {
            toast.error("Security Protocol Alert: Missing identity or financial data")
            return
        }

        const token = (session?.user as any)?.accessToken
        setGenerating(true)
        try {
            const res = await fetch(`${API_BASE_URL}/payslips/generate`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: genData.userId,
                    month: genData.month,
                    year: parseInt(genData.year),
                    amount: parseFloat(genData.amount)
                })
            })
            if (res.ok) {
                const newSlip = await res.json()
                setPendingRelease(prev => [newSlip, ...prev])
                toast.success("Payslip synthesized successfully")
                setGenData(prev => ({ ...prev, userId: "", amount: "" })) // Reset selection
                setShowGenerateModal(false)
            } else {
                const err = await res.json()
                toast.error(err.error || "Generation failed - Engine rejection")
            }
        } catch (e) {
            toast.error("Internal Engine Fault")
        } finally {
            setGenerating(false)
        }
    }

    const filteredPending = pendingRelease.filter(slip =>
        slip.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slip.month.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading payslips...</span>
        </div>
    )

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* CLEAN HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Payslips</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {canManage ? (isHR ? "HR Payroll Management" : "Admin Payroll Console") : "Your Payslips"}
                        </p>
                    </div>
                </div>
                {canIssue && (
                    <div className="relative z-10">
                        <Button
                            onClick={() => setShowGenerateModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 h-12 font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Issue Document
                        </Button>
                    </div>
                )}
            </header>

            <Tabs defaultValue={canManage ? "management" : "personal"} className="space-y-10">
                {canManage && (
                    <div className="flex justify-center">
                        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl h-14 border border-slate-200 dark:border-white/5 shadow-inner">
                            <TabsTrigger value="management" className="h-11 rounded-xl px-10 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white shadow-sm transition-all flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Audit Console
                            </TabsTrigger>
                            <TabsTrigger value="personal" className="h-11 rounded-xl px-10 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white shadow-sm transition-all flex items-center gap-2">
                                <FileText className="w-4 h-4" /> My Vault
                            </TabsTrigger>
                        </TabsList>
                    </div>
                )}

                <TabsContent value="personal" className="space-y-10 focus-visible:outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <main className="lg:col-span-8 space-y-6">
                            <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-black/60 rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="p-10 border-b border-slate-50 dark:border-white/5 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-bold">My Payslips</CardTitle>
                                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest mt-1">Your released payslips</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="rounded-lg px-2 h-6 text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 border-none tracking-widest">Up to date</Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ScrollArea className="w-full">
                                        <div className="min-w-[600px]">
                                            {payslips.length === 0 ? (
                                                <div className="p-20 text-center space-y-4">
                                                    <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center mx-auto mb-6">
                                                        <FileText className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                                                    </div>
                                                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none">No Released Payslips</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No payslips available yet</p>
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-4">Your payslips will appear here once released by HR.</p>
                                                </div>
                                            ) : (
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                                                        <tr>
                                                            <th className="px-10 py-5 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Period Reference</th>
                                                            <th className="px-10 py-5 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                                        {payslips.map((slip) => (
                                                            <tr key={slip.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                                                <td className="px-10 py-6">
                                                                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                                                                        <FileText className="w-5 h-5 text-indigo-500" />
                                                                        <span className="font-bold text-xs uppercase tracking-wider">{slip.month} {slip.year}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-10 py-6 text-right flex items-center justify-end gap-3">
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => handleDownload(slip.id, `Payslip_${slip.month}_${slip.year}.pdf`)}
                                                                        className="h-10 px-6 rounded-xl border-slate-200 dark:border-white/10 dark:text-white font-bold uppercase text-[10px] tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                                                                    >
                                                                        <Download className="w-3.5 h-3.5 mr-2" /> Download
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </main>
                        <aside className="lg:col-span-4 space-y-6">
                            <Card className="border-none bg-slate-900 dark:bg-black text-white rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden">
                                <History className="absolute bottom-0 right-0 w-40 h-40 text-white/5 -mb-10 -mr-10" />
                                <div className="relative z-10">
                                    <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white border-none rounded-lg px-2 h-6 text-[9px] font-bold uppercase tracking-widest mb-4">Old Records</Badge>
                                    <h3 className="text-2xl font-bold">Need Older Payslips?</h3>
                                    <p className="text-sm font-medium text-slate-400 mt-3 leading-relaxed">Payslips older than 12 months can be requested from HR. Click below to send a request.</p>
                                </div>
                                <Button onClick={handleRequestLegacy} disabled={requestingLegacy} className="w-full h-14 bg-white hover:bg-indigo-600 hover:text-white text-slate-900 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-2xl relative z-10 transition-all duration-300 active:scale-95 hover:shadow-indigo-500/30">
                                    {requestingLegacy ? "Sending Request..." : "Request Old Payslips"}
                                </Button>
                            </Card>
                        </aside>
                    </div>
                </TabsContent>

                {canManage && (
                    <TabsContent value="management" className="space-y-10 focus-visible:outline-none">
                        <section className="space-y-6">
                            <Card className="border-none bg-slate-900 dark:bg-black text-white shadow-2xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="p-10 border-b border-white/5 bg-gradient-to-br from-slate-900 to-indigo-950/40">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                                <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
                                                Distribution Pipeline
                                            </CardTitle>
                                            <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Pending Release Queue</CardDescription>
                                        </div>

                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ScrollArea className="h-[500px] w-full">
                                        {filteredPending.length === 0 ? (
                                            <div className="p-20 text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">Queue Status: NOMINAL / CLEAR</div>
                                        ) : (
                                            <div className="p-6 space-y-4">
                                                {filteredPending.map((slip) => (
                                                    <div key={slip.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                                <User className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-lg">{slip.user?.name}</h4>
                                                                <div className="flex items-center gap-3 mt-1 underline-offset-4 decoration-indigo-500/30 decoration-2">
                                                                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/20 text-[8px] font-bold px-2 py-0">READY</Badge>
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                                                                        <Calendar className="w-3 h-3" /> {slip.month} {slip.year}
                                                                        <span className="h-1 w-1 rounded-full bg-slate-700" />
                                                                        <Building className="w-3 h-3" /> {slip.user?.department || "N/A"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-center gap-6">
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right mb-1">Quantum Value</p>
                                                                <p className="font-bold text-xl text-indigo-400 tracking-tight">${mounted ? Number(slip.amount).toLocaleString() : slip.amount}</p>
                                                            </div>
                                                            <Button
                                                                onClick={() => handleRelease(slip.id)}
                                                                disabled={releasing === slip.id}
                                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-[9px] px-6 h-10 rounded-xl"
                                                            >
                                                                {releasing === slip.id ? "Process..." : "Release"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </section>
                    </TabsContent>
                )}
            </Tabs>

            {/* DETAILED VIEW DIALOG */}
            <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
                <DialogContent className="max-w-4xl bg-transparent border-none p-0 outline-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Payslip Details</DialogTitle>
                        <DialogDescription>Detailed view of selected payroll document</DialogDescription>
                    </DialogHeader>
                    <PayslipDetailedView data={selectedPayslip} />
                </DialogContent>
            </Dialog>

            {/* GENERATE MODAL (ADMIN ONLY) */}
            <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
                <DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border-none p-10 dark:text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Issue Document</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Manual Payroll Dispatch Engine</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target User</Label>
                            <Select
                                value={genData.userId}
                                onValueChange={(v) => setGenData(prev => ({ ...prev, userId: v }))}
                            >
                                <SelectTrigger className="h-12 w-full rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 font-bold cursor-pointer">
                                    <SelectValue placeholder="Choose Employee..." />
                                </SelectTrigger>
                                <SelectContent position="popper" className="rounded-2xl border-slate-100 dark:border-white/5 z-[60]">
                                    {allUsers.length > 0 ? (
                                        allUsers.map(u => (
                                            <SelectItem key={u.id} value={u.id} className="font-bold text-xs ring-0">
                                                {u.name} ({u.department || 'Staff'})
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-[10px] font-bold uppercase text-slate-400">Loading Personnel...</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Month</Label>
                                <Select
                                    value={genData.month}
                                    onValueChange={(v) => setGenData(prev => ({ ...prev, month: v }))}
                                >
                                    <SelectTrigger className="h-12 w-full rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 font-bold cursor-pointer">
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="rounded-2xl border-slate-100 dark:border-white/5 z-[60]">
                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                            <SelectItem key={m} value={m} className="font-bold text-xs">{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Year</Label>
                                <Input
                                    type="text"
                                    value={genData.year}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setGenData(prev => ({ ...prev, year: val }));
                                    }}
                                    className="h-12 rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Salary Amount ($)</Label>
                            <Input
                                type="text"
                                placeholder="0.00"
                                value={genData.amount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setGenData(prev => ({ ...prev, amount: val }));
                                }}
                                className="h-12 rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 font-bold"
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-10">
                        <Button onClick={handleGenerate} disabled={generating} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20">
                            {generating ? "Encrypting & Issuing..." : "Confirm & Issue Document"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
