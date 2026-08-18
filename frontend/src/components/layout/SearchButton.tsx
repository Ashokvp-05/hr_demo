"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function SearchButton({ className }: { className?: string }) {
    return (
        <button
            onClick={() => document.dispatchEvent(new Event('open-command-menu'))}
            className={cn(
                "relative inline-flex items-center gap-2 rounded-lg bg-gray-50/50 py-1.5 px-3 text-[12px] font-medium text-gray-400 transition-all hover:bg-gray-100 md:w-48 lg:w-64",
                className
            )}
        >
            <Search className="w-3.5 h-3.5 opacity-50" />
            <span className="truncate">Search services...</span>
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded bg-muted/50 px-1.5 font-mono text-[8px] font-bold opacity-50 sm:flex">
                <span className="text-[10px]">⌘</span>K
            </kbd>
        </button>
    )
}
