import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://visortvapi.vercel.app/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 0, // Unlimited timeout for large 4K/HD video uploads
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// Attach Authorization Bearer token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('visor_tv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        localStorage.removeItem('visor_tv_token');
        localStorage.removeItem('visor_tv_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: (username, password) => api.post('/auth.php?action=login', { username, password }),
  getMe: () => api.get('/auth.php?action=me'),
  changePassword: (current_password, new_password) => api.post('/auth.php?action=change-password', { current_password, new_password }),
  updateProfile: (name) => api.post('/auth.php?action=update-profile', { name }),
};

// Sedes Service
export const sedesService = {
  getAll: (publicOnly = false) => api.get(`/sedes.php${publicOnly ? '?public=1' : ''}`),
  getById: (id) => api.get(`/sedes.php?id=${id}`),
  getBySlug: (slug) => api.get(`/sedes.php?slug=${slug}`),
  create: (data) => api.post('/sedes.php', data),
  update: (id, data) => api.put(`/sedes.php?id=${id}`, data),
  delete: (id) => api.delete(`/sedes.php?id=${id}`),
  reorder: (orders) => api.post('/sedes.php?action=reorder', { orders }),
};

// Media Service
export const mediaService = {
  getBySede: (sedeId, activeOnly = false) => api.get(`/media.php?sede_id=${sedeId}${activeOnly ? '&active_only=1' : ''}`),
  getById: (id) => api.get(`/media.php?id=${id}`),
  upload: (sedeId, formData, onUploadProgress) => api.post(`/media.php?sede_id=${sedeId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
  addUrl: (data) => api.post('/media.php?action=add-url', data),
  update: (id, data) => api.put(`/media.php?id=${id}`, data),
  delete: (id) => api.delete(`/media.php?id=${id}`),
  bulkDelete: (ids) => api.post('/media.php?action=bulk-delete', { ids }),
  reorder: (orders) => api.post('/media.php?action=reorder', { orders }),
};

// Playlist / TV Visor Service
export const playlistService = {
  getPlaylist: (sedeIdOrSlug) => {
    const param = typeof sedeIdOrSlug === 'number' || /^\d+$/.test(sedeIdOrSlug)
      ? `sede_id=${sedeIdOrSlug}`
      : `slug=${sedeIdOrSlug}`;
    return api.get(`/playlist.php?${param}`);
  },
  checkVersion: (sedeIdOrSlug) => {
    const param = typeof sedeIdOrSlug === 'number' || /^\d+$/.test(sedeIdOrSlug)
      ? `sede_id=${sedeIdOrSlug}`
      : `slug=${sedeIdOrSlug}`;
    return api.get(`/playlist.php?${param}&check_version=1`);
  },
};

// Dashboard Stats Service
export const statsService = {
  getStats: () => api.get('/stats.php'),
};

// Settings Service
export const settingsService = {
  getSettings: () => api.get('/settings.php'),
  updateSettings: (data) => api.post('/settings.php', data),
};

export default api;
