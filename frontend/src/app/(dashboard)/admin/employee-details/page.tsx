import { auth } from "@/auth"
import { redirect } from "next/navigation"
import EmployeeDetailsModule from "@/components/admin/EmployeeDetailsModule"

export default async function AdminEmployeeDetailsPage() {
    const session = await auth()
    const role = (session?.user?.role || "USER").toUpperCase()
    const AUTHORIZED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN']

    if (!session || !AUTHORIZED_ROLES.includes(role)) {
        redirect("/dashboard")
    }

    const token = (session.user as any)?.accessToken || ""

    return (
        <div className="flex-1 p-4 md:p-8 pt-6 h-full w-full animate-in fade-in duration-700">
            <EmployeeDetailsModule token={token} userRole={role} />
        </div>
    )
}
