'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

const fmt = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('tr-TR') : '—';
const isOverdue = (d?: string) => d ? new Date(d) < new Date() : false;

export default function ReceivableReport() {
    const { activeProject } = useProjectStore();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeProject) return;
        api.get('/accounting/invoices', { params: { active_project_id: activeProject.id, type: 'sales', per_page: 1000 } })
            .then(r => setInvoices((r.data.data || []).filter((i: any) => i.remaining > 0)))
            .finally(() => setLoading(false));
    }, [activeProject]);

    const stats = useMemo(() => ({
        total: invoices.reduce((s, i) => s + i.remaining, 0),
        overdue: invoices.filter(i => isOverdue(i.due_date)).reduce((s, i) => s + i.remaining, 0),
        count: invoices.length,
        overdueCount: invoices.filter(i => isOverdue(i.due_date)).length,
    }), [invoices]);

    const grouped = useMemo(() => {
        const map = new Map<string, any[]>();
        invoices.forEach(i => {
            const name = i.account?.name || 'Belirtilmemiş';
            if (!map.has(name)) map.set(name, []);
            map.get(name)!.push(i);
        });
        return map;
    }, [invoices]);

    if (!activeProject) return <div className="flex items-center justify-center h-full"><p className="text-slate-400 text-sm">Aktif proje seçilmedi.</p></div>;

    return (
        <div className="p-6 space-y-6 max-w-5xl">
            <div>
                <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" />Alacak Raporu</h1>
                <p className="text-xs text-slate-400 mt-0.5">{activeProject.name} · Tahsil edilmemiş satış faturaları</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Toplam Alacak', value: fmt(stats.total), color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Vadesi Geçmiş', value: fmt(stats.overdue), color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Fatura Sayısı', value: stats.count.toString(), color: 'text-slate-700', bg: 'bg-slate-50' },
                    { label: 'Vadesi Geçen', value: `${stats.overdueCount} fatura`, color: 'text-red-500', bg: 'bg-red-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100`}>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
                        <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {loading ? <p className="text-slate-400 text-sm">Yükleniyor...</p> : invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-300 mb-2" />
                    <p className="text-slate-400 text-sm">Tahsil edilmemiş alacak bulunmuyor.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {Array.from(grouped.entries()).map(([name, acctInvoices]) => {
                        const acctTotal = acctInvoices.reduce((s, i) => s + i.remaining, 0);
                        return (
                            <div key={name}>
                                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600">
                                    <span>{name}</span><span /><span /><span />
                                    <span className="text-right font-mono">{fmt(acctTotal)}</span>
                                </div>
                                {acctInvoices.map(inv => (
                                    <div key={inv.id} className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-4 py-2.5 border-b border-slate-50 text-sm hover:bg-slate-50 transition-colors ${isOverdue(inv.due_date) ? 'bg-red-50/30' : ''}`}>
                                        <span className="text-slate-700 text-xs">{inv.invoice_no || `#${inv.id}`} — {inv.description || '—'}</span>
                                        <span className="text-xs text-slate-500 text-center">{fmtDate(inv.date)}</span>
                                        <span className={`text-xs text-center flex items-center gap-1 justify-center ${isOverdue(inv.due_date) ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                                            {isOverdue(inv.due_date) && <AlertCircle className="w-3 h-3" />}
                                            {fmtDate(inv.due_date)}
                                        </span>
                                        <span className="text-xs text-center text-slate-500">{fmt(inv.total)}</span>
                                        <span className={`text-xs font-mono font-semibold text-right ${isOverdue(inv.due_date) ? 'text-red-600' : 'text-green-600'}`}>{fmt(inv.remaining)}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-4 py-3 bg-slate-900 text-white text-sm font-bold">
                        <span>TOPLAM ALACAK</span><span /><span /><span />
                        <span className="text-right font-mono text-green-400">{fmt(stats.total)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
