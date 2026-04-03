'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import {
  FileText, AlertTriangle, Clock, TrendingUp, TrendingDown,
  Wallet, Box, Users, ShoppingBag, CheckSquare, BarChart2,
  ArrowUpRight, ArrowDownLeft, Package, Building2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContractSummary {
  overdue_count: number;
  overdue_amount: number;
  due_in_7_count: number;
  due_in_30_count: number;
  due_in_30_amount: number;
  upcoming_installments: { id: number; amount: number; due_date: string; days_until_due: number; contract?: { title: string } }[];
}

interface FinanceSummary {
  total_balance: number;
  total_income: number;
  total_expense: number;
}

interface StockSummary {
  item_count: number;
  low_stock_count: number;
  total_stock_value: number;
  month_in_value: number;
  month_out_value: number;
}

interface CheckSummary {
  pending_count?: number;
  pending_amount?: number;
  total_receivable?: number;
  total_payable?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n ?? 0);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, href, accent = 'blue',
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; href?: string;
  accent?: 'blue' | 'green' | 'red' | 'amber' | 'slate';
}) {
  const accentMap = {
    blue:  'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    red:   'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-500',
  };
  const inner = (
    <div className="flex items-start gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-slate-300 hover:shadow-sm transition-all h-full">
      <div className={`p-2 rounded-lg flex-shrink-0 ${accentMap[accent]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-slate-900 tabular-nums leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, icon, href, children }: {
  title: string; icon: React.ReactNode; href?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="text-slate-400">{icon}</span>
          {title}
        </div>
        {href && (
          <Link href={href} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5">
            Tümü <ArrowUpRight size={12} />
          </Link>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── Quick Links ──────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: 'Projeler', href: '/projects', icon: <Building2 size={16} /> },
  { label: 'Müşteriler', href: '/customers', icon: <Users size={16} /> },
  { label: 'Satış Faturaları', href: '/accounting/sales', icon: <ArrowUpRight size={16} /> },
  { label: 'Alış Faturaları', href: '/accounting/purchases', icon: <ArrowDownLeft size={16} /> },
  { label: 'Sözleşmeler', href: '/accounting/contracts', icon: <FileText size={16} /> },
  { label: 'Kasa & Banka', href: '/accounting/finance', icon: <Wallet size={16} /> },
  { label: 'Stok', href: '/inventory', icon: <Package size={16} /> },
  { label: 'Çekler', href: '/accounting/checks', icon: <CheckSquare size={16} /> },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { activeProject } = useProjectStore();
  const { user } = useAuthStore();
  const projectId = activeProject?.id;

  const [contracts, setContracts] = useState<ContractSummary | null>(null);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [stock, setStock] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [c, f, s] = await Promise.allSettled([
        api.get('/contracts/summary'),
        api.get('/finance/summary'),
        api.get('/stock/summary'),
      ]);
      if (c.status === 'fulfilled') setContracts(c.value.data?.data ?? null);
      if (f.status === 'fulfilled') setFinance(f.value.data?.data ?? f.value.data ?? null);
      if (s.status === 'fulfilled') setStock(s.value.data?.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const firstName = user?.name?.split(' ')[0] ?? 'Kullanıcı';

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <Building2 size={36} className="text-slate-200" />
        <p className="text-sm">Başlamak için bir proje seçin</p>
        <Link href="/projects" className="text-sm text-blue-600 hover:underline font-medium">Projelere git</Link>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 max-w-6xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-base font-semibold text-slate-900">{greeting}, {firstName} 👋</h1>
        <p className="text-sm text-slate-500 mt-0.5">{activeProject.name} — genel durum</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Kasa & Banka"
          value={fmt(finance?.total_balance ?? 0)}
          sub={`+${fmt(finance?.total_income ?? 0)} giriş`}
          icon={<Wallet size={18} />}
          href="/accounting/finance"
          accent="green"
        />
        <KpiCard
          label="Gecikmiş Taksit"
          value={String(contracts?.overdue_count ?? 0)}
          sub={contracts?.overdue_amount ? fmt(contracts.overdue_amount) : 'Sorun yok'}
          icon={<AlertTriangle size={18} />}
          href="/accounting/contracts"
          accent={contracts?.overdue_count ? 'red' : 'slate'}
        />
        <KpiCard
          label="7 Günde Vade"
          value={String(contracts?.due_in_7_count ?? 0)}
          sub="taksit vadesi dolacak"
          icon={<Clock size={18} />}
          href="/accounting/contracts"
          accent={contracts?.due_in_7_count ? 'amber' : 'slate'}
        />
        <KpiCard
          label="Stok Değeri"
          value={fmt(stock?.total_stock_value ?? 0)}
          sub={stock?.low_stock_count ? `${stock.low_stock_count} düşük stok` : `${stock?.item_count ?? 0} kalem`}
          icon={<Box size={18} />}
          href="/inventory"
          accent={stock?.low_stock_count ? 'amber' : 'blue'}
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming installments */}
        <SectionCard title="Yaklaşan Taksitler" icon={<FileText size={15} />} href="/accounting/contracts">
          {!contracts || contracts.upcoming_installments.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400 text-center">Bekleyen taksit yok</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {contracts.upcoming_installments.slice(0, 6).map(inst => {
                const overdue = inst.days_until_due < 0;
                return (
                  <div key={inst.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${overdue ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 truncate">{inst.contract?.title ?? 'Sözleşme'}</p>
                      <p className="text-xs text-slate-400">{fmtDate(inst.due_date)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-slate-700 tabular-nums">{fmt(inst.amount)}</p>
                      <p className={`text-[10px] font-semibold ${overdue ? 'text-red-500' : 'text-amber-600'}`}>
                        {overdue ? `${Math.abs(inst.days_until_due)}g geç` : `${inst.days_until_due}g`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Finance overview */}
        <SectionCard title="Kasa & Banka" icon={<Wallet size={15} />} href="/accounting/finance">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between py-2.5 border border-slate-100 rounded-lg px-3 bg-slate-50">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <TrendingUp size={15} className="text-emerald-500" />
                Toplam Giriş
              </div>
              <span className="text-sm font-semibold text-emerald-600 tabular-nums">{fmt(finance?.total_income ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border border-slate-100 rounded-lg px-3 bg-slate-50">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <TrendingDown size={15} className="text-red-500" />
                Toplam Çıkış
              </div>
              <span className="text-sm font-semibold text-red-500 tabular-nums">{fmt(finance?.total_expense ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border border-blue-100 rounded-lg px-3 bg-blue-50">
              <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <Wallet size={15} className="text-blue-600" />
                Net Bakiye
              </div>
              <span className="text-sm font-bold text-blue-700 tabular-nums">{fmt(finance?.total_balance ?? 0)}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stock summary */}
        <SectionCard title="Stok & Depo" icon={<Package size={15} />} href="/inventory">
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            {[
              { label: 'Stok Kalemi', value: String(stock?.item_count ?? 0), sub: 'toplam kalem' },
              { label: 'Düşük Stok', value: String(stock?.low_stock_count ?? 0), sub: 'minimum altı', warn: (stock?.low_stock_count ?? 0) > 0 },
              { label: 'Bu Ay Giriş', value: fmt(stock?.month_in_value ?? 0), sub: 'stok girişi' },
              { label: 'Bu Ay Çıkış', value: fmt(stock?.month_out_value ?? 0), sub: 'stok çıkışı' },
            ].map((item, i) => (
              <div key={i} className={`px-4 py-3 ${i >= 2 ? 'border-t border-slate-100' : ''}`}>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{item.label}</p>
                <p className={`text-base font-bold tabular-nums mt-0.5 ${item.warn ? 'text-amber-600' : 'text-slate-800'}`}>
                  {item.value}
                </p>
                <p className="text-[10px] text-slate-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Quick links */}
        <SectionCard title="Hızlı Erişim" icon={<BarChart2 size={15} />}>
          <div className="grid grid-cols-2 gap-1.5 p-3">
            {QUICK_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors"
              >
                <span className="text-slate-400 flex-shrink-0">{l.icon}</span>
                <span className="text-xs font-medium text-slate-700">{l.label}</span>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
