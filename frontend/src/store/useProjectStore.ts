import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Block, Unit } from '@/types/project.types';

interface ProjectState {
    activeProject: Project | null;
    projects: Project[];
    blocks: Block[];
    units: Unit[];
    isLoading: boolean;
    error: string | null;

    setActiveProject: (project: Project | null) => void;
    setProjects: (projects: Project[]) => void;
    setBlocks: (blocks: Block[]) => void;
    setUnits: (units: Unit[]) => void;

    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            activeProject: null,
            projects: [],
            blocks: [],
            units: [],
            isLoading: false,
            error: null,

            setActiveProject: (project) => set({ activeProject: project }),
            setProjects: (projects) => set({ projects }),
            setBlocks: (blocks) => set({ blocks }),
            setUnits: (units) => set({ units }),

            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
        }),
        {
            name: 'project-storage',
            // Sadece activeProject'in localStorage'da kalmasını sağlayabiliriz.
            // Ama veri çok büyük değilse projelerin isimlerini hızlı yüklemek için projelere de kalıcı yapabiliriz.
            partialize: (state) => ({ activeProject: state.activeProject }),
        }
    )
);
