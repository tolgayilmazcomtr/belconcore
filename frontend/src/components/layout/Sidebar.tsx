"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, FileText, WalletCards,
  Warehouse, HardHat, PieChart, Settings2, LayoutTemplate,
  Building, Home, ChevronDown, TrendingUp, TrendingDown,
  Landmark, FileCheck, BarChart2, Calendar, Wallet,
  FileBarChart, Receipt, ShoppingCart, ShoppingBag,
  Menu, X, ChevronRight, Search, Box, Hammer
} from "lucide-react";
import { CommandPalette, COMMANDS } from "./CommandPalette";
import { useAuthStore } from "@/store/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavChild {
  label: string;
  href: string;
  icon?: React.ReactNode;
  exact?: boolean;
}
interface NavSection {
  kind: "section";
  label: string;
  items: NavChild[];
}
interface NavEntry {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
  module?: string; // e.g. 'module.crm'
  children?: (NavChild | NavSection)[];
}

function isNavSection(item: NavChild | NavSection): item is NavSection {
  return (item as NavSection).kind === "section";
}

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV: NavEntry[] = [
  { label: "Dashboard", href: "/", icon: <LayoutDashboard size={17} />, exact: true, module: "module.dashboard" },
  {
    label: "Proje Yönetimi", href: "/projects", icon: <Building2 size={17} />, module: "module.projects",
    children: [
      { label: "Tüm Projeler", href: "/projects", icon: <Building2 size={13} /> },
      { label: "Bloklar / Binalar", href: "/blocks", icon: <Building size={13} /> },
      { label: "Üniteler / Daireler", href: "/units", icon: <Home size={13} /> },
      { label: "3D Satış Ekranı", href: "/3d-sale", icon: <Box size={13} /> },
    ],
  },
  {
    label: "CRM & Satış", href: "/crm", icon: <Users size={17} />, module: "module.crm",
    children: [
      { label: "Müşteriler", href: "/customers", icon: <Users size={13} /> },
      { label: "Fırsatlar", href: "/crm", exact: true, icon: <PieChart size={13} /> },
      { label: "Teklifler", href: "/offers", icon: <FileText size={13} /> },
    ],
  },
  {
    label: "Ön Muhasebe", href: "/accounting", icon: <WalletCards size={17} />, module: "module.accounting",
    children: [
      { label: "Genel Bakış", href: "/accounting", exact: true, icon: <BarChart2 size={13} /> },
      {
        kind: "section", label: "ÖN MUHASEBE",
        items: [
          { label: "Cariler", href: "/accounting/accounts", icon: <Users size={13} /> },
          { label: "Satışlar", href: "/accounting/sales", icon: <TrendingUp size={13} /> },
          { label: "Alışlar", href: "/accounting/purchases", icon: <TrendingDown size={13} /> },
        ],
      },
      {
        kind: "section", label: "FİNANS",
        items: [
          { label: "Kasa ve Bankalar", href: "/accounting/finance", icon: <Landmark size={13} /> },
          { label: "Sözleşmeler", href: "/accounting/contracts", icon: <FileCheck size={13} /> },
          { label: "Çek & Senetler", href: "/accounting/checks", icon: <Receipt size={13} /> },
          { label: "Maliyet Takip", href: "/accounting/costs", icon: <Hammer size={13} /> },
        ],
      },
      {
        kind: "section", label: "RAPORLAR",
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
  { label: "Stok & Maliyet", href: "/inventory", icon: <Warehouse size={17} />, module: "module.stock" },
  { label: "Şantiye İlerleme", href: "/site-progress", icon: <HardHat size={17} />, module: "module.site" },
  { label: "Raporlar", href: "/reports", icon: <PieChart size={17} />, module: "module.reports" },
  {
    label: "Sistem Ayarları", href: "/settings", icon: <Settings2 size={17} />, module: "module.settings",
    children: [
      { label: "Şablon Editörü", href: "/settings/templates", icon: <LayoutTemplate size={13} /> },
    ],
  },
];

// ─── Sub-link ─────────────────────────────────────────────────────────────────
function SubLink({ href, label, icon, exact }: NavChild) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : (pathname === href || (pathname.startsWith(href + "/") && href !== "/"));
  return (
    <Link href={href}
      className={`flex items-center gap-2 px-2 py-[5px] rounded text-[12.5px] transition-colors
                ${isActive ? "bg-[#e8edf5] text-[#1a56db] font-semibold" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}>
      {icon && <span className={isActive ? "text-[#1a56db]" : "text-slate-400"}>{icon}</span>}
      <span className="truncate">{label}</span>
    </Link>
  );
}

// ─── Collapsed flyout (shown on hover when sidebar is collapsed) ───────────────
function CollapsedFlyout({ entry, collapsed }: { entry: NavEntry; collapsed: boolean }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => { if (timerRef.current) clearTimeout(timerRef.current); setVisible(true); };
  const hide = () => { timerRef.current = setTimeout(() => setVisible(false), 120); };

  if (!collapsed || !entry.children) return null;

  return (
    <div
      className="absolute left-full top-0 z-50 ml-2"
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{ display: visible ? "block" : "none" }}
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 py-2 min-w-[200px]">
        <p className="px-3 pt-1 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-100 mb-1">
          {entry.label}
        </p>
        <div className="px-2 space-y-0.5">
          {entry.children.map((child, i) => {
            if (isNavSection(child)) {
              return (
                <div key={i}>
                  <p className="px-2 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">{child.label}</p>
                  {child.items.map(item => <SubLink key={item.href} {...item} />)}
                </div>
              );
            }
            return <SubLink key={i} {...child} />;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Expanded NavItem ─────────────────────────────────────────────────────────
function NavItemRow({ entry, collapsed }: { entry: NavEntry; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = entry.exact ? pathname === entry.href : (pathname.startsWith(entry.href) && entry.href !== "/");
  const hasChildren = !!(entry.children?.length);
  const [open, setOpen] = useState(isActive);
  const rowRef = useRef<HTMLDivElement>(null);
  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const flyoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (isActive && !collapsed) setOpen(true); }, [isActive, collapsed]);
  useEffect(() => { if (collapsed) setOpen(false); }, [collapsed]);

  const showFlyout = () => {
    if (!collapsed || !hasChildren) return;
    if (flyoutTimer.current) clearTimeout(flyoutTimer.current);
    setFlyoutVisible(true);
  };
  const hideFlyout = () => {
    flyoutTimer.current = setTimeout(() => setFlyoutVisible(false), 150);
  };

  if (!hasChildren) {
    const isExactActive = entry.exact ? pathname === entry.href : pathname === entry.href;
    return (
      <Link href={entry.href} title={collapsed ? entry.label : undefined}
        className={`flex items-center gap-2.5 rounded-lg transition-colors
                    ${collapsed ? "justify-center p-2.5" : "px-3 py-2"}
                    ${isExactActive || isActive
            ? "bg-[#eef2fb] text-[#1a56db]"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"}`}>
        <span className={isActive ? "text-[#1a56db]" : "text-slate-400 shrink-0"}>{entry.icon}</span>
        {!collapsed && <span className="text-[13px] font-medium">{entry.label}</span>}
      </Link>
    );
  }

  return (
    <div ref={rowRef} className="relative" onMouseEnter={showFlyout} onMouseLeave={hideFlyout}>
      <button
        onClick={() => { if (!collapsed) setOpen(o => !o); }}
        title={collapsed ? entry.label : undefined}
        className={`w-full flex items-center gap-2.5 rounded-lg transition-colors
                    ${collapsed ? "justify-center p-2.5" : "px-3 py-2"}
                    ${isActive
            ? (open && !collapsed ? "bg-slate-100 text-slate-700" : "bg-[#eef2fb] text-[#1a56db]")
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"}`}>
        <span className={isActive ? "text-[#1a56db] shrink-0" : "text-slate-400 shrink-0"}>{entry.icon}</span>
        {!collapsed && (
          <>
            <span className="text-[13px] font-medium flex-1 text-left">{entry.label}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </>
        )}
        {collapsed && isActive && (
          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#1a56db] rounded-full" />
        )}
      </button>

      {/* Expanded children */}
      {!collapsed && open && (
        <div className="mt-0.5 ml-2.5 pl-3 border-l border-slate-200 space-y-0.5 py-0.5">
          {entry.children!.map((child, ci) => {
            if (isNavSection(child)) {
              return (
                <div key={ci} className="pt-2">
                  <p className="px-2 pb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    {child.label}
                  </p>
                  <div className="space-y-0.5">
                    {child.items.map(item => <SubLink key={item.href} {...item} />)}
                  </div>
                </div>
              );
            }
            return <SubLink key={ci} {...child} />;
          })}
        </div>
      )}

      {/* Collapsed hover flyout */}
      {collapsed && flyoutVisible && (
        <div className="absolute left-full top-0 z-50 ml-2"
          onMouseEnter={showFlyout} onMouseLeave={hideFlyout}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 py-2 min-w-[210px]">
            <p className="px-3 pt-1 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-100 mb-1">
              {entry.label}
            </p>
            <div className="px-2 space-y-0.5 max-h-[70vh] overflow-y-auto">
              {entry.children!.map((child, ci) => {
                if (isNavSection(child)) {
                  return (
                    <div key={ci}>
                      <p className="px-2 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">{child.label}</p>
                      {child.items.map(item => <SubLink key={item.href} {...item} />)}
                    </div>
                  );
                }
                return <SubLink key={ci} {...child} />;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Global Keyboard Shortcuts ────────────────────────────────────────────────
function useKeyboardShortcuts(onOpenPalette: () => void) {
  const router = useRouter();
  const gPressed = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable;
      if (inInput) return;

      // Ctrl+K or Cmd+K → open palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      // G prefix shortcuts
      if (e.key === 'g' || e.key === 'G') {
        gPressed.current = true;
        if (gTimer.current) clearTimeout(gTimer.current);
        gTimer.current = setTimeout(() => { gPressed.current = false; }, 1500);
        return;
      }

      if (gPressed.current) {
        gPressed.current = false;
        if (gTimer.current) clearTimeout(gTimer.current);
        const key = e.key.toUpperCase();
        const cmd = COMMANDS.find(c => c.shortcut && c.shortcut[0] === 'G' && c.shortcut[1] === key);
        if (cmd) {
          e.preventDefault();
          router.push(cmd.href);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router, onOpenPalette]);
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const user = useAuthStore(s => s.user);

  const isAdmin = user?.roles?.some(r => r.name === 'Admin') ?? false;
  const visibleNav = NAV.filter(entry => {
    if (!entry.module) return true; // always show entries without module requirement
    if (isAdmin) return true;
    return user?.modules?.includes(entry.module) ?? false;
  });

  useKeyboardShortcuts(() => setPaletteOpen(true));

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Topbar'daki hamburger butonu 'toggle-mobile-sidebar' event'i gönderiyor
  useEffect(() => {
    const handler = () => setMobileOpen(o => !o);
    window.addEventListener('toggle-mobile-sidebar', handler);
    return () => window.removeEventListener('toggle-mobile-sidebar', handler);
  }, []);

  if (pathname === "/login") return null;

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo + collapse toggle */}
      <div className={`h-12 flex items-center border-b border-slate-200 shrink-0 ${collapsed && !isMobile ? "justify-center px-2" : "px-4"}`}>
        {!collapsed || isMobile ? (
          <Link href="/" className="flex-1">
            <img src="/logo.png" alt="BelconCORE" className="h-7 max-w-[140px] object-contain" />
          </Link>
        ) : (
          <Link href="/">
            <img src="/favicon.png" alt="B" className="h-7 w-7 object-contain" />
          </Link>
        )}
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        ) : (
          <button onClick={() => setCollapsed(c => !c)}
            className={`${collapsed ? "" : "ml-auto"} p-1 text-slate-400 hover:text-slate-600 transition-colors`}
            title={collapsed ? "Genişlet" : "Daralt"}>
            <ChevronRight size={16} className={`transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`} />
          </button>
        )}
      </div>

      {/* Search / Command palette trigger */}
      {!collapsed || isMobile ? (
        <button onClick={() => setPaletteOpen(true)}
          className="mx-3 mt-2 mb-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-[12px] hover:border-blue-300 hover:text-slate-600 transition-colors">
          <Search size={13} />
          <span className="flex-1 text-left">Ara... </span>
          <kbd className="text-[10px] border border-slate-300 rounded px-1">⌘K</kbd>
        </button>
      ) : (
        <button onClick={() => setPaletteOpen(true)}
          className="mx-auto mt-2 mb-1 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Ara (⌘K)">
          <Search size={15} />
        </button>
      )}

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-2 space-y-0.5 ${collapsed && !isMobile ? "px-1.5" : "px-2"}`}>
        {visibleNav.map((entry, i) => (
          <NavItemRow key={i} entry={entry} collapsed={collapsed && !isMobile} />
        ))}
      </nav>

      {/* Footer */}
      {(!collapsed || isMobile) && (
        <div className="border-t border-slate-200 px-4 py-2 shrink-0">
          <p className="text-[10px] text-slate-400 text-center">&copy; {new Date().getFullYear()} Belcon</p>
        </div>
      )}
    </div>
  );

  return (
    <>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed top-0 left-0 h-full z-50 w-72 bg-white shadow-2xl border-r border-slate-200 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col shrink-0 bg-white border-r border-slate-200 h-full transition-all duration-300 ${collapsed ? "w-[54px]" : "w-[230px]"}`}>
        {sidebarContent(false)}
      </aside>

      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
