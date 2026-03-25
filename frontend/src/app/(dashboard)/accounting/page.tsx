'use client';

import React, { useEffect, useMemo } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useAccountingStore } from '@/store/useAccountingStore';
import api from '@/lib/api';
import { TrendingUp, TrendingDown, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const fmtMoney = (n: number) =>
    '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n || 0);

export default function AccountingPage() {
    const { activeProject } = useProjectStore();
    const { accounts, invoices, setAccounts, setInvoices } = useAccountingStore();

    useEffect(() => {
        if (!activeProject) return;
        Promise.all([
            api.get('/accounting/accounts', { params: { active_project_id: activeProject.id, per_page: 1000 } }),
            api.get('/accounting/invoices', { params: { active_project_id: activeProject.id, per_page: 1000 } }),
        ]).then(([a, i]) => {
            setAccounts(Array.isArray(a.data) ? a.data : (a.data.data || []));
            setInvoices(Array.isArray(i.data) ? i.data : (i.data.data || []));
        }).catch(() => { });
    }, [activeProject, setAccounts, setInvoices]);

    const stats = useMemo(() => ({
        totalReceivable: invoices.filter(i => i.type === 'sales').reduce((s, i) => s + i.remaining, 0),
        totalPayable: invoices.filter(i => i.type === 'purchase').reduce((s, i) => s + i.remaining, 0),
        totalSales: invoices.filter(i => i.type === 'sales').reduce((s, i) => s + i.total, 0),
        totalPurchases: invoices.filter(i => i.type === 'purchase').reduce((s, i) => s + i.total, 0),
        accountCount: accounts.length,
        overdueCount: invoices.filter(i => i.remaining > 0 && i.due_date && new Date(i.due_date) < new Date()).length,
    }), [invoices, accounts]);

    if (!activeProject) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">Aktif proje seçilmedi.</p>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-base font-semibold text-slate-800">Muhasebe Genel Bakış</h1>
                <p className="text-xs text-slate-400 mt-0.5">{activeProject.name}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Toplam Alacak', value: fmtMoney(stats.totalReceivable), icon: <TrendingUp size={18} />, color: 'text-green-600', bg: 'bg-green-50', href: '/accounting/sales' },
                    { label: 'Toplam Borç', value: fmtMoney(stats.totalPayable), icon: <TrendingDown size={18} />, color: 'text-red-500', bg: 'bg-red-50', href: '/accounting/purchases' },
                    { label: 'Toplam Satış', value: fmtMoney(stats.totalSales), icon: <TrendingUp size={18} />, color: 'text-blue-600', bg: 'bg-blue-50', href: '/accounting/sales' },
                    { label: 'Toplam Alış', value: fmtMoney(stats.totalPurchases), icon: <TrendingDown size={18} />, color: 'text-purple-600', bg: 'bg-purple-50', href: '/accounting/purchases' },
                ].map(s => (
                    <Link key={s.label} href={s.href}
                        className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
                            <div className={`${s.bg} ${s.color} p-1.5 rounded-lg`}>{s.icon}</div>
                        </div>
                        <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
                    </Link>
                ))}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-3 gap-4">
                <Link href="/accounting/accounts"
                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm hover:border-blue-300 transition-all flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg"><Users size={18} className="text-slate-600" /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-700">Cariler</p>
                        <p className="text-xs text-slate-400">{stats.accountCount} kayıt</p>
                    </div>
                </Link>
                <Link href="/accounting/sales/new"
                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm hover:border-blue-300 transition-all flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg"><TrendingUp size={18} className="text-blue-600" /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-700">Yeni Satış Faturası</p>
                        <p className="text-xs text-slate-400">Hızlı fatura oluştur</p>
                    </div>
                </Link>
                {stats.overdueCount > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg"><AlertCircle size={18} className="text-red-500" /></div>
                        <div>
                            <p className="text-sm font-medium text-red-700">Vadesi Geçmiş</p>
                            <p className="text-xs text-red-400">{stats.overdueCount} fatura ödeme bekliyor</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
