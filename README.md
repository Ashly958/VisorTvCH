# 📺 Visor TV Sistemas - Digital Signage & Pantallas Continuas

Sistema profesional y moderno para la transmisión continua de videos e imágenes (tipo álbum / carrusel) en pantallas de televisión, kioscos y salas de espera, segmentado por sedes y gestionado mediante un panel de administración seguro con autenticación.

---

## 🌟 Características Principales

### 1. 🏢 Selector de Sedes Kiosk / TV (`/` o `/sedes`)
- **Interfaz Kiosk / TV:** Visualización moderna con tarjetas interactivas de las **6 sedes** gestionadas (o las que se agreguen).
- **Contador en vivo:** Muestra la cantidad de videos e imágenes activos en cada sede.
- **Acceso instantáneo:** Al hacer clic en cualquier sede, inicia de inmediato el reproductor a pantalla completa.
- **Compatible con mandos a distancia y teclados.**

### 2. 🎬 Visor TV de Reproducción Continua (`/visor/:slug`)
- **Loop Infinito sin Interrupciones:** Reproduce videos (`.mp4`, `.webm`, `.mov`) y fotos (`.jpg`, `.png`, `.webp`, `.gif`) de forma continua.
- **Transición Fluida:** Sin parpadeos en pantalla negra.
- **Temporizador Inteligente:** Duración configurable por cada imagen (ej. 5s, 8s, 10s, 15s).
- **Auto-Sync en Segundo Plano:** El visor consulta al servidor cada 30 segundos; si el administrador sube o reordena contenido, el visor actualiza la lista en memoria **sin interrumpir el video en curso**.
- **Controles Auto-Ocultables:** Barra de estado con reloj digital, título de sede, contador `# item / total`, barra de progreso, control de sonido (Mute / Unmute), selector de ajuste de pantalla (Contain / Cover) y pantalla completa.
- **Atajos de Teclado / Control Remoto:**
  - `F` o `F11`: Pantalla Completa
  - `Espacio`: Pausar / Reanudar
  - `Flecha Derecha`: Siguiente contenido
  - `Flecha Izquierda`: Contenido anterior
  - `M`: Silenciar / Activar audio

### 3. 🔐 Panel de Administración Seguro (`/admin`)
- **Control de Acceso con Clave:** Protegido mediante Tokens de sesión y contraseñas cifradas (`bcrypt`).
- **Dashboard General:** Métricas de sedes, videos activos, fotos, almacenamiento usado y diagnóstico del servidor.
- **Gestión de Sedes (CRUD):**
  - Crear nuevas sedes con nombre, descripción, dirección, color de marca e ícono.
  - Editar, activar/desactivar y eliminar sedes (con borrado automático de archivos).
  - Reordenar sedes (Subir / Bajar).
- **Gestión Multimedia por Sede (CRUD):**
  - **Subida múltiple (Drag & Drop):** Soporta subida en lote de videos e imágenes.
  - **Barra de progreso de subida** en tiempo real.
  - **Reordenamiento visual:** Subir / bajar el orden de proyección de cada elemento.
  - **Edición rápida:** Cambiar títulos, tiempos de exposición de fotos (en segundos), modo de ajuste y estado activo/oculto.
  - **Vista previa Lightbox y reproductor de video integrado.**
  - **Eliminación individual o por lote (Bulk Delete).**
  - **Botón de prueba directa en TV.**
- **Configuración del Sistema:**
  - Cambio de clave de administrador.
  - Parámetros de visualización (mostrar/ocultar reloj, barra de progreso, frecuencia de auto-sincronización).

---

## 🚀 Inicio Rápido

### Opción 1: Un solo clic en Windows
Ejecute el archivo:
```bat
iniciar_sistema.bat
```
Esto iniciará el servidor integrado y abrirá automáticamente el navegador en:
👉 `http://localhost:8000`

### Opción 2: Modo Desarrollo (Hot Reloading)
Ejecute:
```bat
iniciar_desarrollo.bat
```
- Frontend Vite: `http://localhost:5173`
- Backend API PHP: `http://localhost:8000`

---

## 🔑 Credenciales de Acceso Inicial

| Campo | Valor |
| :--- | :--- |
| **Usuario** | `admin` |
| **Contraseña** | `admin123` |
| **URL Admin** | [http://localhost:8000/admin](http://localhost:8000/admin) |

*(Puede cambiar la contraseña en cualquier momento desde el menú **Configuración** en el panel).*

---

## 📺 Direcciones Directas por Sede (Para Smart TVs y Kioscos)

Cada televisor en su respectiva sede puede abrirse directamente apuntando su navegador a:

- **Sede Principal (Centro):** `http://<IP-SERVIDOR>:8000/visor/sede-principal`
- **Sede Norte:** `http://<IP-SERVIDOR>:8000/visor/sede-norte`
- **Sede Sur:** `http://<IP-SERVIDOR>:8000/visor/sede-sur`
- **Sede Occidente:** `http://<IP-SERVIDOR>:8000/visor/sede-occidente`
- **Sede Oriente:** `http://<IP-SERVIDOR>:8000/visor/sede-oriente`
- **Sede VIP / Corporativa:** `http://<IP-SERVIDOR>:8000/visor/sede-vip`

---

## 📁 Estructura del Proyecto

```
visor_tv_sistemas/
│
├── api/                        # Backend en PHP
│   ├── config.php              # Configuración global, CORS y helpers JWT
│   ├── db.php                  # Base de datos SQLite y seeders automáticos
│   ├── auth.php                # Endpoint de inicio de sesión y perfiles
│   ├── sedes.php               # CRUD de sedes
│   ├── media.php               # CRUD de videos/fotos y subida múltiple
│   ├── playlist.php            # Endpoint optimizado para el Visor TV
│   ├── stats.php               # Métricas del Dashboard
│   ├── settings.php            # Ajustes del sistema
│   └── uploads/                # Archivos multimedia almacenados
│       └── media/              # Videos e imágenes subidos
│
├── client/                     # Frontend en React (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Modales, Iconos, Reproductores
│   │   ├── context/            # Contexto de autenticación
│   │   ├── layouts/            # Layout responsivo del panel Admin
│   │   ├── pages/              # Páginas (SedesSelection, VisorTV, AdminDashboard, AdminMedia, etc.)
│   │   ├── services/           # Cliente Axios e integraciones de API
│   │   ├── App.jsx             # Enrutador principal
│   │   └── index.css           # Estilos y animaciones TV Signage
│   └── dist/                   # Compilado de producción
│
├── database/                   # Base de datos SQLite (visor_tv.sqlite)
├── router.php                  # Enrutador unificado PHP (API + SPA + Streaming de video)
├── iniciar_sistema.bat         # Lanzador 1-clic para producción
├── iniciar_desarrollo.bat      # Lanzador para desarrollo
└── README.md
```

---

## 🛠️ Requisitos del Sistema
- **PHP 8.0+** (con extensiones `pdo_sqlite`, `fileinfo`, `mbstring` activas por defecto).
- **Node.js 18+** y `npm` (para compilar cambios del frontend).
- Navegador moderno con soporte HTML5 Video (Chrome, Edge, Firefox, Safari, WebOS TV, Android TV).
