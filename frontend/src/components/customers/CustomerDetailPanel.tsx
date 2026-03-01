'use client';

import React from 'react';
import { Customer } from '@/types/project.types';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, User2, Mail, Phone, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomerDetailPanelProps {
    customer: Customer | null;
    open: boolean;
    onClose: () => void;
}

export function CustomerDetailPanel({ customer, open, onClose }: CustomerDetailPanelProps) {
    if (!customer) return null;

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-[1000px] sm:max-w-[1000px] p-0 flex flex-col h-full bg-slate-50/50">
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
                                <SheetTitle className="text-2xl font-bold text-slate-800">
                                    {customer.type === 'corporate' ? customer.company_name : `${customer.first_name} ${customer.last_name}`}
                                </SheetTitle>
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
                                    value="leads"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none pb-3 px-1 text-sm font-medium text-slate-500 data-[state=active]:text-primary"
                                >
                                    Fırsatlar
                                    <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs font-mono">{customer.leads_count || 0}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="offers"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none pb-3 px-1 text-sm font-medium text-slate-500 data-[state=active]:text-primary"
                                >
                                    Teklifler
                                    <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs font-mono">{customer.offers_count || 0}</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="p-6">
                                    <TabsContent value="details" className="m-0 focus-visible:outline-none data-[state=active]:block">
                                        <div className="grid grid-cols-2 gap-6 relative">
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

                                    <TabsContent value="leads" className="m-0 h-full">
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
                                            <p className="text-slate-500">Bu müşteriye ait fırsat (Lead) tablosu burada yer alacak.</p>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="offers" className="m-0 h-full">
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
                                            <p className="text-slate-500">Bu müşteriye verilen teklifler tablosu burada yer alacak.</p>
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
