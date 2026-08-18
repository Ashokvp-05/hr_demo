"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Target,
    Award,
    BookOpen,
    CheckCircle2,
    Briefcase,
    Zap,
    Plus,
    Flame,
    Compass,
    Rocket,
    BrainCircuit,
    ChevronRight,
    Search,
    TrendingUp,
    Users
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export default function PerformancePage() {
    const { data: session } = useSession()
    const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
    const [isCareerDialogOpen, setIsCareerDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleCreateGoal = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        // Simulate API call
        setTimeout(() => {
            setLoading(false)
            setIsGoalDialogOpen(false)
            toast.success("OKR Created Successfully", {
                description: "Your new performance target has been registered in the system pulse.",
            })
        }, 1500)
    }

    const userName = session?.user?.name?.split(' ')[0] || "Employee"

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto">
            {/* HEADER WITH GLASS EFFECT */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-slate-900 dark:bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-indigo-500/20 transition-colors" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 uppercase tracking-widest text-[9px] font-bold">Performance Hub v1.0</Badge>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-bold uppercase text-emerald-500 tracking-tighter">Live Audit Active</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Growth Matrix</h1>
                    <p className="text-slate-400 font-medium max-w-md">Hello {userName}, analyze your professional evolution and set strategic milestones for the next quarter.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10 mt-4 md:mt-0">
                    <Dialog open={isCareerDialogOpen} onOpenChange={setIsCareerDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="h-12 border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-2xl gap-3 px-6 shadow-xl">
                                <Compass className="w-4 h-4 text-indigo-400" /> Professional Compass
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-slate-800 bg-slate-950 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                    <BrainCircuit className="w-6 h-6 text-indigo-500" /> Career Trajectory Audit
                                </DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Analyze your path from Senior Frontend to Engineering Lead.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Current Phase: Expansion</span>
                                        <span className="text-xs font-medium text-slate-500">75% Proficiency</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                        <motion.div initial={{ width: 0 }} animate={{ width: "75%" }} className="h-full bg-indigo-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <Award className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <p className="text-[10px] font-bold uppercase text-slate-500">Next Milestone</p>
                                        <p className="text-sm font-bold text-white leading-tight">System Design Certification</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                            <Rocket className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <p className="text-[10px] font-bold uppercase text-slate-500">Recommended Move</p>
                                        <p className="text-sm font-bold text-white leading-tight">Lead Infra Migration</p>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => setIsCareerDialogOpen(false)} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-widest">Acknowledge Insights</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl gap-3 px-6 shadow-xl shadow-indigo-600/20 border-none transition-all active:scale-95">
                                <Plus className="w-5 h-5" /> New Strategic OKR
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-slate-200 dark:border-slate-800 dark:bg-slate-950">
                            <form onSubmit={handleCreateGoal}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Deploy New Milestone</DialogTitle>
                                    <DialogDescription className="text-slate-500">
                                        Define your key results for the upcoming sprint.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-8">
                                    <div className="space-y-2">
                                        <Label htmlFor="goal" className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Objective Title</Label>
                                        <Input id="goal" placeholder="e.g., Performance Optimization" className="h-12 rounded-xl border-slate-200 dark:border-slate-800 px-4 focus:ring-2 focus:ring-indigo-500/20" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="deadline" className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Deadline</Label>
                                            <Input id="deadline" type="date" className="h-12 rounded-xl border-slate-200 dark:border-slate-800" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="priority" className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Priority</Label>
                                            <Select defaultValue="medium">
                                                <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800">
                                                    <SelectValue placeholder="Priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Standard</SelectItem>
                                                    <SelectItem value="medium">Critical</SelectItem>
                                                    <SelectItem value="high">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-widest transition-all">
                                        {loading ? "Synchronizing..." : "Initialize Goal"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* TOP METRICS GRID - PREMIUM STYLING */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: "Overall Rating", value: "4.8/5.0", trend: "Top 5% Performer", icon: Award, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-500/10", tag: "Exceeds Expectations" },
                    { title: "Review Status", value: "On Track", trend: "Cycle: Q1 2026", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", tag: "Due in 14d" },
                    { title: "Skill Growth", value: "+12%", trend: "vs Last Quarter", icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", tag: "2 New Certs" },
                    { title: "Intensity Score", value: "7.8/10", trend: "Consistency Over Time", icon: Flame, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10", tag: "Optimal Flow" },
                ].map((stat, i) => (
                    <Card key={i} className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bg} -mr-10 -mt-10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <CardContent className="p-0 relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`p-3 rounded-2xl ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <Badge variant="secondary" className={`text-[9px] font-bold uppercase tracking-widest ${stat.color} bg-white dark:bg-slate-800 border border-current opacity-60`}>{stat.tag}</Badge>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">{stat.title}</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-2 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-emerald-500" /> {stat.trend}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* MAIN CONTENT TABS */}
            <Tabs defaultValue="goals" className="w-full p-1 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                <TabsList className="h-16 w-full md:w-auto grid grid-cols-3 md:inline-flex bg-transparent gap-2 p-2">
                    <TabsTrigger value="goals" className="rounded-2xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 transition-all px-8">Goal Matrix</TabsTrigger>
                    <TabsTrigger value="skills" className="rounded-2xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 transition-all px-8">Skillsets</TabsTrigger>
                    <TabsTrigger value="feedback" className="rounded-2xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 transition-all px-8">Intelligence</TabsTrigger>
                </TabsList>

                <div className="p-6">
                    <TabsContent value="goals" className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Current OKRs */}
                            <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="bg-slate-50/50 dark:bg-black/20 p-8 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-bold flex items-center gap-3">
                                                <Target className="w-6 h-6 text-indigo-500" /> Active Strategic OKRs
                                            </CardTitle>
                                            <CardDescription className="font-medium">Quarterly Objectives & Key Results</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <span className="text-[10px] font-bold uppercase text-indigo-600">3 Active</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <GoalItem
                                        title="Infrastructure Core Upgrade"
                                        deadline="Mar 31, 2026"
                                        progress={75}
                                        status="On Track"
                                        color="bg-emerald-500"
                                    />
                                    <GoalItem
                                        title="Client Ecosystem Optimization"
                                        deadline="Feb 28, 2026"
                                        progress={40}
                                        status="At Risk"
                                        color="bg-amber-500"
                                    />
                                    <GoalItem
                                        title="Strategic Leadership Mentorship"
                                        deadline="Apr 15, 2026"
                                        progress={92}
                                        status="Exceptional"
                                        color="bg-indigo-500"
                                    />
                                </CardContent>
                            </Card>

                            {/* Recent Achievements */}
                            <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900">
                                <CardHeader className="p-8">
                                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                                        <Award className="w-6 h-6 text-amber-500" /> Operational Wins
                                    </CardTitle>
                                    <CardDescription className="font-medium">Significant milestones detected in audit.</CardDescription>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 space-y-4">
                                    <AchievementItem
                                        title="Multi-Factor Auth Protocol"
                                        date="Jan 15, 2026"
                                        desc="Directed successful deployment of security layer across all 12 modules."
                                        tag="High Impact"
                                        color="indigo"
                                    />
                                    <AchievementItem
                                        title="System Latency Reduction"
                                        date="Dec 20, 2025"
                                        desc="Optimized query architecture reducing response time by 450ms."
                                        tag="Engineering Excellence"
                                        color="emerald"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="skills" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <Card className="border border-slate-100 dark:border-slate-800 rounded-[2rem] bg-white dark:bg-slate-900 p-8">
                            <CardHeader className="p-0 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-2xl font-bold">Competency Spectrum</CardTitle>
                                    <CardDescription className="max-w-md font-medium">Audit of technical and leadership proficiencies based on project performance and peer reviews.</CardDescription>
                                </div>
                                <Button variant="ghost" className="text-indigo-600 font-bold gap-2 hover:bg-indigo-50 rounded-xl">
                                    Full Proficiency Audit <ChevronRight className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Technical Capability
                                    </h3>
                                    <div className="space-y-6">
                                        <SkillBar skill="React / Next.js Frameworks" level={95} color="bg-indigo-600" />
                                        <SkillBar skill="TypeScript & Static Analysis" level={90} color="bg-indigo-600" />
                                        <SkillBar skill="Node.js Microservices" level={75} color="bg-indigo-600" />
                                        <SkillBar skill="SecOps & Data Integrity" level={62} color="bg-rose-500" />
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-indigo-500" /> Executive Leadership
                                    </h3>
                                    <div className="space-y-6">
                                        <SkillBar skill="Peer Mentorship" level={85} color="bg-emerald-500" />
                                        <SkillBar skill="Operational Strategy" level={80} color="bg-emerald-500" />
                                        <SkillBar skill="Stakeholder Interface" level={70} color="bg-emerald-500" />
                                        <SkillBar skill="Conflict Resolution" level={55} color="bg-amber-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="feedback" className="animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-black/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6">
                                <Search className="w-8 h-8 text-indigo-500 opacity-40" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Ecosystem Feedback Pending</h3>
                            <p className="text-slate-500 font-medium text-center max-w-sm">Aggregating decentralized feedback nodes. Check back at the end of the sprint for the full 360° summary.</p>
                            <Button variant="outline" className="mt-8 rounded-xl font-bold border-indigo-500/30 text-indigo-600 hover:bg-indigo-50 px-8">Inquire Manual Pulse</Button>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function GoalItem({ title, deadline, progress, status, color }: any) {
    return (
        <div className="space-y-3 group cursor-pointer">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Deadline: {deadline}</p>
                </div>
                <Badge variant="outline" className={cn(
                    "text-[8px] font-bold tracking-[0.1em] px-2.5 py-1 rounded-lg border-current opacity-80",
                    status === "At Risk" ? "text-rose-600 bg-rose-50" :
                        status === "Exceptional" ? "text-indigo-600 bg-indigo-50" : "text-emerald-600 bg-emerald-50"
                )}>
                    {status}
                </Badge>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5 shadow-inner">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn("h-full rounded-full shadow-lg", color)}
                />
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                <span>Phase Progress</span>
                <span className="text-indigo-600 tabular-nums">{progress}% Completion</span>
            </div>
        </div>
    )
}

function AchievementItem({ title, date, desc, tag, color }: any) {
    return (
        <div className="flex gap-5 items-start p-6 bg-slate-50/50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800/50 hover:border-indigo-500/30 transition-all group">
            <div className={cn(
                "mt-0.5 h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner",
                color === 'indigo' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
            )}>
                <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-2">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:underline decoration-indigo-500 transition-all">{title}</h4>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{date}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
                <div className="inline-block px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[8px] font-bold uppercase tracking-widest text-slate-400">
                    {tag}
                </div>
            </div>
        </div>
    )
}

function SkillBar({ skill, level, color }: any) {
    return (
        <div className="space-y-2 group cursor-pointer">
            <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">{skill}</span>
                <span className="text-[10px] font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded tracking-tighter tabular-nums">{level}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${level}%` }}
                    transition={{ duration: 1.2, delay: 0.2 }}
                    className={cn("h-full", color || "bg-indigo-600")}
                />
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    const classes = inputs.filter(Boolean).join(" ")
    return classes
}
