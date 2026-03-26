'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    FileSignature, Plus, ChevronDown, ChevronUp, Edit2, Trash2,
    X, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, ArrowDownLeft,
    Home, Wallet, MoreVertical, Check, Circle, AlertCircle,
    Building2, Users, Hammer, ShoppingBag,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ContractType = 'customer_sale' | 'contractor' | 'supplier' | 'other';
type ContractStatus = 'draft' | 'active' | 'completed' | 'cancelled';
type PaymentType = 'cash' | 'bank' | 'check' | 'apartment' | 'other';
type InstallmentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

interface Installment {
    id: number;
    contract_id: number;
    installment_no: number;
    description?: string;
    amount: number;
    due_date: string;
    payment_type: PaymentType;
    unit_id?: number;
    status: InstallmentStatus;
    paid_amount: number;
    paid_date?: string;
    notes?: string;
    days_until_due?: number;
}

interface Contract {
    id: number;
    type: ContractType;
    title: string;
    counterparty?: string;
    total_value: number;
    start_date?: string;
    end_date?: string;
    status: ContractStatus;
    description?: string;
    installments: Installment[];
    paid_amount?: number;
    remaining_amount?: number;
    overdue_count?: number;
    next_due?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
    customer_sale: 'Müşteri Satışı', contractor: 'Taşeron', supplier: 'Tedarikçi', other: 'Diğer',
};
const CONTRACT_TYPE_ICONS: Record<ContractType, React.ReactNode> = {
    customer_sale: <Users className="w-3.5 h-3.5" />,
    contractor: <Hammer className="w-3.5 h-3.5" />,
    supplier: <ShoppingBag className="w-3.5 h-3.5" />,
    other: <FileSignature className="w-3.5 h-3.5" />,
};
const CONTRACT_TYPE_COLORS: Record<ContractType, string> = {
    customer_sale: 'bg-green-100 text-green-700',
    contractor: 'bg-orange-100 text-orange-700',
    supplier: 'bg-blue-100 text-blue-700',
    other: 'bg-slate-100 text-slate-600',
};
const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
    draft: 'bg-slate-100 text-slate-500',
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
};
const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
    draft: 'Taslak', active: 'Aktif', completed: 'Tamamlandı', cancelled: 'İptal',
};
const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
    cash: 'Nakit', bank: 'Banka', check: 'Çek', apartment: 'Daire', other: 'Diğer',
};
const PAYMENT_TYPE_ICONS: Record<PaymentType, React.ReactNode> = {
    cash: <Wallet className="w-3 h-3" />,
    bank: <Building2 className="w-3 h-3" />,
    check: <FileSignature className="w-3 h-3" />,
    apartment: <Home className="w-3 h-3" />,
    other: <Circle className="w-3 h-3" />,
};
const INST_STATUS_COLORS: Record<InstallmentStatus, string> = {
    pending: 'bg-amber-50 border-amber-200',
    paid: 'bg-green-50 border-green-200',
    overdue: 'bg-red-50 border-red-200',
    cancelled: 'bg-slate-50 border-slate-200',
};

const fmt = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

function daysLabel(days: number | undefined) {
    if (days === undefined) return '';
    if (days < 0) return `${Math.abs(days)} gün GEÇTİ`;
    if (days === 0) return 'Bugün';
    return `${days} gün kaldı`;
}
function daysColor(days: number | undefined, status: InstallmentStatus) {
    if (status === 'paid' || status === 'cancelled') return 'text-slate-400';
    if (days === undefined) return '';
    if (days < 0) return 'text-red-600 font-bold';
    if (days <= 7) return 'text-orange-500 font-semibold';
    if (days <= 30) return 'text-amber-600';
    return 'text-slate-500';
}

// ─── Pay Installment Modal ────────────────────────────────────────────────────

function PayModal({ installment, onClose, onPaid }: {
    installment: Installment; onClose: () => void; onPaid: (updated: Installment) => void;
}) {
    const [amount, setAmount] = useState(String(installment.amount - installment.paid_amount));
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const handlePay = async () => {
        setSaving(true);
        try {
            const newPaid = installment.paid_amount + parseFloat(amount);
            const isFullyPaid = newPaid >= installment.amount;
            const res = await api.put(`/contracts/${installment.contract_id}/installments/${installment.id}`, {
                paid_amount: newPaid,
                paid_date: date,
                status: isFullyPaid ? 'paid' : 'pending',
                notes: notes || installment.notes,
            });
            toast.success(isFullyPaid ? 'Taksit ödendi ✓' : 'Kısmi ödeme kaydedildi');
            onPaid(res.data.data);
        } catch { toast.error('Hata'); }
        finally { setSaving(false); }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800">Ödeme Kaydet</h2>
                    <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium text-slate-700">{installment.description || `Taksit #${installment.installment_no}`}</p>
                    <p className="text-xs text-slate-500">Toplam: {fmt(installment.amount)} · Ödenen: {fmt(installment.paid_amount)}</p>
                    <p className="text-xs text-slate-500">Kalan: {fmt(installment.amount - installment.paid_amount)}</p>
                </div>
                <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Ödeme Tutarı</span>
                    <input type="number" step="1" className="input-field" value={amount} onChange={e => setAmount(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Ödeme Tarihi</span>
                    <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Not</span>
                    <input className="input-field" placeholder="İsteğe bağlı..." value={notes} onChange={e => setNotes(e.target.value)} />
                </label>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">İptal</button>
                    <button onClick={handlePay} disabled={saving} className="flex-1 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                        {saving ? 'Kaydediliyor...' : 'Ödendi ✓'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Installment Row ──────────────────────────────────────────────────────────

function InstallmentRow({ inst, contractId, onUpdate, onDelete }: {
    inst: Installment; contractId: number;
    onUpdate: (updated: Installment) => void; onDelete: (id: number) => void;
}) {
    const [payOpen, setPayOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const today = new Date();
    const due = new Date(inst.due_date);
    const daysUntil = Math.round((due.getTime() - today.getTime()) / 86400000);

    const handleStatusChange = async (status: InstallmentStatus) => {
        try {
            const res = await api.put(`/contracts/${contractId}/installments/${inst.id}`, { status });
            onUpdate(res.data.data);
            toast.success('Durum güncellendi');
        } catch { toast.error('Hata'); }
        setMenuOpen(false);
    };

    const handleDelete = async () => {
        if (!confirm('Bu taksit silinecek. Emin misiniz?')) return;
        try {
            await api.delete(`/contracts/${contractId}/installments/${inst.id}`);
            onDelete(inst.id);
            toast.success('Taksit silindi');
        } catch { toast.error('Silinemedi'); }
    };

    const paidPct = inst.amount > 0 ? Math.min((inst.paid_amount / inst.amount) * 100, 100) : 0;

    return (
        <div className={`border rounded-xl p-3 ${INST_STATUS_COLORS[inst.status]}`}>
            <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                    {inst.status === 'paid' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    {inst.status === 'overdue' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    {inst.status === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                    {inst.status === 'cancelled' && <X className="w-4 h-4 text-slate-400" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800">
                            {inst.description || `Taksit #${inst.installment_no}`}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 border border-slate-200 text-slate-500">
                            {PAYMENT_TYPE_ICONS[inst.payment_type]} {PAYMENT_TYPE_LABELS[inst.payment_type]}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-800">{fmt(inst.amount)}</span>
                        <span className="text-[10px] text-slate-500">Vade: {fmtDate(inst.due_date)}</span>
                        {inst.status !== 'paid' && inst.status !== 'cancelled' && (
                            <span className={`text-[10px] ${daysColor(daysUntil, inst.status)}`}>
                                {daysLabel(daysUntil)}
                            </span>
                        )}
                        {inst.status === 'paid' && inst.paid_date && (
                            <span className="text-[10px] text-green-600">Ödendi: {fmtDate(inst.paid_date)}</span>
                        )}
                    </div>
                    {/* Progress bar for partial payments */}
                    {inst.paid_amount > 0 && inst.status !== 'paid' && (
                        <div className="mt-1.5 space-y-0.5">
                            <div className="h-1 bg-white/80 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${paidPct}%` }} />
                            </div>
                            <span className="text-[9px] text-green-600">{fmt(inst.paid_amount)} ödendi, {fmt(inst.amount - inst.paid_amount)} kaldı</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {inst.status !== 'paid' && inst.status !== 'cancelled' && (
                        <button
                            onClick={() => setPayOpen(true)}
                            className="px-2 py-1 text-[10px] font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Öde
                        </button>
                    )}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(o => !o)}
                            className="p-1 rounded hover:bg-white/60 text-slate-400"
                        >
                            <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {menuOpen && ReactDOM.createPortal(
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                <div className="fixed z-50 bg-white rounded-xl border border-slate-200 shadow-xl py-1 w-40" style={{ top: 0, left: 0 }} ref={el => {
                                    if (el) {
                                        const btn = el.previousElementSibling as HTMLElement;
                                        if (btn) {
                                            const rect = btn.getBoundingClientRect();
                                            el.style.top = `${rect.bottom + 4}px`;
                                            el.style.left = `${rect.right - 160}px`;
                                        }
                                    }
                                }}>
                                    {inst.status !== 'paid' && <button onClick={() => handleStatusChange('paid')} className="w-full px-3 py-1.5 text-xs text-left text-green-700 hover:bg-green-50 flex items-center gap-2"><CheckCircle2 className="w-3 h-3" />Ödendi işaretle</button>}
                                    {inst.status !== 'pending' && <button onClick={() => handleStatusChange('pending')} className="w-full px-3 py-1.5 text-xs text-left text-amber-700 hover:bg-amber-50 flex items-center gap-2"><Clock className="w-3 h-3" />Beklemede</button>}
                                    {inst.status !== 'cancelled' && <button onClick={() => handleStatusChange('cancelled')} className="w-full px-3 py-1.5 text-xs text-left text-slate-600 hover:bg-slate-50 flex items-center gap-2"><X className="w-3 h-3" />İptal et</button>}
                                    <div className="border-t border-slate-100 my-0.5" />
                                    <button onClick={handleDelete} className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-3 h-3" />Sil</button>
                                </div>
                            </>,
                            document.body
                        )}
                    </div>
                </div>
            </div>

            {payOpen && (
                <PayModal
                    installment={inst}
                    onClose={() => setPayOpen(false)}
                    onPaid={updated => { onUpdate(updated); setPayOpen(false); }}
                />
            )}
        </div>
    );
}

// ─── Add Installment Form ─────────────────────────────────────────────────────

const EMPTY_INST = {
    description: '', amount: '', due_date: '', payment_type: 'cash' as PaymentType,
    notes: '', status: 'pending' as InstallmentStatus,
};

function AddInstallmentForm({ contractId, projectId, onAdded, onCancel, nextNo }: {
    contractId: number; projectId: number; onAdded: (i: Installment) => void;
    onCancel: () => void; nextNo: number;
}) {
    const [form, setForm] = useState(EMPTY_INST);
    const [saving, setSaving] = useState(false);
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.amount || !form.due_date) { toast.error('Tutar ve vade tarihi zorunlu'); return; }
        setSaving(true);
        try {
            const res = await api.post(`/contracts/${contractId}/installments`, {
                ...form, amount: parseFloat(form.amount), installment_no: nextNo,
            });
            onAdded(res.data.data);
            toast.success('Taksit eklendi');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Hata');
        } finally { setSaving(false); }
    };

    return (
        <div className="border border-dashed border-blue-300 rounded-xl p-3 bg-blue-50/50 space-y-3">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Yeni Taksit / Ödeme Kalemi</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input className="input-field col-span-2" placeholder="Açıklama (örn: 1. Taksit, Daire #12)" value={form.description} onChange={e => set('description', e.target.value)} />
                <input type="number" className="input-field" placeholder="Tutar" value={form.amount} onChange={e => set('amount', e.target.value)} />
                <input type="date" className="input-field" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                <select className="input-field" value={form.payment_type} onChange={e => set('payment_type', e.target.value)}>
                    {Object.entries(PAYMENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <input className="input-field col-span-2 sm:col-span-3" placeholder="Not (isteğe bağlı)" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
            <div className="flex gap-2">
                <button onClick={onCancel} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-white">İptal</button>
                <button onClick={handleSubmit} disabled={saving} className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {saving ? '...' : 'Ekle'}
                </button>
            </div>
        </div>
    );
}

// ─── Contract Card ────────────────────────────────────────────────────────────

function ContractCard({ contract, onUpdate, onDelete }: {
    contract: Contract; onUpdate: (c: Contract) => void; onDelete: (id: number) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [addingInst, setAddingInst] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const installments = contract.installments || [];
    const paidCount = installments.filter(i => i.status === 'paid').length;
    const overdueCount = installments.filter(i => i.status === 'overdue' || (i.status === 'pending' && new Date(i.due_date) < new Date())).length;
    const totalPaid = installments.reduce((s, i) => s + i.paid_amount, 0);
    const progress = contract.total_value > 0 ? Math.min((totalPaid / contract.total_value) * 100, 100) : 0;

    const handleInstUpdate = (updated: Installment) => {
        const newInsts = installments.map(i => i.id === updated.id ? updated : i);
        onUpdate({ ...contract, installments: newInsts });
    };
    const handleInstDelete = (id: number) => {
        onUpdate({ ...contract, installments: installments.filter(i => i.id !== id) });
    };
    const handleInstAdded = (inst: Installment) => {
        onUpdate({ ...contract, installments: [...installments, inst] });
        setAddingInst(false);
    };

    const handleDelete = async () => {
        if (!confirm(`"${contract.title}" sözleşmesi ve tüm taksitleri silinecek. Emin misiniz?`)) return;
        try {
            await api.delete(`/contracts/${contract.id}`);
            onDelete(contract.id);
            toast.success('Sözleşme silindi');
        } catch { toast.error('Silinemedi'); }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${CONTRACT_TYPE_COLORS[contract.type]}`}>
                        {CONTRACT_TYPE_ICONS[contract.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-slate-800 truncate">{contract.title}</h3>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${CONTRACT_STATUS_COLORS[contract.status]}`}>
                                {CONTRACT_STATUS_LABELS[contract.status]}
                            </span>
                            {overdueCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-700 flex items-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5" /> {overdueCount} vadesi geçmiş
                                </span>
                            )}
                        </div>
                        {contract.counterparty && (
                            <p className="text-xs text-slate-500 mt-0.5">{contract.counterparty}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-sm font-bold font-mono text-slate-800">{fmt(contract.total_value)}</span>
                            <span className="text-xs text-slate-400">{paidCount}/{installments.length} taksit ödendi</span>
                            {contract.end_date && <span className="text-xs text-slate-400">Bitiş: {fmtDate(contract.end_date)}</span>}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 space-y-1">
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400">
                                <span>Ödenen: {fmt(totalPaid)}</span>
                                <span>Kalan: {fmt(Math.max(0, contract.total_value - totalPaid))}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setExpanded(o => !o)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Installments panel */}
            {expanded && (
                <div className="border-t border-slate-100 p-4 space-y-2 bg-slate-50/50">
                    {installments.length === 0 && !addingInst && (
                        <p className="text-xs text-slate-400 text-center py-2">Henüz taksit eklenmemiş</p>
                    )}
                    {installments.map(inst => (
                        <InstallmentRow
                            key={inst.id}
                            inst={inst}
                            contractId={contract.id}
                            onUpdate={handleInstUpdate}
                            onDelete={handleInstDelete}
                        />
                    ))}
                    {addingInst ? (
                        <AddInstallmentForm
                            contractId={contract.id}
                            projectId={contract.id}
                            onAdded={handleInstAdded}
                            onCancel={() => setAddingInst(false)}
                            nextNo={installments.length + 1}
                        />
                    ) : (
                        <button
                            onClick={() => setAddingInst(true)}
                            className="w-full py-2 text-xs text-blue-600 border border-dashed border-blue-300 rounded-xl hover:bg-blue-50 flex items-center justify-center gap-1"
                        >
                            <Plus className="w-3.5 h-3.5" /> Taksit / Ödeme Kalemi Ekle
                        </button>
                    )}
                </div>
            )}

            {editOpen && (
                <ContractFormModal
                    contract={contract}
                    onClose={() => setEditOpen(false)}
                    onSaved={c => { onUpdate(c); setEditOpen(false); }}
                />
            )}
        </div>
    );
}

// ─── Contract Form Modal ──────────────────────────────────────────────────────

const EMPTY_CONTRACT_FORM = {
    type: 'contractor' as ContractType,
    title: '', counterparty: '', total_value: '',
    start_date: '', end_date: '', status: 'active' as ContractStatus, description: '',
};

function ContractFormModal({ contract, onClose, onSaved }: {
    contract?: Contract; onClose: () => void; onSaved: (c: Contract) => void;
}) {
    const { activeProject } = useProjectStore();
    const [form, setForm] = useState(contract ? {
        type: contract.type, title: contract.title,
        counterparty: contract.counterparty || '', total_value: String(contract.total_value),
        start_date: contract.start_date || '', end_date: contract.end_date || '',
        status: contract.status, description: contract.description || '',
    } : EMPTY_CONTRACT_FORM);
    const [saving, setSaving] = useState(false);
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!form.title) { toast.error('Başlık zorunlu'); return; }
        setSaving(true);
        try {
            const payload = {
                ...form, total_value: parseFloat(form.total_value) || 0,
                active_project_id: activeProject!.id,
            };
            let saved: Contract;
            if (contract) {
                const res = await api.put(`/contracts/${contract.id}`, payload);
                saved = res.data.data;
            } else {
                const res = await api.post('/contracts', payload);
                saved = { ...res.data.data, installments: [] };
            }
            toast.success(contract ? 'Sözleşme güncellendi' : 'Sözleşme oluşturuldu');
            onSaved(saved);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Hata');
        } finally { setSaving(false); }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800">{contract ? 'Sözleşmeyi Düzenle' : 'Yeni Sözleşme'}</h2>
                    <button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
                </div>

                {/* Type buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                    {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map(t => (
                        <button key={t} type="button"
                            onClick={() => set('type', t)}
                            className={`py-2 px-1 rounded-lg text-[10px] font-semibold border transition-colors ${form.type === t ? CONTRACT_TYPE_COLORS[t] + ' border-transparent' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        >
                            <div className="flex justify-center mb-0.5">{CONTRACT_TYPE_ICONS[t]}</div>
                            {CONTRACT_TYPE_LABELS[t]}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <label className="col-span-2 flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Başlık *</span>
                        <input required className="input-field" placeholder="örn: Kaba İnşaat Taşeron Sözleşmesi" value={form.title} onChange={e => set('title', e.target.value)} />
                    </label>
                    <label className="col-span-2 flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {form.type === 'customer_sale' ? 'Müşteri Adı' : form.type === 'contractor' ? 'Taşeron Adı' : form.type === 'supplier' ? 'Tedarikçi Adı' : 'İlgili Taraf'}
                        </span>
                        <input className="input-field" placeholder="Ad / Firma" value={form.counterparty} onChange={e => set('counterparty', e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Toplam Bedel (TL)</span>
                        <input type="number" step="1" className="input-field" placeholder="0" value={form.total_value} onChange={e => set('total_value', e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Durum</span>
                        <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
                            {Object.entries(CONTRACT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Başlangıç Tarihi</span>
                        <input type="date" className="input-field" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Bitiş / Teslim Tarihi</span>
                        <input type="date" className="input-field" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
                    </label>
                    <label className="col-span-2 flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Açıklama / Notlar</span>
                        <textarea rows={2} className="input-field resize-none" placeholder="Sözleşme detayları..." value={form.description} onChange={e => set('description', e.target.value)} />
                    </label>
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">İptal</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Kaydediliyor...' : (contract ? 'Güncelle' : 'Oluştur')}
                    </button>
                </div>
            </form>
        </div>,
        document.body
    );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────

function AlertBanner({ contracts }: { contracts: Contract[] }) {
    const today = new Date();
    const in7 = new Date(today.getTime() + 7 * 86400000);

    const alerts = contracts.flatMap(c =>
        (c.installments || [])
            .filter(i => i.status === 'pending' || i.status === 'overdue')
            .map(i => ({
                ...i,
                contractTitle: c.title,
                contractCounterparty: c.counterparty,
                daysUntil: Math.round((new Date(i.due_date).getTime() - today.getTime()) / 86400000),
            }))
    ).sort((a, b) => a.daysUntil - b.daysUntil);

    const overdue = alerts.filter(a => a.daysUntil < 0);
    const soon = alerts.filter(a => a.daysUntil >= 0 && new Date(a.due_date) <= in7);

    if (overdue.length === 0 && soon.length === 0) return null;

    return (
        <div className="space-y-2">
            {overdue.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        <h3 className="text-sm font-semibold text-red-700">{overdue.length} Taksit Vadesi Geçmiş!</h3>
                    </div>
                    <div className="space-y-2">
                        {overdue.slice(0, 3).map(a => (
                            <div key={a.id} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-red-100">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-800 truncate">{a.contractTitle} · {a.description || `Taksit #${a.installment_no}`}</p>
                                    <p className="text-[10px] text-slate-500">{a.contractCounterparty} · Vade: {fmtDate(a.due_date)}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-mono font-bold text-red-700">{fmt(a.amount)}</p>
                                    <p className="text-[10px] text-red-500">{Math.abs(a.daysUntil)} gün geçti</p>
                                </div>
                            </div>
                        ))}
                        {overdue.length > 3 && <p className="text-[10px] text-red-500 pl-1">+{overdue.length - 3} daha...</p>}
                    </div>
                </div>
            )}
            {soon.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <h3 className="text-sm font-semibold text-amber-700">7 Gün İçinde {soon.length} Taksit Vadesi Dolacak</h3>
                    </div>
                    <div className="space-y-2">
                        {soon.map(a => (
                            <div key={a.id} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-amber-100">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-800 truncate">{a.contractTitle} · {a.description || `Taksit #${a.installment_no}`}</p>
                                    <p className="text-[10px] text-slate-500">{a.contractCounterparty} · Vade: {fmtDate(a.due_date)}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-mono font-bold text-amber-700">{fmt(a.amount)}</p>
                                    <p className="text-[10px] text-amber-600">{a.daysUntil === 0 ? 'Bugün' : `${a.daysUntil} gün kaldı`}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractsPage() {
    const { activeProject } = useProjectStore();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');

    const load = useCallback(() => {
        if (!activeProject) { setLoading(false); return; }
        setLoading(true);
        api.get('/contracts', { params: { active_project_id: activeProject.id } })
            .then(res => setContracts(res.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [activeProject]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() =>
        contracts.filter(c => {
            if (typeFilter && c.type !== typeFilter) return false;
            if (statusFilter && c.status !== statusFilter) return false;
            return true;
        }),
        [contracts, typeFilter, statusFilter]
    );

    // KPI summary
    const summary = useMemo(() => {
        const active = contracts.filter(c => c.status === 'active');
        const allInst = active.flatMap(c => c.installments || []);
        const today = new Date();
        return {
            totalContracts: contracts.length,
            activeContracts: active.length,
            totalValue: active.reduce((s, c) => s + c.total_value, 0),
            totalPaid: active.reduce((s, c) => s + (c.installments || []).reduce((ss, i) => ss + i.paid_amount, 0), 0),
            overdueCount: allInst.filter(i => (i.status === 'pending' || i.status === 'overdue') && new Date(i.due_date) < today).length,
            overdueAmount: allInst.filter(i => (i.status === 'pending' || i.status === 'overdue') && new Date(i.due_date) < today).reduce((s, i) => s + i.amount, 0),
        };
    }, [contracts]);

    if (!activeProject) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <FileSignature className="w-12 h-12 text-slate-200" />
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
                        <FileSignature className="w-4 h-4 text-primary" /> Sözleşmeler & Ödeme Planları
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">{activeProject.name} · Taksit ve vade takibi</p>
                </div>
                <button
                    onClick={() => setFormOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-3.5 h-3.5" /> Yeni Sözleşme
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Aktif Sözleşme', value: String(summary.activeContracts), sub: `${summary.totalContracts} toplam`, color: 'text-blue-700', bg: 'bg-blue-50' },
                    { label: 'Toplam Bedel', value: summary.totalValue >= 1_000_000 ? `₺${(summary.totalValue / 1_000_000).toFixed(1)}M` : `₺${(summary.totalValue / 1_000).toFixed(0)}K`, sub: 'aktif sözleşmeler', color: 'text-slate-700', bg: 'bg-slate-50' },
                    { label: 'Ödenen', value: summary.totalPaid >= 1_000_000 ? `₺${(summary.totalPaid / 1_000_000).toFixed(1)}M` : `₺${(summary.totalPaid / 1_000).toFixed(0)}K`, sub: `${summary.totalValue > 0 ? ((summary.totalPaid / summary.totalValue) * 100).toFixed(0) : 0}%`, color: 'text-green-700', bg: 'bg-green-50' },
                    { label: 'Kalan Borç', value: (summary.totalValue - summary.totalPaid) >= 1_000_000 ? `₺${((summary.totalValue - summary.totalPaid) / 1_000_000).toFixed(1)}M` : `₺${((summary.totalValue - summary.totalPaid) / 1_000).toFixed(0)}K`, sub: 'ödenecek', color: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'Vadesi Geçmiş', value: String(summary.overdueCount), sub: fmt(summary.overdueAmount), color: summary.overdueCount > 0 ? 'text-red-700' : 'text-slate-500', bg: summary.overdueCount > 0 ? 'bg-red-50' : 'bg-slate-50' },
                    { label: 'İlerleme', value: `${summary.totalValue > 0 ? ((summary.totalPaid / summary.totalValue) * 100).toFixed(0) : 0}%`, sub: 'genel ödeme', color: 'text-indigo-700', bg: 'bg-indigo-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-slate-100`}>
                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
                        <p className={`text-base font-bold font-mono ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Alert Banners */}
            <AlertBanner contracts={contracts} />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white">
                    <option value="">Tüm Türler</option>
                    {Object.entries(CONTRACT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
                    {[{ v: '', l: 'Tümü' }, { v: 'active', l: 'Aktif' }, { v: 'completed', l: 'Tamamlanan' }, { v: 'cancelled', l: 'İptal' }].map(({ v, l }) => (
                        <button key={v} onClick={() => setStatusFilter(v)} className={`px-3 py-1.5 ${statusFilter === v ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{l}</button>
                    ))}
                </div>
                <span className="text-xs text-slate-400 ml-auto">{filtered.length} sözleşme</span>
            </div>

            {/* Contracts List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                    <FileSignature className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Sözleşme bulunamadı</p>
                    <button onClick={() => setFormOpen(true)} className="mt-3 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        İlk Sözleşmeyi Oluştur
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(c => (
                        <ContractCard
                            key={c.id}
                            contract={c}
                            onUpdate={updated => setContracts(prev => prev.map(x => x.id === updated.id ? updated : x))}
                            onDelete={id => setContracts(prev => prev.filter(x => x.id !== id))}
                        />
                    ))}
                </div>
            )}

            {/* Form Modal */}
            {formOpen && (
                <ContractFormModal
                    onClose={() => setFormOpen(false)}
                    onSaved={c => { setContracts(prev => [c, ...prev]); setFormOpen(false); }}
                />
            )}
        </div>
    );
}
