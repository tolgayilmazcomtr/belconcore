"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import api from "@/lib/api"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Building2, Loader2 } from "lucide-react"

export function ProjectSelector() {
    const { projects, setProjects, activeProject, setActiveProject } = useAppStore()
    const [loading, setLoading] = useState(false)

    // Bileşen mount olduğunda eğer projeler boşsa çek
    useEffect(() => {
        const fetchProjects = async () => {
            if (projects.length > 0) return;
            setLoading(true)
            try {
                const response = await api.get('/projects')
                const data = response.data?.data || response.data || []
                setProjects(data)

                // Eğer projeler çekildiyse ve aktif proje yoksa ilkini seç
                if (data.length > 0 && !activeProject) {
                    setActiveProject(data[0])
                }
            } catch (error) {
                console.error("Projeler yüklenemedi:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProjects()
    }, [projects.length, setProjects, activeProject, setActiveProject])

    // Değişim Yöneticisi
    const handleValueChange = (projectId: string) => {
        const selected = projects.find(p => p.id === Number(projectId))
        if (selected) {
            setActiveProject(selected)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-md border border-white/20 text-white/70 text-[13px] min-w-[200px]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Projeler Yükleniyor...</span>
            </div>
        )
    }

    return (
        <div className="flex items-center">
            <Select
                value={activeProject ? activeProject.id.toString() : ""}
                onValueChange={handleValueChange}
                disabled={projects.length === 0}
            >
                <SelectTrigger className="w-[200px] h-8 bg-white/10 flex items-center border-white/20 text-white data-[placeholder]:text-white disabled:opacity-100 disabled:bg-white/10 hover:bg-white/20 transition-colors focus:ring-1 focus:ring-white/30 truncate [&_svg]:!text-white [&_svg]:!opacity-100 font-medium">
                    <div className="flex items-center gap-2 truncate">
                        <Building2 className="h-4 w-4 shrink-0 text-white" />
                        <SelectValue placeholder={projects.length === 0 ? "Proje Bulunamadı" : "Proje Seçin"} />
                    </div>
                </SelectTrigger>
                <SelectContent align="start" className="min-w-[200px]">
                    {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()} className="text-[13px]">
                            {project.code ? `[${project.code}] ` : ''}{project.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
