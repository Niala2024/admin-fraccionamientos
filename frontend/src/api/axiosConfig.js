import axios from 'axios';

const api = axios.create({
  baseURL: 'https://admin-fraccionamientos-production.up.railway.app',
});

export default api;