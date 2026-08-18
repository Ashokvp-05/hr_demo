"use client"

import { useTour } from "./TourContext"

export function TourLauncher({ steps, lsKey }: { steps: import("./TourContext").TourStep[], lsKey: string }) {
    const { start, active } = useTour()

    if (active) return null

    return (
        <button
            onClick={() => start(steps, lsKey)}
            style={{
                display: "flex", alignItems: "center", gap: 7,
                fontSize: 13, fontWeight: 600, color: "#2563eb",
                background: "#eff6ff",
                border: "1.5px solid #bfdbfe",
                borderRadius: 999,
                padding: "7px 16px",
                cursor: "pointer",
                transition: "all 0.18s ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "#dbeafe"
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = "#93c5fd"
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "#eff6ff"
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = "#bfdbfe"
            }}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Start Interactive Tour
        </button>
    )
}
