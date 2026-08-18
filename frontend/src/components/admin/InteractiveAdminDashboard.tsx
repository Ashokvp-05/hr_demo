"use client"

import { useState } from "react"
import { 
    ShieldCheck, CreditCard, Briefcase, Database,  
    FileBarChart, ShieldAlert, Activity, ArrowRight, Download, Send
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ExecutiveHub from "@/components/admin/ExecutiveHub"
import UserMessageModal from "@/components/admin/UserMessageModal"
import { cn } from "@/lib/utils"

interface ReportLink {
    id: string
    title: string
    description: string
    icon: any
    color: string
    path: string
}

const REPORTS: ReportLink[] = [
    { id: "payroll", title: "Payroll Ledger", description: "Audit detailed compensation cycles", icon: CreditCard, color: "text-emerald-600 bg-emerald-50", path: "/admin/payroll" },
    { id: "attendance", title: "Presence Report", description: "Historical clock-in analytics", icon: Activity, color: "text-indigo-600 bg-indigo-50", path: "/admin/attendance" },
    { id: "performance", title: "Staff KPIs", description: "Performance matrix evaluation", icon: FileBarChart, color: "text-amber-600 bg-amber-50", path: "/admin/performance" },
    { id: "lifecycle", title: "Staff Lifecycle", description: "Onboarding & exit manifests", icon: Briefcase, color: "text-rose-600 bg-rose-50", path: "/admin/lifecycle" },
    { id: "compliance", title: "Legal Vault", description: "Document & policy compliance", icon: ShieldAlert, color: "text-blue-600 bg-blue-50", path: "/admin/documents" },
    { id: "bi", title: "BI Analytics", description: "Advanced business intelligence", icon: Database, color: "text-violet-600 bg-violet-50", path: "/admin/bi" },
]

export default function InteractiveAdminDashboard({ token }: { token: string }) {
    const [showMessageModal, setShowMessageModal] = useState(false)

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-16">
            
            {/* 🛸 GLOBAL COMMAND HEADER - Enterprise SaaS Style */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                        Super Admin Overview <Badge variant="secondary" className="ml-2 bg-emerald-50 text-emerald-600 border-none px-2 rounded-md font-medium text-xs">Systems Online</Badge>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Full administrative command and executive analytics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setShowMessageModal(true)} className="h-9 px-4 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20">
                        <Send className="w-4 h-4 mr-2" /> Message Team
                    </Button>
                    <Button variant="outline" className="h-9 px-4 text-sm font-medium border-slate-200">
                        <Download className="w-4 h-4 mr-2" /> Global Export 
                    </Button>
                </div>
            </div>

            {/* 🚀 LIVE ANALYTICS HUB */}
            <div className="w-full">
                <ExecutiveHub token={token} />
            </div>

            {/* 📋 STRATEGIC REPORT LAUNCHPAD */}
            <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Direct Report Access</h2>
                        <p className="text-sm text-slate-500">Quickly navigate to core data modules.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {REPORTS.map((report, i) => (
                        <Card 
                            key={report.id}
                            onClick={() => window.location.href = report.path}
                            className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-xl bg-white flex items-start gap-4"
                        >
                            <div className={cn("p-3 rounded-lg shrink-0", report.color)}>
                                <report.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{report.title}</h3>
                                <p className="text-xs text-slate-500 mt-1 leading-snug">{report.description}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* 🛠️ INFRASTRUCTURE & SECURITY METRICS */}
            <Card className="p-8 border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden mt-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 p-3 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center">
                            <Database className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">System Integrity & Audit Trail</h2>
                            <p className="text-sm text-slate-500 mt-1">Infrastructure monitoring is active.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-8 items-center bg-slate-50 px-6 py-4 rounded-xl border border-slate-100">
                        {[
                            { label: "Data Integrity", val: "100%", status: "Optimal" },
                            { label: "Storage Load", val: "24.2GB", status: "Nominal" },
                            { label: "Active Nodes", val: "482+", status: "Online" },
                        ].map((m, i) => (
                            <div key={i} className="flex flex-col">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{m.label}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-lg font-bold text-slate-900">{m.val}</span>
                                    <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-none font-medium text-[10px] px-2">{m.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Message Modal */}
            <AnimatePresence>
                {showMessageModal && (
                    <UserMessageModal token={token} onClose={() => setShowMessageModal(false)} />
                )}
            </AnimatePresence>

        </div>
    )
}
