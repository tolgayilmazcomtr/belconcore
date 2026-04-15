'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Plus, Trash2, RefreshCw, TrendingUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

export interface PaymentItem {
    no: number;
    description: string;
    month_offset: number; // months from offer date (0 = today)
    real_amount: number;  // purchasing power in today's money
    nominal_amount: number; // actual TRY amount on payment date
    date: string;         // formatted date string
}

export interface PaymentPlanData {
    type: 'downpayment_only' | 'lump_sum' | 'equal_installments' | 'fixed_amount' | 'custom';
    monthly_inflation_rate: number;
    offer_date: string;
    total_real: number;
    total_nominal: number;
    items: PaymentItem[];
}

interface PaymentPlanBuilderProps {
    finalPrice: number;
    offerDate?: string; // ISO string, defaults to today
    value: string; // JSON string
    onChange: (jsonValue: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmt(n: number) {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n));
}

function inflatedAmount(real: number, monthlyRate: number, months: number): number {
    return real * Math.pow(1 + monthlyRate / 100, months);
}

// ─── Component ────────────────────────────────────────────────────────

export function PaymentPlanBuilder({ finalPrice, offerDate, value, onChange }: PaymentPlanBuilderProps) {
    const today = offerDate || new Date().toISOString().split('T')[0];

    const [monthlyRate, setMonthlyRate] = useState(3.5);
    const [planType, setPlanType] = useState<PaymentPlanData['type']>('equal_installments');
    const [downPayment, setDownPayment] = useState('');
    const [installmentCount, setInstallmentCount] = useState('12');
    const [firstInstallmentMonth, setFirstInstallmentMonth] = useState('1');
    const [fixedMonthlyAmount, setFixedMonthlyAmount] = useState('');
    const [lumpSumMonth, setLumpSumMonth] = useState('12');
    const [customItems, setCustomItems] = useState<{ description: string; month_offset: number; nominal_amount: number }[]>([]);
    const [planData, setPlanData] = useState<PaymentPlanData | null>(null);
    const [isBuilt, setIsBuilt] = useState(false);

    // Parse existing value on mount
    useEffect(() => {
        if (value) {
            try {
                const parsed = JSON.parse(value) as PaymentPlanData;
                if (parsed.items && parsed.items.length > 0) {
                    setPlanData(parsed);
                    setIsBuilt(true);
                    setMonthlyRate(parsed.monthly_inflation_rate ?? 3.5);
                    setPlanType(parsed.type ?? 'equal_installments');
                }
            } catch {
                // plain text - ignore
            }
        }
    }, []);

    const buildPlan = useCallback(() => {
        const dp = parseFloat(downPayment) || 0;
        const remaining = finalPrice - dp;
        const items: PaymentItem[] = [];

        if (dp > 0) {
            items.push({
                no: 1,
                description: 'Peşinat',
                month_offset: 0,
                real_amount: dp,
                nominal_amount: dp,
                date: addMonths(today, 0),
            });
        }

        if (planType === 'downpayment_only') {
            // nothing more to add
        } else if (planType === 'lump_sum') {
            const m = parseInt(lumpSumMonth) || 12;
            const nominal = inflatedAmount(remaining, monthlyRate, m);
            items.push({
                no: items.length + 1,
                description: `${m}. Ay Tek Ödeme`,
                month_offset: m,
                real_amount: remaining,
                nominal_amount: nominal,
                date: addMonths(today, m),
            });
        } else if (planType === 'equal_installments') {
            const n = parseInt(installmentCount) || 12;
            const startM = parseInt(firstInstallmentMonth) || 1;
            const realEach = remaining / n;
            for (let i = 0; i < n; i++) {
                const m = startM + i;
                const nominal = inflatedAmount(realEach, monthlyRate, m);
                items.push({
                    no: items.length + 1,
                    description: `${i + 1}. Taksit`,
                    month_offset: m,
                    real_amount: realEach,
                    nominal_amount: nominal,
                    date: addMonths(today, m),
                });
            }
        } else if (planType === 'fixed_amount') {
            const fixedNominal = parseFloat(fixedMonthlyAmount) || 0;
            const startM = parseInt(firstInstallmentMonth) || 1;
            if (fixedNominal > 0) {
                let collected = 0;
                let month = startM;
                let count = 0;
                // max 240 months safeguard
                while (collected < remaining && count < 240) {
                    const realValue = fixedNominal / Math.pow(1 + monthlyRate / 100, month);
                    const isLast = collected + realValue >= remaining;
                    const thisReal = isLast ? remaining - collected : realValue;
                    const thisNominal = isLast ? inflatedAmount(thisReal, monthlyRate, month) : fixedNominal;
                    items.push({
                        no: items.length + 1,
                        description: `${count + 1}. Taksit`,
                        month_offset: month,
                        real_amount: thisReal,
                        nominal_amount: thisNominal,
                        date: addMonths(today, month),
                    });
                    collected += thisReal;
                    if (isLast) break;
                    month++;
                    count++;
                }
            }
        } else if (planType === 'custom') {
            customItems.forEach((ci, i) => {
                const realValue = ci.nominal_amount / Math.pow(1 + monthlyRate / 100, ci.month_offset);
                items.push({
                    no: items.length + 1,
                    description: ci.description || `${i + 1}. Ödeme`,
                    month_offset: ci.month_offset,
                    real_amount: realValue,
                    nominal_amount: ci.nominal_amount,
                    date: addMonths(today, ci.month_offset),
                });
            });
        }

        const totalReal = items.reduce((s, x) => s + x.real_amount, 0);
        const totalNominal = items.reduce((s, x) => s + x.nominal_amount, 0);

        const data: PaymentPlanData = {
            type: planType,
            monthly_inflation_rate: monthlyRate,
            offer_date: today,
            total_real: totalReal,
            total_nominal: totalNominal,
            items,
        };

        setPlanData(data);
        setIsBuilt(true);
        onChange(JSON.stringify(data));
    }, [planType, downPayment, monthlyRate, installmentCount, firstInstallmentMonth, fixedMonthlyAmount, lumpSumMonth, customItems, finalPrice, today, onChange]);

    const clearPlan = () => {
        setPlanData(null);
        setIsBuilt(false);
        onChange('');
    };

    const annualRate = ((Math.pow(1 + monthlyRate / 100, 12) - 1) * 100).toFixed(1);
    const dp = parseFloat(downPayment) || 0;
    const remaining = finalPrice - dp;
    const dpPct = finalPrice > 0 ? ((dp / finalPrice) * 100).toFixed(0) : '0';

    return (
        <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-sm text-slate-800">Gelişmiş Ödeme Planı</span>
                    <span className="text-xs text-slate-400">(enflasyon korumalı)</span>
                </div>
                {isBuilt && (
                    <Button variant="ghost" size="sm" onClick={clearPlan} className="h-7 text-xs text-slate-500">
                        <RefreshCw className="w-3 h-3 mr-1" /> Sıfırla
                    </Button>
                )}
            </div>

            {/* Inflation rate */}
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-xs text-amber-700 font-medium">Aylık Enflasyon Oranı:</span>
                <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={monthlyRate}
                    onChange={e => setMonthlyRate(parseFloat(e.target.value) || 0)}
                    className="h-7 w-20 text-xs bg-white border-amber-200"
                />
                <span className="text-xs text-amber-600">% / ay</span>
                <span className="text-xs text-amber-500 ml-auto">≈ yıllık %{annualRate}</span>
            </div>

            {/* Plan type tabs */}
            <div className="flex gap-1 flex-wrap">
                {([
                    { key: 'downpayment_only', label: 'Tam Peşin' },
                    { key: 'lump_sum', label: 'Tek Seferlik' },
                    { key: 'equal_installments', label: 'Eşit Taksit' },
                    { key: 'fixed_amount', label: 'Sabit Tutar' },
                    { key: 'custom', label: 'Özel Plan' },
                ] as const).map(t => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => { setPlanType(t.key); setIsBuilt(false); }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${planType === t.key ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:border-primary/40'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
                {/* Down payment - always shown */}
                <div className="space-y-1">
                    <Label className="text-xs">
                        Peşinat (₺)
                        {finalPrice > 0 && dp > 0 && (
                            <span className="ml-1 text-emerald-600">%{dpPct}</span>
                        )}
                    </Label>
                    <Input
                        type="number"
                        min="0"
                        max={finalPrice}
                        step="1000"
                        value={downPayment}
                        onChange={e => { setDownPayment(e.target.value); setIsBuilt(false); }}
                        placeholder="0"
                        className="h-8 text-sm bg-white"
                    />
                    {finalPrice > 0 && dp > 0 && (
                        <p className="text-xs text-slate-400">Kalan: {fmt(remaining)} ₺</p>
                    )}
                </div>

                {/* Plan-specific inputs */}
                {planType === 'lump_sum' && (
                    <div className="space-y-1">
                        <Label className="text-xs">Ödeme Ayı (kaçıncı ay)</Label>
                        <Input type="number" min="1" value={lumpSumMonth}
                            onChange={e => { setLumpSumMonth(e.target.value); setIsBuilt(false); }}
                            className="h-8 text-sm bg-white" />
                        {remaining > 0 && (
                            <p className="text-xs text-amber-600">
                                ≈ {fmt(inflatedAmount(remaining, monthlyRate, parseInt(lumpSumMonth) || 12))} ₺ ({lumpSumMonth}. ayda)
                            </p>
                        )}
                    </div>
                )}

                {planType === 'equal_installments' && (
                    <>
                        <div className="space-y-1">
                            <Label className="text-xs">Taksit Sayısı</Label>
                            <Input type="number" min="1" max="360" value={installmentCount}
                                onChange={e => { setInstallmentCount(e.target.value); setIsBuilt(false); }}
                                className="h-8 text-sm bg-white" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">İlk Taksit (kaçıncı ay)</Label>
                            <Input type="number" min="1" value={firstInstallmentMonth}
                                onChange={e => { setFirstInstallmentMonth(e.target.value); setIsBuilt(false); }}
                                className="h-8 text-sm bg-white" />
                            {remaining > 0 && parseInt(installmentCount) > 0 && (
                                <p className="text-xs text-amber-600">
                                    İlk taksit ≈ {fmt(inflatedAmount(remaining / parseInt(installmentCount), monthlyRate, parseInt(firstInstallmentMonth) || 1))} ₺
                                </p>
                            )}
                        </div>
                    </>
                )}

                {planType === 'fixed_amount' && (
                    <>
                        <div className="space-y-1">
                            <Label className="text-xs">Aylık Taksit Tutarı (₺)</Label>
                            <Input type="number" min="0" step="1000" value={fixedMonthlyAmount}
                                onChange={e => { setFixedMonthlyAmount(e.target.value); setIsBuilt(false); }}
                                placeholder="40.000"
                                className="h-8 text-sm bg-white" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">İlk Taksit (kaçıncı ay)</Label>
                            <Input type="number" min="1" value={firstInstallmentMonth}
                                onChange={e => { setFirstInstallmentMonth(e.target.value); setIsBuilt(false); }}
                                className="h-8 text-sm bg-white" />
                        </div>
                    </>
                )}
            </div>

            {/* Custom plan rows */}
            {planType === 'custom' && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs">Ödeme Satırları</Label>
                        <Button type="button" size="sm" variant="outline"
                            className="h-6 text-xs"
                            onClick={() => setCustomItems(prev => [...prev, { description: '', month_offset: 0, nominal_amount: 0 }])}>
                            <Plus className="w-3 h-3 mr-1" /> Satır Ekle
                        </Button>
                    </div>
                    {customItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <Input
                                placeholder="Açıklama"
                                value={item.description}
                                onChange={e => {
                                    const copy = [...customItems];
                                    copy[idx].description = e.target.value;
                                    setCustomItems(copy);
                                    setIsBuilt(false);
                                }}
                                className="h-7 text-xs flex-1"
                            />
                            <Input
                                type="number"
                                placeholder="Ay"
                                value={item.month_offset}
                                onChange={e => {
                                    const copy = [...customItems];
                                    copy[idx].month_offset = parseInt(e.target.value) || 0;
                                    setCustomItems(copy);
                                    setIsBuilt(false);
                                }}
                                className="h-7 text-xs w-16"
                            />
                            <Input
                                type="number"
                                placeholder="Tutar ₺"
                                value={item.nominal_amount}
                                onChange={e => {
                                    const copy = [...customItems];
                                    copy[idx].nominal_amount = parseFloat(e.target.value) || 0;
                                    setCustomItems(copy);
                                    setIsBuilt(false);
                                }}
                                className="h-7 text-xs w-28"
                            />
                            <button type="button"
                                onClick={() => { setCustomItems(customItems.filter((_, i) => i !== idx)); setIsBuilt(false); }}
                                className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Build button */}
            <Button
                type="button"
                onClick={buildPlan}
                disabled={finalPrice <= 0}
                className="w-full h-9 text-sm"
                variant={isBuilt ? 'outline' : 'default'}
            >
                <Calculator className="w-4 h-4 mr-2" />
                {isBuilt ? 'Planı Yeniden Hesapla' : 'Ödeme Planını Oluştur'}
            </Button>

            {/* Plan preview table */}
            {isBuilt && planData && planData.items.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span>{planData.items.length} ödeme kalemi</span>
                        <span>Toplam nominal: <strong className="text-slate-800">{fmt(planData.total_nominal)} ₺</strong></span>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-800 text-white">
                                    <th className="text-left px-2 py-1.5 font-medium">#</th>
                                    <th className="text-left px-2 py-1.5 font-medium">Açıklama</th>
                                    <th className="text-left px-2 py-1.5 font-medium">Tarih</th>
                                    <th className="text-right px-2 py-1.5 font-medium">Bugünkü Değer</th>
                                    <th className="text-right px-2 py-1.5 font-medium">Ödeme Tutarı ₺</th>
                                </tr>
                            </thead>
                            <tbody>
                                {planData.items.map((item, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className="px-2 py-1 text-slate-400">{item.no}</td>
                                        <td className="px-2 py-1 font-medium text-slate-700">{item.description}</td>
                                        <td className="px-2 py-1 text-slate-500">{item.date}</td>
                                        <td className="px-2 py-1 text-right text-slate-500">{fmt(item.real_amount)} ₺</td>
                                        <td className="px-2 py-1 text-right font-semibold text-slate-800">
                                            {fmt(item.nominal_amount)} ₺
                                            {item.month_offset > 0 && (
                                                <span className="ml-1 text-amber-500 font-normal">
                                                    (+{((item.nominal_amount / item.real_amount - 1) * 100).toFixed(1)}%)
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-100 border-t-2 border-slate-300">
                                    <td colSpan={3} className="px-2 py-1.5 font-bold text-slate-700 text-xs">TOPLAM</td>
                                    <td className="px-2 py-1.5 text-right font-medium text-slate-500 text-xs">{fmt(planData.total_real)} ₺</td>
                                    <td className="px-2 py-1.5 text-right font-bold text-slate-800 text-xs">{fmt(planData.total_nominal)} ₺</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    {finalPrice > 0 && Math.abs(planData.total_real - finalPrice) > 1 && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                            Dikkat: Planın bugünkü değeri ({fmt(planData.total_real)} ₺) teklif fiyatından ({fmt(finalPrice)} ₺) farklı.
                        </p>
                    )}
                    {finalPrice > 0 && Math.abs(planData.total_real - finalPrice) <= 1 && (
                        <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                            Teklif fiyatıyla uyumlu. Enflasyon koruması hesaplandı.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
