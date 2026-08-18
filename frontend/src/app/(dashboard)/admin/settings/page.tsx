"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Settings, Shield, Building, Globe, Loader2, Save, Cpu, Zap, Activity } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { API_BASE_URL } from "@/lib/config"

export default function AdminSettingsPage() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const token = (session?.user as any)?.accessToken

    const [settings, setSettings] = useState<any>({
        companyName: "Rudratic",
        supportEmail: "support@rudratic.com",
        timezone: "Asia/Kolkata",
        allowRemoteClockIn: true,
        sessionTimeout: "24",
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (token) fetchSettings()
    }, [token])

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                if (Object.keys(data).length > 0) {
                    setSettings((prev: any) => ({ ...prev, ...data }))
                }
            }
        } catch (error) {
            console.error("Failed to fetch settings", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`${API_BASE_URL}/admin/settings`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            })

            if (res.ok) {
                toast({ title: "Success", description: "System configuration updated successfully" })
            } else {
                toast({ title: "Error", description: "Failed to update settings", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Network error", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Synchronizing system parameters...</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in duration-700">
            {/* Premium Multi-Layer Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase text-indigo-600">Core Configuration</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Global administrative flags and organizational master parameters.</p>
                    </div>
                </div>
                <div className="relative z-10">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-3 px-8 shadow-xl shadow-indigo-600/20 border-none font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Configuration
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden group hover:ring-2 hover:ring-indigo-500/20 transition-all">
                            <CardHeader className="p-8 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600">
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold uppercase tracking-tight">Organization</CardTitle>
                                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Identity & Branding</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Workspace Designation</Label>
                                    <Input
                                        className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                                        value={settings.companyName}
                                        onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Master Support Node</Label>
                                    <Input
                                        className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden group hover:ring-2 hover:ring-indigo-500/20 transition-all">
                            <CardHeader className="p-8 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold uppercase tracking-tight">Temporal</CardTitle>
                                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Regional Synchronization</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Temporal Offset (Timezone)</Label>
                                    <Input
                                        className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                                        value={settings.timezone}
                                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Session TTL (Hours)</Label>
                                    <Input
                                        className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                                        type="number"
                                        value={settings.sessionTimeout}
                                        onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden group hover:ring-2 hover:ring-indigo-500/20 transition-all">
                        <CardHeader className="p-8 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-600">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight">Governance</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Security & Operational Overrides</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-md">
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">Remote Authorization</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Allow personnel to clock-in via mobile nodes.</p>
                                </div>
                                <Button
                                    variant={settings.allowRemoteClockIn ? "default" : "outline"}
                                    className={`h-10 rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 ${settings.allowRemoteClockIn ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" : ""}`}
                                    onClick={() => setSettings({ ...settings, allowRemoteClockIn: !settings.allowRemoteClockIn })}
                                >
                                    {settings.allowRemoteClockIn ? "Active" : "Disabled"}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-md">
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white text-rose-600">Maintenance Protocol</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-rose-400/60">Restrict system access to ROOT only.</p>
                                </div>
                                <Button
                                    variant={settings.maintenanceMode ? "destructive" : "outline"}
                                    className={`h-10 rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 ${settings.maintenanceMode ? "shadow-lg shadow-rose-500/20 animate-pulse" : ""}`}
                                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                >
                                    {settings.maintenanceMode ? "OFFLINE" : "STABLE_LIVE"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <Card className="border-0 shadow-xl bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                            <Cpu className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-4">
                                <h4 className="text-xl font-bold uppercase tracking-tighter">System Nucleus</h4>
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-relaxed">Modification of these parameters will propagate across all terminal nodes instantly.</p>
                            </div>

                            <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">Consistency Health</p>
                                    <Activity className="w-3 h-3 text-emerald-500" />
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full w-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                </div>
                                <p className="text-[9px] font-bold uppercase text-white/40 mt-3 text-right">Data Integrity: 100%</p>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden group h-56 flex flex-col justify-end shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Zap className="w-24 h-24" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-2">Protocol Pulse</p>
                        <h4 className="text-xl font-bold uppercase leading-tight">System re-synchronization occurs on every configuration save.</h4>
                    </div>
                </div>
            </div>
        </div>
    )
}
