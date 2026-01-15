import axios from 'axios';

// Si estamos en desarrollo (localhost), usa tu PC.
// Si estamos en producción (Vercel), usará la URL que configures después.
const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: apiUrl,
});

export default api;