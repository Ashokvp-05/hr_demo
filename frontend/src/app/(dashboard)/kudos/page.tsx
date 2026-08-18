import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { KudosCard } from "@/components/kudos/KudosCard"
import GiveKudosModal from "@/components/kudos/GiveKudosModal"
import { Trophy, Star, Sparkles } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

export default async function KudosPage() {
    const session = await auth()
    if (!session) redirect("/login")

    const token = (session.user as any)?.accessToken || ""

    // Fetch Kudos and Users
    let kudosList = []
    let users = []

    try {
        const [kudosRes, usersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/kudos`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
            fetch(`${API_BASE_URL}/users`, { headers: { Authorization: `Bearer ${token}` } })
        ])

        if (kudosRes.ok) {
            const data = await kudosRes.json()
            kudosList = Array.isArray(data) ? data : (data.kudos || [])
        }
        if (usersRes.ok) {
            const data = await usersRes.json()
            users = Array.isArray(data) ? data : (data.users || [])
        }
    } catch (e) {
        console.error("Failed to fetch kudos data")
    }

    return (
        <div className="p-6 max-w-[1920px] mx-auto min-h-screen space-y-8">

            {/* HER0 HEADER */}
            <div className="relative rounded-[2.5rem] bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-800 p-8 md:p-12 overflow-hidden shadow-2xl shadow-indigo-500/20 text-white">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-32 -mt-32 blur-[100px] animate-pulse" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-2 text-indigo-100 font-medium tracking-wide text-sm uppercase">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span>Employee Recognition Program</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight leading-tight">
                            The Wall of Fame <br />
                            <span className="text-white/50">Celebrating Excellence.</span>
                        </h1>
                        <p className="text-lg text-indigo-100/80 leading-relaxed max-w-xl">
                            Recognize your colleagues for their hard work, creativity, and dedication. A little appreciation goes a long way.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <GiveKudosModal token={token} users={users} />
                    </div>
                </div>
            </div>

            {/* KUDOS GRID */}
            {kudosList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {kudosList.map((kudos: any) => (
                        <KudosCard key={kudos.id} kudos={kudos} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-full mb-4">
                        <Sparkles className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No kudos yet</h3>
                    <p className="text-slate-500 mt-2">Be the first to recognize a colleague!</p>
                </div>
            )}
        </div>
    )
}
