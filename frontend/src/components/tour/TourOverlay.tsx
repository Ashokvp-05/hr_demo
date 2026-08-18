"use client"

import { useEffect, useState } from "react"
import { useTour } from "./TourContext"

interface Rect { top: number; left: number; width: number; height: number }

export function TourOverlay() {
    const { active, steps, stepIndex } = useTour()
    const [rect, setRect] = useState<Rect | null>(null)

    useEffect(() => {
        if (!active) { setRect(null); return }
        const step = steps[stepIndex]
        if (!step) return

        const measure = () => {
            const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null
            if (!el) { setRect(null); return }
            const r = el.getBoundingClientRect()
            setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
        }

        measure()
        // re-measure on resize / scroll
        window.addEventListener("resize", measure)
        window.addEventListener("scroll", measure, true)
        return () => {
            window.removeEventListener("resize", measure)
            window.removeEventListener("scroll", measure, true)
        }
    }, [active, steps, stepIndex])

    if (!active) return null

    const pad = 8  // px of extra glow padding around element
    const step = steps[stepIndex]

    return (
        <>
            <style>{`
                @keyframes tour-pulse {
                    0%, 100% { box-shadow: 0 0 0 4px rgba(59,130,246,0.8), 0 0 0 9999px rgba(0,0,0,0.62); }
                    50%       { box-shadow: 0 0 0 7px rgba(59,130,246,0.5), 0 0 0 9999px rgba(0,0,0,0.62); }
                }
            `}</style>

            {step && (
                <style>{`
                    [data-tour="${step.target}"] {
                        position: relative !important;
                        z-index: 10000 !important;
                        background-color: var(--card) !important;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04) !important;
                    }
                `}</style>
            )}

            {/* Full-screen overlay — transparent where spotlight is */}
            {rect ? (
                <div
                    style={{
                        position: "fixed", inset: 0,
                        zIndex: 9998,
                        pointerEvents: "all",
                        // clip-path creates a "hole" around the highlighted element
                        background: "rgba(0,0,0,0)",
                    }}
                >
                    {/* Top strip */}
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: rect.top - pad, background: "rgba(0,0,0,0.62)", pointerEvents: "all" }} />
                    {/* Bottom strip */}
                    <div style={{ position: "fixed", top: rect.top + rect.height + pad, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.62)", pointerEvents: "all" }} />
                    {/* Left strip */}
                    <div style={{ position: "fixed", top: rect.top - pad, left: 0, width: rect.left - pad, height: rect.height + pad * 2, background: "rgba(0,0,0,0.62)", pointerEvents: "all" }} />
                    {/* Right strip */}
                    <div style={{ position: "fixed", top: rect.top - pad, left: rect.left + rect.width + pad, right: 0, height: rect.height + pad * 2, background: "rgba(0,0,0,0.62)", pointerEvents: "all" }} />
                    {/* Glowing spotlight border */}
                    <div style={{
                        position: "fixed",
                        top: rect.top - pad,
                        left: rect.left - pad,
                        width: rect.width + pad * 2,
                        height: rect.height + pad * 2,
                        borderRadius: 10,
                        boxShadow: "0 0 0 3px rgba(59,130,246,0.9)",
                        animation: "tour-pulse 2s ease-in-out infinite",
                        pointerEvents: "none",
                        zIndex: 9999,
                    }} />
                </div>
            ) : (
                /* No target found — plain full overlay */
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.62)", zIndex: 9998, pointerEvents: "all" }} />
            )}
        </>
    )
}
