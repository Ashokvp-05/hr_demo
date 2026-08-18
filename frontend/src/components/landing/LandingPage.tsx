"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Zap, BarChart3, Users, Globe, ChevronRight, LayoutDashboard, Database, Lock } from "lucide-react"

const features = [
    {
        icon: LayoutDashboard,
        title: "Specialized Command Centers",
        description: "Tailored dashboards for Super Admins, HR Managers, Payroll Admins, and Employees."
    },
    {
        icon: Zap,
        title: "Real-time Intelligence",
        description: "Live workforce analytics, attendance tracking, and performance diagnostics."
    },
    {
        icon: Database,
        title: "Fiscal Settlement Protocol",
        description: "Batch-based payroll settlement with automated tax compliance and bank-grade security."
    },
    {
        icon: Lock,
        title: "Enterprise Security",
        description: "Multi-tenant isolation with robust RBAC and encrypted document vaulting."
    }
]

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#02040a] text-white selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#02040a]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter uppercase whitespace-nowrap">
                            Swot <span className="text-indigo-400">HR</span>
                        </span>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400 uppercase tracking-widest">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#security" className="hover:text-white transition-colors">Security</a>
                        <a href="#about" className="hover:text-white transition-colors">Enterprise</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/register-company">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-6 rounded-full shadow-lg shadow-indigo-600/20">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }} 
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Zap className="w-3 h-3" />
                            Next-Gen Personnel Intelligence
                        </div>
                        <h1 className="text-6xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
                            The Hub of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-fuchsia-400">
                                Global Workforce
                            </span> Excellence.
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-12 max-w-xl">
                            Swot-HR is the specialized terminal for modern enterprises. Orchestrate your workforce, automate fiscal settlements, and drive organizational intelligence from a single, high-fidelity command center.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <Link href="/register-company">
                                <Button className="h-16 px-10 bg-white text-black hover:bg-slate-200 font-bold rounded-2xl text-xs uppercase tracking-[0.2em] transition-all group shadow-xl">
                                    Start Building
                                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-12 h-12 rounded-full border-4 border-[#02040a] bg-slate-800 overflow-hidden shadow-lg">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                                    </div>
                                ))}
                                <div className="w-12 h-12 rounded-full border-4 border-[#02040a] bg-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                    +2k
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 rounded-[3rem] blur-3xl" />
                        <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                            <img 
                                src="/images/hero.png" 
                                alt="Swot-HR Intelligence Dashboard" 
                                className="w-full object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#02040a] to-transparent" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] mb-4">ENGINEERED FOR EXCELLENCE</h2>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tight">Atomic Capabilities. Enterprise Scale.</h3>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-white/[0.04]"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                                    <feature.icon className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h4 className="text-xl font-bold mb-4 tracking-tight">{feature.title}</h4>
                                <p className="text-slate-500 font-medium leading-relaxed leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-5xl mx-auto text-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-600/10 blur-[120px] rounded-full" />
                    <div className="relative z-10 glass-card p-16 lg:p-24 rounded-[4rem] border border-white/5 overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                            <Globe className="w-40 h-40 text-white" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 max-w-2xl mx-auto">
                            Transform Your Organization Into an Intelligence Powerhouse.
                        </h2>
                        <p className="text-slate-400 text-lg font-medium mb-12 max-w-xl mx-auto">
                            Join hundreds of modern teams scaling their organizational excellence with Swot-HR.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <Link href="/register-company">
                                <Button className="h-16 px-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30">
                                    Onboard Your Company
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" className="h-16 px-12 border-white/10 hover:bg-white/5 text-white font-bold rounded-2xl text-[11px] uppercase tracking-[0.2em]">
                                    Log In Now
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tighter uppercase whitespace-nowrap">
                            Swot <span className="text-indigo-400">HR</span>
                        </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest text-center">
                        © 2026 Swot-HR Systems. Engineered for Tactical HR Excellence.
                    </div>
                    <div className="flex items-center gap-8">
                        <Link href="/login" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Client Terminal</Link>
                        <Link href="/register" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Join Personnel</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
