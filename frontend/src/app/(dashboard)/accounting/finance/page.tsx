'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    Landmark, Plus, Trash2, Pencil, TrendingUp, TrendingDown,
    ArrowLeftRight, Search, ChevronRight, X, Wallet,
    Building, CreditCard, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FinanceAccount {
    id: number;
    type: 'cash' | 'bank';
    name: string;
    bank_name?: string;
    branch?: string;
    account_no?: string;
    iban?: string;
    currency: string;
    balance: number;
    opening_balance: number;
    is_default: boolean;
    status: 'active' | 'passive';
    notes?: string;
}

interface FinanceTransaction {
    id: number;
    account_id: number;
    transfer_to_account_id?: number;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    date: string;
    description?: string;
    category?: string;
    reference?: string;
    account?: { id: number; name: string };
    transfer_to?: { id: number; name: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtMoney = (n: number, cur = 'TRY') => {
    const abs = Math.abs(n || 0);
    const str = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(abs);
    const sym = cur === 'TRY' ? '₺' : cur === 'USD' ? '$' : cur === 'EUR' ? '€' : cur;
    return `${sym}${str}`;
};
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const TX_CATEGORIES = [
    'Satış Tahsilatı', 'Alış Ödemesi', 'Genel Gider', 'Personel', 'Kira', 'Vergi',
    'Fatura', 'Aidat', 'Banka Masrafı', 'Diğer',
];

// ─── Account Form ─────────────────────────────────────────────────────────────
interface AccountFormProps {
    open: boolean;
    onClose: () => void;
    onSaved: (a: FinanceAccount) => void;
    editing?: FinanceAccount | null;
    projectId: number;
}

function AccountFormModal({ open, onClose, onSaved, editing, projectId }: AccountFormProps) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        type: 'cash' as 'cash' | 'bank',
        name: '',
        bank_name: '',
        branch: '',
        account_no: '',
        iban: '',
        currency: 'TRY',
        opening_balance: '0',
        notes: '',
    });

    useEffect(() => {
        if (editing) {
            setForm({
                type: editing.type,
                name: editing.name,
                bank_name: editing.bank_name || '',
                branch: editing.branch || '',
                account_no: editing.account_no || '',
                iban: editing.iban || '',
                currency: editing.currency,
                opening_balance: editing.opening_balance.toString(),
                notes: editing.notes || '',
            });
        } else {
            setForm({ type: 'cash', name: '', bank_name: '', branch: '', account_no: '', iban: '', currency: 'TRY', opening_balance: '0', notes: '' });
        }
    }, [editing, open]);

    const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

    const save = async () => {
        if (!form.name.trim()) { toast.error('İsim zorunludur.'); return; }
        setLoading(true);
        try {
            if (editing) {
                const r = await api.put(`/finance/accounts/${editing.id}`, {
                    ...form, opening_balance: parseFloat(form.opening_balance) || 0,
                });
                onSaved(r.data.data);
                toast.success('Hesap güncellendi.');
            } else {
                const r = await api.post('/finance/accounts', {
                    ...form, active_project_id: projectId,
                    opening_balance: parseFloat(form.opening_balance) || 0,
                });
                onSaved(r.data.data);
                toast.success('Hesap oluşturuldu.');
            }
            onClose();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Hata oluştu.');
        } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">
                <div className="bg-slate-50 border-b px-5 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-[15px] font-semibold">
                            {editing ? 'Hesap Düzenle' : 'Yeni Kasa / Banka Hesabı'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Kasa veya banka hesabı ekleyin.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="px-5 py-4 space-y-4">
                    {/* Type */}
                    <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
                        {([['cash', 'Kasa', 'Nakit para kasası', Wallet], ['bank', 'Banka', 'Banka hesabı', Building]] as const).map(([val, label, desc]) => (
                            <button key={val} type="button" onClick={() => f('type', val)}
                                className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${form.type === val ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                                {label}
                                <span className="block text-[10px] font-normal text-slate-400">{desc}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">İsim <span className="text-red-500">*</span></Label>
                        <Input value={form.name} onChange={e => f('name', e.target.value)} placeholder={form.type === 'cash' ? 'Ana Kasa, Ofis Kasası...' : 'Hesap adı...'} className="h-8 text-sm" />
                    </div>

                    {form.type === 'bank' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Banka Adı</Label>
                                <Input value={form.bank_name} onChange={e => f('bank_name', e.target.value)} placeholder="Garanti, İş Bankası..." className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Şube</Label>
                                <Input value={form.branch} onChange={e => f('branch', e.target.value)} placeholder="Şube adı" className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Hesap No</Label>
                                <Input value={form.account_no} onChange={e => f('account_no', e.target.value)} placeholder="1234567890" className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">IBAN</Label>
                                <Input value={form.iban} onChange={e => f('iban', e.target.value)} placeholder="TR00..." className="h-8 text-sm" />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Döviz</Label>
                            <select value={form.currency} onChange={e => f('currency', e.target.value)}
                                className="w-full h-8 text-xs border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                                {['TRY', 'USD', 'EUR', 'GBP'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Açılış Bakiyesi</Label>
                            <div className="relative">
                                <Input type="number" value={form.opening_balance} onChange={e => f('opening_balance', e.target.value)} className="h-8 text-sm pr-6" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">₺</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Notlar</Label>
                        <Textarea value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => f('notes', e.target.value)} rows={2} className="text-sm resize-none" placeholder="Ek bilgiler..." />
                    </div>
                </div>
                <div className="bg-slate-50 border-t px-5 py-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onClose}>İptal</Button>
                    <Button size="sm" onClick={save} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Transaction Form ─────────────────────────────────────────────────────────
interface TxFormProps {
    open: boolean;
    onClose: () => void;
    onSaved: (tx: FinanceTransaction) => void;
    accounts: FinanceAccount[];
    projectId: number;
    defaultAccountId?: number;
}

function TxFormModal({ open, onClose, onSaved, accounts, projectId, defaultAccountId }: TxFormProps) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        type: 'income' as 'income' | 'expense' | 'transfer',
        account_id: defaultAccountId?.toString() || '',
        transfer_to_account_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        reference: '',
    });

    useEffect(() => {
        if (open) setForm(p => ({ ...p, account_id: defaultAccountId?.toString() || '' }));
    }, [open, defaultAccountId]);

    const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

    const save = async () => {
        if (!form.account_id) { toast.error('Hesap seçilmelidir.'); return; }
        if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Geçerli bir tutar giriniz.'); return; }
        setLoading(true);
        try {
            const r = await api.post('/finance/transactions', {
                ...form,
                amount: parseFloat(form.amount),
                active_project_id: projectId,
                account_id: parseInt(form.account_id),
                transfer_to_account_id: form.transfer_to_account_id ? parseInt(form.transfer_to_account_id) : undefined,
            });
            onSaved(r.data.data);
            toast.success('Hareket kaydedildi.');
            onClose();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Hata oluştu.');
        } finally { setLoading(false); }
    };

    const TYPE_OPTS = [
        { value: 'income', label: 'Gelir', color: 'text-green-600', bg: 'bg-green-50' },
        { value: 'expense', label: 'Gider', color: 'text-red-600', bg: 'bg-red-50' },
        { value: 'transfer', label: 'Transfer', color: 'text-blue-600', bg: 'bg-blue-50' },
    ];

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden gap-0">
                <div className="bg-slate-50 border-b px-5 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-[15px] font-semibold">Yeni Hareket</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">Gelir, gider veya hesaplar arası transfer.</DialogDescription>
                    </DialogHeader>
                </div>
                <div className="px-5 py-4 space-y-4">
                    {/* Type */}
                    <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
                        {TYPE_OPTS.map(t => (
                            <button key={t.value} type="button" onClick={() => f('type', t.value)}
                                className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${form.type === t.value ? `bg-white shadow-sm ${t.color}` : 'text-slate-500 hover:text-slate-700'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Hesap <span className="text-red-500">*</span></Label>
                            <select value={form.account_id} onChange={e => f('account_id', e.target.value)}
                                className="w-full h-8 text-xs border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                                <option value="">Seçiniz</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Tarih</Label>
                            <Input type="date" value={form.date} onChange={e => f('date', e.target.value)} className="h-8 text-sm" />
                        </div>
                    </div>

                    {form.type === 'transfer' && (
                        <div className="space-y-1">
                            <Label className="text-xs">Hedef Hesap <span className="text-red-500">*</span></Label>
                            <select value={form.transfer_to_account_id} onChange={e => f('transfer_to_account_id', e.target.value)}
                                className="w-full h-8 text-xs border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                                <option value="">Seçiniz</option>
                                {accounts.filter(a => a.id.toString() !== form.account_id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Tutar <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Input type="number" value={form.amount} onChange={e => f('amount', e.target.value)} step={0.01} min={0} placeholder="0,00" className="h-8 text-sm pr-6" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">₺</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Kategori</Label>
                            <select value={form.category} onChange={e => f('category', e.target.value)}
                                className="w-full h-8 text-xs border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                                <option value="">—</option>
                                {TX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Açıklama</Label>
                        <Input value={form.description} onChange={e => f('description', e.target.value)} placeholder="Hareket açıklaması..." className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Referans No</Label>
                        <Input value={form.reference} onChange={e => f('reference', e.target.value)} placeholder="Dekont, makbuz no..." className="h-8 text-sm" />
                    </div>
                </div>
                <div className="bg-slate-50 border-t px-5 py-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onClose}>İptal</Button>
                    <Button size="sm" onClick={save} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FinancePage() {
    const { activeProject } = useProjectStore();
    const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [txLoading, setTxLoading] = useState(false);
    const [accountFormOpen, setAccountFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
    const [txFormOpen, setTxFormOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [txSearch, setTxSearch] = useState('');
    const [contextMenu, setContextMenu] = useState<{ id: number; x: number; y: number; kind: 'account' | 'tx' } | null>(null);

    const loadAccounts = useCallback(async () => {
        if (!activeProject) return;
        setLoading(true);
        try {
            const r = await api.get('/finance/accounts', { params: { active_project_id: activeProject.id } });
            setAccounts(r.data.data);
        } catch { toast.error('Hesaplar yüklenemedi.'); }
        finally { setLoading(false); }
    }, [activeProject]);

    const loadTransactions = useCallback(async () => {
        if (!activeProject) return;
        setTxLoading(true);
        try {
            const r = await api.get('/finance/transactions', {
                params: { active_project_id: activeProject.id, account_id: selectedAccountId || undefined }
            });
            setTransactions(r.data.data);
        } catch { toast.error('Hareketler yüklenemedi.'); }
        finally { setTxLoading(false); }
    }, [activeProject, selectedAccountId]);

    useEffect(() => { loadAccounts(); }, [loadAccounts]);
    useEffect(() => { loadTransactions(); }, [loadTransactions]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setTxFormOpen(true); }
            if (e.key === 'h' || e.key === 'H') { e.preventDefault(); setAccountFormOpen(true); setEditingAccount(null); }
            if (e.key === 'Escape') setContextMenu(null);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const cashAccounts = useMemo(() => accounts.filter(a => a.type === 'cash'), [accounts]);
    const bankAccounts = useMemo(() => accounts.filter(a => a.type === 'bank'), [accounts]);
    const totalBalance = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);

    const filteredTx = useMemo(() => {
        let list = transactions;
        if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter);
        if (txSearch) {
            const s = txSearch.toLowerCase();
            list = list.filter(t => (t.description || '').toLowerCase().includes(s) || (t.category || '').toLowerCase().includes(s) || (t.reference || '').toLowerCase().includes(s));
        }
        return list;
    }, [transactions, typeFilter, txSearch]);

    const handleDeleteAccount = async (id: number) => {
        if (!confirm('Bu hesabı silmek istediğinizden emin misiniz? Tüm hareketler de silinir.')) return;
        try {
            await api.delete(`/finance/accounts/${id}`);
            setAccounts(p => p.filter(a => a.id !== id));
            if (selectedAccountId === id) { setSelectedAccountId(null); setTransactions([]); }
            toast.success('Hesap silindi.');
        } catch { toast.error('Silinemedi.'); }
        setContextMenu(null);
    };

    const handleDeleteTx = async (id: number) => {
        if (!confirm('Bu hareketi silmek istediğinizden emin misiniz?')) return;
        try {
            await api.delete(`/finance/transactions/${id}`);
            setTransactions(p => p.filter(t => t.id !== id));
            loadAccounts(); // Refresh balances
            toast.success('Hareket silindi.');
        } catch { toast.error('Silinemedi.'); }
        setContextMenu(null);
    };

    if (!activeProject) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">Aktif proje seçilmedi.</p>
        </div>
    );

    const selectedAccount = accounts.find(a => a.id === selectedAccountId);

    // income - expense for selected
    const txIncome = filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const txExpense = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return (
        <div className="flex h-full" onClick={() => setContextMenu(null)}>

            {/* ── LEFT: Account list ────────────────────────────────────── */}
            <div className="w-[260px] shrink-0 border-r border-slate-200 bg-white flex flex-col">
                {/* Summary header */}
                <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <Landmark size={14} className="text-slate-400" />
                            Kasa ve Bankalar
                        </div>
                        <button onClick={() => { setEditingAccount(null); setAccountFormOpen(true); }}
                            title="Yeni Hesap (H)"
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <Plus size={14} />
                        </button>
                    </div>
                    {/* Total balance card */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl px-4 py-3 text-white">
                        <p className="text-[10px] font-semibold tracking-widest opacity-80 uppercase mb-1">Toplam Bakiye</p>
                        <p className="text-2xl font-bold font-mono">{fmtMoney(totalBalance)}</p>
                        <div className="flex gap-3 mt-2 text-[11px] opacity-80">
                            <span>Kasa: {fmtMoney(cashAccounts.reduce((s, a) => s + a.balance, 0))}</span>
                            <span>•</span>
                            <span>Banka: {fmtMoney(bankAccounts.reduce((s, a) => s + a.balance, 0))}</span>
                        </div>
                    </div>
                </div>

                {/* Account list */}
                <div className="flex-1 overflow-y-auto py-2">
                    {/* "Tümü" button */}
                    <button onClick={() => setSelectedAccountId(null)}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-[12.5px] transition-colors ${!selectedAccountId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Wallet size={13} className={!selectedAccountId ? 'text-blue-500' : 'text-slate-400'} />
                        <span>Tüm Hareketler</span>
                        {!selectedAccountId && <ChevronRight size={12} className="ml-auto text-blue-400" />}
                    </button>

                    {cashAccounts.length > 0 && (
                        <div className="mt-2">
                            <p className="px-4 py-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Kasa</p>
                            {cashAccounts.map(a => (
                                <button key={a.id}
                                    onClick={() => setSelectedAccountId(a.id === selectedAccountId ? null : a.id)}
                                    onContextMenu={e => { e.preventDefault(); setContextMenu({ id: a.id, x: e.clientX, y: e.clientY, kind: 'account' }); }}
                                    className={`w-full flex items-start gap-2.5 px-4 py-2 transition-colors border-l-2 ${a.id === selectedAccountId ? 'bg-blue-50 border-l-blue-500 text-blue-700' : 'border-l-transparent hover:bg-slate-50 text-slate-700'}`}>
                                    <Wallet size={13} className={`mt-0.5 shrink-0 ${a.id === selectedAccountId ? 'text-blue-500' : 'text-slate-400'}`} />
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[12.5px] font-medium truncate">{a.name}</p>
                                        <p className={`text-[12px] font-mono font-semibold ${a.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmtMoney(a.balance, a.currency)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {bankAccounts.length > 0 && (
                        <div className="mt-2">
                            <p className="px-4 py-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Bankalar</p>
                            {bankAccounts.map(a => (
                                <button key={a.id}
                                    onClick={() => setSelectedAccountId(a.id === selectedAccountId ? null : a.id)}
                                    onContextMenu={e => { e.preventDefault(); setContextMenu({ id: a.id, x: e.clientX, y: e.clientY, kind: 'account' }); }}
                                    className={`w-full flex items-start gap-2.5 px-4 py-2 transition-colors border-l-2 ${a.id === selectedAccountId ? 'bg-blue-50 border-l-blue-500 text-blue-700' : 'border-l-transparent hover:bg-slate-50 text-slate-700'}`}>
                                    <Building size={13} className={`mt-0.5 shrink-0 ${a.id === selectedAccountId ? 'text-blue-500' : 'text-slate-400'}`} />
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[12.5px] font-medium truncate">{a.name}</p>
                                        {a.bank_name && <p className="text-[10px] text-slate-400">{a.bank_name}{a.branch ? ` / ${a.branch}` : ''}</p>}
                                        <p className={`text-[12px] font-mono font-semibold ${a.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmtMoney(a.balance, a.currency)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {accounts.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                            <Landmark size={28} className="text-slate-200" />
                            <p className="text-xs">Henüz hesap yok</p>
                            <button onClick={() => { setEditingAccount(null); setAccountFormOpen(true); }} className="text-xs text-blue-600 hover:underline">+ Hesap Ekle (H)</button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── RIGHT: Transactions ──────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 shrink-0">
                    {selectedAccount ? (
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            {selectedAccount.type === 'cash' ? <Wallet size={14} className="text-slate-400" /> : <Building size={14} className="text-slate-400" />}
                            {selectedAccount.name}
                            <span className={`ml-1 text-base font-bold font-mono ${selectedAccount.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {fmtMoney(selectedAccount.balance, selectedAccount.currency)}
                            </span>
                        </div>
                    ) : (
                        <span className="text-sm font-semibold text-slate-700">Tüm Hareketler</span>
                    )}
                    <div className="flex-1" />
                    {/* Filters */}
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                        className="h-7 text-xs border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                        <option value="all">Tümü</option>
                        <option value="income">Gelir</option>
                        <option value="expense">Gider</option>
                        <option value="transfer">Transfer</option>
                    </select>
                    <div className="relative">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder="Ara..."
                            className="h-7 pl-6 pr-2 text-xs border border-slate-200 rounded w-40 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </div>
                    <Button size="sm" className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setTxFormOpen(true)} title="Yeni Hareket (N)">
                        <Plus size={12} /> Yeni Hareket
                    </Button>
                </div>

                {/* Mini summary bar when account selected */}
                {filteredTx.length > 0 && (
                    <div className="bg-white border-b border-slate-100 px-4 py-1.5 flex items-center gap-4 text-xs shrink-0">
                        <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp size={12} />
                            <span>Toplam Gelir: <span className="font-mono font-semibold">{fmtMoney(txIncome)}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-red-500">
                            <TrendingDown size={12} />
                            <span>Toplam Gider: <span className="font-mono font-semibold">{fmtMoney(txExpense)}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600">
                            <ArrowLeftRight size={12} />
                            <span>Net: <span className={`font-mono font-semibold ${txIncome - txExpense >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmtMoney(txIncome - txExpense)}</span></span>
                        </div>
                    </div>
                )}

                {/* Table header */}
                <div className="bg-white border-b border-slate-200 shrink-0">
                    <div className="grid text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-4 py-1.5"
                        style={{ gridTemplateColumns: '90px 1fr 120px 80px 90px 32px' }}>
                        <span>TARİH</span>
                        <span>AÇIKLAMA</span>
                        <span>HESAP</span>
                        <span>KATEGORİ</span>
                        <span className="text-right">TUTAR</span>
                        <span />
                    </div>
                </div>

                {/* Rows */}
                <div className="flex-1 overflow-y-auto">
                    {txLoading ? (
                        <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Yükleniyor...</div>
                    ) : filteredTx.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                            <CreditCard size={32} className="text-slate-200" />
                            <p className="text-sm">Hareket bulunamadı</p>
                            <button onClick={() => setTxFormOpen(true)} className="text-xs text-blue-600 hover:underline">+ Hareket Ekle (N)</button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredTx.map(tx => {
                                const isIncome = tx.type === 'income';
                                const isExpense = tx.type === 'expense';
                                const isTransfer = tx.type === 'transfer';
                                return (
                                    <div key={tx.id}
                                        className="group grid items-center px-4 py-2 hover:bg-blue-50/40 transition-colors"
                                        style={{ gridTemplateColumns: '90px 1fr 120px 80px 90px 32px' }}
                                        onContextMenu={e => { e.preventDefault(); setContextMenu({ id: tx.id, x: e.clientX, y: e.clientY, kind: 'tx' }); }}>
                                        <span className="text-xs text-slate-500">{fmtDate(tx.date)}</span>
                                        <div>
                                            <p className="text-xs font-medium text-slate-700">{tx.description || '—'}</p>
                                            {isTransfer && (
                                                <p className="text-[10px] text-blue-500">
                                                    {tx.account?.name} → {tx.transfer_to?.name}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 truncate">{tx.account?.name}</span>
                                        <span className="text-[11px] text-slate-400 truncate">{tx.category || '—'}</span>
                                        <div className="text-right flex items-center justify-end gap-1">
                                            {isIncome && <TrendingUp size={11} className="text-green-500" />}
                                            {isExpense && <TrendingDown size={11} className="text-red-400" />}
                                            {isTransfer && <ArrowLeftRight size={11} className="text-blue-400" />}
                                            <span className={`text-xs font-mono font-semibold ${isIncome ? 'text-green-600' : isExpense ? 'text-red-500' : 'text-blue-600'}`}>
                                                {isExpense ? '-' : '+'}{fmtMoney(tx.amount)}
                                            </span>
                                        </div>
                                        <button onClick={e => { e.stopPropagation(); setContextMenu({ id: tx.id, x: e.clientX, y: e.clientY, kind: 'tx' }); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 transition-all">
                                            <MoreVertical size={12} className="text-slate-400" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Status bar */}
                <div className="bg-white border-t border-slate-200 px-4 py-1 flex items-center gap-4 shrink-0 text-[11px] text-slate-400">
                    <span>{filteredTx.length} hareket</span>
                    <span>N = Yeni Hareket · H = Yeni Hesap · Sağ Tık = Menü</span>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-lg py-1 min-w-[150px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}>
                    {contextMenu.kind === 'account' ? (
                        <>
                            <button onClick={() => {
                                const a = accounts.find(a => a.id === contextMenu.id);
                                if (a) { setEditingAccount(a); setAccountFormOpen(true); }
                                setContextMenu(null);
                            }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 text-slate-700">
                                <Pencil size={13} /> Düzenle
                            </button>
                            <button onClick={() => handleDeleteAccount(contextMenu.id)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-red-50 text-red-600">
                                <Trash2 size={13} /> Sil
                            </button>
                        </>
                    ) : (
                        <button onClick={() => handleDeleteTx(contextMenu.id)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-red-50 text-red-600">
                            <Trash2 size={13} /> Hareketi Sil
                        </button>
                    )}
                    <button onClick={() => setContextMenu(null)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 text-slate-500">
                        <X size={13} /> Kapat
                    </button>
                </div>
            )}

            {/* Account Form */}
            <AccountFormModal
                open={accountFormOpen}
                onClose={() => setAccountFormOpen(false)}
                onSaved={a => {
                    setAccounts(p => {
                        const idx = p.findIndex(x => x.id === a.id);
                        if (idx >= 0) { const n = [...p]; n[idx] = a; return n; }
                        return [...p, a];
                    });
                }}
                editing={editingAccount}
                projectId={activeProject.id}
            />

            {/* Transaction Form */}
            <TxFormModal
                open={txFormOpen}
                onClose={() => setTxFormOpen(false)}
                onSaved={tx => {
                    setTransactions(p => [tx, ...p]);
                    loadAccounts();
                }}
                accounts={accounts}
                projectId={activeProject.id}
                defaultAccountId={selectedAccountId || undefined}
            />
        </div>
    );
}
