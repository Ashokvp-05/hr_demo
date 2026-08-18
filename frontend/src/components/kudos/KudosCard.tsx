import { motion } from "framer-motion"
import { Trophy, Star, ThumbsUp, Medal, Sparkles, User, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Kudos {
    id: string
    message: string
    category: string
    createdAt: string
    fromUser: {
        name: string
        avatarUrl: string | null
    }
    toUser: {
        name: string
        avatarUrl: string | null
    }
}

const categoryConfig: Record<string, { icon: any, color: string, bg: string }> = {
    "TEAMWORK": { icon: ThumbsUp, color: "text-blue-600", bg: "bg-blue-50" },
    "EXCELLENCE": { icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50" },
    "LEADERSHIP": { icon: Medal, color: "text-orange-600", bg: "bg-orange-50" },
    "INNOVATION": { icon: Star, color: "text-pink-600", bg: "bg-pink-50" },
    "RELIABILITY": { icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" }
}

export function KudosCard({ kudos }: { kudos: Kudos }) {
    const config = categoryConfig[kudos.category.toUpperCase()] || categoryConfig["TEAMWORK"]
    const Icon = config.icon

    return (
        <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <Badge variant="outline" className={cn("gap-1.5 border-none font-bold text-[10px] uppercase tracking-wider px-2.5 py-1", config.bg, config.color)}>
                        <Icon className="w-3 h-3" />
                        {kudos.category}
                    </Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                        {new Date(kudos.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center -space-x-3">
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-900 shadow-sm ring-1 ring-border">
                            {kudos.fromUser.avatarUrl && <AvatarImage src={kudos.fromUser.avatarUrl} />}
                            <AvatarFallback className="text-xs font-bold bg-slate-100">{kudos.fromUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm ring-1 ring-border relative z-10">
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-900 shadow-sm ring-1 ring-border">
                            {kudos.toUser.avatarUrl && <AvatarImage src={kudos.toUser.avatarUrl} />}
                            <AvatarFallback className="text-xs font-bold bg-slate-100">{kudos.toUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-sm font-bold leading-none">{kudos.toUser.name}</p>
                        <p className="text-[10px] font-medium text-muted-foreground">Recognized by {kudos.fromUser.name}</p>
                    </div>
                </div>

                <div className="relative">
                    <span className="absolute -top-2 -left-2 text-4xl text-primary/10 font-serif leading-none">“</span>
                    <p className="text-sm text-foreground/80 leading-relaxed pl-3">
                        {kudos.message}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
