'use client';

import React, { useState } from 'react';
import { Invoice, AccountingPayment } from '@/types/accounting.types';
import { X, Download, Calendar, FileText, CreditCard, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAccountingStore } from '@/store/useAccountingStore';
import { useProjectStore } from '@/store/useProjectStore';

const fmtMoney = (n: number) =>
    '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const STATUS_LABEL: Record<string, string> = {
    draft: 'Taslak', sent: 'Gönderildi', paid: 'Ödendi', partial: 'Kısmi', cancelled: 'İptal',
};
const METHOD_LABEL: Record<string, string> = {
    cash: 'Nakit', bank: 'Banka', check: 'Çek', credit_card: 'Kredi Kartı', other: 'Diğer',
};

// ─── Payment Form ────────────────────────────────────────────────────────────
interface PaymentFormProps {
    invoice: Invoice;
    onAdded: (payment: AccountingPayment) => void;
}

function PaymentForm({ invoice, onAdded }: PaymentFormProps) {
    const { activeProject } = useProjectStore();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        amount: invoice.remaining.toString(),
        date: new Date().toISOString().split('T')[0],
        method: 'cash' as AccountingPayment['method'],
        bank_name: '', reference_no: '', notes: '',
    });
    const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

    const save = async () => {
        if (!activeProject) return;
        setLoading(true);
        try {
            const r = await api.post('/accounting/payments', {
                ...form,
                amount: parseFloat(form.amount),
                invoice_id: invoice.id,
                account_id: invoice.account_id,
                active_project_id: activeProject.id,
            });
            onAdded(r.data.data);
            toast.success('Ödeme kaydedildi.');
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Hata oluştu.');
        } finally { setLoading(false); }
    };

    return (
        <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-3 mt-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Ödeme Ekle</p>
            <div className="flex gap-2 flex-wrap">
                <input type="number" value={form.amount} onChange={e => f('amount', e.target.value)}
                    placeholder="Tutar" className="h-7 text-xs border border-slate-200 rounded px-2 w-28 bg-white" />
                <input type="date" value={form.date} onChange={e => f('date', e.target.value)}
                    className="h-7 text-xs border border-slate-200 rounded px-2 bg-white" />
                <select value={form.method} onChange={e => f('method', e.target.value as AccountingPayment['method'])}
                    className="h-7 text-xs border border-slate-200 rounded px-2 bg-white">
                    {Object.entries(METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {(form.method === 'bank' || form.method === 'check') && (
                    <input value={form.bank_name} onChange={e => f('bank_name', e.target.value)}
                        placeholder="Banka adı" className="h-7 text-xs border border-slate-200 rounded px-2 w-32 bg-white" />
                )}
                <button onClick={save} disabled={loading}
                    className="h-7 px-3 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1">
                    <CreditCard size={12} />
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>
        </div>
    );
}

// ─── Invoice Detail Modal ─────────────────────────────────────────────────────
interface Props {
    invoice: Invoice | null;
    open: boolean;
    onClose: () => void;
    onUpdated?: (invoice: Invoice) => void;
}

export function InvoiceDetailModal({ invoice, open, onClose, onUpdated }: Props) {
    const { upsertInvoice, removePayment } = useAccountingStore();
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    if (!invoice || !open) return null;

    const handlePaymentAdded = (payment: AccountingPayment) => {
        // Reload invoice to get updated remaining
        api.get(`/accounting/invoices/${invoice.id}`)
            .then(r => {
                upsertInvoice(r.data.data);
                onUpdated?.(r.data.data);
            });
        setShowPaymentForm(false);
    };

    const handleDeletePayment = async (paymentId: number) => {
        if (!confirm('Bu ödemeyi silmek istediğinizden emin misiniz?')) return;
        try {
            await api.delete(`/accounting/payments/${paymentId}`);
            removePayment(paymentId);
            // Refresh invoice
            const r = await api.get(`/accounting/invoices/${invoice.id}`);
            upsertInvoice(r.data.data);
            onUpdated?.(r.data.data);
            toast.success('Ödeme silindi.');
        } catch { toast.error('Silinemedi.'); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[620px] max-h-[82vh] overflow-y-auto mt-16">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <FileText size={15} className="text-slate-400" />
                        <span className="font-semibold text-slate-800 text-sm">{invoice.account?.name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || ''}/accounting/invoices/${invoice.id}/pdf`, '_blank')}
                            title="PDF İndir"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <Download size={14} />
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                <div className="px-5 py-4 space-y-4">
                    {/* Invoice info row */}
                    <div>
                        <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wide mb-2.5">
                            {invoice.type === 'sales' ? 'Satış Faturası' : 'Alış Faturası'}
                        </p>
                        <div className="grid grid-cols-4 gap-4 text-xs">
                            <div>
                                <p className="text-slate-400 uppercase text-[10px] font-semibold tracking-wide mb-0.5">Belge Türü</p>
                                <p className="font-medium text-slate-700">
                                    {invoice.document_type === 'paper' ? 'Kağıt' : invoice.document_type === 'e-invoice' ? 'e-Fatura' : 'e-Arşiv'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 uppercase text-[10px] font-semibold tracking-wide mb-0.5">Fatura No</p>
                                <p className="font-medium text-slate-700">{invoice.invoice_no || '—'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 uppercase text-[10px] font-semibold tracking-wide mb-0.5">Düzenleme Tarihi</p>
                                <p className="font-medium text-slate-700">{fmtDate(invoice.date)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 uppercase text-[10px] font-semibold tracking-wide mb-0.5">Vade Tarihi</p>
                                <p className="font-medium text-slate-700 flex items-center gap-1">
                                    {fmtDate(invoice.due_date)} {invoice.due_date && <Calendar size={11} className="text-slate-300" />}
                                </p>
                            </div>
                        </div>
                        {invoice.description && (
                            <div className="mt-2">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide mb-0.5">Açıklama</p>
                                <p className="text-xs text-slate-600">{invoice.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Items table */}
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide mb-2">Fatura Kalemleri</p>
                        <div className="border border-slate-100 rounded-lg overflow-hidden">
                            <div className="grid bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-3 py-1.5"
                                style={{ gridTemplateColumns: '1fr 60px 60px 80px 60px 80px' }}>
                                <span>HİZMET / ÜRÜN</span>
                                <span className="text-right">BİRİM</span>
                                <span className="text-right">KALEM</span>
                                <span className="text-right">VERGİ</span>
                                <span className="text-right">TOPLAM</span>
                            </div>
                            {invoice.items?.map(item => (
                                <div key={item.id} className="grid px-3 py-2 border-t border-slate-100 text-xs"
                                    style={{ gridTemplateColumns: '1fr 60px 60px 80px 60px 80px' }}>
                                    <div>
                                        <p className="font-medium text-slate-700">{item.description}</p>
                                        <p className="text-slate-400">{fmtMoney(item.unit_price)}</p>
                                    </div>
                                    <span className="text-right text-slate-500">{item.quantity} {item.unit}</span>
                                    <span className="text-right text-slate-700">{fmtMoney(item.quantity * item.unit_price)}</span>
                                    <span className="text-right text-slate-500">%{item.tax_rate} {fmtMoney(item.tax_amount)}</span>
                                    <span className="text-right font-medium text-slate-700">{fmtMoney(item.total)}</span>
                                </div>
                            ))}
                            {/* Totals */}
                            <div className="border-t border-slate-200 px-3 py-2 space-y-1 bg-slate-50/50">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Ara Toplam</span><span>{fmtMoney(invoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>KDV</span><span>{fmtMoney(invoice.tax_total)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold text-slate-800 border-t border-slate-200 pt-1">
                                    <span>Fatura Bedeli</span><span>{fmtMoney(invoice.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payments */}
                    {((invoice.payments?.length ?? 0) > 0 || invoice.paid_amount > 0) && (
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide mb-2">Ödemeler</p>
                            <div className="space-y-1">
                                {invoice.payments?.map(p => (
                                    <div key={p.id} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded text-xs border border-slate-100 group">
                                        <span className="text-slate-500">{fmtDate(p.date)}</span>
                                        <span className="text-slate-500">{METHOD_LABEL[p.method]}</span>
                                        <span className="font-semibold text-slate-700">{fmtMoney(p.amount)}</span>
                                        <button onClick={() => handleDeletePayment(p.id)}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Remaining */}
                    <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-center justify-between border border-slate-200">
                        <span className="text-xs font-semibold text-slate-600">KALAN</span>
                        <span className={`text-sm font-bold ${invoice.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {fmtMoney(invoice.remaining)}
                        </span>
                    </div>

                    {/* Add payment */}
                    {invoice.remaining > 0 && (
                        <div>
                            {!showPaymentForm ? (
                                <button onClick={() => setShowPaymentForm(true)}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    <CreditCard size={12} /> Ödeme Ekle
                                </button>
                            ) : (
                                <PaymentForm invoice={invoice} onAdded={handlePaymentAdded} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
