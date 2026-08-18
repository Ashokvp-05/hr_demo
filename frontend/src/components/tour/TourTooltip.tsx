"use client"

import { useEffect, useRef, useState } from "react"
import { useTour } from "./TourContext"

interface Pos { top: number; left: number; placement: "top" | "bottom" | "left" | "right" }

const TOOLTIP_W = 340
const PAD = 8
const GAP = 16
const MARGIN = 16  // min margin from any edge

export function TourTooltip() {
    const { active, steps, stepIndex, stop, next, back } = useTour()
    const [pos, setPos] = useState<Pos | null>(null)
    const [visible, setVisible] = useState(false)
    const tooltipRef = useRef<HTMLDivElement>(null)

    const step = steps[stepIndex]

    useEffect(() => {
        if (!active || !step) { setPos(null); setVisible(false); return }

        const place = () => {
            const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null
            if (!el) { setPos(null); return }

            const r = el.getBoundingClientRect()
            const vw = window.innerWidth
            const vh = window.innerHeight
            // Use actual tooltip height if already rendered, else estimate
            const tooltipH = tooltipRef.current ? tooltipRef.current.offsetHeight : 260

            const preferred = step.position ?? "bottom"
            const placements: Array<"bottom" | "top" | "right" | "left"> = [preferred as any, "bottom", "top", "right", "left"]

            let chosen: Pos | null = null

            for (const pl of placements) {
                let top = 0, left = 0
                if (pl === "bottom") {
                    top = r.bottom + PAD + GAP
                    left = r.left + r.width / 2 - TOOLTIP_W / 2
                } else if (pl === "top") {
                    top = r.top - tooltipH - PAD - GAP
                    left = r.left + r.width / 2 - TOOLTIP_W / 2
                } else if (pl === "right") {
                    top = r.top + r.height / 2 - tooltipH / 2
                    left = r.right + PAD + GAP
                } else {
                    top = r.top + r.height / 2 - tooltipH / 2
                    left = r.left - TOOLTIP_W - PAD - GAP
                }

                // Clamp to viewport edges
                left = Math.max(MARGIN, Math.min(left, vw - TOOLTIP_W - MARGIN))
                top  = Math.max(MARGIN, Math.min(top,  vh - tooltipH - MARGIN))

                const fitsH = top >= MARGIN && (top + tooltipH) <= (vh - MARGIN)
                const fitsW = left >= MARGIN && (left + TOOLTIP_W) <= (vw - MARGIN)

                if (fitsH && fitsW) {
                    chosen = { top, left, placement: pl }
                    break
                }
            }

            // Fallback: center on screen if nothing fits
            if (!chosen) {
                chosen = {
                    top: Math.max(MARGIN, (vh - tooltipH) / 2),
                    left: Math.max(MARGIN, (vw - TOOLTIP_W) / 2),
                    placement: "bottom"
                }
            }

            setPos(chosen)
        }

        // Run immediately, then again after tooltip renders to get real height
        place()
        const t1 = setTimeout(() => { setVisible(true); place() }, 30)
        const t2 = setTimeout(place, 80) // second pass with real height
        window.addEventListener("resize", place)
        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            window.removeEventListener("resize", place)
        }
    }, [active, step, stepIndex])

    useEffect(() => {
        setVisible(false)
        const t = setTimeout(() => setVisible(true), 30)
        return () => clearTimeout(t)
    }, [stepIndex])

    if (!active || !step || !pos) return null

    const isFirst = stepIndex === 0
    const isLast  = stepIndex === steps.length - 1

    return (
        <div
            ref={tooltipRef}
            style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width: TOOLTIP_W,
                zIndex: 10001,
                background: "#ffffff",
                borderRadius: 14,
                boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)",
                fontFamily: "'Inter', sans-serif",
                overflow: "hidden",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.2s ease, transform 0.2s ease",
                pointerEvents: "all",
            }}
        >
            {/* Header bar */}
            <div style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Step {stepIndex + 1} of {steps.length}
                </span>
                {/* Progress dots */}
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    {steps.map((_, i) => (
                        <div key={i} style={{
                            width: i === stepIndex ? 18 : 6,
                            height: 6, borderRadius: 3,
                            background: i === stepIndex ? "white" : "rgba(255,255,255,0.3)",
                            transition: "all 0.25s ease"
                        }} />
                    ))}
                </div>
                {/* Close */}
                <button onClick={stop} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 16, lineHeight: 1, padding: "0 0 0 8px" }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: "18px 20px" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>{step.title}</p>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, margin: 0 }}>{step.description}</p>
            </div>

            {/* Footer */}
            <div style={{
                padding: "10px 20px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderTop: "1px solid #f1f5f9"
            }}>
                <button
                    onClick={stop}
                    style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                    Skip Tour
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                    {!isFirst && (
                        <button
                            onClick={back}
                            style={{
                                fontSize: 13, fontWeight: 600, color: "#475569",
                                background: "#f8fafc", border: "1px solid #e2e8f0",
                                borderRadius: 8, padding: "7px 14px", cursor: "pointer"
                            }}
                        >
                            ← Back
                        </button>
                    )}
                    <button
                        onClick={next}
                        style={{
                            fontSize: 13, fontWeight: 700, color: "white",
                            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                            border: "none", borderRadius: 8, padding: "7px 18px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(37,99,235,0.35)"
                        }}
                    >
                        {isLast ? "Finish ✓" : "Next →"}
                    </button>
                </div>
            </div>
        </div>
    )
}
