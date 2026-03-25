'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

// ─── All navigable pages with shortcuts ──────────────────────────────────────
export interface CommandItem {
    label: string;
    href: string;
    section: string;
    shortcut?: string[]; // e.g. ['G', 'C']
    keywords?: string;
}

export const COMMANDS: CommandItem[] = [
    // Dashboard
    { label: 'Dashboard', href: '/', section: 'GENEL', shortcut: ['G', 'D'], keywords: 'ana sayfa' },

    // Proje Yönetimi
    { label: 'Tüm Projeler', href: '/projects', section: 'PROJE YÖNETİMİ', shortcut: ['G', 'P'], keywords: 'proje' },
    { label: 'Bloklar / Binalar', href: '/blocks', section: 'PROJE YÖNETİMİ', shortcut: ['G', 'B'], keywords: 'blok bina' },
    { label: 'Üniteler / Daireler', href: '/units', section: 'PROJE YÖNETİMİ', shortcut: ['G', 'U'], keywords: 'ünite daire' },

    // CRM
    { label: 'Müşteriler', href: '/customers', section: 'CRM & SATIŞ', shortcut: ['G', 'M'], keywords: 'müşteri crm' },
    { label: 'Fırsatlar', href: '/crm', section: 'CRM & SATIŞ', shortcut: ['G', 'F'], keywords: 'fırsat lead kanban' },
    { label: 'Teklifler', href: '/offers', section: 'CRM & SATIŞ', shortcut: ['G', 'T'], keywords: 'teklif offer' },

    // Accounting
    { label: 'Genel Bakış', href: '/accounting', section: 'ÖN MUHASEBE', shortcut: ['G', 'G'], keywords: 'muhasebe genel bakış' },
    { label: 'Cariler', href: '/accounting/accounts', section: 'ÖN MUHASEBE', shortcut: ['G', 'C'], keywords: 'cari hesap müşteri tedarikçi' },
    { label: 'Satışlar', href: '/accounting/sales', section: 'FATURALAR', shortcut: ['G', 'S'], keywords: 'satış fatura' },
    { label: 'Alışlar', href: '/accounting/purchases', section: 'FATURALAR', shortcut: ['G', 'A'], keywords: 'alış fatura tedarikçi' },
    { label: 'Kasa ve Bankalar', href: '/accounting/finance', section: 'FİNANS', shortcut: ['G', 'K'], keywords: 'kasa banka nakit' },
    { label: 'Maliyet Takip', href: '/accounting/costs', section: 'FİNANS', shortcut: ['G', 'M'], keywords: 'maliyet imalat inşaat bütçe' },
    { label: 'Gün Sonu Raporu', href: '/accounting/reports/daily', section: 'RAPORLAR', shortcut: ['G', 'R'], keywords: 'gün sonu rapor' },
    { label: 'KDV Raporu', href: '/accounting/reports/vat', section: 'RAPORLAR', keywords: 'kdv vergi' },
    { label: 'Alacak Raporu', href: '/accounting/reports/receivable', section: 'RAPORLAR', keywords: 'alacak' },
    { label: 'Borç Raporu', href: '/accounting/reports/payable', section: 'RAPORLAR', keywords: 'borç' },

    // Other
    { label: 'Stok & Maliyet', href: '/inventory', section: 'DİĞER', shortcut: ['G', 'I'], keywords: 'stok depo envanter' },
    { label: 'Şantiye İlerleme', href: '/site-progress', section: 'DİĞER', shortcut: ['G', 'X'], keywords: 'şantiye inşaat ilerleme' },
    { label: 'Raporlar', href: '/reports', section: 'DİĞER', keywords: 'rapor' },
    { label: 'Sistem Ayarları', href: '/settings', section: 'DİĞER', shortcut: ['G', 'Y'], keywords: 'ayar sistem' },
    { label: 'Şablon Editörü', href: '/settings/templates', section: 'DİĞER', keywords: 'şablon template' },
];

// ─── Shortcut badge ───────────────────────────────────────────────────────────
function ShortcutBadge({ keys }: { keys: string[] }) {
    return (
        <div className="flex items-center gap-0.5 shrink-0">
            {keys.map((k, i) => (
                <kbd key={i}
                    className="inline-flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-slate-100 text-[10px] font-semibold text-slate-500 font-mono">
                    {k}
                </kbd>
            ))}
        </div>
    );
}

// ─── Command Palette ──────────────────────────────────────────────────────────
interface Props {
    open: boolean;
    onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter
    const filtered = useMemo(() => {
        if (!query.trim()) return COMMANDS;
        const q = query.toLowerCase();
        return COMMANDS.filter(c =>
            c.label.toLowerCase().includes(q) ||
            c.section.toLowerCase().includes(q) ||
            (c.keywords || '').toLowerCase().includes(q) ||
            (c.href || '').toLowerCase().includes(q)
        );
    }, [query]);

    // Group by section
    const grouped = useMemo(() => {
        const map = new Map<string, CommandItem[]>();
        filtered.forEach(c => {
            if (!map.has(c.section)) map.set(c.section, []);
            map.get(c.section)!.push(c);
        });
        return map;
    }, [filtered]);

    // Flat list for keyboard arrow nav
    const flat = useMemo(() => filtered, [filtered]);

    useEffect(() => {
        setActiveIdx(0);
        setQuery('');
    }, [open]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 60);
    }, [open]);

    const navigate = useCallback((href: string) => {
        router.push(href);
        onClose();
    }, [router, onClose]);

    const handleKey = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { onClose(); return; }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, flat.length - 1));
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, 0));
        }
        if (e.key === 'Enter' && flat[activeIdx]) {
            navigate(flat[activeIdx].href);
        }
    }, [flat, activeIdx, navigate, onClose]);

    // Scroll active into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIdx]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] bg-black/40 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-[560px] mx-4 bg-white rounded-2xl shadow-2xl border-2 border-blue-400 overflow-hidden"
                onKeyDown={handleKey}>
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                    <Search size={18} className="text-slate-400 shrink-0" />
                    <input ref={inputRef}
                        value={query}
                        onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
                        placeholder="Yapmak istediğiniz işlemi yazabilirsiniz."
                        className="flex-1 text-[15px] text-slate-700 placeholder:text-slate-400 outline-none bg-transparent" />
                    <kbd className="px-2 py-0.5 text-[11px] font-semibold border border-slate-300 rounded text-slate-500">ESC</kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[420px] overflow-y-auto py-1">
                    {grouped.size === 0 && (
                        <p className="px-4 py-6 text-sm text-slate-400 text-center">Sonuç bulunamadı</p>
                    )}
                    {Array.from(grouped.entries()).map(([section, items]) => (
                        <div key={section}>
                            <p className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                {section}
                            </p>
                            {items.map(item => {
                                const idx = flat.indexOf(item);
                                const isActive = idx === activeIdx;
                                return (
                                    <button key={item.href}
                                        data-idx={idx}
                                        onClick={() => navigate(item.href)}
                                        onMouseEnter={() => setActiveIdx(idx)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13.5px] transition-colors text-left
                                            ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                                        <span className={`flex-1 font-medium ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {item.label}
                                        </span>
                                        {item.shortcut && <ShortcutBadge keys={item.shortcut} />}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <kbd className="px-1 py-0.5 border border-slate-300 rounded text-[10px]">↑</kbd>
                        <kbd className="px-1 py-0.5 border border-slate-300 rounded text-[10px]">↓</kbd>
                        <span>yönlendirin</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <kbd className="px-1 py-0.5 border border-slate-300 rounded text-[10px]">↵</kbd>
                        <span>açın</span>
                    </div>
                    <div className="ml-auto text-[10px] text-slate-400">G+harf = direkt git</div>
                </div>
            </div>
        </div>
    );
}
