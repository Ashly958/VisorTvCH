# 📺 Visor TV Sistemas — Digital Signage & Pantallas Continuas

[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![PHP 8.2+](https://img.shields.io/badge/PHP-8.2+-777bb4?style=for-the-badge&logo=php)](https://www.php.net/)
[![SQLite 3](https://img.shields.io/badge/SQLite-3.0-003b57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy%20Ready-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

**Visor TV Sistemas** es una plataforma profesional y moderna de **señalización digital (Digital Signage)** y reproducción continua de videos e imágenes en bucle infinito (*loop*) para pantallas de televisión, televisores Smart TV, pantallas comerciales y kioscos informativos, segmentada por sedes y administrada mediante un panel de control con autenticación segura.

---

## ✨ Características Principales

### 🏢 1. Selector de Sedes y Kiosco TV (`/` o `/sedes`)
- **Interfaz Kiosk Moderna:** Visualización con tarjetas interactivas de todas las sedes activas con sus colores corporativos, íconos y contadores de medios.
- **Buscador en tiempo real:** Filtrado instantáneo por nombre, descripción o dirección de sede.
- **Reloj Digital:** Visualización de fecha y hora sincronizada.
- **Acceso Directo:** Un clic abre de inmediato el reproductor a pantalla completa para la sede seleccionada.

### 🎬 2. Visor TV de Reproducción Continua (`/visor/:slug`)
- **Loop Infinito sin Interrupciones:** Reproducción automática y secuencial de videos (`.mp4`, `.webm`, `.mov`, `.mkv`) y fotos (`.jpg`, `.png`, `.webp`, `.gif`, `.svg`).
- **Sin Límite de Tamaño ni Duración:**
  - Los videos se reproducen completos por su duración natural (`onEnded`).
  - Soporte para videos locales pesados (10 GB) y enlaces directos remotos / CDN.
- **Transición Suave & Preloading:** Precarga en segundo plano para evitar parpadeos negros o saltos entre transiciones.
- **Auto-Sync en Vivo:** Consulta periódica inteligente; cuando el administrador sube, edita o reordena contenido, el visor actualiza la lista en memoria **sin cortar el video que está sonando**.
- **Ocultamiento Automático de Controles y Cursor:** Tras 3.5 segundos de inactividad, el puntero del ratón y la barra de controles se ocultan (`cursor: none`) para dejar la pantalla limpia.
- **Atajos de Teclado y Mandos a Distancia:**
  | Tecla | Acción |
  | :--- | :--- |
  | `F` o `F11` | Pantalla Completa |
  | `Espacio` | Pausar / Reanudar reproducción |
  | `Flecha Derecha` | Siguiente contenido |
  | `Flecha Izquierda` | Contenido anterior |
  | `M` | Silenciar / Activar audio |

### 🔐 3. Panel de Administración Seguro (`/admin`)
- **Autenticación con Tokens JWT:** Contraseñas cifradas con algoritmo `BCrypt`.
- **Dashboard con Métricas en Vivo:** Conteo de sedes, videos activos, imágenes, espacio de almacenamiento ocupado y diagnóstico del servidor.
- **Gestión de Sedes (CRUD):**
  - Creación con autogeneración de slugs amigables, paleta de colores y catálogo de 19 iconos.
  - Edición, activación/desactivación y eliminación en cascada (limpia registros y archivos físicos).
  - Reordenamiento visual para el selector público.
- **Gestión Multimedia por Sede (CRUD):**
  - **Subida local múltiple (Drag & Drop):** Subida por lotes con barra de progreso en tiempo real.
  - **Añadir por Enlace Directo (URL / CDN):** Soporte para videos remotos en **AWS S3, Vercel Blob, Cloudinary, Vimeo o CDN** para proyectar videos 4K/8K sin ocupar espacio local.
  - **Edición Rápida:** Modificar títulos, duración de fotos (2s a 300s), modo de ajuste (`Contain` / `Cover`) y visibilidad (Activo / Oculto).
  - **Reordenamiento Dinámico:** Flechas ⬆️ / ⬇️ para cambiar la secuencia de emisión.
  - **Previsualización Lightbox:** Reproductor de video y visor de imágenes modal en alta resolución.
  - **Eliminación Individual o Masiva (Bulk Delete):** Limpieza física automática en disco.
- **Configuración Global del Sistema:**
  - Ajustes de visualización (mostrar/ocultar reloj, título de sede, barra de progreso y tiempo de refresco).
  - Cambio seguro de contraseña de administrador.

---

## 🚀 Inicio Rápido en Local (Windows)

### Opción 1: Lanzador de 1 Clic (Recomendada)
Haz doble clic en el archivo:
```bat
iniciar_sistema.bat
```
El servidor PHP arrancará en `http://localhost:8000` con límites de 10 GB y abrirá automáticamente tu navegador.

### Opción 2: Modo Desarrollo con Hot Reloading
Haz doble clic en:
```bat
iniciar_desarrollo.bat
```
- **Frontend Vite:** `http://localhost:5173`
- **Backend API PHP:** `http://localhost:8000`

### Opción 3: Manual por Terminal

```bash
# 1. Compilar el cliente React
cd client
npm install
npm run build
cd ..

# 2. Iniciar el servidor PHP
php -d upload_max_filesize=10G -d post_max_size=10G -d memory_limit=2048M -S 0.0.0.0:8000 router.php
```

---

## 🔑 Credenciales de Acceso

| Campo | Valor |
| :--- | :--- |
| **URL de Login** | [http://localhost:8000/admin](http://localhost:8000/admin) |
| **Usuario** | `admin` |
| **Contraseña** | `admin123` |

*(Puedes cambiar la contraseña en cualquier momento desde **Configuración** en el panel).*

---

## ☁️ Despliegue en Vercel

El proyecto incluye [`vercel.json`](vercel.json) y [`package.json`](package.json) preconfigurados para desplegarse con un solo comando o conectando tu repositorio:

### Paso 1: Subir a GitHub
```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

### Paso 2: Importar en Vercel
1. Ve a **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Haz clic en **Add New... ➔ Project** e importa tu repositorio de GitHub.
3. Vercel detectará la configuración automáticamente. Haz clic en **Deploy**.

> [!TIP]
> **Videos en Vercel:** Las funciones Serverless de Vercel tienen un límite de 4.5 MB para subidas directas desde formulario en su plan gratuito. En el panel de **Gestión Multimedia** (`/admin/media`), utiliza el botón **"Añadir Video por URL / CDN"** para transmitir videos en Full HD / 4K de cualquier tamaño alojados en **Vercel Blob, Cloudinary, AWS S3 o enlaces directos**.

---

## 📺 Enlaces Directos por Sede (Smart TVs y Kioscos)

Apunta el navegador de cada pantalla a su enlace correspondiente:

- **Sede Principal (Centro):** `http://<IP-SERVIDOR>:8000/visor/sede-principal`
- **Sede Norte:** `http://<IP-SERVIDOR>:8000/visor/sede-norte`
- **Sede Sur:** `http://<IP-SERVIDOR>:8000/visor/sede-sur`
- **Sede Occidente:** `http://<IP-SERVIDOR>:8000/visor/sede-occidente`
- **Sede Oriente:** `http://<IP-SERVIDOR>:8000/visor/sede-oriente`
- **Sede VIP / Corporativa:** `http://<IP-SERVIDOR>:8000/visor/sede-vip`

---

## 📁 Estructura del Repositorio

```text
visor_tv_sistemas/
├── api/                        # Backend REST API en PHP
│   ├── auth.php                # Autenticación JWT y cambio de clave
│   ├── config.php              # Helpers globales, CORS y adaptador Serverless
│   ├── db.php                  # Conexión SQLite optimizada (WAL mode)
│   ├── index.php               # Health check del API
│   ├── media.php               # CRUD de videos/imágenes y subida por URL
│   ├── playlist.php            # Motor de playlist para Smart TVs con hash
│   ├── sedes.php               # CRUD de sedes y cálculo de estadísticas
│   ├── settings.php            # Ajustes globales de TV y visualización
│   ├── stats.php               # Métricas del Dashboard administrativo
│   └── uploads/                # Directorio físico de archivos multimedia
├── client/                     # Frontend SPA en React 19 + Tailwind CSS 4
│   ├── src/
│   │   ├── components/         # Modales, IconRenderer y utilidades
│   │   ├── context/            # AuthContext con almacenamiento local seguro
│   │   ├── layouts/            # AdminLayout con barra lateral responsiva
│   │   ├── pages/              # SedesSelection, VisorTV, AdminDashboard, AdminMedia, etc.
│   │   ├── services/           # Cliente Axios con timeout ilimitado
│   │   ├── App.jsx             # Enrutamiento y rutas protegidas
│   │   ├── index.css           # Estilos globales y animaciones TV
│   │   └── main.jsx            # Punto de entrada con Error Boundary
│   ├── dist/                   # Build compilado de producción
│   └── vite.config.js          # Configuración de compilación y proxies
├── database/
│   └── visor_tv.sqlite         # Base de datos SQLite con índices de alto rendimiento
├── iniciar_sistema.bat         # Lanzador de producción en Windows con 10G limits
├── iniciar_desarrollo.bat      # Lanzador de desarrollo con hot-reloading
├── php.ini                     # Configuración de límites PHP (10G uploads)
├── package.json                # Scripts raíz para Vercel build
├── router.php                  # Enrutador PHP con streaming HTTP 206 y ETag
└── vercel.json                 # Configuración de despliegue en Vercel
```

---

## 🛠️ Requisitos del Entorno

- **PHP 8.0+** (Extensiones activas: `pdo_sqlite`, `fileinfo`, `mbstring`, `curl`).
- **Node.js 18+** y `npm` (para compilar cambios en el frontend).
- Cualquier navegador con soporte HTML5 Video (Chrome, Edge, Firefox, WebOS Smart TV, Android TV, Tizen TV, Safari).

---

## 📄 Licencia

Desarrollado para la gestión de pantallas digitales y cartelería corporativa continua.
Distribución libre para uso interno y comercial.
