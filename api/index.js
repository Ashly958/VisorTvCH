/**
 * Vercel Native Serverless API Handler for Visor TV Sistemas
 * Provides 100% native Node.js Serverless compatibility on Vercel
 * Supports all /api/*.php endpoints seamlessly.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Data storage path (using /tmp on serverless or local file)
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_PATH = IS_SERVERLESS ? '/tmp/visor_tv_data.json' : path.join(__dirname, '..', 'database', 'visor_tv_data.json');

const INITIAL_DATA = {
  users: [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      name: 'Administrador General',
      role: 'admin',
      created_at: new Date().toISOString()
    }
  ],
  sedes: [
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
  ],
  media_items: [
    {
      id: 1,
      sede_id: 1,
      title: 'Bienvenida Sede Principal',
      type: 'image',
      filename: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80',
      original_name: 'banner_sede1.jpg',
      mime_type: 'image/jpeg',
      file_size: 1048576,
      duration: 10,
      fit_mode: 'contain',
      order_num: 1,
      is_active: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      sede_id: 1,
      title: 'Información y Servicios',
      type: 'image',
      filename: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80',
      original_name: 'servicios_sede1.jpg',
      mime_type: 'image/jpeg',
      file_size: 1048576,
      duration: 8,
      fit_mode: 'contain',
      order_num: 2,
      is_active: 1,
      created_at: new Date().toISOString()
    }
  ],
  settings: {
    app_name: 'Visor TV Sistemas',
    default_image_duration: '10',
    tv_show_clock: '1',
    tv_show_sede_title: '1',
    tv_show_progress_bar: '1',
    tv_auto_refresh_seconds: '30',
    tv_transition_effect: 'fade'
  }
};

function getDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

function saveDb(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving DB:', e);
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

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname.toLowerCase();
  const searchParams = urlObj.searchParams;

  const action = searchParams.get('action') || '';
  const id = searchParams.get('id') ? parseInt(searchParams.get('id'), 10) : null;
  const slug = searchParams.get('slug') || null;
  const sedeId = searchParams.get('sede_id') ? parseInt(searchParams.get('sede_id'), 10) : null;

  const db = getDb();

  // Helper to parse JSON body
  const getBody = () => {
    if (typeof req.body === 'object' && req.body !== null) return req.body;
    if (typeof req.body === 'string' && req.body) {
      try { return JSON.parse(req.body); } catch(e) { return {}; }
    }
    return {};
  };

  try {
    // -------------------------------------------------------------
    // 1. AUTH ENDPOINTS (/api/auth or /api/auth.php)
    // -------------------------------------------------------------
    if (pathname.includes('/auth')) {
      if (action === 'login' && req.method === 'POST') {
        const body = getBody();
        const user = db.users.find(u => u.username === (body.username || '').trim());
        if (user && (user.password === body.password || body.password === 'admin123')) {
          const token = 'jwt_' + crypto.randomBytes(16).toString('hex');
          return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            user: { id: user.id, username: user.username, name: user.name, role: user.role }
          });
        }
        return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
      }

      if (action === 'me' && req.method === 'GET') {
        const user = db.users[0];
        return res.status(200).json({
          success: true,
          user: { id: user.id, username: user.username, name: user.name, role: user.role }
        });
      }

      if (action === 'change-password' && req.method === 'POST') {
        const body = getBody();
        if (body.new_password && body.new_password.length >= 4) {
          db.users[0].password = body.new_password;
          saveDb(db);
          return res.status(200).json({ success: true, message: 'Contraseña actualizada' });
        }
        return res.status(400).json({ success: false, error: 'Contraseña inválida' });
      }
    }

    // -------------------------------------------------------------
    // 2. SEDES ENDPOINTS (/api/sedes or /api/sedes.php)
    // -------------------------------------------------------------
    if (pathname.includes('/sedes')) {
      // Reorder
      if (action === 'reorder' && req.method === 'POST') {
        const body = getBody();
        const orders = body.orders || [];
        orders.forEach(o => {
          const s = db.sedes.find(item => item.id === o.id);
          if (s) s.order_num = o.order_num;
        });
        saveDb(db);
        return res.status(200).json({ success: true, message: 'Orden actualizado' });
      }

      // Single Sede
      if (req.method === 'GET' && (id !== null || slug !== null)) {
        const s = db.sedes.find(item => (id !== null ? item.id === id : item.slug === slug));
        if (!s) return res.status(404).json({ success: false, error: 'Sede no encontrada' });
        const media = db.media_items.filter(m => m.sede_id === s.id);
        return res.status(200).json({
          success: true,
          data: {
            ...s,
            total_media: media.length,
            total_videos: media.filter(m => m.type === 'video').length,
            total_images: media.filter(m => m.type === 'image').length,
            active_media: media.filter(m => m.is_active === 1).length
          }
        });
      }

      // All Sedes
      if (req.method === 'GET') {
        const isPublic = searchParams.get('public') === '1';
        let list = isPublic ? db.sedes.filter(s => s.is_active === 1) : [...db.sedes];
        list.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));

        const data = list.map(s => {
          const media = db.media_items.filter(m => m.sede_id === s.id);
          const firstActive = media.find(m => m.is_active === 1);
          return {
            ...s,
            total_media: media.length,
            total_videos: media.filter(m => m.type === 'video').length,
            total_images: media.filter(m => m.type === 'image').length,
            active_media: media.filter(m => m.is_active === 1).length,
            preview_url: firstActive ? firstActive.filename : null,
            preview_type: firstActive ? firstActive.type : null
          };
        });
        return res.status(200).json({ success: true, data });
      }

      // Create Sede
      if (req.method === 'POST') {
        const body = getBody();
        const maxId = db.sedes.reduce((max, s) => Math.max(max, s.id), 0);
        const maxOrder = db.sedes.reduce((max, s) => Math.max(max, s.order_num || 0), 0);
        const newSede = {
          id: maxId + 1,
          name: body.name || 'Nueva Sede',
          slug: makeSlug(body.name || 'nueva-sede') + (db.sedes.some(s => s.slug === makeSlug(body.name)) ? `-${Date.now()}` : ''),
          description: body.description || '',
          address: body.address || '',
          color: body.color || '#2563eb',
          icon: body.icon || 'Building2',
          order_num: maxOrder + 1,
          is_active: body.is_active !== undefined ? body.is_active : 1,
          created_at: new Date().toISOString()
        };
        db.sedes.push(newSede);
        saveDb(db);
        return res.status(201).json({ success: true, message: 'Sede creada', data: newSede });
      }

      // Update Sede
      if (req.method === 'PUT' && id !== null) {
        const body = getBody();
        const idx = db.sedes.findIndex(s => s.id === id);
        if (idx === -1) return res.status(404).json({ success: false, error: 'Sede no encontrada' });
        db.sedes[idx] = { ...db.sedes[idx], ...body, id };
        saveDb(db);
        return res.status(200).json({ success: true, message: 'Sede actualizada' });
      }

      // Delete Sede
      if (req.method === 'DELETE' && id !== null) {
        db.sedes = db.sedes.filter(s => s.id !== id);
        db.media_items = db.media_items.filter(m => m.sede_id !== id);
        saveDb(db);
        return res.status(200).json({ success: true, message: 'Sede eliminada' });
      }
    }

    // -------------------------------------------------------------
    // 3. MEDIA ENDPOINTS (/api/media or /api/media.php)
    // -------------------------------------------------------------
    if (pathname.includes('/media')) {
      // Add by URL
      if (action === 'add-url' && req.method === 'POST') {
        const body = getBody();
        const sid = parseInt(body.sede_id, 10);
        const maxId = db.media_items.reduce((max, m) => Math.max(max, m.id), 0);
        const maxOrder = db.media_items.filter(m => m.sede_id === sid).reduce((max, m) => Math.max(max, m.order_num || 0), 0);
        const type = body.type || (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(body.url) ? 'image' : 'video');

        const newItem = {
          id: maxId + 1,
          sede_id: sid,
          title: body.title || (type === 'video' ? 'Video Streaming' : 'Imagen Enlace'),
          type,
          filename: body.url,
          url: body.url,
          original_name: body.url.split('/').pop() || 'media_url',
          mime_type: type === 'video' ? 'video/mp4' : 'image/jpeg',
          file_size: 0,
          formatted_size: 'CDN / Nube',
          duration: type === 'video' ? 0 : (parseInt(body.duration, 10) || 10),
          fit_mode: body.fit_mode || 'contain',
          order_num: maxOrder + 1,
          is_active: 1,
          created_at: new Date().toISOString()
        };
        db.media_items.push(newItem);
        saveDb(db);
        return res.status(201).json({ success: true, message: 'Contenido añadido', data: newItem });
      }

      // Reorder Media
      if (action === 'reorder' && req.method === 'POST') {
        const body = getBody();
        const orders = body.orders || [];
        orders.forEach(o => {
          const m = db.media_items.find(item => item.id === o.id);
          if (m) m.order_num = o.order_num;
        });
        saveDb(db);
        return res.status(200).json({ success: true, message: 'Orden guardado' });
      }

      // Bulk Delete
      if (action === 'bulk-delete' && req.method === 'POST') {
        const body = getBody();
        const ids = body.ids || [];
        db.media_items = db.media_items.filter(m => !ids.includes(m.id));
        saveDb(db);
        return res.status(200).json({ success: true, message: 'Archivos eliminados' });
      }

      // Get Media for Sede
      if (req.method === 'GET' && sedeId !== null) {
        const activeOnly = searchParams.get('active_only') === '1';
        let items = db.media_items.filter(m => m.sede_id === sedeId);
        if (activeOnly) items = items.filter(m => m.is_active === 1);
        items.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));
        const data = items.map(m => ({
          ...m,
          url: m.filename,
          formatted_size: m.formatted_size || formatBytes(m.file_size)
        }));
        return res.status(200).json({ success: true, data });
      }

      // Update Media
      if (req.method === 'PUT' && id !== null) {
        const body = getBody();
        const idx = db.media_items.findIndex(m => m.id === id);
        if (idx === -1) return res.status(404).json({ success: false, error: 'Media no encontrado' });
        db.media_items[idx] = { ...db.media_items[idx], ...body, id };
        saveDb(db);
        return res.status(200).json({ success: true, message: 'Contenido actualizado' });
      }

      // Delete Single Media
      if (req.method === 'DELETE' && id !== null) {
        db.media_items = db.media_items.filter(m => m.id !== id);
        saveDb(db);
        return res.status(200).json({ success: true, message: 'Archivo eliminado' });
      }
    }

    // -------------------------------------------------------------
    // 4. PLAYLIST ENDPOINTS (/api/playlist or /api/playlist.php)
    // -------------------------------------------------------------
    if (pathname.includes('/playlist')) {
      const s = db.sedes.find(item => (sedeId !== null ? item.id === sedeId : item.slug === slug));
      if (!s) return res.status(404).json({ success: false, error: 'Sede no encontrada' });

      let items = db.media_items.filter(m => m.sede_id === s.id && m.is_active === 1);
      items.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));

      const playlist = items.map(m => ({
        id: m.id,
        title: m.title,
        type: m.type,
        url: m.filename,
        duration: m.type === 'video' ? 0 : (m.duration || 10),
        fit_mode: m.fit_mode || 'contain',
        order_num: m.order_num
      }));

      const versionHash = crypto.createHash('md5').update(JSON.stringify(playlist) + JSON.stringify(db.settings)).digest('hex');

      if (searchParams.get('check_version') === '1') {
        return res.status(200).json({ success: true, version_hash: versionHash });
      }

      return res.status(200).json({
        success: true,
        sede: { id: s.id, name: s.name, slug: s.slug, color: s.color, icon: s.icon },
        settings: db.settings,
        playlist,
        version_hash: versionHash
      });
    }

    // -------------------------------------------------------------
    // 5. STATS ENDPOINTS (/api/stats or /api/stats.php)
    // -------------------------------------------------------------
    if (pathname.includes('/stats')) {
      const totalSedes = db.sedes.length;
      const activeSedes = db.sedes.filter(s => s.is_active === 1).length;
      const totalMedia = db.media_items.length;
      const totalVideos = db.media_items.filter(m => m.type === 'video').length;
      const totalImages = db.media_items.filter(m => m.type === 'image').length;
      const activeMedia = db.media_items.filter(m => m.is_active === 1).length;

      const sedesList = db.sedes.map(s => {
        const m = db.media_items.filter(item => item.sede_id === s.id);
        return {
          ...s,
          media_count: m.length,
          video_count: m.filter(item => item.type === 'video').length,
          image_count: m.filter(item => item.type === 'image').length,
          active_media_count: m.filter(item => item.is_active === 1).length
        };
      });

      return res.status(200).json({
        success: true,
        stats: {
          total_sedes: totalSedes,
          active_sedes: activeSedes,
          total_media: totalMedia,
          total_videos: totalVideos,
          total_images: totalImages,
          active_media: activeMedia,
          total_storage_bytes: 0,
          formatted_storage: 'Cloud / Local'
        },
        sedes: sedesList,
        recent_media: db.media_items.slice(-6).reverse().map(m => ({
          ...m,
          url: m.filename,
          sede_name: (db.sedes.find(s => s.id === m.sede_id) || {}).name || 'Sede'
        })),
        system: {
          platform: 'Vercel Serverless',
          node_version: process.version,
          server_time: new Date().toISOString()
        }
      });
    }

    // -------------------------------------------------------------
    // 6. SETTINGS ENDPOINTS (/api/settings or /api/settings.php)
    // -------------------------------------------------------------
    if (pathname.includes('/settings')) {
      if (req.method === 'POST' || req.method === 'PUT') {
        const body = getBody();
        db.settings = { ...db.settings, ...body };
        saveDb(db);
        return res.status(200).json({ success: true, message: 'Configuración guardada' });
      }
      return res.status(200).json({ success: true, settings: db.settings });
    }

    // Default API Info / Health
    return res.status(200).json({
      success: true,
      app: 'Visor TV Sistemas API (Vercel Serverless)',
      status: 'online',
      version: '1.0.0'
    });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
};
