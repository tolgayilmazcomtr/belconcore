"use client";

import { Bell, Search, UserCircle, Settings, LogOut } from "lucide-react";
import { ProjectSelector } from "./ProjectSelector";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";

export function Topbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    if (pathname === "/login") {
        return null; // Hide Topbar on login page
    }

    const handleLogout = async () => {
        try {
            await api.post("/logout");
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            logout();
            router.push("/login");
        }
    };

    return (
        <header className="h-[52px] flex items-center justify-between px-4 bg-primary text-white shadow-sm shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-white/10 rounded px-2.5 py-1.5 w-64 md:w-96 border border-white/20 focus-within:bg-white/20 transition-colors">
                    <Search size={16} className="text-white/90 mr-2" />
                    <input
                        type="text"
                        placeholder="Modül veya Müşteri Ara..."
                        className="bg-transparent border-none outline-none w-full text-[13px] placeholder:text-white/90 text-white"
                    />
                </div>

                <div className="hidden md:block border-l border-white/20 h-6"></div>
                <ProjectSelector />
            </div>

            <div className="flex items-center gap-2">
                <button className="relative p-1.5 rounded hover:bg-white/20 transition-colors">
                    <Bell size={18} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-primary"></span>
                </button>
                <button className="p-1.5 rounded hover:bg-white/20 transition-colors">
                    <Settings size={18} />
                </button>

                <div className="flex items-center gap-2 cursor-pointer hover:bg-white/20 p-1 pl-2 pr-3 rounded transition-colors ml-2 border-l border-white/10 relative group">
                    <UserCircle size={26} className="text-white/80" />
                    <div className="flex flex-col">
                        <span className="text-[13px] font-medium leading-none">{user?.name || "Kullanıcı"}</span>
                        <span className="text-[11px] text-white/70 leading-none mt-1">Sistem Yöneticisi</span>
                    </div>

                    {/* Simple Logout Dropdown */}
                    <div className="absolute top-[100%] right-0 mt-2 bg-white text-foreground rounded-md shadow-lg border border-border w-48 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-sm hover:bg-zinc-100 transition-colors text-red-600 rounded-md"
                        >
                            <LogOut size={16} className="mr-2" />
                            Sistemden Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
