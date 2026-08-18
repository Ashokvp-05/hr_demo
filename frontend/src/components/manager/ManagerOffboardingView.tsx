"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    UserMinus, ShieldCheck, Clock, FileText, 
    Search, Filter, Loader2, Archive, ShieldAlert,
    Trash2, ExternalLink, Ellipsis
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"

export default function ManagerOffboardingView({ token }: { token: string }) {
    const [resignations, setResignations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchOffboardingData = async () => {
        // Simulated offboarding data for now (to be replaced by API)
        setTimeout(() => {
            setResignations([
                { id: '1', name: 'John Doe', designation: 'Senior Developer', status: 'PENDING', progress: 35, lastDay: '2026-04-15' },
                { id: '2', name: 'Jane Smith', designation: 'Product Designer', status: 'NOTICE_PERIOD', progress: 65, lastDay: '2026-04-05' },
                { id: '3', name: 'Robert Ross', designation: 'QA Lead', status: 'CLEARANCE', progress: 90, lastDay: '2026-03-31' },
            ])
            setLoading(false)
        }, 1000)
    }

    useEffect(() => {
        fetchOffboardingData()
    }, [token])

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Lifecycle <span className="text-rose-600">Offboarding</span></h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage personnel resignation & exit protocols</p>
                </div>
                <Button className="h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl px-10 text-[11px] font-bold uppercase tracking-widest gap-3 shadow-xl shadow-rose-600/20">
                    <UserMinus className="w-5 h-5" /> Initialize Offboarding
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Active Resignations", value: "8", sub: "Identities in exit pipeline", icon: Clock, color: "text-rose-600", bg: "bg-rose-50" },
                    { label: "Clearance Pending", value: "3", sub: "Awaiting unit sign-off", icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Archived Identities", value: "124", sub: "Successfully decentralized", icon: Archive, color: "text-indigo-600", bg: "bg-indigo-50" },
                ].map((s, i) => (
                    <Card key={i} className="p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-6 ${s.bg}`}>
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-1 tracking-tighter">{s.value}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{s.sub}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Scanning exit nodes...</p>
                    </div>
                ) : resignations.map((res) => (
                    <Card key={res.id} className="p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none group hover:border-rose-500/20 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 dark:bg-black/40 flex items-center justify-center text-xl font-bold text-rose-600">
                                    {res.name[0]}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{res.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{res.designation}</p>
                                </div>
                            </div>
                            <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-none px-3 py-1 text-[9px] font-bold uppercase tracking-tighter rounded-full">{res.status}</Badge>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Offboarding Completeness</span>
                                    <span className="text-xs font-bold text-rose-600">{res.progress}%</span>
                                </div>
                                <Progress value={res.progress} className="h-2 rounded-full bg-slate-100 dark:bg-black/40 shadow-inner" />
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Final Integration Day</p>
                                        <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{res.lastDay}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon"><ExternalLink className="w-4 h-4 text-slate-400" /></Button>
                            </div>

                            <div className="pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <Button variant="ghost" className="rounded-xl border border-slate-100 h-10 px-4 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" /> Clearance Forms
                                    </Button>
                                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl"><Trash2 className="w-4 h-4 text-rose-400" /></Button>
                                </div>
                                <Button className="h-10 px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-black text-white font-bold text-[9px] uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Finalize Exit
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

