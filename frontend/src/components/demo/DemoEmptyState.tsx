"use client"

/**
 * DemoEmptyState — A friendly, styled placeholder for pages/sections
 * that have no real data yet. Used across all dashboard module pages.
 *
 * Usage:
 *   <DemoEmptyState icon="📋" title="No leave requests" description="..." />
 */

interface DemoEmptyStateProps {
    icon?: string
    title: string
    description?: string
    /** Optional action button */
    action?: { label: string; onClick: () => void }
    size?: "sm" | "md" | "lg"
}

export function DemoEmptyState({ icon = "📂", title, description, action, size = "md" }: DemoEmptyStateProps) {
    const paddingMap = { sm: "24px 20px", md: "48px 32px", lg: "72px 32px" }
    const iconSizeMap = { sm: 36, md: 52, lg: 64 }
    const titleSizeMap = { sm: 13, md: 15, lg: 17 }

    return (
        <div
            style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                textAlign: "center", padding: paddingMap[size],
                background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.08)",
                borderRadius: 16, width: "100%",
            }}
        >
            <div style={{ fontSize: iconSizeMap[size], marginBottom: 14, opacity: 0.6 }}>{icon}</div>
            <p style={{ fontSize: titleSizeMap[size], fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>
                {title}
            </p>
            {description && (
                <p style={{ fontSize: 12, color: "#374151", maxWidth: 300, lineHeight: 1.6, marginBottom: action ? 18 : 0 }}>
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    style={{
                        padding: "8px 20px", borderRadius: 8,
                        background: "rgba(91,93,236,0.15)", border: "1px solid rgba(91,93,236,0.3)",
                        color: "#a5b4fc", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(91,93,236,0.25)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(91,93,236,0.15)" }}
                >
                    {action.label}
                </button>
            )}
        </div>
    )
}

/**
 * DemoBanner — A subtle info strip shown at the top of dashboard pages
 * to remind visitors they are in demo mode and what they can explore.
 */
interface DemoBannerProps {
    message?: string
    highlight?: string
}

export function DemoBanner({ message, highlight }: DemoBannerProps) {
    return (
        <div
            style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", borderRadius: 10, marginBottom: 20,
                background: "rgba(91,93,236,0.07)", border: "1px solid rgba(91,93,236,0.18)",
            }}
        >
            <span style={{ fontSize: 14 }}>🎯</span>
            <p style={{ fontSize: 12, color: "#7c8fa6", lineHeight: 1.5 }}>
                {message || "This is a demo environment with"}{" "}
                {highlight && <strong style={{ color: "#a78bfa" }}>{highlight}</strong>}
            </p>
        </div>
    )
}
