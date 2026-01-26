import axios from 'axios';

// 1. Configuración de la URL Base
// Prioridad: 1. Variable de entorno (Railway) 2. URL de producción 3. Localhost
const apiUrl = import.meta.env.VITE_API_URL || 
               'https://admin-fraccionamientos-production.up.railway.app/api';

const api = axios.create({
  baseURL: apiUrl,
  // Desactivamos withCredentials para evitar conflictos de CORS con la autenticación por Token
  withCredentials: false, 
});

// 2. Interceptor de Seguridad (Indispensable para Quejas y Reportes)
// Este bloque "inyecta" el Token en la cabecera de cada petición automáticamente
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