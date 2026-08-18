import { signOut } from "next-auth/react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api"

/**
 * Signs the user out of NextAuth AND clears the backend active-session lock
 * so the same email can log in again (single-session enforcement for non-company emails).
 */
export async function signOutAndClearSession(email?: string | null) {
    // 1. Clear localStorage demo tokens
    try {
        localStorage.removeItem("demo_expires_at")
        localStorage.removeItem("demo_session")
    } catch {}

    // 2. Tell the backend to release the session slot for this email
    if (email) {
        try {
            await fetch(`${API_BASE}/auth/session-logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })
        } catch {
            // non-critical — backend may restart, activeSessions resets anyway
        }
    }

    // 3. Sign out of NextAuth and redirect to role selection page
    await signOut({ callbackUrl: "/?preview=role" })
}
