import axios from 'axios';

// Local dev → uses Vite proxy (/api → localhost:5000/api)
// Production → uses VITE_API_URL from .env (e.g. https://gigshield-api.onrender.com)
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('gigshield_auth');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gigshield_auth');
      const current = window.location.pathname;
      if (!current.includes('/login')) {
        window.location.href = current.startsWith('/admin') ? '/admin/login'
          : current.startsWith('/platform') ? '/platform/login'
          : '/worker/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
