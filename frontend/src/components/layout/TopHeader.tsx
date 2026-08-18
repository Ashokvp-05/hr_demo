"use client"

import * as React from "react"
import { Bell, User, LogOut, ChevronDown } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { signOutAndClearSession } from "@/lib/sign-out"
import { usePathname, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { getProfileLinkByRole } from "@/lib/role-redirect"

const DynamicNotificationBell = dynamic(() => import("./NotificationBell"), { ssr: false })

export default function TopHeader({
    token,
    searchQuery,
    setSearchQuery,
    breadcrumb,
    tourLauncher
}: {
    token: string,
    searchQuery?: string,
    setSearchQuery?: (val: string) => void,
    breadcrumb?: { parent: string, page: string },
    tourLauncher?: React.ReactNode
}) {
    const { data: session } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => { setMounted(true) }, [])

    const roleString = session?.user?.role || ""
    const role = roleString.replace(/_/g, ' ')
    const initials = (session?.user?.name || "A").split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

    // Determine parent context
    const isEmployee = !["ADMIN", "COMPANY_ADMIN", "SUPER_ADMIN", "HR_ADMIN"].includes(roleString.toUpperCase())
    const parentContext = breadcrumb?.parent || (isEmployee ? "Employee" : "Admin")

    // Determine current page dynamically from pathname
    let currentPage = breadcrumb?.page || "Dashboard"
    if (!breadcrumb?.page || breadcrumb.page === "Dashboard") {
        const segments = pathname.split('/').filter(Boolean)
        if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1]
            // Format segment (e.g. "company-documents" -> "Company Documents")
            currentPage = lastSegment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }
    }

    return (
        <header className={cn(
            "sticky top-0 z-[50] bg-background/80 backdrop-blur-xl transition-all",
            isEmployee ? "border-b border-slate-200" : "border-b border-zinc-800"
        )}>
            <div className="px-8 py-3.5 flex items-center justify-between">

                {/* Left: breadcrumb / page context */}
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest select-none">
                    <span className="text-indigo-600 dark:text-indigo-400">{parentContext}</span>
                    <span className={isEmployee ? "text-slate-300" : "opacity-40 text-zinc-500"}>/</span>
                    <span className={isEmployee ? "text-slate-600" : "text-zinc-500"}>{currentPage}</span>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-3">

                    {/* Tour Launcher */}
                    {tourLauncher && <>{tourLauncher}</>}

                    {/* Notification Bell */}
                    <div className="relative">
                        <DynamicNotificationBell token={token} />
                    </div>

                    {/* Divider */}
                    <div className={cn(
                        "w-px h-6 rounded-full",
                        isEmployee ? "bg-slate-200" : "bg-zinc-800"
                    )} />

                    {/* User pill */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl transition-all duration-200 group outline-none border",
                                isEmployee 
                                    ? "bg-slate-50 border-slate-200 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5"
                                    : "bg-[#1a1f36]/40 border-zinc-800 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-950/20"
                            )} suppressHydrationWarning>
                                {/* Avatar */}
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-[11px] shrink-0 shadow-md shadow-indigo-500/30 select-none">
                                    {initials}
                                </span>
                                <span className="flex-col items-start text-left leading-none hidden sm:flex">
                                    <span className={cn(
                                        "text-[12px] font-bold truncate max-w-[90px]",
                                        isEmployee ? "text-slate-800" : "text-white"
                                    )}>
                                        {session?.user?.name?.split(' ')[0] || "Admin"}
                                    </span>
                                    <span className={cn(
                                        "text-[9px] font-bold uppercase tracking-wider mt-0.5 truncate max-w-[90px]",
                                        isEmployee ? "text-slate-400" : "text-zinc-500"
                                    )}>
                                        {role || "Super Admin"}
                                    </span>
                                </span>
                                <ChevronDown className={cn(
                                    "w-3 h-3 transition-colors ml-0.5 hidden sm:block",
                                    isEmployee ? "text-slate-400 group-hover:text-slate-600" : "text-zinc-600 group-hover:text-zinc-400"
                                )} />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            className={cn(
                                "w-60 rounded-[20px] p-2 shadow-2xl mt-2 animate-in slide-in-from-top-2 duration-200 border",
                                isEmployee
                                    ? "bg-white border-slate-100 text-slate-800"
                                    : "bg-[#1a1f36] border-zinc-800 text-white"
                            )}
                            align="end"
                        >
                            {/* Identity block */}
                            <div className={cn(
                                "px-4 py-3 mb-1 rounded-[14px]",
                                isEmployee ? "bg-slate-50" : "bg-white/5"
                            )}>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Logged In As</p>
                                <p className={cn("text-[13px] font-bold truncate", isEmployee ? "text-slate-900" : "text-white")}>{session?.user?.name || "Admin"}</p>
                                <p className={cn("text-[11px] font-medium truncate mt-0.5", isEmployee ? "text-slate-500" : "text-slate-400")}>{session?.user?.email || "admin@hr.com"}</p>
                            </div>

                            <DropdownMenuItem
                                onClick={() => router.push(getProfileLinkByRole(roleString))}
                                className={cn(
                                    "rounded-xl px-3.5 py-2.5 focus:outline-none cursor-pointer text-[12px] font-semibold transition-colors gap-3 mt-1",
                                    isEmployee
                                        ? "focus:bg-slate-50 text-slate-600 focus:text-slate-900"
                                        : "focus:bg-white/5 text-zinc-300 focus:text-white"
                                )}
                            >
                                <User className="w-4 h-4 text-slate-400" />
                                My Profile
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className={isEmployee ? "bg-slate-100 my-1.5" : "bg-zinc-800 my-1.5"} />

                            <DropdownMenuItem
                                onClick={() => signOutAndClearSession((session?.user as any)?.email)}
                                className={cn(
                                    "rounded-xl px-3.5 py-2.5 focus:outline-none cursor-pointer text-[12px] font-semibold transition-colors gap-3",
                                    isEmployee
                                        ? "focus:bg-rose-50 text-rose-600 focus:text-rose-700"
                                        : "focus:bg-rose-950/20 text-rose-400 focus:text-rose-300"
                                )}
                            >
                                <LogOut className="w-4 h-4 text-rose-400" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>
        </header>
    )
}
