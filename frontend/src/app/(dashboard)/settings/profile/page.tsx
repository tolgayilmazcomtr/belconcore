'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const inputCls = 'w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const router = useRouter();

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password && form.password !== form.password_confirmation) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string> = { name: form.name, email: form.email };
      if (form.password) {
        payload.current_password = form.current_password;
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }
      const res = await api.put('/user/profile', payload);
      // Update store if API returns updated user
      if (res.data?.user && user) {
        const token = useAuthStore.getState().token ?? '';
        setAuth(res.data.user, token);
      }
      toast.success('Profil güncellendi');
      setForm(f => ({ ...f, current_password: '', password: '', password_confirmation: '' }));
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Güncelleme başarısız';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Profil & Hesap</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
            {(user?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.roles?.[0]?.name ?? 'Yönetici'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ad Soyad</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">E-posta</label>
            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-500 mb-3">Şifre Değiştir <span className="font-normal">(opsiyonel)</span></p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Mevcut Şifre</label>
                <input type="password" value={form.current_password} onChange={e => set('current_password', e.target.value)} className={inputCls} placeholder="••••••••" />
              </div>
              <div className="relative">
                <label className="block text-xs text-slate-500 mb-1">Yeni Şifre</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className={inputCls}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-[26px] text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Şifre Tekrar</label>
                <input type="password" value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} className={inputCls} placeholder="••••••••" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
