"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Search, MapPin, Briefcase, Mail, Phone, 
    ShieldCheck, Building2, Fingerprint, Activity,
    MoreVertical, Eye, Download, UserCircle, Star,
    Network
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import UserProfileView from "./UserProfileView"
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

const API = process.env.NEXT_PUBLIC_API_URL

export default function EmployeeDetailsModule({ token, userRole }: { token: string; userRole: string }) {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedUser, setSelectedUser] = useState<any | null>(null)
    
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const urlUserId = searchParams?.get("userId")

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`${API}/users?limit=ALL`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                const data = await res.json()
                setUsers(Array.isArray(data) ? data : (data.users || []))
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
        
        // Polling for live status updates every 30 seconds
        const interval = setInterval(fetchUsers, 30000)
        return () => clearInterval(interval)
    }, [token])

    useEffect(() => {
        if (urlUserId && users.length > 0) {
            const user = users.find(u => u.id === urlUserId)
            if (user) {
                setSelectedUser(user)
            }
        }
    }, [urlUserId, users])

    const handleCloseProfile = () => {
        setSelectedUser(null)
        // Remove userId from URL so it doesn't reopen on refresh
        if (urlUserId) {
            const params = new URLSearchParams(searchParams?.toString() || "")
            params.delete("userId")
            router.replace(`${pathname}?${params.toString()}`)
        }
    }

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                   u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                   u.department?.name?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        }).sort((a,b) => a.name.localeCompare(b.name))
    }, [users, searchQuery])

    return (
        <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm h-full flex flex-col font-body relative">
            
            {/* Header */}
            <div className="p-10 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-white shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-100">
                        <Network className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 font-brand leading-none">Personnel Directory</h3>
                        <p className="text-slate-500 font-medium text-[11px] mt-2.5">
                            {users.length} Active Employees
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 xl:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, or department..."
                            className="h-14 pl-14 bg-slate-50/80 border-none rounded-2xl text-[11px] font-bold uppercase tracking-widest placeholder:text-slate-400 focus-visible:ring-4 focus-visible:ring-emerald-100"
                        />
                    </div>
                </div>
            </div>

            {/* Grid Area */}
            <ScrollArea className="flex-1 bg-slate-50/30 custom-scrollbar">
                <div className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredUsers.map((user, i) => {
                                const roleName = typeof user.role === 'object' ? user.role?.name : user.role;

                                // Avatar colors based on first letter
                                const AVATAR_COLORS: Record<string, string> = {
                                    A: '#6366f1', B: '#10b981', C: '#f43f5e', D: '#f59e0b', E: '#8b5cf6',
                                    F: '#06b6d4', G: '#ec4899', H: '#14b8a6', I: '#f97316', J: '#3b82f6',
                                    K: '#ef4444', L: '#84cc16', M: '#d946ef', N: '#0ea5e9', O: '#eab308',
                                    P: '#a855f7', Q: '#22c55e', R: '#fb7185', S: '#818cf8', T: '#34d399',
                                    U: '#fbbf24', V: '#a78bfa', W: '#22d3ee', X: '#f472b6', Y: '#2dd4bf',
                                    Z: '#fb923c',
                                }
                                const avatarColor = AVATAR_COLORS[user.name?.[0]?.toUpperCase()] || '#94a3b8'

                                // Role badge colors
                                const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
                                    'SUPER_ADMIN': { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' },
                                    'ADMIN': { bg: '#fce7f3', text: '#db2777', border: '#ec4899' },
                                    'COMPANY_ADMIN': { bg: '#fce7f3', text: '#db2777', border: '#ec4899' },
                                    'HR_MANAGER': { bg: '#dbeafe', text: '#2563eb', border: '#3b82f6' },
                                    'HR_ADMIN': { bg: '#dbeafe', text: '#2563eb', border: '#3b82f6' },
                                    'MANAGER': { bg: '#ffedd5', text: '#ea580c', border: '#f97316' },
                                    'EMPLOYEE': { bg: '#d1fae5', text: '#059669', border: '#10b981' },
                                    'AUDITOR': { bg: '#e0e7ff', text: '#4f46e5', border: '#6366f1' },
                                    'SUPPORT_ADMIN': { bg: '#f3e8ff', text: '#7c3aed', border: '#8b5cf6' },
                                }
                                const roleColor = ROLE_COLORS[roleName || ''] || { bg: '#f1f5f9', text: '#64748b', border: '#94a3b8' }

                                // Card top border color - alternate between blue and emerald
                                const borderTop = i < 4 ? '#3b82f6' : '#10b981'

                                return (
                                    <motion.div
                                        key={user.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedUser(user)}
                                        className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group shadow-sm hover:shadow-lg relative overflow-hidden"
                                        style={{ borderTop: `3px solid ${borderTop}` }}
                                    >
                                        <div className="flex items-start gap-4 mb-5 relative z-10">
                                            {/* Colored Circle Avatar */}
                                            <div
                                                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md"
                                                style={{ background: avatarColor }}
                                            >
                                                {user.name?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-[15px] font-bold text-slate-800 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{user.name}</h4>
                                                <span
                                                    className="inline-block mt-1.5 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                                                    style={{ background: roleColor.bg, color: roleColor.text }}
                                                >
                                                    {roleName || "Employee"}
                                                </span>
                                                {user.isLive && (
                                                    <div className="mt-1.5 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Live Now</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3 relative z-10">
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Briefcase className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                <span className="text-[11px] font-semibold truncate">{user.designation?.name || "Pending Designation"} • {user.department?.name || "Core"}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                <span className="text-[11px] font-semibold truncate text-blue-600">{user.email}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                <span className="text-[11px] font-semibold truncate">{user.branch?.name || "Global Headquarters"}</span>
                                            </div>
                                        </div>

                                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">Verified Employee</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all border border-slate-100">
                                                <Eye className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </ScrollArea>

            {/* Profile Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <UserProfileView 
                        user={selectedUser} 
                        token={token} 
                        onClose={handleCloseProfile} 
                        canEditBalances={['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'COMPANY_ADMIN'].includes(userRole)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
