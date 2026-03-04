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
import { Plus, Loader2, Edit2 } from "lucide-react"
import { Block } from "@/types/project.types"

const formSchema = z.object({
    name: z.string().min(1, "Blok adı boş bırakılamaz"),
    code: z.string().optional(),
    parcel_island: z.string().optional(),
})

interface BlockCreateModalProps {
    editBlock?: Block;
    trigger?: React.ReactNode;
}

export function BlockCreateModal({ editBlock, trigger }: BlockCreateModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { activeProject, blocks, setBlocks } = useProjectStore()
    const isEditing = !!editBlock;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            code: "",
            parcel_island: "",
        },
    })

    useEffect(() => {
        if (open) {
            if (editBlock) {
                form.reset({
                    name: editBlock.name || "",
                    code: editBlock.code || "",
                    parcel_island: editBlock.parcel_island || "",
                })
            } else {
                form.reset({
                    name: "",
                    code: "",
                    parcel_island: "",
                })
            }
        }
    }, [open, editBlock, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!activeProject) {
            toast.error("Hata", { description: "Lütfen önce bir proje seçin." })
            return
        }

        setLoading(true)
        try {
            const payload: Record<string, string | number> = {
                name: values.name,
                active_project_id: activeProject.id
            };

            if (values.code) payload.code = values.code;
            if (values.parcel_island) payload.parcel_island = values.parcel_island;

            let returnedBlock: Block;

            if (isEditing) {
                const response = await api.put(`/blocks/${editBlock.id}`, payload);
                returnedBlock = response.data?.data || response.data;
                setBlocks(blocks.map(b => b.id === returnedBlock.id ? returnedBlock : b));
                toast.success("Güncellendi", { description: "Blok başarıyla güncellendi." });
            } else {
                const response = await api.post("/blocks", payload);
                returnedBlock = response.data?.data || response.data;
                setBlocks([returnedBlock, ...blocks]);
                toast.success("Oluşturuldu", { description: "Yeni blok başarıyla oluşturuldu." });
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
                        {isEditing ? 'Düzenle' : 'Yeni Blok'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Blok Düzenle' : 'Yeni Blok Ekle'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Seçili blok bilgilerini güncelleyin.' : <strong>{activeProject?.name}</strong>}
                        {!isEditing && ' projesine yeni bir blok/bina tanımlayın.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Blok / Bina Adı</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn: A Blok, Yakut, G-2" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Blok Kodu (Opsiyonel)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn: BLK-A" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="parcel_island"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ada / Parsel Bilgisi (Opsiyonel)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn: 125/4" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
