// Accounting inner layout — inner sidebar removed, main sidebar handles all navigation
export default function AccountingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex-1 overflow-hidden flex flex-col bg-[#f0f2f5] h-full">
            {children}
        </div>
    );
}
