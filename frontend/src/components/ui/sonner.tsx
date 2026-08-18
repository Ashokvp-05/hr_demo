"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
import { useEffect } from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    useEffect(() => {
        const handleGlobalClick = () => {
            toast.dismiss()
        }
        document.addEventListener("click", handleGlobalClick)
        return () => document.removeEventListener("click", handleGlobalClick)
    }, [])

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            duration={3000}
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-slate-950 group-[.toaster]:text-slate-950 group-[.toaster]:dark:text-slate-50 group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-slate-500 group-[.toast]:dark:text-slate-400",
                    actionButton:
                        "group-[.toast]:bg-violet-600 group-[.toast]:text-white",
                    cancelButton:
                        "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
