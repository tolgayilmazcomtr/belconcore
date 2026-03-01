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
import { BuildingIcon, Save, Loader2, Info, Building2, Home } from 'lucide-react';
import { Project } from '@/types/project.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockList } from '@/components/blocks/BlockList';
import { UnitList } from '@/components/units/UnitList';

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
    const { activeProject, projects, setProjects, setActiveProject, blocks, units, setBlocks, setUnits } = useProjectStore();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
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

                // Fetch blocks and units for this project when opened
                const fetchSubData = async () => {
                    setFetchingData(true);
                    try {
                        const [blocksRes, unitsRes] = await Promise.all([
                            api.get('/blocks', { params: { project_id: activeProject.id } }),
                            api.get('/units', { params: { project_id: activeProject.id } })
                        ]);
                        setBlocks(blocksRes.data?.data || blocksRes.data || []);
                        setUnits(unitsRes.data?.data || unitsRes.data || []);
                    } catch (error) {
                        console.error("Proje alt verileri yüklenemedi", error);
                    } finally {
                        setFetchingData(false);
                    }
                };
                fetchSubData();

            } else {
                form.reset({
                    name: "",
                    code: "",
                    planned_budget: "",
                });
                setBlocks([]);
                setUnits([]);
            }
        }
    }, [isOpen, activeProject, form, setBlocks, setUnits]);

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
            {/* Geniş ERP Tarzı Panel */}
            <SheetContent className="w-full sm:max-w-[700px] md:max-w-[1000px] xl:max-w-[1200px] border-l sm:max-w-none flex flex-col h-full bg-[#f8f9fa] p-0 overflow-hidden">
                <SheetHeader className="border-b px-6 py-5 shrink-0 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20">
                            <BuildingIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-2xl font-bold tracking-tight text-slate-800">
                                {isEditing ? activeProject?.name : 'Yeni Proje Oluştur'}
                            </SheetTitle>
                            <SheetDescription className="text-sm mt-0.5">
                                {isEditing
                                    ? 'Proje detaylarını güncelleyebilir veya alt bileşenleri (bloklar, üniteler) yönetebilirsiniz.'
                                    : 'Sisteme yeni bir proje kaydı ekleyin.'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs defaultValue="details" className="w-full h-full flex flex-col">
                        <TabsList className="w-full justify-start border-b rounded-none px-6 h-14 bg-white shrink-0 shadow-sm z-10">
                            <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:text-primary rounded-none px-4 h-full text-slate-600 font-medium">
                                <Info className="w-4 h-4 mr-2" /> Genel Detaylar
                            </TabsTrigger>
                            {isEditing && (
                                <>
                                    <TabsTrigger value="blocks" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:text-primary rounded-none px-4 h-full text-slate-600 font-medium disabled:opacity-50" disabled={fetchingData}>
                                        <Building2 className="w-4 h-4 mr-2" /> Bloklar ({blocks.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="units" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:text-primary rounded-none px-4 h-full text-slate-600 font-medium disabled:opacity-50" disabled={fetchingData}>
                                        <Home className="w-4 h-4 mr-2" /> Üniteler ({units.length})
                                    </TabsTrigger>
                                </>
                            )}
                        </TabsList>

                        <TabsContent value="details" className="flex-1 overflow-y-auto m-0 p-6 bg-[#f8f9fa] h-full focus-visible:outline-none">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full bg-white p-6 rounded-lg border shadow-sm max-w-2xl">
                                    <div className="flex-1 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="code"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-slate-700 font-semibold">Proje Kodu</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Örn: PRJ-001" className="bg-slate-50 focus:bg-white transition-colors" {...field} />
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
                                                        <FormLabel className="text-slate-700 font-semibold">Planlanan Bütçe (TL)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.01" placeholder="0.00" className="bg-slate-50 focus:bg-white transition-colors" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-700 font-semibold">Proje Adı</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Örn: Belcon Tower" className="bg-slate-50 focus:bg-white transition-colors" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="pt-8 mt-auto flex justify-end gap-3">
                                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="w-24">
                                            İptal
                                        </Button>
                                        <Button type="submit" disabled={loading} className="w-32 shadow-sm">
                                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                            {isEditing ? 'Güncelle' : 'Kaydet'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>

                        {isEditing && (
                            <>
                                <TabsContent value="blocks" className="flex-1 overflow-auto m-0 p-6 bg-[#f0f2f5] h-full focus-visible:outline-none flex flex-col min-h-0">
                                    <div className="flex-1 rounded-lg border bg-background shadow-sm overflow-hidden flex flex-col">
                                        <BlockList blocks={blocks} projectName={activeProject.name} />
                                    </div>
                                </TabsContent>
                                <TabsContent value="units" className="flex-1 overflow-auto m-0 p-6 bg-[#f0f2f5] h-full focus-visible:outline-none flex flex-col min-h-0">
                                    <div className="flex-1 rounded-lg border bg-background shadow-sm overflow-hidden flex flex-col">
                                        <UnitList units={units} projectName={activeProject.name} />
                                    </div>
                                </TabsContent>
                            </>
                        )}
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
