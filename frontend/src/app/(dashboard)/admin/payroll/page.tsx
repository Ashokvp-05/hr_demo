"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Loader2, UploadCloud, Users, Calendar, DollarSign, FileText, Zap, Search, X, Plus, CheckCircle2, Lock, Send } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { cn } from "@/lib/utils"

import { redirect } from "next/navigation"

export default function PayrollPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === "loading") return
        if (!session) {
            router.push("/login")
            return
        }
        const role = (session.user as any).role?.toUpperCase() || "USER"
        const isAuthorized = ['SUPER_ADMIN', 'HR_ADMIN', 'HR'].includes(role)
        if (!isAuthorized) {
            router.push("/dashboard")
        }
    }, [session, status, router])

    if (status === "loading") return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    )

    if (!session) return null

    const role = (session.user?.role || "USER").toUpperCase()
    const isAuthorized = ['SUPER_ADMIN', 'HR_ADMIN', 'HR'].includes(role)
    const canGenerate = isAuthorized // In this strict mode, entrance implies generation rights

    if (!isAuthorized) return null

    // Data state
    const [users, setUsers] = useState<any[]>([])
    const [payslips, setPayslips] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [selectedUser, setSelectedUser] = useState("")
    const [month, setMonth] = useState("January")
    const [year, setYear] = useState("2026")
    const [amount, setAmount] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [bulkReleasing, setBulkReleasing] = useState(false)

    // Breakdown state
    const [breakdown, setBreakdown] = useState({
        hra: "",
        da: "",
        bonus: "",
        otherAllowances: "",
        pf: "",
        tax: ""
    })
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Batch State
    const [creatingBatch, setCreatingBatch] = useState(false)
    const [showCreateBatchModal, setShowCreateBatchModal] = useState(false)
    const [newBatch, setNewBatch] = useState({ month: "", year: new Date().getFullYear().toString() })
    const [processingBatch, setProcessingBatch] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const fetchAllData = async () => {
        const token = (session?.user as any)?.accessToken
        if (!token) return

        try {
            // Fetch Users
            fetch(`${API_BASE_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (res.ok) res.json().then(data => setUsers(Array.isArray(data) ? data : (data.users || [])))
            })

            // Fetch All Payslips
            fetch(`${API_BASE_URL}/payslips/all`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (res.ok) res.json().then(data => setPayslips(Array.isArray(data) ? data : (data.payslips || [])))
            })

            // Fetch Batches
            fetch(`${API_BASE_URL}/payroll/batches`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (res.ok) res.json().then(data => setBatches(Array.isArray(data) ? data : (data.batches || [])))
            })

        } catch (error) {
            console.error("Failed to load data", error)
            toast.error("Failed to load payroll data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchAllData()
    }, [session])

    // --- Individual Handlers ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !selectedUser || !amount) {
            toast.error("Please fill all fields")
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append("userId", selectedUser)
        formData.append("month", month)
        formData.append("year", year)
        formData.append("amount", amount)
        formData.append("file", file)

        try {
            const token = (session?.user as any)?.accessToken
            const res = await fetch(`${API_BASE_URL}/payslips/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Upload failed")
            }

            const newPayslip = await res.json()
            setPayslips([newPayslip, ...payslips])
            toast.success("Payslip uploaded successfully")
            setAmount("")
            setFile(null)
        } catch (error: any) {
            toast.error(error.message || "Upload failed")
        } finally {
            setUploading(false)
        }
    }

    const [generating, setGenerating] = useState(false)

    const handleGenerate = async () => {
        if (!selectedUser || !amount) {
            toast.error("Please select an employee and enter an amount")
            return
        }

        setGenerating(true)
        try {
            const token = (session?.user as any)?.accessToken
            const res = await fetch(`${API_BASE_URL}/payslips/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: selectedUser,
                    month,
                    year,
                    amount,
                    ...breakdown
                })
            })

            if (!res.ok) throw new Error("Generation failed")

            const newPayslip = await res.json()
            setPayslips([newPayslip, ...payslips])
            toast.success("Payslip generated with customized breakdown")
            setAmount("")
            setBreakdown({ hra: "", da: "", bonus: "", otherAllowances: "", pf: "", tax: "" })
        } catch (error: any) {
            toast.error(error.message || "Generation failed")
        } finally {
            setGenerating(false)
        }
    }

    const handleRelease = async (id: string) => {
        try {
            const token = (session?.user as any)?.accessToken
            const res = await fetch(`${API_BASE_URL}/payslips/${id}/release`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                const updatedSlip = await res.json()
                setPayslips(prev => prev.map(s => s.id === id ? updatedSlip : s))
                toast.success("Payslip released to employee")
            }
        } catch (error) {
            toast.error("Failed to release payslip")
        }
    }

    const handleBulkRelease = async () => {
        const generatedSlips = payslips.filter(s => s.status === 'DRAFT')
        if (generatedSlips.length === 0) {
            toast.error("No draft payslips to release")
            return
        }
        if (!confirm(`Are you sure you want to release all ${generatedSlips.length} draft payslips?`)) return

        setBulkReleasing(true)
        try {
            const token = (session?.user as any)?.accessToken
            const ids = generatedSlips.map(s => s.id)
            const res = await fetch(`${API_BASE_URL}/payslips/bulk-release`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ids })
            })

            if (res.ok) {
                setPayslips(prev => prev.map(s => ids.includes(s.id) ? { ...s, status: 'SENT' } : s))
                toast.success(`Successfully released ${ids.length} payslips`)
            } else {
                throw new Error("Bulk release failed")
            }
        } catch (error) {
            toast.error("Failed to perform bulk release")
        } finally {
            setBulkReleasing(false)
        }
    }

    // --- Batch Handlers ---
    const handleCreateBatch = async () => {
        if (!newBatch.month) {
            toast.error("Select a month");
            return;
        }
        setCreatingBatch(true)
        const token = (session?.user as any)?.accessToken
        try {
            const res = await fetch(`${API_BASE_URL}/payroll/batches`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ ...newBatch, year: parseInt(newBatch.year) })
            })
            if (res.ok) {
                const batch = await res.json()
                setBatches([batch, ...batches])
                toast.success("Payroll batch initialized")
                setShowCreateBatchModal(false)
            } else {
                const err = await res.json();
                toast.error(`Batch initialization failed: ${err.error}`)
            }
        } catch (e) {
            toast.error("Engine Fault")
        } finally {
            setCreatingBatch(false)
        }
    }

    const handleBatchAction = async (batchId: string, action: 'generate' | 'approve' | 'lock' | 'release') => {
        setProcessingBatch(batchId)
        const token = (session?.user as any)?.accessToken
        try {
            let url = '';
            let method = '';
            let body = {};

            if (action === 'generate') {
                url = `${API_BASE_URL}/payroll/batches/${batchId}/generate`;
                method = 'POST';
            } else {
                url = `${API_BASE_URL}/payroll/batches/${batchId}/status`;
                method = 'PUT';
                // Map logical action to status enum if needed, assuming backend handles 'APPROVED', 'LOCKED', 'RELEASED'
                const statusMap = {
                    'approve': 'APPROVED',
                    'lock': 'LOCKED',
                    'release': 'RELEASED'
                };
                body = { status: statusMap[action] };
            }

            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast.success(`Batch ${action} successful`);
                fetchAllData(); // Refresh data to show updates
            } else {
                const err = await res.json();
                toast.error(`Action failed: ${err.error}`);
            }
        } catch (e) {
            toast.error("Operation failed");
        } finally {
            setProcessingBatch(null);
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
            case 'APPROVED': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
            case 'LOCKED': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'RELEASED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            default: return 'bg-slate-500/10 text-slate-500'
        }
    }

    const filteredPayslips = payslips.filter(s =>
        s.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.month.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>

    return (
        <div className="space-y-8 container max-w-6xl py-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                        <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">Financial Operations</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Enterprise-grade payroll disbursement and audit control.</p>
                    </div>
                </div>
                <div className="relative z-10 flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Ledger Balanced</span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="batches" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-14 rounded-[1.5rem] bg-slate-100 dark:bg-slate-900 p-1 mb-8">
                    <TabsTrigger value="batches" className="rounded-2xl h-12 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg">Batch Operations</TabsTrigger>
                    <TabsTrigger value="individual" className="rounded-2xl h-12 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg">Individual Management</TabsTrigger>
                </TabsList>

                {/* --- BATCH OPERATIONS TAB --- */}
                <TabsContent value="batches" className="space-y-6">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-6 rounded-[2rem] shadow-xl border border-indigo-50/50 dark:border-indigo-900/20">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Payroll Cycles</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Manage monthly disbursement cycles</p>
                        </div>
                        {canGenerate && (
                            <Button
                                onClick={() => setShowCreateBatchModal(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-6 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Initialize Batch
                            </Button>
                        )}
                    </div>

                    <div className="grid gap-6">
                        {batches.map((batch) => (
                            <Card key={batch.id} className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg hover:shadow-2xl transition-all rounded-[2rem] overflow-hidden group">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row items-center justify-between p-8 gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                                <Calendar className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">{batch.month} {batch.year}</h3>
                                                    <Badge variant="outline" className={cn("rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em]", getStatusColor(batch.status))}>
                                                        {batch.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-6 mt-2.5">
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <Users className="w-3.5 h-3.5" /> {batch.payslipCount || 0} Entities
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <DollarSign className="w-3.5 h-3.5" /> Managed Cycle
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Action Buttons based on Status */}
                                            {batch.status === 'DRAFT' && canGenerate && (
                                                <Button
                                                    onClick={() => handleBatchAction(batch.id, 'generate')}
                                                    disabled={processingBatch === batch.id}
                                                    className="h-10 px-6 rounded-xl bg-slate-900 text-white font-bold uppercase text-[9px] tracking-widest shadow-lg hover:bg-slate-800"
                                                >
                                                    {processingBatch === batch.id ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Zap className="w-3 h-3 mr-2 text-yellow-400" />}
                                                    Run Calculation
                                                </Button>
                                            )}
                                            {batch.status === 'DRAFT' && (
                                                <Button
                                                    onClick={() => handleBatchAction(batch.id, 'approve')}
                                                    disabled={processingBatch === batch.id}
                                                    variant="outline"
                                                    className="h-10 px-6 rounded-xl font-bold uppercase text-[9px] tracking-widest border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    <CheckCircle2 className="w-3 h-3 mr-2" /> Approve
                                                </Button>
                                            )}
                                            {batch.status === 'APPROVED' && (
                                                <Button
                                                    onClick={() => handleBatchAction(batch.id, 'lock')}
                                                    disabled={processingBatch === batch.id}
                                                    className="h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase text-[9px] tracking-widest shadow-lg shadow-amber-500/20"
                                                >
                                                    <Lock className="w-3 h-3 mr-2" /> Lock & Finalize
                                                </Button>
                                            )}
                                            {batch.status === 'LOCKED' && (
                                                <Button
                                                    onClick={() => handleBatchAction(batch.id, 'release')}
                                                    disabled={processingBatch === batch.id}
                                                    className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-500/20"
                                                >
                                                    <Send className="w-3 h-3 mr-2" /> Release Payments
                                                </Button>
                                            )}
                                            {batch.status === 'RELEASED' && (
                                                <Button disabled variant="ghost" className="h-10 px-6 rounded-xl font-bold uppercase text-[9px] tracking-widest text-emerald-600 opacity-100">
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Disbursed
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {batches.length === 0 && <div className="text-center py-10 text-slate-400">No active batches initialized.</div>}
                    </div>
                </TabsContent>

                {/* --- INDIVIDUAL MANAGEMENT TAB (Existing Content) --- */}
                <TabsContent value="individual">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Copy the existing Upload Form and List here */}
                        <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 h-fit sticky top-24">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UploadCloud className="w-5 h-5 text-indigo-600" />
                                    Upload Payslip
                                </CardTitle>
                                <CardDescription>Upload PDF payslip for an employee.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpload} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Employee</Label>
                                        <Select onValueChange={setSelectedUser} value={selectedUser}>
                                            <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                                            <SelectContent>
                                                {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Month</Label>
                                            <Select onValueChange={setMonth} value={month}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Year</Label>
                                            <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Net Amount</Label>
                                        <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Payslip PDF (Optional)</Label>
                                        <Input type="file" accept=".pdf" onChange={handleFileChange} />
                                    </div>
                                    <div className="pt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowAdvanced(!showAdvanced)}
                                            className="w-full text-[10px] font-bold uppercase tracking-tighter text-slate-400 hover:text-indigo-600 mb-2"
                                        >
                                            {showAdvanced ? "Hide Individual Breakdown" : "Edit Detailed Breakdown"}
                                        </Button>

                                        {showAdvanced && (
                                            <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">HRA</Label>
                                                    <Input type="number" placeholder="0" value={breakdown.hra} onChange={(e) => setBreakdown({ ...breakdown, hra: e.target.value })} className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">DA</Label>
                                                    <Input type="number" placeholder="0" value={breakdown.da} onChange={(e) => setBreakdown({ ...breakdown, da: e.target.value })} className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Bonus</Label>
                                                    <Input type="number" placeholder="0" value={breakdown.bonus} onChange={(e) => setBreakdown({ ...breakdown, bonus: e.target.value })} className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Allowances</Label>
                                                    <Input type="number" placeholder="0" value={breakdown.otherAllowances} onChange={(e) => setBreakdown({ ...breakdown, otherAllowances: e.target.value })} className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400 text-rose-500">PF (-)</Label>
                                                    <Input type="number" placeholder="0" value={breakdown.pf} onChange={(e) => setBreakdown({ ...breakdown, pf: e.target.value })} className="h-8 text-xs border-rose-100 dark:border-rose-900/30 bg-white dark:bg-slate-900" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400 text-rose-500">Tax (-)</Label>
                                                    <Input type="number" placeholder="0" value={breakdown.tax} onChange={(e) => setBreakdown({ ...breakdown, tax: e.target.value })} className="h-8 text-xs border-rose-100 dark:border-rose-900/30 bg-white dark:bg-slate-900" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-4 space-y-3">
                                        <Button type="submit" className="w-full bg-slate-900 text-white font-bold uppercase tracking-widest h-12 rounded-xl" disabled={uploading || !file}>
                                            {uploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UploadCloud className="mr-2 h-4 w-4" />} Manual Upload
                                        </Button>
                                        <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 tracking-widest">or use intelligence</div>
                                        <Button type="button" onClick={handleGenerate} className="w-full bg-white text-indigo-600 border-2 border-indigo-100 font-bold uppercase tracking-widest h-12 rounded-xl" disabled={generating}>
                                            {generating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />} Generate & Save
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2 border-indigo-50/50 dark:border-indigo-900/20 shadow-2xl bg-white dark:bg-slate-950 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-black/20 border-b border-border/50 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold tracking-tight">Financial Stream Log</CardTitle>
                                    <CardDescription>History of all payroll transactions</CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                        <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 pl-9 text-xs w-48" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {filteredPayslips.map((slip) => (
                                        <div key={slip.id} className="flex items-center justify-between p-6">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center"><FileText className="h-6 w-6 text-indigo-600" /></div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{slip.user?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{slip.month} {slip.year} • {slip.amount}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${slip.status === 'RELEASED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {slip.status}
                                                </Badge>
                                                {slip.status === 'DRAFT' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRelease(slip.id)}
                                                        className="h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest px-4 shadow-lg shadow-indigo-200"
                                                    >
                                                        <Send className="w-3 h-3 mr-1.5" /> Release
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Initialize Batch Dialog */}
            <Dialog open={showCreateBatchModal} onOpenChange={setShowCreateBatchModal}>
                <DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border-none p-10 dark:text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Initialize Batch</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quantum Payroll Infrastructure</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Month</label>
                                <Select onValueChange={(v) => setNewBatch({ ...newBatch, month: v })}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 font-bold">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 dark:border-white/5">
                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                            <SelectItem key={m} value={m} className="font-bold text-xs">{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Year</label>
                                <Input
                                    type="number"
                                    value={newBatch.year}
                                    onChange={(e) => setNewBatch({ ...newBatch, year: e.target.value })}
                                    className="w-full h-12 px-4 rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 font-bold focus:outline-none focus:ring-2 ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-10">
                        <Button
                            onClick={handleCreateBatch}
                            disabled={creatingBatch}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20"
                        >
                            {creatingBatch ? "Connecting..." : "Confirm & Initialize"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
