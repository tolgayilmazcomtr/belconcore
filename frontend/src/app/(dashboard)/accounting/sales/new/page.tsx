'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';
import { useAccountingStore } from '@/store/useAccountingStore';
import { InvoiceItemInput } from '@/types/accounting.types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, Search, ChevronDown } from 'lucide-react';

const TAX_RATES = [0, 1, 8, 10, 18, 20];
const UNITS = ['Adet', 'm²', 'm³', 'kg', 'ton', 'lt', 'saat', 'gün', 'ay', 'yıl', 'paket'];
const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'];
const DOC_TYPES = [
    { value: 'paper', label: 'Kağıt' },
    { value: 'e-invoice', label: 'e-Fatura' },
    { value: 'e-archive', label: 'e-Arşiv' },
];

interface ItemRow extends InvoiceItemInput {
    _id: string; // local temp id
}

const makeItem = (): ItemRow => ({
    _id: Math.random().toString(36).slice(2),
    description: '',
    quantity: 1,
    unit: 'Adet',
    unit_price: 0,
    tax_rate: 20,
});

// Simple account combobox
function AccountSelect({ accounts, value, onChange }: {
    accounts: { id: number; name: string; tax_number?: string }[];
    value: string;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const selected = accounts.find(a => a.id.toString() === value);
    const filtered = accounts.filter(a =>
        !q || a.name.toLowerCase().includes(q.toLowerCase()) || (a.tax_number || '').includes(q)
    );

    return (
        <div className="relative">
            <div onClick={() => setOpen(o => !o)}
                className="h-10 border border-slate-200 rounded px-3 flex items-center gap-2 cursor-pointer hover:border-blue-400 transition-colors bg-white">
                <Search size={13} className="text-slate-300 shrink-0" />
                <span className={`flex-1 text-sm ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
                    {selected ? selected.name : 'Müşteri ünvanı veya VKN ile arama yapabilirsiniz'}
                </span>
                <ChevronDown size={13} className="text-slate-400 shrink-0" />
            </div>
            {open && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b">
                        <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                            placeholder="Ara..." className="w-full h-7 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.map(a => (
                            <button key={a.id} type="button"
                                onClick={() => { onChange(a.id.toString()); setOpen(false); setQ(''); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${value === a.id.toString() ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}>
                                {a.name}
                                {a.tax_number && <span className="ml-2 text-xs text-slate-400">{a.tax_number}</span>}
                            </button>
                        ))}
                        {filtered.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">Sonuç bulunamadı</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function NewSalesInvoicePage() {
    const router = useRouter();
    const { activeProject } = useProjectStore();
    const { accounts, setAccounts, upsertInvoice } = useAccountingStore();
    const [saving, setSaving] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({
        account_id: '',
        date: today,
        due_date: today,
        category: '',
        currency: 'TRY',
        document_type: 'paper',
        description: '',
        invoice_no: '',
    });
    const [items, setItems] = useState<ItemRow[]>([makeItem()]);

    const setF = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

    useEffect(() => {
        if (!activeProject) return;
        api.get('/accounting/accounts', { params: { active_project_id: activeProject.id } })
            .then(r => setAccounts(r.data.data)).catch(() => { });
    }, [activeProject, setAccounts]);

    const updateItem = useCallback((id: string, key: keyof ItemRow, val: string | number) => {
        setItems(prev => prev.map(item => item._id === id ? { ...item, [key]: val } : item));
    }, []);

    const addItem = () => setItems(p => [...p, makeItem()]);
    const removeItem = (id: string) => setItems(p => p.filter(i => i._id !== id));

    // Computed totals
    const subtotal = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
    const taxTotal = items.reduce((s, i) => s + (i.quantity * i.unit_price * i.tax_rate / 100), 0);
    const total = subtotal + taxTotal;

    const fmtMoney = (n: number) =>
        new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n);

    const handleSave = async () => {
        if (!activeProject) return;
        if (!form.account_id) { toast.error('Müşteri seçimi zorunludur.'); return; }
        if (items.some(i => !i.description)) { toast.error('Tüm kalemlerin açıklaması dolu olmalıdır.'); return; }
        setSaving(true);
        try {
            const r = await api.post('/accounting/invoices', {
                ...form,
                account_id: parseInt(form.account_id),
                type: 'sales',
                active_project_id: activeProject.id,
                items: items.map(({ _id, ...rest }) => rest),
            });
            upsertInvoice(r.data.data);
            toast.success('Fatura oluşturuldu.');
            router.push('/accounting/sales');
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Kayıt başarısız.');
        } finally { setSaving(false); }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Page header — exactly like muhasip.com */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 shrink-0">
                <h1 className="text-[15px] font-semibold text-slate-800">Yeni Satış Fatura</h1>
                <div className="flex gap-2">
                    <button onClick={() => router.back()}
                        className="h-8 px-4 text-sm border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors">
                        Vazgeç
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="h-8 px-4 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium">
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#f8f9fa]">
                {/* Main form card */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
                    {/* Customer row */}
                    <div className="grid grid-cols-[1fr_240px_150px_130px] gap-3 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">* Müşteri</label>
                            <AccountSelect accounts={accounts} value={form.account_id} onChange={v => setF('account_id', v)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Düzenleme ve Vade Tarihi</label>
                            <div className="flex items-center gap-1">
                                <input type="date" value={form.date} onChange={e => setF('date', e.target.value)}
                                    className="flex-1 h-10 text-xs border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
                                <span className="text-slate-300 text-xs">–</span>
                                <input type="date" value={form.due_date} onChange={e => setF('due_date', e.target.value)}
                                    className="flex-1 h-10 text-xs border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Kategori</label>
                            <input value={form.category} onChange={e => setF('category', e.target.value)}
                                placeholder="Fatura Kategorisi"
                                className="w-full h-10 text-xs border border-slate-200 rounded px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Döviz Cinsi</label>
                            <select value={form.currency} onChange={e => setF('currency', e.target.value)}
                                className="w-full h-10 text-xs border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                                {CURRENCIES.map(c => <option key={c} value={c}>{c === 'TRY' ? 'TÜRK LİRASI' : c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Description + invoice no row */}
                    <div className="grid grid-cols-[1fr_200px] gap-3 items-start">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Açıklama</label>
                            <textarea value={form.description} onChange={e => setF('description', e.target.value)}
                                rows={2} placeholder="Fatura açıklaması..."
                                className="w-full text-xs border border-slate-200 rounded px-3 py-2 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">
                                Fatura No
                                <span className="ml-1 text-[10px] text-slate-400 font-normal">Otomatik atanacaktır</span>
                            </label>
                            <input value={form.invoice_no} onChange={e => setF('invoice_no', e.target.value)}
                                placeholder="Boş bırakırsanız otomatik"
                                className="w-full h-8 text-xs border border-slate-200 rounded px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
                            <div className="mt-2">
                                <label className="text-xs font-medium text-slate-600">Belge Türü</label>
                                <select value={form.document_type} onChange={e => setF('document_type', e.target.value)}
                                    className="w-full mt-1 h-8 text-xs border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                                    {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line items table */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                        <h2 className="text-xs font-semibold text-slate-700">Fatura Kalemleri</h2>
                    </div>

                    {/* Column header */}
                    <div className="grid text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-4 py-2 border-b border-slate-100"
                        style={{ gridTemplateColumns: '1fr 70px 80px 90px 80px 90px 28px' }}>
                        <span>HİZMET / ÜRÜN</span>
                        <span className="text-right">MİKTAR</span>
                        <span className="text-center">BİRİM</span>
                        <span className="text-right">BR.FİYATI</span>
                        <span className="text-center">VERGİ</span>
                        <span className="text-right">TOPLAM</span>
                        <span />
                    </div>

                    {/* Item rows */}
                    {items.map((item, idx) => {
                        const lineSubtotal = item.quantity * item.unit_price;
                        const lineTotal = lineSubtotal * (1 + item.tax_rate / 100);
                        return (
                            <div key={item._id}
                                className="grid items-center px-4 py-1.5 border-b border-slate-50 group"
                                style={{ gridTemplateColumns: '1fr 70px 80px 90px 80px 90px 28px' }}>
                                <div className="pr-3 relative">
                                    <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        value={item.description}
                                        onChange={e => updateItem(item._id, 'description', e.target.value)}
                                        placeholder="Barkod veya Ürün / Hizmet Adı ile arayın"
                                        autoFocus={idx === items.length - 1 && idx > 0}
                                        className="w-full h-7 pl-6 pr-2 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                </div>
                                <input type="number" value={item.quantity} min={0} step={1}
                                    onChange={e => updateItem(item._id, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="h-7 text-xs text-right border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
                                <select value={item.unit}
                                    onChange={e => updateItem(item._id, 'unit', e.target.value)}
                                    className="h-7 text-xs border border-slate-200 rounded px-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                                <div className="relative">
                                    <input type="number" value={item.unit_price} min={0} step={0.01}
                                        onChange={e => updateItem(item._id, 'unit_price', parseFloat(e.target.value) || 0)}
                                        className="w-full h-7 text-xs text-right border border-slate-200 rounded px-2 pr-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₺</span>
                                </div>
                                <select value={item.tax_rate}
                                    onChange={e => updateItem(item._id, 'tax_rate', parseFloat(e.target.value))}
                                    className="h-7 text-xs border border-slate-200 rounded px-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                                    {TAX_RATES.map(r => <option key={r} value={r}>%{r} KDV</option>)}
                                </select>
                                <div className="relative text-right">
                                    <span className="text-xs font-mono text-slate-700">{fmtMoney(lineTotal)}</span>
                                    <span className="ml-0.5 text-[10px] text-slate-400">₺</span>
                                </div>
                                <button onClick={() => removeItem(item._id)}
                                    disabled={items.length === 1}
                                    className="flex items-center justify-center text-slate-300 hover:text-red-400 disabled:opacity-20 transition-colors">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        );
                    })}

                    {/* Add row */}
                    <div className="px-4 py-2">
                        <button onClick={addItem}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                            <Plus size={13} /> Satır Ekle
                        </button>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-slate-200 flex justify-end">
                        <div className="w-64 divide-y divide-slate-100">
                            <div className="flex justify-between px-4 py-2 text-xs text-slate-600">
                                <span className="uppercase tracking-wide font-semibold text-slate-400">ARA TOPLAM</span>
                                <span className="font-mono">₺{fmtMoney(subtotal)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2 text-xs text-slate-600">
                                <span className="uppercase tracking-wide font-semibold text-slate-400">TOPLAM KDV</span>
                                <span className="font-mono">₺{fmtMoney(taxTotal)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2 text-sm text-slate-800 bg-slate-50">
                                <span className="uppercase tracking-wide font-bold">ÖDENEcek TUTAR</span>
                                <span className="font-mono font-bold">₺{fmtMoney(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
