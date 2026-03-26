'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { Calendar } from 'lucide-react';

const fmt = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('tr-TR') : '—';

export default function DailyReport() {
    const { activeProject } = useProjectStore();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeProject) return;
        setLoading(true);
        Promise.all([
            api.get('/finance/transactions', { params: { active_project_id: activeProject.id, date_from: date, date_to: date, per_page: 1000 } }),
            api.get('/accounting/invoices', { params: { active_project_id: activeProject.id, date_from: date, date_to: date, per_page: 1000 } }),
        ]).then(([t, i]) => {
            setTransactions(t.data.data || []);
            setInvoices(i.data.data || []);
        }).finally(() => setLoading(false));
    }, [activeProject, date]);

    const stats = useMemo(() => ({
        income: transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        salesTotal: invoices.filter(i => i.type === 'sales').reduce((s, i) => s + i.total, 0),
        purchaseTotal: invoices.filter(i => i.type === 'purchase').reduce((s, i) => s + i.total, 0),
    }), [transactions, invoices]);

    if (!activeProject) return <div className="flex items-center justify-center h-full"><p className="text-slate-400 text-sm">Aktif proje seçilmedi.</p></div>;

    return (
        <div className="p-6 space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Gün Sonu Raporu</h1>
                    <p className="text-xs text-slate-400 mt-0.5">{activeProject.name}</p>
                </div>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700" />
            </div>

            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Nakit Gelir', value: fmt(stats.income), color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Nakit Gider', value: fmt(stats.expense), color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Kesilen Fatura', value: fmt(stats.salesTotal), color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Alınan Fatura', value: fmt(stats.purchaseTotal), color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100`}>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
                        <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {loading ? <p className="text-slate-400 text-sm">Yükleniyor...</p> : (
                <div className="grid grid-cols-2 gap-6">
                    {/* Kasa Hareketleri */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-2.5 bg-slate-50 border-b">
                            <h3 className="text-xs font-semibold text-slate-700">Kasa / Banka Hareketleri ({transactions.length})</h3>
                        </div>
                        {transactions.length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 text-center">Bu tarihte hareket yok.</p>
                        ) : transactions.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50">
                                <div>
                                    <p className="text-xs text-slate-700">{tx.description || tx.category || '—'}</p>
                                    <p className="text-[10px] text-slate-400">{tx.account?.name}</p>
                                </div>
                                <span className={`text-xs font-mono font-semibold ${tx.type === 'income' ? 'text-green-600' : tx.type === 'expense' ? 'text-red-500' : 'text-blue-500'}`}>
                                    {tx.type === 'expense' ? '-' : '+'}{fmt(tx.amount)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Faturalar */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-2.5 bg-slate-50 border-b">
                            <h3 className="text-xs font-semibold text-slate-700">Faturalar ({invoices.length})</h3>
                        </div>
                        {invoices.length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 text-center">Bu tarihte fatura yok.</p>
                        ) : invoices.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50">
                                <div>
                                    <p className="text-xs text-slate-700">{inv.invoice_no || `#${inv.id}`} — {inv.account?.name || '—'}</p>
                                    <p className="text-[10px] text-slate-400">{inv.type === 'sales' ? 'Satış' : 'Alış'} · {inv.description || '—'}</p>
                                </div>
                                <span className={`text-xs font-mono font-semibold ${inv.type === 'sales' ? 'text-blue-600' : 'text-purple-600'}`}>
                                    {fmt(inv.total)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
