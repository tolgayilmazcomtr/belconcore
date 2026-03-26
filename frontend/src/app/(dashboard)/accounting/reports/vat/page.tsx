'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { Receipt } from 'lucide-react';

const fmt = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n || 0);
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export default function VatReport() {
    const { activeProject } = useProjectStore();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (!activeProject) return;
        setLoading(true);
        api.get('/accounting/invoices', {
            params: { active_project_id: activeProject.id, per_page: 1000, date_from: `${year}-01-01`, date_to: `${year}-12-31` }
        }).then(r => setInvoices(r.data.data || [])).finally(() => setLoading(false));
    }, [activeProject, year]);

    const monthlyData = useMemo(() => {
        return Array.from({ length: 12 }, (_, m) => {
            const monthInvs = invoices.filter(i => new Date(i.date).getMonth() === m);
            const salesVat = monthInvs.filter(i => i.type === 'sales').reduce((s, i) => s + (i.tax_total || 0), 0);
            const purchaseVat = monthInvs.filter(i => i.type === 'purchase').reduce((s, i) => s + (i.tax_total || 0), 0);
            return { month: MONTHS[m], salesVat, purchaseVat, net: salesVat - purchaseVat };
        });
    }, [invoices]);

    const totals = useMemo(() => ({
        salesVat: monthlyData.reduce((s, m) => s + m.salesVat, 0),
        purchaseVat: monthlyData.reduce((s, m) => s + m.purchaseVat, 0),
        net: monthlyData.reduce((s, m) => s + m.net, 0),
    }), [monthlyData]);

    if (!activeProject) return <div className="flex items-center justify-center h-full"><p className="text-slate-400 text-sm">Aktif proje seçilmedi.</p></div>;

    return (
        <div className="p-6 space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" />KDV Raporu</h1>
                    <p className="text-xs text-slate-400 mt-0.5">{activeProject.name} · Tahsil Edilen / İndirilecek KDV</p>
                </div>
                <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700">
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-[10px] font-semibold text-green-500 uppercase tracking-wide mb-1">Tahsil Edilen KDV</p>
                    <p className="text-xl font-bold text-green-700 font-mono">{fmt(totals.salesVat)}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-1">İndirilecek KDV</p>
                    <p className="text-xl font-bold text-red-600 font-mono">{fmt(totals.purchaseVat)}</p>
                </div>
                <div className={`rounded-xl p-4 border ${totals.net >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Ödenecek / İade KDV</p>
                    <p className={`text-xl font-bold font-mono ${totals.net >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{fmt(Math.abs(totals.net))}</p>
                    <p className={`text-xs mt-1 ${totals.net >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>{totals.net >= 0 ? 'Ödenecek' : 'İade Alınacak'}</p>
                </div>
            </div>

            {loading ? <p className="text-slate-400 text-sm">Yükleniyor...</p> : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-4 px-4 py-2.5 bg-slate-50 border-b text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                        <span>Ay</span>
                        <span className="text-right">Tahsil Edilen</span>
                        <span className="text-right">İndirilecek</span>
                        <span className="text-right">Net</span>
                    </div>
                    {monthlyData.map((m, i) => (
                        <div key={i} className={`grid grid-cols-4 px-4 py-2.5 border-b border-slate-50 text-sm hover:bg-slate-50 transition-colors ${m.salesVat === 0 && m.purchaseVat === 0 ? 'opacity-40' : ''}`}>
                            <span className="text-slate-700 font-medium text-xs">{m.month} {year}</span>
                            <span className="text-right text-xs font-mono text-green-600">{m.salesVat > 0 ? fmt(m.salesVat) : '—'}</span>
                            <span className="text-right text-xs font-mono text-red-500">{m.purchaseVat > 0 ? fmt(m.purchaseVat) : '—'}</span>
                            <span className={`text-right text-xs font-mono font-semibold ${m.net > 0 ? 'text-blue-600' : m.net < 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                                {m.net !== 0 ? fmt(Math.abs(m.net)) : '—'}
                            </span>
                        </div>
                    ))}
                    <div className="grid grid-cols-4 px-4 py-3 bg-slate-900 text-white text-sm font-bold">
                        <span>TOPLAM {year}</span>
                        <span className="text-right font-mono text-green-400">{fmt(totals.salesVat)}</span>
                        <span className="text-right font-mono text-red-400">{fmt(totals.purchaseVat)}</span>
                        <span className={`text-right font-mono ${totals.net >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>{fmt(Math.abs(totals.net))}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
