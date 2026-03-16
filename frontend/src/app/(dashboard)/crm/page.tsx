'use client';

import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useCrmStore } from '@/store/useCrmStore';
import api from '@/lib/api';
import { LeadKanbanBoard } from '@/components/crm/LeadKanbanBoard';
import { LeadCreateModal } from '@/components/crm/LeadCreateModal';
import { LeadDetailPanel } from '@/components/crm/LeadDetailPanel';
import { Loader2, PieChart } from 'lucide-react';
import { toast } from 'sonner';

export default function CRMPage() {
    const { activeProject } = useProjectStore();
    const { leads, setLeads, setCustomers, selectedLead, setSelectedLead } = useCrmStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        if (!activeProject) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Leads and Customers
                const [leadsRes, customersRes] = await Promise.all([
                    api.get('/leads'),
                    api.get('/customers')
                ]);
                setLeads(leadsRes.data.data || []);
                setCustomers(customersRes.data.data || []);
            } catch (error) {
                console.error("Veriler alınamadı", error);
                toast.error("CRM verileri yüklenirken bir sorun oluştu.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [activeProject, setLeads, setCustomers]);

    if (!activeProject) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                <div className="text-center space-y-4">
                    <div className="bg-slate-100 p-4 rounded-full inline-block">
                        <PieChart className="h-8 w-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-medium text-slate-700">Aktif Proje Yok</h2>
                    <p className="text-slate-500 max-w-sm">Satış fırsatlarını yönetmek için lütfen yukarıdan bir proje seçin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col pt-6 px-4 max-w-[1800px] mx-auto w-full pb-4">
            <div className="flex items-center justify-between mb-4 shrink-0 px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-b-2 border-primary inline-block pb-1">Satış Fırsatları (Pipeline)</h1>
                    <p className="text-sm text-slate-500 mt-1">Müşteri potansiyellerini aşamalara göre sürükleyip bırakarak yönetin.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <LeadCreateModal />
                </div>
            </div>

            <div className="flex-grow flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex-auto flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                    </div>
                ) : (
                    <LeadKanbanBoard
                        onLeadClick={(lead) => {
                            setSelectedLead(lead);
                            setIsDetailOpen(true);
                        }}
                    />
                )}
            </div>

            <LeadDetailPanel
                lead={selectedLead}
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
            />
        </div>
    );
}
