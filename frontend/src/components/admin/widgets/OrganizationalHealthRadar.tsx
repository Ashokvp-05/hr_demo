"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, Shield, Users, Layers, Zap } from "lucide-react"

export function OrganizationalHealthRadar({ token }: { token: string }) {
    return (
        <div className="bg-card dark:bg-card border border-border p-8 rounded-[32px] space-y-8 relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/10 rounded-lg">
                    <Activity className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-slate-900 dark:text-white font-bold uppercase text-sm tracking-widest leading-none">Resource Radar</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live Organizational Health</p>
                </div>
            </div>

            <div className="relative aspect-square flex items-center justify-center p-4">
                {/* RADAR CIRCLES */}
                <div className="absolute inset-0 border border-slate-100 dark:border-white/5 rounded-full scale-100" />
                <div className="absolute inset-0 border border-slate-100 dark:border-white/5 rounded-full scale-75" />
                <div className="absolute inset-0 border border-slate-100 dark:border-white/5 rounded-full scale-50" />
                <div className="absolute inset-0 border border-slate-100 dark:border-white/5 rounded-full scale-25" />

                {/* RADAR SCAN LINE */}
                <div className="absolute inset-0 animate-radar-scan origin-center">
                    <div className="w-1/2 h-0.5 bg-gradient-to-r from-transparent to-indigo-500/50 absolute top-1/2 right-1/2" />
                </div>

                {/* DATA NODES */}
                <div className="relative z-10 grid grid-cols-2 gap-8 w-full">
                    {[
                        { label: "Stability", value: "98%", icon: Shield, color: "text-emerald-500" },
                        { label: "Velocity", value: "1.4x", icon: Zap, color: "text-amber-500" },
                        { label: "Density", value: "82%", icon: Users, color: "text-indigo-500" },
                        { label: "Segments", value: "12", icon: Layers, color: "text-rose-500" }
                    ].map((node, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 group/node">
                            <div className={`p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-border group-hover/node:border-indigo-500/30 transition-all shadow-xl`}>
                                <node.icon className={`w-6 h-6 ${node.color}`} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{node.value}</span>
                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-none">{node.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-6 border-t border-border">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Protocol Alignment</span>
                    <span className="text-[9px] font-bold text-emerald-500 font-mono uppercase">Optimal</span>
                </div>
            </div>

            <style jsx global>{`
                @keyframes radar-scan {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-radar-scan {
                    animation: radar-scan 4s linear infinite;
                }
            `}</style>
        </div>
    )
}
