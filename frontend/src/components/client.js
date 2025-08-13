// src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
});

// ⛳ Interceptor: agrega Authorization si no está
api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token');
  if (t) {
    // evitá duplicarlo si algún call ya lo puso
    if (!config.headers) config.headers = {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${t}`;
    }
  }
  return config;
});

export default api;
