import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: number;
    name: string;
    email: string;
    current_project_id?: number | null;
    roles?: { name: string }[];
    modules?: string[]; // ['module.dashboard', 'module.crm', ...]
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
            setUser: (user) => set({ user }),
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
        }),
        { name: 'auth-storage' }
    )
);

// Helper: check if current user can access a module
export function useHasModule(module: string): boolean {
    const user = useAuthStore(s => s.user);
    if (!user) return false;
    if (user.roles?.some(r => r.name === 'Admin')) return true;
    return user.modules?.includes(module) ?? false;
}
