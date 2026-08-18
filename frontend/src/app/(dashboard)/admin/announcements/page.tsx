"use client"

import { useSession } from "next-auth/react"
import { BroadcastCenter } from "@/components/admin/BroadcastCenter"

export default function AnnouncementsPage() {
    const { data: session } = useSession()
    const token = (session?.user as any)?.accessToken || ""

    return (
        <div className="p-6 lg:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <BroadcastCenter token={token} />
        </div>
    )
}
