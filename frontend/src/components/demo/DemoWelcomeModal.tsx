"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { X } from "lucide-react"

const LS_MODAL_KEY = "demo_welcome_shown"

type AdminFeature = { icon: string; title: string; desc: string }
type EmployeeFeature = { icon: string; title: string; desc: string }

const ADMIN_FEATURES: AdminFeature[] = [
    { icon: "👥", title: "Manage Employees", desc: "View all 12 demo employees across Engineering, HR, Finance & Operations" },
    { icon: "📅", title: "Approve Leaves", desc: "Review pending leave requests and approve or reject them in one click" },
    { icon: "💰", title: "View Payroll", desc: "Explore 3 months of payslips across all employees with real salary data" },
    { icon: "📊", title: "Reports & Analytics", desc: "Attendance trends, headcount, department-wise breakdowns" },
    { icon: "📢", title: "Announcements", desc: "Post company-wide notices seen by all employees instantly" },
]

const EMPLOYEE_FEATURES: EmployeeFeature[] = [
    { icon: "💼", title: "My Payslips", desc: "View 3 months of your payslip history with full breakdown" },
    { icon: "🏖️", title: "Apply for Leave", desc: "Submit leave requests — sick, casual, or earned leave types" },
    { icon: "🕐", title: "Attendance", desc: "Check your attendance history and daily clock-in/out records" },
    { icon: "🌟", title: "Give Kudos", desc: "Recognise your teammates for great work with peer kudos" },
    { icon: "👤", title: "My Profile", desc: "View your role, department, designation and personal details" },
]

export default function DemoWelcomeModal() {
    const { data: session } = useSession()
    const [visible, setVisible] = useState(false)
    const [animIn, setAnimIn] = useState(false)

    const role = (session?.user as any)?.role || ""
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "COMPANY_ADMIN", "OPS_ADMIN", "FINANCE_ADMIN", "HR_ADMIN", "VIEWER_ADMIN"].includes(role)
    const isDemo = !!(session?.user as any)?.isDemo || localStorage.getItem("demo_session") === "true"

    const features = isAdmin ? ADMIN_FEATURES : EMPLOYEE_FEATURES
    const greeting = isAdmin ? "Welcome, Admin" : "Welcome aboard"
    const subtitle = isAdmin
        ? "You're exploring the Admin dashboard with full access to HR data."
        : "You're exploring the Employee self-service portal."

    useEffect(() => {
        if (!session) return
        const shown = sessionStorage.getItem(LS_MODAL_KEY)
        if (!shown && isDemo) {
            setTimeout(() => {
                setVisible(true)
                setTimeout(() => setAnimIn(true), 10)
            }, 800)
        }
    }, [session, isDemo])

    const handleClose = () => {
        setAnimIn(false)
        setTimeout(() => setVisible(false), 250)
        sessionStorage.setItem(LS_MODAL_KEY, "true")
        sessionStorage.removeItem("demo_tour_dismissed")
        window.dispatchEvent(new Event("start-demo-tour"))
    }

    if (!visible) return null

    return (
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center"
            style={{
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(6px)",
                opacity: animIn ? 1 : 0,
                transition: "opacity 0.25s ease",
            }}
            onClick={handleClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%", maxWidth: 520,
                    background: "linear-gradient(145deg, #0f0a1e 0%, #13111f 100%)",
                    border: "1px solid rgba(124,58,237,0.35)",
                    borderRadius: 20,
                    padding: "36px 36px 28px",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
                    transform: animIn ? "translateY(0) scale(1)" : "translateY(24px) scale(0.96)",
                    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    margin: "0 16px",
                }}
            >
                {/* Close */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    style={{ color: "#6b7280" }}
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: "linear-gradient(135deg, #7c3aed, #5b5dec)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18
                        }}>
                            {isAdmin ? "🎛️" : "🙌"}
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#7c3aed", textTransform: "uppercase", marginBottom: 2 }}>
                                Rudratic HR — Demo Mode
                            </p>
                            <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>
                                {greeting}!
                            </h2>
                        </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                        {subtitle} Here's what you can explore:
                    </p>
                </div>

                {/* Feature grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                    {features.map((f, i) => (
                        <div
                            key={i}
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 12, padding: "14px 14px",
                            }}
                        >
                            <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "white", marginBottom: 4 }}>{f.title}</div>
                            <div style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.5 }}>{f.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Demo notice */}
                <div style={{
                    background: "rgba(91,93,236,0.08)", border: "1px solid rgba(91,93,236,0.2)",
                    borderRadius: 10, padding: "10px 14px", marginBottom: 20,
                    display: "flex", gap: 10, alignItems: "flex-start"
                }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⏱️</span>
                    <p style={{ fontSize: 11, color: "#7c8fa6", lineHeight: 1.6 }}>
                        You have a <strong style={{ color: "#a78bfa" }}>10-minute demo session</strong> with up to 2 extensions (+10 min each). The timer is shown at the top of your screen.
                    </p>
                </div>

                {/* CTA */}
                <button
                    onClick={handleClose}
                    style={{
                        width: "100%", padding: "13px 24px",
                        borderRadius: 12, border: "none",
                        background: "linear-gradient(135deg, #5b5dec 0%, #7c3aed 100%)",
                        boxShadow: "0 0 24px rgba(91,93,236,0.4)",
                        color: "white", fontWeight: 800,
                        fontSize: 12, letterSpacing: "0.1em",
                        textTransform: "uppercase", cursor: "pointer",
                        transition: "opacity 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                    Start Exploring →
                </button>
            </div>
        </div>
    )
}
