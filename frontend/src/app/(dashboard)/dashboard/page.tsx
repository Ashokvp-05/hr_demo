import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardByRole } from "@/lib/role-redirect"

export default async function DashboardRedirectPage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    const targetUrl = getDashboardByRole(session.user?.role)
    redirect(targetUrl)
}
