'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { ShoppingBag } from 'lucide-react';

const fmt = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('tr-TR') : '—';
const STATUS_LABEL: Record<string, string> = { draft: 'Taslak', sent: 'Gönderildi', paid: 'Ödendi', partial: 'Kısmi', cancelled: 'İptal' };
const STATUS_COLOR: Record<string, string> = { draft: 'bg-slate-100 text-slate-500', sent: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700', partial: 'bg-amber-100 text-amber-700', cancelled: 'bg-red-100 text-red-500' };

export default function PurchasesReport() {
    const { activeProject } = useProjectStore();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(0);

    useEffect(() => {
        if (!activeProject) return;
        setLoading(true);
        const params: any = { active_project_id: activeProject.id, type: 'purchase', per_page: 1000, date_from: `${year}-01-01`, date_to: `${year}-12-31` };
        if (month > 0) { params.date_from = `${year}-${String(month).padStart(2,'0')}-01`; params.date_to = `${year}-${String(month).padStart(2,'0')}-31`; }
        api.get('/accounting/invoices', { params }).then(r => setInvoices(r.data.data || [])).finally(() => setLoading(false));
    }, [activeProject, year, month]);

    const stats = useMemo(() => ({
        total: invoices.reduce((s, i) => s + i.total, 0),
        paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
        remaining: invoices.reduce((s, i) => s + i.remaining, 0),
        tax: invoices.reduce((s, i) => s + (i.tax_total || 0), 0),
        count: invoices.length,
    }), [invoices]);

    if (!activeProject) return <div className="flex items-center justify-center h-full"><p className="text-slate-400 text-sm">Aktif proje seçilmedi.</p></div>;

    return (
        <div className="p-6 space-y-6 w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-purple-600" />Alış Raporu</h1>
                    <p className="text-xs text-slate-400 mt-0.5">{activeProject.name}</p>
                </div>
                <div className="flex gap-2">
                    <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700">
                        <option value={0}>Tüm Yıl</option>
                        {['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'].map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700">
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
                {[
                    { label: 'Toplam Alış', value: fmt(stats.total), color: 'text-purple-700', bg: 'bg-purple-50' },
                    { label: 'Ödenen', value: fmt(stats.paid), color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Ödenecek', value: fmt(stats.remaining), color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'KDV Tutarı', value: fmt(stats.tax), color: 'text-slate-600', bg: 'bg-slate-50' },
                    { label: 'Fatura Adedi', value: stats.count.toString(), color: 'text-slate-700', bg: 'bg-slate-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100`}>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
                        <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {loading ? <p className="text-slate-400 text-sm">Yükleniyor...</p> : invoices.length === 0 ? (
                <div className="py-16 text-center"><p className="text-slate-400 text-sm">Seçili dönemde alış faturası bulunamadı.</p></div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-2.5 bg-slate-50 border-b text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                        <span>Fatura</span><span className="text-center">Tarih</span><span className="text-center">Tedarikçi</span>
                        <span className="text-right">Toplam</span><span className="text-right">Kalan</span><span className="text-center">Durum</span>
                    </div>
                    {invoices.map(inv => (
                        <div key={inv.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <span className="text-xs text-slate-700">{inv.invoice_no || `#${inv.id}`} {inv.description ? `— ${inv.description}` : ''}</span>
                            <span className="text-xs text-slate-500 text-center">{fmtDate(inv.date)}</span>
                            <span className="text-xs text-slate-500 text-center truncate">{inv.account?.name || '—'}</span>
                            <span className="text-xs font-mono text-right text-slate-700">{fmt(inv.total)}</span>
                            <span className={`text-xs font-mono text-right ${inv.remaining > 0 ? 'text-red-500' : 'text-slate-400'}`}>{inv.remaining > 0 ? fmt(inv.remaining) : '—'}</span>
                            <span className="text-center"><span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[inv.status] || ''}`}>{STATUS_LABEL[inv.status]}</span></span>
                        </div>
                    ))}
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 bg-slate-900 text-white text-sm font-bold">
                        <span>TOPLAM ({stats.count})</span><span /><span />
                        <span className="text-right font-mono">{fmt(stats.total)}</span>
                        <span className="text-right font-mono text-red-400">{fmt(stats.remaining)}</span>
                        <span />
                    </div>
                </div>
            )}
        </div>
    );
}
