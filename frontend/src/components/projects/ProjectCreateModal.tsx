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
import { PlusCircle, Loader2, Edit2 } from "lucide-react"
import { Project } from "@/types/project.types"

const formSchema = z.object({
    name: z.string().min(2, "Proje adı en az 2 karakter olmalıdır"),
    code: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    planned_budget: z.string().optional(),
})

interface ProjectCreateModalProps {
    editProject?: Project;
    trigger?: React.ReactNode;
}

export function ProjectCreateModal({ editProject, trigger }: ProjectCreateModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { projects, setProjects } = useProjectStore()
    const isEditing = !!editProject;

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

    useEffect(() => {
        if (open) {
            if (editProject) {
                form.reset({
                    name: editProject.name || "",
                    code: editProject.code || "",
                    start_date: editProject.start_date || "",
                    end_date: editProject.end_date || "",
                    planned_budget: editProject.planned_budget ? editProject.planned_budget.toString() : "",
                })
            } else {
                form.reset({
                    name: "",
                    code: "",
                    start_date: "",
                    end_date: "",
                    planned_budget: "",
                })
            }
        }
    }, [open, editProject, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const payload: Record<string, any> = {
                name: values.name,
            };

            if (values.code) payload.code = values.code;
            if (values.start_date) payload.start_date = values.start_date;
            if (values.end_date) payload.end_date = values.end_date;
            if (values.planned_budget) payload.planned_budget = parseFloat(values.planned_budget);

            if (isEditing) {
                const response = await api.put(`/projects/${editProject.id}`, payload);
                const updatedProject = response.data?.data || response.data;
                setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                toast.success("Güncellendi", { description: "Proje başarıyla güncellendi." });
            } else {
                const response = await api.post("/projects", payload);
                const newProject = response.data?.data || response.data;
                setProjects([newProject, ...projects]);
                toast.success("Oluşturuldu", { description: "Yeni proje başarıyla oluşturuldu." });
            }

            setOpen(false)
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error("Hata", {
                description: err.response?.data?.message || "İşlem sırasında bir hata meydana geldi.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button className="bg-primary hover:bg-primary/90">
                        {isEditing ? <Edit2 className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        {isEditing ? 'Düzenle' : 'Yeni Proje'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Proje Düzenle' : 'Yeni Proje Ekle'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Seçili proje bilgilerini güncelleyin.' : 'Sisteme yeni bir proje tanımlayın. Daha sonra proje içerisine Blok ve Üniteleri ekleyebilirsiniz.'}
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
                                {isEditing ? 'Güncelle' : 'Kaydet'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
