'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Customer, Unit } from '@/types/project.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useCrmStore } from '@/store/useCrmStore';
import { useProjectStore } from '@/store/useProjectStore';
import { Calculator, Plus, Search, UserPlus, X, ChevronDown } from 'lucide-react';
import { Offer } from '@/types/project.types';

// ─── Quick customer add modal ─────────────────────────────────────────

interface QuickCustomerModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: (customer: Customer) => void;
}

function QuickCustomerModal({ open, onClose, onCreated }: QuickCustomerModalProps) {
    const { activeProject } = useProjectStore();
    const { customers, setCustomers } = useCrmStore();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        first_name: '', last_name: '', phone: '', email: '',
        type: 'individual' as 'individual' | 'corporate',
        company_name: '',
    });

    const handleSave = async () => {
        if (!activeProject) return;
        setLoading(true);
        try {
            const res = await api.post('/customers', {
                ...form,
                active_project_id: activeProject.id,
            });
            const newCustomer = res.data.data as Customer;
            setCustomers([...customers, newCustomer]);
            toast.success('Müşteri eklendi.');
            onCreated(newCustomer);
            onClose();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Müşteri eklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
                <div className="bg-slate-50 border-b px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-primary" /> Hızlı Müşteri Ekle
                        </DialogTitle>
                        <DialogDescription>Yeni müşteri kaydı oluşturup teklif oluşturmaya devam edin.</DialogDescription>
                    </DialogHeader>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {/* Type */}
                    <div className="flex gap-2">
                        {(['individual', 'corporate'] as const).map(t => (
                            <button key={t} type="button"
                                onClick={() => setForm(f => ({ ...f, type: t }))}
                                className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-all ${form.type === t ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/40'}`}>
                                {t === 'individual' ? 'Bireysel' : 'Kurumsal'}
                            </button>
                        ))}
                    </div>

                    {form.type === 'corporate' && (
                        <div className="space-y-2">
                            <Label>Şirket Adı <span className="text-red-500">*</span></Label>
                            <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Şirket adı" />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>Ad <span className="text-red-500">*</span></Label>
                            <Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Ad" />
                        </div>
                        <div className="space-y-2">
                            <Label>Soyad <span className="text-red-500">*</span></Label>
                            <Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Soyad" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>Telefon</Label>
                            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+90 5xx..." />
                        </div>
                        <div className="space-y-2">
                            <Label>E-posta</Label>
                            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="mail@..." />
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 border-t px-6 py-3 flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} type="button">İptal</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Kaydediliyor...' : 'Müşteri Ekle ve Devam Et'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Customer combobox ────────────────────────────────────────────────

interface CustomerComboboxProps {
    customers: Customer[];
    value: string;
    onChange: (customerId: string, customer?: Customer) => void;
    onAddNew: () => void;
}

function CustomerCombobox({ customers, value, onChange, onAddNew }: CustomerComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const selected = customers.find(c => c.id.toString() === value);
    const label = selected
        ? (selected.type === 'corporate' ? selected.company_name : `${selected.first_name} ${selected.last_name}`)
        : '';

    const filtered = customers.filter(c => {
        const name = c.type === 'corporate'
            ? (c.company_name ?? '')
            : `${c.first_name ?? ''} ${c.last_name ?? ''}`;
        return name.toLowerCase().includes(search.toLowerCase())
            || (c.phone ?? '').includes(search)
            || (c.email ?? '').toLowerCase().includes(search.toLowerCase());
    });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className={`truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
                        {selected ? label : 'Müşteri ara veya seç...'}
                    </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {selected && (
                        <span onClick={e => { e.stopPropagation(); onChange(''); }}
                            className="p-0.5 rounded-full text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                            <X className="w-3 h-3" />
                        </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
            </button>

            {open && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-2 border-b">
                        <Input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="İsim, telefon veya e-posta ara..."
                            className="h-8 text-sm"
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="text-xs text-slate-400 px-3 py-2.5">Sonuç bulunamadı</p>
                        ) : (
                            filtered?.map(c => {
                                const name = c.type === 'corporate' ? c.company_name : `${c.first_name} ${c.last_name}`;
                                return (
                                    <button key={c.id} type="button"
                                        onClick={() => { onChange(c.id.toString(), c); setOpen(false); setSearch(''); }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${value === c.id.toString() ? 'bg-primary/5 text-primary font-medium' : ''}`}>
                                        <div className="font-medium">{name}</div>
                                        {(c.phone || c.email) && (
                                            <div className="text-xs text-slate-400">{c.phone}{c.phone && c.email ? ' · ' : ''}{c.email}</div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <div className="border-t p-2">
                        <button type="button"
                            onClick={() => { setOpen(false); onAddNew(); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary font-medium rounded-lg hover:bg-primary/5 transition-colors">
                            <UserPlus className="w-3.5 h-3.5" />
                            Yeni Müşteri Ekle
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Standalone Offer Create Modal ──────────────────────────────

interface StandaloneOfferCreateModalProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function StandaloneOfferCreateModal({ trigger, onSuccess }: StandaloneOfferCreateModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickCustomer, setShowQuickCustomer] = useState(false);
    const { activeProject } = useProjectStore();
    const { offers, setOffers, customers } = useCrmStore();
    const [units, setUnits] = useState<Unit[]>([]);

    const [formData, setFormData] = useState({
        customer_id: '',
        offer_no: '',
        valid_until: '',
        status: 'draft' as Offer['status'],
        unit_id: '',
        base_price: '',
        discount_amount: '0',
        final_price: '',
        payment_plan: '',
        notes: '',
    });

    // Auto calculate final price
    useEffect(() => {
        const base = parseFloat(formData.base_price) || 0;
        const disc = parseFloat(formData.discount_amount) || 0;
        const fin = base - disc;
        setFormData(prev => ({ ...prev, final_price: fin >= 0 ? fin.toString() : '0' }));
    }, [formData.base_price, formData.discount_amount]);

    // Load units on open
    useEffect(() => {
        if (isOpen && activeProject) {
            api.get('/units', { params: { active_project_id: activeProject.id } })
                .then(r => setUnits(Array.isArray(r.data) ? r.data : (r.data.data || []))).catch(() => { });
        }
    }, [isOpen, activeProject]);

    // Reset form on open
    useEffect(() => {
        if (isOpen) {
            setFormData({
                customer_id: '',
                offer_no: `TKF-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
                valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'draft',
                unit_id: '',
                base_price: '',
                discount_amount: '0',
                final_price: '',
                payment_plan: '',
                notes: '',
            });
        }
    }, [isOpen]);

    const handleUnitSelect = (val: string) => {
        const u = units.find(u => u.id.toString() === val);
        if (u?.list_price) {
            setFormData(prev => ({ ...prev, unit_id: val, base_price: u.list_price!.toString() }));
        } else {
            setFormData(prev => ({ ...prev, unit_id: val }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject) return;
        if (!formData.customer_id) { toast.error('Lütfen bir müşteri seçin.'); return; }

        setIsLoading(true);
        try {
            const res = await api.post('/offers', {
                ...formData,
                customer_id: parseInt(formData.customer_id),
                unit_id: formData.unit_id && formData.unit_id !== 'none' ? parseInt(formData.unit_id) : null,
                base_price: parseFloat(formData.base_price) || 0,
                discount_amount: parseFloat(formData.discount_amount) || 0,
                final_price: parseFloat(formData.final_price) || 0,
                active_project_id: activeProject.id,
            });
            setOffers([res.data.data, ...offers]);
            toast.success('Teklif oluşturuldu.');
            onSuccess?.();
            setIsOpen(false);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Teklif kaydedilemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <QuickCustomerModal
                open={showQuickCustomer}
                onClose={() => setShowQuickCustomer(false)}
                onCreated={c => setFormData(prev => ({ ...prev, customer_id: c.id.toString() }))}
            />

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    {trigger ?? (
                        <Button className="h-9 font-medium shadow-sm">
                            <Plus className="mr-2 h-4 w-4" /> Yeni Teklif
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[820px] p-0 overflow-hidden">
                    <div className="bg-slate-50 border-b px-6 py-4">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-primary" />
                                Yeni Teklif Oluştur
                            </DialogTitle>
                            <DialogDescription>
                                Müşteri seçin, ünite ve fiyat bilgilerini doldurun.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[72vh] overflow-y-auto">

                        {/* Müşteri seçimi */}
                        <div className="space-y-1.5">
                            <Label>
                                Müşteri <span className="text-red-500">*</span>
                            </Label>
                            <CustomerCombobox
                                customers={customers}
                                value={formData.customer_id}
                                onChange={id => setFormData(p => ({ ...p, customer_id: id }))}
                                onAddNew={() => setShowQuickCustomer(true)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            {/* Sol: Birim, tarih, durum */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label>Birim / Gayrimenkul</Label>
                                    <Select value={formData.unit_id} onValueChange={handleUnitSelect}>
                                        <SelectTrigger><SelectValue placeholder="Birim Seçin (Opsiyonel)" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none" className="text-slate-400 italic">Seçilmedi</SelectItem>
                                            {units?.map(u => (
                                                <SelectItem key={u.id} value={u.id.toString()}>
                                                    {(u as { block?: { name?: string } }).block?.name} - No: {u.unit_no}
                                                    {u.list_price ? ` (${Number(u.list_price).toLocaleString('tr-TR')} ₺)` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>Teklif No</Label>
                                        <Input value={formData.offer_no}
                                            onChange={e => setFormData(p => ({ ...p, offer_no: e.target.value }))}
                                            placeholder="TKF-2026-001" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Geçerlilik Tarihi</Label>
                                        <Input type="date" value={formData.valid_until}
                                            onChange={e => setFormData(p => ({ ...p, valid_until: e.target.value }))} required />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Durum</Label>
                                    <Select value={formData.status}
                                        onValueChange={(v) => setFormData(p => ({ ...p, status: v as Offer['status'] }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Taslak</SelectItem>
                                            <SelectItem value="sent">Gönderildi</SelectItem>
                                            <SelectItem value="accepted">Kabul Edildi</SelectItem>
                                            <SelectItem value="rejected">Reddedildi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Sağ: Fiyatlandırma */}
                            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h3 className="font-medium text-slate-800 border-b pb-1.5 mb-1">Fiyatlandırma</h3>
                                <div className="space-y-1.5">
                                    <Label>Liste / Baz Fiyatı (₺)</Label>
                                    <Input type="number" min="0" step="0.01" className="bg-white"
                                        value={formData.base_price}
                                        onChange={e => setFormData(p => ({ ...p, base_price: e.target.value }))} required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>İndirim Tutarı (₺)</Label>
                                    <Input type="number" min="0" step="0.01" className="bg-white border-red-200"
                                        value={formData.discount_amount}
                                        onChange={e => setFormData(p => ({ ...p, discount_amount: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5 pt-2 border-t">
                                    <Label className="text-primary font-bold">Net Teklif Fiyatı (₺)</Label>
                                    <Input type="number" min="0" step="0.01"
                                        className="bg-emerald-50 border-emerald-200 text-emerald-700 font-bold text-lg h-12"
                                        value={formData.final_price}
                                        onChange={e => setFormData(p => ({ ...p, final_price: e.target.value }))} required />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Ödeme Planı</Label>
                            <Textarea rows={3} value={formData.payment_plan}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(p => ({ ...p, payment_plan: e.target.value }))}
                                placeholder="Örn: %50 Peşin, %50 teslimde..." />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Özel Notlar</Label>
                            <Textarea rows={2} value={formData.notes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(p => ({ ...p, notes: e.target.value }))}
                                placeholder="PDF'e eklenecek notlar..." />
                        </div>
                    </form>

                    <div className="bg-slate-50 border-t px-6 py-4 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsOpen(false)} type="button">İptal</Button>
                        <Button onClick={handleSubmit} disabled={isLoading} className="min-w-[130px]">
                            {isLoading ? 'Kaydediliyor...' : 'Teklifi Oluştur'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
