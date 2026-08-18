"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { 
    FileText, Download, Plus, Search, Eye, 
    Building2, Trash2, X, UploadCloud, Loader2, Check, Share2 
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/config"

interface CompanyDocument {
    id: string
    name: string
    description: string
    type: string
    fileUrl: string
    createdAt: string
}

export default function CompanyDocumentsPage() {
    const { data: session } = useSession()
    const token = (session?.user as any)?.accessToken
    const userRole = (session?.user as any)?.role || ""
    const canManage = ["SUPER_ADMIN", "HR_MANAGER", "ADMIN"].includes(userRole)

    const [documents, setDocuments] = useState<CompanyDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Upload Modal State
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        type: "Policy",
        fileUrl: ""
    })

    const fetchDocuments = async () => {
        if (!token) {
            setLoading(false)
            return
        }
        try {
            const res = await fetch(`${API_BASE_URL}/company-documents`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setDocuments(data)
            }
        } catch (error) {
            console.error("Failed to fetch company documents", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDocuments()
    }, [token])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, fileUrl: reader.result as string }))
        }
        reader.readAsDataURL(file)
    }

    const handleUpload = async () => {
        if (!formData.name || !formData.fileUrl) {
            toast.error("Please provide a name and select a file")
            return
        }

        setUploading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/company-documents`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success("Document uploaded successfully")
                setIsUploadOpen(false)
                setFormData({ name: "", description: "", type: "Policy", fileUrl: "" })
                fetchDocuments()
            } else {
                toast.error("Failed to upload document")
            }
        } catch (error) {
            toast.error("Error uploading document")
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return
        try {
            const res = await fetch(`${API_BASE_URL}/company-documents/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                toast.success("Document deleted")
                fetchDocuments()
            } else {
                toast.error("Failed to delete document")
            }
        } catch (error) {
            toast.error("Error deleting document")
        }
    }

    const triggerDownload = (fileUrl: string, fileName: string, isDownload: boolean = false) => {
        if (!fileUrl) return
        try {
            if (fileUrl.startsWith('data:')) {
                const parts = fileUrl.split(';base64,')
                const contentType = parts[0].split(':')[1]
                const raw = window.atob(parts[1])
                const rawLength = raw.length
                const uInt8Array = new Uint8Array(rawLength)
                for (let i = 0; i < rawLength; ++i) { uInt8Array[i] = raw.charCodeAt(i) }
                const blob = new Blob([uInt8Array], { type: contentType })
                const url = URL.createObjectURL(blob)
                
                const a = document.createElement('a')
                a.href = url
                if (isDownload) a.download = fileName
                else a.target = '_blank'
                
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                setTimeout(() => URL.revokeObjectURL(url), 100)
            } else {
                const a = document.createElement('a')
                a.href = fileUrl
                if (isDownload) a.download = fileName
                else a.target = '_blank'
                a.click()
            }
        } catch (e) {
            toast.error("Failed to open document")
        }
    }

    const filteredDocs = documents.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.type.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* CLEAN HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Company Documents</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Access corporate resources, policies, and standard operating procedures.
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search documents..."
                            className="pl-9 h-11 bg-slate-50 border-slate-200 rounded-xl"
                        />
                    </div>
                    {canManage && (
                        <Button
                            onClick={() => setIsUploadOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-6 shadow-md shadow-indigo-600/20"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Upload
                        </Button>
                    )}
                </div>
            </header>

            {/* DOCUMENTS GRID */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : filteredDocs.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <FileText className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Documents Found</h3>
                    <p className="text-slate-500 max-w-sm">
                        There are currently no company documents available matching your search criteria.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDocs.map((doc) => (
                        <div 
                            key={doc.id} 
                            className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col gap-6 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                    <FileText className="w-7 h-7" />
                                </div>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none">
                                    {doc.type}
                                </Badge>
                            </div>
                            
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 line-clamp-1 mb-1">{doc.name}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                                    {doc.description || "No description provided."}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <span className="text-xs font-medium text-slate-400">
                                    {format(new Date(doc.createdAt), "MMM d, yyyy")}
                                </span>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => triggerDownload(doc.fileUrl, doc.name, false)}
                                        className="h-8 w-8 rounded-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600"
                                        title="View Document"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => triggerDownload(doc.fileUrl, doc.name, true)}
                                        className="h-8 w-8 rounded-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    {canManage && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => handleDelete(doc.id)}
                                            className="h-8 w-8 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* EXQUISITE UPLOAD MODAL */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border border-slate-200/60 rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-white/80 backdrop-blur-3xl">
                    
                    {/* Header with gradient mesh */}
                    <div className="relative pt-8 pb-6 px-8 border-b border-slate-100/80 bg-gradient-to-b from-indigo-50/50 to-transparent">
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-md" />
                        <DialogHeader className="relative z-10">
                            <div className="flex items-center gap-4 mb-1">
                                <div className="w-10 h-10 rounded-[14px] bg-indigo-600 shadow-lg shadow-indigo-600/20 flex items-center justify-center">
                                    <UploadCloud className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Upload Resource</DialogTitle>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Company Distribution</p>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="px-8 py-6 space-y-6 bg-white">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Document Title</Label>
                            <Input 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Code of Conduct 2026"
                                className="h-12 bg-transparent border-slate-200/80 rounded-2xl text-[13px] font-medium text-slate-900 placeholder:text-slate-300 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Classification</Label>
                            <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                                <SelectTrigger className="h-12 bg-transparent border-slate-200/80 rounded-2xl text-[13px] font-medium text-slate-900 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl shadow-slate-200/40">
                                    <SelectItem value="Policy" className="rounded-xl focus:bg-indigo-50 focus:text-indigo-700 py-2.5">Policy & Procedure</SelectItem>
                                    <SelectItem value="Form" className="rounded-xl focus:bg-indigo-50 focus:text-indigo-700 py-2.5">Standard Form</SelectItem>
                                    <SelectItem value="Guide" className="rounded-xl focus:bg-indigo-50 focus:text-indigo-700 py-2.5">Manual / Guide</SelectItem>
                                    <SelectItem value="General" className="rounded-xl focus:bg-indigo-50 focus:text-indigo-700 py-2.5">General Resource</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Executive Summary</Label>
                            <Textarea 
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="Brief summary of the contents..."
                                className="resize-none bg-transparent border-slate-200/80 rounded-2xl text-[13px] font-medium text-slate-900 placeholder:text-slate-300 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all shadow-sm"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                Target File
                                {formData.fileUrl && <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3" /> Attached</span>}
                            </Label>
                            <div className="group border-2 border-dashed border-slate-200/80 rounded-3xl p-8 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-300 transition-all duration-300 relative overflow-hidden">
                                <input 
                                    type="file" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="flex flex-col items-center justify-center gap-3 relative z-0">
                                    {formData.fileUrl ? (
                                        <div className="w-14 h-14 rounded-[18px] bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100/50 scale-in-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 rounded-[18px] bg-white border border-slate-200/80 text-slate-400 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:text-indigo-500 group-hover:border-indigo-200 transition-all duration-300">
                                            <UploadCloud className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <p className="text-[13px] font-bold text-slate-700">
                                            {formData.fileUrl ? "File loaded securely" : "Drag & drop or click to browse"}
                                        </p>
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                                            PDF, DOCX, XLSX, TXT (Max 5MB)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100/80 flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsUploadOpen(false)} className="h-11 rounded-2xl px-6 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all">
                            Cancel
                        </Button>
                        <Button onClick={handleUpload} disabled={uploading} className="h-11 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white px-8 text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:shadow-indigo-500/30 transition-all">
                            {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Share2 className="w-4 h-4 mr-2" />
                            )}
                            {uploading ? 'Publishing...' : 'Distribute'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
