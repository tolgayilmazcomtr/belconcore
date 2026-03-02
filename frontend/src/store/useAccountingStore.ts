import { create } from 'zustand';
import { AccountingAccount, Invoice, AccountingPayment } from '@/types/accounting.types';

interface AccountingState {
    accounts: AccountingAccount[];
    invoices: Invoice[];
    payments: AccountingPayment[];
    setAccounts: (accounts: AccountingAccount[]) => void;
    setInvoices: (invoices: Invoice[]) => void;
    setPayments: (payments: AccountingPayment[]) => void;
    upsertAccount: (account: AccountingAccount) => void;
    upsertInvoice: (invoice: Invoice) => void;
    removeAccount: (id: number) => void;
    removePayment: (id: number) => void;
}

export const useAccountingStore = create<AccountingState>((set) => ({
    accounts: [],
    invoices: [],
    payments: [],

    setAccounts: (accounts) => set({ accounts }),
    setInvoices: (invoices) => set({ invoices }),
    setPayments: (payments) => set({ payments }),

    upsertAccount: (account) =>
        set((state) => {
            const exists = state.accounts.find((a) => a.id === account.id);
            return {
                accounts: exists
                    ? state.accounts.map((a) => (a.id === account.id ? account : a))
                    : [account, ...state.accounts],
            };
        }),

    upsertInvoice: (invoice) =>
        set((state) => {
            const exists = state.invoices.find((i) => i.id === invoice.id);
            return {
                invoices: exists
                    ? state.invoices.map((i) => (i.id === invoice.id ? invoice : i))
                    : [invoice, ...state.invoices],
            };
        }),

    removeAccount: (id) =>
        set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),

    removePayment: (id) =>
        set((state) => ({ payments: state.payments.filter((p) => p.id !== id) })),
}));
