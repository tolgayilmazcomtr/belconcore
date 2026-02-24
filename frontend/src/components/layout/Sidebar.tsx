"use client"

import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Calculator,
  WalletCards,
  Warehouse,
  HardHat,
  PieChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-[#f8f9fa] border-r border-border min-h-screen flex flex-col transition-all duration-300 relative group`}>
      <div className="h-14 flex items-center justify-center border-b border-border bg-white px-2 overflow-hidden shrink-0">
        <Link href="/" className="flex items-center justify-center w-full">
          {collapsed ? (
            <img src="/favicon.png" alt="B" className="h-8 max-w-[32px] object-contain transition-all" />
          ) : (
            <img src="/logo.png" alt="BelconCORE" className="h-8 max-w-[150px] object-contain transition-all" />
          )}
        </Link>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 bg-white border border-border rounded-full p-1 text-slate-500 hover:text-primary hover:border-primary shadow-sm z-10 transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2 py-4 space-y-2' : 'px-3 py-4 space-y-1'}`}>
        <SidebarItem icon={<LayoutDashboard size={20} className="shrink-0" />} label="Dashboard" href="/" collapsed={collapsed} />
        <SidebarItem icon={<Building2 size={20} className="shrink-0" />} label="Projeler" href="/projects" collapsed={collapsed} />
        <SidebarItem icon={<Users size={20} className="shrink-0" />} label="CRM & Satış" href="/crm" collapsed={collapsed} />
        <SidebarItem icon={<FileText size={20} className="shrink-0" />} label="Teklifler" href="/offers" collapsed={collapsed} />
        <SidebarItem icon={<WalletCards size={20} className="shrink-0" />} label="Ön Muhasebe" href="/accounting" collapsed={collapsed} />
        <SidebarItem icon={<Warehouse size={20} className="shrink-0" />} label="Stok & Maliyet" href="/inventory" collapsed={collapsed} />
        <SidebarItem icon={<HardHat size={20} className="shrink-0" />} label="Şantiye İlerleme" href="/site-progress" collapsed={collapsed} />
        <SidebarItem icon={<PieChart size={20} className="shrink-0" />} label="Raporlar" href="/reports" collapsed={collapsed} />
      </nav>

      <div className={`p-4 border-t border-sidebar-border text-xs text-muted-foreground whitespace-nowrap overflow-hidden transition-all ${collapsed ? 'text-center opacity-0 h-0 hidden' : 'text-center opacity-100'}`}>
        &copy; {new Date().getFullYear()} Belcon
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, href, collapsed }: { icon: React.ReactNode; label: string; href: string; collapsed: boolean }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-md text-sidebar-foreground hover:bg-slate-200 hover:text-primary transition-colors ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}`}
    >
      {icon}
      {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
    </Link>
  );
}
