'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Plus, Edit2, Trash2, Shield, Users, Check,
    X, Eye, EyeOff, Save, RefreshCw, AlertTriangle, User,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
    id: number;
    name: string;
    email: string;
    role?: string;
    projects_count: number;
    created_at: string;
}

interface RoleRow {
    id: number;
    name: string;
    permissions: string[];
}

interface ModuleMeta {
    key: string;
    label: string;
    desc: string;
}

const MODULE_META: ModuleMeta[] = [
    { key: 'module.dashboard',   label: 'Dashboard',         desc: 'Ana ekran ve özet kartlar' },
    { key: 'module.projects',    label: 'Proje Yönetimi',    desc: 'Projeler, bloklar, üniteler, 3D satış' },
    { key: 'module.crm',         label: 'CRM & Satış',       desc: 'Müşteriler, fırsatlar, teklifler' },
    { key: 'module.accounting',  label: 'Ön Muhasebe',       desc: 'Faturalar, sözleşmeler, çek/senet, kasa' },
    { key: 'module.stock',       label: 'Stok & Maliyet',    desc: 'Depo, stok hareketleri, maliyet takip' },
    { key: 'module.site',        label: 'Şantiye İlerleme',  desc: 'İnşaat ilerleme takibi' },
    { key: 'module.reports',     label: 'Raporlar',          desc: 'Tüm raporlama modülleri' },
    { key: 'module.settings',    label: 'Sistem Ayarları',   desc: 'Kullanıcı ve sistem yönetimi' },
];

const ROLE_COLORS: Record<string, string> = {
    'Admin':           'bg-red-100 text-red-700 border-red-200',
    'Project Manager': 'bg-blue-100 text-blue-700 border-blue-200',
    'Sales':           'bg-green-100 text-green-700 border-green-200',
    'Accounting':      'bg-purple-100 text-purple-700 border-purple-200',
    'Site Supervisor': 'bg-amber-100 text-amber-700 border-amber-200',
};

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';

// ─── User Form Modal ──────────────────────────────────────────────────────────

function UserModal({ user, roles, onClose, onSaved }: {
    user?: UserRow;
    roles: RoleRow[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [form, setForm] = useState({
        name: user?.name ?? '',
        email: user?.email ?? '',
        role: user?.role ?? (roles[0]?.name ?? ''),
        password: '',
    });
    const [showPwd, setShowPwd] = useState(false);
    const [saving, setSaving] = useState(false);
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: any = { name: form.name, email: form.email, role: form.role };
            if (form.password) payload.password = form.password;
            if (!user) payload.password = form.password || undefined;

            if (user) {
                await api.put(`/users/${user.id}`, payload);
                toast.success('Kullanıcı güncellendi');
            } else {
                if (!form.password) { toast.error('Şifre zorunlu'); setSaving(false); return; }
                await api.post('/users', { ...payload, password: form.password });
                toast.success('Kullanıcı oluşturuldu');
            }
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
                onClick={e => e.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        {user ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
                    </h2>
                    <button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
                </div>

                <div className="space-y-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Ad Soyad *</span>
                        <input required className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ahmet Yılmaz" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">E-posta *</span>
                        <input required type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="kullanici@firma.com" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Rol *</span>
                        <select required className={inputCls} value={form.role} onChange={e => set('role', e.target.value)}>
                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            Şifre {user ? '(boş bırakırsanız değişmez)' : '*'}
                        </span>
                        <div className="relative">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                className={inputCls + ' pr-10'}
                                value={form.password}
                                onChange={e => set('password', e.target.value)}
                                placeholder="••••••••"
                            />
                            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-2.5 text-slate-400">
                                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </label>
                </div>

                {form.role && MODULE_META.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Bu rolün erişimi</p>
                        <div className="flex flex-wrap gap-1.5">
                            {roles.find(r => r.name === form.role)?.permissions.map(p => {
                                const m = MODULE_META.find(mm => mm.key === p);
                                return m ? (
                                    <span key={p} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 rounded px-2 py-0.5">{m.label}</span>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}

                <div className="flex gap-2 pt-1">
                    <button type="button" onClick={onClose} className="flex-1 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">İptal</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Kaydediliyor...' : (user ? 'Güncelle' : 'Oluştur')}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PermissionsPage() {
    const router = useRouter();
    const currentUser = useAuthStore(s => s.user);
    const isAdmin = currentUser?.roles?.some(r => r.name === 'Admin') ?? false;

    const [tab, setTab] = useState<'users' | 'roles'>('users');
    const [users, setUsers] = useState<UserRow[]>([]);
    const [roles, setRoles] = useState<RoleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [userModal, setUserModal] = useState<{ open: boolean; user?: UserRow }>({ open: false });
    const [savingRole, setSavingRole] = useState<number | null>(null);
    const [rolePerms, setRolePerms] = useState<Record<number, string[]>>({});
    const [initLoading, setInitLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [uRes, rRes] = await Promise.all([
                api.get('/users'),
                api.get('/roles'),
            ]);
            setUsers(uRes.data.data ?? []);
            const rolesData: RoleRow[] = rRes.data.data ?? [];
            setRoles(rolesData);
            const initPerms: Record<number, string[]> = {};
            rolesData.forEach(r => { initPerms[r.id] = [...r.permissions]; });
            setRolePerms(initPerms);
        } catch {
            toast.error('Veriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <p className="text-slate-600 font-medium">Bu sayfaya erişim yetkiniz yok.</p>
                <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">Geri dön</button>
            </div>
        );
    }

    const handleDeleteUser = async (u: UserRow) => {
        if (u.id === currentUser?.id) { toast.error('Kendi hesabınızı silemezsiniz'); return; }
        if (!confirm(`"${u.name}" silinecek. Emin misiniz?`)) return;
        try {
            await api.delete(`/users/${u.id}`);
            toast.success('Kullanıcı silindi');
            setUsers(prev => prev.filter(x => x.id !== u.id));
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Silinemedi');
        }
    };

    const toggleModuleForRole = (roleId: number, module: string) => {
        setRolePerms(prev => {
            const current = prev[roleId] ?? [];
            return {
                ...prev,
                [roleId]: current.includes(module)
                    ? current.filter(p => p !== module)
                    : [...current, module],
            };
        });
    };

    const saveRolePermissions = async (role: RoleRow) => {
        setSavingRole(role.id);
        try {
            await api.put(`/roles/${role.id}/permissions`, { permissions: rolePerms[role.id] ?? [] });
            toast.success(`"${role.name}" izinleri kaydedildi`);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Kaydedilemedi');
        } finally {
            setSavingRole(null);
        }
    };

    const handleInitDefaults = async () => {
        if (!confirm('Tüm rollerin izinleri varsayılan değerlere sıfırlanacak. Emin misiniz?')) return;
        setInitLoading(true);
        try {
            await api.post('/roles/init-defaults');
            toast.success('Varsayılan izinler uygulandı');
            await load();
        } catch {
            toast.error('İşlem başarısız');
        } finally {
            setInitLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
                    <ChevronLeft size={18} />
                </button>
                <div className="flex-1">
                    <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" /> Kullanıcılar & Yetkiler
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">Kullanıcı ekleme, rol atama ve modül erişim yönetimi</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden w-fit">
                {(['users', 'roles'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${tab === t ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {t === 'users' ? <><Users size={13} /> Kullanıcılar</> : <><Shield size={13} /> Roller & İzinler</>}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-sm text-slate-400">Yükleniyor...</div>
            ) : tab === 'users' ? (
                /* ── USERS TAB ── */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-700">{users.length} kullanıcı</p>
                        <button
                            onClick={() => setUserModal({ open: true })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={13} /> Kullanıcı Ekle
                        </button>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {users.map(u => (
                            <div key={u.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 group">
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate flex items-center gap-1.5">
                                        {u.name}
                                        {u.id === currentUser?.id && (
                                            <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 rounded px-1.5 py-0.5">Sen</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                </div>
                                {/* Role badge */}
                                <span className={`text-[10px] font-semibold border rounded-full px-2.5 py-0.5 shrink-0 ${ROLE_COLORS[u.role ?? ''] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    {u.role ?? 'Rol yok'}
                                </span>
                                {/* Projects */}
                                <span className="text-[10px] text-slate-400 shrink-0 hidden sm:block">{u.projects_count} proje</span>
                                {/* Actions */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                                    <button
                                        onClick={() => setUserModal({ open: true, user: u })}
                                        className="p-1.5 rounded hover:bg-slate-200 text-slate-500"
                                        title="Düzenle"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(u)}
                                        className="p-1.5 rounded hover:bg-red-50 text-red-400"
                                        title="Sil"
                                        disabled={u.id === currentUser?.id}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <div className="text-center py-10 text-sm text-slate-400">Henüz kullanıcı yok</div>
                        )}
                    </div>
                </div>
            ) : (
                /* ── ROLES TAB ── */
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Her rol için hangi modüllere erişileceğini belirleyin. Bu ayarlar o rolü taşıyan tüm kullanıcıları etkiler.</p>
                        <button
                            onClick={handleInitDefaults}
                            disabled={initLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw size={12} className={initLoading ? 'animate-spin' : ''} />
                            Varsayılana Sıfırla
                        </button>
                    </div>

                    {roles.map(role => {
                        const isAdminRole = role.name === 'Admin';
                        const perms = rolePerms[role.id] ?? [];
                        const isDirty = JSON.stringify([...perms].sort()) !== JSON.stringify([...role.permissions].sort());

                        return (
                            <div key={role.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${ROLE_COLORS[role.name] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {role.name}
                                        </span>
                                        {isAdminRole && (
                                            <span className="text-[10px] text-slate-400">Tüm modüllere her zaman erişebilir</span>
                                        )}
                                    </div>
                                    {!isAdminRole && (
                                        <button
                                            onClick={() => saveRolePermissions(role)}
                                            disabled={!isDirty || savingRole === role.id}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isDirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'} disabled:opacity-60`}
                                        >
                                            <Save size={12} />
                                            {savingRole === role.id ? 'Kaydediliyor...' : 'Kaydet'}
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x-0">
                                    {MODULE_META.map((mod, idx) => {
                                        const enabled = isAdminRole || perms.includes(mod.key);
                                        return (
                                            <label
                                                key={mod.key}
                                                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors select-none ${isAdminRole ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50'} ${idx % 2 === 0 && !isAdminRole ? '' : ''}`}
                                            >
                                                <div
                                                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${enabled ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-white'}`}
                                                    onClick={() => !isAdminRole && toggleModuleForRole(role.id, mod.key)}
                                                >
                                                    {enabled && <Check size={12} className="text-white" strokeWidth={3} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-slate-800">{mod.label}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{mod.desc}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* User Modal */}
            {userModal.open && (
                <UserModal
                    user={userModal.user}
                    roles={roles}
                    onClose={() => setUserModal({ open: false })}
                    onSaved={load}
                />
            )}
        </div>
    );
}
