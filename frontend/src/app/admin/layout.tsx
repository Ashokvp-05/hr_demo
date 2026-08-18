import DemoSessionGuard from "@/components/demo/DemoSessionGuard"
import DemoWelcomeModal from "@/components/demo/DemoWelcomeModal"
import DemoModeBadge from "@/components/demo/DemoModeBadge"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <DemoSessionGuard />
            <DemoWelcomeModal />
            <DemoModeBadge />
            {children}
        </>
    )
}