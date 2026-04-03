'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Settings, User, Shield, Bell, Palette, Database,
  ChevronRight, Building2, Globe, Lock, FileText,
} from 'lucide-react';

interface SettingSection {
  icon: React.ReactNode;
  label: string;
  desc: string;
  href: string;
  badge?: string;
}

const SECTIONS: SettingSection[] = [
  {
    icon: <User size={18} />,
    label: 'Profil & Hesap',
    desc: 'Ad, e-posta ve şifre güncelleme',
    href: '/settings/profile',
  },
  {
    icon: <Building2 size={18} />,
    label: 'Şirket Bilgileri',
    desc: 'Şirket adı, logo, vergi no',
    href: '/settings/company',
  },
  {
    icon: <Shield size={18} />,
    label: 'Kullanıcılar & Yetkiler',
    desc: 'Kullanıcı yönetimi ve rol tanımları',
    href: '/settings/permissions',
    badge: 'Yönetici',
  },
  {
    icon: <Bell size={18} />,
    label: 'Bildirimler',
    desc: 'E-posta ve sistem bildirimleri',
    href: '/settings/notifications',
  },
  {
    icon: <FileText size={18} />,
    label: 'Şablon Editörü',
    desc: 'Fatura, teklif ve rapor şablonları',
    href: '/settings/templates',
  },
  {
    icon: <Globe size={18} />,
    label: 'Dil & Bölge',
    desc: 'Para birimi, tarih formatı, saat dilimi',
    href: '/settings/locale',
  },
  {
    icon: <Lock size={18} />,
    label: 'Güvenlik',
    desc: 'İki faktörlü doğrulama, oturum geçmişi',
    href: '/settings/security',
  },
  {
    icon: <Database size={18} />,
    label: 'Veri & Yedekleme',
    desc: 'Dışa aktarma, veri silme, yedek alma',
    href: '/settings/data',
  },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Sistem Ayarları</h1>
        <p className="text-sm text-slate-500 mt-0.5">Uygulama ayarlarını yönetin</p>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
          {(user?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{user?.name ?? '—'}</p>
          <p className="text-sm text-slate-500">{user?.email ?? ''}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
            {user?.roles?.[0]?.name ?? 'Yönetici'}
          </span>
        </div>
        <button
          onClick={() => router.push('/settings/profile')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          Düzenle <ChevronRight size={14} />
        </button>
      </div>

      {/* Sections */}
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        {SECTIONS.map((s) => (
          <button
            key={s.href}
            onClick={() => router.push(s.href)}
            className="flex items-center gap-4 w-full px-4 py-3.5 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="text-slate-400 flex-shrink-0">{s.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800">{s.label}</span>
                {s.badge && (
                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded">
                    {s.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
            </div>
            <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center">BelconCORE — Yapı Yönetim Sistemi</p>
    </div>
  );
}
