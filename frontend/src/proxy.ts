import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { getDashboardByRole } from "@/lib/role-redirect"

const PUBLIC_ROUTES = ["/", "/auth-test", "/logout", "/clear-session", "/rbac-test", "/approve-requests", "/role-preview"]
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "COMPANY_ADMIN", "OPS_ADMIN", "FINANCE_ADMIN", "HR_ADMIN", "VIEWER_ADMIN"]
const ADMIN_ONLY_PATHS = ["/admin"]
const EMPLOYEE_ONLY_PATHS = ["/employee", "/payslip", "/leave", "/attendance", "/kudos", "/performance", "/profile", "/notifications", "/documents", "/policies", "/history", "/help", "/support"]

export default auth((req: any) => {
    const isLoggedIn = !!req.auth
    const { nextUrl } = req
    const rawRole = (req.auth?.user as any)?.role || ""
    const role = rawRole.trim().toUpperCase().replace(/[\s-]/g, "_")

    if (nextUrl.pathname.startsWith("/api")) return NextResponse.next()

    const isPublicRoute = PUBLIC_ROUTES.some(
        (r) => nextUrl.pathname === r || nextUrl.pathname.startsWith(r + "/")
    )

    if (!isLoggedIn && !isPublicRoute) {
        const loginUrl = new URL("/", nextUrl)
        const intended = nextUrl.pathname + nextUrl.search
        if (intended !== "/") loginUrl.searchParams.set("callbackUrl", intended)
        return NextResponse.redirect(loginUrl)
    }

    if (isLoggedIn && nextUrl.pathname === "/") {
        const target = getDashboardByRole(role)
        return NextResponse.redirect(new URL(target, nextUrl))
    }

    if (isLoggedIn) {
        const isAdmin = ADMIN_ROLES.includes(role)
        const wantsAdminRoute = ADMIN_ONLY_PATHS.some(
            (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(p + "/") || nextUrl.pathname.startsWith(p + "?")
        )
        const wantsEmployeeRoute = EMPLOYEE_ONLY_PATHS.some(
            (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(p + "/")
        )
        if (wantsAdminRoute && !isAdmin) return NextResponse.redirect(new URL("/employee", nextUrl))
        if (wantsEmployeeRoute && isAdmin) return NextResponse.redirect(new URL("/admin", nextUrl))
    }

    if (nextUrl.pathname === "/dashboard") {
        return NextResponse.redirect(new URL(getDashboardByRole(role), nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        "/((?!api/auth|_next/static|_next/image|favicon.ico|logo.png|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}