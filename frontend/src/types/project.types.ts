export interface Project {
    id: number;
    name: string;
    code: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    planned_budget?: number;
    status: 'planned' | 'active' | 'completed' | 'on_hold' | 'cancelled';
    created_at?: string;
    updated_at?: string;
    blocks_count?: number;
    units_count?: number;
}

export interface Block {
    id: number;
    project_id: number;
    name: string;
    code?: string;
    parcel_island?: string;
    created_at?: string;
    updated_at?: string;
    units_count?: number;
}

export interface Unit {
    id: number;
    project_id: number;
    block_id: number;
    unit_no: string;
    floor_no?: string;
    unit_type?: string;
    gross_area?: number;
    net_area?: number;
    status: 'available' | 'sold' | 'reserved' | 'maintenance' | 'not_for_sale';
    list_price?: number;
    created_at?: string;
    updated_at?: string;
    block?: Block;
}

export interface Customer {
    id: number;
    project_id: number;
    type: 'individual' | 'corporate';
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    tax_office?: string;
    tax_number?: string;
    address?: string;
    city?: string;
    district?: string;
    country?: string;
    leads_count?: number;
    offers_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Activity {
    id: number;
    project_id: number;
    lead_id: number;
    type: 'call' | 'meeting' | 'email' | 'note';
    subject: string;
    notes?: string;
    due_date?: string;
    is_completed: boolean;
    user_id?: number;
    user?: any; // To do: add User interface later if needed
    created_at?: string;
    updated_at?: string;
}

export interface Offer {
    id: number;
    project_id: number;
    lead_id: number;
    customer_id: number;
    unit_id?: number;
    offer_no: string;
    valid_until?: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    base_price: number;
    discount_amount: number;
    final_price: number;
    payment_plan?: any;
    notes?: string;
    created_by?: number;
    customer?: Customer;
    unit?: Unit;
    creator?: any;
    created_at?: string;
    updated_at?: string;
}

export interface Lead {
    id: number;
    project_id: number;
    customer_id?: number;
    unit_id?: number;
    title: string;
    description?: string;
    source?: string;
    status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
    expected_value?: number;
    assigned_to?: number;
    customer?: Customer;
    unit?: Unit;
    assignee?: any;
    activities?: Activity[];
    offers?: Offer[];
    created_at?: string;
    updated_at?: string;
}

// API Response Definitions
export interface ApiResponse<T> {
    data: T;
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}
