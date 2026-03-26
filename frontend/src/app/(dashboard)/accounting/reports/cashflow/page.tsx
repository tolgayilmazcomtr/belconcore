'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { Wallet } from 'lucide-react';

const fmt = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('tr-TR') : '—';

export default function CashflowReport() {
    const { activeProject } = useProjectStore();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [accountFilter, setAccountFilter] = useState('all');

    useEffect(() => {
        if (!activeProject) return;
        setLoading(true);
        Promise.all([
            api.get('/finance/transactions', {
                params: {
                    active_project_id: activeProject.id,
                    date_from: `${year}-${String(month).padStart(2,'0')}-01`,
                    date_to: `${year}-${String(month).padStart(2,'0')}-31`,
                    per_page: 1000,
                }
            }),
            api.get('/finance/accounts', { params: { active_project_id: activeProject.id } }),
        ]).then(([t, a]) => {
            setTransactions(t.data.data || []);
            setAccounts(a.data.data || []);
        }).finally(() => setLoading(false));
    }, [activeProject, year, month]);

    const filtered = useMemo(() =>
        accountFilter === 'all' ? transactions : transactions.filter(t => t.account_id?.toString() === accountFilter),
    [transactions, accountFilter]);

    const stats = useMemo(() => ({
        income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        transfer: filtered.filter(t => t.type === 'transfer').reduce((s, t) => s + t.amount, 0),
    }), [filtered]);

    const TYPE_LABEL: Record<string, string> = { income: 'Gelir', expense: 'Gider', transfer: 'Transfer' };
    const TYPE_COLOR: Record<string, string> = { income: 'text-green-600', expense: 'text-red-500', transfer: 'text-blue-500' };

    if (!activeProject) return <div className="flex items-center justify-center h-full"><p className="text-slate-400 text-sm">Aktif proje seçilmedi.</p></div>;

    return (
        <div className="p-6 space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" />Kasa Hareketleri</h1>
                    <p className="text-xs text-slate-400 mt-0.5">{activeProject.name}</p>
                </div>
                <div className="flex gap-2">
                    <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700">
                        <option value="all">Tüm Hesaplar</option>
                        {accounts.map(a => <option key={a.id} value={a.id.toString()}>{a.name}</option>)}
                    </select>
                    <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700">
                        {['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'].map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700">
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Toplam Gelir', value: fmt(stats.income), color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Toplam Gider', value: fmt(stats.expense), color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Net Nakit Akışı', value: fmt(stats.income - stats.expense), color: stats.income >= stats.expense ? 'text-green-700' : 'text-red-700', bg: stats.income >= stats.expense ? 'bg-green-50' : 'bg-red-50' },
                    { label: 'Transfer', value: fmt(stats.transfer), color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100`}>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
                        <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {loading ? <p className="text-slate-400 text-sm">Yükleniyor...</p> : filtered.length === 0 ? (
                <div className="py-16 text-center"><p className="text-slate-400 text-sm">Seçili dönemde hareket bulunamadı.</p></div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] px-4 py-2.5 bg-slate-50 border-b text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                        <span>Tarih</span><span>Açıklama</span><span>Hesap</span><span className="text-center">Tür</span><span className="text-right">Tutar</span>
                    </div>
                    {filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                        <div key={tx.id} className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <span className="text-xs text-slate-500">{fmtDate(tx.date)}</span>
                            <span className="text-xs text-slate-700">{tx.description || tx.category || '—'}</span>
                            <span className="text-xs text-slate-500 truncate">{tx.account?.name || '—'}</span>
                            <span className={`text-xs text-center font-medium ${TYPE_COLOR[tx.type]}`}>{TYPE_LABEL[tx.type]}</span>
                            <span className={`text-xs font-mono font-semibold text-right ${TYPE_COLOR[tx.type]}`}>
                                {tx.type === 'expense' ? '-' : '+'}{fmt(tx.amount)}
                            </span>
                        </div>
                    ))}
                    <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] px-4 py-3 bg-slate-900 text-white text-sm font-bold">
                        <span>{filtered.length} işlem</span><span /><span /><span />
                        <span className={`text-right font-mono ${stats.income >= stats.expense ? 'text-green-400' : 'text-red-400'}`}>{fmt(stats.income - stats.expense)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
