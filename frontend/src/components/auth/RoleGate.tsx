"use client"

import { useRole, UserRole } from "@/hooks/useRole"
import { ReactNode } from "react"

interface RoleGateProps {
    children: ReactNode
    allowedRoles: UserRole[]
    fallback?: ReactNode
}

/**
 * RoleGate Component
 * 
 * Conditionally renders children based on user's role.
 */
export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
    const { hasRole, isLoading } = useRole()

    if (isLoading) {
        return null
    }

    // Role safety normalization
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase() as UserRole)

    if (!hasRole(normalizedAllowed)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

/**
 * SuperAdminOnly Component
 */
export function SuperAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
    return <RoleGate allowedRoles={["SUPER_ADMIN" as UserRole]} fallback={fallback}>{children}</RoleGate>
}

/**
 * AdminOnly Component
 * Shorthand for company admin content
 */
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
    return <RoleGate allowedRoles={["ADMIN" as UserRole, "COMPANY_ADMIN" as UserRole, "SUPER_ADMIN" as UserRole]} fallback={fallback}>{children}</RoleGate>
}

/**
 * ManagerOnly Component
 * Shorthand for manager and admin content
 */
export function ManagerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
    return <RoleGate allowedRoles={["ADMIN" as UserRole, "MANAGER" as UserRole, "HR" as UserRole, "HR_MANAGER" as UserRole]} fallback={fallback}>{children}</RoleGate>
}

/**
 * AuditorOnly Component
 */
export function AuditorOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
    return <RoleGate allowedRoles={["AUDITOR" as UserRole]} fallback={fallback}>{children}</RoleGate>
}

/**
 * SupportOnly Component
 */
export function SupportOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
    return <RoleGate allowedRoles={["SUPPORT_ADMIN" as UserRole]} fallback={fallback}>{children}</RoleGate>
}

/**
 * EmployeeOnly Component
 */
export function EmployeeOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
    return <RoleGate allowedRoles={["EMPLOYEE" as UserRole]} fallback={fallback}>{children}</RoleGate>
}
