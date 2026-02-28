"use client"

import { useEffect, useState } from "react"
import { useProjectStore } from "@/store/useProjectStore"
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
import { Search, MoreHorizontal, Building } from "lucide-react"
import { BlockCreateModal } from "@/components/blocks/BlockCreateModal"

export default function BlocksPage() {
    const { activeProject, blocks, setBlocks } = useProjectStore()
    const [loading, setLoading] = useState(false)

    // API'den Blokları Getir
    useEffect(() => {
        const fetchBlocks = async () => {
            if (!activeProject) return;

            setLoading(true)
            try {
                // Backend Middleware'i active_project_id'yi Header'dan bekliyor (Veya Axios Interceptor ayarlandıysa otomatik gider)
                // axios.defaults.headers.common['X-Project-Id'] = activeProject.id;
                // Biz şu anlık varsayalım ki Interceptor'ımız bunu ekliyor.
                const response = await api.get('/blocks')
                setBlocks(response.data?.data || response.data || [])
            } catch (error) {
                console.error("Bloklar yüklenirken hata oluştu:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchBlocks()
    }, [activeProject, setBlocks])

    if (!activeProject) {
        return (
            <div className="flex-1 bg-[#f0f2f5] h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-8 rounded shadow-sm border border-slate-200 max-w-md w-full">
                    <Building className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">Proje Seçilmemiş</h3>
                    <p className="text-[13px] text-slate-500 mb-6">Blok/Bina yönetimi yapabilmek için lütfen üst menüden çalışmak istediğiniz projeyi seçiniz.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-0 bg-[#f0f2f5] h-full flex flex-col">
            {/* Odoo Style Control Panel */}
            <div className="bg-white px-4 py-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-slate-800">
                        {activeProject.name} <span className="text-slate-400 font-normal text-sm ml-2">/ Bloklar</span>
                    </h2>
                    <div className="flex items-center space-x-2">
                        <BlockCreateModal />
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
                            placeholder="Blok Ara..."
                            className="h-8 w-[200px] lg:w-[300px] border border-slate-300 rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pl-9 pr-3 text-[13px] bg-slate-50 focus:bg-white transition-colors"
                        />
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600 border border-transparent hover:border-slate-200 bg-white">
                        <Search className="mr-1.5 h-3.5 w-3.5 opacity-0 w-0" /> Filtreler
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600 border border-transparent hover:border-slate-200 bg-white">
                        <Search className="mr-1.5 h-3.5 w-3.5 opacity-0 w-0" /> Grupla
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
                                    <TableHead className="w-[120px] font-semibold text-slate-600">BLOK KODU</TableHead>
                                    <TableHead className="font-semibold text-slate-600">BLOK ADI</TableHead>
                                    <TableHead className="w-[150px] font-semibold text-slate-600">PARSEL / ADA</TableHead>
                                    <TableHead className="text-center w-[120px] font-semibold text-slate-600">ÜNİTE SAYISI</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            Bloklar Yükleniyor...
                                        </TableCell>
                                    </TableRow>
                                ) : blocks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            Seçili projeye ait hiç blok tanımlanmamış.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    blocks.map((block: any) => (
                                        <TableRow key={block.id} className="cursor-pointer hover:bg-slate-50 transition-colors group">
                                            <TableCell className="border-r-0"><input type="checkbox" className="rounded border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" /></TableCell>
                                            <TableCell className="font-medium text-primary">{block.code || '-'}</TableCell>
                                            <TableCell className="text-slate-700 font-medium">{block.name}</TableCell>
                                            <TableCell className="text-slate-500 text-[13px]">{block.parcel_island || '-'}</TableCell>
                                            <TableCell className="text-center font-mono text-slate-600">{block.units_count || 0}</TableCell>
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
