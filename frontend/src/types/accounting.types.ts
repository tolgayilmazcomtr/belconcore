// ─── Accounting Types ──────────────────────────────────────────────────────

export interface AccountingAccount {
    id: number;
    project_id: number;
    type: 'customer' | 'supplier' | 'both';
    name: string;
    tax_number?: string;
    tax_office?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    category?: string;
    group?: string;
    balance: number;
    status: 'active' | 'passive';
    is_default: boolean;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    invoices?: Invoice[];
    payments?: AccountingPayment[];
}

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    sort_order: number;
}

export interface InvoiceItemInput {
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    tax_rate: number;
}

export interface Invoice {
    id: number;
    project_id: number;
    account_id?: number;
    account?: AccountingAccount;
    type: 'sales' | 'purchase';
    invoice_no?: string;
    date: string;
    due_date?: string;
    description?: string;
    category?: string;
    currency: string;
    document_type: 'paper' | 'e-invoice' | 'e-archive';
    subtotal: number;
    tax_total: number;
    total: number;
    paid_amount: number;
    remaining: number;
    status: 'draft' | 'sent' | 'paid' | 'partial' | 'cancelled';
    notes?: string;
    items?: InvoiceItem[];
    payments?: AccountingPayment[];
    created_at?: string;
    updated_at?: string;
}

export interface AccountingPayment {
    id: number;
    project_id: number;
    invoice_id: number;
    invoice?: Invoice;
    account_id?: number;
    account?: AccountingAccount;
    amount: number;
    date: string;
    method: 'cash' | 'bank' | 'check' | 'credit_card' | 'other';
    bank_name?: string;
    reference_no?: string;
    receipt_no?: string;
    check_due_date?: string;
    notes?: string;
    created_by?: number;
    creator?: { id: number; name: string };
    created_at?: string;
}
