"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import api from "@/lib/api"
import { useProjectStore } from "@/store/useProjectStore"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Edit2 } from "lucide-react"
import { Unit } from "@/types/project.types"

const formSchema = z.object({
    block_id: z.string().optional(),
    unit_no: z.string().min(1, "Ünite numarası (Kapı No) zorunludur"),
    floor_no: z.string().optional(),
    unit_type: z.string().min(1, "Ünite tipi zorunludur (Örn: 2+1)"),
    gross_area: z.string().optional(),
    net_area: z.string().optional(),
    status: z.enum(["available", "sold", "reserved", "not_for_sale"]),
    list_price: z.string().optional(),
})

interface UnitCreateModalProps {
    editUnit?: Unit;
    trigger?: React.ReactNode;
}

export function UnitCreateModal({ editUnit, trigger }: UnitCreateModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { activeProject, units, setUnits, blocks, setBlocks } = useProjectStore()
    const isEditing = !!editUnit;

    // Yükleme sırasında blokları çek
    useEffect(() => {
        if (open && activeProject && blocks.length === 0) {
            api.get('/blocks', { params: { project_id: activeProject.id } })
                .then(res => setBlocks(res.data?.data || res.data || []))
                .catch(err => console.error("Bloklar yüklenemedi", err))
        }
    }, [open, activeProject, blocks.length, setBlocks])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            block_id: "none",
            unit_no: "",
            floor_no: "",
            unit_type: "",
            gross_area: "",
            net_area: "",
            status: "available",
            list_price: "",
        },
    })

    useEffect(() => {
        if (open) {
            if (editUnit) {
                form.reset({
                    block_id: editUnit.block_id ? editUnit.block_id.toString() : "none",
                    unit_no: editUnit.unit_no || "",
                    floor_no: editUnit.floor_no || "",
                    unit_type: editUnit.unit_type || "",
                    gross_area: editUnit.gross_area ? editUnit.gross_area.toString() : "",
                    net_area: editUnit.net_area ? editUnit.net_area.toString() : "",
                    status: (editUnit.status as any) || "available",
                    list_price: editUnit.list_price ? editUnit.list_price.toString() : "",
                })
            } else {
                form.reset({
                    block_id: "none",
                    unit_no: "",
                    floor_no: "",
                    unit_type: "",
                    gross_area: "",
                    net_area: "",
                    status: "available",
                    list_price: "",
                })
            }
        }
    }, [open, editUnit, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!activeProject) {
            toast.error("Hata", { description: "Lütfen önce bir proje seçin." })
            return
        }

        setLoading(true)
        try {
            const payload: Record<string, string | number> = {
                unit_no: values.unit_no,
                unit_type: values.unit_type,
                status: values.status,
                active_project_id: activeProject.id
            };

            if (values.block_id && values.block_id !== "none") payload.block_id = parseInt(values.block_id);
            if (values.floor_no) payload.floor_no = values.floor_no;
            if (values.gross_area) payload.gross_area = parseFloat(values.gross_area);
            if (values.net_area) payload.net_area = parseFloat(values.net_area);
            if (values.list_price) payload.list_price = parseFloat(values.list_price);

            let returnedUnit: Unit;

            if (isEditing) {
                const response = await api.put(`/units/${editUnit.id}`, payload);
                returnedUnit = response.data?.data || response.data;
                if (!returnedUnit.block && returnedUnit.block_id) {
                    returnedUnit.block = blocks.find(b => b.id === returnedUnit.block_id);
                }
                setUnits(units.map(u => u.id === returnedUnit.id ? returnedUnit : u));
                toast.success("Güncellendi", { description: "Ünite başarıyla güncellendi." });
            } else {
                const response = await api.post("/units", payload);
                returnedUnit = response.data?.data || response.data;
                if (!returnedUnit.block && returnedUnit.block_id) {
                    returnedUnit.block = blocks.find(b => b.id === returnedUnit.block_id);
                }
                setUnits([returnedUnit, ...units]);
                toast.success("Oluşturuldu", { description: "Yeni ünite başarıyla oluşturuldu." });
            }

            setOpen(false)
        } catch (error: any) {
            toast.error("Hata", {
                description: error.response?.data?.message || "İşlem sırasında bir hata oluştu.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button className="bg-primary hover:bg-primary/90 shadow-sm h-8 px-3">
                        {isEditing ? <Edit2 className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
                        {isEditing ? 'Düzenle' : 'Yeni Ünite'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Ünite Düzenle' : 'Yeni Ünite Ekle'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Seçili ünite bilgilerini güncelleyin.' : <strong>{activeProject?.name}</strong>}
                        {!isEditing && ' projesine yeni bir bağımsız bölüm (daire/dükkan) tanımlayın.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="block_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bağlı Blok (Opsiyonel)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Blok Seçin" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={"none"}>Blok Yok / Bağımsız</SelectItem>
                                                {blocks.map(block => (
                                                    <SelectItem key={block.id} value={block.id.toString()}>{block.name} (Kod: {block.code || '-'})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Durum</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Durum Seçin" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="available">Satışa Uygun</SelectItem>
                                                <SelectItem value="reserved">Rezerve</SelectItem>
                                                <SelectItem value="sold">Satıldı</SelectItem>
                                                <SelectItem value="not_for_sale">Satışa Kapalı</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="unit_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kapı No</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Örn: 24" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="floor_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kat Bilgisi</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Örn: 4. Kat" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="unit_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ünite Tipi</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Örn: 3+1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="list_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Liste Fiyatı (TL)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="gross_area"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brüt Alan (m²)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="net_area"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Net Alan (m²)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Güncelle' : 'Kaydet'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
