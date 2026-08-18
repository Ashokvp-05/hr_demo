"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Search, Plus, Sparkles, Award, TrendingUp, 
    Code2, Star, ChevronRight, Filter, Download, Edit, Trash2, Save, X, Minus, Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface EmployeeSkill {
    id: string
    employee: { name: string; role: string; avatar: string }
    technologies: string[]
    experience: string
    certifications: string[]
    learningProgress: number
    topSkill: string
}

export default function EmployeeSkills({ token }: { token: string }) {
    const API = process.env.NEXT_PUBLIC_API_URL
    const [skills, setSkills] = useState<EmployeeSkill[]>([])
    const [loading, setLoading] = useState(true)

    const fetchSkills = useCallback(async () => {
        try {
            const res = await fetch(`${API}/skills`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) {
                const data = await res.json()
                setSkills(Array.isArray(data) ? data : [])
            }
        } catch (err) { console.error('Failed to fetch skills:', err) }
        finally { setLoading(false) }
    }, [token, API])

    useEffect(() => { fetchSkills() }, [fetchSkills])
    const [searchQuery, setSearchQuery] = useState("")

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    
    // Form State (using string representations for arrays to make editing easier)
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        role: "",
        technologies: "",
        topSkill: "",
        experience: "",
        certifications: "",
        learningProgress: 0
    })

    const filteredEmployees = skills.filter(emp => 
        emp.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.technologies.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const openAddModal = () => {
        setFormData({ id: "", name: "", role: "", technologies: "", topSkill: "", experience: "", certifications: "", learningProgress: 0 })
        setIsEditing(false)
        setIsModalOpen(true)
    }

    const openEditModal = (e: React.MouseEvent, emp: EmployeeSkill) => {
        e.stopPropagation()
        setFormData({
            id: emp.id,
            name: emp.employee.name,
            role: emp.employee.role,
            technologies: emp.technologies.join(", "),
            topSkill: emp.topSkill,
            experience: emp.experience,
            certifications: emp.certifications.join(", "),
            learningProgress: emp.learningProgress
        })
        setIsEditing(true)
        setIsModalOpen(true)
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (confirm("Are you sure you want to remove this employee's skills matrix?")) {
            try {
                const res = await fetch(`${API}/skills/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                if (res.ok) {
                    setSkills(prev => prev.filter(s => s.id !== id))
                    toast.success("Skills matrix removed.")
                } else { toast.error("Failed to delete") }
            } catch { toast.error("Delete failed") }
        }
    }

    const handleSave = async () => {
        if (!formData.name || !formData.role) {
            toast.error("Employee Name and Role are required.")
            return
        }

        const payload = {
            employee: { name: formData.name, role: formData.role, avatar: formData.name.charAt(0).toUpperCase() },
            technologies: formData.technologies.split(",").map(t => t.trim()).filter(Boolean),
            topSkill: formData.topSkill.trim(),
            experience: formData.experience,
            certifications: formData.certifications.split(",").map(c => c.trim()).filter(Boolean),
            learningProgress: Number(formData.learningProgress) || 0
        }

        try {
            if (isEditing) {
                const res = await fetch(`${API}/skills/${formData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
                if (res.ok) { await fetchSkills(); toast.success("Skills matrix updated.") }
                else { toast.error("Failed to update") }
            } else {
                const res = await fetch(`${API}/skills`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
                if (res.ok) { await fetchSkills(); toast.success("New skills matrix added.") }
                else { toast.error("Failed to create") }
            }
        } catch { toast.error("Save failed") }
        setIsModalOpen(false)
    }

    // Handlers for Tag Inputs
    const handleAddTechnology = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            const val = e.currentTarget.value.trim()
            if (val) {
                const current = formData.technologies ? formData.technologies.split(",").map(t=>t.trim()) : []
                if (!current.includes(val)) {
                    setFormData({ ...formData, technologies: [...current, val].join(", ") })
                }
                e.currentTarget.value = ""
            }
        }
    }

    const handleRemoveTechnology = (techToRemove: string) => {
        const current = formData.technologies.split(",").map(t=>t.trim()).filter(t => t && t !== techToRemove)
        setFormData({ ...formData, technologies: current.join(", ") })
    }

    const handleAddCertification = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            const val = e.currentTarget.value.trim()
            if (val) {
                const current = formData.certifications ? formData.certifications.split(",").map(t=>t.trim()) : []
                if (!current.includes(val)) {
                    setFormData({ ...formData, certifications: [...current, val].join(", ") })
                }
                e.currentTarget.value = ""
            }
        }
    }

    const handleRemoveCertification = (certToRemove: string) => {
        const current = formData.certifications.split(",").map(t=>t.trim()).filter(t => t && t !== certToRemove)
        setFormData({ ...formData, certifications: current.join(", ") })
    }

    const handleExperienceChange = (delta: number) => {
        const currentExp = parseInt(formData.experience) || 0;
        const newExp = Math.max(0, currentExp + delta);
        setFormData({ ...formData, experience: `${newExp} Year${newExp !== 1 ? 's' : ''}` });
    }



    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* ── HEADER ── */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-brand">Employee Skills Matrix</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Track technologies, certifications, and learning progress across the team.
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or skill..."
                            className="pl-11 h-12 bg-slate-50/50 border-slate-200 rounded-xl text-[13px] font-medium"
                        />
                    </div>
                    <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-slate-900 text-white rounded-xl h-12 px-6 shadow-md shadow-indigo-600/20 transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Skills
                    </Button>
                </div>
            </header>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 bg-white border border-slate-200/60 rounded-[2rem] shadow-sm flex flex-col overflow-hidden relative">
                
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-6 px-10 py-5 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                    <div className="col-span-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        Employee Info
                    </div>
                    <div className="col-span-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5" />
                        Tech Stack
                    </div>
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Star className="w-3.5 h-3.5" />
                        Experience
                    </div>
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Award className="w-3.5 h-3.5" />
                        Certifications
                    </div>
                    <div className="col-span-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">
                        Actions
                    </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-100/80 overflow-y-auto">
                    <AnimatePresence>
                        {filteredEmployees.map((emp, index) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                key={emp.id} 
                                className="flex flex-col border-b border-slate-100/50 last:border-0"
                            >
                                {/* Main Row */}
                                <div 
                                    className="grid grid-cols-12 gap-6 px-10 py-6 items-center transition-colors group hover:bg-slate-50/50"
                                >
                                    {/* Employee Info */}
                                    <div className="col-span-3 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[16px] shadow-sm border border-indigo-100/50 group-hover:scale-110 transition-transform duration-300 shrink-0">
                                            {emp.employee.avatar}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-[15px] font-bold text-slate-900 leading-tight truncate">{emp.employee.name}</h3>
                                            <p className="text-[13px] font-medium text-slate-500 mt-0.5 truncate">{emp.employee.role}</p>
                                        </div>
                                    </div>

                                    {/* Skills / Tech */}
                                    <div className="col-span-4 flex flex-wrap gap-2 pr-4">
                                        {emp.technologies.length > 0 ? emp.technologies.slice(0, 3).map(tech => (
                                            <Badge 
                                                key={tech} 
                                                variant="secondary" 
                                                className={cn(
                                                    "rounded-lg px-3 py-1.5 text-[12px] font-bold border-none transition-all shadow-sm",
                                                    tech === emp.topSkill 
                                                        ? "bg-indigo-100/80 text-indigo-700 hover:bg-indigo-200" 
                                                        : "bg-slate-100/80 text-slate-600 hover:bg-slate-200"
                                                )}
                                            >
                                                {tech}
                                                {tech === emp.topSkill && <Star className="w-3.5 h-3.5 ml-1.5 inline-block text-amber-500" />}
                                            </Badge>
                                        )) : (
                                            <span className="text-[13px] font-medium text-slate-400 italic">No technologies listed</span>
                                        )}
                                        {emp.technologies.length > 3 && (
                                            <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-[12px] font-bold border-none bg-slate-100/80 text-slate-600 shadow-sm">
                                                +{emp.technologies.length - 3}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Experience */}
                                    <div className="col-span-2">
                                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 shadow-sm">
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[13px] font-bold text-slate-700">{emp.experience || "N/A"}</span>
                                        </div>
                                    </div>

                                    {/* Certifications */}
                                    <div className="col-span-2 flex flex-col justify-center gap-2 pr-2">
                                        {emp.certifications.length > 0 ? (
                                            <div className="flex items-center gap-2.5">
                                                <Award className="w-5 h-5 text-amber-500 shrink-0" />
                                                <span className="text-[13px] font-bold text-slate-700 truncate">
                                                    {emp.certifications[0]}
                                                </span>
                                                {emp.certifications.length > 1 && (
                                                    <span className="text-[11px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md shrink-0 shadow-sm border border-indigo-100">
                                                        +{emp.certifications.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[13px] font-medium text-slate-400 italic">No certs listed</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="outline" 
                                            onClick={(e) => { e.stopPropagation(); openEditModal(e, emp); }}
                                            className="h-10 w-10 p-0 rounded-xl text-slate-500 border-slate-200 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-sm transition-all"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(e, emp.id); }}
                                            className="h-10 w-10 p-0 rounded-xl text-rose-400 border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 hover:shadow-sm transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>


                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {filteredEmployees.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-[15px] font-medium text-slate-500">No employees found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── CREATE / EDIT MODAL ── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border border-slate-200/50 rounded-[32px] shadow-2xl bg-white">
                    <div className="relative pt-10 pb-8 px-10 border-b border-slate-100 bg-white">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent opacity-50" />
                        <DialogHeader className="relative z-10">
                            <div className="flex items-center gap-5 mb-2">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                                    {isEditing ? <Edit className="w-6 h-6 text-white relative z-10" /> : <Sparkles className="w-6 h-6 text-white relative z-10" />}
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                                        {isEditing ? "Update Matrix" : "New Matrix Entry"}
                                    </DialogTitle>
                                    <p className="text-[12px] font-bold text-indigo-600 uppercase tracking-[0.2em] mt-1">Employee Skills</p>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="px-10 py-8 space-y-7 bg-white relative z-10">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    Full Name
                                </label>
                                <Input 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. John Doe"
                                    className="h-12 bg-slate-50/50 border-slate-200/60 rounded-xl text-[14px] font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent transition-all"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    Job Role
                                </label>
                                <Input 
                                    value={formData.role}
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    placeholder="e.g. Frontend Engineer"
                                    className="h-12 bg-slate-50/50 border-slate-200/60 rounded-xl text-[14px] font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                                Core Technologies
                            </label>
                            <div className="min-h-[48px] p-1.5 bg-slate-50/50 border border-slate-200/60 rounded-xl flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                                {formData.technologies.split(",").map(t => t.trim()).filter(Boolean).map(tech => (
                                    <Badge key={tech} variant="secondary" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 gap-1 pr-1 font-semibold rounded-lg text-[12px] h-8">
                                        {tech}
                                        <button onClick={() => handleRemoveTechnology(tech)} className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-rose-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                                <input 
                                    onKeyDown={handleAddTechnology}
                                    placeholder={formData.technologies ? "Add more..." : "Type and press enter or comma"}
                                    className="flex-1 min-w-[150px] bg-transparent outline-none px-2 h-8 text-[13px] font-medium text-slate-800 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Star className="w-3.5 h-3.5 text-amber-400" />
                                    Top Skill
                                </label>
                                <Input 
                                    value={formData.topSkill}
                                    onChange={e => setFormData({...formData, topSkill: e.target.value})}
                                    placeholder="e.g. React"
                                    className="h-12 bg-slate-50/50 border-slate-200/60 rounded-xl text-[14px] font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent transition-all"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                    Experience
                                </label>
                                <div className="flex items-center h-12 bg-slate-50/50 border border-slate-200/60 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                                    <button 
                                        type="button"
                                        onClick={() => handleExperienceChange(-1)}
                                        className="h-full px-4 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors flex items-center justify-center active:bg-slate-300"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <div className="flex-1 flex items-center justify-center font-bold text-[14px] text-slate-800 bg-white h-full border-x border-slate-200/60 shadow-inner">
                                        {formData.experience || "0 Years"}
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => handleExperienceChange(1)}
                                        className="h-full px-4 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors flex items-center justify-center active:bg-slate-300"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Award className="w-3.5 h-3.5 text-purple-400" />
                                Certifications
                            </label>
                            <div className="min-h-[48px] p-1.5 bg-slate-50/50 border border-slate-200/60 rounded-xl flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                                {formData.certifications.split(",").map(t => t.trim()).filter(Boolean).map(cert => (
                                    <Badge key={cert} variant="secondary" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 gap-1 pr-1 font-semibold rounded-lg text-[12px] h-8">
                                        {cert}
                                        <button onClick={() => handleRemoveCertification(cert)} className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-rose-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                                <input 
                                    onKeyDown={handleAddCertification}
                                    placeholder={formData.certifications ? "Add more..." : "Type and press enter or comma"}
                                    className="flex-1 min-w-[150px] bg-transparent outline-none px-2 h-8 text-[13px] font-medium text-slate-800 placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-10 py-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-4">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="h-12 rounded-2xl px-6 text-[13px] font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="h-12 rounded-2xl bg-indigo-600 hover:bg-slate-900 text-white px-8 text-[13px] font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95">
                            <Save className="w-4 h-4 mr-2" />
                            {isEditing ? "Save Changes" : "Save Matrix"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
