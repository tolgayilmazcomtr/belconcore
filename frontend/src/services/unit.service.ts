import api from '@/lib/api';
import { Unit, ApiResponse } from '@/types/project.types';

export const unitService = {
    getAllByBlock: async (blockId: number) => {
        const response = await api.get<ApiResponse<Unit[]>>(`/blocks/${blockId}/units`);
        return response.data;
    },

    getAllByActiveProject: async (projectId: number) => {
        const response = await api.get<ApiResponse<Unit[]>>(`/units`, {
            params: { active_project_id: projectId },
        });
        return response.data;
    },

    create: async (blockId: number | null, data: Partial<Unit>) => {
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
    },
};
