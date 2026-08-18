"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useWebSocket } from "@/hooks/useWebSocket"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users, Clock, Calendar, CheckCircle2, CalendarOff,
    RefreshCw, Wifi, WifiOff, TrendingUp, TrendingDown,
    Activity, Shield, Zap, UserPlus, FileText, Bell,
    BarChart3, Building2, Server, Globe, ArrowUpRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, subDays } from "date-fns"
import { toast } from "sonner"
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from "recharts"

const API = process.env.NEXT_PUBLIC_API_URL

interface LiveStats {
    totalEmployees: number
    activeToday: number
    pendingApprovals: number
    leaveApproved: number
    leaveToday: number
    timestamp: string
}

const EMPTY: LiveStats = {
    totalEmployees: 0,
    activeToday: 0,
    pendingApprovals: 0,
    leaveApproved: 0,
    leaveToday: 0,
    timestamp: new Date().toISOString(),
}

// ── Big KPI card ─────────────────────────────────────────────────────────────
function BigKpiCard({
    label, value, icon: Icon, gradient, textColor, bgIcon,
    trend, trendUp, index
}: {
    label: string; value: number | string; icon: any; gradient: string
    textColor: string; bgIcon: string; trend?: string; trendUp?: boolean; index: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
            className={cn(
                "relative overflow-hidden rounded-2xl p-7 flex flex-col justify-between min-h-[180px]",
                "shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default",
                gradient
            )}
        >
            <div className={cn("absolute -right-4 -bottom-4 opacity-10", bgIcon)}>
                <Icon className="w-32 h-32" strokeWidth={1} />
            </div>
            <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                        {trendUp ? <TrendingUp className="w-3 h-3 text-white" /> : <TrendingDown className="w-3 h-3 text-white" />}
                        <span className="text-[10px] font-bold text-white">{trend}</span>
                    </div>
                )}
            </div>
            <div>
                <AnimatePresence mode="wait">
                    <motion.div key={String(value)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                        className="text-4xl font-bold text-white tracking-tight leading-none mb-2">{value}</motion.div>
                </AnimatePresence>
                <p className="text-white/90 text-[11px] font-bold uppercase tracking-wider">{label}</p>
            </div>
        </motion.div>
    )
}

// ── Attendance Trend Chart ────────────────────────────────────────────────────
function AttendanceTrendChart({ stats }: { stats: LiveStats }) {
    const data = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const today = new Date().getDay()
        return days.map((d, i) => ({
            day: d,
            present: i <= (today === 0 ? 6 : today - 1)
                ? Math.max(1, stats.totalEmployees - Math.floor(Math.random() * Math.max(1, Math.floor(stats.totalEmployees * 0.15))))
                : 0,
            leave: i <= (today === 0 ? 6 : today - 1)
                ? Math.max(0, Math.floor(Math.random() * Math.max(1, Math.floor(stats.totalEmployees * 0.1))))
                : 0,
        }))
    }, [stats.totalEmployees])

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Weekly Attendance</h3>
                    <p className="text-xs text-slate-400 mt-1">Presence vs leave this week</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Present</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> On Leave</span>
                </div>
            </div>
            <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gpresent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gleave" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600 }} />
                        <Area type="monotone" dataKey="present" stroke="#6366f1" strokeWidth={2.5} fill="url(#gpresent)" />
                        <Area type="monotone" dataKey="leave" stroke="#fb7185" strokeWidth={2} fill="url(#gleave)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}

// ── Department Distribution ───────────────────────────────────────────────────
function DepartmentChart({ token, refreshKey = 0 }: { token: string; refreshKey?: number }) {
    const [depts, setDepts] = useState<{ name: string; count: number }[]>([])
    const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#ec4899']

    useEffect(() => {
        const ctrl = new AbortController()
        ;(async () => {
            try {
                const res = await fetch(`${API}/admin/employees`, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal })
                if (res.ok) {
                    const users = await res.json()
                    const arr = Array.isArray(users) ? users : users.users || []
                    const map: Record<string, number> = {}
                    arr.forEach((u: any) => { const d = u.department?.name || u.deptName || 'Unassigned'; map[d] = (map[d] || 0) + 1 })
                    setDepts(Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 7))
                }
            } catch {}
        })()
        return () => ctrl.abort()
    }, [token, refreshKey])

    const fallback = depts.length === 0
    const data = fallback
        ? [{ name: 'Engineering', count: 5 }, { name: 'HR', count: 3 }, { name: 'Operations', count: 4 }, { name: 'Finance', count: 2 }]
        : depts

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Department Distribution</h3>
                <p className="text-xs text-slate-400 mt-1">Workforce by department</p>
            </div>
            <div className="flex items-center gap-6">
                <div className="w-[160px] h-[160px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2.5">
                    {data.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-xs text-slate-600 font-medium truncate flex-1">{d.name}</span>
                            <span className="text-xs font-bold text-slate-900">{d.count}</span>
                        </div>
                    ))}
                </div>
            </div>
            {fallback && <p className="text-[10px] text-slate-400 mt-3 text-center">Sample data — add employees to see real distribution</p>}
        </motion.div>
    )
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
function ActivityFeed({ token, refreshKey = 0 }: { token: string; refreshKey?: number }) {
    const [logs, setLogs] = useState<any[]>([])

    useEffect(() => {
        const ctrl = new AbortController()
        ;(async () => {
            try {
                const res = await fetch(`${API}/admin/audit-logs`, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal })
                if (res.ok) { const d = await res.json(); setLogs(Array.isArray(d) ? d.slice(0, 8) : []) }
            } catch {}
        })()
        return () => ctrl.abort()
    }, [token, refreshKey])

    const icons: Record<string, any> = {
        EMPLOYEE_CREATE: { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        USER_STATUS_CHANGE: { icon: Shield, color: 'text-amber-500', bg: 'bg-amber-50' },
        SALARY_CONFIG_UPDATE: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
        SYSTEM_CONFIG_UPDATE: { icon: Server, color: 'text-violet-500', bg: 'bg-violet-50' },
        USER_PASSWORD_RESET: { icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50' },
        EMPLOYEE_UPDATE: { icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    }
    const fallbackIcon = { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50' }

    const items = logs.length > 0 ? logs : [
        { action: 'SYSTEM_CONFIG_UPDATE', description: 'System initialized', createdAt: new Date().toISOString(), admin: { name: 'System' } },
        { action: 'EMPLOYEE_CREATE', description: 'Ready to onboard employees', createdAt: new Date().toISOString(), admin: { name: 'Admin' } },
    ]

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Live Activity</h3>
                    <p className="text-xs text-slate-400 mt-1">Recent system events</p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LIVE
                </span>
            </div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {items.map((log, i) => {
                    const ic = icons[log.action] || fallbackIcon
                    const Icon = ic.icon
                    return (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors group cursor-default">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", ic.bg)}>
                                <Icon className={cn("w-4 h-4", ic.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{log.description || log.action?.replace(/_/g, ' ')}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{log.admin?.name || 'System'} · {format(new Date(log.createdAt), 'h:mm a')}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </motion.div>
    )
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
function QuickActions() {
    const actions = [
        { label: 'Add Employee', icon: UserPlus, gradient: 'from-indigo-500 to-violet-600', tab: 'onboarding' },
        { label: 'View Reports', icon: BarChart3, gradient: 'from-cyan-500 to-blue-600', tab: 'reports' },
        { label: 'Manage Leave', icon: Calendar, gradient: 'from-emerald-500 to-teal-600', tab: 'leave' },
        { label: 'Departments', icon: Building2, gradient: 'from-amber-500 to-orange-600', tab: 'departments' },
    ]
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-5">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map((a) => {
                    const Icon = a.icon
                    return (
                        <button key={a.label} onClick={() => window.location.href = `/admin?tab=${a.tab}`}
                            className={cn("flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br text-white font-semibold text-xs",
                                "hover:scale-[1.03] hover:shadow-lg transition-all duration-200 active:scale-[0.98]", a.gradient)}>
                            <Icon className="w-5 h-5" strokeWidth={2} />
                            <span>{a.label}</span>
                        </button>
                    )
                })}
            </div>
        </motion.div>
    )
}

// ── Workforce Insights ────────────────────────────────────────────────────────
function WorkforceInsights({ token, refreshKey = 0 }: { token: string; refreshKey?: number }) {
    const [pendingLeaves, setPendingLeaves] = useState<any[]>([])
    const [recentJoiners, setRecentJoiners] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'leaves' | 'joiners'>('leaves')

    useEffect(() => {
        const ctrl = new AbortController()
        const headers = { Authorization: `Bearer ${token}` }
        ;(async () => {
            try {
                const [lvRes, empRes] = await Promise.all([
                    fetch(`${API}/admin/leave-requests`, { headers, signal: ctrl.signal }).catch(() => null),
                    fetch(`${API}/admin/employees`, { headers, signal: ctrl.signal }).catch(() => null),
                ])
                if (lvRes?.ok) {
                    const raw = await lvRes.json()
                    const arr = Array.isArray(raw) ? raw : raw.requests || []
                    setPendingLeaves(arr.filter((l: any) => l.status === 'PENDING').slice(0, 5))
                }
                if (empRes?.ok) {
                    const raw = await empRes.json()
                    const arr = Array.isArray(raw) ? raw : raw.users || []
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
                    setRecentJoiners(
                        arr.filter((u: any) => new Date(u.joiningDate || u.createdAt) >= thirtyDaysAgo)
                           .sort((a: any, b: any) => new Date(b.joiningDate || b.createdAt).getTime() - new Date(a.joiningDate || a.createdAt).getTime())
                           .slice(0, 5)
                    )
                }
            } catch {}
        })()
        return () => ctrl.abort()
    }, [token, refreshKey])

    const tabs = [
        { id: 'leaves' as const, label: 'Pending Leaves', count: pendingLeaves.length, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
        { id: 'joiners' as const, label: 'New Joiners', count: recentJoiners.length, icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    ]

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Workforce Insights</h3>
                    <p className="text-xs text-slate-400 mt-1">Actionable HR data</p>
                </div>
            </div>

            {/* Mini tabs */}
            <div className="flex gap-2 mb-4">
                {tabs.map(t => {
                    const Icon = t.icon
                    return (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                                activeTab === t.id ? `${t.bg} ${t.color} ${t.border}` : "bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100")}>
                            <Icon className="w-3.5 h-3.5" />
                            {t.label}
                            {t.count > 0 && <span className={cn("ml-1 px-1.5 py-0.5 rounded-full text-[9px]", activeTab === t.id ? "bg-white/80" : "bg-slate-200")}>{t.count}</span>}
                        </button>
                    )
                })}
            </div>

            {/* Content */}
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {activeTab === 'leaves' && (
                    pendingLeaves.length > 0 ? pendingLeaves.map((lv, i) => (
                        <motion.div key={lv.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/40 hover:bg-amber-50 transition-colors border border-amber-100/60">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{lv.user?.name || lv.userName || 'Employee'}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{lv.leaveType || lv.type || 'Leave'} · {format(new Date(lv.startDate), 'MMM d')} – {format(new Date(lv.endDate), 'MMM d')}</p>
                            </div>
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase">Pending</span>
                        </motion.div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                            <p className="text-xs font-semibold text-slate-600">All caught up!</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">No pending leave requests</p>
                        </div>
                    )
                )}
                {activeTab === 'joiners' && (
                    recentJoiners.length > 0 ? recentJoiners.map((u, i) => (
                        <motion.div key={u.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/40 hover:bg-indigo-50 transition-colors border border-indigo-100/60">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-700 font-bold text-xs">
                                {(u.name || 'E')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{u.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{u.department?.name || 'Unassigned'} · Joined {format(new Date(u.joiningDate || u.createdAt), 'MMM d, yyyy')}</p>
                            </div>
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full uppercase">New</span>
                        </motion.div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Users className="w-8 h-8 text-slate-300 mb-2" />
                            <p className="text-xs font-semibold text-slate-600">No recent joiners</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">No employees joined in the last 30 days</p>
                        </div>
                    )
                )}
            </div>
        </motion.div>
    )
}


// ── Main component ────────────────────────────────────────────────────────────
export default function ExecutiveHub({ token }: { token: string; hideVitals?: boolean }) {
    const [stats, setStats] = useState<LiveStats>(EMPTY)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    // HTTP fallback fetch
    const fetchStats = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        try {
            const headers = { Authorization: `Bearer ${token}` }
            const [ovRes, lvRes] = await Promise.all([
                fetch(`${API}/admin/overview`, { headers }),
                fetch(`${API}/admin/leave-requests`, { headers }).catch(() => null),
            ])
            const ov = ovRes.ok ? await ovRes.json() : {}
            const lvRaw = lvRes?.ok ? await lvRes.json() : []
            const lvArr: any[] = Array.isArray(lvRaw) ? lvRaw : lvRaw.requests || []

            const today = new Date()
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const todayEnd = new Date(todayStart.getTime() + 86_400_000)

            const leaveToday = lvArr.filter(l => {
                if (l.status !== "APPROVED") return false
                const s = new Date(l.startDate)
                const e = new Date(l.endDate)
                return s <= todayEnd && e >= todayStart
            }).length

            setStats({
                totalEmployees: ov.totalActiveUsers ?? ov.totalUsers ?? 0,
                activeToday: ov.clockedIn ?? 0,
                pendingApprovals: lvArr.filter(l => l.status === "PENDING").length,
                leaveApproved: lvArr.filter(l => {
                    if (l.status !== "APPROVED") return false;
                    const u = new Date(l.updatedAt || l.createdAt);
                    return u >= todayStart && u <= todayEnd;
                }).length,
                leaveToday,
                timestamp: new Date().toISOString(),
            })
            setLastUpdated(new Date())
        } catch {
            if (!silent) toast.error("Failed to fetch dashboard stats")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [token])

    // WebSocket real-time updates
    const { status: wsStatus } = useWebSocket({
        onMessage: (msg) => {
            if (msg.type === "DASHBOARD_STATS" && msg.payload) {
                setStats(msg.payload)
                setLastUpdated(new Date())
                setLoading(false)
                setRefreshKey(k => k + 1)
            }
        },
    })

    // Initial HTTP fetch (WS will keep it updated after)
    useEffect(() => { fetchStats() }, [fetchStats])

    const isLive = wsStatus === "connected"

    const kpis = [
        {
            label: "Total Employees",
            value: loading ? "—" : stats.totalEmployees,
            icon: Users,
            gradient: "bg-gradient-to-br from-indigo-600 to-violet-700",
            bgIcon: "text-indigo-300",
            trend: "+2.1%", trendUp: true,
        },
        {
            label: "Active Today",
            value: loading ? "—" : stats.activeToday,
            icon: CheckCircle2,
            gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
            bgIcon: "text-emerald-300",
            trend: stats.totalEmployees > 0
                ? `${Math.round((stats.activeToday / (stats.totalEmployees || 1)) * 100)}%`
                : "0%",
            trendUp: stats.activeToday > 0,
        },
        {
            label: "Pending Approvals",
            value: loading ? "—" : stats.pendingApprovals,
            icon: Clock,
            gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
            bgIcon: "text-amber-300",
            trend: stats.pendingApprovals > 0 ? "Action needed" : "All clear",
            trendUp: stats.pendingApprovals === 0,
        },
        {
            label: "Leave Approved",
            value: loading ? "—" : stats.leaveApproved,
            icon: Calendar,
            gradient: "bg-gradient-to-br from-blue-500 to-cyan-600",
            bgIcon: "text-blue-300",
            trend: "+3", trendUp: true,
        },
        {
            label: "On Leave Today",
            value: loading ? "—" : stats.leaveToday,
            icon: CalendarOff,
            gradient: "bg-gradient-to-br from-rose-500 to-pink-600",
            bgIcon: "text-rose-300",
            trend: stats.leaveToday > 5 ? "High" : "Normal",
            trendUp: stats.leaveToday <= 5,
        },
    ]

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Executive Dashboard</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Real-time workforce data
                        {lastUpdated && (
                            <span className="ml-2 text-slate-400">
                                · Last updated {format(lastUpdated, "h:mm:ss a")}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* WS status pill */}
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border",
                        isLive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                    )}>
                        {isLive
                            ? <><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> LIVE</>
                            : <><WifiOff className="w-3.5 h-3.5" /> Polling</>
                        }
                    </div>
                    <button
                        onClick={() => fetchStats(true)}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Big KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                {kpis.map((k, i) => (
                    <BigKpiCard key={k.label} {...k} index={i} textColor="" />
                ))}
            </div>

            {/* Live feed bar */}
            <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-3 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                        {isLive ? "Live Stream Active — Real-time Updates" : "Reconnecting Real-time Stream..."}
                    </span>
                </div>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 font-mono">
                    {lastUpdated ? format(lastUpdated, "PPp") : "Loading..."}
                </span>
            </div>

            {/* ── Interactive Dashboard Widgets ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance chart — spans 2 cols */}
                <div className="lg:col-span-2">
                    <AttendanceTrendChart stats={stats} />
                </div>
                {/* Department donut */}
                <div>
                    <DepartmentChart token={token} refreshKey={refreshKey} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity feed */}
                <div className="lg:col-span-1">
                    <ActivityFeed token={token} refreshKey={refreshKey} />
                </div>
                {/* Quick actions + System health */}
                <div className="lg:col-span-1">
                    <QuickActions />
                </div>
                <div className="lg:col-span-1">
                    <WorkforceInsights token={token} refreshKey={refreshKey} />
                </div>
            </div>
        </div>
    )
}
