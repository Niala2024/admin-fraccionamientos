import axios from 'axios';

// Detecta si hay una variable de entorno (Nube) o usa localhost (Local)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
});

export default api;