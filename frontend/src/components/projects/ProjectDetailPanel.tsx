import React from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BuildingIcon, Save } from 'lucide-react';

interface ProjectDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProjectDetailPanel({ isOpen, onClose }: ProjectDetailPanelProps) {
    const { activeProject } = useProjectStore();
    const isEditing = !!activeProject;

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

                <div className="flex-1 py-6 space-y-6">
                    {/* Dummy Form (We can integrate react-hook-form here later) */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Proje Kodu</Label>
                            <Input id="code" defaultValue={activeProject?.code || ''} placeholder="Örn: PRJ-001" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Proje Adı</Label>
                            <Input id="name" defaultValue={activeProject?.name || ''} placeholder="Örn: Belcon Tower" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="budget">Planlanan Bütçe</Label>
                            <Input id="budget" type="number" defaultValue={activeProject?.planned_budget || ''} placeholder="0.00" />
                        </div>

                        {/* We will add Tabs here later for Blocks / Units if isEditing is true */}
                        {isEditing && (
                            <div className="mt-8 pt-8 border-t">
                                <h3 className="text-lg font-semibold mb-4">Bloklar ve Üniteler</h3>
                                <p className="text-sm text-muted-foreground">Seçili projenin bloklarını ve ünitelerini yönetmek için eklentiler buraya gelecek.</p>
                                {/* To be implemented: BlocksList */}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t pt-4 pb-2 shrink-0 flex justify-end gap-2 bg-background">
                    <Button variant="outline" onClick={onClose}>İptal</Button>
                    <Button>
                        <Save className="w-4 h-4 mr-2" />
                        {isEditing ? 'Güncelle' : 'Kaydet'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
