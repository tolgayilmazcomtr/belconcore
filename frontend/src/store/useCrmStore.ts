import { create } from 'zustand';
import { Customer, Lead, Activity, Offer } from '@/types/project.types';

interface CrmState {
    customers: Customer[];
    leads: Lead[];
    activities: Activity[];
    offers: Offer[];

    setCustomers: (customers: Customer[]) => void;
    setLeads: (leads: Lead[]) => void;
    setActivities: (activities: Activity[]) => void;
    setOffers: (offers: Offer[]) => void;

    // Optional: Selected entities for detail panels
    selectedCustomer: Customer | null;
    setSelectedCustomer: (customer: Customer | null) => void;

    selectedLead: Lead | null;
    setSelectedLead: (lead: Lead | null) => void;
}

export const useCrmStore = create<CrmState>((set) => ({
    customers: [],
    leads: [],
    activities: [],
    offers: [],

    setCustomers: (customers) => set({ customers }),
    setLeads: (leads) => set({ leads }),
    setActivities: (activities) => set({ activities }),
    setOffers: (offers) => set({ offers }),

    selectedCustomer: null,
    setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

    selectedLead: null,
    setSelectedLead: (lead) => set({ selectedLead: lead }),
}));
