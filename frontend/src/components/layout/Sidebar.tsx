import Link from "next/link";
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
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight">
          <img src="/logo.png" alt="BelconCORE" className="h-8 w-auto hidden dark:block" />
          <img src="/logo.png" alt="BelconCORE" className="h-8 w-auto dark:hidden" />
          <div className="flex">
            <span className="text-foreground">BELCON</span>
            <span className="text-primary">CORE</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" href="/" />
        <SidebarItem icon={<Building2 size={20} />} label="Projeler" href="/projects" />
        <SidebarItem icon={<Users size={20} />} label="CRM & Satış" href="/crm" />
        <SidebarItem icon={<FileText size={20} />} label="Teklifler" href="/offers" />
        <SidebarItem icon={<WalletCards size={20} />} label="Ön Muhasebe" href="/accounting" />
        <SidebarItem icon={<Warehouse size={20} />} label="Stok & Maliyet" href="/inventory" />
        <SidebarItem icon={<HardHat size={20} />} label="Şantiye İlerleme" href="/site-progress" />
        <SidebarItem icon={<PieChart size={20} />} label="Raporlar" href="/reports" />
      </nav>

      <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground text-center">
        &copy; {new Date().getFullYear()} Belcon Construction
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
