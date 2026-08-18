"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { signOutAndClearSession } from "@/lib/sign-out"
import { getProfileLinkByRole } from "@/lib/role-redirect"
import { Command } from "cmdk"
import {
    LayoutDashboard,
    Calendar,
    User,
    Search,
    Settings,
    LogOut,
    Clock,
    FileText,
    Shield,
    Building2,
    Activity,
    Users,
    CreditCard,
    Ticket,
    Megaphone
} from "lucide-react"

export function CommandMenu() {
    const { data: session } = useSession()
    const [open, setOpen] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        const openEvent = () => setOpen(true)

        document.addEventListener("keydown", down)
        document.addEventListener("open-command-menu", openEvent)
        return () => {
            document.removeEventListener("keydown", down)
            document.removeEventListener("open-command-menu", openEvent)
        }
    }, [])

    const runCommand = (command: () => void) => {
        setOpen(false)
        command()
    }

    if (!open) return null

    const role = (session?.user as any)?.role
    const roleName = typeof role === 'object' ? role.name : role

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                <Command className="flex flex-col h-full bg-transparent">
                    <div className="flex items-center border-b border-border px-4 py-3">
                        <Search className="mr-3 h-4 w-4 shrink-0 text-slate-500" />
                        <Command.Input
                            placeholder="Type a command or search..."
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                            autoFocus
                        />
                        <div className="ml-2 flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-medium">ESC</span>
                        </div>
                    </div>
                    <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 space-y-1">
                        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>

                        <CommandGroup role={roleName} router={router} runCommand={runCommand} />

                        {(session?.user?.role as string)?.includes('HR') && (
                            <>
                                <Command.Separator className="h-px bg-slate-100 dark:bg-slate-800 mx-2 my-2" />
                                <Command.Group heading="HR Tools" className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/hr"))}
                                        className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
                                    >
                                        <div className="h-4 w-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                        </div>
                                        <span>HR Dashboard</span>
                                        <span className="ml-auto text-xs text-slate-400">H R</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/hr/onboarding"))}
                                        className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
                                    >
                                        <User className="h-4 w-4" />
                                        <span>Onboarding</span>
                                        <span className="ml-auto text-xs text-slate-400">O B</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/hr/recruitment"))}
                                        className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
                                    >
                                        <Search className="h-4 w-4" />
                                        <span>Recruitment</span>
                                        <span className="ml-auto text-xs text-slate-400">A T S</span>
                                    </Command.Item>
                                </Command.Group>
                            </>
                        )}

                        <Command.Separator className="h-px bg-slate-100 dark:bg-slate-800 mx-2 my-2" />

                        <Command.Group heading="Account" className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Command.Item
                                onSelect={() => runCommand(() => signOutAndClearSession((session?.user as any)?.email))}
                                className="flex items-center gap-3 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer aria-selected:bg-rose-50 dark:aria-selected:bg-rose-900/20 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Log Out</span>
                            </Command.Item>
                        </Command.Group>
                    </Command.List>

                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex gap-3">
                            <span>Use arrows to navigate</span>
                            <span>Enter to select</span>
                        </div>
                    </div>
                </Command>
            </div>
            <div className="absolute inset-0 -z-10" onClick={() => setOpen(false)} />
        </div>
    )
}

function CommandGroup({ role, router, runCommand }: { role: string, router: any, runCommand: (c: any) => void }) {
    if (role === 'SUPER_ADMIN') {
        return (
            <Command.Group heading="Super Admin" className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Command.Item
                    onSelect={() => runCommand(() => router.push("/super-admin"))}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
                >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                    <span className="ml-auto text-xs text-slate-400">D</span>
                </Command.Item>
                <Command.Item
                    onSelect={() => runCommand(() => router.push("/super-admin?tab=companies"))}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
                >
                    <Building2 className="h-4 w-4" />
                    <span>Companies</span>
                    <span className="ml-auto text-xs text-slate-400">E</span>
                </Command.Item>
                <Command.Item
                    onSelect={() => runCommand(() => router.push("/super-admin?tab=admins"))}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
                >
                    <Users className="h-4 w-4" />
                    <span>Admins</span>
                    <span className="ml-auto text-xs text-slate-400">C</span>
                </Command.Item>
                <Command.Item
                    onSelect={() => runCommand(() => router.push("/super-admin?tab=billing"))}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-all"
                >
                    <CreditCard className="h-4 w-4" />
                    <span>Billing</span>
                    <span className="ml-auto text-xs text-slate-400">B</span>
                </Command.Item>
                <Command.Item
                    onSelect={() => runCommand(() => router.push("/super-admin?tab=support"))}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-all"
                >
                    <Ticket className="h-4 w-4" />
                    <span>Support</span>
                    <span className="ml-auto text-xs text-slate-400">R</span>
                </Command.Item>
                <Command.Item
                    onSelect={() => runCommand(() => router.push("/super-admin?tab=logs"))}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-all"
                >
                    <Activity className="h-4 w-4" />
                    <span>Audit Logs</span>
                    <span className="ml-auto text-xs text-slate-400">T</span>
                </Command.Item>
                <Command.Item
                    onSelect={() => runCommand(() => router.push("/super-admin?tab=security"))}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-all"
                >
                    <Shield className="h-4 w-4" />
                    <span>Security</span>
                    <span className="ml-auto text-xs text-slate-400">I</span>
                </Command.Item>
            </Command.Group>
        )
    }

    return (
        <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard"))}
                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
            >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
                <span className="ml-auto text-xs text-slate-400">D</span>
            </Command.Item>

            <Command.Item
                onSelect={() => runCommand(() => router.push("/attendance"))}
                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
            >
                <Clock className="h-4 w-4" />
                <span>Attendance</span>
                <span className="ml-auto text-xs text-slate-400">A</span>
            </Command.Item>

            <Command.Item
                onSelect={() => runCommand(() => router.push("/leave"))}
                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
            >
                <Calendar className="h-4 w-4" />
                <span>Leave Management</span>
                <span className="ml-auto text-xs text-slate-400">L</span>
            </Command.Item>

            <Command.Item
                onSelect={() => runCommand(() => router.push("/reports"))}
                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
            >
                <FileText className="h-4 w-4" />
                <span>Reports</span>
                <span className="ml-auto text-xs text-slate-400">R</span>
            </Command.Item>

            <Command.Item
                onSelect={() => runCommand(() => router.push(getProfileLinkByRole(role)))}
                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
            >
                <User className="h-4 w-4" />
                <span>My Profile</span>
                <span className="ml-auto text-xs text-slate-400">P</span>
            </Command.Item>

            <Command.Item
                onSelect={() => runCommand(() => router.push("/settings"))}
                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors"
            >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
                <span className="ml-auto text-xs text-slate-400">S</span>
            </Command.Item>
        </Command.Group>
    )
}
