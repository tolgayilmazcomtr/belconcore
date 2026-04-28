'use client';
import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import {
    Building2, TrendingUp, TrendingDown, Home, Users,
    FileText, Wallet, BarChart3, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';

const fmt = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(n || 0);
const fmtK = (n: number) => {
    if (n >= 1_000_000) return '₺' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '₺' + (n / 1_000).toFixed(0) + 'K';
    return fmt(n);
};

interface Stats {
    units: { available: number; reserved: number; sold: number; not_for_sale: number; total: number };
    leads: { total: number; new: number; negotiating: number; won: number };
    invoices: { salesTotal: number; purchasesTotal: number; receivable: number; payable: number };
    finance: { balance: number; incomeMonth: number; expenseMonth: number };
    costs: { planned: number; blended: number; perUnitPlanned: number; perUnitBlended: number; unitCount: number };
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

function StatCard({ label, value, sub, icon, color, trend }: {
    label: string; value: string; sub?: string; icon: React.ReactNode; color: string; trend?: 'up' | 'down' | 'neutral';
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
                {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />}
                {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                {trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
            </div>
            <div>
                <p className="text-xl font-bold font-mono text-slate-900">{value}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
                {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { activeProject } = useProjectStore();
    const user = useAuthStore(s => s.user);
    const isAdmin = user?.roles?.some(r => r.name === 'Admin') ?? false;
    const modules = user?.modules ?? [];

    const modulesReady = isAdmin || Array.isArray(user?.modules);
    const can = (mod: string) => isAdmin || (modulesReady && modules.includes(mod));

    const hasProjects    = can('module.projects');
    const hasCrm         = can('module.crm');
    const hasAccounting  = can('module.accounting');
    const hasStock       = can('module.stock');

    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const dateTo   = `${year}-${String(month).padStart(2, '0')}-31`;

    useEffect(() => {
        if (!activeProject || !modulesReady) { setLoading(false); return; }
        setLoading(true);
        const pid = activeProject.id;

        const calls = [
            hasProjects   ? api.get('/units',   { params: { active_project_id: pid, per_page: 1000 } })             : Promise.resolve(null),
            hasCrm        ? api.get('/leads',   { params: { active_project_id: pid, per_page: 1000 } })             : Promise.resolve(null),
            hasAccounting ? api.get('/accounting/invoices', { params: { active_project_id: pid, per_page: 1000, date_from: `${year}-01-01`, date_to: `${year}-12-31` } }) : Promise.resolve(null),
            hasAccounting ? api.get('/finance/summary',      { params: { active_project_id: pid } })                : Promise.resolve(null),
            hasAccounting ? api.get('/finance/transactions', { params: { active_project_id: pid, per_page: 1000, date_from: dateFrom, date_to: dateTo } }) : Promise.resolve(null),
            hasStock      ? api.get('/costs/summary',        { params: { active_project_id: pid } })                : Promise.resolve(null),
        ];

        Promise.allSettled(calls).then(([unitsRes, leadsRes, invRes, finSummaryRes, txRes, costRes]) => {
            const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;

            const units: any[] = (() => { const d = val(unitsRes); return Array.isArray(d?.data) ? d.data : (d?.data?.data || []); })();
            const leads: any[] = (() => { const d = val(leadsRes); return Array.isArray(d?.data) ? d.data : (d?.data?.data || []); })();
            const invoices: any[] = val(invRes)?.data?.data || [];
            const finSummary = val(finSummaryRes)?.data || {};
            const txs: any[] = val(txRes)?.data?.data || [];
            const costSummary = (() => { const d = val(costRes); return d?.data?.data || d?.data || {}; })();

            const salesInv = invoices.filter(i => i.type === 'sales');
            const purInv   = invoices.filter(i => i.type === 'purchase');
            const balance  = finSummary?.data?.total_balance ?? finSummary?.total_balance ?? 0;

            setStats({
                units: {
                    available:    units.filter(u => u.status === 'available').length,
                    reserved:     units.filter(u => u.status === 'reserved').length,
                    sold:         units.filter(u => u.status === 'sold').length,
                    not_for_sale: units.filter(u => u.status === 'not_for_sale').length,
                    total:        units.length,
                },
                leads: {
                    total:       leads.length,
                    new:         leads.filter((l: any) => l.status === 'new').length,
                    negotiating: leads.filter((l: any) => ['contacted', 'qualified', 'proposal', 'negotiation'].includes(l.status)).length,
                    won:         leads.filter((l: any) => l.status === 'won').length,
                },
                invoices: {
                    salesTotal:     salesInv.reduce((s, i) => s + i.total, 0),
                    purchasesTotal: purInv.reduce((s, i) => s + i.total, 0),
                    receivable:     salesInv.reduce((s, i) => s + (i.remaining || 0), 0),
                    payable:        purInv.reduce((s, i) => s + (i.remaining || 0), 0),
                },
                finance: {
                    balance,
                    incomeMonth:  txs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0),
                    expenseMonth: txs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0),
                },
                costs: {
                    planned:        costSummary.total_planned    || 0,
                    blended:        costSummary.blended_total    || 0,
                    perUnitPlanned: costSummary.planned_per_unit || 0,
                    perUnitBlended: costSummary.actual_per_unit  || 0,
                    unitCount:      costSummary.unit_count       || 0,
                },
            });
        }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProject, hasProjects, hasCrm, hasAccounting, hasStock]);

    if (!activeProject) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <Building2 className="w-12 h-12 text-slate-200" />
                <p className="text-slate-400 text-sm font-medium">Lütfen bir proje seçin</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-pulse">
                <div className="h-6 bg-slate-100 rounded w-48" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-xl" />)}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-slate-100 rounded-xl" />)}</div>
            </div>
        );
    }

    const defaultStats: Stats = {
        units:    { available: 0, reserved: 0, sold: 0, not_for_sale: 0, total: 0 },
        leads:    { total: 0, new: 0, negotiating: 0, won: 0 },
        invoices: { salesTotal: 0, purchasesTotal: 0, receivable: 0, payable: 0 },
        finance:  { balance: 0, incomeMonth: 0, expenseMonth: 0 },
        costs:    { planned: 0, blended: 0, perUnitPlanned: 0, perUnitBlended: 0, unitCount: 0 },
    };
    const { units, leads, invoices, finance, costs } = stats ?? defaultStats;
    const costVariance    = costs.blended - costs.planned;
    const costVariancePct = costs.planned > 0 ? ((costVariance / costs.planned) * 100) : 0;
    const soldRevenue     = invoices.salesTotal;
    const grossProfit     = soldRevenue - costs.blended;
    const profitPct       = soldRevenue > 0 ? ((grossProfit / soldRevenue) * 100) : 0;

    // Muhasebe KPI kartları
    const accountingKpis = hasAccounting ? [
        {
            label: 'Kasa / Banka Bakiyesi',
            value: fmtK(finance.balance),
            sub: `Bu ay: +${fmtK(finance.incomeMonth)} / -${fmtK(finance.expenseMonth)}`,
            icon: <Wallet className="w-4 h-4 text-blue-600" />,
            color: 'bg-blue-50',
            trend: (finance.balance >= 0 ? 'up' : 'down') as 'up' | 'down',
        },
        {
            label: 'Yıllık Satış Cirosu',
            value: fmtK(invoices.salesTotal),
            sub: `Alacak: ${fmtK(invoices.receivable)}`,
            icon: <TrendingUp className="w-4 h-4 text-green-600" />,
            color: 'bg-green-50',
            trend: 'up' as const,
        },
        {
            label: 'Toplam Alış / Gider',
            value: fmtK(invoices.purchasesTotal),
            sub: `Borç: ${fmtK(invoices.payable)}`,
            icon: <TrendingDown className="w-4 h-4 text-red-500" />,
            color: 'bg-red-50',
            trend: 'down' as const,
        },
        {
            label: 'Brüt Kar (Tahmini)',
            value: fmtK(Math.abs(grossProfit)),
            sub: `Ciro: ${fmtK(soldRevenue)} · ${profitPct.toFixed(1)}%`,
            icon: grossProfit >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-rose-600" />,
            color: grossProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50',
            trend: (grossProfit >= 0 ? 'up' : 'down') as 'up' | 'down',
        },
    ] : [];

    const middleCards = [hasProjects, hasCrm, hasStock].filter(Boolean).length;

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full overflow-x-hidden">
            {/* Header */}
            <div>
                <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />Dashboard
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">{activeProject.name} · Genel Bakış</p>
            </div>

            {/* Muhasebe KPI Kartları — sadece accounting yetkisi varsa */}
            {accountingKpis.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {accountingKpis.map(c => <StatCard key={c.label} {...c} />)}
                </div>
            )}

            {/* Middle Row */}
            {middleCards > 0 && (
                <div className={`grid grid-cols-1 md:grid-cols-2 ${middleCards === 3 ? 'lg:grid-cols-3' : middleCards === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-3 sm:gap-4`}>

                    {/* Daire Durumu — projects yetkisi */}
                    {hasProjects && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <Home className="w-4 h-4 text-slate-500" />
                                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Daire Durumu</h3>
                                <span className="ml-auto text-[10px] text-slate-400 font-mono">{units.total} toplam</span>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Satışa Açık',   count: units.available,    total: units.total, color: 'bg-green-500',  textColor: 'text-green-700' },
                                    { label: 'Rezerve',       count: units.reserved,     total: units.total, color: 'bg-orange-400', textColor: 'text-orange-700' },
                                    { label: 'Satıldı',       count: units.sold,         total: units.total, color: 'bg-red-500',    textColor: 'text-red-700' },
                                    { label: 'Satışa Kapalı', count: units.not_for_sale, total: units.total, color: 'bg-slate-300',  textColor: 'text-slate-500' },
                                ].map(row => (
                                    <div key={row.label} className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-600">{row.label}</span>
                                            <span className={`text-xs font-bold font-mono ${row.textColor}`}>{row.count}</span>
                                        </div>
                                        <MiniBar value={row.count} max={row.total} color={row.color} />
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                                <div>
                                    <p className="text-lg font-bold font-mono text-red-600">{units.sold}</p>
                                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">Satıldı</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold font-mono text-green-600">{units.available}</p>
                                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">Satışa Açık</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CRM — crm yetkisi */}
                    {hasCrm && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-500" />
                                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Satış Hattı (CRM)</h3>
                                <span className="ml-auto text-[10px] text-slate-400 font-mono">{leads.total} fırsat</span>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Yeni Fırsat',       count: leads.new,         color: 'bg-blue-400',  textColor: 'text-blue-600' },
                                    { label: 'Görüşme / Teklif',  count: leads.negotiating, color: 'bg-amber-400', textColor: 'text-amber-600' },
                                    { label: 'Kazanıldı',         count: leads.won,         color: 'bg-green-500', textColor: 'text-green-700' },
                                    { label: 'Toplam',            count: leads.total,       color: 'bg-slate-300', textColor: 'text-slate-600' },
                                ].map(row => (
                                    <div key={row.label} className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-600">{row.label}</span>
                                            <span className={`text-xs font-bold font-mono ${row.textColor}`}>{row.count}</span>
                                        </div>
                                        <MiniBar value={row.count} max={Math.max(leads.total, 1)} color={row.color} />
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                                <div>
                                    <p className="text-lg font-bold font-mono text-green-600">{leads.won}</p>
                                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">Kazanıldı</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold font-mono text-blue-600">
                                        {leads.total > 0 ? ((leads.won / leads.total) * 100).toFixed(0) : 0}%
                                    </p>
                                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">Dönüşüm</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Maliyet Takip — stock yetkisi */}
                    {hasStock && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Maliyet Takip</h3>
                                {costs.unitCount > 0 && <span className="ml-auto text-[10px] text-slate-400 font-mono">{costs.unitCount} daire</span>}
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                                    <span className="text-xs text-slate-500">Planlanan Toplam</span>
                                    <span className="text-xs font-mono font-semibold text-slate-700">{fmtK(costs.planned)}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                                    <span className="text-xs text-slate-500">Güncel Tahmin</span>
                                    <span className="text-xs font-mono font-semibold text-slate-700">{fmtK(costs.blended)}</span>
                                </div>
                                <div className={`flex justify-between items-center py-1.5 rounded-lg px-2 ${costVariance <= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <span className="text-xs font-medium text-slate-600">Fark</span>
                                    <div className="flex items-center gap-1">
                                        {costVariance <= 0
                                            ? <ArrowDownRight className="w-3 h-3 text-green-600" />
                                            : <ArrowUpRight className="w-3 h-3 text-red-500" />}
                                        <span className={`text-xs font-mono font-bold ${costVariance <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {fmtK(Math.abs(costVariance))} ({Math.abs(costVariancePct).toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {costs.unitCount > 0 && (
                                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                                    <div>
                                        <p className="text-sm font-bold font-mono text-slate-700">{fmtK(costs.perUnitPlanned)}</p>
                                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">Planlanan/Daire</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold font-mono text-slate-700">{fmtK(costs.perUnitBlended)}</p>
                                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">Gerçek/Daire</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Finansal detay satırları — sadece accounting yetkisi varsa */}
            {hasAccounting && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-4">Finansal Özet (Yıl {year})</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Satış Cirosu',             value: invoices.salesTotal,     color: 'bg-blue-500' },
                                { label: 'Toplam Alış/Gider',        value: invoices.purchasesTotal, color: 'bg-red-400' },
                                { label: 'İnşaat Maliyeti (Tahmini)',value: costs.blended,           color: 'bg-orange-400' },
                                { label: 'Net Kasa Bakiyesi',        value: Math.max(finance.balance, 0), color: 'bg-green-500' },
                            ].map(row => {
                                const maxVal = Math.max(invoices.salesTotal, invoices.purchasesTotal, costs.blended, 1);
                                return (
                                    <div key={row.label} className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-600">{row.label}</span>
                                            <span className="text-xs font-mono font-semibold text-slate-800">{fmtK(row.value)}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.min((row.value / maxVal) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-4">Bu Ay Özet & Vadeli Durumlar</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Bu Ay Nakit</p>
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-base font-bold font-mono text-green-700">{fmtK(finance.incomeMonth)}</p>
                                    <p className="text-[9px] text-green-500 uppercase">Gelen</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3 text-center">
                                    <p className="text-base font-bold font-mono text-red-600">{fmtK(finance.expenseMonth)}</p>
                                    <p className="text-[9px] text-red-400 uppercase">Giden</p>
                                </div>
                                <div className={`rounded-lg p-3 text-center ${finance.incomeMonth >= finance.expenseMonth ? 'bg-blue-50' : 'bg-amber-50'}`}>
                                    <p className={`text-base font-bold font-mono ${finance.incomeMonth >= finance.expenseMonth ? 'text-blue-700' : 'text-amber-700'}`}>
                                        {fmtK(Math.abs(finance.incomeMonth - finance.expenseMonth))}
                                    </p>
                                    <p className="text-[9px] text-slate-400 uppercase">{finance.incomeMonth >= finance.expenseMonth ? 'Net Artı' : 'Net Eksi'}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Vadeli Durumlar</p>
                                <div className="bg-amber-50 rounded-lg p-3 text-center">
                                    <p className="text-base font-bold font-mono text-amber-700">{fmtK(invoices.receivable)}</p>
                                    <p className="text-[9px] text-amber-500 uppercase">Alacak</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3 text-center">
                                    <p className="text-base font-bold font-mono text-red-700">{fmtK(invoices.payable)}</p>
                                    <p className="text-[9px] text-red-400 uppercase">Borç</p>
                                </div>
                                <div className={`rounded-lg p-3 text-center ${invoices.receivable >= invoices.payable ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <p className={`text-base font-bold font-mono ${invoices.receivable >= invoices.payable ? 'text-green-700' : 'text-red-700'}`}>
                                        {fmtK(Math.abs(invoices.receivable - invoices.payable))}
                                    </p>
                                    <p className="text-[9px] text-slate-400 uppercase">{invoices.receivable >= invoices.payable ? 'Net Alacak' : 'Net Borç'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Maliyet Analizi — stock yetkisi ve veri varsa */}
            {hasStock && costs.planned > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-4">Maliyet Kar/Zarar Analizi</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            { label: 'Planlanan Maliyet', value: costs.planned,           color: 'text-slate-700',   bg: 'bg-slate-50' },
                            { label: 'Gerçek Maliyet',    value: costs.blended,           color: costVariance > 0 ? 'text-red-600' : 'text-green-600',       bg: costVariance > 0 ? 'bg-red-50' : 'bg-green-50' },
                            { label: 'Maliyet Farkı',     value: Math.abs(costVariance),  color: costVariance <= 0 ? 'text-green-600' : 'text-red-600',      bg: costVariance <= 0 ? 'bg-green-50' : 'bg-red-50' },
                            { label: 'Satış Cirosu',      value: invoices.salesTotal,     color: 'text-blue-700',    bg: 'bg-blue-50' },
                            { label: 'Tahmini Kar',       value: Math.abs(grossProfit),   color: grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700',    bg: grossProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50' },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100 text-center`}>
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
                                <p className={`text-base font-bold font-mono ${s.color}`}>{fmtK(s.value)}</p>
                                {s.label === 'Maliyet Farkı' && <p className={`text-[9px] mt-0.5 ${costVariance <= 0 ? 'text-green-500' : 'text-red-400'}`}>{costVariance <= 0 ? '▼ Tasarruf' : '▲ Aşım'}</p>}
                                {s.label === 'Tahmini Kar'   && <p className={`text-[9px] mt-0.5 ${grossProfit >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>{profitPct.toFixed(1)}% marj</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hiç kart yoksa mesaj */}
            {!hasAccounting && !hasProjects && !hasCrm && !hasStock && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <BarChart3 className="w-10 h-10 text-slate-200" />
                    <p className="text-slate-400 text-sm">Bu panel için görüntülenecek veri yok</p>
                </div>
            )}
        </div>
    );
}
