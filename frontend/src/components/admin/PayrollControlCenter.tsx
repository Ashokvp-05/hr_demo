"use client"

import { useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, DollarSign, Loader2, Play, CheckCircle2, AlertCircle, FileText, ChevronRight, Lock, Unlock, Download, Send, Plus, Activity, Users, Clock, TrendingUp, ShieldCheck, Settings, Save, Trash2, Zap, Eye, Calendar, Search, ClipboardList, FileCheck, FileBarChart } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import { cn } from "@/lib/utils"

export default function PayrollControlCenter({ token }: { token: string }) {
    const [batches, setBatches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("batches")
    const [stats, setStats] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [statsLoading, setStatsLoading] = useState(true)

    const fetchBatches = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/payroll/batches`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setBatches(data)
        } catch (e) {
            toast.error("Payroll data error")
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/payroll/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setStats(data)
        } catch (e) { } finally { setStatsLoading(false) }
    }

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                const userData = data.data || data.users || data;
                const filteredUsers = (Array.isArray(userData) ? userData : [])
                    .filter((u: any) => u.role !== 'SUPER_ADMIN' && u.role !== 'SUPPORT_ADMIN');
                setUsers(filteredUsers);
            }
        } catch (e) {
            console.error("User sync error:", e);
            setUsers([]);
        }
    }

    useEffect(() => {
        fetchBatches()
        fetchStats()
        fetchUsers()
    }, [token])

    const createBatch = async () => {
        const date = new Date()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()

        setProcessing("creating")
        try {
            const res = await fetch(`${API_BASE_URL}/payroll/batches`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ month, year })
            })

            if (res.ok) {
                toast.success(`Payroll Batch ${month}/${year} created`)
                fetchBatches()
            } else {
                const err = await res.json()
                toast.error(err.error || "Process failed")
            }
        } catch (e) {
            toast.error("Connection error")
        } finally {
            setProcessing(null)
        }
    }

    const runCalculation = async (batchId: string) => {
        setProcessing(batchId)
        try {
            const res = await fetch(`${API_BASE_URL}/payroll/batches/${batchId}/generate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                toast.success("Payroll calculation complete")
                fetchBatches()
            } else {
                toast.error("Failed to calculate")
            }
        } catch (e) {
            toast.error("Calculation error")
        } finally {
            setProcessing(null)
        }
    }

    const updateStatus = async (batchId: string, status: string) => {
        setProcessing(batchId)
        try {
            const res = await fetch(`${API_BASE_URL}/payroll/batches/${batchId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            })

            if (res.ok) {
                toast.success(`Status updated: ${status}`)
                fetchBatches()
            } else {
                toast.error("Request rejected")
            }
        } catch (e) {
            toast.error("Request timed out")
        } finally {
            setProcessing(null)
        }
    }

    return (
        <div className="min-h-full bg-[#fcfcfd] font-body pb-20 relative overflow-hidden">
            {/* Subtle Background Accent */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-12 relative z-10">

                {/* ── HIGH-FIDELITY HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-emerald-200">
                            <DollarSign className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-[26px] font-bold text-slate-800 tracking-tight font-brand leading-none">
                                Payroll Management
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                Manage Salaries and Payments
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                        {[
                            { id: 'batches', label: 'Payment Lists', icon: CreditCard },
                            { id: 'salary', label: 'Salary Settings', icon: FileText },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={cn(
                                    "h-10 px-6 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all",
                                    activeTab === t.id 
                                        ? "bg-slate-900 text-white shadow-lg" 
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >{t.label}</button>
                        ))}
                    </div>
                </div>

                {/* ── SUMMARY DASHBOARD ── */}
                {!statsLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {(() => {
                            const totalReports = batches.length
                            const releasedSlips = batches.filter((b: any) => b.status === 'RELEASED').reduce((sum: number, b: any) => sum + (b._count?.payslips || 0), 0)
                            const pendingSlips = batches.filter((b: any) => b.status === 'DRAFT').reduce((sum: number, b: any) => sum + (b._count?.payslips || 0), 0)
                            const draftReports = batches.filter((b: any) => b.status === 'DRAFT').length
                            const totalStaff = stats?.totalEmployees || users.length

                            return [
                                { label: 'Total Reports', value: totalReports, sub: 'This Month', icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { label: 'Payslips Issued', value: releasedSlips || stats?.configuredEmployees || 0, sub: `Total Staff: ${totalStaff}`, icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Pending Payslips', value: pendingSlips || stats?.missingConfig || 0, sub: 'Needs Review', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                                { label: 'Draft Reports', value: draftReports, sub: 'Not Published', icon: FileBarChart, color: 'text-rose-600', bg: 'bg-rose-50' },
                            ].map((s, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", s.bg)}>
                                        <s.icon className={cn("w-5 h-5", s.color)} />
                                    </div>
                                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight leading-none mb-2">{s.value}</h3>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.sub}</p>
                                </motion.div>
                            ))
                        })()}
                    </div>
                )}

                {activeTab === 'batches' && (
                    <div className="space-y-12">
                        <div className="flex justify-end">
                            <Button
                                onClick={createBatch}
                                disabled={processing !== null}
                                className="h-16 bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-[24px] shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3 px-12"
                            >
                                {processing === "creating" && <Loader2 className="w-5 h-5 animate-spin mr-3" />}
                                Create Payroll Batch
                            </Button>
                        </div>

                        {/* BATCH GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {loading ? (
                                <div className="col-span-full py-32 flex flex-col items-center justify-center gap-6">
                                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                                    <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Loading Payment List...</p>
                                </div>
                            ) : batches.length === 0 ? (
                                <div className="col-span-full py-32 flex flex-col items-center justify-center gap-6 bg-white rounded-[40px] border border-dashed border-slate-200">
                                    <CreditCard className="w-16 h-16 text-slate-100" />
                                    <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">No payroll lists created yet</p>
                                </div>
                            ) : (
                                batches.map((batch, idx) => (
                                    <motion.div 
                                        key={batch.id} 
                                        initial={{ opacity: 0, y: 15 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all group flex flex-col justify-between h-full"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        <Calendar className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight font-brand uppercase">{batch.month} / {batch.year}</h3>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{batch._count?.payslips || 0} Total Staff</p>
                                                    </div>
                                                </div>
                                                <Badge className={cn("text-[9px] font-bold uppercase tracking-widest px-4 py-1 rounded-full border-none shadow-sm", 
                                                    batch.status === 'RELEASED' ? 'bg-emerald-600 text-white' :
                                                    batch.status === 'APPROVED' ? 'bg-indigo-600 text-white' :
                                                    'bg-amber-100 text-amber-700'
                                                )}>
                                                    {batch.status === 'RELEASED' ? 'Paid' : batch.status === 'APPROVED' ? 'Confirmed' : 'Pending'}
                                                </Badge>
                                            </div>

                                            <div className="space-y-4">
                                                {batch.status === 'DRAFT' && (
                                                    <Button
                                                        onClick={() => runCalculation(batch.id)}
                                                        disabled={processing === batch.id}
                                                        className="w-full h-14 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[20px] text-[10px] font-bold uppercase tracking-widest border border-slate-100 shadow-sm"
                                                    >
                                                        Calculate Salaries
                                                    </Button>
                                                )}

                                                {batch.status === 'DRAFT' && batch._count.payslips > 0 && (
                                                    <Button
                                                        onClick={() => updateStatus(batch.id, 'APPROVED')}
                                                        disabled={processing === batch.id}
                                                        className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-[20px] text-[10px] font-bold uppercase tracking-widest shadow-xl active:scale-95"
                                                    >
                                                        Confirm for Payment
                                                    </Button>
                                                )}

                                                {batch.status === 'APPROVED' && (
                                                    <Button
                                                        onClick={() => updateStatus(batch.id, 'RELEASED')}
                                                        disabled={processing === batch.id}
                                                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[20px] text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95"
                                                    >
                                                        Pay Everyone Now
                                                    </Button>
                                                )}

                                                {batch.status === 'RELEASED' && (
                                                    <div className="p-6 bg-emerald-50 rounded-[24px] border border-emerald-100 flex flex-col items-center gap-3 text-center">
                                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                                        <div>
                                                            <p className="text-emerald-700 text-[11px] font-bold uppercase tracking-tight">All Paid Successfully</p>
                                                            <p className="text-[9px] font-semibold text-slate-400 uppercase mt-1">Date: {new Date(batch.releasedAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                            <button className="text-[9px] font-bold uppercase text-slate-400 hover:text-indigo-600 transition-all tracking-widest">
                                                View History
                                            </button>
                                            <button className="text-[9px] font-bold uppercase text-slate-400 hover:text-emerald-600 transition-all tracking-widest">
                                                Download Report
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'salary' && (
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-10 border-b border-slate-100 bg-slate-50/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight font-brand">Employee Salary Settings</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure and manage staff compensation details</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input placeholder="Search employee..." className="h-12 w-[280px] border-slate-200 bg-white rounded-xl text-[10px] font-bold uppercase tracking-widest pl-11 pr-6 focus:ring-indigo-500/10" />
                                </div>
                                <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] px-4 py-2 rounded-full shadow-sm">{(Array.isArray(users) ? users.length : 0)} Active Staff</Badge>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-6 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                                        <th className="px-6 py-6 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest">Basic Pay</th>
                                        <th className="px-6 py-6 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest">Allowances</th>
                                        <th className="px-6 py-6 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest">Deductions</th>
                                        <th className="px-6 py-6 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest">Final Pay</th>
                                        <th className="px-6 py-6 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-6 text-right text-[9px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {Array.isArray(users) && users.map((user) => (
                                        <SalaryAuditRow key={user.id} user={user} token={token} onUpdate={fetchStats} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function SalaryAuditRow({ user, token, onUpdate }: { user: any, token: string, onUpdate: () => void }) {
    const [config, setConfig] = useState<any>(null)
    const [bank, setBank] = useState<any>(null)
    const [tax, setTax] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [releasing, setReleasing] = useState(false)
    const [payslipStatus, setPayslipStatus] = useState<string | null>(null)

    const fetchDetails = async () => {
        try {
            const [cRes, bRes, tRes, pRes] = await Promise.all([
                fetch(`${API_BASE_URL}/payroll/salary-config/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/payroll/bank-details/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/payroll/tax-details/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/payslips/all?userId=${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
            ])
            if (cRes.ok) setConfig(await cRes.json())
            if (bRes.ok) setBank(await bRes.json())
            if (tRes.ok) setTax(await tRes.json())
            if (pRes.ok) {
                const slips = await pRes.json()
                const currentMonth = format(new Date(), 'MMMM')
                const currentYear = new Date().getFullYear()
                const currentSlip = slips.find((s: any) => s.month === currentMonth && s.year === currentYear)
                if (currentSlip) setPayslipStatus(currentSlip.status)
            }
        } catch (e) {}
    }

    useEffect(() => {
        fetchDetails()
    }, [user.id, token])

    const handleSave = async (type: string, data: any) => {
        setSaving(true)
        try {
            const res = await fetch(`${API_BASE_URL}/payroll/${type}/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
            })
            if (res.ok) {
                toast.success("Settings Saved")
                fetchDetails()
                onUpdate()
            }
        } catch (e) { toast.error("Error saving") } finally { setSaving(false) }
    }

    const basic = Number(config?.basicSalary || 0)
    const hra = Number(config?.hra || 0)
    const pf = Number(config?.pf || 0)
    const taxAmt = Number(config?.tax || 0)
    const grossVal = basic + hra
    const deductionsVal = pf + taxAmt
    const netVal = grossVal - deductionsVal

    const handleRelease = async () => {
        if (!config) {
            toast.error("Salary not setup yet. Cannot pay.");
            return
        }
        
        setReleasing(true)
        try {
            const genRes = await fetch(`${API_BASE_URL}/payslips/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    userId: user.id,
                    month: format(new Date(), 'MMMM'),
                    year: new Date().getFullYear(),
                    amount: netVal,
                    hra: hra,
                    pf: pf,
                    tax: taxAmt
                })
            })
            
            if (!genRes.ok) {
                const err = await genRes.json()
                throw new Error(err.error || "Failed to generate pay record")
            }
            const newSlip = await genRes.json()

            const relRes = await fetch(`${API_BASE_URL}/payslips/${newSlip.id}/release`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            })

            if (relRes.ok) {
                toast.success(`Payment for ${user.name} successful.`)
                fetchDetails()
                onUpdate()
            } else {
                throw new Error("Payment failed")
            }
        } catch (e: any) { 
            toast.error(e.message || "Error processing payment") 
        } finally { 
            setReleasing(false) 
        }
    }
    
    const generatePayslipPDF = (action: 'download' | 'view' = 'download') => {
        if (!config) {
            toast.error("Salary not setup yet");
            return;
        }
        
        toast.info("Creating PDF...");
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text("RUDRATIC HR", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text("Salary Slip - " + format(new Date(), 'MMMM yyyy'), 14, 30);
        
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(`Staff Name: ${user.name}`, 14, 45);
        doc.text(`Job Role: ${user.designation?.name || 'Employee'}`, 14, 52);
        
        autoTable(doc, {
            startY: 70,
            head: [['Item', 'Amount (INR)']],
            body: [
                ['Basic Salary', `Rs. ${basic.toLocaleString()}`],
                ['HRA Allowance', `Rs. ${hra.toLocaleString()}`],
                ['PF Deduction', `Rs. ${pf.toLocaleString()}`],
                ['Income Tax', `Rs. ${taxAmt.toLocaleString()}`],
                ['NET PAYABLE', `Rs. ${netVal.toLocaleString()}`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
        });
        
        if (action === 'download') {
            doc.save(`Salary_${user.name}.pdf`);
        } else {
            window.open(doc.output('bloburl'), '_blank');
        }
    }

    const CompensationSheet = () => (
        <SheetContent className="bg-white border-l border-slate-100 w-full sm:max-w-[540px] p-0 shadow-2xl overflow-y-auto custom-scrollbar">
            <SheetHeader className="pt-12 px-8 pb-8 border-b border-slate-100/50 bg-slate-50/30">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100/50 shrink-0">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <SheetTitle className="text-xl font-bold uppercase tracking-tight text-slate-900 leading-tight">Pay <span className="text-indigo-600">Settings</span></SheetTitle>
                        <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Set salary for {user.name}</SheetDescription>
                    </div>
                </div>
            </SheetHeader>

            <div className="p-8 space-y-10">
                <div className="space-y-6">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-50 pb-2">1. Monthly Salary</p>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Basic Pay (₹)</Label>
                            <Input 
                                defaultValue={config?.basicSalary || 0} 
                                onBlur={(e) => setConfig({ ...config, basicSalary: Number(e.target.value) })}
                                className="h-12 bg-white rounded-xl border border-slate-200 text-sm font-bold px-4 shadow-sm" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">HRA (₹)</Label>
                            <Input 
                                defaultValue={config?.hra || 0}
                                onBlur={(e) => setConfig({ ...config, hra: Number(e.target.value) })}
                                className="h-12 bg-white rounded-xl border border-slate-200 text-sm font-bold px-4 shadow-sm" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PF Amount (₹)</Label>
                            <Input 
                                defaultValue={config?.pf || 0}
                                onBlur={(e) => setConfig({ ...config, pf: Number(e.target.value) })}
                                className="h-12 bg-white rounded-xl border border-slate-200 text-sm font-bold px-4 shadow-sm" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tax Amount (₹)</Label>
                            <Input 
                                defaultValue={config?.tax || 0}
                                onBlur={(e) => setConfig({ ...config, tax: Number(e.target.value) })}
                                className="h-12 bg-white rounded-xl border border-slate-200 text-sm font-bold px-4 shadow-sm" 
                            />
                        </div>
                    </div>
                    <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2" onClick={() => handleSave('salary-config', config)}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Salary"}
                    </Button>
                </div>

                <div className="space-y-6 pb-12">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest border-b border-slate-50 pb-2">2. Bank Info</p>
                    <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account Name</Label>
                            <Input 
                                defaultValue={bank?.accountHolder || user.name}
                                onBlur={(e) => setBank({ ...bank, accountHolder: e.target.value })}
                                className="h-12 bg-white rounded-xl border border-slate-200 text-sm font-bold px-4 shadow-sm" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bank Name</Label>
                                <Input 
                                    defaultValue={bank?.bankName || ''}
                                    onBlur={(e) => setBank({ ...bank, bankName: e.target.value })}
                                    className="h-12 bg-white rounded-xl border border-slate-200 text-sm font-bold px-4 shadow-sm" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account Number</Label>
                                <Input 
                                    defaultValue={bank?.accountNumber || ''}
                                    onBlur={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                                    className="h-12 bg-white rounded-xl border border-slate-200 text-sm font-bold px-4 shadow-sm" 
                                />
                            </div>
                        </div>
                    </div>
                    <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2" onClick={() => handleSave('bank-details', bank)}>
                        Save Bank Info
                    </Button>
                </div>
            </div>
        </SheetContent>
    )

    return (
        <tr className="group hover:bg-slate-50/50 transition-colors">
            <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all uppercase shadow-sm shrink-0">
                        {user.name[0]}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate">{user.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{user.designation?.name || 'Staff'}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <span className="text-[11px] font-bold uppercase text-slate-600">₹{basic.toLocaleString()}</span>
            </td>
            <td className="px-6 py-5">
                <span className="text-[11px] font-bold uppercase text-emerald-600">₹{hra.toLocaleString()}</span>
            </td>
            <td className="px-6 py-5">
                <span className="text-[11px] font-bold uppercase text-rose-500">₹{deductionsVal.toLocaleString()}</span>
            </td>
            <td className="px-6 py-5">
                <span className="text-[12px] font-bold uppercase text-indigo-600">₹{netVal.toLocaleString()}</span>
            </td>
            <td className="px-6 py-5">
                <Badge className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-2.5 py-1.5 border-none shadow-none flex items-center gap-2 w-fit",
                    payslipStatus === 'RELEASED' ? "bg-emerald-600 text-white" :
                    config ? "bg-amber-100 text-amber-700" : "bg-rose-50 text-rose-600 animate-pulse"
                )}>
                    <div className={cn("w-1 h-1 rounded-full", 
                        payslipStatus === 'RELEASED' ? "bg-white" : 
                        config ? "bg-amber-500" : "bg-rose-500"
                    )} />
                    {payslipStatus === 'RELEASED' ? "Paid" : config ? "Waiting" : "Not Set"}
                </Badge>
            </td>
            <td className="px-8 py-5 text-right">
                <div className="flex items-center justify-end gap-2">
                    {!config ? (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 px-5 rounded-xl text-[9px] font-bold uppercase text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all gap-2">
                                    <Plus className="w-3.5 h-3.5" /> Configure Salary
                                </Button>
                            </SheetTrigger>
                            <CompensationSheet />
                        </Sheet>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleRelease} 
                                disabled={releasing || payslipStatus === 'RELEASED'}
                                className={cn(
                                    "h-9 px-5 rounded-xl text-[9px] font-bold uppercase transition-all border gap-2",
                                    payslipStatus === 'RELEASED' ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm" :
                                    "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white"
                                )}
                            >
                                {releasing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 
                                 payslipStatus === 'RELEASED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                                {releasing ? "Paying..." : payslipStatus === 'RELEASED' ? "Paid" : "Pay Now"}
                            </Button>

                            <div className="flex items-center gap-1.5 border-l pl-2 border-slate-100">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => generatePayslipPDF('view')} 
                                    className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-100/50"
                                    title="View Payslip"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                </Button>
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200/50"
                                            title="Settings"
                                        >
                                            <Settings className="w-3.5 h-3.5" />
                                        </Button>
                                    </SheetTrigger>
                                    <CompensationSheet />
                                </Sheet>
                            </div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    )
}

