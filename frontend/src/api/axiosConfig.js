import axios from 'axios';

// Creamos la conexión base usando la variable que configuramos en Railway
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
});

// --- INTERCEPTOR (El filtro de seguridad) ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // REGLA DE ORO: Solo agregamos el token si existe Y si NO estamos intentando loguearnos.
    // Si vamos a '/api-token-auth/', vamos "limpios" sin token.
    if (token && !config.url.includes('api-token-auth')) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;