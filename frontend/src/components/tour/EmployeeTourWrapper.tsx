"use client"

import { TourProvider } from "@/components/tour/TourContext"
import { TourOverlay } from "@/components/tour/TourOverlay"
import { TourTooltip } from "@/components/tour/TourTooltip"
import { TourLauncher } from "@/components/tour/TourLauncher"
import { employeeTourSteps, EMP_TOUR_LS_KEY } from "@/data/employeeTourSteps"
import { useSession } from "next-auth/react"
import { useTour } from "@/components/tour/TourContext"
import { useEffect } from "react"

function EmployeeTourAutoStart() {
    const { data: session, status } = useSession()
    const { start } = useTour()

    useEffect(() => {
        if (status !== "authenticated") return
        const seen = localStorage.getItem(EMP_TOUR_LS_KEY)
        if (!seen) {
            setTimeout(() => start(employeeTourSteps, EMP_TOUR_LS_KEY), 1200)
        }
    }, [status])

    return null
}

export default function EmployeeTourProvider({ children }: { children: React.ReactNode }) {
    return (
        <TourProvider>
            <TourOverlay />
            <TourTooltip />
            <EmployeeTourAutoStart />
            {children}
        </TourProvider>
    )
}

export function EmployeeTourLauncher() {
    return <TourLauncher steps={employeeTourSteps} lsKey={EMP_TOUR_LS_KEY} />
}
