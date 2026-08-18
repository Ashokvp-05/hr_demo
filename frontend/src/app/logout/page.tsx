"use client"

import { useEffect } from "react"
import { signOutAndClearSession } from "@/lib/sign-out"
import { useSession } from "next-auth/react"

export default function LogoutPage() {
    const { data: session } = useSession()

    useEffect(() => {
        signOutAndClearSession((session?.user as any)?.email)
    }, [session])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="text-lg">Logging out...</p>
            </div>
        </div>
    )
}
