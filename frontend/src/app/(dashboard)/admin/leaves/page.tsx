import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import AdminActionCenter from "@/components/admin/AdminActionCenter"
import LeavePolicyManager from "@/components/admin/LeavePolicyManager"
import { Calendar, Briefcase, Activity, ShieldAlert, CalendarCheck } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

export default async function AdminLeavesPage() {
    const session = await auth()
    const role = (session?.user?.role || "USER").toUpperCase()
    const AUTHORIZED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']

    if (!session || !AUTHORIZED_ROLES.includes(role)) {
        redirect("/dashboard")
    }

    const token = (session.user as any)?.accessToken || ""

    // Fetch all leave requests
    let leaves = []
    try {
        const res = await fetch(`${API_BASE_URL}/leaves/all`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        })
        if (res.ok) {
            const all = await res.json()
            const dataArray = Array.isArray(all) ? all : (all.leaves || [])
            leaves = dataArray.filter((l: any) => l.status === 'PENDING')
        }
    } catch (e) {
        console.error("Failed to fetch leaves")
    }

    return (
        <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Premium Multi-Layer Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                        <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">Leave Authorization</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Approve, reject and orchestrate workforce absence cycles.</p>
                    </div>
                </div>
                <div className="relative z-10 flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">{leaves.length} Pending Actions</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50 dark:border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Active Approval <span className="text-indigo-600">Queue</span></CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resource requests requiring immediate validation</CardDescription>
                                </div>
                                <div className="p-4 bg-indigo-50 dark:bg-slate-800 rounded-2xl">
                                    <Briefcase className="w-5 h-5 text-indigo-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <AdminActionCenter
                                token={token}
                                pendingUsers={[]}
                                pendingLeaves={leaves}
                                minimal={true}
                            />
                        </CardContent>
                    </Card>

                    {/* NEW: Governance & Policies Section */}
                    <div className="pt-8">
                        <div className="flex items-center gap-4 mb-10 pl-2">
                            <div className="p-3 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-600/20">
                                <CalendarCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-tight leading-none">Resource Governance</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure organizational leave entitlements & rules.</p>
                            </div>
                        </div>
                        <LeavePolicyManager token={token} />
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group h-56 flex flex-col justify-end shadow-2xl transition-all hover:bg-slate-800 cursor-default">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldAlert className="w-24 h-24" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">Policy Enforcement</p>
                        <h4 className="text-xl font-bold uppercase leading-tight max-w-[200px] mb-2 tracking-tight">Strategic balance mapping prevents operational bottlenecking.</h4>
                        <div className="h-1 w-12 bg-indigo-600 rounded-full group-hover:w-24 transition-all" />
                    </div>

                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Health Distribution</h4>
                            <Activity className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <span className="text-[10px] font-bold uppercase text-slate-500">Wait Time Avg</span>
                                <span className="text-sm font-bold text-indigo-600">4.2h</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <span className="text-[10px] font-bold uppercase text-slate-500">Approval Rate</span>
                                <span className="text-sm font-bold text-emerald-600">92%</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
