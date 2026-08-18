import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardByRole } from "@/lib/role-redirect"
import LandingClient from "./landing-client"
import { Suspense } from "react"

export default async function RootPage() {
    const session = await auth()

    if (session) {
        redirect(getDashboardByRole((session.user as any)?.role))
    }

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0d1117" }}><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <LandingClient />
        </Suspense>
    )
}
