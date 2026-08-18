"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Shield } from "lucide-react"

export function PrivacyToggle() {
    const [isPrivacy, setIsPrivacy] = useState(false)

    useEffect(() => {
        if (isPrivacy) {
            document.body.classList.add('privacy-blur')
        } else {
            document.body.classList.remove('privacy-blur')
        }
    }, [isPrivacy])

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPrivacy(!isPrivacy)}
            className={`h-10 px-5 rounded-2xl gap-3 font-bold uppercase text-[9px] tracking-[0.2em] transition-all border ${isPrivacy
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    : 'text-slate-300 bg-white/5 border-white/10 hover:text-white hover:bg-white/20'
                }`}
        >
            {isPrivacy ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isPrivacy ? "Encrypted" : "Decrypted"}
            <Shield className={`w-3 h-3 ${isPrivacy ? 'text-rose-500' : 'text-slate-500'}`} />
        </Button>
    )
}
