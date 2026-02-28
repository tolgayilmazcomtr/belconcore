import axios from 'axios';
import { Project, Block, Unit, ApiResponse } from '@/types/project.types';
import { useAuthStore } from '@/store/useAuthStore';

// Assuming an axios instance might already exist, but we will create a base instance here or just use axios directly with interceptors
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

export const projectService = {
    getAll: async () => {
        const response = await api.get<ApiResponse<Project[]>>('/projects');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get<{ data: Project }>(`/projects/${id}`);
        return response.data;
    },
    create: async (data: Partial<Project>) => {
        const response = await api.post<{ data: Project }>('/projects', data);
        return response.data;
    },
    update: async (id: number, data: Partial<Project>) => {
        const response = await api.put<{ data: Project }>(`/projects/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/projects/${id}`);
        return response.data;
    }
};

export const blockService = {
    getAllByProject: async (projectId: number) => {
        const response = await api.get<ApiResponse<Block[]>>(`/projects/${projectId}/blocks`);
        return response.data;
    },
    create: async (projectId: number, data: Partial<Block>) => {
        const response = await api.post<{ data: Block }>(`/projects/${projectId}/blocks`, data);
        return response.data;
    },
    update: async (id: number, data: Partial<Block>) => {
        const response = await api.put<{ data: Block }>(`/blocks/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/blocks/${id}`);
        return response.data;
    }
};

export const unitService = {
    getAllByBlock: async (blockId: number) => {
        const response = await api.get<ApiResponse<Unit[]>>(`/blocks/${blockId}/units`);
        return response.data;
    },
    create: async (blockId: number, data: Partial<Unit>) => {
        const response = await api.post<{ data: Unit }>(`/blocks/${blockId}/units`, data);
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
