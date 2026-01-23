import axios from 'axios';

const api = axios.create({
  baseURL: 'https://admin-fraccionamientos-production.up.railway.app',
  // 👇 ESTO ES LO NUEVO IMPORTANTE
  withCredentials: true,             // Permite que viajen las cookies (donde vive el token)
  xsrfCookieName: 'csrftoken',       // El nombre de la cookie que busca Axios
  xsrfHeaderName: 'X-CSRFToken',     // El nombre del header que espera Django
});

// Interceptor para agregar el token de autenticación (Login) si existe
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