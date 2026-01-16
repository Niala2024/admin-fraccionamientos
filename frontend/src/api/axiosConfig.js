import axios from 'axios';

// 1. Detectar la URL base dinámicamente
// Si existe la variable de entorno (Railway), usa esa. Si no, usa localhost.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 2. Interceptor (Opcional pero recomendado)
// Si ya hay un token guardado, lo agrega a todas las peticiones automáticamente
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;