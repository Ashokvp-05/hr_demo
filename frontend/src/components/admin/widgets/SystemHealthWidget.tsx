"use client"

import { Activity, ShieldCheck, Database, Server, RefreshCw } from "lucide-react"

export function SystemHealthWidget({ health }: any) {
    const data = health || { server: 'online', db: 'connected', apiLatency: '15ms', lastBackup: '2 hours ago' }

    return (
        <div className="bg-slate-900 border border-white/5 p-8 rounded-[36px] space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-600/10 rounded-2xl border border-emerald-600/20 shadow-xl shadow-emerald-500/5 items-center justify-center">
                    <Activity className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-sm tracking-widest leading-none">System Health</h3>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">System Status</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {[
                    { label: "Core Node", status: data.server, icon: Server, color: "text-emerald-400" },
                    { label: "Postgres", status: data.db, icon: Database, color: "text-emerald-400" },
                    { label: "API Latency", status: data.apiLatency, icon: Activity, color: "text-indigo-400" },
                    { label: "Backup Cycle", status: data.lastBackup, icon: ShieldCheck, color: "text-rose-400" }
                ].map((s, i) => (
                    <div key={i} className="space-y-2 p-5 bg-slate-950 rounded-[24px] border border-white/5 group/node hover:border-emerald-500/20 transition-all">
                        <div className="flex items-center gap-3">
                            <s.icon className={`w-4 h-4 ${s.color} group-hover/node:scale-110 transition-transform`} />
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</span>
                        </div>
                        <p className="text-xs font-bold text-white uppercase tracking-wide">{s.status}</p>
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between group/sync cursor-pointer">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">System Integrity</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                </div>
                <RefreshCw className="w-3 h-3 text-slate-700 group-hover/sync:text-emerald-400 group-hover/sync:rotate-180 transition-all duration-700" />
            </div>
        </div>
    )
}
