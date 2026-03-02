'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useAccountingStore } from '@/store/useAccountingStore';
import { AccountingAccount } from '@/types/accounting.types';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    Users, Plus, Search, ChevronDown, MoreVertical,
    Pencil, Trash2, X, Building, User, Phone, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// ─── Account Form Modal ───────────────────────────────────────────────────
interface AccountFormProps {
    open: boolean;
    onClose: () => void;
    onSaved: (a: AccountingAccount) => void;
    editing?: AccountingAccount | null;
    projectId: number;
}

function AccountFormModal({ open, onClose, onSaved, editing, projectId }: AccountFormProps) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        type: 'customer' as AccountingAccount['type'],
        name: '', tax_number: '', tax_office: '',
        phone: '', email: '', address: '', city: '',
        category: '', notes: '',
    });

    useEffect(() => {
        if (editing) {
            setForm({
                type: editing.type, name: editing.name,
                tax_number: editing.tax_number || '', tax_office: editing.tax_office || '',
                phone: editing.phone || '', email: editing.email || '',
                address: editing.address || '', city: editing.city || '',
                category: editing.category || '', notes: editing.notes || '',
            });
        } else {
            setForm({ type: 'customer', name: '', tax_number: '', tax_office: '', phone: '', email: '', address: '', city: '', category: '', notes: '' });
        }
    }, [editing, open]);

    const save = async () => {
        if (!form.name.trim()) { toast.error('Ünvan zorunludur.'); return; }
        setLoading(true);
        try {
            if (editing) {
                const r = await api.put(`/accounting/accounts/${editing.id}`, form);
                onSaved(r.data.data);
                toast.success('Cari güncellendi.');
            } else {
                const r = await api.post('/accounting/accounts', { ...form, active_project_id: projectId });
                onSaved(r.data.data);
                toast.success('Cari oluşturuldu.');
            }
            onClose();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Hata oluştu.');
        } finally { setLoading(false); }
    };

    const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden gap-0">
                <div className="bg-slate-50 border-b px-5 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-[15px] font-semibold">
                            {editing ? 'Cari Düzenle' : 'Yeni Cari Hesap'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Müşteri, tedarikçi veya her ikisi olarak tanımlayabilirsiniz.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="px-5 py-4 space-y-4">
                    {/* Type toggle */}
                    <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
                        {(['customer', 'supplier', 'both'] as const).map(t => (
                            <button key={t} type="button"
                                onClick={() => f('type', t)}
                                className={`flex-1 py-1 rounded text-xs font-medium transition-all ${form.type === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                                {t === 'customer' ? 'Müşteri' : t === 'supplier' ? 'Tedarikçi' : 'Her İkisi'}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Ünvan / Ad Soyad <span className="text-red-500">*</span></Label>
                        <Input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Şirket veya kişi adı" className="h-8 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Vergi No (VKN/TC)</Label>
                            <Input value={form.tax_number} onChange={e => f('tax_number', e.target.value)} placeholder="VKN veya TC" className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Vergi Dairesi</Label>
                            <Input value={form.tax_office} onChange={e => f('tax_office', e.target.value)} placeholder="Vergi dairesi" className="h-8 text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Telefon</Label>
                            <Input value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+90 5xx..." className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">E-posta</Label>
                            <Input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="mail@firma.com" className="h-8 text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Adres</Label>
                            <Input value={form.address} onChange={e => f('address', e.target.value)} placeholder="Adres" className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Şehir</Label>
                            <Input value={form.city} onChange={e => f('city', e.target.value)} placeholder="İstanbul" className="h-8 text-sm" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Notlar</Label>
                        <Textarea value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => f('notes', e.target.value)} rows={2} className="text-sm resize-none" placeholder="Ek bilgiler..." />
                    </div>
                </div>
                <div className="bg-slate-50 border-t px-5 py-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onClose}>İptal</Button>
                    <Button size="sm" onClick={save} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Cariler Page ──────────────────────────────────────────────────────────

const fmtMoney = (n: number) =>
    new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function AccountsPage() {
    const { activeProject } = useProjectStore();
    const { accounts, setAccounts, upsertAccount, removeAccount } = useAccountingStore();

    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [typeFilter, setTypeFilter] = useState('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<AccountingAccount | null>(null);
    const [contextMenu, setContextMenu] = useState<{ id: number; x: number; y: number } | null>(null);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setEditing(null); setFormOpen(true); }
            if (e.key === 'Escape') setContextMenu(null);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (!activeProject) return;
        setLoading(true);
        api.get('/accounting/accounts', { params: { active_project_id: activeProject.id, status: statusFilter, type: typeFilter } })
            .then(r => setAccounts(r.data.data))
            .catch(() => toast.error('Cariler yüklenemedi.'))
            .finally(() => setLoading(false));
    }, [activeProject, statusFilter, typeFilter, setAccounts]);

    const filtered = useMemo(() => {
        if (!search) return accounts;
        const s = search.toLowerCase();
        return accounts.filter(a =>
            a.name.toLowerCase().includes(s) ||
            (a.tax_number || '').includes(s) ||
            (a.phone || '').includes(s) ||
            (a.email || '').toLowerCase().includes(s)
        );
    }, [accounts, search]);

    const handleDelete = async (id: number) => {
        if (!confirm('Cari hesabı silmek istediğinizden emin misiniz?')) return;
        try {
            await api.delete(`/accounting/accounts/${id}`);
            removeAccount(id);
            toast.success('Cari silindi.');
        } catch { toast.error('Silinemedi.'); }
        setContextMenu(null);
    };

    if (!activeProject) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">Aktif proje seçilmedi.</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full" onClick={() => setContextMenu(null)}>
            {/* Toolbar */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                    <Users size={15} className="text-slate-400" />
                    Cariler
                </div>
                <div className="flex-1" />
                {/* Filters */}
                <div className="flex items-center gap-1.5">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="h-7 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="all">Tümü</option>
                        <option value="active">Aktif</option>
                        <option value="passive">Pasif</option>
                    </select>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                        className="h-7 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="all">Tür: Tümü</option>
                        <option value="customer">Müşteri</option>
                        <option value="supplier">Tedarikçi</option>
                        <option value="both">Her İkisi</option>
                    </select>
                    <div className="relative">
                        <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Ünvan, VKN, Telefon..."
                            className="h-7 pl-7 pr-3 text-xs border border-slate-200 rounded w-56 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                </div>
                <Button size="sm" className="h-7 text-xs gap-1.5"
                    onClick={() => { setEditing(null); setFormOpen(true); }}
                    title="Yeni Cari (N)">
                    <Plus size={13} /> Yeni Cari
                </Button>
            </div>

            {/* Table header */}
            <div className="bg-white border-b border-slate-200 shrink-0">
                <div className="grid text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-4 py-1.5"
                    style={{ gridTemplateColumns: '24px 1fr 160px 120px 120px' }}>
                    <span />
                    <span>ÜNVAN</span>
                    <span>VERGİ NO</span>
                    <span>TÜR</span>
                    <span className="text-right">BAKİYE</span>
                </div>
            </div>

            {/* Table body */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                        Yükleniyor...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                        <Users size={32} className="text-slate-200" />
                        <p className="text-sm">Cari hesap bulunamadı</p>
                        <button onClick={() => { setEditing(null); setFormOpen(true); }}
                            className="text-xs text-blue-600 hover:underline">+ Yeni cari ekle (N)</button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map(account => (
                            <div key={account.id}
                                className="group grid items-center px-4 py-2 hover:bg-blue-50/50 cursor-pointer transition-colors"
                                style={{ gridTemplateColumns: '24px 1fr 160px 120px 120px' }}
                                onContextMenu={e => { e.preventDefault(); setContextMenu({ id: account.id, x: e.clientX, y: e.clientY }); }}
                                onDoubleClick={() => { setEditing(account); setFormOpen(true); }}>
                                <span className="text-slate-300">
                                    {account.type === 'supplier'
                                        ? <Building size={14} />
                                        : <User size={14} />}
                                </span>
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{account.name}</p>
                                    <p className="text-[11px] text-slate-400">
                                        {[account.phone, account.email].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                                <span className="text-xs text-slate-500">{account.tax_number || '—'}</span>
                                <span className="text-xs text-slate-500 capitalize">
                                    {account.type === 'customer' ? 'Müşteri' : account.type === 'supplier' ? 'Tedarikçi' : 'Her İkisi'}
                                </span>
                                <div className="text-right flex items-center justify-end gap-2">
                                    <span className={`text-sm font-mono font-semibold ${account.balance > 0 ? 'text-green-600' : account.balance < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                        ₺{fmtMoney(account.balance)}
                                    </span>
                                    <button
                                        onClick={e => { e.stopPropagation(); setContextMenu({ id: account.id, x: e.clientX, y: e.clientY }); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 transition-all">
                                        <MoreVertical size={13} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Context menu */}
            {contextMenu && (
                <div className="fixed z-50 bg-white border border-slate-200 shadow-lg rounded-lg py-1 min-w-[140px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => {
                        const a = accounts.find(a => a.id === contextMenu.id);
                        if (a) { setEditing(a); setFormOpen(true); }
                        setContextMenu(null);
                    }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 text-slate-700">
                        <Pencil size={13} /> Düzenle
                    </button>
                    <button onClick={() => handleDelete(contextMenu.id)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-red-50 text-red-600">
                        <Trash2 size={13} /> Sil
                    </button>
                </div>
            )}

            <AccountFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSaved={a => { upsertAccount(a); }}
                editing={editing}
                projectId={activeProject.id}
            />

            {/* Status bar */}
            <div className="bg-white border-t border-slate-200 px-4 py-1 flex items-center gap-4 shrink-0">
                <span className="text-[11px] text-slate-400">{filtered.length} kayıt</span>
                <span className="text-[11px] text-slate-300">·</span>
                <span className="text-[11px] text-slate-400">N = Yeni cari · Çift tıkla = Düzenle · Sağ tık = Menü</span>
            </div>
        </div>
    );
}
