import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AttendanceControlCenter from "@/components/admin/AttendanceControlCenter"
import { Timer } from "lucide-react"

export default async function AttendancePage() {
    const session = await auth()
    const role = (session?.user?.role || "USER").toUpperCase()
    const AUTHORIZED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN']

    if (!session || !AUTHORIZED_ROLES.includes(role)) {
        redirect("/dashboard")
    }

    const token = (session.user as any)?.accessToken || ""

    return (
        <div className="flex-1 space-y-12 p-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex items-center gap-6 group">
                <div className="p-4 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/30 group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                    <Timer className="w-10 h-10 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white uppercase font-brand leading-none mb-1">Chronos Engine</h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest opacity-80">Synchronize human resources across operational timelines.</p>
                </div>
            </div>

            <AttendanceControlCenter token={token} />
        </div>
    )
}
