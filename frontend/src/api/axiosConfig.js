import axios from 'axios';

// 1. URL Base: Usamos solo el dominio principal.
// Importante: NO ponemos '/api' al final aquí, porque tus archivos
// AdminPanel.jsx y Quejas.jsx ya escriben '/api/...' en sus peticiones.
const apiUrl = import.meta.env.VITE_API_URL || 
               'https://admin-fraccionamientos-production.up.railway.app';

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: false, 
});

// 2. Interceptor de Seguridad
// Inyecta el token en todas las llamadas automáticamente
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