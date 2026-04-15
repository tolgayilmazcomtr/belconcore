'use client';

import React, { useState, useEffect } from 'react';
import { Offer, Lead, Unit } from '@/types/project.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Calculator, FileText } from 'lucide-react';
import { PaymentPlanBuilder } from './PaymentPlanBuilder';

interface OfferCreateModalProps {
    lead: Lead;
    editOffer?: Offer;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function OfferCreateModal({ lead, editOffer, trigger, onSuccess }: OfferCreateModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { activeProject } = useProjectStore();
    const { offers, setOffers } = useCrmStore();
    const [units, setUnits] = useState<Unit[]>([]);

    const [formData, setFormData] = useState({
        offer_no: '',
        valid_until: '',
        status: 'draft' as Offer['status'],
        unit_id: lead.unit_id?.toString() || '',
        base_price: '',
        discount_amount: '',
        final_price: '',
        payment_plan: '',
        notes: '',
    });

    // Auto calculate final price based on discount
    useEffect(() => {
        const base = parseFloat(formData.base_price) || 0;
        const discount = parseFloat(formData.discount_amount) || 0;
        const final = base - discount;
        if (final !== parseFloat(formData.final_price)) {
            setFormData(prev => ({ ...prev, final_price: final > 0 ? final.toString() : '0' }));
        }
    }, [formData.base_price, formData.discount_amount]);

    useEffect(() => {
        if (activeProject && isOpen) {
            api.get('/units', {
                params: { active_project_id: activeProject.id }
            }).then(res => setUnits(Array.isArray(res.data) ? res.data : (res.data.data || []))).catch(() => { });
        }
    }, [activeProject, isOpen]);

    useEffect(() => {
        if (editOffer && isOpen) {
            setFormData({
                offer_no: editOffer.offer_no || '',
                valid_until: editOffer.valid_until ? editOffer.valid_until.substring(0, 10) : '',
                status: editOffer.status || 'draft',
                unit_id: editOffer.unit_id?.toString() || '',
                base_price: editOffer.base_price?.toString() || '',
                discount_amount: editOffer.discount_amount?.toString() || '',
                final_price: editOffer.final_price?.toString() || '',
                payment_plan: editOffer.payment_plan || '',
                notes: editOffer.notes || '',
            });
        } else if (!isOpen) {
            // Auto populate base price if lead has a unit and we fetch unit list?
            let defaultBasePrice = lead.expected_value?.toString() || '';
            const existingUnit = units.find(u => u.id === lead.unit_id);
            if (existingUnit && existingUnit.list_price) {
                defaultBasePrice = existingUnit.list_price.toString();
            }

            setFormData({
                offer_no: `TKF-${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}-${Math.floor(Math.random() * 1000)}`,
                valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days default
                status: 'draft',
                unit_id: lead.unit_id?.toString() || '',
                base_price: defaultBasePrice,
                discount_amount: '0',
                final_price: defaultBasePrice,
                payment_plan: '',
                notes: 'Belirtilen fiyatlar KDV dahildir.\nTeklif onaylandığında sözleşme aşamasına geçilecektir.',
            });
        }
    }, [editOffer, isOpen, lead, units]);

    const handleUnitSelect = (val: string) => {
        const u = units.find(unit => unit.id.toString() === val);
        if (u && u.list_price) {
            setFormData(prev => ({ ...prev, unit_id: val, base_price: u.list_price!.toString() }));
        } else {
            setFormData(prev => ({ ...prev, unit_id: val }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject) return;

        setIsLoading(true);

        const payload = {
            ...formData,
            customer_id: lead.customer_id,
            lead_id: lead.id,
            unit_id: formData.unit_id && formData.unit_id !== 'none' ? parseInt(formData.unit_id) : null,
            base_price: parseFloat(formData.base_price) || 0,
            discount_amount: parseFloat(formData.discount_amount) || 0,
            final_price: parseFloat(formData.final_price) || 0,
            active_project_id: activeProject.id
        };

        try {
            if (editOffer) {
                const response = await api.put(`/offers/${editOffer.id}`, payload);
                setOffers(offers.map(o => o.id === editOffer.id ? response.data.data : o));
                toast.success('Teklif güncellendi.');
            } else {
                const response = await api.post('/offers', payload);
                setOffers([response.data.data, ...offers]);
                toast.success('Teklif oluşturuldu.');
            }
            if (onSuccess) onSuccess();
            setIsOpen(false);
        } catch (error: any) {
            toast.error('Kayıt başarısız', {
                description: error.response?.data?.message || 'Bir hata oluştu.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline" className="h-9">
                        <FileText className="mr-2 h-4 w-4" />
                        Teklif Hazırla
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
                <div className="bg-slate-50 border-b px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-slate-800 flex items-center">
                            <Calculator className="w-5 h-5 mr-2 text-primary" />
                            {editOffer ? 'Teklifi Düzenle' : "Yeni Teklif Hazırla"}
                        </DialogTitle>
                        <DialogDescription>
                            {lead.title} fırsatı için teklif fiyatlarını ve ödeme planını oluşturun.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Sol Kolon: Ünite ve Bilgiler */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Birim / Gayrimenkul</Label>
                                <Select
                                    value={formData.unit_id}
                                    onValueChange={handleUnitSelect}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Birim Seçin (Opsiyonel)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-slate-400 italic">Birim Seçilmedi</SelectItem>
                                        {units.filter(u => u.status === 'available').length > 0 && (
                                            <div className="px-2 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50">Satışa Açık</div>
                                        )}
                                        {units.filter(u => u.status === 'available').map(u => (
                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                                                    {(u as any).block?.name} - No: {u.unit_no}{u.unit_type ? ` · ${u.unit_type}` : ''}{u.list_price ? ` · ${Number(u.list_price).toLocaleString('tr-TR')} ₺` : ''}
                                                </span>
                                            </SelectItem>
                                        ))}
                                        {units.filter(u => u.status === 'reserved').length > 0 && (
                                            <div className="px-2 py-1 text-xs font-semibold text-amber-600 bg-amber-50">Rezerve</div>
                                        )}
                                        {units.filter(u => u.status === 'reserved').map(u => (
                                            <SelectItem key={u.id} value={u.id.toString()} className="text-amber-700">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" />
                                                    {(u as any).block?.name} - No: {u.unit_no}{u.unit_type ? ` · ${u.unit_type}` : ''}{u.list_price ? ` · ${Number(u.list_price).toLocaleString('tr-TR')} ₺` : ''}
                                                </span>
                                            </SelectItem>
                                        ))}
                                        {units.filter(u => u.status === 'sold').length > 0 && (
                                            <div className="px-2 py-1 text-xs font-semibold text-red-500 bg-red-50">Satıldı</div>
                                        )}
                                        {units.filter(u => u.status === 'sold').map(u => (
                                            <SelectItem key={u.id} value={u.id.toString()} className="text-slate-400">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block shrink-0" />
                                                    {(u as any).block?.name} - No: {u.unit_no} · <span className="line-through text-xs">Satıldı</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formData.unit_id && formData.unit_id !== 'none' && (() => {
                                    const sel = units.find(u => u.id.toString() === formData.unit_id);
                                    if (!sel) return null;
                                    const cfg: Record<string, { label: string; cls: string }> = {
                                        available: { label: 'Satışa Açık', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                                        reserved: { label: 'Rezerve', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
                                        sold: { label: 'Satıldı', cls: 'bg-red-100 text-red-600 border-red-300' },
                                        maintenance: { label: 'Bakımda', cls: 'bg-slate-100 text-slate-500 border-slate-300' },
                                        not_for_sale: { label: 'Satışa Kapalı', cls: 'bg-slate-100 text-slate-400 border-slate-200' },
                                    };
                                    const c = cfg[sel.status] ?? cfg.not_for_sale;
                                    return <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium mt-1 ${c.cls}`}>{c.label}</span>;
                                })()}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Teklif No</Label>
                                    <Input
                                        value={formData.offer_no}
                                        onChange={(e) => setFormData({ ...formData, offer_no: e.target.value })}
                                        placeholder="Otomatik"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Geçerlilik Tarihi</Label>
                                    <Input
                                        type="date"
                                        value={formData.valid_until}
                                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Durum</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Durum Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Taslak</SelectItem>
                                        <SelectItem value="sent">Gönderildi</SelectItem>
                                        <SelectItem value="accepted">Kabul Edildi</SelectItem>
                                        <SelectItem value="rejected">Reddedildi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Sağ Kolon: Fiyatlandırma */}
                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h3 className="font-medium text-slate-800 border-b pb-2 mb-2">Fiyatlandırma</h3>
                            <div className="space-y-2">
                                <Label>Liste/Baz Fiyatı (₺)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.base_price}
                                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                                    required
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>İndirim Tutarı (₺)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.discount_amount}
                                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                                    className="bg-white border-red-200 focus-visible:ring-red-500"
                                />
                            </div>
                            <div className="space-y-2 pt-2 border-t">
                                <Label className="text-primary font-bold">Net Teklif Fiyatı (₺)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.final_price}
                                    onChange={(e) => setFormData({ ...formData, final_price: e.target.value })}
                                    required
                                    className="bg-emerald-50 border-emerald-200 text-emerald-700 font-bold text-lg h-12"
                                />
                            </div>
                        </div>
                    </div>

                    <PaymentPlanBuilder
                        finalPrice={parseFloat(formData.final_price) || 0}
                        offerDate={new Date().toISOString().split('T')[0]}
                        value={formData.payment_plan}
                        onChange={v => setFormData(prev => ({ ...prev, payment_plan: v }))}
                    />

                    <div className="space-y-2">
                        <Label>Özel Notlar (PDF'te Görünür)</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Teklife eklenecek notlar..."
                            rows={3}
                        />
                    </div>

                </form>

                <div className="bg-slate-50 border-t px-6 py-4 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsOpen(false)} type="button">
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="min-w-[120px]">
                        {isLoading ? 'Kaydediliyor...' : 'Teklifi Kaydet'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
