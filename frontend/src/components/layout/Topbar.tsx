"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell, Search, UserCircle, Settings, LogOut, Menu,
  AlertTriangle, Clock, CheckCircle2, ChevronRight, X,
  User, Shield, FileText, ChevronDown,
} from "lucide-react";
import { ProjectSelector } from "./ProjectSelector";
import { CommandPalette } from "./CommandPalette";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverdueInstallment {
  id: number;
  amount: number;
  due_date: string;
  days_until_due: number;
  contract?: { title: string };
}

interface NotifSummary {
  overdue_count: number;
  overdue_amount: number;
  due_in_7_count: number;
  upcoming_installments: OverdueInstallment[];
}

interface CheckReminder {
  id: number;
  document_type: "check" | "note";
  type: "received" | "given";
  counterparty?: string;
  amount: number;
  due_date: string;
  days_until_due: number;
  check_no?: string;
}

// ─── Snooze helpers (localStorage) ───────────────────────────────────────────

const SNOOZE_KEY = "check_snooze";

function getSnoozeMap(): Record<number, string> {
  try { return JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? "{}"); }
  catch { return {}; }
}

function snoozeCheck(id: number, days: number) {
  const map = getSnoozeMap();
  const until = new Date();
  until.setDate(until.getDate() + days);
  map[id] = until.toISOString();
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
}

function isSnoozed(id: number): boolean {
  const map = getSnoozeMap();
  if (!map[id]) return false;
  return new Date(map[id]) > new Date();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency", currency: "TRY", maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

// ─── Snooze Dropdown ──────────────────────────────────────────────────────────

function SnoozeMenu({ onSnooze, onClose }: { onSnooze: (days: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const options = [
    { label: "1 gün sonra", days: 1 },
    { label: "2 gün sonra", days: 2 },
    { label: "1 hafta sonra", days: 7 },
  ];

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[300] py-1 w-36">
      {options.map(o => (
        <button
          key={o.days}
          onClick={() => { onSnooze(o.days); onClose(); }}
          className="w-full px-3 py-1.5 text-xs text-left text-slate-700 hover:bg-slate-50"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────

interface NotifPanelProps {
  onClose: () => void;
  projectId?: number;
}

function NotifPanel({ onClose, projectId }: NotifPanelProps) {
  const router = useRouter();
  const [contractData, setContractData] = useState<NotifSummary | null>(null);
  const [checkReminders, setCheckReminders] = useState<CheckReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [snoozeOpen, setSnoozeOpen] = useState<number | null>(null);
  const [snoozed, setSnoozed] = useState<Set<number>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    const today = new Date().toISOString().slice(0, 10);
    const in20 = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);

    Promise.all([
      api.get("/contracts/summary").catch(() => ({ data: { data: null } })),
      api.get("/checks", { params: { active_project_id: projectId, due_to: in20, status: "pending" } }).catch(() => ({ data: { data: [] } })),
    ]).then(([cRes, chRes]) => {
      setContractData(cRes.data?.data ?? null);
      const checks: CheckReminder[] = (chRes.data?.data ?? []).filter(
        (c: any) => c.days_until_due !== undefined && c.days_until_due <= 20
      );
      setCheckReminders(checks);
      // Build initial snoozed set
      const snoozedIds = new Set<number>(checks.filter(c => isSnoozed(c.id)).map(c => c.id));
      setSnoozed(snoozedIds);
    }).finally(() => setLoading(false));
  }, [projectId]);

  const handleSnooze = (id: number, days: number) => {
    snoozeCheck(id, days);
    setSnoozed(prev => new Set([...prev, id]));
  };

  const visibleChecks = checkReminders.filter(c => !snoozed.has(c.id));
  const contractBadge = contractData ? contractData.overdue_count + contractData.due_in_7_count : 0;
  const totalBadge = contractBadge + visibleChecks.length;

  return (
    <div
      ref={panelRef}
      className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-[200] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-slate-600" />
          <span className="text-sm font-semibold text-slate-800">Bildirimler</span>
          {totalBadge > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
              {totalBadge}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-400 text-center">Yükleniyor...</div>
        ) : !projectId ? (
          <div className="px-4 py-6 text-sm text-slate-400 text-center">Proje seçili değil</div>
        ) : totalBadge === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-slate-400">
            <CheckCircle2 size={28} className="text-emerald-400" />
            <p className="text-sm">Bekleyen bildirim yok</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {/* ── Sözleşme bildirimleri ── */}
            {contractData && contractData.overdue_count > 0 && (
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 p-1.5 bg-red-50 rounded">
                  <AlertTriangle size={14} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {contractData.overdue_count} gecikmiş taksit
                  </p>
                  <p className="text-xs text-red-500 font-medium">{fmt(contractData.overdue_amount)} ödenmemiş</p>
                </div>
              </div>
            )}

            {contractData && contractData.due_in_7_count > 0 && (
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 p-1.5 bg-amber-50 rounded">
                  <Clock size={14} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {contractData.due_in_7_count} taksit 7 günde vadesi dolacak
                  </p>
                  <p className="text-xs text-slate-500">Yaklaşan ödemeler</p>
                </div>
              </div>
            )}

            {contractData?.upcoming_installments.slice(0, 3).map((inst) => {
              const isOverdue = inst.days_until_due < 0;
              return (
                <div key={inst.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOverdue ? "bg-red-400" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 truncate">{inst.contract?.title ?? "Sözleşme"}</p>
                    <p className="text-xs text-slate-500">{fmtDate(inst.due_date)} — {fmt(inst.amount)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold flex-shrink-0 ${isOverdue ? "text-red-500" : "text-amber-600"}`}>
                    {isOverdue ? `${Math.abs(inst.days_until_due)}g geç` : `${inst.days_until_due}g`}
                  </span>
                </div>
              );
            })}

            {/* ── Çek / Senet bildirimleri ── */}
            {visibleChecks.length > 0 && (
              <div className="px-4 py-2 bg-slate-50">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Yaklaşan Çek & Senet ({visibleChecks.length})
                </p>
              </div>
            )}

            {visibleChecks.map((c) => {
              const isOverdue = c.days_until_due < 0;
              const docLabel = c.document_type === "note" ? "Senet" : "Çek";
              const dirLabel = c.type === "received" ? "↙" : "↗";
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="mt-0.5 p-1.5 bg-blue-50 rounded flex-shrink-0">
                    <FileText size={13} className={isOverdue ? "text-red-500" : c.days_until_due <= 7 ? "text-amber-500" : "text-blue-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {dirLabel} {docLabel} — {c.counterparty || `#${c.id}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {fmtDate(c.due_date)} · {fmt(c.amount)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-semibold ${isOverdue ? "text-red-500" : c.days_until_due <= 7 ? "text-amber-600" : "text-slate-500"}`}>
                      {isOverdue ? `${Math.abs(c.days_until_due)}g geç` : c.days_until_due === 0 ? "Bugün" : `${c.days_until_due}g`}
                    </span>
                    {/* Snooze button */}
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSnoozeOpen(snoozeOpen === c.id ? null : c.id); }}
                        className="flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-slate-600 border border-slate-200 rounded px-1.5 py-0.5"
                        title="Ertele"
                      >
                        <Clock size={9} /> Ertele <ChevronDown size={9} />
                      </button>
                      {snoozeOpen === c.id && (
                        <SnoozeMenu
                          onSnooze={(days) => handleSnooze(c.id, days)}
                          onClose={() => setSnoozeOpen(null)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center gap-3">
        <button
          onClick={() => { router.push("/accounting/contracts"); onClose(); }}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Sözleşmeler <ChevronRight size={12} />
        </button>
        <button
          onClick={() => { router.push("/accounting/checks"); onClose(); }}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium"
        >
          Çek & Senet <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────

interface ProfileDropdownProps {
  user: { name: string; email: string; roles?: { name: string }[] } | null;
  onClose: () => void;
  onLogout: () => void;
}

function ProfileDropdown({ user, onClose, onLogout }: ProfileDropdownProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const role = user?.roles?.[0]?.name ?? "Kullanıcı";
  const initials = (user?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function nav(href: string) { router.push(href); onClose(); }

  return (
    <div
      ref={ref}
      className="absolute top-[calc(100%+8px)] right-0 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-[200] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name ?? "—"}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email ?? ""}</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded">
              {role}
            </span>
          </div>
        </div>
      </div>

      <div className="py-1">
        <button onClick={() => nav("/settings/profile")} className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
          <User size={14} className="text-slate-400" /> Profilim
        </button>
        <button onClick={() => nav("/settings")} className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
          <Settings size={14} className="text-slate-400" /> Sistem Ayarları
        </button>
        <button onClick={() => nav("/settings/permissions")} className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
          <Shield size={14} className="text-slate-400" /> Yetkiler
        </button>
      </div>

      <div className="border-t border-slate-100 py-1">
        <button onClick={onLogout} className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
          <LogOut size={14} /> Çıkış Yap
        </button>
      </div>
    </div>
  );
}

// ─── Bell badge (pre-fetch to show dot) ──────────────────────────────────────

function useBellBadge(projectId?: number) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    const in20 = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
    Promise.all([
      api.get("/contracts/summary").catch(() => ({ data: { data: null } })),
      api.get("/checks", { params: { active_project_id: projectId, due_to: in20, status: "pending" } }).catch(() => ({ data: { data: [] } })),
    ]).then(([cRes, chRes]) => {
      const cd = cRes.data?.data;
      const contractCount = cd ? cd.overdue_count + cd.due_in_7_count : 0;
      const checks: any[] = (chRes.data?.data ?? []).filter((c: any) => c.days_until_due !== undefined && c.days_until_due <= 20);
      const checkCount = checks.filter(c => !isSnoozed(c.id)).length;
      setCount(contractCount + checkCount);
    });
  }, [projectId]);

  return count;
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { activeProject } = useProjectStore();

  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const badgeCount = useBellBadge(activeProject?.id);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = useCallback(async () => {
    try { await api.post("/logout"); } catch { /* ignore */ }
    logout();
    router.push("/login");
  }, [logout, router]);

  if (pathname === "/login") return null;

  return (
    <>
      <header className="h-[52px] flex items-center justify-between px-3 bg-primary text-white shadow-sm shrink-0 gap-2 overflow-hidden relative z-40">
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            className="md:hidden p-1.5 rounded hover:bg-white/20 transition-colors shrink-0"
            onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
            aria-label="Menü"
          >
            <Menu size={20} />
          </button>

          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center bg-white/10 rounded px-2.5 py-1.5 w-72 border border-white/20 hover:bg-white/20 transition-colors shrink-0 text-left gap-2"
          >
            <Search size={15} className="text-white/80 shrink-0" />
            <span className="text-[13px] text-white/70 flex-1">Modül veya sayfa ara...</span>
            <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] text-white/50 font-mono border border-white/20 rounded px-1">
              ⌘K
            </kbd>
          </button>

          <div className="hidden md:block border-l border-white/20 h-6 shrink-0" />

          <div className="min-w-0 flex-1 md:flex-none">
            <ProjectSelector />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            className="md:hidden p-1.5 rounded hover:bg-white/20 transition-colors"
            onClick={() => setCmdOpen(true)}
            aria-label="Arama"
          >
            <Search size={18} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
              className="relative p-1.5 rounded hover:bg-white/20 transition-colors"
              aria-label="Bildirimler"
            >
              <Bell size={18} />
              {badgeCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-primary" />
              )}
            </button>
            {notifOpen && (
              <NotifPanel
                onClose={() => setNotifOpen(false)}
                projectId={activeProject?.id}
              />
            )}
          </div>

          <button
            onClick={() => router.push("/settings")}
            className="hidden md:flex p-1.5 rounded hover:bg-white/20 transition-colors"
            aria-label="Ayarlar"
          >
            <Settings size={18} />
          </button>

          {/* Profile */}
          <div className="relative ml-1 border-l border-white/10 pl-1">
            <button
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
              className="flex items-center gap-1.5 hover:bg-white/20 p-1 pl-1.5 pr-2 rounded transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold">
                {(user?.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[13px] font-medium leading-none">
                  {user?.name?.split(" ")[0] ?? "Kullanıcı"}
                </span>
                <span className="text-[10px] text-white/60 leading-none mt-0.5">
                  {user?.roles?.[0]?.name ?? "Yönetici"}
                </span>
              </div>
            </button>
            {profileOpen && (
              <ProfileDropdown
                user={user}
                onClose={() => setProfileOpen(false)}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
