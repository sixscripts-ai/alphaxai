import axios from 'axios';

// In production, use relative URLs so requests go through Next.js rewrites (avoiding CORS).
// In development, you can set NEXT_PUBLIC_API_URL=http://localhost:8000 to hit the gateway directly.
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
