"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Activity,
    ArrowUpRight,
    Binary,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    CircleUser,
    Clock,
    Database,
    Eye,
    EyeOff,
    Fingerprint,
    Hash,
    KeyRound,
    LayoutDashboard,
    Loader2,
    Lock,
    LogOut,
    Mail,
    MapPin,
    MapPinned,
    MessageSquare,
    Phone,
    Save,
    Shield,
    ShieldCheck,
    Smartphone,
    Stethoscope,
    Upload,
    Globe2,
    CreditCard,
    User,
    UserCircle,
} from "lucide-react"
import { format, startOfWeek, endOfWeek } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import EmployeeDocumentVault from "@/components/dashboard/EmployeeDocumentVault"

const profileSchema = z.object({
    // 1. Personal
    name: z.string().min(2, "Full Name must be at least 2 characters.").max(80, "Name too long."),
    gender: z.string().optional(),
    dob: z.string()
        .optional()
        .refine(val => {
            if (!val || val === "") return true;
            const d = new Date(val);
            if (isNaN(d.getTime())) return false;
            const year = d.getFullYear();
            return year >= 1900 && year <= new Date().getFullYear() - 16;
        }, "Enter a valid date of birth (must be a real past date)."),
    maritalStatus: z.string().optional(),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    bloodGroup: z.string().regex(/^(A|B|AB|O)[+-]$/, "Enter a valid blood group (e.g. O+, AB-)").optional().or(z.literal("")),

    // 2. Contact
    email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid work email (e.g. name@company.com)."),
    personalEmail: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid personal email (e.g. name@gmail.com).").optional().or(z.literal("")),
    phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits (e.g. 9876543210)."),
    secondaryPhone: z.string().regex(/^\d{10}$/, "Secondary phone must be exactly 10 digits.").optional().or(z.literal("")),
    workPhone: z.string().regex(/^\d{10}$/, "Work phone must be exactly 10 digits.").optional().or(z.literal("")),
    discordId: z.string().optional(),

    // 3. Emergency
    emergencyName: z.string().optional(),
    emergencyRelationship: z.string().optional(),
    emergencyPhone: z.string().regex(/^\d{10}$/, "Emergency phone must be exactly 10 digits.").optional().or(z.literal("")),
    emergencyPhoneSec: z.string().regex(/^\d{10}$/, "Must be exactly 10 digits.").optional().or(z.literal("")),
    emergencyAddress: z.string().optional(),

    // 4. Address
    currentAddress: z.string().optional(),
    permanentAddress: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default("India"),
    zipCode: z.string().regex(/^\d{5,10}$/, "Invalid ZIP/Pincode (5-10 digits).").optional().or(z.literal("")),

    // 5. Job & Identity
    employeeId: z.string().optional(),
    employmentType: z.string().optional(),
    workLocation: z.string().optional(),
    aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits.").optional().or(z.literal("")),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format (e.g. ABCDE1234F).").optional().or(z.literal("")),
    passportNumber: z.string().regex(/^[A-Z]{1}[0-9]{7}$/, "Invalid Passport format (e.g. A1234567).").optional().or(z.literal("")),
    drivingLicense: z.string().regex(/^[A-Z]{2}[0-9]{13}$/, "Invalid DL format (e.g. DL1234567890123).").optional().or(z.literal("")),
})

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export default function ProfilePage() {
    const { data: session, update } = useSession()
    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(true)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [mount, setMount] = useState(false)

    // Autosave state
    const [activeTab, setActiveTab] = useState("personal")
    const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
    const isInitialLoad = useRef(true)

    // Attendance state
    const [clockType, setClockType] = useState<"IN_OFFICE" | "REMOTE">("IN_OFFICE")
    const [activeEntry, setActiveEntry] = useState<any>(null)
    const [clockLoading, setClockLoading] = useState(false)

    const [userData, setUserData] = useState<any>(null)
    const [weeklyHours, setWeeklyHours] = useState("0.00")
    const [documents, setDocuments] = useState<any[]>([])
    const [docLoading, setDocLoading] = useState(false)
    
    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema) as any,
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            discordId: "",
            gender: "",
            dob: "",
            maritalStatus: "",
            fatherName: "",
            motherName: "",
            bloodGroup: "",
            personalEmail: "",
            secondaryPhone: "",
            workPhone: "",
            emergencyName: "",
            emergencyRelationship: "",
            emergencyPhone: "",
            emergencyPhoneSec: "",
            emergencyAddress: "",
            currentAddress: "",
            permanentAddress: "",
            city: "",
            state: "",
            country: "India",
            zipCode: "",
            employeeId: "",
            employmentType: "FULL_TIME",
            workLocation: "",
            aadhaarNumber: "",
            panNumber: "",
            passportNumber: "",
            drivingLicense: ""
        },
    })

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    })

    useEffect(() => {
        const fetchUserData = async () => {
            const token = (session?.user as any)?.accessToken
            const userId = (session?.user as any)?.id
            
            if (!token) {
                // If we've been trying to load for a while and still no token, stop the spinner
                // though usually the layout redirect will catch this
                if (session === undefined) return; // Still loading session
                setFetchLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setUserData(data)
                    const p = data.profile || {}
                    form.reset({
                        name: data.name || "",
                        email: data.email || "",
                        phone: data.phone || "",
                        discordId: data.discordId || "",
                        employeeId: p.employeeId || "",
                        gender: p.gender || "",
                        dob: p.dob ? format(new Date(p.dob), "yyyy-MM-dd") : "",
                        maritalStatus: p.maritalStatus || "",
                        fatherName: p.fatherName || "",
                        motherName: p.motherName || "",
                        bloodGroup: p.bloodGroup || "",
                        personalEmail: p.personalEmail || "",
                        secondaryPhone: p.secondaryPhone || "",
                        workPhone: p.workPhone || "",
                        emergencyName: p.emergencyName || "",
                        emergencyRelationship: p.emergencyRelationship || "",
                        emergencyPhone: p.emergencyPhone || "",
                        emergencyPhoneSec: p.emergencyPhoneSec || "",
                        emergencyAddress: p.emergencyAddress || "",
                        currentAddress: p.currentAddress || "",
                        permanentAddress: p.permanentAddress || "",
                        city: p.city || "",
                        state: p.state || "",
                        country: p.country || "India",
                        zipCode: p.zipCode || "",
                        employmentType: p.employmentType || "FULL_TIME",
                        workLocation: p.workLocation || "",
                        aadhaarNumber: p.aadhaarNumber || "",
                        panNumber: p.panNumber || "",
                        passportNumber: p.passportNumber || "",
                        drivingLicense: p.drivingLicense || ""
                    })
                }

                // Fetch Weekly Hours
                const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
                const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
                const reportRes = await fetch(`${API_BASE_URL}/reports/attendance?start=${start}&end=${end}&userId=${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (reportRes.ok) {
                    const reportData = await reportRes.json()
                    const total = Array.isArray(reportData)
                        ? reportData.reduce((acc: number, curr: any) => acc + (Number(curr.hoursWorked) || 0), 0)
                        : 0
                    setWeeklyHours(total.toFixed(2))
                }

                // Fetch Documents
                fetchDocuments()

            } catch (e) {
                console.error("Failed to load profile", e)
            } finally {
                setFetchLoading(false)
            }
        }
        fetchUserData()
        fetchActiveAttendance()
        setMount(true)
    }, [session, form])

    const fetchDocuments = async () => {
        try {
            const token = (session?.user as any)?.accessToken
            if (!token) return
            const res = await fetch(`${API_BASE_URL}/profile/documents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setDocuments(data)
            }
        } catch (err) {
            console.error("Failed to fetch docs:", err)
        }
    }

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setDocLoading(true)

        const reader = new FileReader()
        reader.onloadend = async () => {
            const base64 = reader.result as string
            try {
                const token = (session?.user as any)?.accessToken
                const res = await fetch(`${API_BASE_URL}/profile/documents`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: file.name,
                        type: file.type || 'Other',
                        fileUrl: base64
                    })
                })
                if (res.ok) {
                    toast.success("Document uploaded successfully")
                    fetchDocuments()
                } else {
                    toast.error("Upload failed")
                }
            } catch (err) {
                toast.error("An error occurred during upload")
            } finally {
                setDocLoading(false)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleDeleteDocument = async (id: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return
        try {
            const token = (session?.user as any)?.accessToken
            const res = await fetch(`${API_BASE_URL}/profile/documents/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                toast.success("Document deleted")
                fetchDocuments()
            }
        } catch (err) {
            toast.error("Failed to delete document")
        }
    }

    const fetchActiveAttendance = async () => {
        try {
            const token = (session?.user as any)?.accessToken
            if (!token) return
            const res = await fetch(`${API_BASE_URL}/time/active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setActiveEntry(data)
            }
        } catch (err) {
            console.error("Failed to fetch attendance:", err)
        }
    }

    const handleClockAction = async () => {
        setClockLoading(true)
        const token = (session?.user as any)?.accessToken
        if (!token) {
            toast.error("Authentication token missing.")
            setClockLoading(false)
            return
        }
        
        try {
            if (activeEntry) {
                // Clock Out
                const res = await fetch(`${API_BASE_URL}/time/clock-out`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    setActiveEntry(null)
                    toast.success("Clocked out successfully")
                } else {
                    const data = await res.json()
                    toast.error(data.error || "Failed to clock out")
                }
            } else {
                // Clock In
                // 1. Get Location
                let locationObj = null
                try {
                    const position: any = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
                    })
                    locationObj = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    }
                } catch (geoErr) {
                    console.warn("Location access denied or failed", geoErr)
                    toast.info("Clocking in without location data (denied/unavailable)")
                }

                // 2. API Call
                const res = await fetch(`${API_BASE_URL}/time/clock-in`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        type: clockType,
                        location: locationObj
                    })
                })

                if (res.ok) {
                    const data = await res.json()
                    setActiveEntry(data)
                    toast.success(`Clocked in as ${clockType}`)
                } else {
                    const data = await res.json()
                    toast.error(data.error || "Failed to clock in")
                }
            }
        } catch (err) {
            toast.error("An error occurred")
        } finally {
            setClockLoading(false)
        }
    }

    async function saveProfile(data: z.infer<typeof profileSchema>, silent = false) {
        if (!silent) setLoading(true)
        if (silent) setAutoSaveStatus("saving")
        try {
            const token = (session?.user as any)?.accessToken
            
            const res = await fetch(`${API_BASE_URL}/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Failed to update")
            }

            const updatedUser = await res.json()
            setUserData(updatedUser)

            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: data.name,
                    email: data.email
                }
            })

            if (silent) {
                setAutoSaveStatus("saved")
                setTimeout(() => setAutoSaveStatus("idle"), 2500)
            } else {
                toast.success("Personnel identity saved successfully")
            }
        } catch (error: any) {
            if (silent) {
                setAutoSaveStatus("error")
                setTimeout(() => setAutoSaveStatus("idle"), 3000)
            } else {
                toast.error(error.message || "Registry update failed - Connection unstable")
            }
        } finally {
            setLoading(false)
        }
    }

    async function onSubmit(data: z.infer<typeof profileSchema>) {
        return saveProfile(data, false)
    }

    // Autosave: watch all form fields and debounce save
    useEffect(() => {
        const subscription = form.watch(() => {
            // Skip autosave during initial form population
            if (isInitialLoad.current) return

            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
            autoSaveTimer.current = setTimeout(async () => {
                const isValid = await form.trigger()
                if (isValid) {
                    const values = form.getValues()
                    saveProfile(values, true)
                }
            }, 1500)
        })
        return () => {
            subscription.unsubscribe()
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form, session])

    // Mark initial load complete after form is populated
    useEffect(() => {
        if (!fetchLoading && userData) {
            // Small delay to let form.reset() settle before enabling autosave
            const t = setTimeout(() => { isInitialLoad.current = false }, 500)
            return () => clearTimeout(t)
        }
    }, [fetchLoading, userData])

    async function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
        setPasswordLoading(true)
        try {
            const token = (session?.user as any)?.accessToken
            const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword
                })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Security breach prevention active")

            toast.success("Security credentials updated")
            setIsPasswordModalOpen(false)
            passwordForm.reset()
        } catch (error: any) {
            toast.error(error.message || "Credential update rejected.")
        } finally {
            setPasswordLoading(false)
        }
    }

    if (!mount) return null

    const initial = userData?.name?.charAt(0).toUpperCase() || "U"
    const roleName = typeof userData?.role === 'object' ? userData.role.name : (userData?.role || "EMPLOYEE")
    const joinedDate = userData?.joiningDate ? format(new Date(userData.joiningDate), "MMM yyyy") : "Jan 2026"

    return (
        <div className="flex-1 min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-6 lg:p-8 animate-in fade-in duration-500 overflow-y-auto">
            {/* Floating Autosave Status Indicator */}
            {autoSaveStatus !== "idle" && (
                <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border backdrop-blur-sm text-xs font-bold uppercase tracking-widest transition-all ${
                        autoSaveStatus === "saving"
                            ? "bg-indigo-50/90 border-indigo-200 text-indigo-600"
                            : autoSaveStatus === "saved"
                            ? "bg-emerald-50/90 border-emerald-200 text-emerald-600"
                            : "bg-red-50/90 border-red-200 text-red-600"
                    }`}>
                        {autoSaveStatus === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {autoSaveStatus === "saved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {autoSaveStatus === "error" && <Activity className="w-3.5 h-3.5" />}
                        {autoSaveStatus === "saving" ? "Saving..." : autoSaveStatus === "saved" ? "All changes saved" : "Save failed"}
                    </div>
                </div>
            )}
            <div className="max-w-[1240px] h-full mx-auto space-y-6">

                {/* COMPACT PREMIUM PROFILE HEADER */}
                <div className="relative flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-6">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                            <Avatar className="h-20 w-20 border-[4px] border-white dark:border-slate-900 shadow-xl items-center justify-center bg-slate-100 dark:bg-slate-800 transition-transform group-hover:scale-105">
                                <AvatarImage src={userData?.avatarUrl || (session?.user as any)?.image} className="object-cover" />
                                <AvatarFallback className="text-3xl font-bold text-slate-300 dark:text-slate-600 font-mono">
                                    {fetchLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : initial}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-lg shadow-md z-10">
                                <ShieldCheck className="w-3 h-3" />
                            </div>
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    if (file.size > 5 * 1024 * 1024) {
                                        toast.error("Image too large (max 5MB)")
                                        return
                                    }
                                    const reader = new FileReader()
                                    reader.onloadend = async () => {
                                        const base64 = reader.result as string
                                        try {
                                            const token = (session?.user as any)?.accessToken
                                            const res = await fetch(`${API_BASE_URL}/profile/avatar`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    Authorization: `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ avatarUrl: base64 })
                                            })
                                            if (res.ok) {
                                                const data = await res.json()
                                                setUserData({ ...userData, avatarUrl: data.avatarUrl })
                                                await update({ ...session, user: { ...session?.user, image: data.avatarUrl } })
                                                toast.success("Avatar updated")
                                            }
                                        } catch (err) {
                                            toast.error("Failed to update avatar")
                                        }
                                    }
                                    reader.readAsDataURL(file)
                                }}
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight leading-none">
                                    {userData?.name || <Skeleton className="h-6 w-48" />}
                                </h1>
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-2.5 py-0.5 font-bold uppercase tracking-[0.1em] text-[9px]">
                                    Verified
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Briefcase className="w-3 h-3 text-indigo-500" /> {roleName}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-indigo-500" /> Joined {joinedDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                        <Fingerprint className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hash 0x{userData?.id?.slice(-8) || "88C22BFA"}</span>
                    </div>
                </div>

                {/* SINGLE VIEW ADAPTIVE GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT CONTENT: IDENTITY FORM (MORE COMPACT) */}
                    <div className="lg:col-span-8">
                        <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="bg-slate-50/30 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/50 py-5 px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                            <CircleUser className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Personal Details</CardTitle>
                                            <CardDescription className="text-[10px] font-medium text-muted-foreground">Manage your official contact information and identifiers.</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Sync</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                  <Form {...form}>
                                     <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                                         const fieldToTabMap: Record<string, string> = {
                                             name: "personal", gender: "personal", dob: "personal", maritalStatus: "personal", fatherName: "personal", motherName: "personal", bloodGroup: "personal",
                                             email: "contact", personalEmail: "contact", phone: "contact", secondaryPhone: "contact", workPhone: "contact", discordId: "contact",
                                             emergencyName: "emergency", emergencyRelationship: "emergency", emergencyPhone: "emergency", emergencyPhoneSec: "emergency", emergencyAddress: "emergency",
                                             currentAddress: "address", permanentAddress: "address", city: "address", state: "address", country: "address", zipCode: "address",
                                             employeeId: "job", employmentType: "job", workLocation: "job",
                                             aadhaarNumber: "identity", panNumber: "identity", passportNumber: "identity", drivingLicense: "identity"
                                         };
                                         const errorKeys = Object.keys(errors);
                                         if (errorKeys.length > 0) {
                                             const firstErrorKey = errorKeys[0];
                                             const targetTab = fieldToTabMap[firstErrorKey];
                                             if (targetTab) {
                                                 setActiveTab(targetTab);
                                             }
                                             const firstErrorMessage = (errors as any)[firstErrorKey]?.message || "Validation failed";
                                             toast.error(`Validation error in ${targetTab?.toUpperCase()} tab: ${firstErrorMessage}`);
                                         } else {
                                             toast.error("Validation failed. Please check all fields.");
                                         }
                                     })} className="space-y-6">
                                         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                             <TabsList className="w-full justify-start h-12 bg-slate-50 dark:bg-slate-800/50 p-1 mb-8 overflow-x-auto no-scrollbar">
                                                 <TabsTrigger value="personal" className="relative px-5 h-10 text-[11px] font-bold uppercase tracking-widest leading-none gap-2 data-[state=active]:text-indigo-600 transition-all duration-300 group overflow-hidden">
                                                     <User className="w-3 h-3 group-data-[state=active]:scale-110 transition-transform" /> Personal
                                                     <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 translate-y-full data-[state=active]:translate-y-0 transition-transform duration-300" />
                                                 </TabsTrigger>
                                                 <TabsTrigger value="contact" className="relative px-5 h-10 text-[11px] font-bold uppercase tracking-widest leading-none gap-2 data-[state=active]:text-indigo-600 transition-all duration-300 group overflow-hidden">
                                                     <Phone className="w-3 h-3 group-data-[state=active]:scale-110 transition-transform" /> Contact
                                                     <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 translate-y-full data-[state=active]:translate-y-0 transition-transform duration-300" />
                                                 </TabsTrigger>
                                                 <TabsTrigger value="emergency" className="relative px-5 h-10 text-[11px] font-bold uppercase tracking-widest leading-none gap-2 data-[state=active]:text-indigo-600 transition-all duration-300 group overflow-hidden">
                                                     <Stethoscope className="w-3 h-3 group-data-[state=active]:scale-110 transition-transform" /> Emergency
                                                     <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 translate-y-full data-[state=active]:translate-y-0 transition-transform duration-300" />
                                                 </TabsTrigger>
                                                 <TabsTrigger value="address" className="relative px-5 h-10 text-[11px] font-bold uppercase tracking-widest leading-none gap-2 data-[state=active]:text-indigo-600 transition-all duration-300 group overflow-hidden">
                                                     <Building2 className="w-3 h-3 group-data-[state=active]:scale-110 transition-transform" /> Address
                                                     <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 translate-y-full data-[state=active]:translate-y-0 transition-transform duration-300" />
                                                 </TabsTrigger>
                                                 <TabsTrigger value="job" className="relative px-5 h-10 text-[11px] font-bold uppercase tracking-widest leading-none gap-2 data-[state=active]:text-indigo-600 transition-all duration-300 group overflow-hidden">
                                                     <Briefcase className="w-3 h-3 group-data-[state=active]:scale-110 transition-transform" /> Job
                                                     <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 translate-y-full data-[state=active]:translate-y-0 transition-transform duration-300" />
                                                 </TabsTrigger>
                                                 <TabsTrigger value="identity" className="relative px-5 h-10 text-[11px] font-bold uppercase tracking-widest leading-none gap-2 data-[state=active]:text-indigo-600 transition-all duration-300 group overflow-hidden">
                                                     <Shield className="w-3 h-3 group-data-[state=active]:scale-110 transition-transform" /> Identity
                                                     <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 translate-y-full data-[state=active]:translate-y-0 transition-transform duration-300" />
                                                 </TabsTrigger>
                                                 <TabsTrigger value="documents" className="relative px-5 h-10 text-[11px] font-bold uppercase tracking-widest leading-none gap-2 data-[state=active]:text-indigo-600 transition-all duration-300 group overflow-hidden">
                                                     <Database className="w-3 h-3 group-data-[state=active]:scale-110 transition-transform" /> Documents
                                                     <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 translate-y-full data-[state=active]:translate-y-0 transition-transform duration-300" />
                                                 </TabsTrigger>

                                             </TabsList>

                                             {/* 1. PERSONAL */}
                                             <TabsContent value="personal" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                                     <FormField control={form.control} name="name" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Full Name</FormLabel><FormControl>
                                                             <div className="relative group"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500" /><Input className="h-10 pl-9 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} /></div>
                                                         </FormControl><FormMessage className="text-[9px] uppercase font-bold" /></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="employeeId" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</FormLabel><FormControl>
                                                             <div className="relative group"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500" /><Input className="h-10 pl-9 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} /></div>
                                                         </FormControl><FormMessage /></FormItem>
                                                     )} />
                                                      <FormField control={form.control} name="gender" render={({ field }) => (
                                                          <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gender</FormLabel><FormControl>
                                                              <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" placeholder="Male, Female, etc." {...field} />
                                                          </FormControl><FormMessage /></FormItem>
                                                      )} />
                                                     <FormField control={form.control} name="dob" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date of Birth</FormLabel><FormControl>
                                                              <Input type="date" max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]} min="1900-01-01" className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} />
                                                         </FormControl><FormMessage className="text-[9px] uppercase font-bold" /></FormItem>
                                                     )} />
                                                      <FormField control={form.control} name="fatherName" render={({ field }) => (
                                                          <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Father's Name</FormLabel><FormControl>
                                                               <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" placeholder="Father's Name" {...field} value={field.value || ""} />
                                                          </FormControl><FormMessage /></FormItem>
                                                      )} />
                                                      <FormField control={form.control} name="motherName" render={({ field }) => (
                                                          <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mother's Name</FormLabel><FormControl>
                                                               <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" placeholder="Mother's Name" {...field} value={field.value || ""} />
                                                          </FormControl><FormMessage /></FormItem>
                                                      )} />
                                                      <FormField control={form.control} name="maritalStatus" render={({ field }) => (
                                                          <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Marital Status</FormLabel><FormControl>
                                                               <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" placeholder="e.g. Single, Married" {...field} />
                                                          </FormControl><FormMessage /></FormItem>
                                                      )} />
                                                     <FormField control={form.control} name="bloodGroup" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Blood Group</FormLabel><FormControl>
                                                             <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" placeholder="e.g. O+, AB-, B+" {...field} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                 </div>
                                             </TabsContent>

                                             {/* 2. CONTACT */}
                                             <TabsContent value="contact" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                                     <FormField control={form.control} name="phone" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Primary Phone</FormLabel><FormControl>
                                                             <Input placeholder="e.g. 9876543210" type="tel" className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                                                         </FormControl><FormMessage className="text-[9px] uppercase font-bold" /></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="secondaryPhone" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Secondary Phone</FormLabel><FormControl>
                                                             <Input placeholder="e.g. 9876543210" type="tel" className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                                                         </FormControl><FormMessage className="text-[9px] uppercase font-bold" /></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="workPhone" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Work Phone</FormLabel><FormControl>
                                                             <Input placeholder="e.g. 9876543210" type="tel" className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                                                         </FormControl><FormMessage className="text-[9px] uppercase font-bold" /></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="personalEmail" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Personal Email</FormLabel><FormControl>
                                                             <Input type="email" className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="discordId" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Discord ID</FormLabel><FormControl>
                                                             <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                 </div>
                                             </TabsContent>

                                             {/* 3. EMERGENCY */}
                                             <TabsContent value="emergency" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                                     <FormField control={form.control} name="emergencyName" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contact Name</FormLabel><FormControl>
                                                             <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="emergencyRelationship" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Relationship</FormLabel><FormControl>
                                                             <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" placeholder="Father, Spouse, etc." {...field} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="emergencyPhone" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Emergency Phone 1</FormLabel><FormControl>
                                                             <Input type="tel" className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="emergencyPhoneSec" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Emergency Phone 2</FormLabel><FormControl>
                                                             <Input type="tel" className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                     <div className="md:col-span-2">
                                                         <FormField control={form.control} name="emergencyAddress" render={({ field }) => (
                                                             <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Emergency Contact Address</FormLabel><FormControl>
                                                                 <textarea className="flex min-h-[80px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-3 py-2 text-sm font-normal focus:ring-0 focus:border-indigo-500" {...field} />
                                                             </FormControl></FormItem>
                                                         )} />
                                                     </div>
                                                 </div>
                                             </TabsContent>

                                             {/* 4. ADDRESS */}
                                             <TabsContent value="address" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                                     <div className="md:col-span-2">
                                                         <FormField control={form.control} name="currentAddress" render={({ field }) => (
                                                             <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current Address</FormLabel><FormControl>
                                                                 <textarea className="flex min-h-[80px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-3 py-2 text-sm font-normal" {...field} />
                                                             </FormControl></FormItem>
                                                         )} />
                                                     </div>
                                                     <div className="md:col-span-2">
                                                         <FormField control={form.control} name="permanentAddress" render={({ field }) => (
                                                             <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Permanent Address</FormLabel><FormControl>
                                                                 <textarea className="flex min-h-[80px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-3 py-2 text-sm font-normal" {...field} />
                                                             </FormControl></FormItem>
                                                         )} />
                                                     </div>
                                                     <FormField control={form.control} name="city" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">City</FormLabel><FormControl>
                                                             <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="state" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">State</FormLabel><FormControl>
                                                             <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="country" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Country</FormLabel><FormControl>
                                                             <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="zipCode" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ZIP / Pincode</FormLabel><FormControl>
                                                             <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                 </div>
                                             </TabsContent>

                                             {/* 5. JOB INFO */}
                                             <TabsContent value="job" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                                     <FormField control={form.control} name="employmentType" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Employment Type</FormLabel><FormControl>
                                                             <select className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-3 py-2 text-sm font-normal focus:ring-0 focus:border-indigo-500" {...field}>
                                                                 <option value="FULL_TIME">Full-time</option>
                                                                 <option value="CONTRACT">Contract</option>
                                                                 <option value="INTERN">Intern</option>
                                                             </select>
                                                         </FormControl></FormItem>
                                                     )} />
                                                     <FormField control={form.control} name="workLocation" render={({ field }) => (
                                                         <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Work Location</FormLabel><FormControl>
                                                             <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm" {...field} />
                                                         </FormControl></FormItem>
                                                     )} />
                                                     <div className="space-y-1.5">
                                                         <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                                                         <Input disabled className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-100/50 dark:bg-slate-800/40 text-sm opacity-70" value={userData?.department?.name || "Operations"} />
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Designation</label>
                                                         <Input disabled className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-100/50 dark:bg-slate-800/40 text-sm opacity-70" value={roleName} />
                                                     </div>
                                                 </div>
                                             </TabsContent>

                                             {/* 6. IDENTITY */}
                                             <TabsContent value="identity" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                                      <FormField control={form.control} name="aadhaarNumber" render={({ field }) => (
                                                          <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aadhaar Number</FormLabel><FormControl>
                                                              <div className="relative group">
                                                                  <Input 
                                                                      className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm tracking-widest" 
                                                                      {...field} 
                                                                      onChange={(e) => {
                                                                          const val = e.target.value.replace(/\D/g, "");
                                                                          field.onChange(val);
                                                                      }}
                                                                      maxLength={12}
                                                                      placeholder="0000 0000 0000"
                                                                  />
                                                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                                      <ShieldCheck className="h-3.5 w-3.5" />
                                                                  </div>
                                                              </div>
                                                          </FormControl><FormMessage className="text-[9px]" /></FormItem>
                                                      )} />
                                                      <FormField control={form.control} name="panNumber" render={({ field }) => (
                                                          <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PAN Number</FormLabel><FormControl>
                                                              <div className="relative group">
                                                                  <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm tracking-widest uppercase" {...field} />
                                                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                                      <Binary className="h-3.5 w-3.5" />
                                                                  </div>
                                                              </div>
                                                          </FormControl><FormMessage className="text-[9px]" /></FormItem>
                                                      )} />
                                                      <FormField control={form.control} name="passportNumber" render={({ field }) => (
                                                          <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Passport Number</FormLabel><FormControl>
                                                              <div className="relative group">
                                                                  <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm tracking-widest uppercase" {...field} />
                                                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                                      <Globe2 className="h-3.5 w-3.5" />
                                                                  </div>
                                                              </div>
                                                          </FormControl><FormMessage className="text-[9px]" /></FormItem>
                                                      )} />
                                                      <FormField control={form.control} name="drivingLicense" render={({ field }) => (
                                                          <FormItem className="space-y-1.5"><FormLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Driving License</FormLabel><FormControl>
                                                              <div className="relative group">
                                                                  <Input className="h-10 border-slate-200 dark:border-slate-800 rounded-xl font-normal bg-slate-50/50 dark:bg-slate-800/20 text-sm tracking-widest uppercase" {...field} />
                                                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                                      <CreditCard className="h-3.5 w-3.5" />
                                                                  </div>
                                                              </div>
                                                          </FormControl><FormMessage className="text-[9px]" /></FormItem>
                                                      )} />
                                                 </div>
                                             </TabsContent>
                                             {/* 7. DOCUMENTS */}
                                             <TabsContent value="documents" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                                                 <EmployeeDocumentVault token={(session?.user as any)?.accessToken || ""} />
                                             </TabsContent>


                                         </Tabs>

                                          <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                                              <Button type="submit" disabled={loading} className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">
                                                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                                                  Save Changes
                                              </Button>
                                          </div>

                                     </form>
                                 </Form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT CONTENT: SECURITY & DNA (COMPACT) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* TRUST & ACCESS */}
                        <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900">
                            <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Trust Center
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full h-10 justify-between border-slate-200 dark:border-slate-800 rounded-xl font-bold bg-slate-50/30 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-none text-xs">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-3.5 h-3.5 text-indigo-500" /> Reset Password
                                            </div>
                                            <ArrowUpRight className="w-3 h-3 text-slate-300" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
                                        <div className="p-7 pb-5 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 to-white">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-300">
                                                    <Lock className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <DialogTitle className="text-lg font-semibold text-slate-900 tracking-tight">Password Reset</DialogTitle>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Please confirm your password</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Form {...passwordForm}>
                                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="p-6 space-y-5">
                                                <FormField
                                                    control={passwordForm.control}
                                                    name="currentPassword"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-[9px] font-bold text-slate-400 uppercase">Current Password</FormLabel>
                                                            <FormControl>
                                                                <Input type={showPassword ? "text" : "password"} className="h-10 border-slate-200 rounded-xl bg-slate-50 font-normal" {...field} />
                                                            </FormControl>
                                                            <FormMessage className="text-[9px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="space-y-4">
                                                    <FormField
                                                        control={passwordForm.control}
                                                        name="newPassword"
                                                        render={({ field }) => (
                                                            <FormItem className="space-y-1">
                                                                <FormLabel className="text-[9px] font-bold text-slate-400 uppercase">New Password</FormLabel>
                                                                <FormControl>
                                                                    <Input type={showPassword ? "text" : "password"} className="h-10 border-slate-200 rounded-xl bg-slate-50 font-normal" {...field} />
                                                                </FormControl>
                                                                <FormMessage className="text-[9px]" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={passwordForm.control}
                                                        name="confirmPassword"
                                                        render={({ field }) => (
                                                            <FormItem className="space-y-1">
                                                                <FormLabel className="text-[9px] font-bold text-slate-400 uppercase">Confirm Password</FormLabel>
                                                                <FormControl>
                                                                    <Input type={showPassword ? "text" : "password"} className="h-10 border-slate-200 rounded-xl bg-slate-50 font-normal" {...field} />
                                                                </FormControl>
                                                                <FormMessage className="text-[9px]" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between pt-1">
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} className="text-[9px] font-bold uppercase text-slate-400">
                                                        {showPassword ? "Hide Password" : "Show Password"}
                                                    </Button>
                                                </div>
                                                <Button type="submit" disabled={passwordLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] h-12 rounded-2xl shadow-xl shadow-indigo-500/30">
                                                    {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reset"}
                                                </Button>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>

                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    )
}
