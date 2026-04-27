'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    FileText, Plus, Calendar, List, ChevronLeft, ChevronRight,
    ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle, AlertTriangle,
    Trash2, Edit2, MoreVertical, X, TrendingUp, AlertCircle, Copy, Paperclip,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Check {
    id: number;
    project_id: number;
    type: 'received' | 'given';
    document_type: 'check' | 'note';
    check_no?: string;
    amount: number;
    issue_date: string;
    due_date: string;
    bank_name?: string;
    branch?: string;
    counterparty?: string;
    description?: string;
    attachment_path?: string;
    attachment_url?: string;
    status: 'pending' | 'cleared' | 'returned' | 'bounced';
    accounting_account_id?: number;
    invoice_id?: number;
    days_until_due?: number;
    created_at?: string;
}

interface Summary {
    received_pending_count: number;
    received_pending_amount: number;
    given_pending_count: number;
    given_pending_amount: number;
    due_soon_count: number;
    overdue_count: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
    pending: 'Beklemede', cleared: 'Tahsil Edildi', returned: 'İade Edildi', bounced: 'Karşılıksız',
};
const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    cleared: 'bg-green-100 text-green-700',
    returned: 'bg-slate-100 text-slate-600',
    bounced: 'bg-red-100 text-red-700',
};

const fmt = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtK = (n: number) => {
    if (n >= 1_000_000) return '₺' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '₺' + (n / 1_000).toFixed(0) + 'K';
    return fmt(n);
};
const fmtDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

function daysUntilColor(days: number | undefined, status: string) {
    if (status !== 'pending') return '';
    if (days === undefined) return '';
    if (days < 0) return 'text-red-600 font-bold';
    if (days <= 7) return 'text-orange-500 font-semibold';
    if (days <= 30) return 'text-amber-600';
    return 'text-slate-500';
}

function daysLabel(days: number | undefined, status: string) {
    if (status !== 'pending' || days === undefined) return null;
    if (days < 0) return `${Math.abs(days)} gün geçti!`;
    if (days === 0) return 'Bugün';
    return `${days} gün kaldı`;
}

// ─── Check Form Modal ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
    type: 'received' as 'received' | 'given',
    document_type: 'check' as 'check' | 'note',
    check_no: '', amount: '', issue_date: new Date().toISOString().slice(0, 10),
    due_date: '', bank_name: '', branch: '', counterparty: '',
    description: '', status: 'pending' as Check['status'],
};

function CheckFormModal({ check, initialDocumentType, onClose, onSaved, projectId }: {
    check?: Check;
    initialDocumentType?: 'check' | 'note';
    onClose: () => void;
    onSaved: (c: Check) => void;
    projectId: number;
}) {
    const [form, setForm] = useState(check ? {
        type: check.type,
        document_type: check.document_type ?? 'check',
        check_no: check.check_no || '',
        amount: String(check.amount),
        issue_date: check.issue_date ? String(check.issue_date).slice(0, 10) : '',
        due_date: check.due_date ? String(check.due_date).slice(0, 10) : '',
        bank_name: check.bank_name || '',
        branch: check.branch || '',
        counterparty: check.counterparty || '',
        description: check.description || '',
        status: check.status,
    } : { ...EMPTY_FORM, document_type: initialDocumentType ?? 'check' });

    const [saving, setSaving] = useState(false);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const isNote = form.document_type === 'note';
    const docLabel = isNote ? 'Senet' : 'Çek';

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!form.due_date) { toast.error('Vade tarihi zorunlu'); return; }
        setSaving(true);
        try {
            const payload = new FormData();
            payload.append('type', form.type);
            payload.append('document_type', form.document_type);
            payload.append('check_no', form.check_no);
            payload.append('amount', String(parseFloat(form.amount)));
            payload.append('issue_date', form.issue_date);
            payload.append('due_date', form.due_date);
            payload.append('bank_name', form.bank_name);
            payload.append('branch', form.branch);
            payload.append('counterparty', form.counterparty);
            payload.append('description', form.description);
            payload.append('status', form.status);
            payload.append('active_project_id', String(projectId));
            if (attachmentFile) payload.append('attachment', attachmentFile);

            let saved: Check;
            if (check) {
                payload.append('_method', 'PUT');
                const res = await api.post(`/checks/${check.id}`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                saved = res.data.data;
            } else {
                const res = await api.post('/checks', payload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                saved = res.data.data;
            }
            toast.success(check ? `${docLabel} güncellendi` : `${docLabel} kaydedildi`);
            onSaved(saved);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
                onClick={e => e.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800">
                        {check ? `${docLabel} Düzenle` : `Yeni ${docLabel} Ekle`}
                    </h2>
                    <button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
                </div>

                {/* Document type tabs */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                    {(['check', 'note'] as const).map(dt => (
                        <button
                            key={dt} type="button"
                            className={`flex-1 py-2 text-xs font-medium transition-colors ${form.document_type === dt ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            onClick={() => set('document_type', dt)}
                        >
                            {dt === 'check' ? '📄 Çek' : '📝 Senet'}
                        </button>
                    ))}
                </div>

                {/* Type tabs */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                    {(['received', 'given'] as const).map(t => (
                        <button
                            key={t} type="button"
                            className={`flex-1 py-2 text-xs font-medium transition-colors ${form.type === t ? (t === 'received' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white') : 'text-slate-500 hover:bg-slate-50'}`}
                            onClick={() => set('type', t)}
                        >
                            {t === 'received' ? '↙ Alınan' : '↗ Verilen'}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <label className="col-span-2 flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{form.type === 'received' ? 'Kimden' : 'Kime'} *</span>
                        <input required className="input-field" placeholder="Ad / Firma" value={form.counterparty} onChange={e => set('counterparty', e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Tutar *</span>
                        <input required type="number" step="0.01" min="0" className="input-field" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{docLabel} No</span>
                        <input className="input-field" placeholder={`${docLabel} numarası`} value={form.check_no} onChange={e => set('check_no', e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Düzenleme Tarihi</span>
                        <input type="date" className="input-field" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Vade Tarihi *</span>
                        <input required type="date" className="input-field" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Banka</span>
                        <input className="input-field" placeholder="Banka adı" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Şube</span>
                        <input className="input-field" placeholder="Şube" value={form.branch} onChange={e => set('branch', e.target.value)} />
                    </label>
                    <label className="col-span-2 flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Durum</span>
                        <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
                            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </label>
                    <label className="col-span-2 flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Açıklama</span>
                        <textarea rows={2} className="input-field resize-none" placeholder="Notlar..." value={form.description} onChange={e => set('description', e.target.value)} />
                    </label>

                    {/* File upload */}
                    <label className="col-span-2 flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Belge / Görsel</span>
                        <div
                            className="flex items-center gap-2 border border-dashed border-slate-200 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-slate-50"
                            onClick={() => fileRef.current?.click()}
                        >
                            <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs text-slate-500 truncate">
                                {attachmentFile ? attachmentFile.name : check?.attachment_path ? 'Mevcut dosya var — yeni seçin' : 'JPG, PNG veya PDF (maks 10 MB)'}
                            </span>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                            onChange={e => setAttachmentFile(e.target.files?.[0] ?? null)}
                        />
                        {check?.attachment_url && !attachmentFile && (
                            <a href={check.attachment_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 underline mt-0.5">Mevcut dosyayı görüntüle</a>
                        )}
                    </label>
                </div>

                <div className="flex gap-2 pt-1">
                    <button type="button" onClick={onClose} className="flex-1 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">İptal</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Kaydediliyor...' : (check ? 'Güncelle' : 'Kaydet')}
                    </button>
                </div>
            </form>
        </div>,
        document.body
    );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

function CtxMenuPortal({ x, y, check, onEdit, onStatus, onDelete, onCopy, onClose }: {
    x: number; y: number; check: Check;
    onEdit: () => void; onStatus: (s: Check['status']) => void;
    onDelete: () => void; onCopy: () => void; onClose: () => void;
}) {
    const menuW = 180;
    const left = x + menuW > window.innerWidth ? x - menuW : x;
    return ReactDOM.createPortal(
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-44" style={{ top: y, left }}>
                <button onClick={onEdit} className="w-full px-4 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Edit2 className="w-3.5 h-3.5" /> Düzenle
                </button>
                <button onClick={onCopy} className="w-full px-4 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5" /> Kopyala
                </button>
                <div className="border-t border-slate-100 my-1" />
                {check.status !== 'cleared' && (
                    <button onClick={() => onStatus('cleared')} className="w-full px-4 py-2 text-xs text-left text-green-700 hover:bg-green-50 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tahsil Edildi
                    </button>
                )}
                {check.status !== 'returned' && (
                    <button onClick={() => onStatus('returned')} className="w-full px-4 py-2 text-xs text-left text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5" /> İade Edildi
                    </button>
                )}
                {check.status !== 'bounced' && (
                    <button onClick={() => onStatus('bounced')} className="w-full px-4 py-2 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5" /> Karşılıksız
                    </button>
                )}
                {check.status !== 'pending' && (
                    <button onClick={() => onStatus('pending')} className="w-full px-4 py-2 text-xs text-left text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Beklemede
                    </button>
                )}
                <div className="border-t border-slate-100 my-1" />
                <button onClick={onDelete} className="w-full px-4 py-2 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Sil
                </button>
            </div>
        </>,
        document.body
    );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({ checks }: { checks: Check[] }) {
    const [viewDate, setViewDate] = useState(new Date());
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const byDay = useMemo(() => {
        const map: Record<number, Check[]> = {};
        checks.forEach(c => {
            const d = new Date(c.due_date);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (!map[day]) map[day] = [];
                map[day].push(c);
            }
        });
        return map;
    }, [checks, year, month]);

    const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const dayNames = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
    const startOffset = (firstDay + 6) % 7;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-1.5 rounded-lg hover:bg-slate-100">
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <h3 className="text-sm font-semibold text-slate-800">{monthNames[month]} {year}</h3>
                <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-1.5 rounded-lg hover:bg-slate-100">
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                {dayNames.map(d => (
                    <div key={d} className="bg-slate-50 text-center py-1.5 text-[10px] font-semibold text-slate-400 uppercase">{d}</div>
                ))}
                {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`e${i}`} className="bg-white min-h-[64px]" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                    const dayChecks = byDay[day] || [];
                    const hasOverdue = dayChecks.some(c => c.status === 'pending' && new Date(c.due_date) < today);
                    return (
                        <div key={day} className={`bg-white min-h-[64px] p-1 ${isToday ? 'ring-1 ring-inset ring-blue-400' : ''}`}>
                            <span className={`text-[11px] font-semibold block mb-0.5 ${isToday ? 'text-blue-600' : hasOverdue ? 'text-red-500' : 'text-slate-600'}`}>{day}</span>
                            <div className="space-y-0.5">
                                {dayChecks.slice(0, 3).map(c => (
                                    <div key={c.id} className={`text-[9px] px-1 py-0.5 rounded truncate leading-tight ${c.type === 'received' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'} ${c.status === 'cleared' ? 'opacity-40 line-through' : ''} ${c.status === 'bounced' ? 'bg-red-50 text-red-700' : ''}`}>
                                        {c.counterparty || `#${c.id}`} · {fmtK(c.amount)}
                                    </div>
                                ))}
                                {dayChecks.length > 3 && <div className="text-[9px] text-slate-400 pl-1">+{dayChecks.length - 3} daha</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-3 mt-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-200 rounded-sm inline-block" /> Alınan</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-200 rounded-sm inline-block" /> Verilen</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-200 rounded-sm inline-block" /> Karşılıksız</span>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChecksPage() {
    const { activeProject } = useProjectStore();
    const [checks, setChecks] = useState<Check[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [tab, setTab] = useState<'all' | 'received' | 'given'>('all');
    const [docFilter, setDocFilter] = useState<'all' | 'check' | 'note'>('all');
    const [statusFilter, setStatusFilter] = useState('');
    const [formOpen, setFormOpen] = useState<false | 'check' | 'note'>(false);
    const [editCheck, setEditCheck] = useState<Check | undefined>();
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; check: Check } | null>(null);

    const load = useCallback(() => {
        if (!activeProject) { setLoading(false); return; }
        setLoading(true);
        const pid = activeProject.id;
        Promise.all([
            api.get('/checks', { params: { active_project_id: pid } }),
            api.get('/checks/summary', { params: { active_project_id: pid } }),
        ]).then(([chRes, sumRes]) => {
            setChecks(chRes.data.data || []);
            setSummary(sumRes.data.data || null);
        }).catch(console.error).finally(() => setLoading(false));
    }, [activeProject]);

    useEffect(() => { load(); }, [load]);

    const handleSaved = (c: Check) => {
        setChecks(prev => {
            const idx = prev.findIndex(x => x.id === c.id);
            if (idx >= 0) { const n = [...prev]; n[idx] = c; return n; }
            return [c, ...prev];
        });
        setFormOpen(false);
        setEditCheck(undefined);
        load();
    };

    const handleStatus = async (check: Check, status: Check['status']) => {
        try {
            const payload = new FormData();
            payload.append('_method', 'PUT');
            payload.append('status', status);
            const res = await api.post(`/checks/${check.id}`, payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setChecks(prev => prev.map(c => c.id === check.id ? { ...c, ...res.data.data } : c));
            toast.success('Durum güncellendi');
        } catch { toast.error('Hata'); }
        setCtxMenu(null);
    };

    const handleDelete = async (check: Check) => {
        const label = check.document_type === 'note' ? 'Senet' : 'Çek';
        if (!confirm(`"${check.counterparty || label + ' #' + check.id}" silinecek. Emin misiniz?`)) return;
        try {
            await api.delete(`/checks/${check.id}`);
            setChecks(prev => prev.filter(c => c.id !== check.id));
            toast.success(`${label} silindi`);
        } catch { toast.error('Silinemedi'); }
        setCtxMenu(null);
    };

    const handleCopy = async (check: Check) => {
        setCtxMenu(null);
        try {
            const res = await api.post(`/checks/${check.id}/copy`);
            const copied: Check = res.data.data;
            setChecks(prev => [copied, ...prev]);
            toast.success('Kopya oluşturuldu');
            load();
        } catch { toast.error('Kopyalanamadı'); }
    };

    const filtered = useMemo(() => {
        return checks.filter(c => {
            if (tab !== 'all' && c.type !== tab) return false;
            if (docFilter !== 'all' && c.document_type !== docFilter) return false;
            if (statusFilter && c.status !== statusFilter) return false;
            return true;
        });
    }, [checks, tab, docFilter, statusFilter]);

    if (!activeProject) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <FileText className="w-12 h-12 text-slate-200" />
                <p className="text-slate-400 text-sm">Lütfen bir proje seçin</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-4 w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                    <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> Çek & Senet Yönetimi
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">{activeProject.name} · Çek ve senet takibi</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                        <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs font-medium ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <List className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setView('calendar')} className={`px-3 py-1.5 text-xs font-medium ${view === 'calendar' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <Calendar className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <button
                        onClick={() => { setEditCheck(undefined); setFormOpen('check'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-3.5 h-3.5" /> Yeni Çek
                    </button>
                    <button
                        onClick={() => { setEditCheck(undefined); setFormOpen('note'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
                    >
                        <Plus className="w-3.5 h-3.5" /> Senet Ekle
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { label: 'Alınan Bekleyen', value: fmtK(summary.received_pending_amount), sub: `${summary.received_pending_count} kayıt`, color: 'text-blue-700', bg: 'bg-blue-50', icon: <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" /> },
                        { label: 'Verilen Bekleyen', value: fmtK(summary.given_pending_amount), sub: `${summary.given_pending_count} kayıt`, color: 'text-purple-700', bg: 'bg-purple-50', icon: <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" /> },
                        { label: 'Vadesi Yakın', value: String(summary.due_soon_count), sub: '30 gün içinde', color: 'text-amber-700', bg: 'bg-amber-50', icon: <Clock className="w-3.5 h-3.5 text-amber-600" /> },
                        { label: 'Vadesi Geçmiş', value: String(summary.overdue_count), sub: 'bekleyen kayıt', color: 'text-red-700', bg: 'bg-red-50', icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" /> },
                        { label: 'Net Alacak', value: fmtK(summary.received_pending_amount - summary.given_pending_amount), sub: 'alınan - verilen', color: (summary.received_pending_amount >= summary.given_pending_amount) ? 'text-green-700' : 'text-red-700', bg: (summary.received_pending_amount >= summary.given_pending_amount) ? 'bg-green-50' : 'bg-red-50', icon: <TrendingUp className="w-3.5 h-3.5 text-green-600" /> },
                        { label: 'Toplam Kayıt', value: String(checks.length), sub: 'çek + senet', color: 'text-slate-700', bg: 'bg-slate-50', icon: <FileText className="w-3.5 h-3.5 text-slate-500" /> },
                    ].map(s => (
                        <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-slate-100`}>
                            <div className="flex items-center justify-between mb-1">{s.icon}<span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide text-right leading-tight">{s.label}</span></div>
                            <p className={`text-base font-bold font-mono ${s.color}`}>{s.value}</p>
                            <p className="text-[9px] text-slate-400">{s.sub}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Calendar View */}
            {view === 'calendar' && <CalendarView checks={checks} />}

            {/* List View */}
            {view === 'list' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 pt-3 pb-2 border-b border-slate-100">
                        <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs font-medium">
                            {(['all', 'received', 'given'] as const).map(t => (
                                <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 ${tab === t ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    {t === 'all' ? 'Tümü' : t === 'received' ? '↙ Alınan' : '↗ Verilen'}
                                </button>
                            ))}
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs font-medium">
                            {(['all', 'check', 'note'] as const).map(dt => (
                                <button key={dt} onClick={() => setDocFilter(dt)} className={`px-3 py-1.5 ${docFilter === dt ? 'bg-slate-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    {dt === 'all' ? 'Çek+Senet' : dt === 'check' ? 'Çek' : 'Senet'}
                                </button>
                            ))}
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="ml-auto text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white"
                        >
                            <option value="">Tüm Durumlar</option>
                            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-xs text-slate-400">Yükleniyor...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">Kayıt bulunamadı</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-[10px] text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                        <th className="px-4 py-2 text-left font-semibold">Tür</th>
                                        <th className="px-4 py-2 text-left font-semibold">Kimden / Kime</th>
                                        <th className="px-4 py-2 text-left font-semibold">No</th>
                                        <th className="px-4 py-2 text-left font-semibold">Banka</th>
                                        <th className="px-4 py-2 text-right font-semibold">Tutar</th>
                                        <th className="px-4 py-2 text-center font-semibold">Vade Tarihi</th>
                                        <th className="px-4 py-2 text-center font-semibold">Kalan Gün</th>
                                        <th className="px-4 py-2 text-center font-semibold">Durum</th>
                                        <th className="px-2 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(c => (
                                        <tr
                                            key={c.id}
                                            className="group border-b border-slate-50 hover:bg-slate-50 cursor-default"
                                            onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, check: c }); }}
                                        >
                                            <td className="px-4 py-2.5">
                                                <div className="flex flex-col gap-0.5">
                                                    {c.type === 'received' ? (
                                                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold"><ArrowDownLeft className="w-3 h-3" />Alınan</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-purple-600 font-semibold"><ArrowUpRight className="w-3 h-3" />Verilen</span>
                                                    )}
                                                    <span className="text-[9px] text-slate-400">{c.document_type === 'note' ? 'Senet' : 'Çek'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[140px] truncate">
                                                <div className="flex items-center gap-1">
                                                    {c.counterparty || '—'}
                                                    {c.attachment_path && <Paperclip className="w-3 h-3 text-slate-300 shrink-0" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-slate-500">{c.check_no || '—'}</td>
                                            <td className="px-4 py-2.5 text-slate-500 max-w-[120px] truncate">{c.bank_name ? `${c.bank_name}${c.branch ? ' / ' + c.branch : ''}` : '—'}</td>
                                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-800">{fmt(c.amount)}</td>
                                            <td className="px-4 py-2.5 text-center font-mono text-slate-600">{fmtDate(c.due_date)}</td>
                                            <td className={`px-4 py-2.5 text-center font-mono ${daysUntilColor(c.days_until_due, c.status)}`}>
                                                {daysLabel(c.days_until_due, c.status) || '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[c.status]}`}>
                                                    {STATUS_LABELS[c.status]}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2.5">
                                                <button
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200"
                                                    onClick={e => { e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, check: c }); }}
                                                >
                                                    <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Calendar + List together when in calendar view */}
            {view === 'calendar' && filtered.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-slate-700">Yaklaşan Vadeler</h3>
                        <span className="text-[10px] text-slate-400 ml-auto">{filtered.filter(c => c.status === 'pending').length} bekleyen</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {filtered
                            .filter(c => c.status === 'pending')
                            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                            .slice(0, 10)
                            .map(c => (
                                <div key={c.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                                    {c.type === 'received'
                                        ? <ArrowDownLeft className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        : <ArrowUpRight className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 truncate">{c.counterparty || `#${c.id}`}</p>
                                        <p className="text-[10px] text-slate-400">{c.document_type === 'note' ? 'Senet' : 'Çek'}{c.bank_name ? ` · ${c.bank_name}` : ''}{c.check_no ? ` · #${c.check_no}` : ''}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-mono font-semibold text-slate-800">{fmt(c.amount)}</p>
                                        <p className={`text-[10px] ${daysUntilColor(c.days_until_due, c.status)}`}>{fmtDate(c.due_date)}{c.days_until_due !== undefined ? ` · ${daysLabel(c.days_until_due, c.status)}` : ''}</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {(formOpen || editCheck) && (
                <CheckFormModal
                    check={editCheck}
                    initialDocumentType={formOpen !== false ? formOpen : undefined}
                    projectId={activeProject.id}
                    onClose={() => { setFormOpen(false); setEditCheck(undefined); }}
                    onSaved={handleSaved}
                />
            )}

            {/* Context Menu */}
            {ctxMenu && (
                <CtxMenuPortal
                    x={ctxMenu.x} y={ctxMenu.y} check={ctxMenu.check}
                    onEdit={() => { setEditCheck(ctxMenu.check); setCtxMenu(null); }}
                    onStatus={s => handleStatus(ctxMenu.check, s)}
                    onDelete={() => handleDelete(ctxMenu.check)}
                    onCopy={() => handleCopy(ctxMenu.check)}
                    onClose={() => setCtxMenu(null)}
                />
            )}
        </div>
    );
}
