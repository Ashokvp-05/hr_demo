"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { signOutAndClearSession } from "@/lib/sign-out"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    LayoutDashboard,
    Clock,
    Calendar,
    BarChart3,
    CreditCard,
    User,
    Shield,
    MoreVertical,
    LogOut,
    Building2,
    Database,
    ShieldCheck,
    Settings,
    Users,
    UserPlus,
    FileText,
    HelpCircle,
    Megaphone,
    Monitor,
    ExternalLink,
    Ellipsis,
} from "lucide-react"

import { getDashboardByRole, getProfileLinkByRole } from "@/lib/role-redirect"

// ─────────────────────────────────────────────
//  ROUTE DEFINITIONS
// ─────────────────────────────────────────────



const getNavItems = (role?: string) => {
    const r = role?.toUpperCase()

    // Admin families
    if (r === "ADMIN" || r === "COMPANY_ADMIN" || r === "SUPER_ADMIN") {
        const adminLinks = [
            { name: "Admin Hub", href: "/admin/dashboard", icon: LayoutDashboard, group: "core" },
            { name: "Organization", href: "/admin/organization", icon: Building2, group: "company" },
            { name: "Employee Details", href: "/admin/employee-details", icon: User, group: "company" },
            { name: "Documents", href: "/documents", icon: FileText, group: "company" },
            { name: "Reports", href: "/admin/reports", icon: BarChart3, group: "company" },
            { name: "Announcements", href: "/admin/announcements", icon: Megaphone, group: "company" },
            { name: "Holiday Management", href: "/admin/holidays", icon: Calendar, group: "company" },
            { name: "Help Desk", href: "/help", icon: HelpCircle, group: "admin" },
            { name: "Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck, group: "admin" },
            { name: "Settings", href: "/admin/settings", icon: Settings, group: "admin" },
        ]

        if (r === "SUPER_ADMIN") {
            adminLinks.push({ name: "Employee Management", href: "/admin/users", icon: Users, group: "hr" })
        }

        return adminLinks
    }

    // Manager families
    if (r === "MANAGER" || r === "HR_MANAGER" || r === "HR") {
        return [
            { name: "Dashboard", href: "/manager?tab=dashboard", icon: LayoutDashboard, group: "core" },
            { name: "Employee Management", href: "/manager?tab=employees", icon: Users, group: "hr" },
            { name: "Attendance", href: "/manager?tab=attendance", icon: Clock, group: "finance" },
            { name: "Leaves", href: "/manager?tab=leaves", icon: Calendar, group: "finance" },
            { name: "Payroll", href: "/manager?tab=payroll", icon: CreditCard, group: "finance" },
            { name: "Departments", href: "/manager?tab=departments", icon: Building2, group: "company" },
            { name: "Announcements", href: "/manager?tab=announcements", icon: Megaphone, group: "company" },
            { name: "Documents", href: "/manager?tab=documents", icon: FileText, group: "company" },
            { name: "Reports", href: "/manager?tab=reports", icon: BarChart3, group: "company" },
            { name: "Support Desk", href: "/manager?tab=support", icon: HelpCircle, group: "admin" },
        ]
    }

    // Normal Employees
    return [
        { name: "Dashboard", href: getDashboardByRole(role), icon: LayoutDashboard, group: "core" },
        { name: "Attendance", href: "/attendance", icon: Clock, group: "finance" },
        { name: "Leaves", href: "/leave", icon: Calendar, group: "finance" },
        { name: "Reports", href: "/reports", icon: BarChart3, group: "company" },
        { name: "Payslips", href: "/payslip", icon: CreditCard, group: "finance" },
        { name: "Documents", href: "/documents", icon: FileText, group: "company" },
        { name: "Help Desk", href: "/help", icon: HelpCircle, group: "company" },
    ]
}

export default function Navbar({ role, token, companyName }: { role?: string; token?: string; companyName?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isMounted, setIsMounted] = React.useState(false)
    const { data: session } = useSession()

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const navItems = getNavItems(role)
    const roleString = session?.user?.role || role || 'USER'

    const isLight = roleString === 'EMPLOYEE' || roleString === 'USER'

    if (!isMounted) return <aside className={`w-[72px] lg:w-[280px] ${isLight ? 'bg-white border-r border-slate-200' : 'bg-[#1a1f36]'} flex flex-col h-screen sticky top-0 shrink-0`} />

    return (
        <aside data-tour="emp-header" className={`w-[72px] lg:w-[280px] ${isLight ? 'bg-white border-r border-slate-200' : 'bg-[#1a1f36]'} flex flex-col h-screen sticky top-0 z-40 shrink-0 ${isLight ? 'custom-scrollbar-sidebar-light' : 'custom-scrollbar-sidebar'} shadow-[4px_0_30px_rgba(0,0,0,0.15)] overflow-hidden`}>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
                .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
                .font-body { font-family: 'Inter', sans-serif; }
                
                .custom-scrollbar-sidebar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-sidebar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-sidebar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                .custom-scrollbar-sidebar:hover::-webkit-scrollbar-thumb { background: #475569; }

                .custom-scrollbar-sidebar-light::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-sidebar-light::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-sidebar-light::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar-sidebar-light:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
            `}</style>

            {/* Background Glow */}
            {!isLight && <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />}
            {isLight && <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none" />}

            {/* BRAND HEADER */}
            <div className="pt-10 pb-10 px-6 lg:px-8 relative z-10">
                <div className="hidden lg:flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[18px] bg-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform hover:scale-110 active:scale-95 cursor-pointer overflow-hidden p-1.5" onClick={() => router.push('/')}>
                        <Image src="/rudratic-logo.png" alt="Rudratic" width={48} height={48} className="w-full h-full object-contain drop-shadow-md" />
                    </div>
                    <div>
                        <h2 className={cn("text-xl font-bold tracking-tight leading-none", isLight ? "text-slate-900" : "text-white")}>Rudratic</h2>
                        <p className={cn("text-[9px] font-bold uppercase tracking-[0.2em] mt-2 leading-none", isLight ? "text-indigo-600" : "text-indigo-400")}>HR Platform</p>
                    </div>
                </div>
                <div className="lg:hidden flex items-center justify-center">
                    <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-indigo-500/30 overflow-hidden p-1.5" onClick={() => router.push('/')}>
                        <Image src="/rudratic-logo.png" alt="Rudratic" width={44} height={44} className="w-full h-full object-contain drop-shadow-md" />
                    </div>
                </div>
            </div>

            {/* NAVIGATION */}
            <nav className={`flex-1 px-4 lg:px-5 py-2 overflow-y-auto ${isLight ? 'custom-scrollbar-sidebar-light' : 'custom-scrollbar-sidebar'} relative z-10`}>
                <div className="space-y-8">
                    {['core', 'hr', 'finance', 'company', 'admin', 'tools'].map(group => {
                        const groupItems = navItems.filter(i => i.group === group)
                        if (groupItems.length === 0) return null

                        const groupLabels: Record<string, string> = {
                            'core': 'Overview',
                            'hr': 'Personnel',
                            'finance': 'Operations',
                            'company': 'Organization',
                            'admin': 'System',
                            'tools': 'Integrations'
                        }

                        return (
                            <div key={group} className="space-y-1.5">
                                <p className={cn("hidden lg:block text-[9px] font-bold uppercase tracking-[0.3em] px-4 mb-3", isLight ? "text-slate-400" : "text-slate-500")}>{groupLabels[group]}</p>
                                <div className="space-y-0.5">
                                    {groupItems.map(item => {
                                        const Icon = item.icon

                                        // Robust active logic
                                        const isQueryLink = item.href.includes("?tab=")
                                        const baseHref = item.href.split("?")[0]
                                        const tabValue = item.href.split("tab=")[1]
                                        const currentTab = searchParams?.get("tab")

                                        let isActive = false
                                        if (isQueryLink) {
                                            isActive = pathname === baseHref && (currentTab === tabValue || (!currentTab && tabValue === 'dashboard'))
                                        } else {
                                            isActive = pathname === baseHref
                                        }

                                        const isExternal = 'external' in item && (item as any).external
                                        const forceExternal = isExternal || item.href.startsWith('http')

                                        const linkContent = (
                                            <>
                                                <div className="flex items-center justify-center lg:justify-start gap-3.5 w-full">
                                                    <Icon className={cn("w-[18px] h-[18px] shrink-0 transition-colors duration-200", isActive ? (isLight ? "text-indigo-600" : "text-white") : (isLight ? "text-slate-400 group-hover:text-indigo-600" : "text-slate-500 group-hover:text-white"))} strokeWidth={isActive ? 2.5 : 1.8} />
                                                    <span className="hidden lg:inline-block text-left truncate">{item.name}</span>
                                                    {forceExternal && <ExternalLink className={cn("hidden lg:block w-3.5 h-3.5 shrink-0 ml-auto", isActive ? (isLight ? "text-indigo-400" : "text-indigo-200") : (isLight ? "text-slate-400 group-hover:text-indigo-600" : "text-slate-500 group-hover:text-white"))} />}
                                                </div>
                                                {isActive && (
                                                    <motion.div layoutId="globalActiveSidebarIndicator" className={cn("hidden lg:block absolute -left-[5px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full", isLight ? "bg-indigo-600" : "bg-indigo-400")} />
                                                )}
                                            </>
                                        )

                                        const commonClassName = cn(
                                            "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative outline-none cursor-pointer select-none",
                                            isActive
                                                ? (isLight ? "bg-indigo-50 text-indigo-700 font-bold" : "bg-indigo-600 text-white shadow-md shadow-indigo-600/25")
                                                : (isLight ? "text-slate-500 hover:bg-slate-50 hover:text-indigo-700" : "text-slate-400 hover:bg-white/5 hover:text-white")
                                        )

                                        const empTourMap: Record<string, string> = {
                                            'Dashboard': 'emp-header',
                                            'Attendance': 'emp-sidebar-attendance',
                                            'Leaves': 'emp-sidebar-leaves',
                                            'Payslips': 'emp-sidebar-payroll',
                                            'Documents': 'emp-sidebar-profile',
                                            'Help Desk': 'emp-sidebar-announcements',
                                        }
                                        const empTourTarget = empTourMap[item.name]

                                        if (forceExternal) {
                                            return (
                                                <a
                                                    key={item.href}
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={commonClassName}
                                                    {...(empTourTarget ? { 'data-tour': empTourTarget } : {})}
                                                >
                                                    {linkContent}
                                                </a>
                                            )
                                        }

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                title={item.name}
                                                className={commonClassName}
                                                {...(empTourTarget ? { 'data-tour': empTourTarget } : {})}
                                            >
                                                {linkContent}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </nav>

            {/* USER IDENTITY FOOTER */}
            <div className={cn("px-5 py-6 mt-auto border-t relative z-10", isLight ? "border-slate-100" : "border-slate-700/40")}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn("w-full flex items-center gap-4 p-3 rounded-xl transition-all group outline-none", isLight ? "hover:bg-slate-50" : "hover:bg-white/5")}>
                            <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm relative shadow-md shadow-indigo-500/30">
                                {(session?.user?.name || "E")[0].toUpperCase()}
                                <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 rounded-full", isLight ? "border-white" : "border-[#1a1f36]")} />
                            </div>
                            <div className="hidden lg:flex flex-col items-start min-w-0 flex-1">
                                <span className={cn("text-[13px] font-bold leading-none truncate w-full", isLight ? "text-slate-800" : "text-white")}>{session?.user?.name?.split(' ')[0] || 'Employee'}</span>
                                <span className={cn("text-[9px] font-medium uppercase tracking-wider mt-1.5 truncate w-full", isLight ? "text-slate-500" : "text-slate-500")}>{roleString.replace('_', ' ')}</span>
                            </div>

                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={cn("w-64 border rounded-[32px] p-3 shadow-2xl ml-4 mb-4", isLight ? "bg-white border-slate-100" : "bg-[#1a1f36] border-slate-800 text-white")}>
                        <div className={cn("px-5 py-4 mb-2 rounded-[22px]", isLight ? "bg-slate-50/50" : "bg-white/5")}>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Email Address</p>
                            <p className={cn("text-[13px] font-bold truncate font-brand", isLight ? "text-slate-900" : "text-white")}>{session?.user?.email || "employee@company.com"}</p>
                        </div>
                        <DropdownMenuItem
                            onClick={() => router.push(getProfileLinkByRole(roleString))}
                            className={cn("rounded-xl px-4 py-3 cursor-pointer transition-all focus:outline-none", isLight ? "focus:bg-slate-50 text-slate-600 hover:text-slate-900" : "focus:bg-white/5 text-slate-300 hover:text-white")}
                        >
                            <User className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-900" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">My Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className={cn("my-2", isLight ? "bg-slate-50" : "bg-slate-800")} />
                        <DropdownMenuItem 
                            onClick={() => signOutAndClearSession((session?.user as any)?.email)}
                            className={cn("rounded-xl px-4 py-3 cursor-pointer transition-all focus:outline-none", isLight ? "focus:bg-rose-50 text-rose-500" : "focus:bg-rose-950/20 text-rose-400 hover:text-rose-300")}
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    )
}


