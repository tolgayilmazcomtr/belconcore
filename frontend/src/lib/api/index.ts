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
    // Eğer localstorage vs. bir token metodolojisi kullanılırsa buradan header'a eklenebilir
    // Şimdilik Sanctum stateful domain'ler ile SPA cookie authentication yapıyoruz
    return config;
});

export default api;
