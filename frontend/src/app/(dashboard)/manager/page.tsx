"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users, Calendar, Clock,
    LayoutDashboard, UserPlus, CreditCard,
    FileText, BarChart3, TrendingUp, HelpCircle, Settings,
    Building2, ChevronRight, Activity, Radio, ShieldCheck
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import dynamic from 'next/dynamic'

// Dynamic imports for HR Manager tools
const HRManagerDashboardHub = dynamic(() => import("@/components/manager/HRManagerDashboardHub"), { 
    ssr: false 
})
const AttendanceControl = dynamic(() => import("@/components/admin/AttendanceControlCenter"), { ssr: false })
const LeaveApprovalCenter = dynamic(() => import("@/components/admin/LeaveApprovalCenter"), { ssr: false })
const OnboardingManager = dynamic(() => import("@/components/manager/ManagerOnboardingView"), { ssr: false })
const PayrollCenter = dynamic(() => import("@/components/admin/PayrollControlCenter"), { ssr: false })

const ExecutiveHub = dynamic(() => import("@/components/admin/ExecutiveHub"), { ssr: false })
const ManagerReports = dynamic(() => import("@/components/manager/ManagerReports"), { ssr: false })
const AddEmployeeModal = dynamic(() => import("@/components/admin/AddEmployeeModal"), { ssr: false })
const DocumentsModule = dynamic(() => import("@/components/admin/DocumentsModule"), { ssr: false })
const DepartmentManager = dynamic(() => import("@/components/manager/ManagerDepartmentView"), { ssr: false })
const UserManagementTable = dynamic(() => import("@/components/admin/UserManagementTable"), { ssr: false })
const AdminKanbanBoard = dynamic(() => import("@/components/admin/AdminKanbanBoard"), { ssr: false })
const SecurityAuditLogs = dynamic(() => import("@/components/admin/SecurityAuditLogs").then(m => m.SecurityAuditLogs), { ssr: false })
const SystemSettingsCenter = dynamic(() => import("@/components/admin/SystemSettingsCenter").then(m => m.SystemSettingsCenter), { ssr: false })
const BroadcastCenter = dynamic(() => import("@/components/admin/BroadcastCenter").then(m => m.BroadcastCenter), { ssr: false })

const GlobalStyles = () => (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        
        .nav-item-active {
            background: #4F46E5;
            color: #ffffff;
            box-shadow: 0 8px 20px -6px rgba(79, 70, 229, 0.4);
        }
        
        .nav-item-hover:hover {
            transform: translateX(4px);
            background: #F8FAFC;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F1F5F9; border-radius: 10px; }
    `}</style>
)

export default function HRManagerDashboardPage() {
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [currentTab, setCurrentTab] = useState(searchParams?.get("tab") || "dashboard")
    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
    const [hasMounted, setHasMounted] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setHasMounted(true)
        if (authStatus === "unauthenticated") {
            router.push("/dashboard")
        }
        const tab = searchParams?.get("tab")
        if (tab) setCurrentTab(tab)

        if (typeof window !== 'undefined') {
            (window as any).setIsAddEmployeeOpen = setIsAddEmployeeOpen
        }

        // 🚀 Reset scroll position on tab change for professional UX
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: "smooth" })
        }
    }, [authStatus, router, searchParams, currentTab])

    const handleTabChange = (tab: string) => {
        setCurrentTab(tab)
        const url = new URL(window.location.href)
        url.searchParams.set("tab", tab)
        window.history.pushState({}, "", url.toString())
    }

    const token = (session?.user as any)?.accessToken || ""

    const role = (session?.user as any)?.role

    const allNavItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "employees", label: "Employee Management", icon: Users },
        { id: "onboarding", label: "Onboarding", icon: UserPlus },
        { id: "attendance", label: "Attendance", icon: Clock },
        { id: "leaves", label: "Leaves", icon: Calendar },
        { id: "payroll", label: "Payroll", icon: CreditCard },
        { id: "performance", label: "Performance", icon: TrendingUp },
        { id: "departments", label: "Departments", icon: Building2 },
        { id: "announcements", label: "Announcements", icon: Radio },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "reports", label: "Reports", icon: BarChart3 },
        { id: "support", label: "Support Desk", icon: HelpCircle },

        { id: "settings", label: "Settings", icon: Settings },
    ]

    const navItems = allNavItems

    if (!hasMounted) return <div className="min-h-screen bg-[#fcfdff]" />

    return (
        <div className="flex h-full overflow-hidden bg-slate-50 font-body">
            <GlobalStyles />
            
            {/* ── HIGH-DENSITY MAIN TERMINAL ── */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <div 
                    ref={scrollRef}
                    className="flex-1 h-full overflow-y-auto custom-scrollbar"
                >
                    <div className="p-6 lg:p-8 pb-24 space-y-8 max-w-[1600px] mx-auto w-full">
                        

                        {/* CONTENT MANIFEST */}
                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                            {currentTab === "dashboard" && <HRManagerDashboardHub token={token} onNavigate={handleTabChange} />}
                            {currentTab === "employees"   && <UserManagementTable token={token} userRole={(session?.user?.role || "MANAGER").toUpperCase()} />}
                            {currentTab === "onboarding" && <OnboardingManager token={token} onAddEmployee={() => setIsAddEmployeeOpen(true)} />}
                            {currentTab === "attendance" && <AttendanceControl token={token} />}
                            {currentTab === "leaves" && <LeaveApprovalCenter token={token} />}
                            {currentTab === "payroll" && <PayrollCenter token={token} />}
                            {currentTab === "performance"  && (
                                <div className="flex flex-col items-center justify-center p-20 text-center">
                                    <TrendingUp className="w-16 h-16 text-indigo-200 mb-4" />
                                    <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Performance Tracking</h2>
                                    <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Module under construction</p>
                                </div>
                            )}
                            {currentTab === "departments" && <DepartmentManager token={token} />}
                            {currentTab === "announcements" && <BroadcastCenter token={token} />}
                            {currentTab === "documents" && <DocumentsModule token={token} />}
                            {currentTab === "reports" && <ManagerReports token={token} />}
                            {currentTab === "support"      && <AdminKanbanBoard token={token} />}
                            {currentTab === "user-management"   && <SecurityAuditLogs token={token} />}
                            {currentTab === "settings"     && <SystemSettingsCenter token={token} />}
                        </div>
                    </div>
                </div>
            </main>

            {/* INTEGRATED MODALS */}
            {isAddEmployeeOpen && (
                <AddEmployeeModal 
                    token={token} 
                    onClose={() => setIsAddEmployeeOpen(false)} 
                    onSuccess={() => {
                        setIsAddEmployeeOpen(false)
                        toast.success("Intelligence Hub: Personnel Registration Complete")
                    }}
                />
            )}
        </div>
    )
}
