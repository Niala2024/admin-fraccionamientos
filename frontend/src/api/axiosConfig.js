import axios from 'axios';

// 1. Detectamos automáticamente si estamos en la nube o en la computadora
const isLocal = window.location.hostname === 'localhost';
const baseURL = isLocal 
  ? 'http://127.0.0.1:8000' 
  : 'https://admin-fraccionamientos-production.up.railway.app';

const api = axios.create({
  baseURL: baseURL,
  // ⚠️ NOTA: Al usar 'Token' en el header, no necesitas 'withCredentials'.
  // Si lo dejas en true y el servidor usa CORS_ALLOW_ALL_ORIGINS, el navegador bloqueará la petición.
  withCredentials: false, 
});

// Interceptor para agregar el token automáticamente
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