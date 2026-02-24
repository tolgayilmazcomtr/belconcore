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
import { Search, MoreHorizontal } from "lucide-react"
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
        <div className="flex-1 space-y-0 bg-[#f0f2f5] h-full flex flex-col">
            {/* Odoo Style Control Panel */}
            <div className="bg-white px-4 py-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-slate-800">Projeler</h2>
                    <div className="flex items-center space-x-2">
                        <ProjectCreateModal />
                        <Button variant="outline" size="sm" className="h-8 shadow-sm">
                            Dışa Aktar
                        </Button>
                    </div>
                </div>

                <div className="flex items-center w-full sm:w-auto space-x-2 overflow-x-auto pb-1 sm:pb-0">
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Proje Ara..."
                            className="h-8 w-[200px] lg:w-[300px] border border-slate-300 rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pl-9 pr-3 text-[13px] bg-slate-50 focus:bg-white transition-colors"
                        />
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600 border border-transparent hover:border-slate-200 bg-white">
                        <Search className="mr-1.5 h-3.5 w-3.5" /> Filtreler
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600 border border-transparent hover:border-slate-200 bg-white">
                        <Search className="mr-1.5 h-3.5 w-3.5 opacity-0 w-0" /> Grupla
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600 border border-transparent hover:border-slate-200 bg-white">
                        <Search className="mr-1.5 h-3.5 w-3.5 opacity-0 w-0" /> Favoriler
                    </Button>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-hidden flex flex-col">
                <div className="bg-white border rounded shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-auto flex-1">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[40px] border-r-0"><input type="checkbox" className="rounded border-slate-300" /></TableHead>
                                    <TableHead className="w-[120px] font-semibold text-slate-600">PROJE KODU</TableHead>
                                    <TableHead className="font-semibold text-slate-600">PROJE ADI</TableHead>
                                    <TableHead className="w-[120px] font-semibold text-slate-600">DURUM</TableHead>
                                    <TableHead className="text-right w-[150px] font-semibold text-slate-600">BÜTÇE</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            Projeler Yükleniyor...
                                        </TableCell>
                                    </TableRow>
                                ) : projects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            Henüz hiç proje oluşturulmamış. Yeni bir proje oluşturabilirsiniz.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    projects.map((project) => (
                                        <TableRow key={project.id} className="cursor-pointer hover:bg-slate-50 transition-colors group">
                                            <TableCell className="border-r-0"><input type="checkbox" className="rounded border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" /></TableCell>
                                            <TableCell className="font-medium text-primary">{project.code || '-'}</TableCell>
                                            <TableCell className="text-slate-700 font-medium">{project.name}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase ${project.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                    }`}>
                                                    {project.status || 'AKTİF'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-600">-</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
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
            </div>
        </div>
    )
}
