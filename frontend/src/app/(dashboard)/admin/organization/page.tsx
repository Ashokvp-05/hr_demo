import { auth } from "@/auth"
import { redirect } from "next/navigation"
import OrganizationControlCenter from "@/components/admin/OrganizationControlCenter"
import { LayoutDashboard } from "lucide-react"

export default async function OrganizationPage() {
    const session = await auth()
    const role = (session?.user?.role || "USER").toUpperCase()
    const AUTHORIZED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'HR']

    if (!session || !AUTHORIZED_ROLES.includes(role)) {
        redirect("/admin")
    }

    const token = (session.user as any)?.accessToken || ""

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 group relative overflow-hidden">
                        <LayoutDashboard className="w-7 h-7 text-white relative z-10" />
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-brand">Corporate Architecture</h2>
                        <p className="text-slate-500 font-medium text-sm mt-0.5">Manage and organize your company's structural departments and branches.</p>
                    </div>
                </div>
            </div>

            <OrganizationControlCenter token={token} />
        </div>
    )
}
