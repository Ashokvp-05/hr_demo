"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MapPin, Briefcase, Clock, PlayCircle, StopCircle } from "lucide-react"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { API_BASE_URL } from "@/lib/config"

export default function ClockWidget({ token, initialData }: { token: string, initialData?: any }) {
    const [loading, setLoading] = useState(!initialData)
    const [actionLoading, setActionLoading] = useState(false)
    const [activeEntry, setActiveEntry] = useState<any>(initialData || null)
    const [clockType, setClockType] = useState("IN_OFFICE")
    const [isOnCall, setIsOnCall] = useState(false)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [error, setError] = useState("")
    const [showOvertimeModal, setShowOvertimeModal] = useState(false)

    useEffect(() => {
        if (!initialData) {
            fetchActiveEntry()
        }
    }, [initialData])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (activeEntry && activeEntry.clockIn) {
            const startTime = new Date(activeEntry.clockIn).getTime()
            interval = setInterval(() => {
                setElapsedTime(Date.now() - startTime)
            }, 1000)
        } else {
            setElapsedTime(0)
        }
        return () => clearInterval(interval)
    }, [activeEntry])

    const fetchActiveEntry = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/time/active`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setActiveEntry(data) // null or object
            }
        } catch (err) {
            console.error("Failed to fetch active entry")
        } finally {
            setLoading(false)
        }
    }

    const handleClockIn = async () => {
        setError("")
        setActionLoading(true)
        try {
            let locationData = null
            if (clockType === "REMOTE") {
                if (!("geolocation" in navigator)) {
                    throw new Error("Geolocation is not supported by your browser");
                }

                try {
                    // 1. Proactively check if it's already denied
                    if ("permissions" in navigator) {
                        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                        if (status.state === 'denied') {
                            throw new Error("Location permission is BLOCKED. Click the lock icon in the address bar to unblock it.");
                        }
                    }

                    // 2. Request the position (This triggers the browser pop-up)
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 8000,
                            maximumAge: 0
                        });
                    });

                    locationData = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                } catch (geoErr: any) {
                    if (geoErr.code === 1) {
                        throw new Error("Please 'Allow' location access in the browser popup to clock in from home.");
                    } else if (geoErr.code === 2) {
                        throw new Error("Location positioning failed. Please check your GPS/Network.");
                    } else if (geoErr.code === 3) {
                        throw new Error("Location request timed out. Please try again.");
                    } else {
                        throw new Error(geoErr.message || "Could not verify location.");
                    }
                }
            }

            const res = await fetch(`${API_BASE_URL}/time/clock-in`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ type: clockType, location: locationData, isOnCall })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Clock in failed")
            }

            const data = await res.json()
            setActiveEntry(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    const handleClockOutClick = () => {
        if (elapsedTime > 43200000) {
            setShowOvertimeModal(true)
        } else {
            handleClockOut()
        }
    }

    const handleClockOut = async () => {
        setError("")
        setActionLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/time/clock-out`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Clock out failed")
            }

            setActiveEntry(null)
            setShowOvertimeModal(false)
        } catch (err: any) {
            setError(err.message)
            setShowOvertimeModal(false)
        } finally {
            setActionLoading(false)
        }
    }

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    if (loading) {
        return (
            <div className="w-full animate-pulse space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col h-full justify-between">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" /> Time Tracker
                    </h3>
                    {activeEntry && (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-semibold">Active</span>
                        </div>
                    )}
                </div>

                {/* Timer Display */}
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                    {error && <Alert variant="destructive" className="mb-4 py-2 text-xs font-semibold rounded-lg"><AlertDescription>{error}</AlertDescription></Alert>}

                    {activeEntry ? (
                        <div className="text-center space-y-1">
                            <div className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                                {formatTime(elapsedTime)}
                            </div>
                            <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500">
                                {activeEntry.clockType === 'REMOTE' ? <MapPin className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                                {activeEntry.clockType === 'REMOTE' ? 'Remote' : 'Office'}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full space-y-6">
                            <div className="text-center">
                                <span className="text-5xl font-bold text-slate-300 dark:text-slate-700 tracking-tight select-none">00:00:00</span>
                            </div>

                            {/* Clean Segmented Control */}
                            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${clockType === 'IN_OFFICE' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setClockType('IN_OFFICE')}
                                >
                                    <Briefcase className="w-3.5 h-3.5" /> Office
                                </button>
                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${clockType === 'REMOTE' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setClockType('REMOTE')}
                                >
                                    <MapPin className="w-3.5 h-3.5" /> Remote
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6">
                    {activeEntry ? (
                        <Button
                            variant="destructive"
                            className="w-full h-12 rounded-xl bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-sm text-sm font-bold active:scale-[0.98] transition-all"
                            onClick={handleClockOutClick}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <StopCircle className="w-5 h-5 mr-2" />}
                            Clock Out
                        </Button>
                    ) : (
                        <Button
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all"
                            onClick={handleClockIn}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <span className="flex items-center">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Clock In <PlayCircle className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <AlertDialog open={showOvertimeModal} onOpenChange={setShowOvertimeModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Update Overtime</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have exceeded standard hours. Confirm to log this session?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleClockOut} className="w-full bg-indigo-600 hover:bg-black text-white h-12 rounded-xl font-bold transition-all active:scale-95">
                            Confirm Session End
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
