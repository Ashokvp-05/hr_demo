"use client"

import { useSession } from "next-auth/react"
import { 
    ShieldCheck, Activity, Globe, Plus, Building2, Ellipsis
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AdminOnly } from "@/components/auth/RoleGate"
import ExecutiveHub from "@/components/admin/ExecutiveHub"
import InteractiveAdminDashboard from "@/components/admin/InteractiveAdminDashboard"

export default function AdminDashboardPage() {
    const { data: session } = useSession()
    const token = session?.user?.accessToken || ""

    return (
        <AdminOnly fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-rose-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 uppercase">Access Denied</h2>
                <p className="text-sm text-slate-500 font-medium">Elevated administrative privileges required to view the Command Center.</p>
                <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</Button>
            </div>
        }>
            <div className="min-h-screen bg-slate-50/30">
                <div className="p-4 lg:p-10 pb-32 space-y-10 max-w-[1600px] mx-auto w-full">
                    
                    {/* 🚀 SUPER ADMIN INTERACTIVE COMMAND CENTER */}
                    <InteractiveAdminDashboard token={token} />

                </div>
            </div>
        </AdminOnly>
    )
}

