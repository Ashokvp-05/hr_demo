import { auth } from "@/auth"
import { redirect } from "next/navigation"
import UserManagement from "@/components/admin/UserManagement"
import { Users } from "lucide-react"

export default async function AdminUsersPage() {
    const session = await auth()
    const role = (session?.user?.role || "USER").toUpperCase()
    const AUTHORIZED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'OPS_ADMIN', 'MANAGER']

    if (!session || !AUTHORIZED_ROLES.includes(role)) {
        redirect("/dashboard")
    }

    const token = (session.user as any)?.accessToken || ""

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 group relative overflow-hidden">
                        <Users className="w-7 h-7 text-white relative z-10" />
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white uppercase font-brand">Personnel Registry</h2>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest opacity-80 mt-1">Manage, audit and provision organizational human resources.</p>
                    </div>
                </div>
            </div>

            <UserManagement token={token} />
        </div>
    )
}
