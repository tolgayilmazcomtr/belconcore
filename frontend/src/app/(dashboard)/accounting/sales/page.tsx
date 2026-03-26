'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useAccountingStore } from '@/store/useAccountingStore';
import { Invoice, AccountingAccount } from '@/types/accounting.types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Search, Users, FileText, Trash2, Download, MoreVertical } from 'lucide-react';
import { InvoiceDetailModal } from '@/components/accounting/InvoiceDetailModal';
import Link from 'next/link';
import { useRef } from 'react';
import ReactDOM from 'react-dom';

interface CtxMenu { x: number; y: number; invoice: Invoice; }

function ContextMenu({ menu, onClose, onDetail, onPdf, onDelete }: {
    menu: CtxMenu;
    onClose: () => void;
    onDetail: (inv: Invoice) => void;
    onPdf: (inv: Invoice) => void;
    onDelete: (inv: Invoice) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
        const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', handler);
        document.addEventListener('keydown', escHandler);
        return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', escHandler); };
    }, [onClose]);

    // Adjust position so menu stays in viewport
    const menuWidth = 180;
    const menuHeight = 128;
    const x = menu.x + menuWidth > window.innerWidth ? menu.x - menuWidth : menu.x;
    const y = menu.y + menuHeight > window.innerHeight ? menu.y - menuHeight : menu.y;

    return ReactDOM.createPortal(
        <div ref={ref} className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-[180px] text-sm"
            style={{ left: x, top: y }}>
            <button onClick={() => { onDetail(menu.invoice); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 text-xs">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Detay / Düzenle
            </button>
            <button onClick={() => { onPdf(menu.invoice); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 text-xs">
                <Download className="w-3.5 h-3.5 text-blue-500" /> PDF İndir
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button onClick={() => { onDelete(menu.invoice); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-red-600 text-xs">
                <Trash2 className="w-3.5 h-3.5" /> Sil
            </button>
        </div>,
        document.body
    );
}

const fmtMoney = (n: number) =>
    '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const STATUS_BADGE: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-500',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-500',
};
const STATUS_LABEL: Record<string, string> = {
    draft: 'Taslak', sent: 'Gönderildi', paid: 'Ödendi', partial: 'Kısmi', cancelled: 'İptal',
};

export default function SalesPage() {
    const { activeProject } = useProjectStore();
    const { accounts, invoices, setAccounts, setInvoices, upsertInvoice } = useAccountingStore();

    const [loading, setLoading] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [accountSearch, setAccountSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

    const load = useCallback(async () => {
        if (!activeProject) return;
        setLoading(true);
        try {
            const [accRes, invRes] = await Promise.all([
                api.get('/accounting/accounts', { params: { active_project_id: activeProject.id } }),
                api.get('/accounting/invoices', { params: { active_project_id: activeProject.id, type: 'sales' } }),
            ]);
            setAccounts(accRes.data.data);
            setInvoices(invRes.data.data);
        } catch { toast.error('Veri yüklenemedi.'); }
        finally { setLoading(false); }
    }, [activeProject, setAccounts, setInvoices]);

    useEffect(() => { load(); }, [load]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;
            if (e.key === 'Escape') { setDetailOpen(false); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const filtAccounts = useMemo(() => {
        const s = accountSearch.toLowerCase();
        return accounts.filter(a =>
            !s || a.name.toLowerCase().includes(s) || (a.tax_number || '').includes(s)
        );
    }, [accounts, accountSearch]);

    const filtInvoices = useMemo(() => {
        let list = invoices.filter(i => i.type === 'sales');
        if (selectedAccountId) list = list.filter(i => i.account_id === selectedAccountId);
        if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
        if (invoiceSearch) {
            const s = invoiceSearch.toLowerCase();
            list = list.filter(i =>
                (i.invoice_no || '').toLowerCase().includes(s) ||
                (i.description || '').toLowerCase().includes(s) ||
                (i.account?.name || '').toLowerCase().includes(s)
            );
        }
        list = [...list].sort((a, b) => {
            const cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
            return dateSort === 'desc' ? -cmp : cmp;
        });
        return list;
    }, [invoices, selectedAccountId, statusFilter, invoiceSearch, dateSort]);

    const openDetail = async (invoice: Invoice) => {
        try {
            const r = await api.get(`/accounting/invoices/${invoice.id}`);
            setSelectedInvoice(r.data.data);
            setDetailOpen(true);
        } catch { toast.error('Fatura yüklenemedi.'); }
    };

    const handlePdf = (inv: Invoice) => {
        try {
            const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}');
            const token = auth?.state?.token || '';
            window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting/invoices/${inv.id}/pdf?token=${token}`, '_blank');
        } catch {
            window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting/invoices/${inv.id}/pdf`, '_blank');
        }
    };

    const handleDelete = async (inv: Invoice) => {
        if (!confirm(`"${inv.invoice_no || `#${inv.id}`}" faturasını silmek istediğinize emin misiniz?`)) return;
        try {
            await api.delete(`/accounting/invoices/${inv.id}`, { params: { active_project_id: activeProject?.id } });
            setInvoices(invoices.filter(i => i.id !== inv.id));
            toast.success('Fatura silindi.');
        } catch { toast.error('Silinemedi.'); }
    };

    const handleContextMenu = (e: React.MouseEvent, inv: Invoice) => {
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY, invoice: inv });
    };

    if (!activeProject) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">Aktif proje seçilmedi.</p>
        </div>
    );

    const totalRemaining = filtInvoices.reduce((s, i) => s + (i.remaining || 0), 0);
    const totalAmount = filtInvoices.reduce((s, i) => s + (i.total || 0), 0);

    return (
        <div className="flex h-full">
            {/* Left: Account list mini-panel */}
            <div className="w-[220px] shrink-0 border-r border-slate-200 bg-white flex flex-col">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1.5">
                    <Users size={13} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Satışlar</span>
                    <button
                        onClick={() => setSelectedAccountId(null)}
                        className={`ml-auto text-[10px] px-1.5 py-0.5 rounded transition-colors ${!selectedAccountId ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}>
                        Tümü
                    </button>
                </div>
                <div className="px-2 py-1.5 border-b border-slate-100">
                    <div className="relative">
                        <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={accountSearch} onChange={e => setAccountSearch(e.target.value)}
                            placeholder="Cari ara..." className="w-full h-6 pl-6 pr-2 text-[11px] border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filtAccounts.map(a => {
                        const accountInvoices = invoices.filter(i => i.account_id === a.id && i.type === 'sales');
                        const isSelected = selectedAccountId === a.id;
                        return (
                            <button key={a.id}
                                onClick={() => setSelectedAccountId(isSelected ? null : a.id)}
                                className={`w-full text-left px-3 py-2 border-b border-slate-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'}`}>
                                <p className={`text-[12px] font-medium truncate ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{a.name}</p>
                                <p className="text-[10px] text-slate-400">{accountInvoices.length} fatura</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right: Invoice list */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 shrink-0">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="h-7 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400">
                        <option value="all">Tümü</option>
                        <option value="draft">Taslak</option>
                        <option value="sent">Gönderildi</option>
                        <option value="paid">Ödendi</option>
                        <option value="partial">Kısmi</option>
                        <option value="cancelled">İptal</option>
                    </select>
                    <button onClick={() => setDateSort(d => d === 'desc' ? 'asc' : 'desc')}
                        className="h-7 text-xs border border-slate-200 rounded px-2 bg-white text-slate-600 flex items-center gap-1 hover:border-blue-400">
                        Vade Tarihi {dateSort === 'desc' ? '↓' : '↑'}
                    </button>
                    <div className="relative">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)}
                            placeholder="Fatura ara..."
                            className="h-7 pl-6 pr-2 text-xs border border-slate-200 rounded w-44 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </div>
                    <div className="flex-1" />
                    <Link href="/accounting/sales/new"
                        className="h-7 px-3 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1.5 transition-colors">
                        <Plus size={12} /> Fatura Oluştur
                    </Link>
                </div>

                {/* Column header */}
                <div className="bg-white border-b border-slate-200 shrink-0">
                    <div className="grid text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-3 py-1.5"
                        style={{ gridTemplateColumns: '1fr 120px 90px 90px 90px 90px 28px' }}>
                        <span>AÇIKLAMA</span>
                        <span>CARİ</span>
                        <span className="text-right">FATURA BEDELİ</span>
                        <span className="text-right">KALAN TUTAR</span>
                        <span className="text-center">DURUM</span>
                        <span className="text-right">VADE</span>
                    </div>
                </div>

                {/* Rows */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Yükleniyor...</div>
                    ) : filtInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                            <FileText size={32} className="text-slate-200" />
                            <p className="text-sm">Satış faturası bulunamadı</p>
                            <Link href="/accounting/sales/new" className="text-xs text-blue-600 hover:underline">+ Fatura Oluştur</Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtInvoices.map(inv => (
                                <div key={inv.id}
                                    onClick={() => openDetail(inv)}
                                    onContextMenu={e => handleContextMenu(e, inv)}
                                    className="group grid items-center px-3 py-2 hover:bg-blue-50/40 cursor-pointer transition-colors"
                                    style={{ gridTemplateColumns: '1fr 120px 90px 90px 90px 90px 28px' }}>
                                    <div>
                                        <p className="text-xs font-medium text-slate-700">{inv.description || inv.invoice_no || `#${inv.id}`}</p>
                                        <p className="text-[10px] text-slate-400">{inv.invoice_no}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{inv.account?.name || '—'}</p>
                                    <p className="text-xs font-mono text-right text-slate-700">{fmtMoney(inv.total)}</p>
                                    <p className={`text-xs font-mono text-right font-semibold ${inv.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {fmtMoney(inv.remaining)}
                                    </p>
                                    <div className="flex justify-center">
                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_BADGE[inv.status]}`}>
                                            {STATUS_LABEL[inv.status]}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-right text-slate-400">{fmtDate(inv.due_date)}</p>
                                    <button
                                        onClick={e => { e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, invoice: inv }); }}
                                        className="flex items-center justify-center w-6 h-6 rounded hover:bg-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status bar */}
                <div className="bg-white border-t border-slate-200 px-3 py-1 flex items-center gap-4 shrink-0 text-[11px] text-slate-400">
                    <span>{filtInvoices.length} fatura</span>
                    <span className="text-slate-200">|</span>
                    <span>Toplam: <span className="text-slate-600 font-mono">{fmtMoney(totalAmount)}</span></span>
                    <span>Kalan: <span className="text-red-500 font-mono">{fmtMoney(totalRemaining)}</span></span>
                    <span className="ml-auto text-[10px]">Çift tıkla = Detay · Esc = Kapat</span>
                </div>
            </div>

            <InvoiceDetailModal
                invoice={selectedInvoice}
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                onUpdated={inv => { upsertInvoice(inv); setSelectedInvoice(inv); }}
            />

            {ctxMenu && (
                <ContextMenu
                    menu={ctxMenu}
                    onClose={() => setCtxMenu(null)}
                    onDetail={openDetail}
                    onPdf={handlePdf}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
