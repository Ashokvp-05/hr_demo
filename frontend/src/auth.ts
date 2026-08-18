import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import AzureAD from "next-auth/providers/azure-ad"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

const publicRoutes = ["/", "/login", "/register", "/register-company", "/forgot-password", "/reset-password", "/auth-test", "/logout", "/clear-session", "/rbac-test"]
const authRoutes = ["/", "/login", "/register", "/register-company", "/forgot-password", "/reset-password"]

export const config = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        AzureAD({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
        }),
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                jwt: { label: "JWT", type: "text" },
                userData: { label: "User Data", type: "text" }
            },
            async authorize(credentials: any) {
                // Scenario 1: Direct JWT Login (Post-2FA / OTP demo)
                if (credentials?.jwt && credentials?.userData) {
                    try {
                        const user = JSON.parse(credentials.userData as string)
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            companyId: user.companyId,
                            companyName: user.companyName,
                            accessToken: credentials.jwt as string,
                            // Demo session fields — must be forwarded explicitly
                            demoExpiresAt: user.demoExpiresAt ?? null,
                            isDemo: user.isDemo ?? false,
                        }
                    } catch (e) {
                        return null
                    }
                }

                // Scenario 2: Standard Email/Password
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    // IMPORTANT: auth.ts runs server-side (NextAuth authorize callback).
                    // We must use INTERNAL_BACKEND_URL (direct Docker network URL: http://backend:4000)
                    // NOT NEXT_PUBLIC_API_URL which is /api (a relative path only valid in the browser).
                    // Using /api here would call localhost:3000/api → Next.js itself → infinite loop.
                    const apiBase = process.env.INTERNAL_BACKEND_URL
                        ? `${process.env.INTERNAL_BACKEND_URL}/api`
                        : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
                    const res = await fetch(`${apiBase}/auth/login`, {
                        method: 'POST',
                        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
                        headers: { "Content-Type": "application/json" }
                    });

                    const data = await res.json();

                    if (res.ok) {
                        if (data.requires2FA) {
                            // Signal to frontend that 2FA is needed
                            throw new Error("REQUIRES_2FA:" + JSON.stringify(data));
                        }
                        if (data.user) {
                            return {
                                id: data.user.user.id,
                                name: data.user.user.name,
                                email: data.user.user.email,
                                role: data.user.user.role,
                                companyId: data.user.user.companyId,
                                companyName: data.user.user.companyName,
                                accessToken: data.user.token,
                            };
                        }
                    }
                    return null;
                } catch (error: any) {
                    // Propagate the specific error for 2FA
                    if (error.message.startsWith("REQUIRES_2FA:")) throw error;
                    console.error("Auth error:", error);
                    return null;
                }
            }
        })
    ],
    pages: {
        signIn: '/',
    },
    callbacks: {
        authorized({ auth }: { auth: any }) {
            // Route protection is handled by middleware.ts
            // This callback just needs to return true to allow NextAuth to function
            return true
        },
        async jwt({ token, user }: { token: any, user: any }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role || 'EMPLOYEE'
                token.companyId = (user as any).companyId
                token.companyName = (user as any).companyName
                token.accessToken = (user as any).accessToken
                token.demoExpiresAt = (user as any).demoExpiresAt
                token.isDemo = (user as any).isDemo
            }

            // Auto-refresh backend JWT if it's about to expire (< 1 day remaining)
            if (token.accessToken) {
                try {
                    const parts = token.accessToken.split('.')
                    if (parts.length === 3) {
                        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
                        const expiresAt = payload.exp * 1000 // convert to ms
                        const oneDayMs = 24 * 60 * 60 * 1000
                        
                        if (Date.now() > expiresAt - oneDayMs) {
                            // Token expires in less than 1 day — refresh it
                            const apiBase = process.env.INTERNAL_BACKEND_URL
                                ? `${process.env.INTERNAL_BACKEND_URL}/api`
                                : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
                            const res = await fetch(`${apiBase}/auth/refresh-token`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token.accessToken}`,
                                    'Content-Type': 'application/json'
                                }
                            })
                            if (res.ok) {
                                const data = await res.json()
                                if (data.token) {
                                    token.accessToken = data.token
                                }
                            }
                        }
                    }
                } catch (e) {
                    // If refresh fails, keep the existing token — user will re-login when it fully expires
                    console.warn('[Auth] Token refresh check failed:', e)
                }
            }

            return token
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.companyId = token.companyId as string
                session.user.companyName = token.companyName as string
                session.user.accessToken = token.accessToken as string
                session.user.demoExpiresAt = token.demoExpiresAt as number | undefined
                session.user.isDemo = token.isDemo as boolean | undefined
            }
            return session
        }
    }
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
