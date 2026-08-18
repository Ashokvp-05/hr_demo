import { redirect } from "next/navigation"

/**
 * Legacy /login route — redirects to the OTP wizard on the landing page.
 * Direct password login has been replaced by the FlowForge OTP flow.
 */
export default function LoginRedirectPage() {
    redirect("/")
}
