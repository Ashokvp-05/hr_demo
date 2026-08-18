"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    // Using AnimatePresence across Next.js 13+ App Router for full pages causes 
    // massive main-thread blocking during unmount. Swapping to an entrance-only 
    // fade removes the delayed click lag immediately.
    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    )
}
