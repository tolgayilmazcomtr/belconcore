"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import api from "@/lib/api"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search, MoreHorizontal } from "lucide-react"
import { ProjectCreateModal } from "@/components/projects/ProjectCreateModal"

export default function ProjectsPage() {
    const { projects, setProjects } = useAppStore()
    const [loading, setLoading] = useState(false)

    // API'den Projeleri Getir (Sayfa Yüklendiğinde)
    useEffect(() => {
        // Gelecekte react-query ile değiştirilecek
        const fetchProjects = async () => {
            setLoading(true)
            try {
                const response = await api.get('/projects') // Paginator kullanıyorsak `response.data.data` dönecektir
                // Veritabanı henüz boşsa boş array atıyoruz
                setProjects(response.data?.data || response.data || [])
            } catch (error) {
                console.error("Projeler yüklenirken hata oluştu:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProjects()
    }, [setProjects])

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 bg-muted/10 h-full">
            <div className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm border">
                <h2 className="text-xl font-bold tracking-tight text-foreground/90">Projeler</h2>
                <div className="flex items-center space-x-2">
                    <ProjectCreateModal />
                </div>
            </div>

            <div className="bg-white border rounded-md shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Proje Kodu</TableHead>
                            <TableHead>Proje Adı</TableHead>
                            <TableHead className="w-[120px]">Durum</TableHead>
                            <TableHead className="text-right w-[150px]">Bütçe</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Projeler Yükleniyor...
                                </TableCell>
                            </TableRow>
                        ) : projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Henüz hiç proje oluşturulmamış. Sağ üstten yeni bir proje oluşturabilirsiniz.
                                </TableCell>
                            </TableRow>
                        ) : (
                            projects.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell className="font-medium">{project.code || '-'}</TableCell>
                                    <TableCell>{project.name}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs text-white ${project.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                                            }`}>
                                            {project.status || 'Aktif'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">-</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
