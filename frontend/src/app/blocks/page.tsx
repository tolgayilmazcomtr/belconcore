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
import { BlockList } from "@/components/blocks/BlockList"

export default function BlocksPage() {
    const { activeProject, blocks, setBlocks } = useProjectStore()
    const [loading, setLoading] = useState(false)

    // API'den Blokları Getir
    useEffect(() => {
        const fetchBlocks = async () => {
            if (!activeProject) return;

            setLoading(true)
            try {
                // We pass project_id directly because we want robust filtering
                const response = await api.get('/blocks', {
                    params: { project_id: activeProject.id }
                })
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
        <div className="flex-1 space-y-0 bg-[#f0f2f5] h-full flex flex-col p-6 gap-6">
            {/* Odoo Style Control Panel */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 group flex items-center gap-2">
                        {activeProject.name} <span className="text-slate-400 font-normal">/</span> Bloklar
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Seçilen projeye ait tüm blok (bina) verilerini yönetin.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <BlockCreateModal />
                </div>
            </div>

            <div className="flex-1 w-full relative min-h-0 h-full pb-6">
                {loading ? (
                    <div className="flex items-center justify-center bg-white rounded-md border h-full w-full">
                        <span className="text-slate-500">Bloklar Yükleniyor...</span>
                    </div>
                ) : (
                    <BlockList blocks={blocks} projectName={activeProject.name} />
                )}
            </div>
        </div>
    )
}
