"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Key, ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { getDashboardByRole } from "@/lib/role-redirect"

export default function LandingClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl")
    const { data: session, status } = useSession()
    const [mount, setMount] = useState(false)

    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [step, setStep] = useState<"welcome" | "business_details" | "verify" | "access_request" | "access_pending" | "select_role">(
        searchParams.get("preview") === "role" ? "welcome" : "business_details"
    )
    const [tempToken, setTempToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [agreePrivacy, setAgreePrivacy] = useState(true)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [demoOtp, setDemoOtp] = useState<string | null>(null)
    const [pendingEmail, setPendingEmail] = useState("")
    const [selectedRoleIntent, setSelectedRoleIntent] = useState<string | null>(null)

    const [accessForm, setAccessForm] = useState({
        fullName: "",
        email: "",
        company: "",
        phone: "",
        reason: ""
    })

    const [businessForm, setBusinessForm] = useState({
        fullName: "",
        companyName: "",
        businessEmail: "",
        phone: "",
        privacy: false
    })

    useEffect(() => { setMount(true) }, [])

    useEffect(() => {
        if (status === "authenticated") {
            const role = (session?.user as any)?.role
            router.push(getDashboardByRole(role))
            router.refresh()
        }
    }, [status, session, router])

    const handleBusinessDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const emailToUse = businessForm.businessEmail.trim()
        if (!emailToUse) {
            setError("Please enter your business email.")
            return
        }
        if (!businessForm.privacy) {
            setError("You must agree to the Privacy Consent to continue.")
            return
        }
        setEmail(emailToUse)
        setError("")
        setIsLoading(true)
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api"
            const res = await fetch(`${apiBase}/auth/request-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: emailToUse,
                    fullName: businessForm.fullName,
                    companyName: businessForm.companyName,
                    phone: businessForm.phone
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                if (data.needsApproval) {
                    // If this email previously had a request submitted this session,
                    // show them the pending screen with the "I've been approved" button
                    setPendingEmail(emailToUse)
                    if (pendingEmail === emailToUse) {
                        // Already submitted this session — go straight to pending screen
                        setStep("access_pending")
                        toast.info("Your request is still pending admin approval.")
                    } else {
                        // First time seeing this — send them to fill the access request form
                        setAccessForm(prev => ({ ...prev, email: emailToUse }))
                        setStep("access_request")
                        toast.error("Personal email requires admin approval. Submit a request below.")
                    }
                    return
                }
                if (data.alreadyLoggedIn) {
                    throw new Error(data.error)
                }
                throw new Error(data.message || data.error || "Failed to request OTP")
            }
            // Capture demo OTP if returned (dev/demo mode only)
            if (data.demoOtp) setDemoOtp(data.demoOtp)
            toast.success("OTP sent! Check the code shown below.")
            setStep("verify")
        } catch (err: any) {
            const msg = err.message || "Could not reach the server. Check backend is running."
            setError(msg)
            toast.error(msg)
            console.error("[OTP] Error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const executeSignIn = async (token: string, user: any, demoExpiresAt: number, roleName: string) => {
        const expiresAt = demoExpiresAt || (Date.now() + 10 * 60 * 1000)
        localStorage.setItem("demo_expires_at", String(expiresAt))
        localStorage.setItem("demo_session", "true")

        const loginResult = await signIn("credentials", {
            redirect: false,
            jwt: token,
            userData: JSON.stringify({
                ...user,
                demoExpiresAt: expiresAt,
                isDemo: true
            })
        })

        if (loginResult?.error) {
            throw new Error("Failed to establish session with selected role.")
        }

        const actualRole = (user?.role || roleName).toUpperCase().replace(/[\s-]/g, "_")
        const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "COMPANY_ADMIN", "OPS_ADMIN", "FINANCE_ADMIN", "HR_ADMIN", "VIEWER_ADMIN"]
        
        const userEmail = (user?.email || email || "").toLowerCase().trim()
        const defaultDest = userEmail.endsWith("@rudratic.com")
            ? "/approve-requests"
            : (ADMIN_ROLES.includes(actualRole) ? "/admin" : "/employee")
            
        const destination = callbackUrl || defaultDest

        toast.success(`Logged in as ${roleName}`)
        router.push(destination)
        router.refresh()
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api"
            const res = await fetch(`${apiBase}/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || data.error || "Failed to verify OTP")

            const userRole = data.user?.role?.toUpperCase()
            const intent = selectedRoleIntent || null

            if (intent === "EMPLOYEE") {
                if (userRole !== "EMPLOYEE") {
                    const roleUpdateRes = await fetch(`${apiBase}/auth/update-role`, {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${data.token}`
                        },
                        body: JSON.stringify({ roleName: "EMPLOYEE" }),
                    })
                    const updateData = await roleUpdateRes.json()
                    if (!roleUpdateRes.ok) throw new Error(updateData.message || updateData.error || "Failed to update role")
                    
                    await executeSignIn(updateData.token, updateData.user, updateData.demoExpiresAt, "EMPLOYEE")
                } else {
                    await executeSignIn(data.token, data.user, data.demoExpiresAt, "EMPLOYEE")
                }
            } else if (intent === "ADMIN") {
                const isAdminRole = ["COMPANY_ADMIN", "ADMIN", "SUPER_ADMIN"].includes(userRole)
                if (!isAdminRole) {
                    const roleUpdateRes = await fetch(`${apiBase}/auth/update-role`, {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${data.token}`
                        },
                        body: JSON.stringify({ roleName: "ADMIN" }),
                    })
                    const updateData = await roleUpdateRes.json()
                    if (!roleUpdateRes.ok) throw new Error(updateData.message || updateData.error || "Failed to update role")
                    
                    await executeSignIn(updateData.token, updateData.user, updateData.demoExpiresAt, "ADMIN")
                } else {
                    await executeSignIn(data.token, data.user, data.demoExpiresAt, userRole || "ADMIN")
                }
            } else {
                setTempToken(data.token)
                setStep("select_role")
                setError("")
                setIsLoading(false)
            }
        } catch (err: any) {
            setError(err.message || "Invalid OTP")
            setIsLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (!email || resendCooldown > 0) return
        setError("")
        setOtp("")
        setDemoOtp(null)
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api"
            const res = await fetch(`${apiBase}/auth/request-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || data.error || "Failed to resend OTP")
            if (data.demoOtp) setDemoOtp(data.demoOtp)
            toast.success("New OTP sent!")
            setResendCooldown(30)
            const interval = setInterval(() => {
                setResendCooldown(prev => {
                    if (prev <= 1) { clearInterval(interval); return 0 }
                    return prev - 1
                })
            }, 1000)
        } catch (err: any) {
            setError(err.message || "Failed to resend OTP")
        }
    }

    const handleSelectRole = async (roleName: string) => {
        setIsLoading(true)
        setError("")
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api"
            const res = await fetch(`${apiBase}/auth/update-role`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tempToken}`
                },
                body: JSON.stringify({ roleName }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || data.error || "Failed to update role")

            await executeSignIn(data.token, data.user, data.demoExpiresAt, roleName)
        } catch (err: any) {
            setError(err.message || "Failed to select role")
            setIsLoading(false)
        }
    }

    const handleAccessRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api"
            const res = await fetch(`${apiBase}/auth/request-access`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(accessForm),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || data.error || "Failed to submit request")

            toast.success("Request submitted! An admin will review and approve it shortly.")
            setPendingEmail(accessForm.email.toLowerCase().trim())
            setStep("access_pending")
            setAccessForm({ fullName: "", email: "", company: "", phone: "", reason: "" })
        } catch (err: any) {
            setError(err.message || "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    // Called from access_pending screen after admin has approved the request
    const handleTryApprovedLogin = async () => {
        if (!pendingEmail) return
        setError("")
        setIsLoading(true)
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api"
            const res = await fetch(`${apiBase}/auth/request-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: pendingEmail }),
            })
            const data = await res.json()
            if (!res.ok) {
                if (data.needsApproval) {
                    toast.error("Your request is still pending approval. Please wait for the admin to approve it.")
                    return
                }
                throw new Error(data.message || data.error || "Failed to send OTP")
            }
            setEmail(pendingEmail)
            // pre-fill the business form email for display continuity
            setBusinessForm(prev => ({ ...prev, businessEmail: pendingEmail }))
            toast.success("OTP sent to " + pendingEmail + ". Check your inbox.")
            setStep("verify")
        } catch (err: any) {
            toast.error(err.message || "Could not send OTP")
            setError(err.message || "Could not send OTP")
        } finally {
            setIsLoading(false)
        }
    }

    if (!mount || status === "loading") return null

    // ── WELCOME: Role picker shown after sign-out — same layout as select_role ──
    if (step === "welcome") return (
        <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#09090f", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                .role-btn-admin:hover { opacity: 0.92; transform: translateY(-1px); }
                .role-btn-employee:hover { background: rgba(255,255,255,0.05) !important; transform: translateY(-1px); }
                .role-btn-admin, .role-btn-employee { transition: all 0.18s ease; }
            `}</style>

            {/* ── LEFT PANEL ── */}
            <div style={{
                flex: "0 0 48%",
                background: "linear-gradient(145deg, #0b0f19 0%, #17253d 50%, #080c14 100%)",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                padding: "48px 56px", position: "relative", overflow: "hidden"
            }}>
                <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", top: "30%", left: "-10%", background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #2563eb, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </div>
                    <span style={{ color: "white", fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>HR Demo</span>
                </div>

                {/* Hero */}
                <div style={{ position: "relative" }}>
                    <h1 style={{ fontSize: "clamp(2.4rem, 4vw, 3.4rem)", fontWeight: 900, lineHeight: 1.1, color: "white", margin: "0 0 20px 0", letterSpacing: "-1px" }}>
                        Join <span style={{ color: "#60a5fa" }}>Rudratic</span> Workforce
                    </h1>
                    <p style={{ fontSize: 15, color: "#7c8fa6", lineHeight: 1.7, maxWidth: 340, margin: "0 0 36px 0" }}>
                        The all-in-one intelligence platform for modern team management, security, and enterprise efficiency.
                    </p>
                    {[
                        { label: "Bank-grade security & encryption", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
                        { label: "Real-time analytics & insights", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                        { label: "Role-based access control", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
                    ].map(f => (
                        <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa" }}>
                                {f.svg}
                            </div>
                            <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>{f.label}</span>
                        </div>
                    ))}
                </div>

                <p style={{ fontSize: 11, color: "#475569", position: "relative" }}>Powered by Rudratic Intelligence Enterprise AI</p>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px", backgroundColor: "#080c14" }}>
                <div style={{
                    width: "100%", maxWidth: 420,
                    background: "rgba(15,23,42,0.85)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 20, padding: "44px 40px",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset"
                }}>
                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: 36 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#3b82f6", textTransform: "uppercase", marginBottom: 8 }}>Welcome Back</p>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px 0" }}>Access Your Enterprise Dashboard</h2>
                        <p style={{ fontSize: 13, color: "#4b5563", margin: 0 }}>Select your role to continue</p>
                    </div>

                    {/* Admin button */}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedRoleIntent("ADMIN")
                            setStep("business_details")
                        }}
                        className="role-btn-admin"
                        style={{
                            width: "100%", padding: "16px 24px", borderRadius: 12, border: "none",
                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            boxShadow: "0 0 32px rgba(37,99,235,0.3), 0 4px 16px rgba(0,0,0,0.3)",
                            color: "white", fontWeight: 800, fontSize: 13, letterSpacing: "0.1em",
                            textTransform: "uppercase", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            marginBottom: 12
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Log in as Admin
                    </button>

                    {/* Divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
                        <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151", letterSpacing: "0.1em" }}>FAST ACCESS</span>
                        <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
                    </div>

                    {/* Employee button */}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedRoleIntent("EMPLOYEE")
                            setStep("business_details")
                        }}
                        className="role-btn-employee"
                        style={{
                            width: "100%", padding: "16px 24px", borderRadius: 12,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "white", fontWeight: 800, fontSize: 13, letterSpacing: "0.1em",
                            textTransform: "uppercase", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        Log in as Employee
                    </button>

                    <p style={{ textAlign: "center", fontSize: 10, color: "#334155", marginTop: 28, marginBottom: 0 }}>
                        POWERED BY RUDRATIC INTELLIGENCE<br />ENTERPRISE AI
                    </p>
                </div>
            </div>
        </div>
    )

    // ── STEP 5: SELECT ROLE — full-screen premium layout ──
    if (step === "select_role") return (
        <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#09090f", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                .role-btn-admin:hover { opacity: 0.92; transform: translateY(-1px); }
                .role-btn-employee:hover { background: rgba(255,255,255,0.05) !important; transform: translateY(-1px); }
                .role-btn-admin, .role-btn-employee { transition: all 0.18s ease; }
            `}</style>

            {/* ── LEFT PANEL ── */}
            <div style={{
                flex: "0 0 48%",
                background: "linear-gradient(145deg, #0b0f19 0%, #17253d 50%, #080c14 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "48px 56px",
                position: "relative",
                overflow: "hidden"
            }}>
                {/* Blue glow blob */}
                <div style={{
                    position: "absolute", width: 500, height: 500,
                    borderRadius: "50%", top: "30%", left: "-10%",
                    background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
                    pointerEvents: "none"
                }} />

                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "linear-gradient(135deg, #2563eb, #06b6d4)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </div>
                    <span style={{ color: "white", fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>HR Demo</span>
                </div>

                {/* Hero */}
                <div style={{ position: "relative" }}>
                    <h1 style={{
                        fontSize: "clamp(2.4rem, 4vw, 3.4rem)",
                        fontWeight: 900, lineHeight: 1.1,
                        color: "white", margin: "0 0 20px 0",
                        letterSpacing: "-1px"
                    }}>
                        Join <span style={{ color: "#60a5fa" }}>Rudratic</span> Workforce
                    </h1>
                    <p style={{ fontSize: 15, color: "#7c8fa6", lineHeight: 1.7, maxWidth: 340, margin: "0 0 36px 0" }}>
                        The all-in-one intelligence platform for modern team management, security, and enterprise efficiency.
                    </p>

                    {/* Feature rows */}
                    {[
                        {
                            label: "Bank-grade security & encryption",
                            svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        },
                        {
                            label: "Real-time analytics & insights",
                            svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        },
                        {
                            label: "Role-based access control",
                            svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        },
                    ].map(f => (
                        <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                            <div style={{
                                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                background: "rgba(37,99,235,0.1)",
                                border: "1px solid rgba(37,99,235,0.2)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#60a5fa"
                            }}>
                                {f.svg}
                            </div>
                            <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>{f.label}</span>
                        </div>
                    ))}
                </div>

                <p style={{ fontSize: 11, color: "#475569", position: "relative" }}>
                    Powered by Rudratic Intelligence Enterprise AI
                </p>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 32px",
                backgroundColor: "#080c14"
            }}>
                {/* Frosted card — exactly like reference */}
                <div style={{
                    width: "100%", maxWidth: 420,
                    background: "rgba(15,23,42,0.85)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 20,
                    padding: "44px 40px",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset"
                }}>
                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: 36 }}>
                        <p style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: "0.15em",
                            color: "#3b82f6", textTransform: "uppercase", marginBottom: 8
                        }}>Welcome Back</p>
                        <h2 style={{
                            fontSize: 22, fontWeight: 900, color: "white",
                            textTransform: "uppercase", letterSpacing: "0.04em",
                            margin: "0 0 8px 0"
                        }}>Access Your Enterprise Dashboard</h2>
                        <p style={{ fontSize: 13, color: "#4b5563", margin: 0 }}>Select your role to continue</p>
                    </div>

                    {error && (
                        <div style={{
                            backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                            borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                            fontSize: 13, color: "#f87171", textAlign: "center"
                        }}>{error}</div>
                    )}

                    {/* Admin button — matches "SIGN IN NOW" style */}
                    <button
                        type="button"
                        onClick={() => handleSelectRole("ADMIN")}
                        disabled={isLoading}
                        className="role-btn-admin"
                        style={{
                            width: "100%", padding: "16px 24px",
                            borderRadius: 12, border: "none",
                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            boxShadow: "0 0 32px rgba(37,99,235,0.3), 0 4px 16px rgba(0,0,0,0.3)",
                            color: "white", fontWeight: 800,
                            fontSize: 13, letterSpacing: "0.1em",
                            textTransform: "uppercase", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            marginBottom: 12, opacity: isLoading ? 0.6 : 1
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        {isLoading ? "Loading..." : "Log in as Admin"}
                    </button>

                    {/* Divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
                        <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151", letterSpacing: "0.1em" }}>FAST ACCESS</span>
                        <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
                    </div>

                    {/* Employee button — matches outlined style */}
                    <button
                        type="button"
                        onClick={() => handleSelectRole("EMPLOYEE")}
                        disabled={isLoading}
                        className="role-btn-employee"
                        style={{
                            width: "100%", padding: "16px 24px",
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "white", fontWeight: 800,
                            fontSize: 13, letterSpacing: "0.1em",
                            textTransform: "uppercase", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            opacity: isLoading ? 0.6 : 1
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        {isLoading ? "Loading..." : "Log in as Employee"}
                    </button>

                    {/* Footer */}
                    <p style={{ textAlign: "center", fontSize: 12, color: "#475569", marginTop: 28, marginBottom: 0 }}>
                        Wrong account?{" "}
                        <button
                            onClick={() => { setStep("business_details"); setError(""); setOtp("") }}
                            style={{ color: "#3b82f6", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 12 }}
                        >
                            Start over
                        </button>
                    </p>

                    <p style={{ textAlign: "center", fontSize: 10, color: "#334155", marginTop: 20, marginBottom: 0 }}>
                        POWERED BY RUDRATIC INTELLIGENCE<br />ENTERPRISE AI
                    </p>
                </div>
            </div>
        </div>
    )

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: "#080c14" }}
        >
            <div
                className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
                style={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >

                {/* ── STEP 1: BUSINESS DETAILS ── */}
                {step === "business_details" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="mb-5">
                            <h2 className="text-2xl font-bold mb-1.5 text-white">Tell us about your business</h2>
                            <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                                We need a few details to get you started on the HR portal.
                            </p>
                        </div>

                        <form onSubmit={handleBusinessDetailsSubmit} className="space-y-4" autoComplete="off">
                            <div className="space-y-1.5">
                                <label htmlFor="b_fullName" className="block text-sm font-semibold text-white">Full Name</label>
                                <Input
                                    id="b_fullName"
                                    placeholder="Jane Doe"
                                    value={businessForm.fullName}
                                    onChange={(e) => setBusinessForm({ ...businessForm, fullName: e.target.value })}
                                    className="text-white placeholder:text-[#6b7280] focus:border-[#3b82f6] focus-visible:ring-[#3b82f6]" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white" }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="b_companyName" className="block text-sm font-semibold text-white">Company Name</label>
                                <Input
                                    id="b_companyName"
                                    placeholder="Acme Corp"
                                    value={businessForm.companyName}
                                    onChange={(e) => setBusinessForm({ ...businessForm, companyName: e.target.value })}
                                    className="text-white placeholder:text-[#6b7280] focus:border-[#3b82f6] focus-visible:ring-[#3b82f6]" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white" }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="b_businessEmail" className="block text-sm font-semibold text-white">
                                    Business Email <span className="text-red-400">*</span>
                                </label>
                                <Input
                                    id="b_businessEmail"
                                    type="email"
                                    placeholder="jane@acmecorp.com"
                                    value={businessForm.businessEmail}
                                    onChange={(e) => setBusinessForm({ ...businessForm, businessEmail: e.target.value })}
                                    required
                                    className="text-white placeholder:text-[#6b7280] focus:border-[#3b82f6] focus-visible:ring-[#3b82f6]" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white" }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="b_phone" className="block text-sm font-semibold" style={{ color: "#94a3b8" }}>
                                    Phone <span className="font-normal text-[#6b7280]">(Optional)</span>
                                </label>
                                <Input
                                    id="b_phone"
                                    placeholder="+1 (555) 000-0000"
                                    value={businessForm.phone}
                                    onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                                    className="text-white placeholder:text-[#6b7280] focus:border-[#3b82f6] focus-visible:ring-[#3b82f6]" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white" }}
                                />
                            </div>

                            {/* Privacy Consent */}
                            <div
                                className="rounded-xl p-4 flex items-start gap-3"
                                style={{ border: "1px solid #334155", backgroundColor: "#0b1120" }}
                            >
                                <Checkbox
                                    id="b_privacy"
                                    checked={businessForm.privacy}
                                    onCheckedChange={(checked) => setBusinessForm({ ...businessForm, privacy: checked === true })}
                                    className="mt-0.5 border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <div className="space-y-1">
                                    <label htmlFor="b_privacy" className="text-sm font-bold text-white cursor-pointer">
                                        Privacy Consent
                                    </label>
                                    <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
                                        Your information is used solely for verification and initial contact. We do not sell, share, or store your information beyond the purpose of this assessment.
                                    </p>
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                            <Button
                                type="submit"
                                className="w-full text-white hover:bg-blue-700 transition-colors mt-2"
                                style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}
                                disabled={isLoading}
                            >
                                {isLoading ? "Sending OTP..." : <>{"Continue"} <ArrowRight className="ml-2 h-4 w-4" /></>}
                            </Button>

                            <div className="text-center mt-4">
                                <p className="text-sm" style={{ color: "#9ca3af" }}>
                                    Don&apos;t have access?{" "}
                                    <button
                                        type="button"
                                        onClick={() => { setStep("access_request"); setError("") }}
                                        className="font-bold hover:underline"
                                        style={{ color: "#3b82f6" }}
                                    >
                                        Request access
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── STEP 2 (legacy 'request') is now merged into business_details ── */}

                {/* ── STEP 3: ACCESS REQUEST ── */}
                {step === "access_request" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2 text-white">Request Access</h2>
                            <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>
                                Don&apos;t have a company email? Submit a request and we&apos;ll review it within 24 hours.
                            </p>
                        </div>

                        <form onSubmit={handleAccessRequestSubmit} className="space-y-4" autoComplete="off">
                            <div className="space-y-1.5">
                                <label htmlFor="fullName" className="block text-sm font-medium text-white">Full Name</label>
                                <Input
                                    id="fullName"
                                    placeholder="Jane Doe"
                                    value={accessForm.fullName}
                                    onChange={(e) => setAccessForm({ ...accessForm, fullName: e.target.value })}
                                    required
                                    className="text-white placeholder:text-[#6b7280] focus:border-[#3b82f6] focus:ring-[#3b82f6] focus-visible:ring-[#3b82f6]" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white" }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="reqEmail" className="block text-sm font-medium text-white">
                                    Your Email <span className="text-red-400">*</span>
                                </label>
                                <Input
                                    id="reqEmail"
                                    type="email"
                                    placeholder="jane@gmail.com"
                                    value={accessForm.email}
                                    onChange={(e) => setAccessForm({ ...accessForm, email: e.target.value })}
                                    required
                                    className="text-white placeholder:text-[#6b7280] focus:border-[#3b82f6] focus:ring-[#3b82f6] focus-visible:ring-[#3b82f6]" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white" }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="company" className="block text-sm font-medium text-white">Company / Project Name</label>
                                <Input
                                    id="company"
                                    placeholder="My Startup"
                                    value={accessForm.company}
                                    onChange={(e) => setAccessForm({ ...accessForm, company: e.target.value })}
                                    required
                                    className="text-white placeholder:text-[#6b7280] focus:border-[#3b82f6] focus:ring-[#3b82f6] focus-visible:ring-[#3b82f6]" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white" }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="phone" className="block text-sm font-medium" style={{ color: "#9ca3af" }}>
                                    Phone <span className="font-normal">(Optional)</span>
                                </label>
                                <Input
                                    id="phone"
                                    placeholder="+1 (555) 000-0000"
                                    value={accessForm.phone}
                                    onChange={(e) => setAccessForm({ ...accessForm, phone: e.target.value })}
                                    className="text-white placeholder:text-[#6b7280] focus:border-[#3b82f6] focus:ring-[#3b82f6] focus-visible:ring-[#3b82f6]" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white" }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="reason" className="block text-sm font-medium" style={{ color: "#9ca3af" }}>
                                    Why do you need access? <span className="font-normal">(Optional)</span>
                                </label>
                                <Textarea
                                    id="reason"
                                    placeholder="I'm a freelancer / solo founder / I don't have a company domain yet..."
                                    value={accessForm.reason}
                                    onChange={(e) => setAccessForm({ ...accessForm, reason: e.target.value })}
                                    className="resize-none h-24 text-white placeholder:text-[#6b7280]" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white" }}
                                />
                            </div>

                            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                            <Button
                                type="submit"
                                className="w-full text-white hover:bg-blue-700 transition-colors mt-2"
                                style={{ backgroundColor: "#2563eb" }}
                                disabled={isLoading}
                            >
                                {isLoading ? "Submitting..." : (
                                    <>Submit Request <ArrowRight className="ml-2 h-4 w-4" /></>
                                )}
                            </Button>

                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => { setStep("business_details"); setError("") }}
                                    className="text-sm flex items-center justify-center w-full hover:text-white transition-colors"
                                    style={{ color: "#9ca3af" }}
                                >
                                    <ArrowLeft className="mr-2 h-3 w-3" /> Back to registration
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── STEP 3b: ACCESS PENDING ── */}
                {step === "access_pending" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex flex-col items-center text-center gap-4 py-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: "#1e293b", border: "2px solid #3b82f6" }}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                                    <path d="M12 6v6l4 2"/>
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Request Received!</h2>
                                <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>
                                    Your request for{" "}
                                    <span className="font-semibold" style={{ color: "#60a5fa", fontFamily: "monospace" }}>
                                        {pendingEmail}
                                    </span>{" "}
                                    is <span className="font-semibold" style={{ color: "#f59e0b" }}>pending approval</span>.
                                    An admin will review it shortly.
                                </p>
                            </div>

                            {/* Steps info box */}
                            <div
                                className="w-full rounded-xl p-4 text-left text-xs space-y-2"
                                style={{ backgroundColor: "#0b0f19", border: "1px solid #1e293b" }}
                            >
                                <p className="font-semibold" style={{ color: "#6b7280" }}>Once approved by admin:</p>
                                <ol className="list-decimal list-inside space-y-1" style={{ color: "#9ca3af" }}>
                                    <li>Click <strong style={{ color: "#10b981" }}>&quot;I&apos;ve been approved&quot;</strong> below</li>
                                    <li>An OTP will be sent to your email</li>
                                    <li>Enter the OTP manually to log in</li>
                                </ol>
                            </div>

                            {/* ── Primary CTA: Try approved login ── */}
                            <button
                                type="button"
                                onClick={handleTryApprovedLogin}
                                disabled={isLoading || !pendingEmail}
                                className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: "linear-gradient(135deg, #10b981, #059669)",
                                    color: "white",
                                    boxShadow: "0 0 20px rgba(16,185,129,0.25)"
                                }}
                            >
                                {isLoading ? (
                                    <span>Checking approval...</span>
                                ) : (
                                    <>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6L9 17l-5-5"/>
                                        </svg>
                                        I&apos;ve been approved — Log In Now
                                    </>
                                )}
                            </button>

                            {error && <p className="text-sm text-red-400 text-center w-full">{error}</p>}

                            <button
                                type="button"
                                onClick={() => { setStep("business_details"); setError("") }}
                                className="w-full text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                                style={{ color: "#9ca3af" }}
                            >
                                <ArrowLeft className="h-3 w-3" /> Back to login
                            </button>
                        </div>
                    </div>
                )}


                {/* ── STEP 4: VERIFY OTP ── */}
                {step === "verify" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center mb-5">
                            <h3 className="text-lg font-bold" style={{ color: "#3b82f6" }}>Check Your Email</h3>
                            <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                                We sent a 6-digit code to <span className="text-white font-semibold">{email}</span>
                            </p>
                        </div>




                        <form onSubmit={handleVerifyOtp} className="space-y-4" autoComplete="off">
                            <div className="space-y-1.5">
                                <label htmlFor="otp" className="block text-sm font-semibold" style={{ color: "#3b82f6" }}>
                                    One-Time Password
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6b7280" }}>
                                        <Key className="h-4 w-4" />
                                    </span>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        className="pl-9 tracking-widest text-center text-lg text-white placeholder:text-[#6b7280]" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white" }}
                                        maxLength={6}
                                    />
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                            <Button
                                type="submit"
                                className="w-full text-white hover:bg-blue-700 transition-colors"
                                style={{ backgroundColor: "#2563eb" }}
                                disabled={isLoading}
                            >
                                {isLoading ? "Verifying..." : "Login to HR Portal"}
                            </Button>

                            {/* Resend OTP */}
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="text-xs" style={{ color: "#9ca3af" }}>Didn&apos;t receive it?</span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendCooldown > 0}
                                    className="text-xs font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                    style={{ color: "#3b82f6" }}
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => { setStep("business_details"); setError(""); setOtp("") }}
                                className="w-full text-sm mt-1 underline hover:opacity-80 transition-opacity"
                                style={{ color: "#9ca3af" }}
                            >
                                Use a different email
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    )
}
