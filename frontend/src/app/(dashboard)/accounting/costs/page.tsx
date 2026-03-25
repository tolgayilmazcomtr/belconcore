'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    Plus, Search, Pencil, Trash2, TrendingUp, TrendingDown,
    Settings, CheckCircle2, Circle, AlertCircle, ChevronDown,
    ChevronRight, MoreVertical, X, Save, Calculator, Building2,
    FileDown, SortAsc, Filter, RefreshCw, ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CostItem {
    id: number;
    name: string;
    category?: string;
    quantity?: number;
    unit?: string;
    planned_unit_price?: number;
    planned_total?: number;
    actual_unit_price?: number;
    actual_total?: number;
    contractor?: string;
    contract_date?: string;
    status: 'planned' | 'contracted' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string;
    sort_order: number;
}

interface CostSettings {
    unit_count: number;
    currency: string;
    notes?: string;
}

interface Summary {
    total_planned: number;
    total_actual: number;
    variance: number;
    unit_count: number;
    planned_per_unit: number;
    actual_per_unit: number;
    total_items: number;
    completed_count: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const UNITS = ['Adet', 'm²', 'm³', 'Ton', 'kg', 'lt', 'm', 'saat', 'gün', 'ay', 'paket', '%'];

const CATEGORIES = [
    'Proje & Ruhsat', 'Altyapı & Zemin', 'Kaba İnşaat', 'Çelik & Betonarme',
    'Çatı', 'İzolasyon', 'Elektrik', 'Mekanik & Tesisat', 'İnce İşler',
    'Doğrama', 'Kaplama & Seramik', 'Mobilya & Dekorasyon', 'Asansör',
    'Peyzaj & Çevre', 'Altyapı Bağlantıları', 'Yönetim & Genel Gider',
    'Vergi & Harç', 'Finans & Sigorta', 'Diğer',
];

const STATUS_CONFIG = {
    planned:     { label: 'Planlandı',    color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
    contracted:  { label: 'Sözleşmeli',  color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
    in_progress: { label: 'Devam Ediyor', color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
    completed:   { label: 'Tamamlandı',  color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    cancelled:   { label: 'İptal',        color: 'bg-red-100 text-red-600',      dot: 'bg-red-400' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
    n != null ? '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) : '—';

const fmtPct = (n: number) =>
    (n >= 0 ? '+' : '') + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n) + '%';

const variance = (planned?: number | null, actual?: number | null) => {
    if (!planned || !actual) return null;
    return actual - planned;
};

const variancePct = (planned?: number | null, actual?: number | null) => {
    if (!planned || !actual || planned === 0) return null;
    return ((actual - planned) / planned) * 100;
};

// ─── Empty Form ───────────────────────────────────────────────────────────────
const emptyForm = () => ({
    name: '', category: '', quantity: '', unit: 'Adet',
    planned_unit_price: '', planned_total: '',
    actual_unit_price: '', actual_total: '',
    contractor: '', contract_date: '',
    status: 'planned' as CostItem['status'],
    notes: '',
});

// ─── Item Form Modal ──────────────────────────────────────────────────────────
function ItemModal({
    open, onClose, editItem, projectId, onSaved,
}: {
    open: boolean; onClose: () => void; editItem?: CostItem | null;
    projectId: number; onSaved: (item: CostItem) => void;
}) {
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(false);
    const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

    // Auto-calculate planned_total
    useEffect(() => {
        const qty = parseFloat(form.quantity) || 0;
        const up = parseFloat(form.planned_unit_price) || 0;
        if (qty > 0 && up > 0) f('planned_total', (qty * up).toFixed(0));
    }, [form.quantity, form.planned_unit_price]);

    // Auto-calculate actual_total
    useEffect(() => {
        const qty = parseFloat(form.quantity) || 0;
        const up = parseFloat(form.actual_unit_price) || 0;
        if (qty > 0 && up > 0) f('actual_total', (qty * up).toFixed(0));
    }, [form.quantity, form.actual_unit_price]);

    useEffect(() => {
        if (open) {
            if (editItem) {
                setForm({
                    name: editItem.name || '',
                    category: editItem.category || '',
                    quantity: editItem.quantity?.toString() || '',
                    unit: editItem.unit || 'Adet',
                    planned_unit_price: editItem.planned_unit_price?.toString() || '',
                    planned_total: editItem.planned_total?.toString() || '',
                    actual_unit_price: editItem.actual_unit_price?.toString() || '',
                    actual_total: editItem.actual_total?.toString() || '',
                    contractor: editItem.contractor || '',
                    contract_date: editItem.contract_date?.substring(0, 10) || '',
                    status: editItem.status || 'planned',
                    notes: editItem.notes || '',
                });
            } else {
                setForm(emptyForm());
            }
        }
    }, [open, editItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('İmalat adı zorunlu.'); return; }
        setLoading(true);
        const payload = {
            ...form,
            active_project_id: projectId,
            quantity: form.quantity ? parseFloat(form.quantity) : null,
            planned_unit_price: form.planned_unit_price ? parseFloat(form.planned_unit_price) : null,
            planned_total: form.planned_total ? parseFloat(form.planned_total) : null,
            actual_unit_price: form.actual_unit_price ? parseFloat(form.actual_unit_price) : null,
            actual_total: form.actual_total ? parseFloat(form.actual_total) : null,
        };
        try {
            const res = editItem
                ? await api.put(`/costs/${editItem.id}`, payload)
                : await api.post('/costs', payload);
            onSaved(res.data.data);
            toast.success(editItem ? 'İmalat güncellendi.' : 'İmalat eklendi.');
            onClose();
        } catch (err: any) {
            toast.error('Hata', { description: err.response?.data?.message || 'Bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    const varResult = variance(
        form.planned_total ? parseFloat(form.planned_total) : null,
        form.actual_total ? parseFloat(form.actual_total) : null,
    );

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden gap-0">
                <div className="bg-slate-50 border-b px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            {editItem ? 'İmalatı Düzenle' : 'Yeni İmalat Ekle'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Planladığınız maliyet kalemini tanımlayın. Gerçekleşen tutarı daha sonra girebilirsiniz.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
                    {/* İmalat Adı + Kategori */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2">
                            <Label>İmalat Adı <span className="text-red-500">*</span></Label>
                            <Input value={form.name} onChange={e => f('name', e.target.value)}
                                placeholder="Örn: Kaba İnşaat, Elektrik Tesisatı..." autoFocus />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Kategori</Label>
                            <Select value={form.category} onValueChange={v => f('category', v)}>
                                <SelectTrigger><SelectValue placeholder="Kategori seçin" /></SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Durum</Label>
                            <Select value={form.status} onValueChange={v => f('status', v as CostItem['status'])}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Miktar + Birim */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5 col-span-2">
                            <Label>Miktar</Label>
                            <Input type="number" min="0" step="any" value={form.quantity}
                                onChange={e => f('quantity', e.target.value)} placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Birim</Label>
                            <Select value={form.unit} onValueChange={v => f('unit', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Fiyatlandırma - 2 panel */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Planlanan */}
                        <div className="space-y-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide">Planlanan</h4>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Birim Fiyat (₺)</Label>
                                <Input type="number" min="0" step="any" value={form.planned_unit_price}
                                    onChange={e => f('planned_unit_price', e.target.value)}
                                    className="bg-white" placeholder="0" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Toplam Tutar (₺)</Label>
                                <Input type="number" min="0" step="any" value={form.planned_total}
                                    onChange={e => f('planned_total', e.target.value)}
                                    className="bg-white font-semibold text-blue-700" placeholder="0" />
                            </div>
                        </div>

                        {/* Gerçekleşen */}
                        <div className="space-y-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Gerçekleşen</h4>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Birim Fiyat (₺)</Label>
                                <Input type="number" min="0" step="any" value={form.actual_unit_price}
                                    onChange={e => f('actual_unit_price', e.target.value)}
                                    className="bg-white" placeholder="Anlaşıldığında girilir" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Toplam Tutar (₺)</Label>
                                <Input type="number" min="0" step="any" value={form.actual_total}
                                    onChange={e => f('actual_total', e.target.value)}
                                    className="bg-white font-semibold text-emerald-700" placeholder="0" />
                            </div>
                        </div>
                    </div>

                    {/* Fark göster */}
                    {varResult !== null && (
                        <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold ${varResult <= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            <span>{varResult <= 0 ? '✓ Tasarruf' : '⚠ Aşım'}</span>
                            <span>{fmt(Math.abs(varResult))} {varResult <= 0 ? 'tasarruf' : 'fazla'} ({fmtPct(variancePct(
                                form.planned_total ? parseFloat(form.planned_total) : null,
                                form.actual_total ? parseFloat(form.actual_total) : null,
                            ) || 0)})</span>
                        </div>
                    )}

                    {/* Yüklenici */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Yüklenici / Firma</Label>
                            <Input value={form.contractor} onChange={e => f('contractor', e.target.value)}
                                placeholder="Anlaşılan firma adı" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Sözleşme Tarihi</Label>
                            <Input type="date" value={form.contract_date}
                                onChange={e => f('contract_date', e.target.value)} />
                        </div>
                    </div>

                    {/* Notlar */}
                    <div className="space-y-1.5">
                        <Label>Notlar</Label>
                        <Textarea value={form.notes} onChange={e => f('notes', e.target.value)}
                            rows={2} placeholder="Ek açıklamalar..." />
                    </div>
                </form>

                <div className="bg-slate-50 border-t px-6 py-4 flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={onClose}>İptal</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
                        {loading ? 'Kaydediliyor...' : editItem ? 'Güncelle' : 'Kaydet'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({
    open, onClose, settings, projectId, onSaved,
}: {
    open: boolean; onClose: () => void; settings: CostSettings | null;
    projectId: number; onSaved: (s: CostSettings) => void;
}) {
    const [unitCount, setUnitCount] = useState(settings?.unit_count?.toString() || '1');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) setUnitCount(settings?.unit_count?.toString() || '1');
    }, [open, settings]);

    const save = async () => {
        const n = parseInt(unitCount);
        if (!n || n < 1) { toast.error('Daire sayısı en az 1 olmalı.'); return; }
        setLoading(true);
        try {
            const res = await api.put('/costs/settings', {
                active_project_id: projectId,
                unit_count: n,
            });
            onSaved(res.data.data);
            toast.success('Ayarlar kaydedildi.');
            onClose();
        } catch {
            toast.error('Ayarlar kaydedilemedi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-[380px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-primary" /> Maliyet Ayarları
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Toplam maliyetin kaç daireye bölüneceğini girin. Bu sayı daire başına maliyet hesabında kullanılır.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Toplam Daire / Birim Sayısı</Label>
                        <Input
                            type="number" min="1" value={unitCount}
                            onChange={e => setUnitCount(e.target.value)}
                            className="text-2xl font-bold h-12 text-center"
                            autoFocus
                        />
                        <p className="text-xs text-slate-400 text-center">
                            Toplam maliyet bu sayıya bölünür → daire başına maliyet
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                    <Button variant="outline" onClick={onClose} type="button">İptal</Button>
                    <Button onClick={save} disabled={loading}>Kaydet</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Quick Actual Price Modal ─────────────────────────────────────────────────
function QuickActualModal({
    item, onClose, onSaved,
}: {
    item: CostItem | null; onClose: () => void; onSaved: (item: CostItem) => void;
}) {
    const [unitPrice, setUnitPrice] = useState('');
    const [total, setTotal] = useState('');
    const [contractor, setContractor] = useState('');
    const [status, setStatus] = useState<CostItem['status']>('contracted');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setUnitPrice(item.actual_unit_price?.toString() || '');
            setTotal(item.actual_total?.toString() || '');
            setContractor(item.contractor || '');
            setStatus(item.status === 'planned' ? 'contracted' : item.status);
        }
    }, [item]);

    // Auto-calc total from unit price
    useEffect(() => {
        const qty = item?.quantity || 0;
        const up = parseFloat(unitPrice) || 0;
        if (qty > 0 && up > 0) setTotal((qty * up).toFixed(0));
    }, [unitPrice, item?.quantity]);

    if (!item) return null;

    const save = async () => {
        const actualTotal = parseFloat(total) || null;
        if (!actualTotal) { toast.error('Gerçek tutarı girin.'); return; }
        setLoading(true);
        try {
            const res = await api.put(`/costs/${item.id}`, {
                actual_unit_price: parseFloat(unitPrice) || null,
                actual_total: actualTotal,
                contractor,
                status,
            });
            onSaved(res.data.data);
            toast.success('Gerçek fiyat güncellendi.');
            onClose();
        } catch {
            toast.error('Güncelleme başarısız.');
        } finally {
            setLoading(false);
        }
    };

    const varAmt = variance(item.planned_total, parseFloat(total) || null);
    const varP = variancePct(item.planned_total, parseFloat(total) || null);

    return (
        <Dialog open={!!item} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden gap-0">
                <div className="bg-emerald-600 px-5 py-4 text-white">
                    <h3 className="font-semibold text-base">{item.name}</h3>
                    <p className="text-emerald-100 text-xs mt-0.5">Gerçekleşen fiyat gir</p>
                </div>
                <div className="px-5 py-5 space-y-4">
                    {/* Planlanan referans */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5 text-sm">
                        <span className="text-slate-500 text-xs">Planlanan Tutar</span>
                        <span className="font-semibold text-slate-700">{fmt(item.planned_total)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Birim Fiyat (₺)</Label>
                            <Input type="number" min="0" step="any" value={unitPrice}
                                onChange={e => setUnitPrice(e.target.value)} placeholder="0" autoFocus />
                            {item.quantity && <p className="text-[10px] text-slate-400">{item.quantity} {item.unit}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Toplam Tutar (₺)</Label>
                            <Input type="number" min="0" step="any" value={total}
                                onChange={e => setTotal(e.target.value)}
                                className="font-bold text-emerald-700" placeholder="0" />
                        </div>
                    </div>

                    {varAmt !== null && (
                        <div className={`text-center py-2 px-3 rounded-lg text-sm font-semibold ${varAmt <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {varAmt <= 0
                                ? `✓ ${fmt(Math.abs(varAmt))} tasarruf (${fmtPct(varP || 0)})`
                                : `⚠ ${fmt(Math.abs(varAmt))} aşım (${fmtPct(varP || 0)})`}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-xs">Yüklenici / Firma</Label>
                        <Input value={contractor} onChange={e => setContractor(e.target.value)} placeholder="Firma adı" />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Durum Güncelle</Label>
                        <Select value={status} onValueChange={v => setStatus(v as CostItem['status'])}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="border-t px-5 py-4 flex gap-3 justify-end bg-slate-50">
                    <Button variant="outline" onClick={onClose} type="button">İptal</Button>
                    <Button onClick={save} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 min-w-[100px]">
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CostsPage() {
    const { activeProject } = useProjectStore();
    const [items, setItems] = useState<CostItem[]>([]);
    const [settings, setSettings] = useState<CostSettings | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    const [showItemModal, setShowItemModal] = useState(false);
    const [editItem, setEditItem] = useState<CostItem | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [quickItem, setQuickItem] = useState<CostItem | null>(null);

    const load = useCallback(async () => {
        if (!activeProject) return;
        setLoading(true);
        try {
            const [itemsRes, settingsRes, summaryRes] = await Promise.all([
                api.get('/costs', { params: { active_project_id: activeProject.id } }),
                api.get('/costs/settings', { params: { active_project_id: activeProject.id } }),
                api.get('/costs/summary', { params: { active_project_id: activeProject.id } }),
            ]);
            setItems(itemsRes.data.data || []);
            setSettings(settingsRes.data.data);
            setSummary(summaryRes.data.data);
        } catch {
            toast.error('Veriler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, [activeProject]);

    useEffect(() => { load(); }, [load]);

    // Filter + group by category
    const filtered = useMemo(() => {
        return items.filter(item => {
            const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
                || item.contractor?.toLowerCase().includes(search.toLowerCase())
                || item.category?.toLowerCase().includes(search.toLowerCase());
            const matchCat = filterCategory === 'all' || item.category === filterCategory;
            const matchStatus = filterStatus === 'all' || item.status === filterStatus;
            return matchSearch && matchCat && matchStatus;
        });
    }, [items, search, filterCategory, filterStatus]);

    const grouped = useMemo(() => {
        const map = new Map<string, CostItem[]>();
        filtered.forEach(item => {
            const cat = item.category || 'Kategorisiz';
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(item);
        });
        return map;
    }, [filtered]);

    const categories = useMemo(() => Array.from(grouped.keys()), [grouped]);

    const handleSaved = useCallback((saved: CostItem) => {
        setItems(prev => {
            const idx = prev.findIndex(i => i.id === saved.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
            }
            return [saved, ...prev];
        });
        // Refresh summary
        if (activeProject) {
            api.get('/costs/summary', { params: { active_project_id: activeProject.id } })
                .then(r => setSummary(r.data.data)).catch(() => {});
        }
    }, [activeProject]);

    const handleDelete = async (item: CostItem) => {
        if (!confirm(`"${item.name}" imalatını silmek istediğinize emin misiniz?`)) return;
        try {
            await api.delete(`/costs/${item.id}`);
            setItems(prev => prev.filter(i => i.id !== item.id));
            toast.success('İmalat silindi.');
            if (activeProject) {
                api.get('/costs/summary', { params: { active_project_id: activeProject.id } })
                    .then(r => setSummary(r.data.data)).catch(() => {});
            }
        } catch {
            toast.error('Silinemedi.');
        }
    };

    const toggleCategory = (cat: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            next.has(cat) ? next.delete(cat) : next.add(cat);
            return next;
        });
    };

    const totalVariance = summary ? summary.variance : 0;
    const hasActual = summary && summary.total_actual > 0;

    if (!activeProject) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">Aktif proje seçilmedi.</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b shrink-0">
                <div>
                    <h1 className="text-sm font-semibold text-slate-800">Maliyet Takip</h1>
                    <p className="text-xs text-slate-400 mt-0.5">{activeProject.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="h-8 gap-1.5">
                        <Settings className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ayarlar</span>
                    </Button>
                    <Button size="sm" onClick={() => { setEditItem(null); setShowItemModal(true); }} className="h-8 gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        İmalat Ekle
                    </Button>
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 shrink-0">
                {/* Toplam Planlanan */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Toplam Planlanan</p>
                    <p className="text-xl font-bold text-slate-800 font-mono">{fmt(summary?.total_planned)}</p>
                    <p className="text-xs text-slate-400 mt-1">{summary?.total_items || 0} imalat kalemi</p>
                </div>

                {/* Toplam Gerçekleşen */}
                <div className={`border rounded-xl p-4 shadow-sm ${hasActual ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Toplam Gerçekleşen</p>
                    <p className={`text-xl font-bold font-mono ${hasActual ? 'text-slate-800' : 'text-slate-300'}`}>
                        {hasActual ? fmt(summary?.total_actual) : '—'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{summary?.completed_count || 0} sözleşmeli</p>
                </div>

                {/* Fark */}
                <div className={`border rounded-xl p-4 shadow-sm ${
                    !hasActual ? 'bg-slate-50 border-slate-100' :
                    totalVariance <= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                }`}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        {!hasActual ? 'Fark' : totalVariance <= 0 ? 'Tasarruf' : 'Aşım'}
                    </p>
                    {!hasActual ? (
                        <p className="text-xl font-bold text-slate-300 font-mono">—</p>
                    ) : (
                        <>
                            <p className={`text-xl font-bold font-mono ${totalVariance <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {totalVariance <= 0 ? '' : '+'}{fmt(Math.abs(totalVariance))}
                            </p>
                            <p className={`text-xs mt-1 font-medium ${totalVariance <= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                {totalVariance <= 0 ? 'bütçe altında' : 'bütçe üstü'}
                            </p>
                        </>
                    )}
                </div>

                {/* Daire Başına */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Daire Başına</p>
                        <button onClick={() => setShowSettings(true)} className="text-slate-300 hover:text-slate-500 transition-colors">
                            <Settings className="w-3 h-3" />
                        </button>
                    </div>
                    <p className="text-xl font-bold text-primary font-mono">{fmt(summary?.planned_per_unit)}</p>
                    <p className="text-xs text-slate-400 mt-1">
                        {summary?.unit_count || 1} daire üzerinden
                        {hasActual && summary && summary.actual_per_unit > 0 && (
                            <span className={`ml-1 font-medium ${summary.actual_per_unit <= summary.planned_per_unit ? 'text-emerald-500' : 'text-red-400'}`}>
                                · Gerçek: {fmt(summary.actual_per_unit)}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="flex items-center gap-3 px-5 pb-3 shrink-0">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="İmalat veya firma ara..." className="pl-8 h-8 text-sm" />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                            <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                        </button>
                    )}
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-8 text-xs w-44">
                        <SelectValue placeholder="Tüm Kategoriler" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Kategoriler</SelectItem>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-xs w-40">
                        <SelectValue placeholder="Tüm Durumlar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Durumlar</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(search || filterCategory !== 'all' || filterStatus !== 'all') && (
                    <button onClick={() => { setSearch(''); setFilterCategory('all'); setFilterStatus('all'); }}
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                        <X className="w-3 h-3" /> Temizle
                    </button>
                )}
            </div>

            {/* ── Table ── */}
            <div className="flex-1 overflow-auto px-5 pb-5">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <RefreshCw className="w-5 h-5 text-slate-300 animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                        <Building2 className="w-8 h-8 text-slate-200 mb-2" />
                        <p className="text-sm text-slate-400">
                            {items.length === 0 ? 'Henüz imalat kalemi eklenmemiş.' : 'Filtrelerle eşleşen imalat yok.'}
                        </p>
                        {items.length === 0 && (
                            <Button size="sm" className="mt-3 h-8" onClick={() => setShowItemModal(true)}>
                                <Plus className="w-3.5 h-3.5 mr-1" /> İlk imalatı ekle
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Table Header */}
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-2.5 bg-slate-50 border-b text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            <span>İmalat</span>
                            <span className="text-right">Miktar</span>
                            <span className="text-right">Planlanan</span>
                            <span className="text-right">Gerçekleşen</span>
                            <span className="text-right">Fark</span>
                            <span>Durum</span>
                            <span></span>
                        </div>

                        {categories.map(cat => {
                            const catItems = grouped.get(cat) || [];
                            const catPlanned = catItems.reduce((s, i) => s + (i.planned_total || 0), 0);
                            const catActual = catItems.reduce((s, i) => s + (i.actual_total || 0), 0);
                            const catVar = catActual > 0 ? catActual - catPlanned : null;
                            const collapsed = collapsedCategories.has(cat);

                            return (
                                <div key={cat}>
                                    {/* Category Row */}
                                    <button
                                        onClick={() => toggleCategory(cat)}
                                        className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-2 bg-slate-50/70 border-b border-slate-100 hover:bg-slate-100/80 transition-colors text-left"
                                    >
                                        <span className="flex items-center gap-1.5 font-semibold text-xs text-slate-700">
                                            {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                            {cat}
                                            <span className="text-[10px] font-normal text-slate-400">({catItems.length})</span>
                                        </span>
                                        <span className="text-right" />
                                        <span className="text-right text-xs font-mono font-semibold text-slate-600">{fmt(catPlanned)}</span>
                                        <span className="text-right text-xs font-mono font-semibold text-slate-600">{catActual > 0 ? fmt(catActual) : '—'}</span>
                                        <span className={`text-right text-xs font-mono font-semibold ${catVar === null ? 'text-slate-300' : catVar <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {catVar === null ? '—' : `${catVar <= 0 ? '' : '+'}${fmt(Math.abs(catVar))}`}
                                        </span>
                                        <span />
                                        <span />
                                    </button>

                                    {/* Item Rows */}
                                    {!collapsed && catItems.map((item, idx) => {
                                        const varAmt = variance(item.planned_total, item.actual_total);
                                        const varP = variancePct(item.planned_total, item.actual_total);
                                        const cfg = STATUS_CONFIG[item.status];
                                        const isLast = idx === catItems.length - 1;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 hover:bg-blue-50/30 transition-colors group ${isLast ? '' : 'border-b border-slate-100'}`}
                                            >
                                                {/* Name + Contractor */}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                                                    {item.contractor && (
                                                        <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                                                            <Building2 className="w-2.5 h-2.5 shrink-0" />{item.contractor}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Miktar */}
                                                <div className="text-right self-center">
                                                    {item.quantity ? (
                                                        <span className="text-xs text-slate-600 font-mono">
                                                            {new Intl.NumberFormat('tr-TR').format(item.quantity)} {item.unit}
                                                        </span>
                                                    ) : <span className="text-slate-300 text-xs">—</span>}
                                                </div>

                                                {/* Planlanan */}
                                                <div className="text-right self-center">
                                                    <span className="text-xs font-mono font-semibold text-slate-700">{fmt(item.planned_total)}</span>
                                                    {item.planned_unit_price && item.quantity && (
                                                        <p className="text-[10px] text-slate-400">{fmt(item.planned_unit_price)}/{item.unit}</p>
                                                    )}
                                                </div>

                                                {/* Gerçekleşen */}
                                                <div className="text-right self-center">
                                                    {item.actual_total ? (
                                                        <>
                                                            <span className="text-xs font-mono font-semibold text-slate-700">{fmt(item.actual_total)}</span>
                                                            {item.actual_unit_price && item.quantity && (
                                                                <p className="text-[10px] text-slate-400">{fmt(item.actual_unit_price)}/{item.unit}</p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => setQuickItem(item)}
                                                            className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            + fiyat gir
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Fark */}
                                                <div className="text-right self-center">
                                                    {varAmt !== null ? (
                                                        <div className={`inline-flex flex-col items-end ${varAmt <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            <span className="text-xs font-mono font-semibold">
                                                                {varAmt <= 0 ? '' : '+'}{fmt(Math.abs(varAmt))}
                                                            </span>
                                                            {varP !== null && (
                                                                <span className="text-[10px]">{fmtPct(varP)}</span>
                                                            )}
                                                        </div>
                                                    ) : <span className="text-slate-300 text-xs">—</span>}
                                                </div>

                                                {/* Status */}
                                                <div className="self-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                </div>

                                                {/* Actions */}
                                                <div className="self-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="p-1 rounded hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-44">
                                                            <DropdownMenuItem onClick={() => setQuickItem(item)} className="gap-2 text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50">
                                                                <TrendingUp className="w-3.5 h-3.5" /> Gerçek Fiyat Gir
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => { setEditItem(item); setShowItemModal(true); }} className="gap-2">
                                                                <Pencil className="w-3.5 h-3.5" /> Düzenle
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleDelete(item)} className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                                                                <Trash2 className="w-3.5 h-3.5" /> Sil
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {/* Total Row */}
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 bg-slate-900 text-white">
                            <span className="text-xs font-bold uppercase tracking-wide">TOPLAM</span>
                            <span />
                            <span className="text-right text-sm font-bold font-mono">{fmt(summary?.total_planned)}</span>
                            <span className="text-right text-sm font-bold font-mono">{summary && summary.total_actual > 0 ? fmt(summary.total_actual) : '—'}</span>
                            <span className={`text-right text-sm font-bold font-mono ${totalVariance <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {summary && summary.total_actual > 0
                                    ? `${totalVariance <= 0 ? '' : '+'}${fmt(Math.abs(totalVariance))}`
                                    : '—'}
                            </span>
                            <span />
                            <span />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            <ItemModal
                open={showItemModal}
                onClose={() => { setShowItemModal(false); setEditItem(null); }}
                editItem={editItem}
                projectId={activeProject.id}
                onSaved={handleSaved}
            />

            <SettingsModal
                open={showSettings}
                onClose={() => setShowSettings(false)}
                settings={settings}
                projectId={activeProject.id}
                onSaved={s => setSettings(s)}
            />

            <QuickActualModal
                item={quickItem}
                onClose={() => setQuickItem(null)}
                onSaved={saved => { handleSaved(saved); setQuickItem(null); }}
            />
        </div>
    );
}
