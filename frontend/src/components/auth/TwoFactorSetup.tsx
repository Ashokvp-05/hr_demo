"use client"

import { useState } from "react"
import { ShieldCheck, Loader2, QrCode, Key, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"

export function TwoFactorSetup({ token, onComplete }: { token: string, onComplete?: () => void }) {
    const [step, setStep] = useState<'INITIAL' | 'QR' | 'VERIFY' | 'SUCCESS'>('INITIAL')
    const [loading, setLoading] = useState(false)
    const [qrData, setQrData] = useState<{ qrCode: string, secret: string } | null>(null)
    const [code, setCode] = useState("")

    const handleStartSetup = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/auth/2fa/setup`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setQrData(data)
                setStep('QR')
            } else {
                toast.error("Failed to initiate 2FA protocol")
            }
        } catch (e) {
            toast.error("Network synchronization failure")
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async () => {
        if (code.length !== 6) return
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/auth/2fa/activate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            })
            if (res.ok) {
                setStep('SUCCESS')
                toast.success("Identity Matrix Secured")
                if (onComplete) onComplete()
            } else {
                toast.error("invalid verification code")
            }
        } catch (e) {
            toast.error("Verification failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-none shadow-2xl shadow-indigo-500/10 bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden max-w-md mx-auto">
            <CardHeader className="p-8 text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-indigo-600" />
                </div>
                <CardTitle className="text-2xl font-bold">2FA Security Protocol</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
                    Mandated Multi-Factor Authentication
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
                {step === 'INITIAL' && (
                    <div className="space-y-6 text-center">
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Protect your account with TOTP (Time-based One-Time Password). This adds an extra layer of security beyond your password.
                        </p>
                        <Button
                            onClick={handleStartSetup}
                            disabled={loading}
                            className="w-full h-12 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initiate Setup"}
                        </Button>
                    </div>
                )}

                {step === 'QR' && qrData && (
                    <div className="space-y-6 text-center">
                        <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 inline-block shadow-inner">
                            <img src={qrData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                        </div>
                        <div className="space-y-2 text-left">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Manual Entry Key</p>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg font-mono text-xs font-bold break-all border border-slate-100 dark:border-white/5 select-all">
                                {qrData.secret}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 font-bold">
                            Scan this code with Google Authenticator or Microsoft Authenticator, then click continue.
                        </p>
                        <Button
                            onClick={() => setStep('VERIFY')}
                            className="w-full h-12 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all"
                        >
                            Establish Handshake
                        </Button>
                    </div>
                )}

                {step === 'VERIFY' && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Verification Code</Label>
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="h-14 text-center text-2xl font-bold tracking-[0.5em] rounded-xl border-slate-100 bg-slate-50 dark:bg-slate-800"
                            />
                        </div>
                        <Button
                            onClick={handleVerify}
                            disabled={loading || code.length !== 6}
                            className="w-full h-14 bg-indigo-600 hover:bg-black text-white font-bold uppercase tracking-widest text-xs"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                        </Button>
                        <button onClick={() => setStep('QR')} className="w-full text-[10px] font-bold uppercase text-slate-400 hover:text-indigo-600 transition-colors">
                            Back to QR Code
                        </button>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Account Secured</h3>
                            <p className="text-sm text-slate-500 font-medium">Your Multi-Factor Identity Matrix is now active.</p>
                        </div>
                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                        >
                            Return to Dashboard
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <label className={`block ${className}`}>{children}</label>
}
