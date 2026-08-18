"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    FileText, Upload, X, CheckCircle2, Loader2,
    Download, Trash2, CloudUpload, FolderOpen, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/config"

const DOC_TYPES = ["Aadhaar Card", "PAN Card", "Passport", "Driving License", "Voter ID", "Educational Document"]

const TYPE_COLORS: Record<string, string> = {
    "Aadhaar Card": "bg-indigo-500/10 text-indigo-600 border-indigo-200",
    "PAN Card": "bg-amber-500/10 text-amber-600 border-amber-200",
    "Passport": "bg-violet-500/10 text-violet-600 border-violet-200",
    "Driving License": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    "Voter ID": "bg-rose-500/10 text-rose-600 border-rose-200",
    "Educational Document": "bg-slate-100 text-slate-500 border-slate-200",
}

interface Doc {
    id: string
    name: string
    type: string
    fileUrl: string
    createdAt: string
}

export default function EmployeeDocumentVault({ token }: { token: string }) {
    const [docs, setDocs] = useState<Doc[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [dragOver, setDragOver] = useState(false)

    // Form state
    const [file, setFile] = useState<File | null>(null)
    const [docName, setDocName] = useState("")
    const [docType, setDocType] = useState("Aadhaar Card")
    const fileRef = useRef<HTMLInputElement>(null)

    // ── Fetch employee's own documents ─────────────────────────────
    const fetchDocs = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/documents/my`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) setDocs(await res.json())
        } catch { /* silent */ }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchDocs() }, [token])

    // ── Convert file → base64 data URL ────────────────────────────
    const toBase64 = (f: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(f)
        })

    // ── Upload handler ─────────────────────────────────────────────
    const handleUpload = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!file || !docName.trim()) {
            toast.error("Please select a file and enter a document name.")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File must be under 5 MB.")
            return
        }

        setUploading(true)
        try {
            const fileUrl = await toBase64(file)
            const res = await fetch(`${API_BASE_URL}/documents`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: docName.trim(), type: docType, fileUrl })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Upload failed")
            }

            toast.success("Document uploaded successfully! The HR Manager can now view it.")
            setShowModal(false)
            setFile(null)
            setDocName("")
            setDocType("Aadhaar Card")
            await fetchDocs()
        } catch (err: any) {
            toast.error(err.message || "Upload failed.")
        } finally {
            setUploading(false)
        }
    }

    // ── Delete handler ─────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                setDocs(d => d.filter(x => x.id !== id))
                toast.success("Document removed.")
            } else {
                toast.error("Failed to remove document.")
            }
        } catch { toast.error("Connection error.") }
    }

    // ── Drag + Drop ────────────────────────────────────────────────
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const dropped = e.dataTransfer.files[0]
        if (dropped) {
            setFile(dropped)
            if (!docName) setDocName(dropped.name.replace(/\.[^/.]+$/, ""))
        }
    }

    const triggerDownload = (fileUrl: string, fileName: string, isDownload: boolean = false) => {
        if (!fileUrl) return;
        try {
            if (fileUrl.startsWith('data:')) {
                const parts = fileUrl.split(';base64,');
                const contentType = parts[0].split(':')[1];
                const raw = window.atob(parts[1]);
                const rawLength = raw.length;
                const uInt8Array = new Uint8Array(rawLength);
                for (let i = 0; i < rawLength; ++i) { uInt8Array[i] = raw.charCodeAt(i); }
                const blob = new Blob([uInt8Array], { type: contentType });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                if (isDownload) a.download = fileName;
                else a.target = '_blank';
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 100);
            } else {
                const a = document.createElement('a');
                a.href = fileUrl;
                if (isDownload) a.download = fileName;
                else a.target = '_blank';
                a.click();
            }
        } catch (e) {
            toast.error("Failed to decode document");
        }
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
            {/* Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">My Document Vault</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                            {docs.length} Artifact{docs.length !== 1 ? "s" : ""} · Secure Manager Records
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                    id="upload-document-btn"
                >
                    <Upload className="w-3.5 h-3.5" /> Upload Doc
                </Button>
            </div>

            {/* Document List */}
            <div className="divide-y divide-slate-50">
                {loading ? (
                    <div className="h-40 flex items-center justify-center gap-3 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Syncing vault...</span>
                    </div>
                ) : docs.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                            <FileText className="w-7 h-7 text-slate-200" />
                        </div>
                        <div className="text-center">
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">No documents yet</p>
                            <p className="text-[10px] text-slate-300 mt-1">Upload your ID, contracts, or certificates</p>
                        </div>
                    </div>
                ) : (
                    docs.map((doc, idx) => (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shrink-0">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-900 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">{doc.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                    {new Date(doc.createdAt).toLocaleDateString()} · Synced to HR Manager Portal
                                </p>
                            </div>
                            <Badge className={cn("border text-[8px] font-bold uppercase tracking-widest px-2 h-5 shrink-0", TYPE_COLORS[doc.type] || TYPE_COLORS["Educational Document"])}>
                                {doc.type}
                            </Badge>
                            <div className="flex items-center gap-1 shrink-0">
                                {doc.fileUrl && (
                                    <>
                                        <Button 
                                            variant="ghost" size="icon" 
                                            className="h-8 w-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100 hover:border-indigo-100 shadow-sm bg-white"
                                            onClick={() => triggerDownload(doc.fileUrl, doc.name)}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button 
                                            variant="ghost" size="icon" 
                                            className="h-8 w-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100 hover:border-indigo-100 shadow-sm bg-white"
                                            onClick={() => triggerDownload(doc.fileUrl, doc.name, true)}
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </Button>
                                    </>
                                )}
                                <Button
                                    variant="ghost" size="icon"
                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all ml-1"
                                    onClick={() => handleDelete(doc.id)}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* ── UPLOAD MODAL ── */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                        onClick={e => e.target === e.currentTarget && setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-7 pb-5 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 to-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-300">
                                        <CloudUpload className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Upload Document</h2>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Secure · Encrypted · ONLY HR MANAGER VISIBLE</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-7 space-y-5">
                                {/* Drag & Drop Zone */}
                                <div
                                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileRef.current?.click()}
                                    className={cn(
                                        "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                                        dragOver ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                    )}
                                >
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                        onChange={e => {
                                            const f = e.target.files?.[0]
                                            if (f) {
                                                setFile(f)
                                                if (!docName) setDocName(f.name.replace(/\.[^/.]+$/, ""))
                                            }
                                        }}
                                    />
                                    {file ? (
                                        <>
                                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                            <p className="text-[12px] font-bold text-slate-800 uppercase tracking-tight text-center">{file.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{(file.size / 1024).toFixed(0)} KB</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 text-slate-200" />
                                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight text-center">Drop file here or click to browse</p>
                                            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">PDF · PNG · JPG · DOC · Max 5MB</p>
                                        </>
                                    )}
                                </div>

                                {/* Document Name */}
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Document Name *</label>
                                    <input
                                        type="text"
                                        value={docName}
                                        onChange={e => setDocName(e.target.value)}
                                        placeholder="e.g. Aadhaar Card, Experience Letter..."
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[13px] font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                                        required
                                    />
                                </div>

                                {/* Document Type */}
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Document Type *</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DOC_TYPES.map(t => (
                                            <button
                                                type="button"
                                                key={t}
                                                onClick={() => setDocType(t)}
                                                className={cn(
                                                    "px-3 h-7 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all",
                                                    docType === t
                                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                                                        : "bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300"
                                                )}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Notice */}
                                <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-bold text-emerald-700 leading-relaxed">
                                        This document will be <span className="font-bold">immediately visible</span> to the <span className="font-bold text-indigo-700">HR Manager</span> for review and download.
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex pt-2">
                                    <Button
                                        type="button"
                                        onClick={() => handleUpload()}
                                        disabled={uploading || !file}
                                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                                    >
                                        {uploading
                                            ? <><Loader2 className="w-4 h-4 animate-spin mr-2 inline" />Uploading...</>
                                            : <><Upload className="w-4 h-4 mr-2 inline" />Submit to HR Port</>
                                        }
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
