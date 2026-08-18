import { auth } from "@/auth"
import { redirect } from "next/navigation"
import EmployeeDashboardClient from "@/components/dashboard/EmployeeDashboardClient"

// For SSR, use the internal backend URL directly (Docker: http://backend:4000, local: http://localhost:4000)
// NEXT_PUBLIC_API_URL is '/api' (relative) which won't work for server-side fetch in standalone mode
function getSSRApiBase() {
    if (process.env.INTERNAL_BACKEND_URL) return `${process.env.INTERNAL_BACKEND_URL}/api`
    if (process.env.NEXT_PUBLIC_API_URL?.startsWith('http')) return process.env.NEXT_PUBLIC_API_URL
    return 'http://localhost:4000/api'
}

export default async function EmployeeDashboardPage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    const token = (session.user as any)?.accessToken || ""
    const user = session.user

    // Fetch Stats and Active Attendance
    let data: any = { summary: { totalHours: "0.00", daysWorked: 0 }, leaveBalances: [], latestPayslip: null, calendar: [], activeEntry: null }
    try {
        const apiBase = getSSRApiBase()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const res = await fetch(`${apiBase}/dashboard/employee`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Accept-Encoding': 'identity',
                'Accept': 'application/json',
            },
            cache: 'no-store',
            signal: controller.signal,
        })
        clearTimeout(timeout)
        if (res.ok) {
            data = await res.json()
        } else {
            console.warn(`Dashboard SSR fetch returned ${res.status}: ${res.statusText}`)
        }
    } catch (e: any) {
        // Silently fall back to defaults — client will re-fetch
        if (e?.name !== 'AbortError') {
            console.warn("Dashboard SSR fetch skipped, client will hydrate:", e?.message || e)
        }
    }

    return (
        <EmployeeDashboardClient
            user={user}
            token={token}
            initialData={data}
        />
    )
}

