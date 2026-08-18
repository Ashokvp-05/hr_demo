import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            role: string
            companyId?: string | null
            companyName?: string | null
            accessToken: string
        }
    }

    interface User {
        id: string
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string
        companyId?: string | null
        companyName?: string | null
        accessToken?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: string
        companyId?: string | null
        companyName?: string | null
        accessToken: string
    }
}
