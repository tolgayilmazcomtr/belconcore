'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  FileText, Plus, Edit2, Trash2, X, CheckCircle2, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownLeft, Building2, Users, Hammer, ShoppingBag,
  Download, Upload, ChevronLeft, CreditCard, Receipt, Calendar,
  FileCheck, AlertCircle, Circle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  document_path?: string;
  document_name?: string;
}

interface AccountingAccount {
  id: number;
  name: string;
  code?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  customer_sale: 'Müşteri Satış',
  contractor: 'Yüklenici',
  supplier: 'Tedarikçi',
  other: 'Diğer',
};

const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Taslak',
  active: 'Aktif',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = {
  pending: 'Bekliyor',
  paid: 'Ödendi',
  overdue: 'Gecikmiş',
  cancelled: 'İptal',
};

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  cash: 'Nakit',
  bank: 'Banka',
  check: 'Çek',
  apartment: 'Daire',
  other: 'Diğer',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('tr-TR');
}

function daysUntil(date: string): number {
  const diff = new Date(date).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86400000);
}

function contractTypeIcon(type: ContractType) {
  const cls = 'w-4 h-4';
  switch (type) {
    case 'customer_sale': return <ArrowUpRight className={cls} />;
    case 'contractor':    return <Hammer className={cls} />;
    case 'supplier':      return <ShoppingBag className={cls} />;
    default:              return <FileText className={cls} />;
  }
}

function statusPill(status: ContractStatus) {
  const base = 'px-1.5 py-0.5 text-[11px] font-medium rounded-sm';
  const map: Record<ContractStatus, string> = {
    draft:     'bg-slate-100 text-slate-600',
    active:    'bg-emerald-50 text-emerald-700',
    completed: 'bg-blue-50 text-blue-700',
    cancelled: 'bg-red-50 text-red-600',
  };
  return <span className={`${base} ${map[status]}`}>{CONTRACT_STATUS_LABELS[status]}</span>;
}

function installmentStatusIcon(status: InstallmentStatus) {
  switch (status) {
    case 'paid':     return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'overdue':  return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'cancelled':return <X className="w-4 h-4 text-slate-400" />;
    default:         return <Circle className="w-4 h-4 text-slate-300" />;
  }
}

function documentUrl(contract: Contract): string | null {
  if (!contract.document_path) return null;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';
  return `${base}/storage/${contract.document_path}`;
}

// ─── PayModal ─────────────────────────────────────────────────────────────────

interface PayModalProps {
  contractId: number;
  installment: Installment;
  onClose: () => void;
  onSuccess: () => void;
}

function PayModal({ contractId, installment, onClose, onSuccess }: PayModalProps) {
  const [paidAmount, setPaidAmount] = useState(String(installment.amount - installment.paid_amount));
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const paid = parseFloat(paidAmount);
      const newStatus = paid >= installment.amount ? 'paid' : 'pending';
      await api.put(`/contracts/${contractId}/installments/${installment.id}`, {
        paid_amount: paid,
        paid_date: paidDate,
        notes,
        status: newStatus,
      });
      toast.success('Ödeme kaydedildi');
      onSuccess();
    } catch {
      toast.error('Ödeme kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
        <ModalHeader title="Ödeme Kaydet" onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Taksit</label>
            <p className="text-sm text-slate-700 font-medium">#{installment.installment_no} — {fmt(installment.amount)}</p>
          </div>
          <FormField label="Ödenen Tutar (₺)">
            <input
              type="number" step="0.01" required
              value={paidAmount}
              onChange={e => setPaidAmount(e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label="Ödeme Tarihi">
            <input
              type="date" required
              value={paidDate}
              onChange={e => setPaidDate(e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label="Notlar">
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={inputCls}
            />
          </FormField>
          <ModalFooter onClose={onClose} saving={saving} submitLabel="Ödemeyi Kaydet" />
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── InvoiceModal ─────────────────────────────────────────────────────────────

interface InvoiceModalProps {
  contractId: number;
  installment: Installment;
  accounts: AccountingAccount[];
  onClose: () => void;
  onSuccess: () => void;
}

function InvoiceModal({ contractId, installment, accounts, onClose, onSuccess }: InvoiceModalProps) {
  const [form, setForm] = useState({
    account_id: '',
    invoice_no: '',
    date: new Date().toISOString().slice(0, 10),
    document_type: 'invoice',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/contracts/${contractId}/installments/${installment.id}/invoice`, {
        ...form,
        account_id: form.account_id ? parseInt(form.account_id) : undefined,
      });
      toast.success('Fatura oluşturuldu');
      onSuccess();
    } catch {
      toast.error('Fatura oluşturulamadı');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
        <ModalHeader title="Faturalaştır" onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormField label="Hesap">
            <select
              value={form.account_id}
              onChange={e => set('account_id', e.target.value)}
              className={inputCls}
            >
              <option value="">Hesap seçin</option>
              {accounts.map(a => (
                <option key={a.id} value={String(a.id)}>
                  {a.code ? `${a.code} — ` : ''}{a.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Fatura No">
            <input
              type="text"
              value={form.invoice_no}
              onChange={e => set('invoice_no', e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label="Tarih">
            <input
              type="date" required
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label="Belge Tipi">
            <select
              value={form.document_type}
              onChange={e => set('document_type', e.target.value)}
              className={inputCls}
            >
              <option value="invoice">Fatura</option>
              <option value="receipt">Makbuz</option>
              <option value="other">Diğer</option>
            </select>
          </FormField>
          <FormField label="Açıklama">
            <textarea
              rows={2}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className={inputCls}
            />
          </FormField>
          <ModalFooter onClose={onClose} saving={saving} submitLabel="Fatura Oluştur" />
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── ContractFormModal ────────────────────────────────────────────────────────

interface ContractFormModalProps {
  contract?: Contract;
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}

function ContractFormModal({ contract, projectId, onClose, onSuccess }: ContractFormModalProps) {
  const [form, setForm] = useState({
    title: contract?.title ?? '',
    type: (contract?.type ?? 'customer_sale') as ContractType,
    status: (contract?.status ?? 'draft') as ContractStatus,
    counterparty: contract?.counterparty ?? '',
    total_value: contract ? String(contract.total_value) : '',
    start_date: contract?.start_date ?? '',
    end_date: contract?.end_date ?? '',
    description: contract?.description ?? '',
  });
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        total_value: parseFloat(form.total_value),
        project_id: projectId,
      };
      if (contract) {
        await api.put(`/contracts/${contract.id}`, payload);
        toast.success('Sözleşme güncellendi');
      } else {
        await api.post('/contracts', payload);
        toast.success('Sözleşme oluşturuldu');
      }
      onSuccess();
    } catch {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl">
        <ModalHeader title={contract ? 'Sözleşme Düzenle' : 'Yeni Sözleşme'} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormField label="Başlık *">
            <input
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className={inputCls}
              placeholder="Sözleşme başlığı"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tip">
              <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls}>
                {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map(t => (
                  <option key={t} value={t}>{CONTRACT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Durum">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map(s => (
                  <option key={s} value={s}>{CONTRACT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Karşı Taraf">
            <input
              value={form.counterparty}
              onChange={e => set('counterparty', e.target.value)}
              className={inputCls}
              placeholder="Şirket veya kişi adı"
            />
          </FormField>
          <FormField label="Toplam Değer (₺) *">
            <input
              required type="number" step="0.01"
              value={form.total_value}
              onChange={e => set('total_value', e.target.value)}
              className={inputCls}
              placeholder="0.00"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Başlangıç Tarihi">
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Bitiş Tarihi">
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className={inputCls} />
            </FormField>
          </div>
          <FormField label="Açıklama">
            <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} />
          </FormField>
          <ModalFooter onClose={onClose} saving={saving} submitLabel={contract ? 'Güncelle' : 'Oluştur'} />
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── AddInstallmentModal ──────────────────────────────────────────────────────

interface AddInstallmentModalProps {
  contractId: number;
  nextNo: number;
  onClose: () => void;
  onSuccess: () => void;
}

function AddInstallmentModal({ contractId, nextNo, onClose, onSuccess }: AddInstallmentModalProps) {
  const [form, setForm] = useState({
    installment_no: String(nextNo),
    description: '',
    amount: '',
    due_date: '',
    payment_type: 'bank' as PaymentType,
  });
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/contracts/${contractId}/installments`, {
        ...form,
        installment_no: parseInt(form.installment_no),
        amount: parseFloat(form.amount),
      });
      toast.success('Taksit eklendi');
      onSuccess();
    } catch {
      toast.error('Taksit eklenemedi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
        <ModalHeader title="Taksit Ekle" onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Taksit No">
              <input
                type="number" required
                value={form.installment_no}
                onChange={e => set('installment_no', e.target.value)}
                className={inputCls}
              />
            </FormField>
            <FormField label="Ödeme Tipi">
              <select value={form.payment_type} onChange={e => set('payment_type', e.target.value)} className={inputCls}>
                {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map(t => (
                  <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Açıklama">
            <input
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className={inputCls}
              placeholder="İsteğe bağlı"
            />
          </FormField>
          <FormField label="Tutar (₺) *">
            <input
              required type="number" step="0.01"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label="Vade Tarihi *">
            <input
              required type="date"
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
              className={inputCls}
            />
          </FormField>
          <ModalFooter onClose={onClose} saving={saving} submitLabel="Taksit Ekle" />
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── Shared UI components ─────────────────────────────────────────────────────

const inputCls = 'w-full border border-slate-200 rounded px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ModalFooter({ onClose, saving, submitLabel }: { onClose: () => void; saving: boolean; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded hover:bg-slate-50">
        İptal
      </button>
      <button
        type="submit" disabled={saving}
        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Kaydediliyor...' : submitLabel}
      </button>
    </div>
  );
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  contract: Contract;
  accounts: AccountingAccount[];
  onEdit: () => void;
  onDeleted: () => void;
  onRefresh: () => void;
  onBack?: () => void;
}

function DetailPanel({ contract, accounts, onEdit, onDeleted, onRefresh, onBack }: DetailPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [payTarget, setPayTarget] = useState<Installment | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<Installment | null>(null);
  const [addInstallment, setAddInstallment] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const paid = contract.paid_amount ?? 0;
  const total = contract.total_value;
  const paidPct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const overdue = (contract.installments ?? []).filter(i => i.status === 'overdue');
  const soonDue = (contract.installments ?? []).filter(i => i.status === 'pending' && daysUntil(i.due_date) <= 7 && daysUntil(i.due_date) >= 0);

  async function handleStatusChange(status: string) {
    setStatusSaving(true);
    try {
      await api.put(`/contracts/${contract.id}`, { status });
      toast.success('Durum güncellendi');
      onRefresh();
    } catch {
      toast.error('Durum güncellenemedi');
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      await api.post(`/contracts/${contract.id}/document`, fd);
      toast.success('Belge yüklendi');
      onRefresh();
    } catch {
      toast.error('Yükleme başarısız');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteInstallment(id: number) {
    if (!confirm('Bu taksiti silmek istediğinize emin misiniz?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/contracts/${contract.id}/installments/${id}`);
      toast.success('Taksit silindi');
      onRefresh();
    } catch {
      toast.error('Taksit silinemedi');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteContract() {
    if (!confirm('Bu sözleşmeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      await api.delete(`/contracts/${contract.id}`);
      toast.success('Sözleşme silindi');
      onDeleted();
    } catch {
      toast.error('Sözleşme silinemedi');
    }
  }

  const nextNo = Math.max(0, ...(contract.installments ?? []).map(i => i.installment_no)) + 1;
  const docUrl = documentUrl(contract);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Back button (mobile) */}
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1 px-4 py-2.5 text-sm text-slate-600 border-b border-slate-100 hover:bg-slate-50 md:hidden">
          <ChevronLeft className="w-4 h-4" /> Listele Dön
        </button>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Alert strip */}
        {overdue.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span><strong>{overdue.length}</strong> gecikmiş taksit var.</span>
          </div>
        )}
        {overdue.length === 0 && soonDue.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded text-sm text-amber-700">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span><strong>{soonDue.length}</strong> taksit 7 gün içinde vadesi doluyor.</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400">{contractTypeIcon(contract.type)}</span>
              <span className="text-xs text-slate-500">{CONTRACT_TYPE_LABELS[contract.type]}</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900 leading-tight">{contract.title}</h2>
            {contract.counterparty && (
              <p className="text-sm text-slate-500 mt-0.5">{contract.counterparty}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <select
              value={contract.status}
              disabled={statusSaving}
              onChange={e => handleStatusChange(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map(s => (
                <option key={s} value={s}>{CONTRACT_STATUS_LABELS[s]}</option>
              ))}
            </select>
            <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-slate-700 border border-slate-200 rounded hover:bg-slate-50">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDeleteContract} className="p-1.5 text-slate-400 hover:text-red-500 border border-slate-200 rounded hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <MetaItem label="Başlangıç" value={fmtDate(contract.start_date)} />
          <MetaItem label="Bitiş" value={fmtDate(contract.end_date)} />
          <MetaItem label="Toplam Değer" value={fmt(contract.total_value)} />
          <MetaItem label="Kalan" value={fmt(contract.remaining_amount ?? (contract.total_value - paid))} />
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Ödeme İlerlemesi</span>
            <span>{fmt(paid)} / {fmt(total)}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${paidPct}%` }}
            />
          </div>
        </div>

        {/* Document */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Belge</p>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
          {docUrl ? (
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded bg-slate-50 text-sm">
              <FileCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="truncate text-slate-700 flex-1">{contract.document_name ?? contract.document_path}</span>
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> İndir
              </a>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-slate-600 text-xs flex-shrink-0"
                disabled={uploading}
              >
                Değiştir
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded text-sm text-slate-500 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Yükleniyor...' : 'Belge Yükle'}
            </button>
          )}
        </div>

        {/* Installments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Taksitler</p>
            <button
              onClick={() => setAddInstallment(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Taksit Ekle
            </button>
          </div>

          {(!contract.installments || contract.installments.length === 0) ? (
            <p className="text-sm text-slate-400 py-4 text-center">Henüz taksit yok.</p>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50">
                    <th className="pl-5 py-2 text-left font-medium text-slate-500 w-8">No</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Açıklama</th>
                    <th className="px-2 py-2 text-right font-medium text-slate-500">Tutar</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Vade</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Tip</th>
                    <th className="px-2 py-2 text-center font-medium text-slate-500">Durum</th>
                    <th className="px-2 py-2 text-right font-medium text-slate-500">Kalan Gün</th>
                    <th className="pr-5 py-2 text-right font-medium text-slate-500">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {contract.installments.map(inst => {
                    const days = daysUntil(inst.due_date);
                    const isPending = inst.status === 'pending';
                    return (
                      <tr key={inst.id} className="hover:bg-slate-50/60">
                        <td className="pl-5 py-2 text-slate-500">{inst.installment_no}</td>
                        <td className="px-2 py-2 text-slate-700 max-w-[100px] truncate">{inst.description || '—'}</td>
                        <td className="px-2 py-2 text-right text-slate-800 font-medium tabular-nums">{fmt(inst.amount)}</td>
                        <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{fmtDate(inst.due_date)}</td>
                        <td className="px-2 py-2 text-slate-500">{PAYMENT_TYPE_LABELS[inst.payment_type]}</td>
                        <td className="px-2 py-2 text-center">
                          <span className="inline-flex items-center gap-1">
                            {installmentStatusIcon(inst.status)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {inst.status === 'paid' ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <span className={days < 0 ? 'text-red-600 font-medium' : days <= 7 ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                              {days < 0 ? `${Math.abs(days)}g geç` : `${days}g`}
                            </span>
                          )}
                        </td>
                        <td className="pr-5 py-2">
                          <div className="flex items-center justify-end gap-1">
                            {isPending && (
                              <>
                                <button
                                  title="Öde"
                                  onClick={() => setPayTarget(inst)}
                                  className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  title="Faturalaştır"
                                  onClick={() => setInvoiceTarget(inst)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              title="Sil"
                              onClick={() => handleDeleteInstallment(inst.id)}
                              disabled={deletingId === inst.id}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Description */}
        {contract.description && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Açıklama</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{contract.description}</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {payTarget && (
        <PayModal
          contractId={contract.id}
          installment={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={() => { setPayTarget(null); onRefresh(); }}
        />
      )}
      {invoiceTarget && (
        <InvoiceModal
          contractId={contract.id}
          installment={invoiceTarget}
          accounts={accounts}
          onClose={() => setInvoiceTarget(null)}
          onSuccess={() => { setInvoiceTarget(null); onRefresh(); }}
        />
      )}
      {addInstallment && (
        <AddInstallmentModal
          contractId={contract.id}
          nextNo={nextNo}
          onClose={() => setAddInstallment(false)}
          onSuccess={() => { setAddInstallment(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-800 font-medium">{value}</p>
    </div>
  );
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

function KpiTile({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded">
      <div className="text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 truncate">{label}</p>
        <p className="text-sm font-semibold text-slate-900 tabular-nums truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── ContractRow ──────────────────────────────────────────────────────────────

function ContractRow({ contract, selected, onClick }: { contract: Contract; selected: boolean; onClick: () => void }) {
  return (
    <li
      onClick={onClick}
      className={`relative flex flex-col gap-0.5 px-4 py-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 transition-colors ${selected ? 'bg-blue-50/60' : ''}`}
    >
      {selected && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r" />}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-slate-400 flex-shrink-0">{contractTypeIcon(contract.type)}</span>
          <span className="text-sm font-medium text-slate-900 truncate">{contract.title}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {(contract.overdue_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-semibold rounded-sm">
              <AlertTriangle className="w-3 h-3" /> {contract.overdue_count}
            </span>
          )}
          {statusPill(contract.status)}
        </div>
      </div>
      <div className="flex items-center justify-between pl-6">
        <span className="text-xs text-slate-500 truncate">{contract.counterparty || '—'}</span>
        <span className="text-xs font-medium text-slate-700 tabular-nums">{fmt(contract.total_value)}</span>
      </div>
    </li>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const { activeProject } = useProjectStore();
  const projectId = activeProject?.id;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showDetail, setShowDetail] = useState(false); // mobile toggle
  const [showForm, setShowForm] = useState(false);
  const [editContract, setEditContract] = useState<Contract | undefined>(undefined);

  const fetchContracts = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api.get(`/contracts?project_id=${projectId}`);
      const data: Contract[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setContracts(data);
      if (selectedId === null && data.length > 0) setSelectedId(data[0].id);
    } catch {
      toast.error('Sözleşmeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedId]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get('/accounting/accounts');
      const data: AccountingAccount[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setAccounts(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchContracts();
    fetchAccounts();
  }, [fetchContracts, fetchAccounts]);

  const selected = contracts.find(c => c.id === selectedId) ?? null;

  // KPIs
  const activeCount = contracts.filter(c => c.status === 'active').length;
  const totalValue = contracts.reduce((s, c) => s + c.total_value, 0);
  const totalPaid = contracts.reduce((s, c) => s + (c.paid_amount ?? 0), 0);
  const overdueCount = contracts.reduce((s, c) => s + (c.overdue_count ?? 0), 0);

  function handleSelect(id: number) {
    setSelectedId(id);
    setShowDetail(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditContract(undefined);
  }

  function handleFormSuccess() {
    handleFormClose();
    fetchContracts();
  }

  function handleDeleted() {
    setSelectedId(null);
    setShowDetail(false);
    fetchContracts();
  }

  function handleEdit() {
    setEditContract(selected ?? undefined);
    setShowForm(true);
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-500">
        Lütfen bir proje seçin.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <h1 className="text-sm font-semibold text-slate-900">Sözleşmeler</h1>
        <button
          onClick={() => { setEditContract(undefined); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-3.5 h-3.5" /> Yeni Sözleşme
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-4 py-3 flex-shrink-0">
        <KpiTile
          label="Aktif Sözleşmeler"
          value={String(activeCount)}
          icon={<FileText className="w-4 h-4" />}
        />
        <KpiTile
          label="Toplam Değer"
          value={fmt(totalValue)}
          icon={<ArrowUpRight className="w-4 h-4" />}
        />
        <KpiTile
          label="Ödenen"
          value={fmt(totalPaid)}
          icon={<ArrowDownLeft className="w-4 h-4" />}
        />
        <KpiTile
          label="Gecikmiş Taksit"
          value={String(overdueCount)}
          sub={overdueCount > 0 ? 'Aksiyon gerekiyor' : 'Sorun yok'}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      {/* Master-detail */}
      <div className="flex flex-1 overflow-hidden border-t border-slate-200">
        {/* Contract list — hidden on mobile when detail is shown */}
        <div className={`flex flex-col w-full md:w-[380px] md:flex-shrink-0 bg-white border-r border-slate-200 overflow-hidden ${showDetail ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 py-2.5 border-b border-slate-100 flex-shrink-0">
            <p className="text-xs text-slate-500">{contracts.length} sözleşme</p>
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Yükleniyor...</div>
          ) : contracts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-sm text-slate-400">
              <FileText className="w-8 h-8 text-slate-200" />
              <p>Henüz sözleşme yok</p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto">
              {contracts.map(c => (
                <ContractRow
                  key={c.id}
                  contract={c}
                  selected={c.id === selectedId}
                  onClick={() => handleSelect(c.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Detail panel */}
        <div className={`flex-1 overflow-hidden ${!showDetail && 'hidden md:flex md:flex-col'} ${showDetail ? 'flex flex-col' : ''}`}>
          {selected ? (
            <DetailPanel
              key={selected.id}
              contract={selected}
              accounts={accounts}
              onEdit={handleEdit}
              onDeleted={handleDeleted}
              onRefresh={fetchContracts}
              onBack={() => setShowDetail(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-sm text-slate-400">
              <FileText className="w-10 h-10 text-slate-200" />
              <p>Bir sözleşme seçin</p>
            </div>
          )}
        </div>
      </div>

      {/* Contract form modal */}
      {showForm && (
        <ContractFormModal
          contract={editContract}
          projectId={projectId}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
