"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"

/**
 * DemoModeBadge — A persistent pill at the bottom-left corner.
 * Shows the user's current role and a quick "What can I explore?" tooltip.
 * Visible on all dashboard pages, helps orient demo visitors.
 */
export default function DemoModeBadge() {
    const { data: session } = useSession()
    const [expanded, setExpanded] = useState(false)

    const isDemo = !!(session?.user as any)?.isDemo
    if (!isDemo) return null

    const role = (session?.user as any)?.role || "USER"
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "COMPANY_ADMIN", "OPS_ADMIN", "FINANCE_ADMIN", "HR_ADMIN", "VIEWER_ADMIN"].includes(role)
    const userName = session?.user?.name || "Demo User"

    const quickLinks = isAdmin ? [
        { emoji: "👥", label: "Employees", path: "/admin?tab=employees" },
        { emoji: "📅", label: "Leave Approvals", path: "/admin?tab=leave" },
        { emoji: "💰", label: "Payroll", path: "/admin?tab=payroll" },
        { emoji: "📊", label: "Reports", path: "/admin?tab=reports" },
    ] : [
        { emoji: "💼", label: "My Payslips", path: "/payslip" },
        { emoji: "🏖️", label: "Apply Leave", path: "/leave" },
        { emoji: "🕐", label: "Attendance", path: "/attendance" },
        { emoji: "🌟", label: "Kudos", path: "/kudos" },
    ]

    return (
        <div
            style={{
                position: "fixed", bottom: 20, left: 20, zIndex: 9990,
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
            }}
        >
            {/* Expanded quick-links panel */}
            {expanded && (
                <div
                    style={{
                        background: "rgba(13,17,27,0.95)", backdropFilter: "blur(20px)",
                        border: "1px solid rgba(91,93,236,0.3)", borderRadius: 14,
                        padding: "16px", width: 200,
                        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                        animation: "slideUp 0.2s ease",
                    }}
                >
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
                        Quick Explore
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {quickLinks.map(link => (
                            <a
                                key={link.path}
                                href={link.path}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "8px 10px", borderRadius: 8,
                                    color: "#94a3b8", fontSize: 12, fontWeight: 500,
                                    textDecoration: "none", transition: "all 0.15s",
                                    background: "transparent",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = "rgba(91,93,236,0.12)"
                                    e.currentTarget.style.color = "white"
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = "transparent"
                                    e.currentTarget.style.color = "#94a3b8"
                                }}
                                onClick={() => setExpanded(false)}
                            >
                                <span style={{ fontSize: 14 }}>{link.emoji}</span>
                                {link.label}
                            </a>
                        ))}
                    </div>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 10, paddingTop: 10 }}>
                        <p style={{ fontSize: 10, color: "#374151" }}>
                            Logged in as <span style={{ color: "#6366f1" }}>{isAdmin ? "Admin" : "Employee"}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Pill badge */}
            <button
                onClick={() => setExpanded(v => !v)}
                style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 14px", borderRadius: 50,
                    background: "rgba(13,17,27,0.9)", backdropFilter: "blur(16px)",
                    border: "1px solid rgba(91,93,236,0.35)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                    cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(91,93,236,0.7)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(91,93,236,0.35)" }}
            >
                <span style={{ fontSize: 12 }}>{isAdmin ? "🎛️" : "👤"}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.04em" }}>
                    Demo · {isAdmin ? "Admin" : "Employee"}
                </span>
                <span style={{ fontSize: 10, color: "#374151" }}>
                    {expanded ? "▲" : "▼"}
                </span>
            </button>
        </div>
    )
}
