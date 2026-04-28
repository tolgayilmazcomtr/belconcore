'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    HardHat, Plus, Trash2, Edit2, X, ChevronDown, ChevronRight,
    Building2, BarChart3,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlockSummary {
    id: number;
    name: string;
    code?: string;
    units: { id: number; status: string }[];
}

interface ProgressItem {
    id: number;
    block_id: number | null;
    name: string;
    category: string;
    progress: number;
    note: string | null;
}

const DEFAULT_CATEGORIES = ['Kaba İnşaat', 'Çatı', 'Sıva', 'Elektrik', 'Tesisat', 'İnce İşler', 'Peyzaj', 'Diğer'];

const CATEGORY_COLORS: Record<string, string> = {
    'Kaba İnşaat': 'bg-amber-500',
    'Çatı':        'bg-slate-500',
    'Sıva':        'bg-orange-400',
    'Elektrik':    'bg-yellow-400',
    'Tesisat':     'bg-cyan-500',
    'İnce İşler':  'bg-blue-500',
    'Peyzaj':      'bg-green-500',
    'Diğer':       'bg-purple-400',
};

function progressColor(p: number) {
    if (p >= 80) return 'bg-green-500';
    if (p >= 40) return 'bg-blue-500';
    if (p >= 10) return 'bg-amber-500';
    return 'bg-slate-300';
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500';

// ─── Item Form Modal ──────────────────────────────────────────────────────────

function ItemModal({ item, blocks, onClose, onSaved }: {
    item?: ProgressItem;
    blocks: BlockSummary[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const { activeProject } = useProjectStore();
    const [form, setForm] = useState({
        block_id: item?.block_id?.toString() ?? '',
        name: item?.name ?? '',
        category: item?.category ?? DEFAULT_CATEGORIES[0],
        progress: item?.progress ?? 0,
        note: item?.note ?? '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                block_id: form.block_id ? Number(form.block_id) : null,
                progress: Number(form.progress),
                active_project_id: activeProject?.id,
            };
            if (item) {
                await api.put(`/site-progress/${item.id}`, payload);
                toast.success('Güncellendi');
            } else {
                await api.post('/site-progress', payload);
                toast.success('İş kalemi eklendi');
            }
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
                onClick={e => e.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <HardHat className="w-4 h-4 text-amber-500" />
                        {item ? 'İş Kalemi Düzenle' : 'İş Kalemi Ekle'}
                    </h2>
                    <button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
                </div>

                <div className="space-y-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Blok (boş = proje geneli)</span>
                        <select className={inputCls} value={form.block_id} onChange={e => set('block_id', e.target.value)}>
                            <option value="">— Proje Geneli —</option>
                            {blocks.map(b => (
                                <option key={b.id} value={b.id}>{b.code ? `[${b.code}] ` : ''}{b.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Kategori *</span>
                        <select required className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
                            {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">İş Kalemi Adı *</span>
                        <input required className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Örn: Bodrum kat döşeme betonu" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">İlerleme: %{form.progress}</span>
                        <input
                            type="range" min={0} max={100} step={5}
                            value={form.progress}
                            onChange={e => set('progress', e.target.value)}
                            className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-[9px] text-slate-300">
                            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                        </div>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Not</span>
                        <textarea rows={2} className={inputCls} value={form.note} onChange={e => set('note', e.target.value)} placeholder="İsteğe bağlı not..." />
                    </label>
                </div>

                <div className="flex gap-2 pt-1">
                    <button type="button" onClick={onClose} className="flex-1 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">İptal</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Kaydediliyor...' : (item ? 'Güncelle' : 'Ekle')}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, showLabel = false }: { value: number; showLabel?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor(value)}`}
                    style={{ width: `${value}%` }}
                />
            </div>
            {showLabel && <span className="text-xs font-mono font-semibold text-slate-600 w-9 text-right">{value}%</span>}
        </div>
    );
}

// ─── Block Card ───────────────────────────────────────────────────────────────

function BlockCard({ block, items, onEdit, onDelete, onAdd }: {
    block: BlockSummary;
    items: ProgressItem[];
    onEdit: (item: ProgressItem) => void;
    onDelete: (item: ProgressItem) => void;
    onAdd: (blockId: number) => void;
}) {
    const [open, setOpen] = useState(true);
    const avg = items.length ? Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length) : 0;
    const sold = block.units.filter(u => u.status === 'sold').length;
    const total = block.units.length;

    // Group by category
    const grouped = items.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {} as Record<string, ProgressItem[]>);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50 cursor-pointer select-none"
                onClick={() => setOpen(o => !o)}
            >
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                        {block.code ? `[${block.code}] ` : ''}{block.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        <ProgressBar value={avg} showLabel />
                        {total > 0 && (
                            <span className="text-[10px] text-slate-400 shrink-0">{sold}/{total} satıldı</span>
                        )}
                    </div>
                </div>
                <button
                    onClick={e => { e.stopPropagation(); onAdd(block.id); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-[11px] font-semibold rounded-lg hover:bg-blue-700 shrink-0"
                >
                    <Plus size={11} /> Ekle
                </button>
                {open ? <ChevronDown size={15} className="text-slate-400 shrink-0" /> : <ChevronRight size={15} className="text-slate-400 shrink-0" />}
            </div>

            {/* Items */}
            {open && (
                <div className="divide-y divide-slate-50">
                    {items.length === 0 && (
                        <p className="px-5 py-4 text-xs text-slate-400 text-center">Henüz iş kalemi yok — Ekle butonuna tıklayın</p>
                    )}
                    {Object.entries(grouped).map(([cat, catItems]) => (
                        <div key={cat}>
                            <div className="flex items-center gap-2 px-5 py-1.5 bg-slate-50/70">
                                <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat] ?? 'bg-slate-400'}`} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{cat}</span>
                            </div>
                            {catItems.map(item => (
                                <div key={item.id} className="flex items-center gap-4 px-5 py-2.5 hover:bg-slate-50 group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-700 truncate">{item.name}</p>
                                        {item.note && <p className="text-[10px] text-slate-400 truncate">{item.note}</p>}
                                        <div className="mt-1.5">
                                            <ProgressBar value={item.progress} showLabel />
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                                        <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500">
                                            <Edit2 size={12} />
                                        </button>
                                        <button onClick={() => onDelete(item)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SiteProgressPage() {
    const { activeProject } = useProjectStore();
    const [blocks, setBlocks] = useState<BlockSummary[]>([]);
    const [items, setItems] = useState<ProgressItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ open: boolean; item?: ProgressItem; blockId?: number }>({ open: false });

    const load = useCallback(async () => {
        if (!activeProject) { setLoading(false); return; }
        setLoading(true);
        try {
            const res = await api.get('/site-progress', { params: { active_project_id: activeProject.id } });
            setBlocks(res.data.blocks ?? []);
            setItems(res.data.items ?? []);
        } catch {
            toast.error('Veriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [activeProject]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (item: ProgressItem) => {
        if (!confirm(`"${item.name}" silinecek. Emin misiniz?`)) return;
        try {
            await api.delete(`/site-progress/${item.id}`);
            toast.success('Silindi');
            setItems(prev => prev.filter(i => i.id !== item.id));
        } catch {
            toast.error('Silinemedi');
        }
    };

    const openAdd = (blockId?: number) => setModal({ open: true, blockId });
    const openEdit = (item: ProgressItem) => setModal({ open: true, item });

    // Overall progress
    const overallAvg = items.length ? Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length) : 0;

    // Project-wide items (no block)
    const generalItems = items.filter(i => i.block_id === null);

    if (!activeProject) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-slate-400">Lütfen üstten bir proje seçin.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <HardHat className="w-5 h-5 text-amber-500" /> Şantiye İlerleme
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">{activeProject.name} — Blok bazlı iş kalemi takibi</p>
                </div>
                <button
                    onClick={() => openAdd()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
                >
                    <Plus size={13} /> İş Kalemi Ekle
                </button>
            </div>

            {/* Genel İlerleme Özeti */}
            {!loading && items.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                            <BarChart3 size={13} /> Genel Proje İlerlemesi
                        </p>
                        <span className="text-2xl font-bold font-mono text-slate-900">{overallAvg}%</span>
                    </div>
                    <ProgressBar value={overallAvg} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {blocks.map(b => {
                            const bItems = items.filter(i => i.block_id === b.id);
                            const avg = bItems.length ? Math.round(bItems.reduce((s, i) => s + i.progress, 0) / bItems.length) : 0;
                            return (
                                <div key={b.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                    <p className="text-[10px] font-semibold text-slate-500 truncate">{b.name}</p>
                                    <p className="text-lg font-bold font-mono text-slate-800 mt-0.5">{avg}%</p>
                                    <ProgressBar value={avg} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-16 text-sm text-slate-400">Yükleniyor...</div>
            ) : (
                <div className="space-y-4">
                    {/* Proje geneli iş kalemleri */}
                    {generalItems.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50">
                                <HardHat className="w-4 h-4 text-slate-400" />
                                <p className="text-sm font-semibold text-slate-800 flex-1">Proje Geneli</p>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {generalItems.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 px-5 py-2.5 hover:bg-slate-50 group">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-slate-700 truncate">{item.name}</p>
                                            {item.note && <p className="text-[10px] text-slate-400 truncate">{item.note}</p>}
                                            <div className="mt-1.5"><ProgressBar value={item.progress} showLabel /></div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                                            <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500"><Edit2 size={12} /></button>
                                            <button onClick={() => handleDelete(item)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Blok kartları */}
                    {blocks.map(block => (
                        <BlockCard
                            key={block.id}
                            block={block}
                            items={items.filter(i => i.block_id === block.id)}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onAdd={openAdd}
                        />
                    ))}

                    {blocks.length === 0 && generalItems.length === 0 && (
                        <div className="text-center py-20 text-sm text-slate-400">
                            <HardHat className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                            <p>Henüz iş kalemi yok.</p>
                            <p className="text-xs mt-1">Sağ üstteki "İş Kalemi Ekle" butonuyla başlayın.</p>
                        </div>
                    )}
                </div>
            )}

            {modal.open && (
                <ItemModal
                    item={modal.item}
                    blocks={blocks}
                    onClose={() => setModal({ open: false })}
                    onSaved={load}
                />
            )}
        </div>
    );
}
