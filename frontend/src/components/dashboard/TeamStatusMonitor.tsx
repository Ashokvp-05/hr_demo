"use client"

import { useState } from "react"
import { Search, Clock, MapPin, Building, ArrowUpRight, Coffee, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TeamMemberStatus } from "@/types/manager"
import { cn } from "@/lib/utils"

export function TeamStatusMonitor({ remoteUsers }: { remoteUsers: TeamMemberStatus[] }) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredUsers = remoteUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.location || "Office HQ").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.department || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex gap-3 px-6 md:px-8 mt-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search team database..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10 rounded-2xl border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 h-10 transition-all font-medium text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <Button variant="outline" size="icon" className="rounded-2xl shrink-0 h-10 w-10 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <Filter className="w-4 h-4" />
                </Button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredUsers.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center gap-6">
                        <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center shadow-inner relative group">
                            {searchQuery ? (
                                <Search className="w-10 h-10 text-slate-300 transform group-hover:scale-110 transition-transform" />
                            ) : (
                                <Coffee className="w-10 h-10 text-slate-400" />
                            )}
                            <div className="absolute inset-0 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl animate-[spin_10s_linear_infinite]" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-900 dark:text-white text-base font-bold uppercase tracking-[0.2em]">
                                {searchQuery ? "No Matches detected" : "Operational Silence"}
                            </p>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-loose max-w-[280px] mx-auto opacity-70">
                                {searchQuery
                                    ? "Try refining your search parameters to locate specific nodes."
                                    : "No active team sessions detected. Once your team members clock in, their live telemetry will appear here."}
                            </p>
                        </div>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-5 md:px-8 hover:bg-slate-50/50 dark:hover:bg-indigo-900/5 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                            {/* Hover accent */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform" />

                            <div className="flex items-center gap-5 flex-1">
                                <div className="relative">
                                    <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-800 shadow-xl ring-2 ring-slate-100 dark:ring-white/5 transition-transform group-hover:scale-105 duration-500">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} />
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-lg">
                                            {user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className={cn(
                                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-800 shadow-sm",
                                        user.status === 'ONLINE' || user.status === 'REMOTE' ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                                    )} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                            {user.name}
                                        </p>
                                        <Badge variant="outline" className="text-[8px] font-bold uppercase border-slate-200 dark:border-slate-800 h-4">
                                            {user.department || "Resource"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                            <span suppressHydrationWarning>Logged: {new Date(user.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest px-2 py-0.5 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
                                            {user.location ? <MapPin className="w-3 h-3 text-emerald-500" /> : <Building className="w-3 h-3 text-blue-500" />}
                                            {user.location || "Office HQ"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-300 group-hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-2xl shrink-0 h-10 w-10 transition-all opacity-0 group-hover:opacity-100">
                                <ArrowUpRight className="w-5 h-5" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
