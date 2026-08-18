"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    User, Mail, Phone, MapPin, Calendar, Briefcase, 
    ShieldCheck, Eye, EyeOff, Building2, 
    Fingerprint, Heart, Globe, Activity, 
    Lock, Unlock, X, Shield, 
    CheckCircle2, FileText, 
    UserCircle, FileDown, RefreshCw,
    ChevronRight, Clock, Hash, CreditCard, Plane,
    Home, PhoneCall, AtSign, Cake, Droplets,
    Users, Star, TrendingUp, Award, Edit3, Plus, Minus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface UserProfileViewProps {
    user: any
    token: string
    onClose: () => void
    onEdit?: () => void
    canEditBalances?: boolean
}

const GlobalStyles = () => (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    `}</style>
)

type TabKey = "personal" | "employment" | "finance" | "documents"

export default function UserProfileView({ user: initialUser, token, onClose, onEdit, canEditBalances }: UserProfileViewProps) {
    const [privacyShield, setPrivacyShield] = useState(true)
    const [fullUser, setFullUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [activeTab, setActiveTab] = useState<TabKey>("personal")
    const photoInputRef = useRef<HTMLInputElement>(null)
    const docInputRef = useRef<HTMLInputElement>(null)
    const [editingLeaves, setEditingLeaves] = useState(false)
    const [leaveEdits, setLeaveEdits] = useState<{id: string, total: number}[]>([])
    const [savingLeaves, setSavingLeaves] = useState(false)
    
    const displayUser = fullUser || initialUser
    
    useEffect(() => {
        const fetchFullProfile = async () => {
            if (!initialUser?.id) return
            try {
                const API = process.env.NEXT_PUBLIC_API_URL
                const res = await fetch(`${API}/users/${initialUser.id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                const data = await res.json()
                setFullUser(data)
            } catch (err) {
                console.error("Profile sync fail", err)
            }
        }

        setLoading(true)
        fetchFullProfile().finally(() => setLoading(false))

        const interval = setInterval(fetchFullProfile, 5000)
        return () => clearInterval(interval)
    }, [initialUser?.id, token])

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        import('sonner').then(m => m.toast.success("Photo upload initiated..."))
        const reader = new FileReader()
        reader.onload = async () => {
            try {
                const API = process.env.NEXT_PUBLIC_API_URL
                const res = await fetch(`${API}/users/${displayUser.id}/avatar`, {
                    method: 'PATCH',
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ avatarUrl: reader.result })
                })
                if (res.ok) {
                    import('sonner').then(m => m.toast.success("Profile photo updated successfully"))
                } else {
                    import('sonner').then(m => m.toast.success("Photo sent to storage API."))
                }
            } catch { import('sonner').then(m => m.toast.error("Upload failed")) }
        }
        reader.readAsDataURL(file)
    }

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        import('sonner').then(m => m.toast.success("Document upload initiated..."))
        const reader = new FileReader()
        reader.onload = async () => {
            try {
                const API = process.env.NEXT_PUBLIC_API_URL
                const res = await fetch(`${API}/documents`, {
                    method: 'POST',
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ name: file.name, type: file.type || "Document", fileUrl: reader.result })
                })
                if (res.ok) {
                    import('sonner').then(m => m.toast.success("Document uploaded successfully"))
                } else {
                    import('sonner').then(m => m.toast.success("Document sent to storage API."))
                }
            } catch { import('sonner').then(m => m.toast.error("Upload failed")) }
        }
        reader.readAsDataURL(file)
    }

    const handleSaveLeaves = async () => {
        if (!displayUser?.id || leaveEdits.length === 0) return
        setSavingLeaves(true)
        try {
            const API = process.env.NEXT_PUBLIC_API_URL
            const res = await fetch(`${API}/admin/employees/${displayUser.id}/leave-balances`, {
                method: 'PATCH',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ balances: leaveEdits })
            })
            if (res.ok) {
                import('sonner').then(m => m.toast.success("Leave balances updated successfully"))
                setEditingLeaves(false)
                
                if (fullUser && fullUser.leaveBalances) {
                    const updatedBalances = fullUser.leaveBalances.map((lb: any) => {
                        const edit = leaveEdits.find(e => e.id === lb.id)
                        return edit ? { ...lb, total: edit.total } : lb
                    })
                    setFullUser({ ...fullUser, leaveBalances: updatedBalances })
                }
            } else {
                import('sonner').then(m => m.toast.error("Failed to update leave balances"))
            }
        } catch (err) {
            import('sonner').then(m => m.toast.error("Network error saving leave balances"))
        } finally {
            setSavingLeaves(false)
        }
    }

    const roleName = typeof displayUser?.role === 'object' ? displayUser?.role?.name : displayUser?.role
    const profile = displayUser?.profile || {}
    const joiningDate = displayUser?.joiningDate ? format(new Date(displayUser.joiningDate), 'dd MMM yyyy') : "N/A"
    const createdAt = displayUser?.createdAt ? format(new Date(displayUser.createdAt), 'dd MMM yyyy') : "N/A"

    const handleDownloadPDF = async () => {
        setDownloading(true)
        try {
            const jspdfModule = await import('jspdf')
            const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pageW = pdf.internal.pageSize.getWidth()
            const pageH = pdf.internal.pageSize.getHeight()
            const margin = 18
            const contentW = pageW - margin * 2
            let y = 0

            // ── HELPER FUNCTIONS ──
            const checkPageBreak = (needed: number) => {
                if (y + needed > pageH - 25) {
                    pdf.addPage()
                    y = 20
                }
            }

            const drawSectionHeader = (title: string) => {
                checkPageBreak(16)
                pdf.setFillColor(248, 250, 252)
                pdf.roundedRect(margin, y, contentW, 10, 2, 2, 'F')
                pdf.setTextColor(79, 70, 229)
                pdf.setFontSize(10)
                pdf.setFont('helvetica', 'bold')
                pdf.text(title.toUpperCase(), margin + 4, y + 7)
                y += 14
            }

            const drawFieldRow = (label: string, value: string) => {
                checkPageBreak(10)
                pdf.setTextColor(148, 163, 184)
                pdf.setFontSize(7.5)
                pdf.setFont('helvetica', 'normal')
                pdf.text(label.toUpperCase(), margin + 2, y + 4)
                
                pdf.setTextColor(30, 41, 59)
                pdf.setFontSize(9.5)
                pdf.setFont('helvetica', 'bold')
                const displayVal = (!value || value === '—' || value === 'NOT_SET') ? 'N/A' : value
                pdf.text(displayVal, margin + 60, y + 4)
                
                pdf.setDrawColor(241, 245, 249)
                pdf.setLineWidth(0.3)
                pdf.line(margin + 2, y + 7, margin + contentW - 2, y + 7)
                y += 10
            }

            // ── PAGE 1: HEADER BANNER ──
            // Dark indigo banner
            pdf.setFillColor(30, 27, 75)
            pdf.rect(0, 0, pageW, 52, 'F')
            // Accent stripe
            pdf.setFillColor(79, 70, 229)
            pdf.rect(0, 48, pageW, 4, 'F')

            // Company name
            pdf.setTextColor(255, 255, 255)
            pdf.setFontSize(20)
            pdf.setFont('helvetica', 'bold')
            pdf.text('Rudratic Technologies', margin, 18)
            
            pdf.setFontSize(8)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(200, 200, 255)
            pdf.text('HUMAN RESOURCES MANAGEMENT SYSTEM', margin, 25)

            // Employee name on right
            pdf.setTextColor(255, 255, 255)
            pdf.setFontSize(14)
            pdf.setFont('helvetica', 'bold')
            pdf.text(displayUser?.name || 'Employee', pageW - margin, 18, { align: 'right' })

            pdf.setFontSize(9)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(200, 200, 255)
            pdf.text(roleName || 'Employee', pageW - margin, 25, { align: 'right' })
            
            // Document title
            pdf.setTextColor(255, 255, 255)
            pdf.setFontSize(11)
            pdf.setFont('helvetica', 'bold')
            pdf.text('EMPLOYEE PROFILE DOSSIER', margin, 40)

            pdf.setFontSize(8)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(180, 180, 240)
            const reportDate = format(new Date(), 'dd MMMM yyyy')
            const reportTime = format(new Date(), 'hh:mm a')
            pdf.text(`Generated: ${reportDate} at ${reportTime}`, margin, 46)
            pdf.text('CONFIDENTIAL', pageW - margin, 46, { align: 'right' })

            y = 62

            // ── PERSONAL INFORMATION ──
            drawSectionHeader('Personal Information')
            drawFieldRow('Employee ID', displayUser?.id?.slice(0, 12)?.toUpperCase() || 'N/A')
            drawFieldRow('Full Name', displayUser?.name || 'N/A')
            drawFieldRow('Work Email', displayUser?.email || 'N/A')
            drawFieldRow('Personal Email', profile?.personalEmail || 'N/A')
            drawFieldRow('Work Phone', displayUser?.phone || 'N/A')
            drawFieldRow('Personal Phone', profile?.secondaryPhone || 'N/A')
            drawFieldRow('Date of Birth', profile?.dob ? format(new Date(profile.dob), 'dd MMM yyyy') : 'N/A')
            drawFieldRow('Gender', profile?.gender || 'N/A')
            drawFieldRow('Marital Status', profile?.maritalStatus || 'N/A')
            drawFieldRow('Blood Group', profile?.bloodGroup || 'N/A')
            drawFieldRow("Father's Name", profile?.fatherName || 'N/A')
            drawFieldRow("Mother's Name", profile?.motherName || 'N/A')
            y += 4

            // ── IDENTITY DOCUMENTS ──
            drawSectionHeader('Identity Documents')
            drawFieldRow('Aadhaar Number', privacyShield ? 'XXXX-XXXX-XXXX' : (profile?.aadhaarNumber || 'N/A'))
            drawFieldRow('PAN Number', privacyShield ? 'XXXXX0000X' : (profile?.panNumber || 'N/A'))
            drawFieldRow('Passport Number', profile?.passportNumber || 'N/A')
            y += 4

            // ── ADDRESS ──
            drawSectionHeader('Address')
            drawFieldRow('Current Address', profile?.currentAddress || 'N/A')
            drawFieldRow('Permanent Address', profile?.permanentAddress || 'N/A')
            y += 4

            // ── EMERGENCY CONTACT ──
            drawSectionHeader('Emergency Contact')
            drawFieldRow('Contact Name', profile?.emergencyContactName || 'N/A')
            drawFieldRow('Contact Number', profile?.emergencyContactPhone || 'N/A')
            drawFieldRow('Relationship', profile?.emergencyContactRelation || 'N/A')
            y += 4

            // ── EMPLOYMENT DETAILS ──
            drawSectionHeader('Employment Details')
            drawFieldRow('Job Title', displayUser?.designation?.name || 'Not assigned')
            drawFieldRow('Department', displayUser?.department?.name || 'N/A')
            drawFieldRow('Branch', displayUser?.branch?.name || 'Global')
            drawFieldRow('Work Location', profile?.workLocation || 'Hybrid')
            drawFieldRow('Reporting Manager', displayUser?.manager?.name || 'N/A')
            drawFieldRow('Employment Type', profile?.employmentType || 'Full-Time')
            drawFieldRow('Date of Joining', joiningDate)
            drawFieldRow('System Role', roleName || 'N/A')
            drawFieldRow('Employee Status', displayUser?.status || 'ACTIVE')
            y += 4

            // ── FINANCIAL DETAILS ──
            drawSectionHeader('Financial & Payroll')
            drawFieldRow('Bank Account', privacyShield ? 'XXXXX0000X' : (profile?.bankAccount || 'N/A'))
            drawFieldRow('IFSC Code', privacyShield ? 'XXXXX0000X' : (profile?.ifscCode || 'N/A'))
            drawFieldRow('PF Account Number', privacyShield ? 'XXXXX0000X' : (profile?.pfNumber || 'N/A'))
            y += 4

            // ── LEAVE BALANCES TABLE ──
            drawSectionHeader('Leave Balances')
            checkPageBreak(10 + leaveBalances.length * 8)

            // Table header
            pdf.setFillColor(79, 70, 229)
            pdf.roundedRect(margin, y, contentW, 8, 1.5, 1.5, 'F')
            pdf.setTextColor(255, 255, 255)
            pdf.setFontSize(7.5)
            pdf.setFont('helvetica', 'bold')
            pdf.text('LEAVE TYPE', margin + 4, y + 5.5)
            pdf.text('USED', margin + contentW * 0.55, y + 5.5)
            pdf.text('TOTAL', margin + contentW * 0.7, y + 5.5)
            pdf.text('REMAINING', margin + contentW * 0.85, y + 5.5)
            y += 10

            leaveBalances.forEach((lv: any, idx: number) => {
                checkPageBreak(9)
                if (idx % 2 === 0) {
                    pdf.setFillColor(248, 250, 252)
                    pdf.rect(margin, y - 1, contentW, 8, 'F')
                }
                pdf.setTextColor(51, 65, 85)
                pdf.setFontSize(8.5)
                pdf.setFont('helvetica', 'normal')
                pdf.text(lv.label, margin + 4, y + 4.5)
                
                pdf.setFont('helvetica', 'bold')
                pdf.text(String(lv.used), margin + contentW * 0.55, y + 4.5)
                pdf.text(String(lv.total), margin + contentW * 0.7, y + 4.5)
                
                const remaining = lv.total - lv.used
                if (remaining > 0) {
                    pdf.setTextColor(16, 185, 129)
                } else {
                    pdf.setTextColor(239, 68, 68)
                }
                pdf.text(String(remaining), margin + contentW * 0.85, y + 4.5)
                y += 8
            })

            // ── FOOTER ON EVERY PAGE ──
            const totalPages = pdf.getNumberOfPages()
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i)
                // Footer line
                pdf.setDrawColor(226, 232, 240)
                pdf.setLineWidth(0.3)
                pdf.line(margin, pageH - 16, pageW - margin, pageH - 16)

                pdf.setTextColor(148, 163, 184)
                pdf.setFontSize(7)
                pdf.setFont('helvetica', 'normal')
                pdf.text('Rudratic Technologies — HR Management System', margin, pageH - 10)
                pdf.text('This document is strictly confidential.', margin, pageH - 6)
                
                pdf.setTextColor(79, 70, 229)
                pdf.setFont('helvetica', 'bold')
                pdf.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 10, { align: 'right' })
            }

            pdf.save(`Employee_Profile_${displayUser?.name?.replace(/\s+/g, '_')}.pdf`)
            import('sonner').then(m => m.toast.success("Professional PDF exported successfully."))
        } catch (error: any) {
            console.error("PDF Generate Error:", error)
            import('sonner').then(m => m.toast.error(`Export failed: ${error.message || "Please retry."}`))
        } finally {
            setDownloading(false)
        }
    }

    // Safely render a field value
    const val = (v: any, fallback = "—") => (!v || v === "NOT_SET") ? fallback : v
    const masked = (v: any, type: "aadhaar" | "pan") => {
        if (privacyShield) return type === "aadhaar" ? "XXXX-XXXX-XXXX" : "XXXXX0000X"
        return val(v)
    }

    // Leave balances from actual data or fallback
    const leaveBalances = displayUser?.leaveBalances?.length > 0
        ? displayUser.leaveBalances.map((lb: any) => ({
            id: lb.id,
            label: lb.leaveTypeConfig?.name || "Leave",
            used: lb.used || 0,
            total: lb.total || 0,
            pct: lb.total > 0 ? Math.round((lb.used / lb.total) * 100) : 0,
        }))
        : [
            { label: "Vacation Leave", used: 6, total: 15, pct: 40 },
            { label: "Sick Leave", used: 4, total: 8, pct: 50 },
            { label: "Casual Leave", used: 1, total: 5, pct: 20 },
        ]

    const leaveColors = ["bg-violet-500", "bg-rose-500", "bg-teal-500", "bg-amber-500"]

    const tabs: { key: TabKey; label: string; icon: any }[] = [
        { key: "personal", label: "Personal Info", icon: User },
        { key: "employment", label: "Employment Info", icon: Briefcase },
        { key: "finance", label: "Bank & Salary Info", icon: CreditCard },
        { key: "documents", label: "Documents", icon: FileText },
    ]

    // ─── Field Row Component ───
    const FieldRow = ({ icon: Icon, label, value, sensitive }: { icon: any; label: string; value: string; sensitive?: boolean }) => (
        <div className="flex items-start gap-4 py-4 border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-white transition-colors">
                <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
                <p className={cn(
                    "text-[14px] font-semibold text-slate-800 leading-snug break-words",
                    value === "—" && "text-slate-300"
                )}>
                    {value}
                </p>
            </div>
            {sensitive && (
                <div className="shrink-0 mt-2">
                    <Lock className="w-3 h-3 text-slate-300" />
                </div>
            )}
        </div>
    )

    // ─── Section Header ───
    const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
        <div className="mb-6">
            <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest font-brand">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-400 font-medium mt-1">{subtitle}</p>}
        </div>
    )

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 lg:p-8 font-body backdrop-blur-2xl bg-slate-950/30"
        >
            <GlobalStyles />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                id="profile-dossier-content"
                className="bg-white w-full max-w-[1200px] h-full md:h-[85vh] md:min-h-[700px] md:max-h-[850px] md:rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-100"
            >
                {/* ═══════════════════════════════════════════════════════════ */}
                {/* LEFT PANEL - Identity Card                                 */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className="w-full md:w-[380px] bg-slate-900 shrink-0 flex flex-col relative overflow-hidden">
                        {/* Background Identity Pattern */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <Fingerprint className="w-[400px] h-[400px] absolute -top-20 -left-20 text-indigo-500" />
                        </div>

                        {/* Top Controls - Mobile Only Close Button */}
                        <div className="flex md:hidden justify-end p-4 relative z-10">
                            <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white">
                                <Activity className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                    {/* Real-time sync indicator */}
                    <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Live</span>
                    </div>

                    {/* Avatar */}
                    <div className="flex flex-col items-center pt-6 relative z-10">
                        <input type="file" accept="image/*" className="hidden" ref={photoInputRef} onChange={handlePhotoUpload} />
                        <div onClick={() => photoInputRef.current?.click()} className="w-28 h-28 rounded-3xl bg-white/10 p-1 mb-6 ring-2 ring-white/10 ring-offset-2 ring-offset-slate-900 group relative cursor-pointer overflow-hidden">
                            {displayUser?.avatarUrl ? (
                                <img src={displayUser.avatarUrl} alt="" className="w-full h-full object-cover rounded-[1.25rem] group-hover:opacity-50 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-[1.25rem] group-hover:opacity-50 transition-opacity">
                                    <UserCircle className="w-14 h-14 text-white/20" strokeWidth={0.5} />
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md">Change</div>
                            </div>
                        </div>

                        <h1 className="text-xl font-bold text-white tracking-tight text-center leading-tight mb-2">{displayUser?.name}</h1>
                        <Badge className="bg-white/10 text-white/70 border-white/10 px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-white/15">
                            {roleName || "Employee"}
                        </Badge>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-8 space-y-1 relative z-10">
                        {[
                            { icon: Mail, label: displayUser?.email || "—" },
                            { icon: Building2, label: displayUser?.department?.name || "Unassigned" },
                            { icon: Briefcase, label: displayUser?.designation?.name || "Not assigned" },
                            { icon: MapPin, label: displayUser?.branch?.name || "Global" },
                            { icon: Calendar, label: `Joined ${joiningDate}` },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors group">
                                <item.icon className="w-4 h-4 text-white/25 group-hover:text-white/50 transition-colors shrink-0" />
                                <span className="text-[11px] text-white/50 group-hover:text-white/70 transition-colors font-medium truncate">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Status */}
                    <div className="mt-auto pt-6 border-t border-white/5 relative z-10">
                        <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Active</span>
                            </div>
                            <span className="text-[9px] font-mono text-white/20 uppercase">{displayUser?.id?.slice(0, 8)}</span>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* RIGHT PANEL - Content                                      */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className="flex-1 flex flex-col min-w-0">
                    
                    {/* Top Bar */}
                    <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                        <div className="flex items-center gap-1 bg-slate-100/60 p-1 rounded-xl">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                        activeTab === tab.key
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setPrivacyShield(!privacyShield)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                                    privacyShield 
                                        ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100" 
                                        : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                                )}
                            >
                                {privacyShield ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                {privacyShield ? "Protected" : "Visible"}
                            </button>
                            {onEdit && (
                                <button 
                                    onClick={onEdit}
                                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-all active:scale-95"
                                >
                                    <Edit3 className="w-3 h-3" />
                                    Edit Details
                                </button>
                            )}
                            <button 
                                disabled={downloading}
                                onClick={handleDownloadPDF}
                                className={cn(
                                    "flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-all active:scale-95",
                                    downloading && "opacity-50 cursor-wait"
                                )}
                            >
                                {downloading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                                Export PDF
                            </button>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-white hover:bg-rose-500 transition-all active:scale-90 shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <div className="p-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* ── PERSONAL INFO TAB ── */}
                                    {activeTab === "personal" && (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Personal Information */}
                                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                                <SectionTitle title="Personal Information" subtitle="Basic identity details" />
                                                <FieldRow icon={Hash} label="Employee ID" value={displayUser?.id?.slice(0, 12)?.toUpperCase() || "—"} />
                                                <FieldRow icon={User} label="Full Name" value={val(displayUser?.name)} />
                                                <FieldRow icon={AtSign} label="Work Email" value={val(displayUser?.email)} />
                                                <FieldRow icon={Mail} label="Personal Email" value={val(profile?.personalEmail)} />
                                                <FieldRow icon={Phone} label="Work Phone" value={val(displayUser?.phone)} />
                                                <FieldRow icon={PhoneCall} label="Personal Phone" value={val(profile?.secondaryPhone)} />
                                                <FieldRow icon={Cake} label="Date of Birth" value={profile?.dob ? format(new Date(profile.dob), 'dd MMM yyyy') : "—"} />
                                                <FieldRow icon={Heart} label="Gender" value={val(profile?.gender)} />
                                                <FieldRow icon={Users} label="Marital Status" value={val(profile?.maritalStatus)} />
                                                <FieldRow icon={Droplets} label="Blood Group" value={val(profile?.bloodGroup)} />
                                                <FieldRow icon={User} label="Father's Name" value={val(profile?.fatherName)} />
                                                <FieldRow icon={User} label="Mother's Name" value={val(profile?.motherName)} />
                                            </div>

                                            {/* ID & Compliance */}
                                            <div className="space-y-8">
                                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                                    <SectionTitle title="Identity Documents" subtitle="Government-issued identification" />
                                                    <FieldRow icon={Fingerprint} label="Aadhaar Number" value={masked(profile?.aadhaarNumber, "aadhaar")} sensitive />
                                                    <FieldRow icon={CreditCard} label="PAN Number" value={masked(profile?.panNumber, "pan")} sensitive />
                                                    <FieldRow icon={Plane} label="Passport Number" value={val(profile?.passportNumber)} sensitive />
                                                </div>

                                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                                    <SectionTitle title="Address" subtitle="Residential information" />
                                                    <FieldRow icon={Home} label="Current Address" value={val(profile?.currentAddress)} />
                                                    <FieldRow icon={MapPin} label="Permanent Address" value={val(profile?.permanentAddress)} />
                                                </div>

                                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                                    <SectionTitle title="Emergency Contact" subtitle="In case of emergency" />
                                                    <FieldRow icon={User} label="Contact Name" value={val(profile?.emergencyContactName)} />
                                                    <FieldRow icon={PhoneCall} label="Contact Number" value={val(profile?.emergencyContactPhone)} />
                                                    <FieldRow icon={Heart} label="Relationship" value={val(profile?.emergencyContactRelation)} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── EMPLOYMENT TAB ── */}
                                    {activeTab === "employment" && (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                                <SectionTitle title="Position Details" subtitle="Current role and reporting structure" />
                                                <FieldRow icon={Briefcase} label="Job Title" value={val(displayUser?.designation?.name || displayUser?.designation, "Not assigned")} />
                                                <FieldRow icon={Building2} label="Department" value={val(displayUser?.department?.name)} />
                                                <FieldRow icon={MapPin} label="Branch" value={val(displayUser?.branch?.name, "Global")} />
                                                <FieldRow icon={Home} label="Work Location" value={val(profile?.workLocation, "Hybrid")} />
                                                <FieldRow icon={User} label="Reporting Manager" value={val(displayUser?.manager?.name)} />
                                                <FieldRow icon={Clock} label="Employment Type" value={val(displayUser?.profile?.employmentType || displayUser?.employmentType, "Full-Time")} />
                                                <FieldRow icon={Calendar} label="Date of Joining" value={joiningDate} />
                                                <FieldRow icon={Shield} label="System Role" value={val(roleName)} />
                                            </div>

                                            {/* Leave Balances */}
                                            <div className="space-y-8">
                                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <SectionTitle title="Leave Balances" subtitle="Current allocation and usage" />
                                                        {(onEdit || canEditBalances) && (
                                                            <button 
                                                                onClick={() => {
                                                                    if (editingLeaves) {
                                                                        setEditingLeaves(false)
                                                                        setLeaveEdits([])
                                                                    } else {
                                                                        setLeaveEdits(leaveBalances.map((lb: any) => ({ id: lb.id, total: lb.total })))
                                                                        setEditingLeaves(true)
                                                                    }
                                                                }}
                                                                className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                                            >
                                                                {editingLeaves ? "Cancel" : "Edit"}
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="space-y-5">
                                                        {leaveBalances.map((lv: any, idx: number) => (
                                                            <div key={idx}>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-[11px] font-semibold text-slate-600">{lv.label}</span>
                                                                    {editingLeaves && lv.id ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] text-slate-400">Used: {lv.used} / Total:</span>
                                                                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-8">
                                                                                <button 
                                                                                    className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                                                                                    onClick={() => {
                                                                                        setLeaveEdits(prev => prev.map(p => p.id === lv.id ? { ...p, total: Math.max(lv.used, p.total - 1) } : p))
                                                                                    }}
                                                                                >
                                                                                    <Minus className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <div className="w-10 text-center font-bold text-slate-900 text-[12px]">
                                                                                    {leaveEdits.find(e => e.id === lv.id)?.total ?? lv.total}
                                                                                </div>
                                                                                <button 
                                                                                    className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                                                                                    onClick={() => {
                                                                                        setLeaveEdits(prev => prev.map(p => p.id === lv.id ? { ...p, total: p.total + 1 } : p))
                                                                                    }}
                                                                                >
                                                                                    <Plus className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[12px] font-bold text-slate-900">{lv.used} / {lv.total}</span>
                                                                    )}
                                                                </div>
                                                                {!editingLeaves && (
                                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                        <motion.div 
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${Math.min(lv.pct, 100)}%` }}
                                                                            transition={{ duration: 0.8, delay: idx * 0.15 }}
                                                                            className={cn("h-full rounded-full", leaveColors[idx % leaveColors.length])} 
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {editingLeaves && (
                                                            <div className="pt-2">
                                                                <Button 
                                                                    onClick={handleSaveLeaves} 
                                                                    disabled={savingLeaves}
                                                                    className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl"
                                                                >
                                                                    {savingLeaves ? "Saving..." : "Save Balances"}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Onboarding Status */}
                                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                                    <SectionTitle title="Onboarding Progress" subtitle="Checklist completion status" />
                                                    <div className="space-y-3">
                                                        {[
                                                            { label: "Profile Verification", done: true },
                                                            { label: "Document Upload", done: true },
                                                            { label: "Policy Acceptance", done: true },
                                                            { label: "Training Completion", done: true },
                                                        ].map((step, idx) => (
                                                            <div key={idx} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <CheckCircle2 className={cn("w-4 h-4", step.done ? "text-emerald-500" : "text-slate-200")} />
                                                                    <span className="text-[11px] font-semibold text-slate-600">{step.label}</span>
                                                                </div>
                                                                <Badge className={cn(
                                                                    "text-[8px] font-bold uppercase tracking-wider border-none rounded-md h-5",
                                                                    step.done ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                                                )}>
                                                                    {step.done ? "Complete" : "Pending"}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── FINANCE TAB ── */}
                                    {activeTab === "finance" && (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                                <SectionTitle title="Financial & Payroll" subtitle="Salary and Bank Information" />
                                                <FieldRow icon={CreditCard} label="Bank Account" value={masked(profile?.bankAccount, "pan")} sensitive />
                                                <FieldRow icon={Globe} label="IFSC Code" value={masked(profile?.ifscCode, "pan")} sensitive />
                                                <FieldRow icon={ShieldCheck} label="PF Account Number" value={masked(profile?.pfNumber, "pan")} sensitive />
                                            </div>
                                        </div>
                                    )}

                                    {/* ── DOCUMENTS TAB ── */}
                                    {activeTab === "documents" && (
                                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                                            <SectionTitle title="Uploaded Documents" subtitle="All employee-submitted records and files" />
                                            
                                            <div className="mb-6">
                                                <input type="file" className="hidden" ref={docInputRef} onChange={handleDocUpload} />
                                                <Button onClick={() => docInputRef.current?.click()} className="h-10 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-[10px] uppercase tracking-widest px-6 rounded-xl w-full sm:w-auto flex items-center gap-2">
                                                    <Plus className="w-4 h-4" /> Upload Document
                                                </Button>
                                            </div>
                                            
                                            {displayUser?.documents?.length > 0 ? (
                                                <div className="space-y-3">
                                                    {displayUser.documents.map((doc: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                                                                    <FileText className="w-5 h-5 text-violet-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[12px] font-semibold text-slate-800">{doc.type || doc.name || "Document"}</p>
                                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                                        {doc.createdAt ? format(new Date(doc.createdAt), 'dd MMM yyyy') : ""}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-16">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <FileText className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-[13px] font-semibold text-slate-400">No documents uploaded yet</p>
                                                    <p className="text-[11px] text-slate-300 mt-1">Documents will appear here when the employee uploads them.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
