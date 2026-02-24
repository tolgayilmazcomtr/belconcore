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
                setProjects(response.data?.data || [])
            } catch (error) {
                console.error("Projeler yüklenirken hata oluştu:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProjects()
    }, [setProjects])

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Projeler</h2>
                <div className="flex items-center space-x-2">
                    <Button className="bg-primary hover:bg-primary/90">
                        <PlusCircle className="mr-2 h-4 w-4" /> Yeni Proje
                    </Button>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Proje Kodu</TableHead>
                            <TableHead>Proje Adı</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">Bütçe</TableHead>
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
