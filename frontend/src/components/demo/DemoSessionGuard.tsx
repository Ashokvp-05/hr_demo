"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LogOut, Timer } from "lucide-react"
import { signOutAndClearSession } from "@/lib/sign-out"

const LS_EXPIRES_KEY = "demo_expires_at"
const LS_SESSION_KEY = "demo_session"
const LS_EXTENDS_KEY = "demo_extends_used"
const MAX_EXTENDS = 2
const EXTEND_MINUTES = 10

export default function DemoSessionGuard() {
    const { data: session } = useSession()
    const router = useRouter()
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
    const [expired, setExpired] = useState(false)
    const [extendsUsed, setExtendsUsed] = useState(0)
    const [showExtendAnim, setShowExtendAnim] = useState(false)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const expiresAtRef = useRef<number | null>(null)

    useEffect(() => {
        const ls = localStorage.getItem(LS_EXPIRES_KEY)
        const sessionExpiry = (session?.user as any)?.demoExpiresAt
        const expiresAt = ls ? Number(ls) : sessionExpiry ? Number(sessionExpiry) : null
        const isDemo = localStorage.getItem(LS_SESSION_KEY) === "true" || !!(session?.user as any)?.isDemo
        const extends_ = Number(localStorage.getItem(LS_EXTENDS_KEY) || "0")

        if (!isDemo || !expiresAt) return

        expiresAtRef.current = expiresAt
        setExtendsUsed(extends_)

        const tick = () => {
            const remaining = Math.floor(((expiresAtRef.current ?? 0) - Date.now()) / 1000)
            if (remaining <= 0) {
                setSecondsLeft(0)
                setExpired(true)
                if (intervalRef.current) clearInterval(intervalRef.current)
            } else {
                setSecondsLeft(remaining)
            }
        }

        tick()
        intervalRef.current = setInterval(tick, 1000)
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [session])

    const handleExtendSession = () => {
        if (extendsUsed >= MAX_EXTENDS) return
        const newExpiry = (expiresAtRef.current ?? Date.now()) + EXTEND_MINUTES * 60 * 1000
        expiresAtRef.current = newExpiry
        localStorage.setItem(LS_EXPIRES_KEY, String(newExpiry))
        const newExtends = extendsUsed + 1
        setExtendsUsed(newExtends)
        localStorage.setItem(LS_EXTENDS_KEY, String(newExtends))
        setShowExtendAnim(true)
        setTimeout(() => setShowExtendAnim(false), 2000)
    }

    const handleEndSession = async () => {
        localStorage.removeItem(LS_EXPIRES_KEY)
        localStorage.removeItem(LS_SESSION_KEY)
        localStorage.removeItem(LS_EXTENDS_KEY)
        await signOutAndClearSession((session?.user as any)?.email)
    }

    useEffect(() => {
        if (!expired) return
        const timeout = setTimeout(handleEndSession, 2500)
        return () => clearTimeout(timeout)
    }, [expired])

    if (secondsLeft === null) return null

    const mins = Math.floor(secondsLeft / 60)
    const secs = secondsLeft % 60
    const timeLabel = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0")
    const urgency = secondsLeft <= 30 ? "critical" : secondsLeft <= 120 ? "warning" : "normal"
    const canExtend = extendsUsed < MAX_EXTENDS

    // Fully opaque, high-contrast colour schemes per urgency
    const themes = {
        normal: {
            pill:       "#0f172a",
            pillBorder: "#3b82f6",
            dot:        "#3b82f6",
            label:      "#93c5fd",
            timerBg:    "#1e40af",
            timerText:  "#ffffff",
            endColor:   "#93c5fd",
            glow:       "0 0 18px rgba(59,130,246,0.45)",
        },
        warning: {
            pill:       "#1c1004",
            pillBorder: "#f59e0b",
            dot:        "#f59e0b",
            label:      "#fcd34d",
            timerBg:    "#92400e",
            timerText:  "#ffffff",
            endColor:   "#fcd34d",
            glow:       "0 0 18px rgba(245,158,11,0.45)",
        },
        critical: {
            pill:       "#1a0505",
            pillBorder: "#ef4444",
            dot:        "#ef4444",
            label:      "#fca5a5",
            timerBg:    "#991b1b",
            timerText:  "#ffffff",
            endColor:   "#fca5a5",
            glow:       "0 0 22px rgba(239,68,68,0.55)",
        },
    }
    const t = themes[urgency]

    if (expired) {
        return (
            <div
                className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-2.5 rounded-2xl select-none"
                style={{
                    background: "#1a0505",
                    border: "1.5px solid #ef4444",
                    boxShadow: "0 0 24px rgba(239,68,68,0.5)",
                    color: "#fca5a5",
                }}
            >
                <LogOut className="h-4 w-4 shrink-0 animate-pulse" />
                <span className="font-semibold text-sm tracking-wide">Demo session ended — redirecting...</span>
            </div>
        )
    }

    return (
        <>
            <style>{`
                @keyframes demo-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
                @keyframes ping-dot { 75%,100% { transform:scale(2); opacity:0; } }
            `}</style>
            <div
                className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-2 rounded-2xl select-none"
                style={{
                    background: t.pill,
                    border: `1.5px solid ${t.pillBorder}`,
                    boxShadow: t.glow,
                    transition: "all 0.4s ease",
                }}
            >
                {/* Pulsing live dot */}
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span
                        className="absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{
                            backgroundColor: t.dot,
                            animation: "ping-dot 1.2s cubic-bezier(0,0,0.2,1) infinite"
                        }}
                    />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: t.dot }} />
                </span>

                {/* Label */}
                <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: t.label, letterSpacing: "0.12em" }}
                >
                    Demo Session
                </span>

                {/* Divider */}
                <span style={{ width: 1, height: 14, background: t.pillBorder, opacity: 0.4, borderRadius: 2, flexShrink: 0 }} />

                {/* Timer chip */}
                <span
                    className="font-black tabular-nums text-sm tracking-widest px-3 py-1 rounded-lg"
                    style={{
                        background: t.timerBg,
                        color: t.timerText,
                        animation: urgency === "critical" ? "demo-pulse 0.8s infinite" : "none",
                        minWidth: 58,
                        textAlign: "center",
                        letterSpacing: "0.1em",
                    }}
                >
                    {showExtendAnim ? "+10:00 ✓" : timeLabel}
                </span>

                {/* Divider */}
                <span style={{ width: 1, height: 14, background: t.pillBorder, opacity: 0.4, borderRadius: 2, flexShrink: 0 }} />

                {/* End session */}
                <button
                    onClick={handleEndSession}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-100"
                    style={{
                        color: t.endColor,
                        background: "rgba(255,255,255,0.06)",
                        border: `1px solid ${t.pillBorder}`,
                        opacity: 0.85,
                    }}
                >
                    <LogOut className="h-3 w-3" />
                    End
                </button>
            </div>
        </>
    )
}