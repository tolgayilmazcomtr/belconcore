import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL + '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Sanctum cookie bazlı local yetkilendirme için geçerlidir
});

// İstek öncesi interceptor
api.interceptors.request.use((config) => {
    // Zustand'dan persist edilmiş token'ı alalım.
    // persist middleware localStorage'a 'auth-storage' adıyla kaydeder.
    try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const { state } = JSON.parse(authStorage);
            if (state && state.token) {
                config.headers.Authorization = `Bearer ${state.token}`;
            }
        }
    } catch (error) {
        console.error("Error reading token from local storage", error);
    }

    return config;
});

// Response interceptor for handling 401s globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Check if we are not already on the login page to avoid infinite loops
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                // Token expired or invalid, clear auth storage and redirect
                localStorage.removeItem('auth-storage');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
