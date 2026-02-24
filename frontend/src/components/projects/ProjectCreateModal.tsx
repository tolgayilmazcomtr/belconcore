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
import { PlusCircle, Loader2 } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(2, "Proje adı en az 2 karakter olmalıdır"),
    code: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    planned_budget: z.string().optional(),
})

export function ProjectCreateModal() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { projects, setProjects } = useAppStore()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            code: "",
            start_date: "",
            end_date: "",
            planned_budget: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const payload = {
                ...values,
                planned_budget: values.planned_budget ? parseFloat(values.planned_budget) : null
            };

            const response = await api.post("/projects", payload)

            // Zustand state güncellemesi
            if (response.data && response.data.data) {
                setProjects([response.data.data, ...projects])
            }

            toast.success("Mükemmel!", {
                description: "Yeni proje başarıyla oluşturuldu.",
            })

            setOpen(false)
            form.reset()
        } catch (error: any) {
            toast.error("Hata", {
                description: error.response?.data?.message || "Proje oluşturulurken bir hata meydana geldi.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                    <PlusCircle className="mr-2 h-4 w-4" /> Yeni Proje
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Proje Ekle</DialogTitle>
                    <DialogDescription>
                        Sisteme yeni bir proje tanımlayın. Daha sonra proje içerisine Blok ve Üniteleri ekleyebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Proje Adı</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn: Belcon Life Sitesi" {...field} />
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
                                    <FormLabel>Proje Kodu (Opsiyonel)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn: BLIFE" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Başlangıç Tarihi</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="end_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bitiş Tarihi</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="planned_budget"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Planlanan Bütçe (TL)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
