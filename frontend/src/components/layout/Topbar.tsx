import { Bell, Search, UserCircle, Settings } from "lucide-react";
import { ProjectSelector } from "./ProjectSelector";

export function Topbar() {
    return (
        <header className="h-[52px] flex items-center justify-between px-4 bg-primary text-white shadow-sm shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-white/10 rounded px-2.5 py-1.5 w-64 md:w-96 border border-white/20 focus-within:bg-white/20 transition-colors">
                    <Search size={16} className="text-white/70 mr-2" />
                    <input
                        type="text"
                        placeholder="Modül veya Müşteri Ara..."
                        className="bg-transparent border-none outline-none w-full text-[13px] placeholder:text-white/70 text-white"
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

                <div className="flex items-center gap-2 cursor-pointer hover:bg-white/20 p-1 pl-2 pr-3 rounded transition-colors ml-2 border-l border-white/10">
                    <UserCircle size={26} className="text-white/80" />
                    <div className="flex flex-col">
                        <span className="text-[13px] font-medium leading-none">Tolga Yılmaz</span>
                        <span className="text-[11px] text-white/70 leading-none mt-1">Sistem Yöneticisi</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
