"use client"

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  WalletCards,
  Warehouse,
  HardHat,
  PieChart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building,
  Home
} from "lucide-react";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  if (pathname === "/login") {
    return null; // Hide Sidebar on login page
  }

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

        <SidebarExpandableItem
          icon={<Building2 size={20} className="shrink-0" />}
          label="Proje Yönetimi"
          collapsed={collapsed}
          activePaths={["/projects", "/blocks", "/units"]}
        >
          <SidebarSubItem icon={<Building2 size={16} />} label="Tüm Projeler" href="/projects" collapsed={collapsed} />
          <SidebarSubItem icon={<Building size={16} />} label="Bloklar / Binalar" href="/blocks" collapsed={collapsed} />
          <SidebarSubItem icon={<Home size={16} />} label="Üniteler / Daireler" href="/units" collapsed={collapsed} />
        </SidebarExpandableItem>

        <SidebarExpandableItem
          icon={<Users size={20} className="shrink-0" />}
          label="CRM & Satış"
          collapsed={collapsed}
          activePaths={["/customers", "/crm"]}
        >
          <SidebarSubItem icon={<Users size={16} />} label="Müşteriler" href="/customers" collapsed={collapsed} />
          <SidebarSubItem icon={<PieChart size={16} />} label="Fırsatlar" href="/crm" collapsed={collapsed} />
        </SidebarExpandableItem>
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
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-md text-sidebar-foreground transition-colors ${collapsed ? 'justify-center p-2' : 'px-3 py-2'} ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-slate-200 hover:text-primary'}`}
    >
      {icon}
      {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
    </Link>
  );
}

function SidebarExpandableItem({ icon, label, collapsed, children, activePaths }: { icon: React.ReactNode; label: string; collapsed: boolean, children: React.ReactNode, activePaths: string[] }) {
  const pathname = usePathname();
  const isActiveGroup = activePaths.some(path => pathname.startsWith(path));
  const [isOpen, setIsOpen] = useState(isActiveGroup);

  // If collapsed, always force close visually or handle hover menu (for now we keep it simple)
  // Auto-open if active path is inside
  useEffect(() => {
    if (isActiveGroup && !collapsed) {
      setIsOpen(true);
    }
  }, [isActiveGroup, collapsed]);

  return (
    <div className="flex flex-col space-y-1">
      <button
        onClick={() => !collapsed && setIsOpen(!isOpen)}
        title={collapsed ? label : undefined}
        className={`flex items-center justify-between w-full rounded-md text-sidebar-foreground transition-colors ${collapsed ? 'justify-center p-2' : 'px-3 py-2'} ${isOpen && !collapsed ? 'bg-slate-100' : 'hover:bg-slate-200 hover:text-primary'} ${isActiveGroup && collapsed ? 'bg-primary/10 text-primary' : ''}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
        </div>
        {!collapsed && (
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        )}
      </button>

      {/* Children Container */}
      {!collapsed && isOpen && (
        <div className="flex flex-col pl-9 pr-2 py-1 space-y-1 bg-slate-50/50 rounded-b-md border-l-2 border-primary/20 ml-2">
          {children}
        </div>
      )}
    </div>
  );
}

function SidebarSubItem({ icon, label, href, collapsed }: { icon: React.ReactNode; label: string; href: string; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (collapsed) return null; // Don't show sub-items when collapsed

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:text-primary hover:bg-slate-100'}`}
    >
      <span className="opacity-70">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
