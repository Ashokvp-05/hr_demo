"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, ShieldCheck, Zap } from "lucide-react"

export default function SystemStatusWidget() {
    return (
        <Card className="border-none bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Activity className="w-24 h-24" />
            </div>
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Security Verified</span>
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">v2.0.4</Badge>
                </div>

                <div className="space-y-1">
                    <h3 className="text-2xl font-bold">HR Core Active</h3>
                    <p className="text-indigo-100 text-xs">All systems operational. No pending maintenance.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                        <p className="text-[10px] text-indigo-100 uppercase font-bold">Sync Frequency</p>
                        <p className="text-sm font-bold">Real-time (1m)</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                        <p className="text-[10px] text-indigo-100 uppercase font-bold">Privacy Mode</p>
                        <p className="text-sm font-bold">Enhanced (SSL)</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
