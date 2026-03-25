'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useCrmStore } from '@/store/useCrmStore';
import api from '@/lib/api';
import { OfferList } from '@/components/crm/OfferList';
import { OfferDetailPanel } from '@/components/crm/OfferDetailPanel';
import { StandaloneOfferCreateModal } from '@/components/crm/StandaloneOfferCreateModal';
import { Loader2, FileText, CheckCircle2, XCircle, Clock, SendHorizonal, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Offer } from '@/types/project.types';

const STATUS_FILTERS = [
    { value: 'all', label: 'Tümü' },
    { value: 'draft', label: 'Taslak' },
    { value: 'sent', label: 'Gönderildi' },
    { value: 'accepted', label: 'Kabul Edildi' },
    { value: 'rejected', label: 'Reddedildi' },
] as const;

const formatMoney = (amount: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export default function OffersPage() {
    const { activeProject } = useProjectStore();
    const { offers, setOffers } = useCrmStore();
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'accepted' | 'rejected'>('all');
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        if (!activeProject) return;

        const fetchOffers = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/offers');
                setOffers(response.data.data || []);
            } catch (error) {
                console.error('Teklifler alınamadı', error);
                toast.error('Teklifler yüklenirken bir sorun oluştu.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOffers();
    }, [activeProject, setOffers]);

    // Stats
    const stats = useMemo(() => {
        const total = offers.length;
        const draft = offers.filter(o => o.status === 'draft').length;
        const sent = offers.filter(o => o.status === 'sent').length;
        const accepted = offers.filter(o => o.status === 'accepted').length;
        const rejected = offers.filter(o => o.status === 'rejected').length;
        const totalValue = offers.filter(o => o.status === 'accepted').reduce((s, o) => s + (o.final_price || 0), 0);
        return { total, draft, sent, accepted, rejected, totalValue };
    }, [offers]);

    const filteredOffers = useMemo(
        () => statusFilter === 'all' ? offers : offers.filter(o => o.status === statusFilter),
        [offers, statusFilter]
    );

    if (!activeProject) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                <div className="text-center space-y-4">
                    <div className="bg-slate-100 p-4 rounded-full inline-block">
                        <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-medium text-slate-700">Aktif Proje Yok</h2>
                    <p className="text-slate-500 max-w-sm">Teklifleri görüntülemek için lütfen yukarıdan bir proje seçin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col pt-6 px-6 max-w-[1700px] mx-auto w-full pb-6 gap-5">
            {/* Page Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-b-2 border-primary inline-block pb-1">
                        Teklifler
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Müşterilere sunulan teklifleri ve PDF belgelerini yönetin.
                    </p>
                </div>
                <StandaloneOfferCreateModal
                    onSuccess={() => api.get('/offers').then(r => setOffers(r.data.data)).catch(() => { })}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${statusFilter === 'all' ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Toplam</span>
                        <div className="bg-slate-100 p-1.5 rounded-lg"><FileText className="w-4 h-4 text-slate-500" /></div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    <p className="text-xs text-slate-400 mt-0.5">teklif</p>
                </button>

                <button
                    onClick={() => setStatusFilter('draft')}
                    className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${statusFilter === 'draft' ? 'border-slate-400 ring-1 ring-slate-300' : 'border-slate-200'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Taslak</span>
                        <div className="bg-slate-100 p-1.5 rounded-lg"><Clock className="w-4 h-4 text-slate-500" /></div>
                    </div>
                    <p className="text-2xl font-bold text-slate-700">{stats.draft}</p>
                    <p className="text-xs text-slate-400 mt-0.5">bekliyor</p>
                </button>

                <button
                    onClick={() => setStatusFilter('sent')}
                    className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${statusFilter === 'sent' ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-200'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Gönderildi</span>
                        <div className="bg-blue-50 p-1.5 rounded-lg"><SendHorizonal className="w-4 h-4 text-blue-500" /></div>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{stats.sent}</p>
                    <p className="text-xs text-blue-400 mt-0.5">değerlendirmede</p>
                </button>

                <button
                    onClick={() => setStatusFilter('accepted')}
                    className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${statusFilter === 'accepted' ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Kabul</span>
                        <div className="bg-emerald-50 p-1.5 rounded-lg"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{stats.accepted}</p>
                    <p className="text-xs text-emerald-400 mt-0.5">{formatMoney(stats.totalValue)}</p>
                </button>

                <button
                    onClick={() => setStatusFilter('rejected')}
                    className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${statusFilter === 'rejected' ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-red-500 uppercase tracking-wider">Reddedildi</span>
                        <div className="bg-red-50 p-1.5 rounded-lg"><XCircle className="w-4 h-4 text-red-400" /></div>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                    <p className="text-xs text-red-300 mt-0.5">teklif</p>
                </button>
            </div>

            {/* Tab bar for active filter label */}
            <div className="flex items-center gap-2 shrink-0 -mb-2">
                {STATUS_FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setStatusFilter(f.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === f.value
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-primary/30 hover:text-primary'
                            }`}
                    >
                        {f.label}
                        {f.value !== 'all' && (
                            <span className={`ml-1.5 text-xs ${statusFilter === f.value ? 'opacity-80' : 'opacity-60'}`}>
                                ({offers?.filter(o => o.status === f.value).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Offer List */}
            <div className="flex-grow flex flex-col min-h-0">
                {isLoading ? (
                    <div className="flex-auto bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                    </div>
                ) : (
                    <OfferList
                        offers={filteredOffers}
                        projectName={activeProject.name}
                        onRowClick={(offer) => {
                            setSelectedOffer(offer);
                            setIsDetailOpen(true);
                        }}
                    />
                )}
            </div>

            {/* Detail Panel */}
            <OfferDetailPanel
                offer={selectedOffer}
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                onUpdated={() => {
                    // Refetch after edit
                    api.get('/offers').then(r => setOffers(r.data.data)).catch(() => { });
                }}
            />
        </div>
    );
}
