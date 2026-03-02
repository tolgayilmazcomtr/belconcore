'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Users, ShoppingCart, ShoppingBag, Landmark, BarChart2,
    ChevronRight, Receipt, TrendingUp, TrendingDown,
    FileBarChart, FileCheck, Calendar, Wallet
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface NavGroup {
    title?: string;
    items: NavItem[];
}

const NAV: NavGroup[] = [
    {
        items: [
            { label: 'Genel Bakış', href: '/accounting', icon: <BarChart2 size={15} /> },
        ]
    },
    {
        title: 'ÖN MUHASEBE',
        items: [
            { label: 'Cariler', href: '/accounting/accounts', icon: <Users size={15} /> },
            { label: 'Satışlar', href: '/accounting/sales', icon: <TrendingUp size={15} /> },
            { label: 'Alışlar', href: '/accounting/purchases', icon: <TrendingDown size={15} /> },
        ]
    },
    {
        title: 'FİNANS',
        items: [
            { label: 'Kasa ve Bankalar', href: '/accounting/finance', icon: <Landmark size={15} /> },
            { label: 'Çek ve Senetler', href: '/accounting/checks', icon: <FileCheck size={15} /> },
        ]
    },
    {
        title: 'RAPORLAR',
        items: [
            { label: 'Gün Sonu', href: '/accounting/reports/daily', icon: <Calendar size={15} /> },
            { label: 'Kasa Hareketleri', href: '/accounting/reports/cashflow', icon: <Wallet size={15} /> },
            { label: 'Alacak Raporu', href: '/accounting/reports/receivable', icon: <FileBarChart size={15} /> },
            { label: 'Borç Raporu', href: '/accounting/reports/payable', icon: <FileBarChart size={15} /> },
            { label: 'Satış Raporu', href: '/accounting/reports/sales', icon: <ShoppingCart size={15} /> },
            { label: 'Alış Raporu', href: '/accounting/reports/purchases', icon: <ShoppingBag size={15} /> },
            { label: 'KDV Raporu', href: '/accounting/reports/vat', icon: <Receipt size={15} /> },
        ]
    },
];

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex h-full">
            {/* Left nav — SAP/Odoo style */}
            <aside className="w-[195px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
                <div className="px-3 py-3 border-b border-slate-100">
                    <h2 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">Muhasebe</h2>
                </div>
                <nav className="flex-1 py-2">
                    {NAV.map((group, gi) => (
                        <div key={gi} className="mb-1">
                            {group.title && (
                                <div className="px-3 pt-3 pb-1">
                                    <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                                        {group.title}
                                    </span>
                                </div>
                            )}
                            {group.items.map(item => {
                                const isActive = item.href === '/accounting'
                                    ? pathname === '/accounting'
                                    : pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`
                                            flex items-center gap-2 px-3 py-[6px] mx-1 rounded text-[13px] transition-colors
                                            ${isActive
                                                ? 'bg-blue-50 text-blue-700 font-medium'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                            }
                                        `}
                                    >
                                        <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                                            {item.icon}
                                        </span>
                                        <span className="truncate">{item.label}</span>
                                        {isActive && <ChevronRight size={12} className="ml-auto text-blue-400" />}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-hidden flex flex-col bg-[#f0f2f5]">
                {children}
            </main>
        </div>
    );
}
