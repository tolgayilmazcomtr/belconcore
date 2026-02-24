"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import api from "@/lib/api"
import { useAppStore } from "@/store/useAppStore"
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
import { Plus, Loader2 } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(2, "Blok adı en az 2 karakter olmalıdır"),
    code: z.string().optional(),
    parcel_island: z.string().optional(),
})

export function BlockCreateModal() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { activeProject, blocks, setBlocks } = useAppStore()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            code: "",
            parcel_island: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!activeProject) {
            toast.error("Hata", { description: "Lütfen önce bir proje seçin." })
            return
        }

        setLoading(true)
        try {
            const payload: Record<string, any> = {
                name: values.name,
                active_project_id: activeProject.id
            };

            if (values.code) payload.code = values.code;
            if (values.parcel_island) payload.parcel_island = values.parcel_island;

            const response = await api.post("/blocks", payload)

            // Zustand state güncellemesi
            if (response.data && response.data.data) {
                setBlocks([response.data.data, ...blocks])
            }

            toast.success("Mükemmel!", {
                description: "Yeni blok başarıyla oluşturuldu.",
            })

            setOpen(false)
            form.reset()
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            toast.error("Hata", {
                description: err.response?.data?.message || "Blok oluşturulurken bir hata meydana geldi.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-sm h-8 px-3">
                    <Plus className="mr-1.5 h-4 w-4" /> Yeni Blok
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Blok Ekle</DialogTitle>
                    <DialogDescription>
                        <strong>{activeProject?.name}</strong> projesine yeni bir blok/bina tanımlayın.
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
                                Kaydet
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
