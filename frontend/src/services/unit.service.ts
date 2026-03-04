import axios from 'axios';
import { Unit, ApiResponse } from '@/types/project.types';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Interceptor to attach token
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const unitService = {
    getAllByBlock: async (blockId: number) => {
        const response = await api.get<ApiResponse<Unit[]>>(`/blocks/${blockId}/units`);
        return response.data;
    },
    getAllByActiveProject: async (projectId: number) => {
        const response = await api.get<ApiResponse<Unit[]>>(`/units?active_project_id=${projectId}`);
        return response.data;
    },
    create: async (blockId: number | null, data: Partial<Unit>) => {
        // According to the controller, block_id can be sent in the data or the URL query.
        // Usually, the unit controller creates underneath the project.
        if (blockId) data.block_id = blockId;
        const response = await api.post<{ data: Unit }>(`/units`, data);
        return response.data;
    },
    update: async (id: number, data: Partial<Unit>) => {
        const response = await api.put<{ data: Unit }>(`/units/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/units/${id}`);
        return response.data;
    }
};
