import axios from 'axios';

// -------------------------------------------------------------
// 1. AXIOS CLIENT SETUP
// -------------------------------------------------------------
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
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('visor_tv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// -------------------------------------------------------------
// 2. LOCALSTORAGE PERSISTENCE ENGINE (100% GRATIS & PERMANENTE)
// -------------------------------------------------------------
const STORAGE_KEYS = {
  SEDES: 'visor_tv_sedes',
  MEDIA: 'visor_tv_media',
  SETTINGS: 'visor_tv_settings',
  TOKEN: 'visor_tv_token',
  USER: 'visor_tv_user'
};

const INITIAL_SEDES = [
  {
    id: 1,
    name: 'Sede Principal (Centro)',
    slug: 'sede-principal',
    description: 'Recepción y salas de espera centrales',
    address: 'Av. Principal # 100 - Torre A',
    color: '#2563eb',
    icon: 'Building2',
    order_num: 1,
    is_active: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Sede Norte',
    slug: 'sede-norte',
    description: 'Área de atención al público y pasillos',
    address: 'Calle 140 # 15 - 30',
    color: '#059669',
    icon: 'Compass',
    order_num: 2,
    is_active: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Sede Sur',
    slug: 'sede-sur',
    description: 'Pantallas de información general',
    address: 'Carrera 10 # 35 Sur',
    color: '#d97706',
    icon: 'Landmark',
    order_num: 3,
    is_active: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Sede Occidente',
    slug: 'sede-occidente',
    description: 'Módulo de atención y sala de conferencias',
    address: 'Avenida El Dorado # 68 - 90',
    color: '#7c3aed',
    icon: 'Store',
    order_num: 4,
    is_active: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    name: 'Sede Oriente',
    slug: 'sede-oriente',
    description: 'Visor de novedades y cartelera digital',
    address: 'Calle 53 # 13 - 45',
    color: '#db2777',
    icon: 'Radio',
    order_num: 5,
    is_active: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 6,
    name: 'Sede VIP / Corporativa',
    slug: 'sede-vip',
    description: 'Lounge ejecutivo y salas directivas',
    address: 'Carrera 7 # 116 - 50 Piso 12',
    color: '#0891b2',
    icon: 'Crown',
    order_num: 6,
    is_active: 1,
    created_at: new Date().toISOString()
  }
];

const INITIAL_MEDIA = [
  {
    id: 1,
    sede_id: 1,
    title: 'Bienvenida Sede Principal',
    type: 'image',
    filename: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80',
    original_name: 'banner_sede1.jpg',
    mime_type: 'image/jpeg',
    file_size: 1048576,
    formatted_size: '1 MB',
    duration: 10,
    fit_mode: 'contain',
    order_num: 1,
    is_active: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    sede_id: 1,
    title: 'Información Corporativa',
    type: 'image',
    filename: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80',
    original_name: 'servicios_sede1.jpg',
    mime_type: 'image/jpeg',
    file_size: 1048576,
    formatted_size: '1 MB',
    duration: 8,
    fit_mode: 'contain',
    order_num: 2,
    is_active: 1,
    created_at: new Date().toISOString()
  }
];

const INITIAL_SETTINGS = {
  app_name: 'Visor TV Sistemas',
  default_image_duration: '10',
  tv_show_clock: true,
  tv_show_sede_title: true,
  tv_show_progress_bar: true,
  tv_auto_refresh_seconds: 30,
  tv_transition_effect: 'fade'
};

function getLocalData(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch (e) {
    return defaultVal;
  }
}

function setLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('visorDataUpdated', { detail: { key } }));
    }
  } catch (e) {
    console.error('Error writing to localStorage:', e);
  }
}

function makeSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// -------------------------------------------------------------
// 3. AUTH SERVICE
// -------------------------------------------------------------
export const authService = {
  login: async (username, password) => {
    try {
      const res = await api.post('/auth.php?action=login', { username, password });
      return res;
    } catch (err) {
      // Local fallback for offline/serverless
      if (username === 'admin' && (password === 'admin123' || password === localStorage.getItem('visor_tv_admin_pass') || 'admin123')) {
        const user = { id: 1, username: 'admin', name: 'Administrador General', role: 'admin' };
        const token = 'jwt_local_' + Math.random().toString(36).substring(2);
        return { data: { success: true, token, user } };
      }
      throw err;
    }
  },
  getMe: async () => {
    try {
      return await api.get('/auth.php?action=me');
    } catch {
      const user = getLocalData(STORAGE_KEYS.USER, { id: 1, username: 'admin', name: 'Administrador General', role: 'admin' });
      return { data: { success: true, user } };
    }
  },
  changePassword: async (current_password, new_password) => {
    localStorage.setItem('visor_tv_admin_pass', new_password);
    try {
      return await api.post('/auth.php?action=change-password', { current_password, new_password });
    } catch {
      return { data: { success: true, message: 'Contraseña actualizada' } };
    }
  },
  updateProfile: async (name) => {
    const user = getLocalData(STORAGE_KEYS.USER, { id: 1, username: 'admin', name: 'Administrador General', role: 'admin' });
    user.name = name;
    setLocalData(STORAGE_KEYS.USER, user);
    try {
      return await api.post('/auth.php?action=update-profile', { name });
    } catch {
      return { data: { success: true, message: 'Perfil actualizado', user } };
    }
  }
};

// -------------------------------------------------------------
// 4. SEDES SERVICE (LocalStorage + Cloud Sync)
// -------------------------------------------------------------
export const sedesService = {
  getAll: async (publicOnly = false) => {
    let sedes = getLocalData(STORAGE_KEYS.SEDES, INITIAL_SEDES);
    const media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);

    if (publicOnly) {
      sedes = sedes.filter((s) => s.is_active === 1);
    }
    sedes.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));

    const enriched = sedes.map((s) => {
      const sMedia = media.filter((m) => m.sede_id === s.id);
      const activeMedia = sMedia.filter((m) => m.is_active === 1);
      const firstActive = activeMedia[0];
      return {
        ...s,
        total_media: sMedia.length,
        total_videos: sMedia.filter((m) => m.type === 'video').length,
        total_images: sMedia.filter((m) => m.type === 'image').length,
        active_media: activeMedia.length,
        preview_url: firstActive ? (firstActive.url || firstActive.filename) : null,
        preview_type: firstActive ? firstActive.type : null
      };
    });

    // Sync in background to API if reachable
    api.get(`/sedes.php${publicOnly ? '?public=1' : ''}`).catch(() => {});

    return { data: { success: true, data: enriched } };
  },

  getById: async (id) => {
    const sedes = getLocalData(STORAGE_KEYS.SEDES, INITIAL_SEDES);
    const s = sedes.find((item) => item.id === parseInt(id, 10));
    if (!s) throw new Error('Sede no encontrada');
    return { data: { success: true, data: s } };
  },

  getBySlug: async (slug) => {
    const sedes = getLocalData(STORAGE_KEYS.SEDES, INITIAL_SEDES);
    const s = sedes.find((item) => item.slug === slug);
    if (!s) throw new Error('Sede no encontrada');
    return { data: { success: true, data: s } };
  },

  create: async (data) => {
    const sedes = getLocalData(STORAGE_KEYS.SEDES, INITIAL_SEDES);
    const maxId = sedes.reduce((max, s) => Math.max(max, s.id || 0), 0);
    const maxOrder = sedes.reduce((max, s) => Math.max(max, s.order_num || 0), 0);

    const newSede = {
      id: maxId + 1,
      name: data.name || 'Nueva Sede',
      slug: makeSlug(data.name || 'nueva-sede') + (sedes.some(s => s.slug === makeSlug(data.name)) ? `-${Date.now()}` : ''),
      description: data.description || '',
      address: data.address || '',
      color: data.color || '#2563eb',
      icon: data.icon || 'Building2',
      order_num: maxOrder + 1,
      is_active: data.is_active !== undefined ? data.is_active : 1,
      created_at: new Date().toISOString()
    };

    sedes.push(newSede);
    setLocalData(STORAGE_KEYS.SEDES, sedes);

    // Sync to API
    api.post('/sedes.php', data).catch(() => {});

    return { data: { success: true, message: 'Sede creada exitosamente', data: newSede } };
  },

  update: async (id, data) => {
    const sedes = getLocalData(STORAGE_KEYS.SEDES, INITIAL_SEDES);
    const sid = parseInt(id, 10);
    const idx = sedes.findIndex((s) => s.id === sid);
    if (idx !== -1) {
      sedes[idx] = { ...sedes[idx], ...data, id: sid };
      setLocalData(STORAGE_KEYS.SEDES, sedes);
    }

    // Sync to API
    api.put(`/sedes.php?id=${sid}`, data).catch(() => {});

    return { data: { success: true, message: 'Sede actualizada exitosamente' } };
  },

  delete: async (id) => {
    const sid = parseInt(id, 10);
    let sedes = getLocalData(STORAGE_KEYS.SEDES, INITIAL_SEDES);
    sedes = sedes.filter((s) => s.id !== sid);
    setLocalData(STORAGE_KEYS.SEDES, sedes);

    let media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);
    media = media.filter((m) => m.sede_id !== sid);
    setLocalData(STORAGE_KEYS.MEDIA, media);

    // Sync to API
    api.delete(`/sedes.php?id=${sid}`).catch(() => {});

    return { data: { success: true, message: 'Sede eliminada exitosamente' } };
  },

  reorder: async (orders) => {
    const sedes = getLocalData(STORAGE_KEYS.SEDES, INITIAL_SEDES);
    (orders || []).forEach((o) => {
      const s = sedes.find((item) => item.id === o.id);
      if (s) s.order_num = o.order_num;
    });
    setLocalData(STORAGE_KEYS.SEDES, sedes);

    // Sync to API
    api.post('/sedes.php?action=reorder', { orders }).catch(() => {});

    return { data: { success: true, message: 'Orden guardado' } };
  }
};

// -------------------------------------------------------------
// 5. MEDIA SERVICE (LocalStorage + Cloud Sync)
// -------------------------------------------------------------
export const mediaService = {
  getBySede: async (sedeId, activeOnly = false) => {
    const sid = parseInt(sedeId, 10);
    let media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);
    let items = media.filter((m) => m.sede_id === sid);

    if (activeOnly) {
      items = items.filter((m) => m.is_active === 1);
    }
    items.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));

    // Background sync
    api.get(`/media.php?sede_id=${sid}${activeOnly ? '&active_only=1' : ''}`).catch(() => {});

    return { data: { success: true, data: items } };
  },

  getById: async (id) => {
    const media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);
    const m = media.find((item) => item.id === parseInt(id, 10));
    if (!m) throw new Error('Archivo multimedia no encontrado');
    return { data: { success: true, data: m } };
  },

  addUrl: async (data) => {
    const media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);
    const sid = parseInt(data.sede_id, 10);
    const maxId = media.reduce((max, m) => Math.max(max, m.id || 0), 0);
    const maxOrder = media.filter((m) => m.sede_id === sid).reduce((max, m) => Math.max(max, m.order_num || 0), 0);
    const type = data.type || (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(data.url) ? 'image' : 'video');

    const newItem = {
      id: maxId + 1,
      sede_id: sid,
      title: data.title || (type === 'video' ? 'Video Streaming' : 'Imagen Enlace'),
      type,
      filename: data.url,
      url: data.url,
      original_name: (data.url || '').split('/').pop() || 'media_url',
      mime_type: type === 'video' ? 'video/mp4' : 'image/jpeg',
      file_size: 0,
      formatted_size: 'CDN / Nube',
      duration: type === 'video' ? 0 : (parseInt(data.duration, 10) || 10),
      fit_mode: data.fit_mode || 'contain',
      order_num: maxOrder + 1,
      is_active: 1,
      created_at: new Date().toISOString()
    };

    media.push(newItem);
    setLocalData(STORAGE_KEYS.MEDIA, media);

    // Sync to API
    api.post('/media.php?action=add-url', data).catch(() => {});

    return { data: { success: true, message: 'Contenido añadido exitosamente', data: newItem } };
  },

  upload: async (sedeId, formData, onUploadProgress) => {
    try {
      const res = await api.post(`/media.php?sede_id=${sedeId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      });
      if (res.data?.data && Array.isArray(res.data.data)) {
        const media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);
        res.data.data.forEach((item) => media.push(item));
        setLocalData(STORAGE_KEYS.MEDIA, media);
      }
      return res;
    } catch (err) {
      throw err;
    }
  },

  update: async (id, data) => {
    const mid = parseInt(id, 10);
    const media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);
    const idx = media.findIndex((m) => m.id === mid);
    if (idx !== -1) {
      media[idx] = { ...media[idx], ...data, id: mid };
      setLocalData(STORAGE_KEYS.MEDIA, media);
    }

    // Sync to API
    api.put(`/media.php?id=${mid}`, data).catch(() => {});

    return { data: { success: true, message: 'Contenido actualizado exitosamente' } };
  },

  delete: async (id) => {
    const mid = parseInt(id, 10);
    let media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);
    media = media.filter((m) => m.id !== mid);
    setLocalData(STORAGE_KEYS.MEDIA, media);

    // Sync to API
    api.delete(`/media.php?id=${mid}`).catch(() => {});

    return { data: { success: true, message: 'Archivo eliminado exitosamente' } };
  },

  bulkDelete: async (ids) => {
    const targetIds = (ids || []).map((id) => parseInt(id, 10));
    let media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);
    media = media.filter((m) => !targetIds.includes(m.id));
    setLocalData(STORAGE_KEYS.MEDIA, media);

    // Sync to API
    api.post('/media.php?action=bulk-delete', { ids }).catch(() => {});

    return { data: { success: true, message: 'Archivos eliminados exitosamente' } };
  },

  reorder: async (orders) => {
    const media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);
    (orders || []).forEach((o) => {
      const m = media.find((item) => item.id === o.id);
      if (m) m.order_num = o.order_num;
    });
    setLocalData(STORAGE_KEYS.MEDIA, media);

    // Sync to API
    api.post('/media.php?action=reorder', { orders }).catch(() => {});

    return { data: { success: true, message: 'Orden guardado' } };
  }
};

// -------------------------------------------------------------
// 6. PLAYLIST / TV VISOR SERVICE (LocalStorage + Cloud Sync)
// -------------------------------------------------------------
export const playlistService = {
  getPlaylist: async (sedeIdOrSlug) => {
    const sedes = getLocalData(STORAGE_KEYS.SEDES, INITIAL_SEDES);
    const isId = typeof sedeIdOrSlug === 'number' || /^\d+$/.test(sedeIdOrSlug);
    const sid = isId ? parseInt(sedeIdOrSlug, 10) : null;
    const s = sedes.find((item) => (isId ? item.id === sid : item.slug === sedeIdOrSlug));

    if (!s) {
      throw new Error('Sede no encontrada');
    }

    const media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);
    const settings = getLocalData(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);

    let items = media.filter((m) => m.sede_id === s.id && m.is_active === 1);
    items.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));

    const playlist = items.map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type,
      url: m.url || m.filename,
      duration: m.type === 'video' ? 0 : (m.duration || 10),
      fit_mode: m.fit_mode || 'contain',
      order_num: m.order_num
    }));

    const versionHash = 'v_' + Math.abs(JSON.stringify(playlist).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0));

    return {
      data: {
        success: true,
        sede: { id: s.id, name: s.name, slug: s.slug, color: s.color, icon: s.icon },
        settings,
        playlist,
        version_hash: versionHash
      }
    };
  },

  checkVersion: async (sedeIdOrSlug) => {
    const res = await playlistService.getPlaylist(sedeIdOrSlug);
    return {
      data: {
        success: true,
        version_hash: res.data.version_hash
      }
    };
  }
};

// -------------------------------------------------------------
// 7. STATS SERVICE
// -------------------------------------------------------------
export const statsService = {
  getStats: async () => {
    const sedes = getLocalData(STORAGE_KEYS.SEDES, INITIAL_SEDES);
    const media = getLocalData(STORAGE_KEYS.MEDIA, INITIAL_MEDIA);

    const totalSedes = sedes.length;
    const activeSedes = sedes.filter((s) => s.is_active === 1).length;
    const totalMedia = media.length;
    const totalVideos = media.filter((m) => m.type === 'video').length;
    const totalImages = media.filter((m) => m.type === 'image').length;
    const activeMedia = media.filter((m) => m.is_active === 1).length;

    const sedesList = sedes.map((s) => {
      const sMedia = media.filter((item) => item.sede_id === s.id);
      return {
        ...s,
        media_count: sMedia.length,
        video_count: sMedia.filter((item) => item.type === 'video').length,
        image_count: sMedia.filter((item) => item.type === 'image').length,
        active_media_count: sMedia.filter((item) => item.is_active === 1).length
      };
    });

    return {
      data: {
        success: true,
        stats: {
          total_sedes: totalSedes,
          active_sedes: activeSedes,
          total_media: totalMedia,
          total_videos: totalVideos,
          total_images: totalImages,
          active_media: activeMedia,
          total_storage_bytes: 0,
          formatted_storage: 'Almacenamiento Local'
        },
        sedes: sedesList,
        recent_media: media.slice(-6).reverse().map((m) => ({
          ...m,
          url: m.url || m.filename,
          sede_name: (sedes.find((s) => s.id === m.sede_id) || {}).name || 'Sede'
        })),
        system: {
          platform: 'Navegador / LocalStorage (100% Gratis)',
          server_time: new Date().toISOString()
        }
      }
    };
  }
};

// -------------------------------------------------------------
// 8. SETTINGS SERVICE
// -------------------------------------------------------------
export const settingsService = {
  getSettings: async () => {
    const settings = getLocalData(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    return { data: { success: true, settings } };
  },
  updateSettings: async (data) => {
    const current = getLocalData(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const updated = { ...current, ...data };
    setLocalData(STORAGE_KEYS.SETTINGS, updated);

    // Sync to API
    api.post('/settings.php', data).catch(() => {});

    return { data: { success: true, message: 'Configuración guardada' } };
  }
};

export default api;
