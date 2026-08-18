"use client"

import { ShieldCheck } from "lucide-react"

export function ComplianceWidget({ stats }: any) {
    const data = stats || { incompleteProfiles: 2, pendingPolicy: 0 }

    return (
        <div className="bg-slate-900 border border-white/5 p-8 rounded-[36px] space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-600/10 rounded-2xl border border-amber-600/20 shadow-xl shadow-amber-500/5">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold uppercase text-sm tracking-widest leading-none">Compliance</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">System Status</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="p-6 bg-slate-950 rounded-[28px] border border-white/5 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Overall Integrity</span>
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">92%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full w-[92%] bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-lg" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-950/60 rounded-[24px] border border-white/5 group/c hover:border-amber-500/20 transition-all">
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Incomplete</span>
                        <span className="text-xl font-bold text-amber-500 leading-none group-hover/c:text-amber-400 transition-colors">{data.incompleteProfiles}</span>
                    </div>
                    <div className="p-5 bg-slate-950/60 rounded-[24px] border border-white/5 group/c hover:border-emerald-500/20 transition-all">
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Alerts</span>
                        <span className="text-xl font-bold text-white leading-none">0</span>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-white/5 text-center">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest hover:text-white cursor-pointer transition-colors">Run Audit</p>
            </div>
        </div>
    )
}
