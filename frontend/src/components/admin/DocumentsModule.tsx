"use client"

import { useEffect, useState, useMemo } from "react"
import { 
    FileText, Loader2, Plus, Download, ShieldAlert, 
    Search, ChevronDown, ChevronRight, User, 
    Calendar, Filter, MoreVertical, Archive,
    Shield, RefreshCcw, Eye, Lock, Zap, File,
    Database, ShieldCheck, Fingerprint, MapPin, 
    GraduationCap, Briefcase, CheckCircle2,
    Info, Upload, Check, X, Link as LinkIcon, Save, ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const API = process.env.NEXT_PUBLIC_API_URL

const GlobalStyles = () => (
    <style jsx global>{`
        .focus-shard {
            background: #ffffff;
            border-color: #cbd5e1 !important;
            box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
        }

        .matrix-gradient {
            background: #fbfbfb;
        }

        .vault-card {
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .vault-card:hover:not(.focus-shard) {
            transform: translateY(-1px);
            border-color: #cbd5e1;
            box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.03);
        }

        .glass-slot {
            background: #ffffff;
            border: 1px solid #e2e8f0;
        }
    `}</style>
)

const AVATAR_COLORS = [
    "bg-indigo-50 border-indigo-100 text-indigo-600",
    "bg-emerald-50 border-emerald-100 text-emerald-600",
    "bg-rose-50 border-rose-100 text-rose-600",
    "bg-amber-50 border-amber-100 text-amber-600",
    "bg-violet-50 border-violet-100 text-violet-600",
]

const getAvatarColor = (name: string) => {
    if (!name) return AVATAR_COLORS[0]
    const charCode = name.charCodeAt(0)
    return AVATAR_COLORS[charCode % AVATAR_COLORS.length]
}

export default function DocumentsModule({ token }: { token: string }) {
    const [docs, setDocs] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedID, setExpandedID] = useState<string | null>(null)
    const [nocLink, setNocLink] = useState("")
    const [savingNoc, setSavingNoc] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const h = { Authorization: `Bearer ${token}` }
            const [dRes, uRes, nocRes] = await Promise.all([
                fetch(`${API}/documents`, { headers: h }),
                fetch(`${API}/users`, { headers: h }),
                fetch(`${API}/settings/noc`, { headers: h })
            ])
            if (dRes.ok) {
                const data = await dRes.json()
                setDocs(Array.isArray(data) ? data : (data.documents || data.data || []))
            }
            if (uRes.ok) {
                const data = await uRes.json()
                setUsers(Array.isArray(data) ? data : (data.users || []))
            }
            if (nocRes.ok) {
                const data = await nocRes.json()
                setNocLink(data.link || "")
            }
        } catch {
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const saveNocLink = async () => {
        const trimmedLink = nocLink.trim()
        if (!trimmedLink) {
            toast.error("Please enter a link before saving")
            return
        }
        
        if (!trimmedLink.startsWith("http://") && !trimmedLink.startsWith("https://")) {
            toast.error("Please enter a valid URL starting with http:// or https://")
            return
        }

        setSavingNoc(true)
        try {
            const res = await fetch(`${API}/settings/noc`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ link: trimmedLink })
            })
            if (res.ok) {
                toast.success("NOC Drive Link saved successfully")
            } else {
                toast.error("Failed to save NOC link")
            }
        } catch {
            toast.error("Network error saving NOC link")
        } finally {
            setSavingNoc(false)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [token])

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const roleName = typeof u.role === 'object' ? u.role?.name : u.role;
            const isSuperAdmin = roleName === 'SUPER_ADMIN';
            const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                   u.email?.toLowerCase().includes(searchQuery.toLowerCase());
            return !isSuperAdmin && matchesSearch;
        }).sort((a,b) => a.name.localeCompare(b.name))
    }, [users, searchQuery])

    // Required Status Manifest
    const criticalSlots = [
        { id: 'identity', label: 'ID Proof', icon: Fingerprint, category: 'Identity' },
        { id: 'address', label: 'Address Proof', icon: MapPin, category: 'Address' },
        { id: 'offer', label: 'Offer Letter', icon: Briefcase, category: 'Offer' },
        { id: 'education', label: 'Education', icon: GraduationCap, category: 'Certificate' },
    ]

    return (
        <div className="min-h-full font-body pb-20 bg-[#F8FAFC]">
            <GlobalStyles />
            <div className="w-full max-w-[1700px] mx-auto space-y-6">
            
            {/* ── KPI CARDS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Database className="w-6 h-6" /></div>
                    <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Total Documents</p><h3 className="text-2xl font-extrabold text-slate-800 leading-none">{docs.length}</h3></div>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><User className="w-6 h-6" /></div>
                    <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Employees</p><h3 className="text-2xl font-extrabold text-slate-800 leading-none">{filteredUsers.length}</h3></div>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 className="w-6 h-6" /></div>
                    <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Complete</p><h3 className="text-2xl font-extrabold text-slate-800 leading-none">{filteredUsers.filter(u => docs.filter(d => d.userId === u.id || d.employeeId === u.id).length >= 4).length}</h3></div>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><ShieldAlert className="w-6 h-6" /></div>
                    <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Incomplete</p><h3 className="text-2xl font-extrabold text-slate-800 leading-none">{filteredUsers.filter(u => docs.filter(d => d.userId === u.id || d.employeeId === u.id).length < 4).length}</h3></div>
                </div>
            </div>

            {/* ── NOC GOOGLE DRIVE MASTER LINK CONFIG ── */}
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-6 shadow-[0_2px_8px_rgba(99,102,241,0.05)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30">
                            <LinkIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 tracking-tight">Master NOC Directory</h3>
                            <p className="text-xs font-medium text-slate-500 mt-1 max-w-lg leading-relaxed">
                                Provide the global Google Drive link for NOC (No Objection Certificate) and related master files. 
                                This link will be visible to all employees on their dashboard.
                            </p>
                        </div>
                    </div>
                    <div className="flex-1 w-full max-w-xl flex gap-3">
                        <Input 
                            value={nocLink}
                            onChange={(e) => setNocLink(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="h-11 bg-white border-indigo-200 focus-visible:ring-indigo-500 font-medium"
                        />
                        <Button 
                            onClick={saveNocLink} 
                            disabled={savingNoc}
                            className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-xs shadow-md shadow-indigo-600/20 transition-all"
                        >
                            {savingNoc ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Link
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── FILTER BAR ── */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="h-12 pl-12 bg-slate-50/50 border border-slate-200/60 rounded-xl text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-indigo-100 w-full placeholder:text-slate-400"
                    />
                </div>
                <Button onClick={fetchData} variant="outline" className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 rounded-xl px-5 text-[13px] font-bold uppercase tracking-wider flex items-center gap-2 bg-white transition-all">
                    <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
                </Button>
            </div>

            {/* ── EMPLOYEE DOCUMENTS ── */}
                <div className="space-y-4">
                    {filteredUsers.length === 0 ? (
                        <div className="py-48 flex flex-col items-center justify-center gap-6 opacity-40">
                            <ShieldAlert className="w-16 h-16 text-slate-100" />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">No employees found</p>
                        </div>
                    ) : (
                        filteredUsers.map((user, idx) => {
                            const userDocs = docs.filter(d => d.userId === user.id || d.employeeId === user.id)
                            const isExpanded = expandedID === user.id

                            const triggerDownload = (fileUrl: string, fileName: string, isDownload: boolean = false) => {
                                if (!fileUrl) return;
                                try {
                                    // If it's base64, create a blob to bypass browser URL limits
                                    if (fileUrl.startsWith('data:')) {
                                        const parts = fileUrl.split(';base64,');
                                        const contentType = parts[0].split(':')[1];
                                        const raw = window.atob(parts[1]);
                                        const rawLength = raw.length;
                                        const uInt8Array = new Uint8Array(rawLength);
                                        for (let i = 0; i < rawLength; ++i) { uInt8Array[i] = raw.charCodeAt(i); }
                                        const blob = new Blob([uInt8Array], { type: contentType });
                                        const url = URL.createObjectURL(blob);
                                        
                                        const a = document.createElement('a');
                                        a.href = url;
                                        if (isDownload) a.download = fileName;
                                        else a.target = '_blank';
                                        
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        setTimeout(() => URL.revokeObjectURL(url), 100);
                                    } else {
                                        const a = document.createElement('a');
                                        a.href = fileUrl;
                                        if (isDownload) a.download = fileName;
                                        else a.target = '_blank';
                                        a.click();
                                    }
                                } catch (e) {
                                    toast.error("Failed to open document");
                                }
                            }

                            return (
                                <motion.div 
                                    key={user.id} 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className={cn(
                                        "bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all",
                                        isExpanded && "border-indigo-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                                    )}
                                >
                                    <button 
                                        onClick={() => setExpandedID(isExpanded ? null : user.id)}
                                        className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/50 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[14px] shrink-0 border",
                                                getAvatarColor(user.name)
                                            )}>
                                                {user.name?.[0]}{user.name?.[1]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="text-[14px] font-bold text-slate-800 leading-none truncate">
                                                        {user.name}
                                                    </h4>
                                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                        {user.role?.name || user.role}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                                                    <span className="truncate">{user.email}</span>
                                                    <span className="text-slate-200">·</span>
                                                    <span className={cn(
                                                        "flex items-center gap-1.5 font-bold",
                                                        userDocs.length > 0 ? "text-indigo-500" : "text-slate-300"
                                                    )}>
                                                        <FileText className="w-3.5 h-3.5" />
                                                        {userDocs.length} docs
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                                                userDocs.length >= 4 
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                                    : "bg-amber-50 text-amber-600 border-amber-100"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", userDocs.length >= 4 ? "bg-emerald-500" : "bg-amber-500")} />
                                                {userDocs.length >= 4 ? "Complete" : "Incomplete"}
                                            </span>
                                            <div className={cn(
                                                "w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 transition-all",
                                                isExpanded && "bg-indigo-600 text-white rotate-180"
                                            )}>
                                                <ChevronDown className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </button>

                                    <AnimatePresence mode="wait">
                                        {isExpanded && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-slate-100 bg-slate-50/30"
                                            >
                                                <div className="p-6 space-y-6">
                                                                                        {/* CRITICAL DOCUMENTS */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                        {criticalSlots.map((slot) => {
                                                            const docObj = userDocs.find(d => d.type === slot.category || d.name?.includes(slot.label));
                                                            const exists = !!docObj;
                                                            return (
                                                                <div key={slot.id} className="p-5 bg-white border border-slate-200/60 rounded-xl flex flex-col justify-between min-h-[130px] hover:border-indigo-200 transition-all shadow-sm">
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                                                                <slot.icon className="w-5 h-5" />
                                                                            </div>
                                                                            <div>
                                                                                <h5 className="text-[13px] font-bold text-slate-800 leading-tight">{slot.label}</h5>
                                                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{slot.category}</p>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className={cn(
                                                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border",
                                                                            exists 
                                                                                ? "bg-emerald-50/50 text-emerald-700 border-emerald-200/60" 
                                                                                : "bg-slate-50 text-slate-500 border-slate-200"
                                                                        )}>
                                                                            <div className={cn("w-1.5 h-1.5 rounded-full", exists ? "bg-emerald-500" : "bg-slate-400")} />
                                                                            {exists ? "Verified" : "Missing"}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="mt-5">
                                                                        {exists ? (
                                                                            <div className="flex gap-2">
                                                                                <Button 
                                                                                    onClick={() => triggerDownload(docObj.fileUrl, docObj.name)}
                                                                                    className="flex-1 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                                                                                >
                                                                                    <Eye className="w-3.5 h-3.5" /> View
                                                                                </Button>
                                                                                <Button 
                                                                                    onClick={() => triggerDownload(docObj.fileUrl, docObj.name, true)}
                                                                                    variant="outline"
                                                                                    className="h-9 w-9 p-0 rounded-lg border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                                                                                >
                                                                                    <Download className="w-3.5 h-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-full h-9 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-[11px] font-bold select-none cursor-not-allowed">
                                                                                <Upload className="w-3.5 h-3.5 mr-1.5" /> Pending
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
 
                                                    {/* STANDARD DOCUMENT REGISTER */}
                                                    <div className="space-y-4">
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Employee Document Registry</h5>
                                                        {userDocs.length === 0 ? (
                                                            <div className="py-12 flex flex-col items-center justify-center gap-3 bg-slate-50/40 rounded-2xl border border-slate-200/60">
                                                                <Archive className="w-8 h-8 text-slate-300" />
                                                                <p className="text-[12px] font-medium text-slate-400">No additional documents uploaded to this employee's registry.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
                                                                <table className="w-full text-left">
                                                                    <thead>
                                                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                                                            <th className="px-8 py-5 text-[9px] font-bold text-slate-400 uppercase tracking-widest font-brand">Document Name</th>
                                                                            <th className="px-8 py-5 text-[9px] font-bold text-slate-400 uppercase tracking-widest font-brand text-center">Category</th>
                                                                            <th className="px-8 py-5 text-[9px] font-bold text-slate-400 uppercase tracking-widest font-brand text-right">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-50 font-medium">
                                                                        {userDocs.map((doc, dIdx) => (
                                                                            <tr key={doc.id} className="group/doc hover:bg-indigo-50/30 transition-colors">
                                                                                <td className="px-8 py-6">
                                                                                    <div className="flex items-center gap-5">
                                                                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover/doc:bg-indigo-600 group-hover/doc:text-white transition-all">
                                                                                            <File className="w-5 h-5" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[14px] font-bold text-slate-900 uppercase font-brand tracking-tight leading-none mb-2">{doc.name}</p>
                                                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none shrink-0">Validated · {new Date(doc.createdAt).toLocaleDateString()}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-8 py-6 text-center">
                                                                                    <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-xl group-hover/doc:bg-indigo-100 group-hover/doc:text-indigo-600 transition-colors">
                                                                                        {doc.type}
                                                                                    </Badge>
                                                                                </td>
                                                                                <td className="px-8 py-6 text-right">
                                                                                     <div className="flex items-center justify-end gap-2">
                                                                                        <button onClick={() => triggerDownload(doc.fileUrl, doc.name)} className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm" title="View"><Eye className="w-4 h-4" /></button>
                                                                                        <button onClick={() => triggerDownload(doc.fileUrl, doc.name, true)} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Download"><Download className="w-4 h-4" /></button>
                                                                                     </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
