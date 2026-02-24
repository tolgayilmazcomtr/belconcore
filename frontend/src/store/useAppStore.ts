import { create } from 'zustand';

interface User {
    id: number;
    name: string;
    email: string;
    roles?: { name: string }[];
}

interface Project {
    id: number;
    name: string;
    code: string;
    status: string;
}

interface AppState {
    user: User | null;
    activeProject: Project | null;
    projects: Project[];
    setUser: (user: User | null) => void;
    setActiveProject: (project: Project | null) => void;
    setProjects: (projects: Project[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null,
    activeProject: null,
    projects: [],
    setUser: (user) => set({ user }),
    setActiveProject: (activeProject) => {
        // Proje değiştiğinde bir yerlere (örneğin cookie veya localstorage) yazılabilir
        set({ activeProject });
    },
    setProjects: (projects) => set({ projects }),
}));
