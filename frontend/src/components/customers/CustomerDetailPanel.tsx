'use client';

import React, { useEffect, useState } from 'react';
import { Customer, Lead, Offer } from '@/types/project.types';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, User2, Mail, Phone, MapPin, FileText, Target, Calendar, Download, Loader2, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CustomerDetailPanelProps {
    customer: Customer | null;
    open: boolean;
    onClose: () => void;
}

const LEAD_STATUS_MAP: Record<string, { label: string; className: string }> = {
    new: { label: 'Yeni', className: 'bg-blue-100 text-blue-700' },
    contacted: { label: 'İletişim', className: 'bg-amber-100 text-amber-700' },
    qualified: { label: 'Nitelikli', className: 'bg-indigo-100 text-indigo-700' },
    proposal: { label: 'Teklif Verildi', className: 'bg-purple-100 text-purple-700' },
    won: { label: 'Kazanıldı', className: 'bg-emerald-100 text-emerald-700' },
    lost: { label: 'Kaybedildi', className: 'bg-red-100 text-red-600' },
};

const OFFER_STATUS_MAP: Record<string, { label: string; className: string }> = {
    draft: { label: 'Taslak', className: 'bg-slate-100 text-slate-600' },
    sent: { label: 'Gönderildi', className: 'bg-blue-100 text-blue-700' },
    accepted: { label: 'Kabul', className: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Reddedildi', className: 'bg-red-100 text-red-600' },
};

const formatMoney = (amount?: number | null) => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

export function CustomerDetailPanel({ customer, open, onClose }: CustomerDetailPanelProps) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [loadingOffers, setLoadingOffers] = useState(false);

    useEffect(() => {
        if (!customer || !open) return;

        setLoadingLeads(true);
        api.get('/leads', { params: { customer_id: customer.id } })
            .then(r => setLeads(r.data.data || []))
            .catch(() => setLeads([]))
            .finally(() => setLoadingLeads(false));

        setLoadingOffers(true);
        api.get('/offers', { params: { customer_id: customer.id } })
            .then(r => setOffers(r.data.data || []))
            .catch(() => setOffers([]))
            .finally(() => setLoadingOffers(false));
    }, [customer, open]);

    if (!customer) return null;

    const router = useRouter();

    const downloadPdf = async (offerId: number, offerNo: string) => {
        try {
            const response = await api.get(`/offers/${offerId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Teklif_${offerNo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('PDF indirilemedi');
        }
    };

    const customerName = customer.type === 'corporate'
        ? customer.company_name
        : `${customer.first_name} ${customer.last_name}`;

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-[1000px] sm:max-w-[1000px] p-0 flex flex-col h-screen bg-slate-50/50 overflow-hidden">
                <div className="bg-white border-b px-6 py-5 shrink-0">
                    <SheetHeader>
                        <div className="flex items-center space-x-4">
                            <div className="bg-slate-100 p-3 rounded-xl">
                                {customer.type === 'corporate'
                                    ? <Building2 className="h-8 w-8 text-blue-600" />
                                    : <User2 className="h-8 w-8 text-emerald-600" />
                                }
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-bold text-slate-800">{customerName}</SheetTitle>
                                <SheetDescription className="text-slate-500 mt-1 flex items-center space-x-2 border border-slate-200 bg-slate-50 rounded-md px-2 py-0.5 w-max">
                                    <span className="font-medium text-xs">
                                        {customer.type === 'corporate' ? 'Kurumsal Müşteri' : 'Bireysel Müşteri'}
                                    </span>
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                    <Tabs defaultValue="details" className="h-full flex flex-col w-full">
                        <div className="px-6 pt-3 bg-white border-b shrink-0">
                            <TabsList className="bg-transparent border-b-0 space-x-6 h-auto p-0">
                                <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none pb-3 px-1 text-sm font-medium text-slate-500 data-[state=active]:text-primary">
                                    Genel Detaylar
                                </TabsTrigger>
                                <TabsTrigger value="leads" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none pb-3 px-1 text-sm font-medium text-slate-500 data-[state=active]:text-primary">
                                    Fırsatlar
                                    <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs font-mono">{customer.leads_count || leads.length || 0}</span>
                                </TabsTrigger>
                                <TabsTrigger value="offers" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none pb-3 px-1 text-sm font-medium text-slate-500 data-[state=active]:text-primary">
                                    Teklifler
                                    <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs font-mono">{customer.offers_count || offers.length || 0}</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="p-6">
                                    {/* Genel Detaylar */}
                                    <TabsContent value="details" className="m-0 focus-visible:outline-none data-[state=active]:block">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-6">
                                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                                                    <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">İletişim Bilgileri</h3>
                                                    <div className="space-y-4">
                                                        <div className="flex items-start">
                                                            <Phone className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">{customer.phone || 'Girilmemiş'}</p>
                                                                <p className="text-xs text-slate-500">Telefon</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start">
                                                            <Mail className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">{customer.email || 'Girilmemiş'}</p>
                                                                <p className="text-xs text-slate-500">E-posta</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                                                    <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">Adres Bilgileri</h3>
                                                    <div className="flex items-start">
                                                        <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-sm text-slate-800 whitespace-pre-wrap">{customer.address || 'Girilmemiş'}</p>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                {[customer.district, customer.city, customer.country].filter(Boolean).join(' / ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                {customer.type === 'corporate' && (
                                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                                                        <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">Vergi Bilgileri</h3>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">{customer.tax_office || 'Girilmemiş'}</p>
                                                                <p className="text-xs text-slate-500">Vergi Dairesi</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">{customer.tax_number || 'Girilmemiş'}</p>
                                                                <p className="text-xs text-slate-500">Vergi No</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Fırsatlar Tab */}
                                    <TabsContent value="leads" className="m-0">
                                        {loadingLeads ? (
                                            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary/60" /></div>
                                        ) : leads.length === 0 ? (
                                            <div className="bg-white rounded-xl border border-slate-100 p-10 text-center text-slate-500">
                                                <Target className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                                Bu müşteriye ait kayıtlı fırsat bulunmuyor.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {leads.map(lead => {
                                                    const sc = LEAD_STATUS_MAP[lead.status] || { label: lead.status, className: 'bg-slate-100 text-slate-600' };
                                                    return (
                                                        <div key={lead.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                                                            <div className="flex items-start gap-3">
                                                                <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                                                                    <Target className="w-4 h-4 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-800 text-sm">{lead.title}</p>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <Badge className={`text-xs ${sc.className} shadow-none`}>{sc.label}</Badge>
                                                                        {lead.expected_value && (
                                                                            <span className="text-xs text-slate-500">{formatMoney(lead.expected_value)}</span>
                                                                        )}
                                                                        {lead.created_at && (
                                                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                                                <Calendar className="w-3 h-3" />
                                                                                {new Date(lead.created_at).toLocaleDateString('tr-TR')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="gap-1.5 text-slate-500 hover:text-primary shrink-0"
                                                                title="Fırsatlar sayfasına git"
                                                                onClick={() => { onClose(); router.push('/crm'); }}
                                                            >
                                                                <ArrowRight className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Teklifler Tab */}
                                    <TabsContent value="offers" className="m-0">
                                        {loadingOffers ? (
                                            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary/60" /></div>
                                        ) : offers.length === 0 ? (
                                            <div className="bg-white rounded-xl border border-slate-100 p-10 text-center text-slate-500">
                                                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                                Bu müşteriye ait kayıtlı teklif bulunmuyor.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {offers.map(offer => {
                                                    const oc = OFFER_STATUS_MAP[offer.status] || { label: offer.status, className: 'bg-slate-100 text-slate-600' };
                                                    return (
                                                        <div key={offer.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                                                            <div className="flex items-start gap-3">
                                                                <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                                                                    <FileText className="w-4 h-4 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-800 text-sm">{offer.offer_no}</p>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <Badge variant="outline" className={`text-xs ${oc.className} border-0`}>{oc.label}</Badge>
                                                                        <span className="text-xs font-medium text-slate-700">{formatMoney(offer.final_price)}</span>
                                                                        {offer.valid_until && (
                                                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                                                <Calendar className="w-3 h-3" />
                                                                                {new Date(offer.valid_until).toLocaleDateString('tr-TR')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="gap-1.5 text-primary hover:text-primary shrink-0"
                                                                onClick={() => downloadPdf(offer.id, offer.offer_no)}
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                                PDF
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </div>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
