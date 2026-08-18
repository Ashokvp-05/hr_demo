"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Pencil, MoreVertical, Briefcase, Loader2, RefreshCcw, Building2, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Placeholder Data based on screenshot
const initialProjects = [
    { id: 1, org: "Rudratic_Technologies", repo: "AI-PAM-1", employees: ["Viswa", "Sam", "Vijay V2j", "Shyam", "Arunkumar_Dev", "Sneha", "ramesh", "vishnu"] },
    { id: 2, org: "Rudratic_Technologies", repo: "Swot-DAM", employees: ["Seeni", "Arunkumar_Dev"] },
    { id: 3, org: "Rudratic_Technologies", repo: "Website", employees: ["Sivalinkam S", "vishnu"] },
    { id: 4, org: "Rudratic_Technologies", repo: "Scuba-Gear", employees: ["vishnu", "Viswa", "Sam"] }
]

export default function ProjectsModule({ token }: { token: string }) {
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState(initialProjects)
    
    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editProject, setEditProject] = useState<any>(null)

    // Form states
    const [formData, setFormData] = useState({ org: "", repo: "", employees: "" })

    const handleRefresh = async () => {
        setLoading(true)
        // Simulate real-time fetch delay
        await new Promise(r => setTimeout(r, 800))
        setLoading(false)
        toast.success("Projects synchronized")
    }

    const filtered = projects.filter(p => 
        p.repo.toLowerCase().includes(search.toLowerCase()) || 
        p.org.toLowerCase().includes(search.toLowerCase())
    )

    const handleAddSubmit = () => {
        if (!formData.repo || !formData.org) return toast.error("Repository and Organization are required")
        const newProject = {
            id: projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1,
            org: formData.org,
            repo: formData.repo,
            employees: formData.employees.split(",").map(e => e.trim()).filter(Boolean)
        }
        setProjects([newProject, ...projects])
        setFormData({ org: "", repo: "", employees: "" })
        setIsAddOpen(false)
        toast.success("Project Created successfully!")
    }

    const handleEditSubmit = () => {
        if (!editProject.repo) return toast.error("Repository name is required")
        
        // Handle conversion if employees is edited as string
        const updatedProject = { ...editProject }
        if (typeof updatedProject.employees === 'string') {
            updatedProject.employees = (updatedProject.employees as string).split(",").map(e => e.trim()).filter(Boolean)
        }
        
        setProjects(projects.map(p => p.id === editProject.id ? updatedProject : p))
        setEditProject(null)
        toast.success("Project Updated successfully!")
    }

    const handleDelete = (id: number) => {
        setProjects(projects.filter(p => p.id !== id))
        toast.success("Project Deleted!")
    }

    const openAddModal = () => {
        setFormData({ org: "Rudratic_Technologies", repo: "", employees: "" })
        setIsAddOpen(true)
    }

    return (
        <div className="min-h-full font-body pb-20 relative overflow-hidden bg-white/50">
            {/* Subtle Background Accent */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/20 to-transparent pointer-events-none" />

            <div className="max-w-[1500px] mx-auto space-y-6 relative z-10 px-6 lg:px-8 py-8">
                
                {/* ── TOP HEADER (Title & Actions) ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-2 border-indigo-600 pb-6">
                    <div>
                        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight font-brand">Projects</h1>
                        <p className="text-[13px] font-medium text-slate-500 mt-1">List of all projects in the organization.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <div className="relative group w-full sm:w-[250px] md:w-[300px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <Input 
                                placeholder="Search projects..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 pl-10 bg-white border-slate-200/80 rounded-lg text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-indigo-100 transition-all shadow-sm w-full"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={handleRefresh} variant="outline" className="h-10 w-10 p-0 rounded-lg shrink-0 text-slate-500 hover:text-indigo-600 border-slate-200/80 bg-white shadow-sm">
                                <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                            </Button>
                            <Button onClick={openAddModal} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold transition-all shadow-sm shrink-0 whitespace-nowrap">
                                <Plus className="w-4 h-4 mr-2 text-white" />
                                New Project
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── PROJECTS TABLE ── */}
                <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden relative">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="py-5 px-6 text-[14px] font-bold text-slate-800 w-20">S.No</th>
                                    <th className="py-5 px-6 text-[14px] font-bold text-slate-800">Organization</th>
                                    <th className="py-5 px-6 text-[14px] font-bold text-slate-800">Repository Name</th>
                                    <th className="py-5 px-6 text-[14px] font-bold text-slate-800">Employee Name</th>
                                    <th className="py-5 px-6 text-[14px] font-bold text-slate-800 w-28 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                                            <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Loading Projects...</p>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center text-slate-500">
                                            No projects found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((project, idx) => (
                                        <tr 
                                            key={project.id}
                                            className="hover:bg-slate-50/50 transition-colors group animate-in fade-in slide-in-from-bottom-2 duration-300"
                                            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "both" }}
                                        >
                                            <td className="py-5 px-6 text-[15px] font-semibold text-slate-900">{idx + 1}</td>
                                            <td className="py-5 px-6 text-[15px] font-semibold text-slate-700">{project.org}</td>
                                            <td className="py-5 px-6 text-[15px] font-bold text-indigo-600">{project.repo}</td>
                                            <td className="py-5 px-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {project.employees.map((emp: string, i: number) => (
                                                        <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-medium text-[13px] px-3 py-1 shadow-none rounded-md">
                                                            {emp}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => setEditProject(project)} className="w-9 h-9 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all">
                                                        <Pencil className="w-[18px] h-[18px]" />
                                                    </button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all">
                                                                <MoreVertical className="w-[18px] h-[18px]" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                            <DropdownMenuItem onClick={() => setEditProject(project)} className="text-[12px] cursor-pointer"><Pencil className="w-3.5 h-3.5 mr-2" /> Edit Project</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-[12px] text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                                                                Delete Project
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── MODALS ── */}
                
                {/* ADD MODAL */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="bg-white border-none text-slate-900 sm:max-w-[500px] rounded-[24px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold font-brand tracking-tight">Create New Project</DialogTitle>
                            <DialogDescription className="text-[13px] text-slate-500">Fill in the details to add a new project to your organization.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-slate-700">Organization</Label>
                                <Input value={formData.org} onChange={e => setFormData({...formData, org: e.target.value})} placeholder="e.g. Rudratic_Technologies" className="bg-slate-50/50 border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-slate-700">Repository Name</Label>
                                <Input value={formData.repo} onChange={e => setFormData({...formData, repo: e.target.value})} placeholder="e.g. AI-PAM-1" className="bg-slate-50/50 border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-slate-700">Employees (comma separated)</Label>
                                <Input value={formData.employees} onChange={e => setFormData({...formData, employees: e.target.value})} placeholder="e.g. Viswa, Sam, Sneha" className="bg-slate-50/50 border-slate-200" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl border-slate-200">Cancel</Button>
                            <Button onClick={handleAddSubmit} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">Add Project</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* EDIT MODAL */}
                <Dialog open={!!editProject} onOpenChange={(open) => !open && setEditProject(null)}>
                    <DialogContent className="bg-white border-none text-slate-900 sm:max-w-[500px] rounded-[24px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold font-brand tracking-tight">Edit Project</DialogTitle>
                            <DialogDescription className="text-[13px] text-slate-500">Update details for {editProject?.repo}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-slate-700">Organization</Label>
                                <Input value={editProject?.org || ""} onChange={e => setEditProject({...editProject, org: e.target.value})} className="bg-slate-50/50 border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-slate-700">Repository Name</Label>
                                <Input value={editProject?.repo || ""} onChange={e => setEditProject({...editProject, repo: e.target.value})} className="bg-slate-50/50 border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-slate-700">Employees (comma separated)</Label>
                                <Input value={Array.isArray(editProject?.employees) ? editProject.employees.join(", ") : editProject?.employees || ""} onChange={e => setEditProject({...editProject, employees: e.target.value})} className="bg-slate-50/50 border-slate-200" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditProject(null)} className="rounded-xl border-slate-200">Cancel</Button>
                            <Button onClick={handleEditSubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    )
}
