"use client"

import { useSession } from "next-auth/react"

export type UserRole = "ADMIN" | "EMPLOYEE" | "SUPER_ADMIN" | "COMPANY_ADMIN" | "SUPPORT_ADMIN" | "AUDITOR" | "PAYROLL_ADMIN" | "HR_MANAGER" | "HR" | "MANAGER"

export function useRole() {
    const { data: session, status } = useSession()
    const role = (session?.user as { role?: UserRole })?.role as UserRole | undefined

    const r = role?.toUpperCase().replace(/\s+/g, '_') as UserRole | undefined
    return {
        role: r,
        isLoading: status === "loading",
        isAdmin: r === "ADMIN" || r === "COMPANY_ADMIN" || r === "SUPER_ADMIN",
        isManager: r === "ADMIN" || r === "COMPANY_ADMIN" || r === "SUPER_ADMIN" || r === "HR_MANAGER" || r === "HR" || r === "MANAGER",
        isEmployee: r === "EMPLOYEE",
        hasRole: (allowedRoles: UserRole[]) =>
            r ? allowedRoles.some(ar => ar.toUpperCase() === r) : false,
        hasAnyRole: (...roles: UserRole[]) =>
            r ? roles.some(ar => ar.toUpperCase() === r) : false
    }
}
