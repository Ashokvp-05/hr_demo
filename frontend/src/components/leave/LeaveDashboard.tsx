"use client"

import { useState } from "react"
import LeaveRequestForm from "./LeaveRequestForm"
import LeaveHistoryList from "./LeaveHistoryList"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import LeaveBalance from "./LeaveBalance"

export default function LeaveDashboard({ token }: { token: string }) {
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Section: Balances - Centered and Narrower */}
            <div className="w-full flex justify-center">
                <div className="w-full max-w-5xl">
                    <LeaveBalance token={token} refreshTrigger={refreshTrigger} />
                </div>
            </div>

            <div className="flex justify-center w-full">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start max-w-5xl w-full">
                    {/* Left Side: Request Form (5 Spans) */}
                    <div className="xl:col-span-5 space-y-6">
                        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-xl font-bold text-indigo-600">Submit Request</CardTitle>
                                <CardDescription>
                                    Fill in the details for your upcoming absence.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <LeaveRequestForm token={token} onSuccess={handleSuccess} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side: History (7 Spans) */}
                    <div className="xl:col-span-7">
                        <LeaveHistoryList token={token} refreshTrigger={refreshTrigger} />
                    </div>
                </div>
            </div>
        </div>
    )
}
