"use client"

import { useSession } from "next-auth/react"
import { redirect, useSearchParams } from "next/navigation"
import {
    CreditCard, Banknote, FileText, Calculator, Landmark,
    BarChart3, History, LayoutDashboard, Globe, Building,
    TrendingUp, CheckCircle2, Users, Download, Plus, AlertTriangle
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import dynamic from 'next/dynamic'

const PayrollControlCenter = dynamic(() => import("@/components/admin/PayrollControlCenter"), { ssr: false })

export default function PayrollDashboardPage() {
    const { data: session, status: authStatus } = useSession()
    const searchParams = useSearchParams()
    const currentTab = searchParams?.get("tab") || "dashboard"

    if (authStatus === "unauthenticated") {
        redirect("/dashboard")
    }

    const token = (session?.user as any)?.accessToken || ""

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "structure", label: "Salary Structure", icon: Banknote },
        { id: "processing", label: "Payroll Processing", icon: Calculator },
        { id: "payslips", label: "Payslips", icon: FileText },
        { id: "tax", label: "Tax Management", icon: CreditCard },
        { id: "bank", label: "Bank Details", icon: Landmark },
        { id: "reports", label: "Payroll Reports", icon: BarChart3 },
        { id: "history", label: "Payroll History", icon: History },
    ]

    return (
        <div className="flex min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans text-foreground">
            {/* ASIDE NAVIGATION */}
            <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col z-30 overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                            <Landmark className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">Payroll <span className="text-indigo-600">Unit</span></h2>
                    </div>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = currentTab === item.id
                            return (
                                <Link key={item.id} href={`/payroll?tab=${item.id}`}
                                    className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] font-bold tracking-wide transition-all group relative",
                                        isActive ? "bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                                            : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    )}>
                                    <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                                    <span className="uppercase tracking-wider whitespace-nowrap">{item.label}</span>
                                    {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full" />}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 lg:pl-72 flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950">
                <div className="p-4 lg:p-10 pb-32 space-y-10 max-w-[1500px] mx-auto w-full pt-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-slate-900 dark:bg-white rounded-xl shadow-sm">
                                <Landmark className="w-6 h-6 text-white dark:text-black" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-white uppercase">
                                    {navItems.find(i => i.id === currentTab)?.label.toUpperCase() || "PAYROLL"} <span className="text-indigo-600">HUB</span>
                                </h1>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-1 flex items-center gap-1.5">
                                    <Globe className="w-3 h-3 text-indigo-500" /> Financial Disbursement Control
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">

                        {/* DASHBOARD */}
                        {currentTab === "dashboard" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: "Net Payout", value: "₹0", sub: "Pending Disbursement", icon: Landmark, color: "bg-indigo-50 text-indigo-600" },
                                        { label: "Processed Slips", value: "0", sub: "Current Cycle", icon: FileText, color: "bg-emerald-50 text-emerald-600" },
                                        { label: "Tax Liability", value: "₹0", sub: "Est. This Quarter", icon: Calculator, color: "bg-amber-50 text-amber-600" },
                                        { label: "Banking Status", value: "Active", sub: "Gateway Link", icon: CreditCard, color: "bg-violet-50 text-violet-600" },
                                    ].map((stat, i) => (
                                        <Card key={i} className="p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group hover:-translate-y-1 transition-all duration-300">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${stat.color}`}>
                                                <stat.icon className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-3xl font-bold mb-1 tracking-tighter">{stat.value}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                            <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">{stat.sub}</p>
                                        </Card>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {[
                                        { title: "Salary Structure", href: "?tab=structure", desc: "Basic pay, HRA, allowances & bonuses", icon: Banknote },
                                        { title: "Payroll Processing", href: "?tab=processing", desc: "Run monthly payroll calculations", icon: Calculator },
                                        { title: "Payslips", href: "?tab=payslips", desc: "Generate and distribute payslips", icon: FileText },
                                        { title: "Tax Management", href: "?tab=tax", desc: "Income tax, PF & professional tax", icon: CreditCard },
                                        { title: "Bank Details", href: "?tab=bank", desc: "Employee bank & payment accounts", icon: Landmark },
                                        { title: "Payroll Reports", href: "?tab=reports", desc: "Salary, tax & payroll summaries", icon: BarChart3 },
                                    ].map((mod, i) => (
                                        <Link key={i} href={mod.href}>
                                            <Card className="p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group cursor-pointer">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                                        <mod.icon className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <h4 className="text-sm font-bold uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{mod.title}</h4>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{mod.desc}</p>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SALARY STRUCTURE */}
                        {currentTab === "structure" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        { label: "Basic Salary", value: "40%", sub: "Of CTC", icon: Banknote, color: "bg-indigo-50 text-indigo-600" },
                                        { label: "HRA", value: "20%", sub: "House Rent Allowance", icon: Building, color: "bg-blue-50 text-blue-600" },
                                        { label: "Allowances", value: "25%", sub: "Transport + Food + Other", icon: CreditCard, color: "bg-emerald-50 text-emerald-600" },
                                        { label: "Bonuses", value: "15%", sub: "Performance + Festive", icon: TrendingUp, color: "bg-amber-50 text-amber-600" },
                                    ].map((s, i) => (
                                        <Card key={i} className="p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group hover:-translate-y-1 transition-all">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${s.color}`}><s.icon className="w-5 h-5" /></div>
                                            <h3 className="text-3xl font-bold mb-1 tracking-tighter">{s.value}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                                            <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">{s.sub}</p>
                                        </Card>
                                    ))}
                                </div>
                                <Card className="p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-lg font-bold uppercase tracking-tight">Salary Component Breakdown</h3>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 font-bold text-[10px] uppercase tracking-widest">
                                            <Plus className="w-3.5 h-3.5 mr-2" /> Add Component
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { name: "Basic Salary", type: "FIXED", taxable: true, amount: "₹25,000" },
                                            { name: "House Rent Allowance (HRA)", type: "ALLOWANCE", taxable: false, amount: "₹12,500" },
                                            { name: "Transport Allowance", type: "ALLOWANCE", taxable: false, amount: "₹3,200" },
                                            { name: "Medical Allowance", type: "ALLOWANCE", taxable: false, amount: "₹1,250" },
                                            { name: "Performance Bonus", type: "VARIABLE", taxable: true, amount: "₹5,000" },
                                            { name: "Professional Tax", type: "DEDUCTION", taxable: false, amount: "-₹200" },
                                            { name: "Provident Fund (PF)", type: "DEDUCTION", taxable: false, amount: "-₹3,000" },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"><Banknote className="w-4 h-4 text-indigo-600" /></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                                                item.type === "FIXED" ? "bg-indigo-100 text-indigo-600" :
                                                                item.type === "ALLOWANCE" ? "bg-emerald-100 text-emerald-600" :
                                                                item.type === "VARIABLE" ? "bg-amber-100 text-amber-600" :
                                                                "bg-rose-100 text-rose-600"
                                                            }`}>{item.type}</span>
                                                            {item.taxable && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">TAXABLE</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-bold tabular-nums ${item.amount.startsWith("-") ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>{item.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
                                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Net Take Home</span>
                                        <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">₹43,750</span>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {(currentTab === "processing" || currentTab === "payslips") && <PayrollControlCenter token={token} />}

                        {/* TAX MANAGEMENT */}
                        {currentTab === "tax" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { label: "Income Tax (TDS)", value: "₹4,200", sub: "Monthly deduction", icon: Calculator, color: "bg-indigo-50 text-indigo-600" },
                                        { label: "Provident Fund", value: "₹3,000", sub: "12% of basic (PF)", icon: Landmark, color: "bg-emerald-50 text-emerald-600" },
                                        { label: "Professional Tax", value: "₹200", sub: "Statutory deduction", icon: CreditCard, color: "bg-amber-50 text-amber-600" },
                                    ].map((s, i) => (
                                        <Card key={i} className="p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${s.color}`}><s.icon className="w-5 h-5" /></div>
                                            <h3 className="text-3xl font-bold mb-1 tracking-tighter">{s.value}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                                            <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">{s.sub}</p>
                                        </Card>
                                    ))}
                                </div>
                                <Card className="p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                    <h3 className="text-lg font-bold uppercase tracking-tight mb-6">Tax Deduction Register — FY 2025–26</h3>
                                    <div className="space-y-3">
                                        {["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"].map((month, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest w-20">{month}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">TDS: ₹4,200</span>
                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">PF: ₹3,000</span>
                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">PT: ₹200</span>
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${i < 3 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                                                    {i < 3 ? "FILED" : "PENDING"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* BANK DETAILS */}
                        {currentTab === "bank" && (
                            <div className="space-y-6">
                                <Card className="p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-tight">Employee Bank Details</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Salary disbursement accounts</p>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/50 rounded-xl">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] font-bold uppercase text-emerald-600 tracking-widest">Bank Verified</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { name: "Arjun Mehta", acct: "****4521", ifsc: "HDFC0001234", bank: "HDFC Bank", method: "NEFT" },
                                            { name: "Priya Sharma", acct: "****8832", ifsc: "ICIC0005678", bank: "ICICI Bank", method: "IMPS" },
                                            { name: "Rohit Kumar", acct: "****2290", ifsc: "SBIN0009012", bank: "State Bank", method: "NEFT" },
                                            { name: "Divya Nair", acct: "****6614", ifsc: "AXIS0003456", bank: "Axis Bank", method: "RTGS" },
                                        ].map((emp, i) => (
                                            <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                                                        <span className="text-xs font-bold text-indigo-600">{emp.name[0]}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{emp.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{emp.bank} · {emp.acct} · IFSC: {emp.ifsc}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-bold px-3 py-1 rounded-lg bg-indigo-100 text-indigo-600">{emp.method}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* PAYROLL REPORTS */}
                        {currentTab === "reports" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { label: "Total Salary Paid", value: "₹2.4L", sub: "This month", icon: Banknote, color: "bg-indigo-50 text-indigo-600" },
                                        { label: "Total Tax Deducted", value: "₹18,200", sub: "TDS + PF + PT", icon: Calculator, color: "bg-amber-50 text-amber-600" },
                                        { label: "Employees Paid", value: "47", sub: "Processed this cycle", icon: Users, color: "bg-emerald-50 text-emerald-600" },
                                    ].map((s, i) => (
                                        <Card key={i} className="p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${s.color}`}><s.icon className="w-5 h-5" /></div>
                                            <h3 className="text-3xl font-bold mb-1 tracking-tighter">{s.value}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                                            <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">{s.sub}</p>
                                        </Card>
                                    ))}
                                </div>
                                <Card className="p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold uppercase tracking-tight">Available Reports</h3>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 font-bold text-[10px] uppercase tracking-widest">
                                            <Download className="w-3.5 h-3.5 mr-2" /> Export All
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { name: "Monthly Salary Report — March 2026", type: "SALARY", size: "2.4 MB" },
                                            { name: "Tax Deduction Report — Q4 FY2025-26", type: "TAX", size: "1.1 MB" },
                                            { name: "Payroll Summary — FY 2025-26", type: "SUMMARY", size: "3.2 MB" },
                                            { name: "PF Contribution Register", type: "PF", size: "890 KB" },
                                        ].map((report, i) => (
                                            <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"><BarChart3 className="w-4 h-4 text-indigo-600" /></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{report.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{report.size}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-500">{report.type}</span>
                                                    <Button variant="outline" className="h-9 px-4 rounded-xl border-slate-200 dark:border-white/10 font-bold uppercase text-[9px] tracking-widest">
                                                        <Download className="w-3 h-3 mr-1.5" /> PDF
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* PAYROLL HISTORY */}
                        {currentTab === "history" && (
                            <Card className="p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                <h3 className="text-lg font-bold uppercase tracking-tight mb-6">Payroll History — FY 2025-26</h3>
                                <div className="space-y-3">
                                    {[
                                        { month: "March 2026", employees: 47, total: "₹2,42,500", status: "PROCESSED", date: "31 Mar 2026" },
                                        { month: "February 2026", employees: 46, total: "₹2,38,200", status: "PROCESSED", date: "28 Feb 2026" },
                                        { month: "January 2026", employees: 46, total: "₹2,38,200", status: "PROCESSED", date: "31 Jan 2026" },
                                        { month: "December 2025", employees: 44, total: "₹2,28,000", status: "PROCESSED", date: "31 Dec 2025" },
                                        { month: "November 2025", employees: 44, total: "₹2,28,000", status: "PROCESSED", date: "30 Nov 2025" },
                                        { month: "October 2025", employees: 42, total: "₹2,18,400", status: "PROCESSED", date: "31 Oct 2025" },
                                    ].map((record, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"><History className="w-4 h-4 text-indigo-600" /></div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{record.month}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{record.employees} employees · Processed on {record.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-bold text-indigo-600 tabular-nums">{record.total}</span>
                                                <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-600">{record.status}</span>
                                                <Button variant="outline" className="h-9 px-4 rounded-xl border-slate-200 dark:border-white/10 font-bold uppercase text-[9px]">
                                                    <Download className="w-3 h-3 mr-1.5" /> PDF
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                    </div>
                </div>
            </main>
        </div>
    )
}
