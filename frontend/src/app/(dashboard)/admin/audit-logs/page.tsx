"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ShieldAlert, Activity, Cpu, Fingerprint, Eye } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { Button } from "@/components/ui/button"

export default function AuditLogsPage() {
    const { data: session } = useSession()
    const token = (session?.user as any)?.accessToken
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (token) {
            fetch(`${API_BASE_URL}/admin/audit-logs`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    setLogs(Array.isArray(data) ? data : [])
                    setLoading(false)
                })
                .catch(err => setLoading(false))
        }
    }, [token])

    return (
        <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in duration-700">
            {/* Premium Multi-Layer Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-slate-500/10 transition-colors" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-4 bg-slate-900 dark:bg-black rounded-2xl shadow-lg shadow-black/20">
                        <ShieldAlert className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">Security Audit Telemetry</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Real-time surveillance of administrative operations and system-level mutations.</p>
                    </div>
                </div>
                <div className="relative z-10 flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Surveillance Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">
                <div className="lg:col-span-9">
                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50 dark:border-white/5 flex flex-row items-center justify-between bg-slate-50/50 dark:bg-black/10">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">System Event <span className="text-indigo-600">Feed</span></CardTitle>
                                <CardDescription className="text-xs font-bold text-slate-400 font-medium">Monitoring the last 50 high-criticality administrative interventions.</CardDescription>
                            </div>
                            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                <Cpu className="w-5 h-5 text-slate-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center p-32 gap-4">
                                    <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Decoding encrypted session logs...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
                                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Operation Type</th>
                                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Authorized Personnel</th>
                                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Payload Details</th>
                                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Temporal Signature</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                            {logs.length === 0 ? (
                                                <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold">No event signatures recorded in current buffer.</td></tr>
                                            ) : logs.map(log => (
                                                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all group">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-lg text-[9px] font-bold uppercase tracking-tighter border border-indigo-200/50 dark:border-indigo-500/20 group-hover:scale-105 transition-transform">
                                                                {log.action}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500 border border-slate-200 dark:border-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                {log.admin?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{log.admin?.name || 'ROOT'}</div>
                                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{log.admin?.designation || 'SYSTEM_ADMIN'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 max-w-sm font-mono leading-relaxed bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5 group-hover:border-indigo-500/20 group-hover:text-white transition-all">
                                                            {log.details || 'UNSPECIFIED_MUTATION_METADATA'}
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <div suppressHydrationWarning className="text-[10px] font-bold text-slate-900 dark:text-white tabular-nums tracking-tighter">{new Date(log.createdAt).toLocaleDateString('en-IN')}</div>
                                                        <div suppressHydrationWarning className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 tabular-nums">{new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-3 space-y-8">
                    <Card className="border-0 shadow-xl bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                            <Fingerprint className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-4">
                                <h4 className="text-xl font-bold uppercase tracking-tighter">Integrity Verification</h4>
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-relaxed">Cryptographic proof of all administrative operations.</p>
                            </div>

                            <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">Buffer Load</p>
                                    <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full w-[45%] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                </div>
                                <p className="text-[9px] font-bold uppercase text-white/40 mt-3 text-right">4.2GB Log Cycle</p>
                            </div>

                            <Button variant="outline" className="w-full h-12 border-white/10 bg-white/5 hover:bg-white text-white hover:text-slate-900 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all">
                                Full Surveillance Export
                            </Button>
                        </div>
                    </Card>

                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group h-48 flex flex-col justify-end shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Eye className="w-24 h-24" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-2">Omnipresence Core</p>
                        <h4 className="text-xl font-bold uppercase leading-tight">Every system mutation is captured and indexed for permanent record.</h4>
                    </div>
                </div>
            </div>
        </div>
    )
}
