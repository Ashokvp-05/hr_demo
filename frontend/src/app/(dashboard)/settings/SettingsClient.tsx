"use client"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Settings, Shield, Bell, UserCog, Lock, Laptop, Globe, Zap, Smartphone, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/config"
import { cn } from "@/lib/utils"

export default function SettingsClient({ session }: { session: any }) {
    const { toast } = useToast()
    const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" })
    const [passLoading, setPassLoading] = useState(false)
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [timezone, setTimezone] = useState("UTC+5:30")
    const [language, setLanguage] = useState("English (US)")
    const [is24Hour, setIs24Hour] = useState(true)
    const [privacyShield, setPrivacyShield] = useState(true)

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordData.new !== passwordData.confirm) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
            return
        }

        setPassLoading(true)
        try {
            const token = (session?.user as any)?.accessToken
            const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.current,
                    newPassword: passwordData.new
                })
            })

            const data = await res.json()
            if (res.ok) {
                toast({ title: "Success", description: "Password updated successfully" })
                setPasswordData({ current: "", new: "", confirm: "" })
            } else {
                toast({ title: "Error", description: data.error || "Failed to update password", variant: "destructive" })
            }
        } catch (e) {
            toast({ title: "Error", description: "Network error", variant: "destructive" })
        } finally {
            setPassLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-500">
            {/* Minimal Header */}
            <div className="mb-12">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Settings</h1>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Personalize your Swot-HR Experience</p>
            </div>

            <Tabs defaultValue="preferences" className="w-full">
                <TabsList className="flex w-full justify-start h-auto bg-transparent border-b border-slate-100 dark:border-slate-800 rounded-none p-0 mb-10 gap-8">
                    <TabsTrigger value="preferences" className="rounded-none border-b-2 border-transparent px-0 pb-3 h-auto font-bold uppercase text-[10px] tracking-widest data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 bg-transparent shadow-none hover:text-slate-900 transition-all">
                        Preferences
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent px-0 pb-3 h-auto font-bold uppercase text-[10px] tracking-widest data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 bg-transparent shadow-none hover:text-slate-900 transition-all">
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent px-0 pb-3 h-auto font-bold uppercase text-[10px] tracking-widest data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 bg-transparent shadow-none hover:text-slate-900 transition-all">
                        Notifications
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="preferences" className="space-y-8">

                    <section className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Regional Infrastructure</h3>
                            <p className="text-xs text-slate-400 font-medium tracking-tight">Configure your local synchronization and regional standards.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Timezone</Label>
                                <Select value={timezone} onValueChange={setTimezone}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold px-4">
                                        <Globe className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100">
                                        <SelectItem value="UTC+5:30" className="font-bold">India (IST) UTC+5:30</SelectItem>
                                        <SelectItem value="UTC+0:00" className="font-bold">Universal (UTC) UTC+0:00</SelectItem>
                                        <SelectItem value="UTC-5:00" className="font-bold">New York (EST) UTC-5:00</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">System Language</Label>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold px-4">
                                        <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center mr-2 text-[8px]">🇺🇸</div>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100">
                                        <SelectItem value="English (US)" className="font-bold">English (US)</SelectItem>
                                        <SelectItem value="English (UK)" className="font-bold">English (UK)</SelectItem>
                                        <SelectItem value="German" className="font-bold">German (DE)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                <div className="space-y-1">
                                    <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">24-Hour Chronometer</Label>
                                    <p className="text-[11px] text-slate-400 font-medium">Use military-style time formatting across the system.</p>
                                </div>
                                <Switch checked={is24Hour} onCheckedChange={setIs24Hour} />
                            </div>
                            <div className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                <div className="space-y-1">
                                    <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">Personnel Privacy Shield</Label>
                                    <p className="text-[11px] text-slate-400 font-medium">Auto-mask sensitive IDs (Aadhaar, PAN, SSN) while in common areas.</p>
                                </div>
                                <Switch checked={privacyShield} onCheckedChange={setPrivacyShield} />
                            </div>
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="security" className="space-y-8">
                    <section className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Credentials Update</h3>
                            <p className="text-xs text-slate-400 font-medium tracking-tight">Rotate your authentication keys for maximum security.</p>
                        </div>

                        <form onSubmit={handlePasswordChange} className="max-w-xl space-y-5 p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Existing Password</Label>
                                <Input
                                    type="password"
                                    className="h-12 px-5 rounded-xl border-slate-100 bg-slate-50/50 font-bold"
                                    value={passwordData.current}
                                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">New Secret</Label>
                                    <Input
                                        type="password"
                                        className="h-12 px-5 rounded-xl border-slate-100 bg-white font-bold"
                                        value={passwordData.new}
                                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verify Secret</Label>
                                    <Input
                                        type="password"
                                        className="h-12 px-5 rounded-xl border-slate-100 bg-white font-bold"
                                        value={passwordData.confirm}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={passLoading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 mt-4 transition-all active:scale-95">
                                {passLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-3.5 h-3.5 mr-2" />}
                                Sync New Cipher
                            </Button>
                        </form>
                    </section>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-8">
                    <section className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">System Intel</h3>
                            <p className="text-xs text-slate-400 font-medium tracking-tight">Configure the frequency of automated system notifications.</p>
                        </div>

                        <div className="grid gap-4 max-w-2xl">
                            {[
                                { label: "Work Cycle Reminders", desc: "Sent at start/end of business day.", icon: Clock },
                                { label: "Security & Governance", desc: "Critical alerts for access and compliance.", icon: Shield },
                                { label: "Departmental Broadcasts", desc: "Official updates from management.", icon: Bell }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all group">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <item.icon className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.label}</Label>
                                            <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            ))}
                        </div>
                    </section>
                </TabsContent>
            </Tabs>
        </div>
    )
}
