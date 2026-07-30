'use client';

import React from 'react';
import { Offer } from '@/types/project.types';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Download,
    Calendar,
    User,
    Building2,
    Home,
    Tag,
    CreditCard,
    StickyNote,
    UserCircle2,
    CheckCircle2,
    XCircle,
    Clock,
    AlignLeft,
} from 'lucide-react';
import { OfferCreateModal } from './OfferCreateModal';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

interface OfferDetailPanelProps {
    offer: Offer | null;
    open: boolean;
    onClose: () => void;
    onUpdated?: () => void;
}

const OFFER_STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    draft: { label: 'Taslak', icon: <Clock className="w-4 h-4" />, className: 'bg-slate-100 text-slate-600 border-slate-300' },
    sent: { label: 'Gönderildi', icon: <FileText className="w-4 h-4" />, className: 'bg-blue-100 text-blue-700 border-blue-300' },
    accepted: { label: 'Kabul Edildi', icon: <CheckCircle2 className="w-4 h-4" />, className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    rejected: { label: 'Reddedildi', icon: <XCircle className="w-4 h-4" />, className: 'bg-red-100 text-red-600 border-red-300' },
};

const APPROVAL_MAP: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    pending: { label: 'İndirim Onayı Bekliyor', icon: <Clock className="w-3.5 h-3.5" />, className: 'bg-amber-100 text-amber-700 border-amber-300' },
    approved: { label: 'İndirim Onaylandı', icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    rejected: { label: 'İndirim Reddedildi', icon: <XCircle className="w-3.5 h-3.5" />, className: 'bg-red-100 text-red-600 border-red-300' },
};

const formatMoney = (amount?: number | null) => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
            <div className="shrink-0 text-slate-400 mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 leading-none mb-0.5">{label}</p>
                <div className="text-sm font-medium text-slate-800 break-words">{value || <span className="text-slate-400 font-normal">Belirtilmemiş</span>}</div>
            </div>
        </div>
    );
}

export function OfferDetailPanel({ offer, open, onClose, onUpdated }: OfferDetailPanelProps) {
    const user = useAuthStore(s => s.user);
    const [approvalLoading, setApprovalLoading] = React.useState<'approve' | 'reject' | null>(null);

    if (!offer) return null;

    const isManager = user?.roles?.some(r => r.name === 'Admin' || r.name === 'Project Manager') ?? false;
    const approvalStatus = offer.approval_status ?? 'none';
    const approvalCfg = APPROVAL_MAP[approvalStatus];

    const handleApproval = async (action: 'approve' | 'reject') => {
        setApprovalLoading(action);
        try {
            await api.post(`/offers/${offer.id}/${action}`);
            toast.success(action === 'approve' ? 'İndirim onaylandı.' : 'İndirim reddedildi.');
            onUpdated?.();
            onClose();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message ?? 'İşlem başarısız.');
        } finally {
            setApprovalLoading(null);
        }
    };

    const statusCfg = OFFER_STATUS_MAP[offer.status] || { label: offer.status, icon: null, className: 'bg-slate-100 text-slate-600' };

    const customerName = offer.customer
        ? (offer.customer.type === 'corporate'
            ? offer.customer.company_name
            : `${offer.customer.first_name} ${offer.customer.last_name}`)
        : null;

    const unitLabel = offer.unit
        ? `${(offer.unit as any).block?.name || '?'} Blok / No: ${offer.unit.unit_no}`
        : null;

    const handlePdf = async () => {
        try {
            const response = await api.get(`/offers/${offer.id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Teklif_${offer.offer_no}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('PDF indirilemedi');
        }
    };

    const discountPercent = offer.base_price > 0 && offer.discount_amount > 0
        ? ((offer.discount_amount / offer.base_price) * 100).toFixed(1)
        : null;

    // Minimal lead object needed by OfferCreateModal
    const fakeLead = { id: offer.lead_id, customer_id: offer.customer_id, title: offer.offer_no } as any;

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-[500px] sm:max-w-[500px] p-0 flex flex-col h-screen bg-slate-50/50 overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b px-6 py-5 shrink-0 shadow-sm">
                    <SheetHeader>
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-3 rounded-xl shrink-0 mt-0.5">
                                <FileText className="h-7 w-7 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <SheetTitle className="text-xl font-bold text-slate-800 leading-tight">
                                    {offer.offer_no}
                                </SheetTitle>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Badge variant="outline" className={`flex items-center gap-1 text-xs ${statusCfg.className}`}>
                                        {statusCfg.icon}
                                        {statusCfg.label}
                                    </Badge>
                                    {approvalCfg && (
                                        <Badge variant="outline" className={`flex items-center gap-1 text-xs ${approvalCfg.className}`}>
                                            {approvalCfg.icon}
                                            {approvalCfg.label}
                                        </Badge>
                                    )}
                                    {offer.created_at && (
                                        <span className="text-xs text-slate-400">
                                            {new Date(offer.created_at).toLocaleDateString('tr-TR')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-5 space-y-4">

                        {/* İndirim Onayı Kartı */}
                        {approvalStatus === 'pending' && (
                            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                                <h3 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    İndirim Onayı Bekliyor
                                </h3>
                                <p className="text-xs text-amber-700 mb-3">
                                    Bu teklifte %5&apos;in üzerinde indirim var{discountPercent ? ` (%${discountPercent})` : ''}.
                                    {isManager ? ' Onaylanana kadar PDF alınamaz.' : ' Yönetici onaylayana kadar PDF alınamaz.'}
                                </p>
                                {isManager && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                                            disabled={approvalLoading !== null}
                                            onClick={() => handleApproval('approve')}
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            {approvalLoading === 'approve' ? 'Onaylanıyor...' : 'İndirimi Onayla'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                                            disabled={approvalLoading !== null}
                                            onClick={() => handleApproval('reject')}
                                        >
                                            <XCircle className="w-4 h-4" />
                                            {approvalLoading === 'reject' ? 'Reddediliyor...' : 'Reddet'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                        {approvalStatus === 'rejected' && (
                            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                                <h3 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    İndirim Reddedildi
                                </h3>
                                <p className="text-xs text-red-600">
                                    {(offer.approver as { name?: string } | null)?.name ? `${(offer.approver as { name?: string }).name} tarafından reddedildi. ` : ''}
                                    İndirimi güncelleyip tekrar kaydedin.
                                </p>
                            </div>
                        )}
                        {approvalStatus === 'approved' && (offer.approver as { name?: string } | null)?.name && (
                            <div className="bg-emerald-50 rounded-xl border border-emerald-200 px-4 py-3 text-xs text-emerald-700 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                İndirim {(offer.approver as { name?: string }).name} tarafından onaylandı
                                {offer.approved_at ? ` (${new Date(offer.approved_at).toLocaleDateString('tr-TR')})` : ''}.
                            </div>
                        )}

                        {/* Pricing Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-primary" />
                                Fiyatlandırma
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Liste / Baz Fiyat</span>
                                    <span className="text-sm font-medium text-slate-700">{formatMoney(offer.base_price)}</span>
                                </div>
                                {offer.discount_amount > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">
                                            İndirim {discountPercent ? `(${discountPercent}%)` : ''}
                                        </span>
                                        <span className="text-sm font-medium text-red-500">-{formatMoney(offer.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                    <span className="text-sm font-semibold text-slate-800">Net Teklif Fiyatı</span>
                                    <span className="text-lg font-bold text-slate-900">{formatMoney(offer.final_price)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Müşteri & Ünite */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                Müşteri & Ünite Bilgileri
                            </h3>
                            <InfoRow
                                icon={offer.customer?.type === 'corporate' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                label="Müşteri"
                                value={customerName}
                            />
                            {offer.customer?.phone && (
                                <InfoRow icon={<Tag className="w-4 h-4" />} label="Telefon" value={offer.customer.phone} />
                            )}
                            {offer.customer?.email && (
                                <InfoRow icon={<Tag className="w-4 h-4" />} label="E-Posta" value={offer.customer.email} />
                            )}
                            <InfoRow
                                icon={<Home className="w-4 h-4" />}
                                label="İlgilenilen Ünite"
                                value={unitLabel}
                            />
                            {offer.unit && (
                                <InfoRow
                                    icon={<AlignLeft className="w-4 h-4" />}
                                    label="Ünite Tipi / Alan"
                                    value={[offer.unit.unit_type, offer.unit.net_area ? `${offer.unit.net_area} m² net` : null].filter(Boolean).join(' — ') || undefined}
                                />
                            )}
                        </div>

                        {/* Teklif Detayları */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                Teklif Detayları
                            </h3>
                            <InfoRow
                                icon={<Calendar className="w-4 h-4" />}
                                label="Geçerlilik Tarihi"
                                value={offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('tr-TR') : undefined}
                            />
                            <InfoRow
                                icon={<UserCircle2 className="w-4 h-4" />}
                                label="Hazırlayan"
                                value={(offer as any).creator?.name}
                            />
                            <InfoRow
                                icon={<Calendar className="w-4 h-4" />}
                                label="Oluşturma Tarihi"
                                value={offer.created_at ? new Date(offer.created_at).toLocaleDateString('tr-TR') : undefined}
                            />
                        </div>

                        {/* Ödeme Planı */}
                        {offer.payment_plan && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                    Ödeme Planı
                                </h3>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                    {typeof offer.payment_plan === 'string' ? offer.payment_plan : JSON.stringify(offer.payment_plan, null, 2)}
                                </p>
                            </div>
                        )}

                        {/* Notlar */}
                        {offer.notes && (
                            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                                <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                                    <StickyNote className="w-4 h-4" />
                                    Özel Notlar
                                </h3>
                                <p className="text-sm text-amber-700 whitespace-pre-wrap leading-relaxed">{offer.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-white border-t px-5 py-4 flex gap-3 shrink-0">
                    <Button
                        variant="outline"
                        className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/5"
                        onClick={handlePdf}
                        disabled={approvalStatus === 'pending' || approvalStatus === 'rejected'}
                        title={approvalStatus === 'pending' ? 'İndirim onaylanana kadar PDF alınamaz' : approvalStatus === 'rejected' ? 'İndirim reddedildi, güncelleme gerekli' : undefined}
                    >
                        <Download className="w-4 h-4" />
                        PDF İndir
                    </Button>
                    <OfferCreateModal
                        lead={fakeLead}
                        editOffer={offer}
                        onSuccess={onUpdated}
                        trigger={
                            <Button className="flex-1 gap-2">
                                <FileText className="w-4 h-4" />
                                Teklifi Düzenle
                            </Button>
                        }
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
