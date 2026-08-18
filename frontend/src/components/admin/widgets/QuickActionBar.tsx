"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, UserPlus, FilePlus, CalendarRange, BellRing, Settings2, ShieldCheck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuickActionBar() {
    return (
        <div className="bg-card dark:bg-card border border-border p-8 rounded-[32px] space-y-6 relative overflow-hidden group h-full">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/10 rounded-lg">
                    <Zap className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-slate-900 dark:text-white font-bold uppercase text-sm tracking-widest leading-none">Command Hub</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Direct Infrastructure Actions</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: "Invite Talent", icon: UserPlus, color: "bg-indigo-600/10 text-indigo-400 border-indigo-500/20" },
                    { label: "New Policy", icon: FilePlus, color: "bg-emerald-600/10 text-emerald-400 border-emerald-500/20" },
                    { label: "Grant Leave", icon: CalendarRange, color: "bg-amber-600/10 text-amber-400 border-amber-500/20" },
                    { label: "Broadcast", icon: BellRing, color: "bg-rose-600/10 text-rose-400 border-rose-500/20" }
                ].map((action, i) => (
                    <motion.button
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        className={`p-5 rounded-[24px] border border-border flex flex-col items-center justify-center gap-3 text-center transition-all bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border-border group/btn`}
                    >
                        <div className={`p-3 rounded-2xl ${action.color} group-hover/btn:scale-110 transition-transform`}>
                            <action.icon className="w-6 h-6" />
                        </div>
                        <span className="text-[9px] font-bold text-slate-900 dark:text-white uppercase tracking-widest group-hover/btn:text-indigo-600 dark:group-hover/btn:text-indigo-400 transition-colors uppercase">{action.label}</span>
                    </motion.button>
                ))}
            </div>

            <Button variant="outline" className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-border text-slate-900 dark:text-white [font-size:9px] font-bold uppercase tracking-widest rounded-2xl flex items-center justify-between px-6 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-indigo-500/30 transition-all opacity-80 group/more">
                System Governance Center
                <Settings2 className="w-4 h-4 text-slate-400 dark:text-slate-700 group-hover/more:text-indigo-600 dark:group-hover/more:text-indigo-500 group-hover/more:rotate-180 transition-all duration-500" />
            </Button>
        </div>
    )
}
