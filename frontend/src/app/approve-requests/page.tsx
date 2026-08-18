"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { RefreshCw, ShieldCheck, Clock, Search, Users, CheckCircle2, Hourglass, XCircle, CalendarDays, KeyRound } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api"
const SECRET = "rudratic-admin-2026"

type AccessRequest = {
    fullName: string
    email: string
    company: string
    phone?: string
    reason?: string
    status: "pending" | "approved" | "rejected"
    createdAt?: string
}

type LoginLog = {
    fullName: string
    email: string
    company: string
    phone: string
    createdAt: string
}

type StatusFilter = "all" | "pending" | "approved" | "rejected"

function formatDateTime(iso?: string) {
    if (!iso) return "—"
    const d = new Date(iso)
    return d.toLocaleString("en-IN", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true
    }).replace(",", " ·")
}

function LiveClock() {
    const [mounted, setMounted] = useState(false)
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        setMounted(true)
        const t = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    if (!mounted) return null

    const day = now.toLocaleString("en-IN", { weekday: "short", month: "short", day: "numeric" })
    const time = now.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>
            <Clock size={13} style={{ color: "#2563eb" }} />
            <span style={{ color: "#64748b" }}>{day}</span>
            <span style={{ color: "#1e293b", fontWeight: 700 }}>{time}</span>
        </div>
    )
}

export default function ApproveRequestsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [activeTab, setActiveTab] = useState<"requests" | "logins">("requests")
    const [requests, setRequests] = useState<AccessRequest[]>([])
    const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
    
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
    const [sortDir, setSortDir] = useState<"desc" | "asc">("desc")

    // Date range states
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/approve-requests")
        }
    }, [status, router])

    const fetchRequests = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/access-requests-public?secret=${SECRET}`)
            const data = await res.json()
            if (res.ok) setRequests(data.requests || [])
        } catch {
            toast.error("Failed to fetch access requests.")
        }
    }, [])

    const fetchLoginLogs = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/login-logs-public?secret=${SECRET}`)
            const data = await res.json()
            if (res.ok) setLoginLogs(data.logs || [])
        } catch {
            toast.error("Failed to fetch login logs.")
        }
    }, [])

    const fetchAll = useCallback(async () => {
        setLoading(true)
        await Promise.all([fetchRequests(), fetchLoginLogs()])
        setLoading(false)
    }, [fetchRequests, fetchLoginLogs])

    useEffect(() => {
        if (status === "authenticated") {
            fetchAll()
        }
    }, [status, fetchAll])

    const handleAction = async (email: string, action: "approved" | "rejected") => {
        setActionLoading(email + action)
        try {
            const res = await fetch(`${API_BASE}/auth/admin-approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, secret: SECRET, action: action === "rejected" ? "reject" : "approve" })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success(action === "approved"
                    ? `✅ Access approved for ${email}`
                    : `❌ Access rejected for ${email}`)
                fetchAll()
            } else {
                toast.error(data.error || "Action failed")
            }
        } catch {
            toast.error("Network error")
        } finally {
            setActionLoading(null)
        }
    }

    // CSV/Excel export
    const exportToCSV = () => {
        let headers: string[] = []
        let rows: string[][] = []
        const filename = activeTab === "requests" ? "access_requests.csv" : "login_details.csv"

        if (activeTab === "requests") {
            headers = ["Requested By", "Email", "Company", "Phone", "Reason", "Status", "Requested At"]
            rows = filteredRequests.map(r => [
                r.fullName || "",
                r.email || "",
                r.company || "",
                r.phone || "",
                r.reason || "",
                r.status || "",
                r.createdAt ? new Date(r.createdAt).toLocaleString() : ""
            ])
        } else {
            headers = ["User", "Email", "Company", "Phone", "Logged In At"]
            rows = filteredLogins.map(l => [
                l.fullName || "",
                l.email || "",
                l.company || "",
                l.phone || "",
                l.createdAt ? new Date(l.createdAt).toLocaleString() : ""
            ])
        }

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Exported to ${filename}`)
    }

    // PDF export
    const exportToPDF = () => {
        window.print()
    }

    if (status === "loading") {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{
                    width: 32, height: 32, border: "3px solid rgba(0,0,0,0.06)",
                    borderTopColor: "#3b82f6", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                }} />
            </div>
        )
    }

    const emailVal = session?.user?.email || ""
    const isRudratic = emailVal.toLowerCase().endsWith("@rudratic.com")

    if (status === "unauthenticated" || !isRudratic) {
        if (status === "unauthenticated") return null

        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
                <div style={{ textAlign: "center", padding: "40px", background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", borderRadius: 16, maxWidth: 440 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                        <XCircle size={28} color="#dc2626" />
                    </div>
                    <h2 style={{ color: "#0f172a", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Access Denied</h2>
                    <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                        Only users with a registered <strong style={{ color: "#2563eb" }}>@rudratic.com</strong> company account are permitted to access this portal administration panel.
                    </p>
                    <button 
                        onClick={() => router.push("/")}
                        style={{ padding: "10px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.2)" }}
                    >
                        Return to Portal
                    </button>
                </div>
            </div>
        )
    }

    const pendingCount = requests.filter(r => r.status === "pending").length
    const approvedCount = requests.filter(r => r.status === "approved").length
    const rejectedCount = requests.filter(r => r.status === "rejected").length

    const filteredRequests = requests
        .filter(r => {
            const q = search.toLowerCase()
            const matchSearch = !q || r.fullName?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.company?.toLowerCase().includes(q)
            const matchStatus = statusFilter === "all" || r.status === statusFilter
            
            // Date filtering
            if (!r.createdAt) return !startDate && !endDate
            const t = new Date(r.createdAt).getTime()
            const matchStart = !startDate || t >= new Date(startDate + "T00:00:00").getTime()
            const matchEnd = !endDate || t <= new Date(endDate + "T23:59:59").getTime()

            return matchSearch && matchStatus && matchStart && matchEnd
        })
        .sort((a, b) => {
            const ta = new Date(a.createdAt || 0).getTime()
            const tb = new Date(b.createdAt || 0).getTime()
            return sortDir === "desc" ? tb - ta : ta - tb
        })

    const filteredLogins = loginLogs
        .filter(l => {
            const q = search.toLowerCase()
            const matchSearch = !q || l.fullName?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q)
            
            // Date filtering
            if (!l.createdAt) return !startDate && !endDate
            const t = new Date(l.createdAt).getTime()
            const matchStart = !startDate || t >= new Date(startDate + "T00:00:00").getTime()
            const matchEnd = !endDate || t <= new Date(endDate + "T23:59:59").getTime()

            return matchSearch && matchStart && matchEnd
        })
        .sort((a, b) => {
            const ta = new Date(a.createdAt || 0).getTime()
            const tb = new Date(b.createdAt || 0).getTime()
            return sortDir === "desc" ? tb - ta : ta - tb
        })

    const TAB_STYLE = (active: boolean): React.CSSProperties => ({
        padding: "7px 16px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        border: "none",
        transition: "all 0.15s ease",
        background: active ? "rgba(37,99,235,0.08)" : "transparent",
        color: active ? "#2563eb" : "#64748b",
    })

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                table { border-collapse: collapse; width: 100%; min-width: 1000px; }
                th { text-align: left; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
                .req-row:hover td { background: #f8fafc !important; }
                input[type=text]::placeholder { color: #94a3b8; }
                input[type=text]:focus { outline: none; border-color: #3b82f6 !important; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }

                @media print {
                    body { background: white !important; color: black !important; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; }
                    th { background-color: #f1f5f9 !important; color: #1e293b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    tr { border-bottom: 1px solid #cbd5e1 !important; page-break-inside: avoid; }
                    td, th { padding: 10px 12px !important; font-size: 11px !important; }
                }
            `}</style>

            {/* ── Print-only Header ── */}
            <div className="print-only" style={{ display: "none", padding: "20px 0", borderBottom: "2px solid #0f172a", marginBottom: 30, fontFamily: "sans-serif" }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
                    Rudratic HR — {activeTab === "requests" ? "Access Requests Report" : "Stored Login Details Report"}
                </h1>
                <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                    Generated on {new Date().toLocaleString("en-IN")} · Total Records: {activeTab === "requests" ? filteredRequests.length : filteredLogins.length}
                </p>
                {(startDate || endDate) && (
                    <p style={{ fontSize: 11, color: "#2563eb", marginTop: 4, fontWeight: 600 }}>
                        Date Range: {startDate || "Beginning"} to {endDate || "Today"}
                    </p>
                )}
            </div>

            {/* ── TOP BAR ── */}
            <div className="no-print" style={{
                backgroundColor: "#ffffff",
                borderBottom: "1px solid #e2e8f0",
                padding: "0 32px", height: 52,
                display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <ShieldCheck size={14} color="white" />
                    </div>
                    <span style={{ color: "#0f172a", fontWeight: 700, fontSize: 14 }}>HR Demo</span>
                    <span style={{ color: "#cbd5e1", fontSize: 12 }}>/</span>
                    <span style={{ color: "#475569", fontSize: 12 }}>Admin Requests</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    {pendingCount > 0 && activeTab === "requests" && (
                        <span style={{
                            backgroundColor: "rgba(245,158,11,0.08)",
                            border: "1px solid rgba(245,158,11,0.2)",
                            color: "#d97706", fontSize: 11, fontWeight: 700,
                            padding: "3px 10px", borderRadius: 20,
                            display: "flex", alignItems: "center", gap: 6
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#d97706", display: "inline-block", animation: "pulse-dot 1.4s ease-in-out infinite" }} />
                            {pendingCount} pending
                        </span>
                    )}
                    <LiveClock />
                </div>
            </div>

            {/* ── PAGE CONTENT ── */}
            <div className="print-container" style={{ maxWidth: 1200, margin: "36px auto", padding: "0 24px" }}>

                {/* Title row */}
                <div className="no-print" style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Admin Control Center</h1>
                        <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                            Manage user requests and view verified login details.
                        </p>
                    </div>
                    <button
                        onClick={fetchAll}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 16px", borderRadius: 8,
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#ffffff",
                            fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                        }}
                    >
                        <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                        Refresh
                    </button>
                </div>

                {/* High-level tab switcher */}
                <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
                    <button
                        onClick={() => { setActiveTab("requests"); setSearch("") }}
                        style={{
                            padding: "8px 18px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            border: "none",
                            transition: "all 0.18s ease",
                            background: activeTab === "requests" ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "#ffffff",
                            borderWidth: activeTab === "requests" ? 0 : 1,
                            borderStyle: "solid",
                            borderColor: "#e2e8f0",
                            color: activeTab === "requests" ? "white" : "#475569",
                            boxShadow: activeTab === "requests" ? "0 4px 12px rgba(37,99,235,0.2)" : "0 1px 2px rgba(0,0,0,0.05)"
                        }}
                    >
                        Access Requests ({requests.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab("logins"); setSearch("") }}
                        style={{
                            padding: "8px 18px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            border: "none",
                            transition: "all 0.18s ease",
                            background: activeTab === "logins" ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "#ffffff",
                            borderWidth: activeTab === "logins" ? 0 : 1,
                            borderStyle: "solid",
                            borderColor: "#e2e8f0",
                            color: activeTab === "logins" ? "white" : "#475569",
                            boxShadow: activeTab === "logins" ? "0 4px 12px rgba(37,99,235,0.2)" : "0 1px 2px rgba(0,0,0,0.05)"
                        }}
                    >
                        Stored Login Details ({loginLogs.length})
                    </button>
                </div>

                {/* ── STATS BAR (Only shown on requests active) ── */}
                {activeTab === "requests" && (
                    <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                        {[
                            { label: "Total Requests", value: requests.length, icon: Users, color: "#2563eb", bg: "#ffffff", border: "#e2e8f0", iconBg: "rgba(37,99,235,0.08)" },
                            { label: "Pending", value: pendingCount, icon: Hourglass, color: "#d97706", bg: "#ffffff", border: "#e2e8f0", iconBg: "rgba(245,158,11,0.08)" },
                            { label: "Approved", value: approvedCount, icon: CheckCircle2, color: "#10b981", bg: "#ffffff", border: "#e2e8f0", iconBg: "rgba(16,185,129,0.08)" },
                            { label: "Rejected", value: rejectedCount, icon: XCircle, color: "#dc2626", bg: "#ffffff", border: "#e2e8f0", iconBg: "rgba(239,68,68,0.08)" },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: s.bg,
                                border: `1px solid ${s.border}`,
                                borderRadius: 12, padding: "14px 18px",
                                display: "flex", alignItems: "center", gap: 14,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: `${s.iconBg}`,
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                    <s.icon size={16} color={s.color} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.value}</p>
                                    <p style={{ fontSize: 11, color: "#64748b", marginTop: 3, fontWeight: 500 }}>{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── SEARCH, FILTER & DATE RANGE BAR ── */}
                <div className="no-print" style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px 12px 0 0",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14
                }}>
                    {/* First Row: Search & Export buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                        {/* Search Input */}
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 12px" }}>
                            <Search size={14} color="#94a3b8" />
                            <input
                                type="text"
                                placeholder={activeTab === "requests" ? "Search by name, email, or company..." : "Search logged-in users..."}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    background: "transparent", border: "none", outline: "none",
                                    fontSize: 13, color: "#0f172a", width: "100%"
                                }}
                            />
                        </div>

                        {/* Export Buttons */}
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={exportToCSV}
                                style={{
                                    padding: "7px 14px", borderRadius: 8, border: "1px solid #cbd5e1",
                                    backgroundColor: "#ffffff", color: "#334155", fontSize: 12, fontWeight: 600,
                                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                }}
                            >
                                Export Excel
                            </button>
                            <button
                                onClick={exportToPDF}
                                style={{
                                    padding: "7px 14px", borderRadius: 8, border: "none",
                                    backgroundColor: "#2563eb", color: "white", fontSize: 12, fontWeight: 600,
                                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                                    boxShadow: "0 2px 6px rgba(37,99,235,0.15)"
                                }}
                            >
                                Export PDF (Print)
                            </button>
                        </div>
                    </div>

                    {/* Second Row: Date range & Status filters */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                        {/* Date selectors */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#475569" }}>
                            <span style={{ fontWeight: 600 }}>Date Range:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                style={{ padding: "5px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, color: "#334155", outline: "none", cursor: "pointer" }}
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                style={{ padding: "5px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, color: "#334155", outline: "none", cursor: "pointer" }}
                            />
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => { setStartDate(""); setEndDate("") }}
                                    style={{
                                        border: "none", background: "none", color: "#dc2626", fontWeight: 600,
                                        cursor: "pointer", padding: "0 4px", fontSize: 12
                                    }}
                                >
                                    Reset Dates
                                </button>
                            )}
                        </div>

                        {/* Status tabs (Requests only) */}
                        {activeTab === "requests" && (
                            <div style={{ display: "flex", gap: 4 }}>
                                {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map(s => (
                                    <button key={s} onClick={() => setStatusFilter(s)} style={TAB_STYLE(statusFilter === s)}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                        {s === "pending" && pendingCount > 0 && (
                                            <span style={{ marginLeft: 5, background: "rgba(245,158,11,0.12)", color: "#d97706", borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                                                {pendingCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── TABLE CARD ── */}
                <div className="print-container" style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0 0 12px 12px",
                    borderTop: "none",
                    overflowX: "auto",
                    overflowY: "hidden",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)"
                }}>
                    {/* Loading */}
                    {loading && (
                        <div style={{ padding: 64, textAlign: "center" }}>
                            <div style={{
                                width: 32, height: 32, border: "3px solid #f1f5f9",
                                borderTopColor: "#3b82f6", borderRadius: "50%",
                                animation: "spin 0.8s linear infinite", margin: "0 auto 12px"
                            }} />
                            <p style={{ fontSize: 13, color: "#64748b" }}>Loading data...</p>
                        </div>
                    )}

                    {/* Table: Access Requests */}
                    {!loading && activeTab === "requests" && filteredRequests.length > 0 && (
                        <table>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                    {["Requested By", "Email", "Company", "Phone", "Reason", "Status"].map(h => (
                                        <th key={h} style={{
                                            padding: "12px 12px", fontSize: 11,
                                            fontWeight: 600, color: "#475569",
                                            textTransform: "uppercase", letterSpacing: "0.05em"
                                        }}>{h}</th>
                                    ))}
                                    <th
                                        onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
                                        style={{
                                            padding: "12px 12px", fontSize: 11, fontWeight: 600,
                                            color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em",
                                            cursor: "pointer", userSelect: "none"
                                        }}
                                    >
                                        Requested At {sortDir === "desc" ? "↓" : "↑"}
                                    </th>
                                    <th className="no-print" style={{ padding: "12px 12px", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", width: 170, minWidth: 170 }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map((req, idx) => (
                                    <tr
                                        key={req.email + idx}
                                        className="req-row"
                                        style={{
                                            borderBottom: idx < filteredRequests.length - 1 ? "1px solid #e2e8f0" : "none",
                                        }}
                                    >
                                        <td style={{ padding: "12px 12px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: "50%",
                                                    background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(6,182,212,0.08))",
                                                    border: "1px solid rgba(37,99,235,0.15)",
                                                    color: "#2563eb",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontWeight: 700, fontSize: 12, flexShrink: 0
                                                }}>
                                                    {(req.fullName || req.email)?.[0]?.toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
                                                    {req.fullName || "—"}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 12px" }}>
                                            <span style={{ fontSize: 12, color: "#2563eb", fontFamily: "monospace" }}>
                                                {req.email}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 12px" }}>
                                            <span style={{ fontSize: 13, color: "#475569" }}>{req.company || "—"}</span>
                                        </td>
                                        <td style={{ padding: "12px 12px" }}>
                                            <span style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>
                                                {req.phone || "—"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 12px", maxWidth: 160 }}>
                                            <span title={req.reason} style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                                                {req.reason || "—"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 12px" }}>
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: 5,
                                                fontSize: 11, fontWeight: 700,
                                                padding: "4px 11px", borderRadius: 20,
                                                background:
                                                    req.status === "approved" ? "rgba(16,185,129,0.08)" :
                                                    req.status === "rejected" ? "rgba(239,68,68,0.06)" :
                                                    "rgba(245,158,11,0.06)",
                                                border:
                                                    req.status === "approved" ? "1px solid rgba(16,185,129,0.2)" :
                                                    req.status === "rejected" ? "1px solid rgba(239,68,68,0.15)" :
                                                    "1px solid rgba(245,158,11,0.2)",
                                                color:
                                                    req.status === "approved" ? "#10b981" :
                                                    req.status === "rejected" ? "#dc2626" :
                                                    "#d97706"
                                            }}>
                                                {req.status === "pending" && (
                                                    <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#d97706", display: "inline-block", animation: "pulse-dot 1.4s ease-in-out infinite" }} />
                                                )}
                                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <CalendarDays size={12} color="#94a3b8" />
                                                <span style={{ fontSize: 12, color: "#64748b" }}>
                                                    {formatDateTime(req.createdAt)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="no-print" style={{ padding: "12px 12px", width: 170, minWidth: 170, whiteSpace: "nowrap" }}>
                                            {req.status === "pending" ? (
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <button
                                                        onClick={() => handleAction(req.email, "approved")}
                                                        disabled={actionLoading !== null}
                                                        style={{
                                                            padding: "5px 14px", borderRadius: 7, border: "none",
                                                            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                                                            color: "white", fontSize: 12, fontWeight: 600,
                                                            cursor: "pointer", opacity: actionLoading ? 0.6 : 1,
                                                            boxShadow: "0 2px 6px rgba(37,99,235,0.15)"
                                                        }}
                                                    >
                                                        {actionLoading === req.email + "approved" ? "..." : "Approve"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req.email, "rejected")}
                                                        disabled={actionLoading !== null}
                                                        style={{
                                                            padding: "5px 14px", borderRadius: 7,
                                                            border: "1px solid rgba(239,68,68,0.2)",
                                                            background: "rgba(239,68,68,0.04)",
                                                            color: "#dc2626", fontSize: 12, fontWeight: 600,
                                                            cursor: "pointer", opacity: actionLoading ? 0.6 : 1
                                                        }}
                                                    >
                                                        {actionLoading === req.email + "rejected" ? "..." : "Reject"}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Table: Stored Login Details */}
                    {!loading && activeTab === "logins" && filteredLogins.length > 0 && (
                        <table>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                    {["User", "Email", "Company", "Phone"].map(h => (
                                        <th key={h} style={{
                                            padding: "12px 12px", fontSize: 11,
                                            fontWeight: 600, color: "#475569",
                                            textTransform: "uppercase", letterSpacing: "0.05em"
                                        }}>{h}</th>
                                    ))}
                                    <th
                                        onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
                                        style={{
                                            padding: "12px 12px", fontSize: 11, fontWeight: 600,
                                            color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em",
                                            cursor: "pointer", userSelect: "none"
                                        }}
                                    >
                                        Logged In At {sortDir === "desc" ? "↓" : "↑"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogins.map((log, idx) => (
                                    <tr
                                        key={log.email + idx}
                                        className="req-row"
                                        style={{
                                            borderBottom: idx < filteredLogins.length - 1 ? "1px solid #e2e8f0" : "none",
                                        }}
                                    >
                                        <td style={{ padding: "12px 12px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: "50%",
                                                    background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.08))",
                                                    border: "1px solid rgba(16,185,129,0.15)",
                                                    color: "#10b981",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontWeight: 700, fontSize: 12, flexShrink: 0
                                                }}>
                                                    {(log.fullName || log.email)?.[0]?.toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
                                                    {log.fullName || "—"}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 12px" }}>
                                            <span style={{ fontSize: 12, color: "#2563eb", fontFamily: "monospace" }}>
                                                {log.email}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 12px" }}>
                                            <span style={{ fontSize: 13, color: "#475569" }}>{log.company || "—"}</span>
                                        </td>
                                        <td style={{ padding: "12px 12px" }}>
                                            <span style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>
                                                {log.phone || "—"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <CalendarDays size={12} color="#94a3b8" />
                                                <span style={{ fontSize: 12, color: "#64748b" }}>
                                                    {formatDateTime(log.createdAt)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                {!loading && activeTab === "requests" && requests.length > 0 && (
                    <p className="no-print" style={{ textAlign: "center", fontSize: 12, color: "#64748b", marginTop: 20 }}>
                        After approving, the user can log in at{" "}
                        <span style={{ fontFamily: "monospace", color: "#2563eb" }}>localhost:3005</span>{" "}
                        using their personal email + OTP.
                    </p>
                )}
            </div>
        </div>
    )
}
