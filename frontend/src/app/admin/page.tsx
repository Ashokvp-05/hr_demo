"use client"

import { useSession, signOut } from "next-auth/react"
import { signOutAndClearSession } from "@/lib/sign-out"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { getProfileLinkByRole } from "@/lib/role-redirect"
import {
    Building2, Users, Shield, Crown, Activity, CreditCard, AlertTriangle, Eye, Settings,
    Ticket, Megaphone, Database, CheckCircle2, XCircle, Server, TrendingUp, MessageSquare,
    Bell, Clock, Lock, Search, Filter, HelpCircle, User, ChevronRight, Home, Plus,
    MoreVertical, Download, Calendar, ArrowUpRight, Info, LayoutDashboard, ShieldCheck,
    Globe, Zap, Cpu, HardDrive, ShieldAlert, Layers, BarChart3, Rocket, Laptop, ClipboardList, Briefcase,
    Search as SearchIcon, Moon, Sun, Ellipsis, Power, LogOut,
    UserPlus, Sparkles, FileText, Share2, ClipboardCheck, History, Check, UserCheck,
    Monitor, ExternalLink, FileDown
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import TopHeader from "@/components/layout/TopHeader"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Link from "next/link"
import dynamic from 'next/dynamic'
import Image from "next/image"
import { toast } from "sonner"
import { useWebSocket } from "@/hooks/useWebSocket"
import { API_BASE_URL } from "@/lib/config"
import { motion, AnimatePresence } from "framer-motion"
import { TourProvider, useTour } from "@/components/tour/TourContext"
import { TourOverlay } from "@/components/tour/TourOverlay"
import { TourTooltip } from "@/components/tour/TourTooltip"
import { TourLauncher } from "@/components/tour/TourLauncher"
import { adminTourSteps, ADMIN_TOUR_LS_KEY } from "@/data/adminTourSteps"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// ─────────────────────────────────────────────────────────────────────────────
//  DYNAMIC HIGH-FIDELITY MODULES
// ─────────────────────────────────────────────────────────────────────────────
const UserManagementTable = dynamic(() => import("@/components/admin/UserManagementTable"), {
    ssr: false,
    loading: () => <div className="p-10 animate-pulse bg-slate-50 rounded-2xl h-96" />
})
const AttendanceControlCenter = dynamic(() => import("@/components/admin/AttendanceControlCenter"), { ssr: false })
const LeaveApprovalCenter = dynamic(() => import("@/components/admin/LeaveApprovalCenter"), { ssr: false })
const OrganizationControlCenter = dynamic(() => import("@/components/admin/OrganizationControlCenter"), { ssr: false })
const SecurityAuditLogs = dynamic(() => import("@/components/admin/SecurityAuditLogs").then(m => m.SecurityAuditLogs), { ssr: false })
const SystemSettingsCenter = dynamic(() => import("@/components/admin/SystemSettingsCenter").then(m => m.SystemSettingsCenter), { ssr: false })
const ExecutiveHub = dynamic(() => import("@/components/admin/ExecutiveHub"), { ssr: false })
const AdminKanbanBoard = dynamic(() => import("@/components/admin/AdminKanbanBoard"), { ssr: false })
const DocumentsModule = dynamic(() => import("@/components/admin/DocumentsModule"), { ssr: false })
const UserProfileView = dynamic(() => import("@/components/admin/UserProfileView"), { ssr: false })
const PayrollControlCenter = dynamic(() => import("@/components/admin/PayrollControlCenter"), { ssr: false })
const BroadcastCenter = dynamic(() => import("@/components/admin/BroadcastCenter").then(m => m.BroadcastCenter), { ssr: false })
const DepartmentReports = dynamic(() => import("@/components/admin/DepartmentReports"), { ssr: false })
const EmployeeDetailsModule = dynamic(() => import("@/components/admin/EmployeeDetailsModule"), { ssr: false })
const ManagerReports = dynamic(() => import("@/components/manager/ManagerReports"), { ssr: false })
const OnboardingSuite = dynamic(() => import("@/components/admin/OnboardingSuite"), { ssr: false })
const PerformanceHub = dynamic(() => import("@/components/admin/PerformanceHub"), { ssr: false })
const CompanyDocumentsPage = dynamic(() => import("@/app/(dashboard)/documents/page"), { ssr: false })
const AccountVault = dynamic(() => import("@/components/admin/AccountVault"), { ssr: false })
const EmployeeSkills = dynamic(() => import("@/components/admin/EmployeeSkills"), { ssr: false })
const ProjectsModule = dynamic(() => import("@/components/admin/ProjectsModule"), { ssr: false })
const HolidayManagement = dynamic(() => import("@/app/(dashboard)/admin/holidays/page"), { ssr: false })

// ─────────────────────────────────────────────────────────────────────────────
//  GLOBAL STYLES (Admin Hub Aesthetics)
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #cbd5e1; }

        .sidebar-scrollbar::-webkit-scrollbar { width: 4px; }
        .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .sidebar-scrollbar:hover::-webkit-scrollbar-thumb { background: #cbd5e1; }
    `}</style>
)

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN CONTENT COMPONENT (with search params)
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboardContent() {
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [scrolled, setScrolled] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [notifications, setNotifications] = useState([
        { title: "Audit Log Accessed", user: "Vikram M.", time: "2 min ago", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-50" },
        { title: "New Personnel Synchronized", user: "System Admin", time: "15 min ago", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
        { title: "Policy Update Propagated", user: "HR Policy", time: "45 min ago", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
    ])

    // ── Leave sidebar dropdown state ──
    const [leaveDropOpen, setLeaveDropOpen] = useState(false)
    const [sidebarEmployees, setSidebarEmployees] = useState<any[]>([])

    // ── Attendance View Filtering State ──
    const [attSearch, setAttSearch] = useState("")
    const [attDept, setAttDept] = useState("ALL")
    const [attStatus, setAttStatus] = useState("ALL")

    const currentTab = searchParams.get("tab") || "dashboard"
    const role = (session?.user?.role || "USER").toUpperCase()
    const companyName = session?.user?.companyName || "Company Shard"
    const token = (session?.user as any)?.accessToken || ""

    const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "COMPANY_ADMIN", "OPS_ADMIN", "FINANCE_ADMIN", "HR_ADMIN", "VIEWER_ADMIN", "HR", "MANAGER", "AUDITOR", "SUPPORT_ADMIN", "PAYROLL_ADMIN", "HELPDESK_ADMIN"]

    // ── Client-side role guard (middleware is primary, this is secondary) ──
    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.replace("/login")
            return
        }
        if (authStatus === "authenticated" && !STAFF_ROLES.includes(role)) {
            // Non-admin/staff user reached /admin → send to employee dashboard
            router.replace("/employee")
        }
    }, [authStatus, role, router])

    // Handle initial scroll and dark mode toggle logic (UI only for now)
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // ── Auto-start tour on first admin login ──
    const { start: startTour } = useTour()
    useEffect(() => {
        if (authStatus !== "authenticated") return
        const seen = localStorage.getItem(ADMIN_TOUR_LS_KEY)
        if (!seen) {
            setTimeout(() => startTour(adminTourSteps, ADMIN_TOUR_LS_KEY), 1200)
        }
    }, [authStatus])

    // ── Fetch sidebar attendance when dropdown is open ──
    const [sidebarLiveSessions, setSidebarLiveSessions] = useState<any[]>([])

    // ── Access Requests (for personal email approvals) ──
    const [accessRequests, setAccessRequests] = useState<any[]>([])
    const [accessLoading, setAccessLoading] = useState(false)

    const fetchAccessRequests = useCallback(async () => {
        if (!token) return
        setAccessLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/auth/access-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setAccessRequests(data.requests || [])
            }
        } catch { }
        finally { setAccessLoading(false) }
    }, [token])

    const handleAccessAction = async (email: string, status: 'approved' | 'rejected') => {
        if (!token) return
        try {
            const res = await fetch(`${API_BASE_URL}/auth/update-access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email, status })
            })
            if (res.ok) {
                toast.success(`${email} ${status}`)
                fetchAccessRequests()
            } else {
                toast.error('Action failed')
            }
        } catch { toast.error('Network error') }
    }

    useEffect(() => {
        if (currentTab === 'access-requests') fetchAccessRequests()
    }, [currentTab, fetchAccessRequests])

    const pendingCount = accessRequests.filter(r => r.status === 'pending').length

    const fetchSidebarAttendance = useCallback(async () => {
        if (!token) return
        const headers = { Authorization: `Bearer ${token}` }
        try {
            const [empRes, overviewRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/employees`, { headers }).catch(() => null),
                fetch(`${API_BASE_URL}/admin/overview`, { headers }).catch(() => null),
            ])
            if (empRes?.ok) {
                const raw = await empRes.json()
                setSidebarEmployees(Array.isArray(raw) ? raw : raw.users || [])
            }
            if (overviewRes?.ok) {
                const overview = await overviewRes.json()
                setSidebarLiveSessions(overview.liveSessions || [])
            }
        } catch { }
    }, [token])

    useEffect(() => {
        const isAttendanceTab = currentTab === 'attendance-present' || currentTab === 'attendance-absent'
        if (!leaveDropOpen && !isAttendanceTab) return

        fetchSidebarAttendance()
        const iv = setInterval(fetchSidebarAttendance, 15000) // Fast poll for responsiveness
        return () => clearInterval(iv)
    }, [leaveDropOpen, currentTab, fetchSidebarAttendance])

    // ── WebSocket Real-time Triggers ──
    useWebSocket({
        onMessage: (msg) => {
            if (msg.type === "DASHBOARD_STATS") {
                // When any dashboard stat changes (clock-in, clock-out, etc), refresh our list
                fetchSidebarAttendance()
            }
        },
        enabled: !!token
    })

    // Present = employees who actually clocked in today (from live sessions)
    const clockedInIds = new Set(sidebarLiveSessions.map((s: any) => s.id))
    const sidebarActive = sidebarEmployees.filter(e => e.status === 'ACTIVE' || !e.status)
    const sidebarPresentRaw = sidebarActive.filter(e => clockedInIds.has(e.id))
    const sidebarAbsentRaw = sidebarActive.filter(e => !clockedInIds.has(e.id))

    // ── Apply Filters to Attendance Lists ──
    const filterList = (list: any[]) => list.filter(e => {
        const matchesSearch = !attSearch ||
            e.name?.toLowerCase().includes(attSearch.toLowerCase()) ||
            e.email?.toLowerCase().includes(attSearch.toLowerCase())
        const matchesDept = attDept === "ALL" || e.department?.name === attDept
        const matchesStatus = attStatus === "ALL" || e.status === attStatus
        return matchesSearch && matchesDept && matchesStatus
    })

    const sidebarPresent = filterList(sidebarPresentRaw)
    const sidebarAbsent = filterList(sidebarAbsentRaw)
    const departments = Array.from(new Set(sidebarEmployees.map(e => e.department?.name).filter(Boolean)))

    const handleDownloadAttendance = (type: 'present' | 'absent') => {
        const data = type === 'present' ? sidebarPresent : sidebarAbsent
        if (data.length === 0) return toast.error("No records to export")

        const headers = ["Name", "Email", "Role", "Department", "Status"]
        const rows = data.map(e => [
            `"${e.name}"`, `"${e.email}"`, `"${e.role}"`, `"${e.department?.name || 'N/A'}"`, `"${e.status || 'ACTIVE'}"`
        ])

        const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
        const link = document.createElement("a")
        link.setAttribute("href", encodeURI(csv))
        link.setAttribute("download", `attendance_${type}_${format(new Date(), 'yyyy-MM-dd')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Exported ${data.length} records`)
    }



    if (authStatus === "loading") {
        return <div className="flex min-h-screen items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
    }

    const allNavItems = [
        // 1. Dashboard
        { id: "dashboard", label: "Dashboard", tab: "dashboard", icon: LayoutDashboard, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "MANAGER", "AUDITOR", "SUPPORT_ADMIN", "PAYROLL_ADMIN", "SUPER_ADMIN"], group: "core" },
        // 2. Employee Management
        { id: "employees", label: "Manage Employees", tab: "employees", icon: Users, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "SUPER_ADMIN", "MANAGER"], group: "hr" },
        // 3. Onboarding
        { id: "onboarding", label: "Add Employees", tab: "onboarding", icon: UserPlus, roles: ["SUPER_ADMIN", "HR_ADMIN", "HR", "COMPANY_ADMIN", "ADMIN"], group: "hr" },
        // 4. Attendance
        { id: "attendance", label: "Attendance", tab: "attendance", icon: Clock, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "SUPER_ADMIN", "MANAGER"], group: "finance" },
        // 5. Leave Management
        { id: "leave", label: "Leaves", tab: "leave", icon: Calendar, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "SUPER_ADMIN", "MANAGER"], group: "finance" },
        { id: "payroll", label: "Payroll", tab: "payroll", icon: CreditCard, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "PAYROLL_ADMIN"], group: "finance" },
        // 7. Performance
        { id: "performance", label: "Performance", tab: "performance", icon: TrendingUp, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "MANAGER"], group: "company" },
        // 8. Departments / Organization
        { id: "departments", label: "Departments", tab: "departments", icon: Building2, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "SUPER_ADMIN"], group: "company" },
        // 9. Employee Documents
        { id: "emp-documents", label: "Employee Docs", tab: "emp-documents", icon: FileText, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "SUPER_ADMIN", "AUDITOR"], group: "company" },
        // 9.5 Company Resources
        { id: "company-documents", label: "Company Resources", tab: "company-documents", icon: Share2, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "SUPER_ADMIN"], group: "company" },
        // Employee Details (Secure Record View)
        { id: "employee-details", label: "Employee Info", tab: "employee-details", icon: UserCheck, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "SUPER_ADMIN", "MANAGER", "AUDITOR"], group: "company" },
        // 10. Reports & Analytics
        { id: "reports", label: "Reports", tab: "reports", icon: BarChart3, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "SUPER_ADMIN", "MANAGER", "AUDITOR", "PAYROLL_ADMIN"], group: "admin" },
        // 11. Ticket Tracking
        { id: "support", label: "Ticket Tracking", tab: "support", icon: Ticket, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "SUPER_ADMIN", "SUPPORT_ADMIN"], group: "admin" },

        // 13. Settings
        { id: "settings", label: "Settings", tab: "settings", icon: Settings, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "SUPER_ADMIN"], group: "admin" },
        // 14. Announcements
        { id: "announcements", label: "Announcements", tab: "broadcasts", icon: Megaphone, roles: ["SUPER_ADMIN"], group: "company" },
        // 14.5 Holiday Management
        { id: "holidays", label: "Holiday Management", tab: "holidays", icon: Calendar, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "SUPER_ADMIN"], group: "company" },
        // Projects
        { id: "projects", label: "Project Management", tab: "projects", icon: Briefcase, roles: ["SUPER_ADMIN", "ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "HR", "MANAGER"], group: "company" },
        // 15. Account Vault
        { id: "account-vault", label: "Account Vault", tab: "account-vault", icon: Lock, roles: ["SUPER_ADMIN"], group: "admin", strictSuperAdmin: true },
        // 16. Employee Skills
        { id: "employee-skills", label: "Employee Skills", tab: "employee-skills", icon: Sparkles, roles: ["SUPER_ADMIN"], group: "hr", strictSuperAdmin: true },
        // 18. Access Requests (personal email approvals)
        { id: "access-requests", label: "Access Requests", tab: "access-requests", icon: ShieldCheck, roles: ["ADMIN", "COMPANY_ADMIN", "HR_ADMIN", "SUPER_ADMIN"], group: "admin" },
    ]

    const navItems = allNavItems.filter(item => {
        // First check if role is allowed (ADMIN family usually gets everything)
        let isAllowedByRole = item.roles.includes(role) || role === "ADMIN" || role === "COMPANY_ADMIN";

        // Ensure highly classified items are strictly for SUPER_ADMIN
        if ((item as any).strictSuperAdmin && role !== "SUPER_ADMIN") {
            isAllowedByRole = false;
        }

        // Then apply specific exclusions for SUPER_ADMIN
        if (role === "SUPER_ADMIN") {
            const exclusions = ["policies", "onboarding", "payroll", "departments", "performance"];
            if (exclusions.includes(item.id)) return false;
        }

        return isAllowedByRole;
    })

    return (
        <div className="min-h-screen gradient-mesh flex font-body overflow-hidden" suppressHydrationWarning>
            <GlobalStyles />

            {/* ── Tour Engine ── */}
            <TourOverlay />
            <TourTooltip />

            {/* ── 🛡️ EXECUTIVE SIDEBAR ── */}
            <aside data-tour="admin-header" className="w-[72px] lg:w-[280px] bg-white flex flex-col h-screen sticky top-0 z-40 shrink-0 border-r border-slate-100 shadow-[2px_0_24px_rgba(99,102,241,0.06)]">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-500/[0.03] to-transparent pointer-events-none" />

                {/* BRAND HEADER */}
                <div className="pt-10 pb-10 px-6 lg:px-8 relative z-10">
                    <div className="hidden lg:flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[18px] bg-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform hover:scale-110 active:scale-95 cursor-pointer overflow-hidden p-1.5 shrink-0" onClick={() => router.push('/admin')}>
                            <img src="/rudratic-logo.png" alt="Rudratic" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Rudratic</h2>
                            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mt-2 leading-none">Admin Workspace</p>
                        </div>
                    </div>
                    <div className="lg:hidden flex items-center justify-center">
                        <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-indigo-500/30 cursor-pointer overflow-hidden p-1.5" onClick={() => router.push('/admin')}>
                            <img src="/rudratic-logo.png" alt="Rudratic" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                    </div>
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 px-4 lg:px-5 py-2 overflow-y-auto sidebar-scrollbar relative z-10">
                    <div className="space-y-8">
                        {['core', 'hr', 'finance', 'company', 'admin', 'tools'].map(group => {
                            const groupItems = navItems.filter(i => i.group === group)
                            if (groupItems.length === 0) return null

                            const groupLabels: Record<string, string> = {
                                'core': 'Main',
                                'hr': 'Staff',
                                'finance': 'Daily Work',
                                'company': 'Company',
                                'admin': 'Admin',
                                'tools': 'Tools'
                            }

                            return (
                                <div key={group} className="space-y-1.5">
                                    <p className="hidden lg:block text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] px-4 mb-3">{groupLabels[group]}</p>
                                    <div className="space-y-0.5">
                                        {groupItems.map(item => {
                                            const Icon = item.icon
                                            const isExternal = 'external' in item && (item as any).external
                                            const isActive = !isExternal && currentTab === item.tab
                                            const isAttendanceItem = item.id === 'attendance'

                                            // Map sidebar item ids to data-tour targets
                                            const tourTargetMap: Record<string, string> = {
                                                'employees':      'admin-sidebar-employees',
                                                'onboarding':     'admin-sidebar-add',
                                                'attendance':     'admin-sidebar-attendance',
                                                'leave':          'admin-sidebar-leaves',
                                                'payroll':        'admin-sidebar-payroll',
                                                'access-requests':'admin-approve-requests',
                                            }
                                            const tourTarget = tourTargetMap[item.id]

                                            return (
                                                <div key={item.id} {...(tourTarget ? { 'data-tour': tourTarget } : {})}>
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                if (isExternal) {
                                                                    window.open((item as any).href, '_blank')
                                                                } else {
                                                                    router.push(`/admin?tab=${item.tab}`)
                                                                    if (isAttendanceItem) setLeaveDropOpen(prev => !prev)
                                                                }
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            if (isExternal) {
                                                                window.open((item as any).href, '_blank')
                                                            } else {
                                                                router.push(`/admin?tab=${item.tab}`)
                                                                if (isAttendanceItem) setLeaveDropOpen(prev => !prev)
                                                            }
                                                        }}
                                                        title={item.label}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative outline-none",
                                                            isActive
                                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                                                                : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-center lg:justify-start gap-3.5 w-full">
                                                            <Icon className={cn("w-[18px] h-[18px] shrink-0 transition-colors duration-200", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700")} strokeWidth={isActive ? 2.5 : 1.8} />
                                                            <span className="hidden lg:inline-block text-left truncate">{item.label}</span>
                                                            {isExternal && <ExternalLink className="hidden lg:block w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0 ml-auto" />}
                                                            {isAttendanceItem && <ChevronRight className={cn("hidden lg:block w-3.5 h-3.5 ml-auto shrink-0 transition-transform duration-300 text-slate-400", leaveDropOpen && "rotate-90 text-indigo-500")} />}
                                                        </div>
                                                        {isActive && (
                                                            <motion.div layoutId="activeSidebarIndicator" className="hidden lg:block absolute -left-[5px] top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-400 rounded-r-full" />
                                                        )}
                                                    </div>

                                                    {/* ── ATTENDANCE DROPDOWN: Present / Absent ── */}
                                                    {isAttendanceItem && (
                                                        <AnimatePresence>
                                                            {leaveDropOpen && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.3, ease: "circOut" }}
                                                                    className="overflow-hidden hidden lg:block ml-4 mt-1 border-l border-slate-200"
                                                                >
                                                                    <div className="pl-4 space-y-0.5 pb-1">
                                                                        <div
                                                                            role="button"
                                                                            tabIndex={0}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                                    e.preventDefault();
                                                                                    router.push('/admin?tab=attendance-present');
                                                                                }
                                                                            }}
                                                                            onClick={() => router.push('/admin?tab=attendance-present')}
                                                                            className={cn("w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer",
                                                                                currentTab === 'attendance-present' ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-slate-700")}>
                                                                            <div className={cn("w-1.5 h-1.5 rounded-full", currentTab === 'attendance-present' ? "bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.4)]" : "bg-slate-300")} />
                                                                            Present
                                                                            <span className="ml-auto text-[10px] opacity-60">{sidebarPresent.length}</span>
                                                                        </div>
                                                                        <div
                                                                            role="button"
                                                                            tabIndex={0}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                                    e.preventDefault();
                                                                                    router.push('/admin?tab=attendance-absent');
                                                                                }
                                                                            }}
                                                                            onClick={() => router.push('/admin?tab=attendance-absent')}
                                                                            className={cn("w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer",
                                                                                currentTab === 'attendance-absent' ? "text-rose-600 bg-rose-50" : "text-slate-400 hover:text-slate-700")}>
                                                                            <div className={cn("w-1.5 h-1.5 rounded-full", currentTab === 'attendance-absent' ? "bg-rose-500 shadow-[0_0_6px_rgba(251,113,133,0.4)]" : "bg-slate-300")} />
                                                                            Absent
                                                                            <span className="ml-auto text-[10px] opacity-60">{sidebarAbsent.length}</span>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </nav>

                {/* USER IDENTITY FOOTER */}
                <div className="px-5 py-6 mt-auto border-t border-slate-200/80 relative z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100/80 transition-all group outline-none">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm relative shadow-md shadow-indigo-500/30">
                                    {(session?.user?.name || "A")[0].toUpperCase()}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                                </div>
                                <div className="hidden lg:flex flex-col items-start min-w-0 flex-1">
                                    <span className="text-[13px] font-bold text-slate-800 leading-none truncate w-full">{session?.user?.name?.split(' ')[0] || 'Admin'}</span>
                                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-1.5 truncate w-full">{role.replace('_', ' ')}</span>
                                </div>
                                <ChevronRight className="hidden lg:block w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 bg-white border border-slate-100 rounded-[32px] p-3 shadow-2xl ml-4 mb-4">
                            <div className="px-5 py-4 mb-2 bg-slate-50/50 rounded-[22px]">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Logged In</p>
                                <p className="text-[13px] font-semibold text-slate-900 truncate">{session?.user?.email || "admin@hr.com"}</p>
                            </div>
                            <DropdownMenuItem onClick={() => router.push(getProfileLinkByRole(role))} className="rounded-xl px-4 py-3 focus:bg-slate-50 group cursor-pointer text-slate-600 transition-all">
                                <User className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-900" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">My Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-50 my-2" />
                            <DropdownMenuItem onClick={() => signOutAndClearSession((session?.user as any)?.email)} className="rounded-xl px-4 py-3 focus:bg-rose-50 group cursor-pointer text-rose-500 transition-all">
                                <LogOut className="w-4 h-4 mr-3" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* ── 📝 COMMAND STAGE ── */}
            <main className="flex-1 overflow-y-auto h-screen gradient-mesh custom-scrollbar">
                <TopHeader
                    token={token}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    tourLauncher={<TourLauncher steps={adminTourSteps} lsKey={ADMIN_TOUR_LS_KEY} />}
                />

                <div className="max-w-[1700px] mx-auto px-10 py-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: "circOut" }}
                            className="min-h-full"
                        >
                            {currentTab === "dashboard" && <div data-tour="admin-stats"><ExecutiveHub token={token} hideVitals={true} /></div>}
                            {currentTab === "employees" && <UserManagementTable token={token} userRole={role} />}
                            {currentTab === "onboarding" && <OnboardingSuite token={token} />}
                            {(currentTab === "attendance" || currentTab === "attendance-present" || currentTab === "attendance-absent") && <AttendanceControlCenter token={token} initialTab={currentTab} />}
                            {currentTab === "leave" && <LeaveApprovalCenter token={token} />}
                            {currentTab === "payroll" && <PayrollControlCenter token={token} />}
                            {currentTab === "performance" && <PerformanceHub token={token} />}
                            {currentTab === "departments" && <OrganizationControlCenter token={token} />}
                            {currentTab === "emp-documents" && <DocumentsModule token={token} />}
                            {currentTab === "company-documents" && <CompanyDocumentsPage />}
                            {currentTab === "employee-details" && <EmployeeDetailsModule token={token} userRole={role} />}
                            {currentTab === "reports" && <ManagerReports token={token} />}
                            {currentTab === "support" && <AdminKanbanBoard token={token} />}
                            {currentTab === "user-management" && <SecurityAuditLogs token={token} />}
                            {currentTab === "settings" && <SystemSettingsCenter token={token} />}
                            {currentTab === "broadcasts" && <BroadcastCenter token={token} />}
                            {currentTab === "dept-reports" && <DepartmentReports token={token} />}
                            {currentTab === "account-vault" && <AccountVault token={token} />}
                            {currentTab === "employee-skills" && <EmployeeSkills token={token} />}
                            {currentTab === "projects" && <ProjectsModule token={token} />}
                            {currentTab === "holidays" && <HolidayManagement />}

                            {/* PROFILE MODULE */}
                            {currentTab === "profile" && (
                                <UserProfileView
                                    user={session?.user || { name: "Admin", email: "admin@hr.com" }}
                                    onClose={() => router.push("/admin?tab=dashboard")}
                                    token={token}
                                />
                            )}

                            {/* ACCESS REQUESTS MODULE */}
                            {currentTab === "access-requests" && (
                                <div data-tour="admin-approve-requests" className="space-y-6">

                                    {/* Title row */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800">Admin Requests</h2>
                                            <p className="text-sm text-slate-500 mt-1">Manage user requests for portal access.</p>
                                        </div>
                                        <button
                                            onClick={fetchAccessRequests}
                                            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
                                        >
                                            {accessLoading ? "Refreshing..." : "↻ Refresh"}
                                        </button>
                                    </div>

                                    {/* White card table */}
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

                                        {/* Tab bar inside card */}
                                        <div className="border-b border-slate-100 flex">
                                            <div className="px-5 py-3 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600">
                                                Login Access
                                                {pendingCount > 0 && (
                                                    <span className="ml-2 text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                                                        {pendingCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Loading */}
                                        {accessLoading && (
                                            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                                                <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                                                <span className="text-sm">Loading requests...</span>
                                            </div>
                                        )}

                                        {/* Empty */}
                                        {!accessLoading && accessRequests.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                                <ShieldCheck className="w-10 h-10 mb-3 opacity-20" />
                                                <p className="font-semibold text-sm">No access requests yet</p>
                                                <p className="text-xs mt-1 text-slate-400">Personal email users who click "Request Access" will appear here</p>
                                            </div>
                                        )}

                                        {/* Table */}
                                        {!accessLoading && accessRequests.length > 0 && (
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-100">
                                                        {["Requested By", "Email", "Company", "Reason", "Status", "Actions"].map(h => (
                                                            <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {accessRequests.map((req: any, idx: number) => (
                                                        <tr
                                                            key={req.email}
                                                            className={`hover:bg-slate-50 transition-colors ${req.status === 'pending' ? 'bg-amber-50/40' : 'bg-white'} ${idx < accessRequests.length - 1 ? 'border-b border-slate-50' : ''}`}
                                                        >
                                                            {/* Name */}
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                                                        {(req.fullName || req.email)?.[0]?.toUpperCase()}
                                                                    </div>
                                                                    <span className="font-semibold text-slate-800 text-sm">{req.fullName || "—"}</span>
                                                                </div>
                                                            </td>

                                                            {/* Email */}
                                                            <td className="px-5 py-3.5">
                                                                <span className="text-[13px] text-indigo-500 font-mono">{req.email}</span>
                                                            </td>

                                                            {/* Company */}
                                                            <td className="px-5 py-3.5">
                                                                <span className="text-sm text-slate-600">{req.company || "—"}</span>
                                                            </td>

                                                            {/* Reason */}
                                                            <td className="px-5 py-3.5 max-w-[160px]">
                                                                <span className="text-xs text-slate-400 italic">{req.reason || "—"}</span>
                                                            </td>

                                                            {/* Status */}
                                                            <td className="px-5 py-3.5">
                                                                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                                                                    req.status === 'approved' ? 'bg-blue-600 text-white'
                                                                    : req.status === 'rejected' ? 'bg-rose-100 text-rose-600'
                                                                    : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                                </span>
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="px-5 py-3.5">
                                                                {req.status === 'pending' ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleAccessAction(req.email, 'approved')}
                                                                            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleAccessAction(req.email, 'rejected')}
                                                                            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 transition-colors"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-300">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}


// ─────────────────────────────────────────────────────────────────────────────
//  ROOT PAGE EXPORT (with Suspense for useSearchParams)
// ─────────────────────────────────────────────────────────────────────────────
export default function CompanyAdminPage() {
    return (
        <TourProvider>
            <Suspense fallback={
                <div className="flex min-h-screen items-center justify-center bg-white shadow-2xl">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading...</p>
                    </div>
                </div>
            }>
                <AdminDashboardContent />
            </Suspense>
        </TourProvider>
    )
}

