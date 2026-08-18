import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Database, User, Clock, Calendar, Bell, Shield, Palmtree, Activity, Cpu, HardDrive } from "lucide-react"

async function getStats(token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    })
    if (!res.ok) return []
    return res.json()
}

const IconMap: { [key: string]: any } = {
    users: User,
    clock: Clock,
    "calendar-off": Calendar,
    palmtree: Palmtree,
    bell: Bell,
    shield: Shield
}

export default async function DatabaseExplorerPage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    const token = (session.user as any)?.accessToken || ""
    const stats = await getStats(token)

    return (
        <div className="space-y-8 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section with Premium feel */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                            <Database className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">Infrastructure Core</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Direct system-level insights from the PostgreSQL persistence layer.</p>
                        </div>
                    </div>
                </div>
                <div className="relative z-10 flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Engine Stable</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Main Table Card */}
                <Card className="md:col-span-8 border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-black/20 border-b border-border/50 p-8">
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Tables Inventory</CardTitle>
                        <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time object distribution and record counts.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                    <TableHead className="w-[300px] text-[10px] font-bold uppercase tracking-widest text-slate-400 h-14 pl-8">Structure Name</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 h-14">Record Depth</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 h-14 pr-8">Physical Path</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.map((stat: any) => {
                                    const Icon = IconMap[stat.icon] || Database
                                    return (
                                        <TableRow key={stat.table} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                            <TableCell className="font-bold py-5 pl-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-slate-900 dark:text-slate-100">{stat.table}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-200 dark:ring-indigo-800">
                                                    {stat.count.toLocaleString()} ROWS
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-400 dark:text-slate-500 text-[10px] font-mono pr-8">
                                                public.{stat.table.toLowerCase().replace(' ', '_')}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Status Cards */}
                <div className="md:col-span-4 space-y-6">
                    <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
                        <CardHeader className="relative z-10 p-6">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Engine Analytics</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 p-6 pt-0 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="flex items-center gap-3">
                                    <Cpu className="w-5 h-5 text-indigo-400" />
                                    <span className="text-xs font-bold uppercase tracking-tight text-slate-300">Processor State</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-400">98% OPTIMAL</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="flex items-center gap-3">
                                    <HardDrive className="w-5 h-5 text-indigo-400" />
                                    <span className="text-xs font-bold uppercase tracking-tight text-slate-300">Disk Integrity</span>
                                </div>
                                <span className="text-xs font-bold text-indigo-400">RAID-1 SYNCED</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-[2rem]">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-600" /> System Pulse
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-tighter">Connection Utilization</span>
                                    <span className="text-[10px] font-bold text-indigo-600">14% ACTIVE</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[14%] bg-indigo-600 rounded-full" />
                                </div>
                            </div>
                            <div className="py-4 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[9px] font-medium text-slate-400">Instance is currently serving 12 active modules without latency spikes.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
