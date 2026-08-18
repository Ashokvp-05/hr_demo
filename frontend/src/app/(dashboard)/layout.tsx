import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import PageTransition from "@/components/layout/PageTransition"
import TopHeader from "@/components/layout/TopHeader"
import DemoSessionGuard from "@/components/demo/DemoSessionGuard"
import DemoWelcomeModal from "@/components/demo/DemoWelcomeModal"
import DemoModeBadge from "@/components/demo/DemoModeBadge"
import EmployeeTourProvider, { EmployeeTourLauncher } from "@/components/tour/EmployeeTourWrapper"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    const token = (session.user as any)?.accessToken || ""

    return (
        <div className="flex min-h-screen font-body bg-background">
            {/* 🕐 DEMO SESSION GUARD — auto-logout after 10 min */}
            <DemoSessionGuard />
            {/* 👋 DEMO WELCOME MODAL — shown once per session */}
            <DemoWelcomeModal />
            {/* 🏷️ DEMO MODE BADGE — persistent role badge + quick explore */}
            <DemoModeBadge />

            {/* 🗺️ EMPLOYEE INTERACTIVE TOUR — spotlight walkthrough */}
            <EmployeeTourProvider>

                {/* 🛡️ THE PROFESSIONAL GLOBAL SIDEBAR */}
                <Navbar
                    role={session.user?.role}
                    token={token}
                    companyName={session.user?.companyName || undefined}
                />

                {/* 🏗️ MAIN CONTENT STAGE */}
                <main className="flex-1 w-full min-w-0 bg-background/50 h-screen overflow-y-auto">
                    <TopHeader
                        token={token}
                        tourLauncher={<EmployeeTourLauncher />}
                    />
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>

            </EmployeeTourProvider>
        </div>
    )
}
