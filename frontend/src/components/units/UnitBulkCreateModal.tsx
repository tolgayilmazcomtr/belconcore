"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
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
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ListPlus, Loader2, Trash2 } from "lucide-react"

const unitSchema = z.object({
    block_id: z.string().optional(),
    unit_no: z.string().min(1, "Zorunlu"),
    floor_no: z.string().optional(),
    unit_type: z.string().min(1, "Zorunlu"),
    gross_area: z.string().optional(),
    net_area: z.string().optional(),
    status: z.enum(["available", "sold", "reserved", "not_for_sale"]),
    list_price: z.string().optional(),
})

const formSchema = z.object({
    units: z.array(unitSchema).min(1, "En az bir ünite girmelisiniz."),
})

export function UnitBulkCreateModal() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [rowCountInput, setRowCountInput] = useState<string>("5")
    const { activeProject, units, setUnits, blocks, setBlocks } = useProjectStore()

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
            units: [
                { block_id: "none", unit_no: "", floor_no: "", unit_type: "2+1", gross_area: "", net_area: "", status: "available", list_price: "" }
            ],
        },
    })

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "units",
    })

    const generateRows = () => {
        const count = parseInt(rowCountInput)
        if (isNaN(count) || count < 1 || count > 200) {
            toast.error("Lütfen 1 ile 200 arasında bir sayı girin.")
            return
        }

        const currentData = form.getValues().units;
        const lastRow = currentData.length > 0 ? currentData[currentData.length - 1] : {
            block_id: "none",
            unit_no: "",
            floor_no: "",
            unit_type: "2+1",
            gross_area: "",
            net_area: "",
            status: "available" as const,
            list_price: ""
        };

        const newRows = Array.from({ length: count }).map((_, i) => ({
            block_id: lastRow.block_id || "none",
            unit_no: "", // Boş bırakıyoruz ki kendisi doldursun
            floor_no: lastRow.floor_no || "",
            unit_type: lastRow.unit_type || "2+1",
            gross_area: lastRow.gross_area || "",
            net_area: lastRow.net_area || "",
            status: "available" as any,
            list_price: lastRow.list_price || "",
        }))

        replace(newRows)
    }

    // Modal açıldığında state resetle
    useEffect(() => {
        if (open) {
            replace([{ block_id: "none", unit_no: "", floor_no: "", unit_type: "2+1", gross_area: "", net_area: "", status: "available", list_price: "" }])
            setRowCountInput("5")
        }
    }, [open, replace])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!activeProject) return;

        setLoading(true)
        try {
            const formattedUnits = values.units.map(u => {
                const payload: any = {
                    unit_no: u.unit_no,
                    unit_type: u.unit_type,
                    status: u.status,
                };
                if (u.block_id && u.block_id !== "none") payload.block_id = parseInt(u.block_id);
                if (u.floor_no) payload.floor_no = u.floor_no;
                if (u.gross_area) payload.gross_area = parseFloat(u.gross_area);
                if (u.net_area) payload.net_area = parseFloat(u.net_area);
                if (u.list_price) payload.list_price = parseFloat(u.list_price);
                return payload;
            });

            const response = await api.post("/units/bulk", { units: formattedUnits })

            if (response.data && response.data.data) {
                const newUnits = response.data.data;
                // Add new units to the top
                setUnits([...newUnits, ...units])
            }

            toast.success("Mükemmel!", {
                description: `${formattedUnits.length} adet yeni ünite başarıyla oluşturuldu.`,
            })

            setOpen(false)
            form.reset()
        } catch (error: any) {
            toast.error("Hata", {
                description: error.response?.data?.message || "Ekleme sırasında bir hata meydana geldi.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-white hover:bg-slate-50 shadow-sm h-8 px-3 text-primary border-primary/20">
                    <ListPlus className="mr-1.5 h-4 w-4" /> Toplu Ünite Ekle
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[7xl] w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-[#f8f9fa]">
                <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">Toplu Ünite (Daire) Girişi</DialogTitle>
                            <DialogDescription className="mt-1">
                                <strong>{activeProject?.name}</strong> projesine hızlıca birden çok ünite tanımlayın. Odoo/SAP tarzı hücre içi veri girişi.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-100 rounded-md p-1 border">
                                <Input
                                    className="w-16 h-8 text-center bg-white"
                                    value={rowCountInput}
                                    onChange={e => setRowCountInput(e.target.value)}
                                    placeholder="Adet"
                                />
                                <Button type="button" variant="ghost" size="sm" className="h-8 px-3 ml-1 bg-white hover:bg-slate-50 shadow-sm border border-slate-200" onClick={generateRows}>
                                    Satır Oluştur
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-4 relative">
                    <Form {...form}>
                        <form id="bulk-unit-form" onSubmit={form.handleSubmit(onSubmit)} className="min-w-max border rounded-md shadow-sm bg-white overflow-hidden">
                            <table className="w-full text-sm text-left align-middle">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-3 py-2.5 font-semibold w-12 text-center">#</th>
                                        <th className="px-3 py-2.5 font-semibold w-48">Blok</th>
                                        <th className="px-3 py-2.5 font-semibold w-32">Kapı No *</th>
                                        <th className="px-3 py-2.5 font-semibold w-32">Kat</th>
                                        <th className="px-3 py-2.5 font-semibold w-32">Tipi *</th>
                                        <th className="px-3 py-2.5 font-semibold w-32">Brüt (m²)</th>
                                        <th className="px-3 py-2.5 font-semibold w-32">Net (m²)</th>
                                        <th className="px-3 py-2.5 font-semibold w-40">Durum *</th>
                                        <th className="px-3 py-2.5 font-semibold w-40">Fiyat (TL)</th>
                                        <th className="px-3 py-2.5 font-semibold w-12 text-center">Sil</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {fields.map((field, index) => (
                                        <tr key={field.id} className="hover:bg-blue-50/30 group">
                                            <td className="px-2 py-1.5 text-center text-slate-400 font-medium">{index + 1}</td>
                                            <td className="px-2 py-1.5">
                                                <FormField control={form.control} name={`units.${index}.block_id`} render={({ field }) => (
                                                    <FormItem className="space-y-0"><FormControl>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-8 shadow-none border-transparent hover:border-slate-200 focus:border-primary focus:ring-1 rounded-sm"><SelectValue placeholder="Seçim" /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="none">Yok (Bağımsız)</SelectItem>
                                                                {blocks.map(b => (
                                                                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl></FormItem>
                                                )} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <FormField control={form.control} name={`units.${index}.unit_no`} render={({ field }) => (
                                                    <FormItem className="space-y-0"><FormControl>
                                                        <Input placeholder="Kapı No" className="h-8 shadow-none border-transparent hover:border-slate-200 focus-visible:ring-1 rounded-sm" {...field} />
                                                    </FormControl></FormItem>
                                                )} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <FormField control={form.control} name={`units.${index}.floor_no`} render={({ field }) => (
                                                    <FormItem className="space-y-0"><FormControl>
                                                        <Input placeholder="Kat" className="h-8 shadow-none border-transparent hover:border-slate-200 focus-visible:ring-1 rounded-sm" {...field} />
                                                    </FormControl></FormItem>
                                                )} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <FormField control={form.control} name={`units.${index}.unit_type`} render={({ field }) => (
                                                    <FormItem className="space-y-0"><FormControl>
                                                        <Input placeholder="3+1" className="h-8 shadow-none border-transparent hover:border-slate-200 focus-visible:ring-1 rounded-sm" {...field} />
                                                    </FormControl></FormItem>
                                                )} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <FormField control={form.control} name={`units.${index}.gross_area`} render={({ field }) => (
                                                    <FormItem className="space-y-0"><FormControl>
                                                        <Input type="number" step="0.01" placeholder="0" className="h-8 shadow-none border-transparent hover:border-slate-200 focus-visible:ring-1 rounded-sm" {...field} />
                                                    </FormControl></FormItem>
                                                )} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <FormField control={form.control} name={`units.${index}.net_area`} render={({ field }) => (
                                                    <FormItem className="space-y-0"><FormControl>
                                                        <Input type="number" step="0.01" placeholder="0" className="h-8 shadow-none border-transparent hover:border-slate-200 focus-visible:ring-1 rounded-sm" {...field} />
                                                    </FormControl></FormItem>
                                                )} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <FormField control={form.control} name={`units.${index}.status`} render={({ field }) => (
                                                    <FormItem className="space-y-0"><FormControl>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-8 shadow-none border-transparent hover:border-slate-200 focus:border-primary focus:ring-1 rounded-sm"><SelectValue placeholder="Seçim" /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="available">Satışa Uygun</SelectItem>
                                                                <SelectItem value="reserved">Rezerve</SelectItem>
                                                                <SelectItem value="sold">Satıldı</SelectItem>
                                                                <SelectItem value="not_for_sale">Satışa Kapalı</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl></FormItem>
                                                )} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <FormField control={form.control} name={`units.${index}.list_price`} render={({ field }) => (
                                                    <FormItem className="space-y-0"><FormControl>
                                                        <Input type="number" step="0.01" placeholder="0.00" className="h-8 shadow-none border-transparent hover:border-slate-200 focus-visible:ring-1 text-right font-medium rounded-sm" {...field} />
                                                    </FormControl></FormItem>
                                                )} />
                                            </td>
                                            <td className="px-2 py-1.5 text-center">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => remove(index)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {fields.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="text-center py-8 text-slate-500">
                                                Satır oluşturulmadı. Üstteki kutucuğa sayı girerek "Satır Oluştur" butonuna basabilirsiniz.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {/* We output only 1 global error if any items have nested errors */}
                            {Object.keys(form.formState.errors).length > 0 && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm border-t border-red-100 flex items-center">
                                    <span className="font-semibold mr-2">Hata:</span> Lütfen zorunlu alanları (Kapı No, Tip, Durum) doldurduğunuzdan emin olun.
                                </div>
                            )}
                        </form>
                    </Form>
                </div>

                <div className="px-6 py-4 border-t bg-white shrink-0 flex items-center justify-between">
                    <div className="text-sm text-slate-500 flex items-center">
                        <span className="font-medium text-slate-700 mr-2">İpucu:</span> Satırlar arasında hızlıca gezinmek için "Tab" tuşunu kullanabilirsiniz.
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="shadow-sm" onClick={() => setOpen(false)} disabled={loading}>
                            İptal
                        </Button>
                        <Button type="submit" form="bulk-unit-form" className="shadow-sm min-w-[120px]" disabled={loading || fields.length === 0}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {fields.length} Üniteyi Kaydet
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
