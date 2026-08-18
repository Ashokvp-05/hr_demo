"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
    FileText, Shield, Plus, Search, Filter, 
    Loader2, Download, ExternalLink, Ellipsis,
    Megaphone, Eye, Trash2, Edit2, CheckCircle2,
    Clock, Archive, AlertCircle
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"

export default function ManagerPolicyView({ token }: { token: string }) {
    const [policies, setPolicies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPolicyData = async () => {
        // Simulated policy data for now
        setTimeout(() => {
            setPolicies([
                { id: '1', title: 'Code of Conduct v2.4', category: 'COMPLIANCE', status: 'ACTIVE', lastUpdated: '2026-03-01', views: 452 },
                { id: '2', title: 'Remote Work Protocol', category: 'GOVERNANCE', status: 'ACTIVE', lastUpdated: '2026-02-15', views: 890 },
                { id: '3', title: 'Confidentiality Agreement', category: 'LEGAL', status: 'DRAFT', lastUpdated: '2026-03-25', views: 0 },
                { id: '4', title: 'Environmental Sustainability', category: 'ETHICS', status: 'ARCHIVED', lastUpdated: '2025-11-10', views: 124 },
            ])
            setLoading(false)
        }, 800)
    }

    useEffect(() => {
        fetchPolicyData()
    }, [token])

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Strategic <span className="text-indigo-600">Governance</span></h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage & disseminate organizational policies and guidelines</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-14 border-slate-200 dark:border-slate-800 rounded-2xl px-8 text-[11px] font-bold uppercase tracking-widest gap-3 hover:bg-slate-50 transition-all">
                        <Megaphone className="w-5 h-5 text-indigo-600" /> Broadcast Update
                    </Button>
                    <Button className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 text-[11px] font-bold uppercase tracking-widest gap-3 shadow-xl shadow-indigo-600/20">
                        <Plus className="w-5 h-5" /> Enact Policy
                    </Button>
                </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Synchronizing Governance Nodes...</p>
                    </div>
                ) : policies.map((policy) => (
                    <Card key={policy.id} className="p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none group hover:border-indigo-500/20 transition-all">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-black/40 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <Badge className={`w-fit py-0 px-2 text-[8px] font-bold uppercase tracking-widest rounded-md ${
                                        policy.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
                                        policy.status === 'DRAFT' ? 'bg-amber-50 text-amber-600' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {policy.status}
                                    </Badge>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight mt-1">{policy.title}</h3>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-xl"><Ellipsis className="w-5 h-5 text-slate-400" /></Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="flex flex-col gap-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocol Type</p>
                                <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{policy.category}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Version State</p>
                                <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{policy.lastUpdated}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Reach</p>
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{policy.views} Accesses</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-black/40 flex items-center justify-center hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all group-hover:shadow-lg"><Download className="w-4 h-4" /></button>
                                <button className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-black/40 flex items-center justify-center"><Edit2 className="w-4 h-4 text-slate-400" /></button>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" className="h-10 px-4 text-[9px] font-bold uppercase text-slate-400 tracking-widest hover:bg-transparent hover:text-indigo-600 flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> Manifest View
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="bg-indigo-600 rounded-[3rem] p-12 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Shield className="w-10 h-10" />
                            <h4 className="text-3xl font-bold uppercase tracking-tighter leading-none">Security Compliance <br /> <span className="opacity-50">Audit Active</span></h4>
                        </div>
                        <p className="text-xs uppercase font-bold tracking-[0.2em] opacity-80 max-w-lg">All organizational policies currently meet the ISO-27001 requirements for digital identity and governance security.</p>
                    </div>
                    <Button className="h-16 bg-white text-indigo-600 hover:bg-slate-100 rounded-2xl px-10 text-xs font-bold uppercase tracking-[0.2em] shadow-2xl">
                        Review Compliance Audit
                    </Button>
                </div>
            </div>
        </div>
    )
}

