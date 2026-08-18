import { auth } from "@/auth"
import { redirect } from "next/navigation"
import LeaveDashboard from "@/components/leave/LeaveDashboard"
import TeamCalendar from "@/components/dashboard/TeamCalendar"
import { CalendarDays, Calendar, MapPin, Activity } from "lucide-react"

export default async function LeavePage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    const token = (session.user as any)?.accessToken || ""

    return (
        <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Premium Multi-Layer Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                        <CalendarDays className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Leave Management</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your leave requests and balances</p>

                    </div>
                </div>
                <div className="relative z-10 flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <LeaveDashboard token={token} />
                </div>
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Team Calendar Feed</h3>
                            <Calendar className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="p-4">
                            <TeamCalendar />
                        </div>
                    </div>


                </div>
            </div>
        </div>
    )
}
