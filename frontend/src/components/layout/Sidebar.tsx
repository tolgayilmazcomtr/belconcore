"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, FileText, WalletCards,
  Warehouse, HardHat, PieChart, Settings2, LayoutTemplate,
  Building, Home, ChevronDown, TrendingUp, TrendingDown,
  Landmark, FileCheck, BarChart2, Calendar, Wallet,
  FileBarChart, Receipt, ShoppingCart, ShoppingBag,
  Menu, X
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface NavChild {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavSection {
  kind: "section";
  label: string;
  items: NavChild[];
}

interface NavItem {
  kind: "item";
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
  children?: (NavChild | NavSection)[];
}

type NavEntry = NavItem;

// ─── Navigation Config ────────────────────────────────────────────────────────
const NAV: NavEntry[] = [
  {
    kind: "item",
    label: "Dashboard",
    href: "/",
    icon: <LayoutDashboard size={16} />,
    exact: true,
  },
  {
    kind: "item",
    label: "Proje Yönetimi",
    href: "/projects",
    icon: <Building2 size={16} />,
    children: [
      { label: "Tüm Projeler", href: "/projects", icon: <Building2 size={13} /> },
      { label: "Bloklar / Binalar", href: "/blocks", icon: <Building size={13} /> },
      { label: "Üniteler / Daireler", href: "/units", icon: <Home size={13} /> },
    ],
  },
  {
    kind: "item",
    label: "CRM & Satış",
    href: "/crm",
    icon: <Users size={16} />,
    children: [
      { label: "Müşteriler", href: "/customers", icon: <Users size={13} /> },
      { label: "Fırsatlar", href: "/crm", icon: <PieChart size={13} /> },
      { label: "Teklifler", href: "/offers", icon: <FileText size={13} /> },
    ],
  },
  {
    kind: "item",
    label: "Ön Muhasebe",
    href: "/accounting",
    icon: <WalletCards size={16} />,
    children: [
      // Genel
      { label: "Genel Bakış", href: "/accounting", icon: <BarChart2 size={13} /> },
      // Ön Muhasebe section
      {
        kind: "section",
        label: "ÖN MUHASEBE",
        items: [
          { label: "Cariler", href: "/accounting/accounts", icon: <Users size={13} /> },
          { label: "Satışlar", href: "/accounting/sales", icon: <TrendingUp size={13} /> },
          { label: "Alışlar", href: "/accounting/purchases", icon: <TrendingDown size={13} /> },
        ],
      },
      // Finans section
      {
        kind: "section",
        label: "FİNANS",
        items: [
          { label: "Kasa ve Bankalar", href: "/accounting/finance", icon: <Landmark size={13} /> },
          { label: "Çek ve Senetler", href: "/accounting/checks", icon: <FileCheck size={13} /> },
        ],
      },
      // Raporlar section
      {
        kind: "section",
        label: "RAPORLAR",
        items: [
          { label: "Gün Sonu", href: "/accounting/reports/daily", icon: <Calendar size={13} /> },
          { label: "Kasa Hareketleri", href: "/accounting/reports/cashflow", icon: <Wallet size={13} /> },
          { label: "Alacak Raporu", href: "/accounting/reports/receivable", icon: <FileBarChart size={13} /> },
          { label: "Borç Raporu", href: "/accounting/reports/payable", icon: <FileBarChart size={13} /> },
          { label: "Satış Raporu", href: "/accounting/reports/sales", icon: <ShoppingCart size={13} /> },
          { label: "Alış Raporu", href: "/accounting/reports/purchases", icon: <ShoppingBag size={13} /> },
          { label: "KDV Raporu", href: "/accounting/reports/vat", icon: <Receipt size={13} /> },
        ],
      },
    ],
  },
  {
    kind: "item",
    label: "Stok & Maliyet",
    href: "/inventory",
    icon: <Warehouse size={16} />,
  },
  {
    kind: "item",
    label: "Şantiye İlerleme",
    href: "/site-progress",
    icon: <HardHat size={16} />,
  },
  {
    kind: "item",
    label: "Raporlar",
    href: "/reports",
    icon: <PieChart size={16} />,
  },
  {
    kind: "item",
    label: "Sistem Ayarları",
    href: "/settings",
    icon: <Settings2 size={16} />,
    children: [
      { label: "Şablon Editörü", href: "/settings/templates", icon: <LayoutTemplate size={13} /> },
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function isNavSection(item: NavChild | NavSection): item is NavSection {
  return (item as NavSection).kind === "section";
}

function isGroupActive(entry: NavEntry, pathname: string): boolean {
  if (entry.exact) return pathname === entry.href;
  return pathname.startsWith(entry.href) && entry.href !== "/";
}

// ─── Sub-item link ────────────────────────────────────────────────────────────
function SubLink({ href, label, icon }: NavChild) {
  const pathname = usePathname();
  const isActive = href === "/accounting"
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/") && href !== "/";

  return (
    <Link href={href}
      className={`flex items-center gap-2 px-2.5 py-[5px] rounded text-[12.5px] transition-colors
                ${isActive
          ? "bg-[#e8edf5] text-[#1a56db] font-semibold"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        }`}>
      {icon && <span className={isActive ? "text-[#1a56db]" : "text-slate-400"}>{icon}</span>}
      <span className="truncate">{label}</span>
    </Link>
  );
}

// ─── Expandable NavItem ───────────────────────────────────────────────────────
function NavItemRow({ entry }: { entry: NavEntry }) {
  const pathname = usePathname();
  const active = isGroupActive(entry, pathname);
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  const hasChildren = entry.children && entry.children.length > 0;

  if (!hasChildren) {
    const isActive = entry.exact ? pathname === entry.href : pathname === entry.href;
    return (
      <Link href={entry.href}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors
                    ${isActive
            ? "bg-[#eef2fb] text-[#1a56db]"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          }`}>
        <span className={isActive ? "text-[#1a56db]" : "text-slate-400"}>{entry.icon}</span>
        <span>{entry.label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors
                    ${active && !open ? "text-[#1a56db] bg-[#eef2fb]" : open ? "text-slate-700 bg-slate-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"}`}>
        <span className={active ? "text-[#1a56db]" : "text-slate-400"}>{entry.icon}</span>
        <span className="flex-1 text-left">{entry.label}</span>
        <ChevronDown size={14}
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-slate-200 space-y-0.5 py-1">
          {entry.children!.map((child, ci) => {
            if (isNavSection(child)) {
              return (
                <div key={ci} className="pt-2 pb-0.5">
                  <p className="px-2.5 pb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    {child.label}
                  </p>
                  <div className="space-y-0.5">
                    {child.items.map(item => (
                      <SubLink key={item.href} {...item} />
                    ))}
                  </div>
                </div>
              );
            }
            return <SubLink key={ci} {...child} />;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (pathname === "/login") return null;

  const inner = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-12 flex items-center px-4 border-b border-slate-200 shrink-0">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="BelconCORE" className="h-7 max-w-[140px] object-contain" />
        </Link>
        {/* Mobile close */}
        <button onClick={() => setMobileOpen(false)}
          className="ml-auto md:hidden text-slate-400 hover:text-slate-600 p-1">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map((entry, i) => (
          <NavItemRow key={i} entry={entry} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 px-4 py-2.5 shrink-0">
        <p className="text-[11px] text-slate-400 text-center">
          &copy; {new Date().getFullYear()} Belcon
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 bg-white border border-slate-200 rounded-lg p-2 shadow-sm text-slate-600 hover:text-slate-800">
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`
                md:hidden fixed top-0 left-0 h-full z-50 w-72 bg-white shadow-2xl border-r border-slate-200
                transition-transform duration-300
                ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
        {inner}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[230px] shrink-0 bg-white border-r border-slate-200 h-full">
        {inner}
      </aside>
    </>
  );
}
