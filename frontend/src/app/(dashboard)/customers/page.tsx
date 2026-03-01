'use client';

import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useCrmStore } from '@/store/useCrmStore';
import api from '@/lib/api';
import { CustomerList } from '@/components/customers/CustomerList';
import { CustomerCreateModal } from '@/components/customers/CustomerCreateModal';
import { CustomerDetailPanel } from '@/components/customers/CustomerDetailPanel';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Customer } from '@/types/project.types';

export default function CustomersPage() {
    const { activeProject } = useProjectStore();
    const { customers, setCustomers, selectedCustomer, setSelectedCustomer } = useCrmStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        if (!activeProject) return;

        const fetchCustomers = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/customers');
                setCustomers(response.data.data);
            } catch (error) {
                console.error("Müşteriler alınamadı", error);
                toast.error("Müşteriler yüklenirken bir sorun oluştu.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomers();
    }, [activeProject, setCustomers]);

    if (!activeProject) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                <div className="text-center space-y-4">
                    <div className="bg-slate-100 p-4 rounded-full inline-block">
                        <Users className="h-8 w-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-medium text-slate-700">Aktif Proje Yok</h2>
                    <p className="text-slate-500 max-w-sm">Müşterileri görüntülemek ve yönetmek için lütfen yukarıdan bir proje seçin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col pt-6 px-6 max-w-[1600px] mx-auto w-full pb-6">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-b-2 border-primary inline-block pb-1">Müşteriler</h1>
                    <p className="text-sm text-slate-500 mt-1">Cari, firma ve bireysel müşteri kayıtlarınızı ERP standartlarında yönetin.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <CustomerCreateModal />
                </div>
            </div>

            <div className="flex-grow flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex-auto flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                    </div>
                ) : (
                    <CustomerList
                        customers={customers}
                        projectName={activeProject.name}
                        onRowClick={(customer) => {
                            setSelectedCustomer(customer);
                            setIsDetailOpen(true);
                        }}
                    />
                )}
            </div>

            <CustomerDetailPanel
                customer={selectedCustomer}
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
            />
        </div>
    );
}
