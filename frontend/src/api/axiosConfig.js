import axios from 'axios';

// --- CONFIGURACIÓN BLINDADA PARA LOCAL ---
// Forzamos la dirección local 8000 si estamos en tu PC.
// Si subes esto a Railway, automáticamente usará la variable de entorno.
const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000' 
  : import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: baseURL,
});

// --- INTERCEPTOR (Tu llave de seguridad) ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;