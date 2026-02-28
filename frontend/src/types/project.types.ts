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
}

export interface Block {
    id: number;
    project_id: number;
    name: string;
    code?: string;
    parcel_island?: string;
    created_at?: string;
    updated_at?: string;
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
    status: 'available' | 'sold' | 'reserved' | 'maintenance';
    list_price?: number;
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
