'use client';

import React from 'react';
import { Lead } from '@/types/project.types';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Target, User, Building, MapPin, SearchCheck, AlignLeft } from 'lucide-react';

interface LeadDetailPanelProps {
    lead: Lead | null;
    open: boolean;
    onClose: () => void;
}

export function LeadDetailPanel({ lead, open, onClose }: LeadDetailPanelProps) {
    if (!lead) return null;

    const formatMoney = (amount?: number) => {
        if (!amount) return 'Belirtilmemiş';
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
            case 'contacted': return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
            case 'qualified': return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100';
            case 'proposal': return 'bg-purple-100 text-purple-700 hover:bg-purple-100';
            case 'won': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
            case 'lost': return 'bg-red-100 text-red-700 hover:bg-red-100';
            default: return 'bg-slate-100 text-slate-700 hover:bg-slate-100';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'new': return 'Yeni';
            case 'contacted': return 'İletişime Geçildi';
            case 'qualified': return 'Nitelikli/İlgili';
            case 'proposal': return 'Teklif Verildi';
            case 'won': return 'Kazanıldı';
            case 'lost': return 'Kaybedildi';
            default: return status;
        }
    };

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-[1000px] sm:max-w-[1000px] p-0 flex flex-col h-full bg-slate-50/50">
                <div className="bg-white border-b px-6 py-5 shrink-0 shadow-sm relative z-10">
                    <SheetHeader>
                        <div className="flex items-center space-x-4">
                            <div className="bg-slate-100 p-3 rounded-xl">
                                <Target className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1">
                                <SheetTitle className="text-2xl font-bold text-slate-800 leading-tight">
                                    {lead.title}
                                </SheetTitle>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge className={`${getStatusBadgeColor(lead.status)} shadow-none font-medium`}>
                                        {getStatusText(lead.status)}
                                    </Badge>
                                    <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                        {formatMoney(lead.expected_value)}
                                    </span>
                                    {lead.created_at && (
                                        <span className="text-xs text-slate-400">
                                            Açılış: {new Date(lead.created_at).toLocaleDateString('tr-TR')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                    <Tabs defaultValue="details" className="h-full flex flex-col w-full data-[state=active]:flex-1">
                        <div className="px-6 pt-3 bg-white border-b">
                            <TabsList className="bg-transparent border-b-0 space-x-6 h-auto p-0">
                                <TabsTrigger
                                    value="details"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none pb-3 px-1 text-sm font-medium text-slate-500 data-[state=active]:text-primary"
                                >
                                    Genel Detaylar
                                </TabsTrigger>
                                <TabsTrigger
                                    value="activities"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none pb-3 px-1 text-sm font-medium text-slate-500 data-[state=active]:text-primary"
                                >
                                    Görüşmeler (Zaman Tüneli)
                                </TabsTrigger>
                                <TabsTrigger
                                    value="offers"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none pb-3 px-1 text-sm font-medium text-slate-500 data-[state=active]:text-primary"
                                >
                                    Teklifler
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="p-6">
                                    <TabsContent value="details" className="m-0 focus-visible:outline-none data-[state=active]:block space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            {/* Left Column */}
                                            <div className="space-y-6">
                                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                                                    <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">Müşteri ve Birim Bilgileri</h3>
                                                    <div className="space-y-4">
                                                        <div className="flex items-start">
                                                            {lead.customer?.type === 'corporate' ? (
                                                                <Building className="w-5 h-5 text-blue-500 mr-3 mt-0.5 shrink-0" />
                                                            ) : (
                                                                <User className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 shrink-0" />
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">
                                                                    {lead.customer
                                                                        ? (lead.customer.type === 'corporate' ? lead.customer.company_name : `${lead.customer.first_name} ${lead.customer.last_name}`)
                                                                        : 'Müşteri Bağlantısı Yok'}
                                                                </p>
                                                                <p className="text-xs text-slate-500">Müşteri</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start">
                                                            <MapPin className="w-5 h-5 text-indigo-400 mr-3 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">
                                                                    {lead.unit ? `Blok: ${(lead.unit as any).block?.name || '-'} / No: ${lead.unit.unit_no}` : 'Birim Belirtilmemiş'}
                                                                </p>
                                                                <p className="text-xs text-slate-500">İlgilendiği Birim</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-6">
                                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                                                    <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">Ek Bilgiler</h3>
                                                    <div className="space-y-4">
                                                        <div className="flex items-start">
                                                            <SearchCheck className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800 capitalize">
                                                                    {lead.source ? lead.source.replace('_', ' ') : 'Belirtilmemiş'}
                                                                </p>
                                                                <p className="text-xs text-slate-500">Kaynak</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start">
                                                            <AlignLeft className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-sm text-slate-800 whitespace-pre-wrap">
                                                                    {lead.description || 'Açıklama veya not bulunmuyor.'}
                                                                </p>
                                                                <p className="text-xs text-slate-500 mt-1">Notlar</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="activities" className="m-0 h-full">
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
                                            <p className="text-slate-500">Bu fırsata ait yapılan görüşmelerin (Aktivite) zaman tüneli burada yer alacak.</p>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="offers" className="m-0 h-full">
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
                                            <p className="text-slate-500">Bu fırsat için müşteriye iletilen tekliflerin (Offer) listesi burada yer alacak.</p>
                                        </div>
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
