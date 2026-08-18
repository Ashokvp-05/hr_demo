"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export interface TourStep {
    target: string          // matches data-tour="..." attribute
    title: string
    description: string
    position?: "top" | "bottom" | "left" | "right"
}

interface TourContextValue {
    active: boolean
    stepIndex: number
    steps: TourStep[]
    start: (steps: TourStep[], lsKey?: string) => void
    stop: () => void
    next: () => void
    back: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function TourProvider({ children }: { children: ReactNode }) {
    const [active, setActive] = useState(false)
    const [stepIndex, setStepIndex] = useState(0)
    const [steps, setSteps] = useState<TourStep[]>([])
    const [lsKey, setLsKey] = useState<string | undefined>()

    const start = useCallback((tourSteps: TourStep[], key?: string) => {
        setSteps(tourSteps)
        setStepIndex(0)
        setActive(true)
        setLsKey(key)
    }, [])

    const stop = useCallback(() => {
        setActive(false)
        setStepIndex(0)
        if (lsKey) {
            try { localStorage.setItem(lsKey, "true") } catch {}
        }
    }, [lsKey])

    const next = useCallback(() => {
        setStepIndex(prev => {
            if (prev >= steps.length - 1) {
                setActive(false)
                if (lsKey) {
                    try { localStorage.setItem(lsKey, "true") } catch {}
                }
                return 0
            }
            return prev + 1
        })
    }, [steps.length, lsKey])

    const back = useCallback(() => {
        setStepIndex(prev => Math.max(0, prev - 1))
    }, [])

    return (
        <TourContext.Provider value={{ active, stepIndex, steps, start, stop, next, back }}>
            {children}
        </TourContext.Provider>
    )
}

export function useTour() {
    const ctx = useContext(TourContext)
    if (!ctx) throw new Error("useTour must be used inside TourProvider")
    return ctx
}
