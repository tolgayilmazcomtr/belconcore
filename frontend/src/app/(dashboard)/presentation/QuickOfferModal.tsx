"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Search, UserPlus, Loader2, FileDown, CheckCircle2, Calculator, Clock } from "lucide-react";
import api from "@/lib/api";
import { Customer } from "@/types/project.types";

// ============================================================
// Hızlı Teklif Modalı (Satış Sunum Ekranı)
//
// Müşteri karşısında kullanılır: müşteri listesi topluca YÜKLENMEZ,
// yalnızca yazılan arama teriminin sonuçları sunucudan gelir.
// ============================================================

export interface QuickOfferUnit {
    system_id: number;
    unit_no: string;        // örn. "A3CK"
    block: string;
    floorLabel: string;
    list_price?: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    unit: QuickOfferUnit;
    projectId: number;
}

const fmtTL = (v: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v);

const customerName = (c: Customer) =>
    c.type === 'corporate' ? (c.company_name || '—') : `${c.first_name || ''} ${c.last_name || ''}`.trim();

const inputCls = "w-full bg-[#f7f8fa] border border-[#DDE1E7] text-[#1a1a2e] px-3 py-2 text-[13px] rounded-[3px] outline-none focus:border-[#C8102E] focus:bg-white transition-colors";
const labelCls = "block text-[8px] tracking-[3px] uppercase text-[#8892A0] mb-1.5";

export default function QuickOfferModal({ open, onClose, unit, projectId }: Props) {
    // Müşteri arama
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [searching, setSearching] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '' });
    const [savingCustomer, setSavingCustomer] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fiyatlandırma
    const [basePrice, setBasePrice] = useState('');
    const [discount, setDiscount] = useState('0');
    const [discountPct, setDiscountPct] = useState('0');
    const [finalPrice, setFinalPrice] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [notes, setNotes] = useState('');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [created, setCreated] = useState<{ id: number; offer_no: string; approval_status: string } | null>(null);
    const [downloading, setDownloading] = useState(false);

    // %5 üzeri indirim yönetici onayı gerektirir (sunucu tarafında da doğrulanır)
    const APPROVAL_THRESHOLD = 5;
    const currentPct = (() => {
        const base = parseFloat(basePrice) || 0;
        const disc = parseFloat(discount) || 0;
        return base > 0 ? (disc / base) * 100 : 0;
    })();
    const needsApproval = currentPct > APPROVAL_THRESHOLD;

    // Modal açıldığında formu sıfırla
    useEffect(() => {
        if (!open) return;
        setSearch(''); setResults([]); setCustomer(null);
        setShowNewCustomer(false); setNewCustomer({ first_name: '', last_name: '', phone: '' });
        setBasePrice(unit.list_price != null ? String(unit.list_price) : '');
        setDiscount('0');
        setDiscountPct('0');
        setValidUntil(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setNotes('');
        setError('');
        setCreated(null);
    }, [open, unit]);

    // Net fiyat otomatik hesap
    useEffect(() => {
        const base = parseFloat(basePrice) || 0;
        const disc = parseFloat(discount) || 0;
        const fin = base - disc;
        setFinalPrice(fin >= 0 ? String(fin) : '0');
    }, [basePrice, discount]);

    // Sunucu tarafı müşteri arama (debounce, min 2 karakter)
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (search.trim().length < 2) { setResults([]); setSearching(false); return; }
        setSearching(true);
        searchTimer.current = setTimeout(async () => {
            try {
                const res = await api.get('/customers', { params: { search: search.trim(), active_project_id: projectId } });
                const list: Customer[] = res.data?.data || res.data || [];
                setResults(list.slice(0, 8));
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [search, projectId]);

    const createCustomer = async () => {
        if (!newCustomer.first_name.trim() || !newCustomer.last_name.trim()) {
            setError('Ad ve soyad zorunludur.');
            return;
        }
        setError('');
        setSavingCustomer(true);
        try {
            const res = await api.post('/customers', {
                type: 'individual',
                first_name: newCustomer.first_name.trim(),
                last_name: newCustomer.last_name.trim(),
                phone: newCustomer.phone.trim() || null,
                active_project_id: projectId,
            });
            const c: Customer = res.data?.data || res.data;
            setCustomer(c);
            setShowNewCustomer(false);
        } catch {
            setError('Müşteri kaydedilemedi.');
        } finally {
            setSavingCustomer(false);
        }
    };

    // % ve ₺ alanlarını senkron tut
    const pctFromAmount = (amount: number, base: number) =>
        base > 0 ? String(parseFloat(((amount / base) * 100).toFixed(2))) : '0';

    const onBaseChange = (v: string) => {
        setBasePrice(v);
        setDiscountPct(pctFromAmount(parseFloat(discount) || 0, parseFloat(v) || 0));
    };
    const onPctChange = (v: string) => {
        setDiscountPct(v);
        const base = parseFloat(basePrice) || 0;
        setDiscount(String(Math.round(base * (parseFloat(v) || 0) / 100)));
    };
    const onAmountChange = (v: string) => {
        setDiscount(v);
        setDiscountPct(pctFromAmount(parseFloat(v) || 0, parseFloat(basePrice) || 0));
    };

    const submit = async () => {
        if (!customer) { setError('Lütfen müşteri seçin veya ekleyin.'); return; }
        const base = parseFloat(basePrice) || 0;
        const fin = parseFloat(finalPrice) || 0;
        if (base <= 0 || fin <= 0) { setError('Geçerli bir fiyat girin.'); return; }
        setError('');
        setSaving(true);
        try {
            const label = `Blok ${unit.block} · ${unit.unit_no} · ${unit.floorLabel}`;
            const res = await api.post('/offers', {
                customer_id: customer.id,
                unit_id: unit.system_id,
                base_price: base,
                discount_amount: parseFloat(discount) || 0,
                final_price: fin,
                valid_until: validUntil || null,
                status: 'draft',
                notes: notes.trim() || null,
                offer_items: [{
                    unit_id: unit.system_id,
                    unit_label: label,
                    list_price: base,
                    discount_amount: parseFloat(discount) || 0,
                    final_price: fin,
                    sort_order: 0,
                }],
                active_project_id: projectId,
            });
            const offer = res.data?.data || res.data;
            setCreated({ id: offer.id, offer_no: offer.offer_no, approval_status: offer.approval_status || 'none' });
        } catch (e) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err.response?.data?.message || 'Teklif kaydedilemedi.');
        } finally {
            setSaving(false);
        }
    };

    const downloadPdf = async () => {
        if (!created) return;
        setDownloading(true);
        try {
            const response = await api.get(`/offers/${created.id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Teklif_${created.offer_no}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setError('PDF indirilemedi.');
        } finally {
            setDownloading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[5px] z-[3000] flex items-center justify-center p-4">
            <div className="bg-white border border-[#DDE1E7] border-t-[3px] border-t-[#C8102E] w-[440px] max-w-[95vw] rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="px-5 py-4 border-b border-[#DDE1E7] flex justify-between items-start shrink-0">
                    <div>
                        <div className="font-[Bebas_Neue] text-xl md:text-2xl tracking-[4px] text-[#C8102E] flex items-center gap-2">
                            <Calculator size={18} /> Hızlı Teklif
                        </div>
                        <div className="text-[9px] tracking-[2px] text-[#8892A0] mt-[2px] uppercase">
                            Daire {unit.unit_no} · Blok {unit.block} · {unit.floorLabel}
                        </div>
                    </div>
                    <button className="text-[#8892A0] hover:text-[#C8102E] p-1 -mt-1 -mr-2" onClick={onClose}><X size={20} /></button>
                </div>

                {created ? (
                    /* ── Başarı ekranı ── */
                    <div className="p-6 flex flex-col items-center text-center gap-3">
                        {created.approval_status === 'pending' ? (
                            <>
                                <Clock size={44} className="text-amber-500" />
                                <div className="font-[Bebas_Neue] text-2xl tracking-[2px] text-[#1a1a2e]">Yönetici Onayına Gönderildi</div>
                                <div className="text-[12px] text-[#8892A0]">
                                    Teklif No: <span className="font-bold text-[#1a1a2e]">{created.offer_no}</span><br />
                                    {customerName(customer!)} · {fmtTL(parseFloat(finalPrice) || 0)}
                                </div>
                                <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-[3px] px-3 py-2">
                                    İndirim oranı onay gerektiriyor. Yönetici onayladığında teklif geçerli olur ve PDF alınabilir.
                                </div>
                                <button
                                    className="w-full bg-transparent text-[#8892A0] border border-[#DDE1E7] py-2.5 text-[10px] md:text-[11px] font-semibold tracking-[2px] uppercase rounded-[3px] hover:text-[#1a1a2e] transition-colors mt-1"
                                    onClick={onClose}
                                >Kapat</button>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={44} className="text-emerald-500" />
                                <div className="font-[Bebas_Neue] text-2xl tracking-[2px] text-[#1a1a2e]">Teklif Oluşturuldu</div>
                                <div className="text-[12px] text-[#8892A0]">
                                    Teklif No: <span className="font-bold text-[#1a1a2e]">{created.offer_no}</span><br />
                                    {customerName(customer!)} · {fmtTL(parseFloat(finalPrice) || 0)}
                                </div>
                                {error && <div className="text-[11px] text-red-500">{error}</div>}
                                <div className="flex gap-2 w-full mt-2">
                                    <button
                                        className="flex-1 bg-transparent text-[#8892A0] border border-[#DDE1E7] py-2.5 text-[10px] md:text-[11px] font-semibold tracking-[2px] uppercase rounded-[3px] hover:text-[#1a1a2e] transition-colors"
                                        onClick={onClose}
                                    >Kapat</button>
                                    <button
                                        className="flex-[1.5] bg-[#C8102E] hover:bg-[#E8294A] text-white py-2.5 text-[10px] md:text-[11px] font-bold tracking-[2px] uppercase rounded-[3px] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                                        onClick={downloadPdf}
                                        disabled={downloading}
                                    >
                                        {downloading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                                        PDF İndir
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="p-5 overflow-y-auto space-y-4">

                            {/* ── Müşteri ── */}
                            <div>
                                <label className={labelCls}>Müşteri</label>
                                {customer ? (
                                    <div className="flex items-center justify-between bg-[#fdeef1] border border-[#C8102E]/30 rounded-[3px] px-3 py-2">
                                        <div>
                                            <div className="text-[13px] font-semibold text-[#1a1a2e]">{customerName(customer)}</div>
                                            {customer.phone && <div className="text-[10px] text-[#8892A0]">{customer.phone}</div>}
                                        </div>
                                        <button className="text-[#8892A0] hover:text-[#C8102E] p-1" onClick={() => setCustomer(null)}><X size={14} /></button>
                                    </div>
                                ) : showNewCustomer ? (
                                    <div className="border border-[#DDE1E7] rounded-[3px] p-3 space-y-2 bg-[#f7f8fa]">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input className={inputCls} placeholder="Ad *" value={newCustomer.first_name}
                                                onChange={e => setNewCustomer(p => ({ ...p, first_name: e.target.value }))} />
                                            <input className={inputCls} placeholder="Soyad *" value={newCustomer.last_name}
                                                onChange={e => setNewCustomer(p => ({ ...p, last_name: e.target.value }))} />
                                        </div>
                                        <input className={inputCls} placeholder="Telefon (05xx...)" value={newCustomer.phone}
                                            onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} />
                                        <div className="flex gap-2">
                                            <button className="flex-1 text-[10px] tracking-[1px] uppercase text-[#8892A0] border border-[#DDE1E7] py-1.5 rounded-[3px] hover:text-[#1a1a2e]"
                                                onClick={() => setShowNewCustomer(false)}>Vazgeç</button>
                                            <button className="flex-[1.5] text-[10px] tracking-[1px] uppercase bg-[#C8102E] text-white py-1.5 rounded-[3px] font-bold hover:bg-[#E8294A] disabled:opacity-60 flex items-center justify-center gap-1.5"
                                                onClick={createCustomer} disabled={savingCustomer}>
                                                {savingCustomer && <Loader2 size={11} className="animate-spin" />}
                                                Ekle ve Devam Et
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="relative">
                                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8892A0]" />
                                            <input
                                                className={inputCls + " pl-8"}
                                                placeholder="Müşteri ara (en az 2 karakter)..."
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                                autoFocus
                                            />
                                            {searching && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#8892A0]" />}
                                        </div>
                                        {search.trim().length >= 2 && !searching && (
                                            <div className="mt-1 border border-[#DDE1E7] rounded-[3px] overflow-hidden max-h-44 overflow-y-auto">
                                                {results.length === 0 ? (
                                                    <div className="px-3 py-2.5 text-[11px] text-[#8892A0]">Sonuç bulunamadı</div>
                                                ) : results.map(c => (
                                                    <button key={c.id}
                                                        className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#fdeef1] transition-colors border-b border-black/5 last:border-b-0"
                                                        onClick={() => { setCustomer(c); setSearch(''); setResults([]); }}>
                                                        <span className="font-medium text-[#1a1a2e]">{customerName(c)}</span>
                                                        {c.phone && <span className="text-[10px] text-[#8892A0] ml-2">{c.phone}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            className="mt-2 w-full flex items-center justify-center gap-1.5 border border-dashed border-[#C8102E]/40 text-[#C8102E] text-[10px] font-bold tracking-[1px] uppercase py-2 rounded-[3px] hover:bg-[#fdeef1] transition-colors"
                                            onClick={() => { setShowNewCustomer(true); setError(''); }}
                                        >
                                            <UserPlus size={12} /> Yeni Müşteri Ekle
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* ── Fiyatlandırma ── */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={labelCls}>Liste Fiyatı (₺)</label>
                                    <input type="number" min="0" className={inputCls} value={basePrice}
                                        onChange={e => onBaseChange(e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>İndirim (%)</label>
                                    <input type="number" min="0" max="100" step="0.1" className={inputCls} value={discountPct}
                                        onChange={e => onPctChange(e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>İndirim (₺)</label>
                                    <input type="number" min="0" className={inputCls} value={discount}
                                        onChange={e => onAmountChange(e.target.value)} />
                                </div>
                            </div>
                            {needsApproval && (
                                <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-[3px] px-2.5 py-1.5">
                                    <Clock size={11} className="shrink-0" />
                                    %{APPROVAL_THRESHOLD} üzeri indirim yönetici onayına gönderilir.
                                </div>
                            )}

                            {/* Net fiyat */}
                            <div className="bg-[#fdfaf3] border border-[#DDE1E7] rounded-[3px] px-4 py-3 flex items-center justify-between">
                                <div className="text-[8px] tracking-[2px] uppercase text-[#8892A0]">Net Teklif Fiyatı</div>
                                <div className="font-[Bebas_Neue] text-2xl tracking-[1px] text-[#C8102E]">
                                    {fmtTL(parseFloat(finalPrice) || 0)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Geçerlilik Tarihi</label>
                                    <input type="date" className={inputCls} value={validUntil}
                                        onChange={e => setValidUntil(e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>Not (Opsiyonel)</label>
                                    <input className={inputCls} placeholder="PDF'e eklenecek not..." value={notes}
                                        onChange={e => setNotes(e.target.value)} />
                                </div>
                            </div>

                            {error && <div className="text-[11px] text-red-500 font-medium">{error}</div>}
                        </div>

                        {/* Footer */}
                        <div className="p-5 pt-3 border-t border-[#DDE1E7] flex gap-2 shrink-0">
                            <button className="flex-1 bg-transparent text-[#8892A0] border border-[#DDE1E7] py-2.5 text-[10px] md:text-[11px] font-semibold tracking-[2px] uppercase rounded-[3px] hover:text-[#1a1a2e] transition-colors"
                                onClick={onClose}>İptal</button>
                            <button className="flex-[1.5] bg-[#C8102E] hover:bg-[#E8294A] text-white py-2.5 text-[10px] md:text-[11px] font-bold tracking-[2px] uppercase rounded-[3px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                onClick={submit} disabled={saving}>
                                {saving && <Loader2 size={13} className="animate-spin" />}
                                Teklifi Oluştur
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
