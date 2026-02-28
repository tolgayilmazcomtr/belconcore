import { create } from 'zustand';

interface User {
    id: number;
    name: string;
    email: string;
    roles?: { name: string }[];
}

interface AppState {
    user: User | null;
    setUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
}));
