import { Bell, Search, UserCircle } from "lucide-react";

export function Topbar() {
    return (
        <header className="h-16 flex items-center justify-between px-6 bg-background border-b border-border shadow-sm">
            <div className="flex items-center bg-muted/50 rounded-md px-3 py-1.5 w-96 border border-border">
                <Search size={18} className="text-muted-foreground mr-2" />
                <input
                    type="text"
                    placeholder="Modül, Proje veya Müşteri Ara..."
                    className="bg-transparent border-none outline-none w-full text-sm placeholder:text-muted-foreground"
                />
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
                </button>

                <div className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-border">
                    <UserCircle size={32} className="text-muted-foreground" />
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-none">Tolga Yılmaz</span>
                        <span className="text-xs text-muted-foreground leading-none mt-1">Sistem Yöneticisi</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
