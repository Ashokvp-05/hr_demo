"use client"

import { signOut } from "next-auth/react"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function ClearSessionPage() {
    useEffect(() => {
        // Force signout and redirect to login
        signOut({ callbackUrl: "/?preview=role", redirect: true })
    }, [])

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950 flex-col gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-slate-400 font-medium">Clearing session and logging out...</p>
        </div>
    )
}
