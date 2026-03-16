'use client';

import React, { useState, useEffect } from 'react';
import { Customer, Lead, Unit } from '@/types/project.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import api from '@/lib/api';
import { toast } from 'sonner';
import { useCrmStore } from '@/store/useCrmStore';
import { useProjectStore } from '@/store/useProjectStore';
import { Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface LeadCreateModalProps {
    editLead?: Lead;
    trigger?: React.ReactNode;
}

export function LeadCreateModal({ editLead, trigger }: LeadCreateModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { activeProject } = useProjectStore();
    const { leads, setLeads, customers } = useCrmStore();
    const [units, setUnits] = useState<Unit[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        customer_id: '',
        unit_id: '',
        source: '',
        expected_value: '',
        description: '',
        status: 'new' as Lead['status'],
    });

    useEffect(() => {
        if (activeProject && isOpen) {
            // Fetch units for the project to link to lead
            api.get('/units', {
                params: { active_project_id: activeProject.id }
            }).then(res => setUnits(res.data.data || [])).catch(() => { });
        }
    }, [activeProject, isOpen]);

    useEffect(() => {
        if (editLead && isOpen) {
            setFormData({
                title: editLead.title || '',
                customer_id: editLead.customer_id?.toString() || '',
                unit_id: editLead.unit_id?.toString() || '',
                source: editLead.source || '',
                expected_value: editLead.expected_value?.toString() || '',
                description: editLead.description || '',
                status: editLead.status || 'new',
            });
        } else if (!isOpen) {
            setFormData({
                title: '',
                customer_id: '',
                unit_id: '',
                source: '',
                expected_value: '',
                description: '',
                status: 'new',
            });
        }
    }, [editLead, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject) {
            toast.error('Aktif proje seçilmemiş.');
            return;
        }

        setIsLoading(true);

        const payload = {
            ...formData,
            customer_id: formData.customer_id && formData.customer_id !== 'none' ? parseInt(formData.customer_id) : null,
            unit_id: formData.unit_id && formData.unit_id !== 'none' ? parseInt(formData.unit_id) : null,
            expected_value: formData.expected_value ? parseFloat(formData.expected_value) : null,
            active_project_id: activeProject.id
        };

        try {
            if (editLead) {
                const response = await api.put(`/leads/${editLead.id}`, payload);
                setLeads(leads.map(l => l.id === editLead.id ? response.data.data : l));
                toast.success('Fırsat başarıyla güncellendi.');
            } else {
                const response = await api.post('/leads', payload);
                setLeads([...leads, response.data.data]);
                toast.success('Yeni fırsat başarıyla oluşturuldu.');
            }
            setIsOpen(false);
        } catch (error: any) {
            toast.error('İşlem başarısız', {
                description: error.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button className="h-9 font-medium shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Fırsat
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden gap-0">
                <div className="bg-slate-50 border-b px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-slate-800">
                            {editLead ? 'Fırsatı Düzenle' : 'Yeni Fırsat Ekle'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            Potansiyel satış fırsatı detaylarını doldurun.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Fırsat Başlığı <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Örn: A Blok Kat 3 Daire 12 İlgileniyor"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Müşteri Seçimi</Label>
                                <Select
                                    value={formData.customer_id}
                                    onValueChange={(val: any) => setFormData({ ...formData, customer_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Müşteri Seçin (Opsiyonel)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-slate-400 italic">Müşteri Seçilmedi</SelectItem>
                                        {customers?.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {c.type === 'corporate' ? c.company_name : `${c.first_name} ${c.last_name}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Birim / Daire İlgisi</Label>
                                <Select
                                    value={formData.unit_id}
                                    onValueChange={(val: any) => setFormData({ ...formData, unit_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Birim Seçin (Opsiyonel)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-slate-400 italic">Birim Seçilmedi</SelectItem>
                                        {units?.map(u => (
                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                {(u as any).block?.name} - No: {u.unit_no}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expected_value">Beklenen Tutar (₺)</Label>
                                <Input
                                    id="expected_value"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.expected_value}
                                    onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="source">Kaynak (Nasıl Ulaştı?)</Label>
                                <Select
                                    value={formData.source}
                                    onValueChange={(val: any) => setFormData({ ...formData, source: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kaynak Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="web">Web Sitesi</SelectItem>
                                        <SelectItem value="referral">Referans</SelectItem>
                                        <SelectItem value="social">Sosyal Medya</SelectItem>
                                        <SelectItem value="phone">Telefon Araması</SelectItem>
                                        <SelectItem value="walk_in">Direkt Geldi</SelectItem>
                                        <SelectItem value="other">Diğer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {!editLead && (
                            <div className="space-y-2">
                                <Label>Durum</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val: any) => setFormData({ ...formData, status: val as Lead['status'] })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Durum Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">Yeni</SelectItem>
                                        <SelectItem value="contacted">İletişim Kuruldu</SelectItem>
                                        <SelectItem value="qualified">Uygun Bulundu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="description">Açıklama / Notlar</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Görüşme veya fırsat hakkında ek bilgiler..."
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                    </div>
                </form>

                <div className="bg-slate-50 border-t px-6 py-4 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsOpen(false)} type="button">
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="min-w-[120px]">
                        {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
