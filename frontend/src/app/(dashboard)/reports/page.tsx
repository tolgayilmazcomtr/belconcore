'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import {
    BarChart3, TrendingUp, TrendingDown, Home, Users, FileText,
    Wallet, ArrowUpRight, ArrowDownRight, Minus, Building2,
    CheckSquare, PieChart, Target, Clock, AlertTriangle,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(n || 0);
const fmtK = (n: number) => {
    if (n >= 1_000_000) return '₺' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '₺' + (n / 1_000).toFixed(0) + 'K';
    return fmt(n);
};
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('tr-TR') : '—';
const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// ─── Mini components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, color, trend }: {
    label: string; value: string; sub?: string; icon: React.ReactNode;
    color: string; trend?: 'up' | 'down' | 'neutral';
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
                {trend === 'up'      && <ArrowUpRight   className="w-3.5 h-3.5 text-green-500" />}
                {trend === 'down'    && <ArrowDownRight  className="w-3.5 h-3.5 text-red-500" />}
                {trend === 'neutral' && <Minus           className="w-3.5 h-3.5 text-slate-400" />}
            </div>
            <div>
                <p className="text-xl font-bold font-mono text-slate-900">{value}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
                {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
    const h = max > 0 ? Math.max((value / max) * 100, 2) : 0;
    return (
        <div className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
            <span className="text-[9px] text-slate-400 font-mono">{value > 0 ? fmtK(value) : ''}</span>
            <div className="w-full flex items-end" style={{ height: 80 }}>
                <div className={`w-full rounded-t-sm transition-all duration-500 ${color}`} style={{ height: `${h}%` }} />
            </div>
            {label && <span className="text-[9px] text-slate-400 text-center leading-none">{label}</span>}
        </div>
    );
}

function HBar({ label, value, max, color, badge }: { label: string; value: number; max: number; color: string; badge?: string }) {
    const w = max > 0 ? Math.max(pct(value, max), value > 0 ? 2 : 0) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-28 shrink-0 truncate">{label}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${w}%` }} />
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700 w-8 text-right">{badge ?? value}</span>
        </div>
    );
}

function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="text-blue-500">{icon}</div>
            <div>
                <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Tab buttons ──────────────────────────────────────────────────────────────

const TABS = [
    { id: 'overview', label: 'Genel Özet',   icon: <BarChart3 size={13} /> },
    { id: 'sales',    label: 'Satış',         icon: <Home size={13} /> },
    { id: 'crm',      label: 'CRM & Fırsat',  icon: <Users size={13} /> },
    { id: 'finance',  label: 'Finans',        icon: <Wallet size={13} /> },
] as const;
type TabId = typeof TABS[number]['id'];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const { activeProject } = useProjectStore();
    const [tab, setTab] = useState<TabId>('overview');
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    // Raw data
    const [units,    setUnits]    = useState<any[]>([]);
    const [blocks,   setBlocks]   = useState<any[]>([]);
    const [leads,    setLeads]    = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [txs,      setTxs]      = useState<any[]>([]);
    const [checks,   setChecks]   = useState<any[]>([]);

    const load = useCallback(async () => {
        if (!activeProject) { setLoading(false); return; }
        setLoading(true);
        const pid = activeProject.id;
        const p = (extra = {}) => ({ active_project_id: pid, per_page: 5000, ...extra });
        const dateFrom = `${year}-01-01`;
        const dateTo   = `${year}-12-31`;

        const results = await Promise.allSettled([
            api.get('/units',                { params: p() }),
            api.get('/blocks',               { params: p() }),
            api.get('/leads',                { params: p() }),
            api.get('/accounting/invoices',  { params: p({ date_from: dateFrom, date_to: dateTo }) }),
            api.get('/finance/transactions', { params: p({ date_from: dateFrom, date_to: dateTo }) }),
            api.get('/checks',               { params: p() }),
        ]);

        const get = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;
        const arr = (r: PromiseSettledResult<any>, path = 'data.data') => {
            const v = get(r);
            if (!v) return [];
            const parts = path.split('.');
            let cur = v;
            for (const p of parts) cur = cur?.[p];
            return Array.isArray(cur) ? cur : [];
        };

        setUnits(arr(results[0]));
        setBlocks(arr(results[1]));
        setLeads(arr(results[2]));
        setInvoices(arr(results[3]));
        setTxs(arr(results[4]));
        setChecks(arr(results[5]));
        setLoading(false);
    }, [activeProject, year]);

    useEffect(() => { load(); }, [load]);

    // ─── Computed ──────────────────────────────────────────────────────────────

    const unitStats = useMemo(() => ({
        total:       units.length,
        available:   units.filter(u => u.status === 'available').length,
        reserved:    units.filter(u => u.status === 'reserved').length,
        sold:        units.filter(u => u.status === 'sold').length,
        notForSale:  units.filter(u => u.status === 'not_for_sale').length,
        salesValue:  units.filter(u => u.status === 'sold').reduce((s, u) => s + (u.list_price || 0), 0),
        totalValue:  units.reduce((s, u) => s + (u.list_price || 0), 0),
    }), [units]);

    const leadStats = useMemo(() => ({
        total:       leads.length,
        new:         leads.filter(l => l.status === 'new').length,
        negotiating: leads.filter(l => l.status === 'negotiating').length,
        won:         leads.filter(l => l.status === 'won').length,
        lost:        leads.filter(l => l.status === 'lost').length,
    }), [leads]);

    const finStats = useMemo(() => {
        const sales     = invoices.filter(i => i.type === 'sales');
        const purchases = invoices.filter(i => i.type === 'purchase');
        const income    = txs.filter(t => t.type === 'income');
        const expense   = txs.filter(t => t.type === 'expense');
        return {
            salesTotal:    sales.reduce((s, i) => s + i.total, 0),
            purchaseTotal: purchases.reduce((s, i) => s + i.total, 0),
            incomeTotal:   income.reduce((s, t) => s + t.amount, 0),
            expenseTotal:  expense.reduce((s, t) => s + t.amount, 0),
            salesCount:    sales.length,
            purchaseCount: purchases.length,
        };
    }, [invoices, txs]);

    const checkStats = useMemo(() => ({
        total:    checks.length,
        pending:  checks.filter(c => c.status === 'pending').length,
        cashed:   checks.filter(c => c.status === 'cashed').length,
        bounced:  checks.filter(c => c.status === 'bounced').length,
        totalAmt: checks.filter(c => c.status === 'pending').reduce((s, c) => s + (c.amount || 0), 0),
    }), [checks]);

    // Monthly invoice/transaction breakdown
    const monthly = useMemo(() => {
        return Array.from({ length: 12 }, (_, m) => {
            const mo = String(m + 1).padStart(2, '0');
            const inv = invoices.filter(i => i.date?.startsWith(`${year}-${mo}`));
            const tx  = txs.filter(t => t.date?.startsWith(`${year}-${mo}`));
            return {
                label:    MONTHS_TR[m],
                sales:    inv.filter(i => i.type === 'sales').reduce((s, i) => s + i.total, 0),
                purchase: inv.filter(i => i.type === 'purchase').reduce((s, i) => s + i.total, 0),
                income:   tx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
                expense:  tx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
            };
        });
    }, [invoices, txs, year]);

    const maxSales  = Math.max(...monthly.map(m => m.sales), 1);
    const maxIncome = Math.max(...monthly.map(m => Math.max(m.income, m.expense)), 1);

    // Block breakdown
    const blockStats = useMemo(() => blocks.map(b => {
        const bu = units.filter(u => u.block_id === b.id);
        return {
            name:      b.name,
            code:      b.code,
            total:     bu.length,
            sold:      bu.filter(u => u.status === 'sold').length,
            reserved:  bu.filter(u => u.status === 'reserved').length,
            available: bu.filter(u => u.status === 'available').length,
        };
    }), [blocks, units]);

    if (!activeProject) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-slate-400">Lütfen üstten bir proje seçin.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" /> Raporlar
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">{activeProject.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        {[2023, 2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden w-fit">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${tab === t.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 text-sm text-slate-400">Veriler yükleniyor...</div>
            ) : (
                <>
                    {/* ── GENEL ÖZET ── */}
                    {tab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <KpiCard label="Toplam Ünite" value={String(unitStats.total)}
                                    sub={`${unitStats.sold} satıldı`}
                                    icon={<Home size={16} className="text-blue-600" />} color="bg-blue-50"
                                    trend={unitStats.sold > 0 ? 'up' : 'neutral'} />
                                <KpiCard label="Satış Geliri" value={fmtK(unitStats.salesValue)}
                                    sub={`%${pct(unitStats.sold, unitStats.total)} doluluk`}
                                    icon={<TrendingUp size={16} className="text-green-600" />} color="bg-green-50"
                                    trend="up" />
                                <KpiCard label="Aktif Fırsat" value={String(leadStats.total)}
                                    sub={`${leadStats.won} kazanıldı`}
                                    icon={<Target size={16} className="text-purple-600" />} color="bg-purple-50"
                                    trend={leadStats.won > 0 ? 'up' : 'neutral'} />
                                <KpiCard label="Nakit Bakiye" value={fmtK(finStats.incomeTotal - finStats.expenseTotal)}
                                    sub={`Gelir: ${fmtK(finStats.incomeTotal)}`}
                                    icon={<Wallet size={16} className="text-amber-600" />} color="bg-amber-50"
                                    trend={finStats.incomeTotal > finStats.expenseTotal ? 'up' : 'down'} />
                            </div>

                            {/* Ünite durum özeti */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                <SectionTitle icon={<Home size={14} />} title="Ünite Durum Dağılımı" />
                                <div className="space-y-2.5">
                                    {[
                                        { label: 'Satıldı',       value: unitStats.sold,       color: 'bg-green-500' },
                                        { label: 'Rezerve',       value: unitStats.reserved,   color: 'bg-amber-400' },
                                        { label: 'Müsait',        value: unitStats.available,  color: 'bg-blue-400' },
                                        { label: 'Satışa Kapalı', value: unitStats.notForSale, color: 'bg-slate-300' },
                                    ].map(row => (
                                        <HBar key={row.label} label={row.label} value={row.value}
                                            max={unitStats.total} color={row.color}
                                            badge={`${row.value} / ${pct(row.value, unitStats.total)}%`} />
                                    ))}
                                </div>
                            </div>

                            {/* Blok özeti */}
                            {blockStats.length > 0 && (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                    <SectionTitle icon={<Building2 size={14} />} title="Blok Bazlı Doluluk" />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {blockStats.map(b => (
                                            <div key={b.name} className="border border-slate-100 rounded-lg p-3">
                                                <p className="text-xs font-semibold text-slate-700 mb-2">
                                                    {b.code ? `[${b.code}] ` : ''}{b.name}
                                                </p>
                                                <div className="space-y-1.5">
                                                    <HBar label="Satıldı"  value={b.sold}      max={b.total} color="bg-green-500" />
                                                    <HBar label="Rezerve"  value={b.reserved}  max={b.total} color="bg-amber-400" />
                                                    <HBar label="Müsait"   value={b.available} max={b.total} color="bg-blue-400" />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2 text-right">
                                                    {b.total} ünite toplam
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Çek/senet özeti */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                <SectionTitle icon={<CheckSquare size={14} />} title="Çek & Senet Özeti" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Toplam',   value: checkStats.total,   color: 'text-slate-800' },
                                        { label: 'Bekleyen', value: checkStats.pending, color: 'text-amber-600' },
                                        { label: 'Tahsil',   value: checkStats.cashed,  color: 'text-green-600' },
                                        { label: 'Karşılıksız', value: checkStats.bounced, color: 'text-red-600' },
                                    ].map(s => (
                                        <div key={s.label} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                            <p className="text-[10px] text-slate-400 uppercase font-semibold">{s.label}</p>
                                            <p className={`text-xl font-bold font-mono mt-0.5 ${s.color}`}>{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                                {checkStats.totalAmt > 0 && (
                                    <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                                        <Clock size={12} className="text-amber-500" />
                                        Bekleyen çek/senet toplam tutarı: <span className="font-semibold text-slate-700">{fmt(checkStats.totalAmt)}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── SATIŞ ── */}
                    {tab === 'sales' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <KpiCard label="Satılan Ünite"  value={String(unitStats.sold)}
                                    sub={`${pct(unitStats.sold, unitStats.total)}% doluluk`}
                                    icon={<Home size={16} className="text-green-600" />} color="bg-green-50" trend="up" />
                                <KpiCard label="Rezerve"        value={String(unitStats.reserved)}
                                    icon={<Clock size={16} className="text-amber-600" />} color="bg-amber-50" trend="neutral" />
                                <KpiCard label="Müsait"         value={String(unitStats.available)}
                                    icon={<Home size={16} className="text-blue-600" />} color="bg-blue-50" trend="neutral" />
                                <KpiCard label="Satış Portföyü" value={fmtK(unitStats.salesValue)}
                                    sub="Satılan üniteler toplam"
                                    icon={<TrendingUp size={16} className="text-purple-600" />} color="bg-purple-50" trend="up" />
                            </div>

                            {/* Aylık fatura grafiği */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                <SectionTitle icon={<BarChart3 size={14} />}
                                    title={`${year} Aylık Satış Faturası`}
                                    sub="Kesilmiş satış faturaları toplamı" />
                                <div className="flex items-end gap-1 mt-2" style={{ height: 120 }}>
                                    {monthly.map(m => (
                                        <Bar key={m.label} value={m.sales} max={maxSales}
                                            color={m.sales > 0 ? 'bg-green-400' : 'bg-slate-100'}
                                            label={m.label} />
                                    ))}
                                </div>
                            </div>

                            {/* Blok detay tablosu */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                                    <h3 className="text-xs font-semibold text-slate-700">Blok Bazlı Satış Durumu</h3>
                                </div>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="text-left px-5 py-2.5 text-[10px] text-slate-400 uppercase font-semibold">Blok</th>
                                            <th className="text-center px-3 py-2.5 text-[10px] text-slate-400 uppercase font-semibold">Toplam</th>
                                            <th className="text-center px-3 py-2.5 text-[10px] text-green-500 uppercase font-semibold">Satıldı</th>
                                            <th className="text-center px-3 py-2.5 text-[10px] text-amber-500 uppercase font-semibold">Rezerve</th>
                                            <th className="text-center px-3 py-2.5 text-[10px] text-blue-500 uppercase font-semibold">Müsait</th>
                                            <th className="text-right px-5 py-2.5 text-[10px] text-slate-400 uppercase font-semibold">Doluluk</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {blockStats.map(b => (
                                            <tr key={b.name} className="hover:bg-slate-50">
                                                <td className="px-5 py-2.5 font-medium text-slate-800">
                                                    {b.code ? `[${b.code}] ` : ''}{b.name}
                                                </td>
                                                <td className="text-center px-3 py-2.5 text-slate-600">{b.total}</td>
                                                <td className="text-center px-3 py-2.5 font-semibold text-green-600">{b.sold}</td>
                                                <td className="text-center px-3 py-2.5 font-semibold text-amber-500">{b.reserved}</td>
                                                <td className="text-center px-3 py-2.5 text-blue-500">{b.available}</td>
                                                <td className="text-right px-5 py-2.5">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-green-400 rounded-full"
                                                                style={{ width: `${pct(b.sold + b.reserved, b.total)}%` }} />
                                                        </div>
                                                        <span className="text-slate-600 font-mono w-8">%{pct(b.sold + b.reserved, b.total)}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {blockStats.length === 0 && (
                                            <tr><td colSpan={6} className="text-center px-5 py-8 text-slate-400">Blok bulunamadı</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── CRM ── */}
                    {tab === 'crm' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <KpiCard label="Toplam Fırsat" value={String(leadStats.total)}
                                    icon={<Target size={16} className="text-blue-600" />} color="bg-blue-50" trend="neutral" />
                                <KpiCard label="Yeni"          value={String(leadStats.new)}
                                    icon={<Users size={16} className="text-cyan-600" />} color="bg-cyan-50" trend="neutral" />
                                <KpiCard label="Kazanıldı"     value={String(leadStats.won)}
                                    sub={`%${pct(leadStats.won, leadStats.total)} dönüşüm`}
                                    icon={<TrendingUp size={16} className="text-green-600" />} color="bg-green-50" trend="up" />
                                <KpiCard label="Kaybedildi"    value={String(leadStats.lost)}
                                    icon={<TrendingDown size={16} className="text-red-500" />} color="bg-red-50" trend="down" />
                            </div>

                            {/* Dönüşüm hunisi */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                <SectionTitle icon={<PieChart size={14} />} title="Fırsat Dönüşüm Hunisi" />
                                <div className="space-y-3">
                                    {[
                                        { label: 'Yeni',            value: leadStats.new,         color: 'bg-cyan-400',   status: 'new' },
                                        { label: 'Görüşmede',       value: leadStats.negotiating, color: 'bg-amber-400',  status: 'negotiating' },
                                        { label: 'Kazanıldı',       value: leadStats.won,         color: 'bg-green-500',  status: 'won' },
                                        { label: 'Kaybedildi',      value: leadStats.lost,        color: 'bg-red-400',    status: 'lost' },
                                    ].map(row => (
                                        <HBar key={row.label} label={row.label} value={row.value}
                                            max={leadStats.total || 1} color={row.color}
                                            badge={`${row.value} adet`} />
                                    ))}
                                </div>
                                {leadStats.total > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-6">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Dönüşüm Oranı</p>
                                            <p className="text-2xl font-bold font-mono text-green-600">%{pct(leadStats.won, leadStats.total)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Kayıp Oranı</p>
                                            <p className="text-2xl font-bold font-mono text-red-500">%{pct(leadStats.lost, leadStats.total)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Aktif (Devam Eden)</p>
                                            <p className="text-2xl font-bold font-mono text-slate-700">{leadStats.new + leadStats.negotiating}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Lead listesi (son 20) */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-slate-700">Fırsat Listesi</h3>
                                    <span className="text-[10px] text-slate-400">{leads.length} kayıt</span>
                                </div>
                                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                                    {leads.slice(0, 50).map(lead => {
                                        const statusMap: Record<string, { label: string; cls: string }> = {
                                            new:         { label: 'Yeni',        cls: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
                                            negotiating: { label: 'Görüşmede',   cls: 'bg-amber-50 text-amber-600 border-amber-100' },
                                            won:         { label: 'Kazanıldı',   cls: 'bg-green-50 text-green-600 border-green-100' },
                                            lost:        { label: 'Kaybedildi',  cls: 'bg-red-50 text-red-500 border-red-100' },
                                        };
                                        const s = statusMap[lead.status] ?? { label: lead.status, cls: 'bg-slate-50 text-slate-500 border-slate-100' };
                                        return (
                                            <div key={lead.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-slate-700 truncate">
                                                        {lead.customer?.name ?? lead.title ?? '—'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">{fmtDate(lead.created_at)}</p>
                                                </div>
                                                <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 shrink-0 ${s.cls}`}>
                                                    {s.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {leads.length === 0 && (
                                        <p className="px-5 py-8 text-xs text-slate-400 text-center">Fırsat bulunamadı</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── FİNANS ── */}
                    {tab === 'finance' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <KpiCard label="Toplam Gelir"    value={fmtK(finStats.incomeTotal)}
                                    icon={<TrendingUp size={16} className="text-green-600" />} color="bg-green-50" trend="up" />
                                <KpiCard label="Toplam Gider"    value={fmtK(finStats.expenseTotal)}
                                    icon={<TrendingDown size={16} className="text-red-500" />} color="bg-red-50" trend="down" />
                                <KpiCard label="Net Bakiye"      value={fmtK(finStats.incomeTotal - finStats.expenseTotal)}
                                    icon={<Wallet size={16} className="text-blue-600" />} color="bg-blue-50"
                                    trend={finStats.incomeTotal > finStats.expenseTotal ? 'up' : 'down'} />
                                <KpiCard label="Fatura Toplamı"  value={fmtK(finStats.salesTotal)}
                                    sub={`${finStats.salesCount} satış faturası`}
                                    icon={<FileText size={16} className="text-purple-600" />} color="bg-purple-50" trend="neutral" />
                            </div>

                            {/* Aylık nakit akışı grafiği */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                <SectionTitle icon={<BarChart3 size={14} />}
                                    title={`${year} Aylık Nakit Akışı`}
                                    sub="Kasa/banka hareketleri (gelir / gider)" />
                                <div className="flex gap-4 mb-3">
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                        <div className="w-3 h-3 rounded-sm bg-green-400" /> Gelir
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                        <div className="w-3 h-3 rounded-sm bg-red-400" /> Gider
                                    </div>
                                </div>
                                <div className="flex items-end gap-0.5 mt-2" style={{ height: 120 }}>
                                    {monthly.map((m, i) => (
                                        <div key={i} className="flex items-end gap-0.5" style={{ flex: 1 }}>
                                            <div className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                                                <div className="w-full flex items-end" style={{ height: 80 }}>
                                                    <div className="w-full rounded-t-sm bg-green-400"
                                                        style={{ height: `${maxIncome > 0 ? Math.max((m.income / maxIncome) * 100, m.income > 0 ? 2 : 0) : 0}%` }} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                                                <div className="w-full flex items-end" style={{ height: 80 }}>
                                                    <div className="w-full rounded-t-sm bg-red-300"
                                                        style={{ height: `${maxIncome > 0 ? Math.max((m.expense / maxIncome) * 100, m.expense > 0 ? 2 : 0) : 0}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex mt-1">
                                    {monthly.map((m, i) => (
                                        <div key={i} className="flex-1 text-center">
                                            <span className="text-[8px] text-slate-400">{m.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Aylık fatura grafiği */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                <SectionTitle icon={<FileText size={14} />}
                                    title={`${year} Aylık Fatura Özeti`}
                                    sub="Satış faturaları (yeşil) / Alış faturaları (kırmızı)" />
                                <div className="flex items-end gap-1 mt-2" style={{ height: 120 }}>
                                    {monthly.map((m, i) => {
                                        const maxVal = Math.max(...monthly.map(x => Math.max(x.sales, x.purchase)), 1);
                                        return (
                                            <div key={i} className="flex items-end gap-0.5" style={{ flex: 1 }}>
                                                <div className="flex flex-col items-center" style={{ flex: 1 }}>
                                                    <div className="w-full flex items-end" style={{ height: 80 }}>
                                                        <div className="w-full rounded-t-sm bg-emerald-400"
                                                            style={{ height: `${maxVal > 0 ? Math.max((m.sales / maxVal) * 100, m.sales > 0 ? 2 : 0) : 0}%` }} />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center" style={{ flex: 1 }}>
                                                    <div className="w-full flex items-end" style={{ height: 80 }}>
                                                        <div className="w-full rounded-t-sm bg-orange-300"
                                                            style={{ height: `${maxVal > 0 ? Math.max((m.purchase / maxVal) * 100, m.purchase > 0 ? 2 : 0) : 0}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex mt-1">
                                    {monthly.map((m, i) => (
                                        <div key={i} className="flex-1 text-center">
                                            <span className="text-[8px] text-slate-400">{m.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Çek/senet uyarıları */}
                            {checkStats.bounced > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-700">Karşılıksız Çek/Senet Var</p>
                                        <p className="text-xs text-red-600 mt-0.5">{checkStats.bounced} adet karşılıksız çek/senet bulunuyor. Detaylar için Ön Muhasebe &gt; Çek/Senet sayfasını inceleyin.</p>
                                    </div>
                                </div>
                            )}

                            {/* Özet tablo */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                                    <h3 className="text-xs font-semibold text-slate-700">{year} Yıl Özeti</h3>
                                </div>
                                <table className="w-full text-xs">
                                    <tbody className="divide-y divide-slate-50">
                                        {[
                                            { label: 'Satış Faturaları Toplamı',  value: fmt(finStats.salesTotal),    color: 'text-emerald-600' },
                                            { label: 'Alış Faturaları Toplamı',   value: fmt(finStats.purchaseTotal), color: 'text-orange-500' },
                                            { label: 'Nakit Gelir',               value: fmt(finStats.incomeTotal),   color: 'text-green-600' },
                                            { label: 'Nakit Gider',               value: fmt(finStats.expenseTotal),  color: 'text-red-500' },
                                            { label: 'Net Nakit Pozisyonu',        value: fmt(finStats.incomeTotal - finStats.expenseTotal),
                                                color: finStats.incomeTotal >= finStats.expenseTotal ? 'text-green-600' : 'text-red-500' },
                                        ].map(row => (
                                            <tr key={row.label} className="hover:bg-slate-50">
                                                <td className="px-5 py-3 text-slate-600">{row.label}</td>
                                                <td className={`px-5 py-3 text-right font-mono font-semibold ${row.color}`}>{row.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
