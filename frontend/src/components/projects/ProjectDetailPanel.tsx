import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BuildingIcon, Save, Loader2 } from 'lucide-react';
import { Project } from '@/types/project.types';

const formSchema = z.object({
    name: z.string().min(2, "Proje adı en az 2 karakter olmalıdır"),
    code: z.string().optional(),
    planned_budget: z.string().optional(),
});

interface ProjectDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProjectDetailPanel({ isOpen, onClose }: ProjectDetailPanelProps) {
    const { activeProject, projects, setProjects, setActiveProject } = useProjectStore();
    const [loading, setLoading] = useState(false);
    const isEditing = !!activeProject;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            code: "",
            planned_budget: "",
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (activeProject) {
                form.reset({
                    name: activeProject.name || "",
                    code: activeProject.code || "",
                    planned_budget: activeProject.planned_budget ? activeProject.planned_budget.toString() : "",
                });
            } else {
                form.reset({
                    name: "",
                    code: "",
                    planned_budget: "",
                });
            }
        }
    }, [isOpen, activeProject, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const payload: Record<string, any> = {
                name: values.name,
            };
            if (values.code) payload.code = values.code;
            if (values.planned_budget) payload.planned_budget = parseFloat(values.planned_budget);

            let returnedProject: Project;

            if (isEditing) {
                const response = await api.put(`/projects/${activeProject.id}`, payload);
                returnedProject = response.data?.data || response.data;
                setProjects(projects.map(p => p.id === returnedProject.id ? returnedProject : p));
                setActiveProject(returnedProject);
                toast.success("Güncellendi", { description: "Proje başarıyla güncellendi." });
            } else {
                const response = await api.post("/projects", payload);
                returnedProject = response.data?.data || response.data;
                setProjects([returnedProject, ...projects]);
                toast.success("Oluşturuldu", { description: "Yeni proje başarıyla eklendi." });
            }

            onClose();
        } catch (error: any) {
            toast.error("Hata", {
                description: error.response?.data?.message || "İşlem sırasında bir hata oluştu.",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] border-l sm:max-w-none flex flex-col h-full bg-background overflow-y-auto">
                <SheetHeader className="border-b pb-6 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-md">
                            <BuildingIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">
                                {isEditing ? activeProject?.name : 'Yeni Proje Oluştur'}
                            </SheetTitle>
                            <SheetDescription>
                                {isEditing
                                    ? 'Proje detaylarını güncelleyebilir veya alt bileşenleri yönetebilirsiniz.'
                                    : 'Sisteme yeni bir proje kaydı ekleyin.'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 h-full min-h-0">
                        <div className="flex-1 py-6 space-y-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proje Kodu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Örn: PRJ-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proje Adı</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Örn: Belcon Tower" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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

                            {isEditing && (
                                <div className="mt-8 pt-8 border-t">
                                    <h3 className="text-lg font-semibold mb-4">Bloklar ve Üniteler</h3>
                                    <p className="text-sm text-muted-foreground">Seçili projenin bloklarını ve ünitelerini yönetmek için eklentiler buraya gelecek.</p>
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-4 pb-2 shrink-0 flex justify-end gap-2 bg-background">
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                {isEditing ? 'Güncelle' : 'Kaydet'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
