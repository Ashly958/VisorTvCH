import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { playlistService } from '../services/api';
import IconRenderer from '../components/IconRenderer';
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ArrowLeft,
  Clock,
  Radio,
  Tv,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const VisorTV = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // State
  const [playlist, setPlaylist] = useState([]);
  const [sede, setSede] = useState(null);
  const [settings, setSettings] = useState({
    tv_show_clock: true,
    tv_show_sede_title: true,
    tv_show_progress_bar: true,
    tv_auto_refresh_seconds: 30,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [fitMode, setFitMode] = useState('contain'); // 'contain' or 'cover'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [versionHash, setVersionHash] = useState('');

  // Refs
  const videoRef = useRef(null);
  const imageTimerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const latestPlaylistRef = useRef([]);

  // Keep playlist ref up to date
  useEffect(() => {
    latestPlaylistRef.current = playlist;
  }, [playlist]);

  // 1. Initial Load of Playlist
  const loadPlaylist = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setError(null);
    try {
      const res = await playlistService.getPlaylist(slug);
      if (res.data.success) {
        setSede(res.data.sede);
        setSettings({
          tv_show_clock: res.data.settings?.tv_show_clock !== false,
          tv_show_sede_title: res.data.settings?.tv_show_sede_title !== false,
          tv_show_progress_bar: res.data.settings?.tv_show_progress_bar !== false,
          tv_auto_refresh_seconds: res.data.settings?.tv_auto_refresh_seconds || 30,
        });
        setPlaylist(res.data.playlist || []);
        setVersionHash(res.data.version_hash);
      }
    } catch (err) {
      console.error('Error fetching playlist:', err);
      setError(
        err.response?.data?.error || 'No se pudo cargar la programación de esta sede.'
      );
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadPlaylist(true);
  }, [loadPlaylist]);

  // 2. Background Auto-Sync
  useEffect(() => {
    const refreshSeconds = Math.max(10, settings.tv_auto_refresh_seconds || 30);
    const checkSync = async () => {
      if (!slug || !versionHash) return;
      try {
        const res = await playlistService.checkVersion(slug);
        if (res.data.success && res.data.version_hash !== versionHash) {
          loadPlaylist(false);
        }
      } catch (err) {
        console.warn('Sync check failed, will retry next cycle:', err);
      }
    };

    const syncInterval = setInterval(checkSync, refreshSeconds * 1000);
    return () => clearInterval(syncInterval);
  }, [slug, versionHash, loadPlaylist, settings.tv_auto_refresh_seconds]);

  // 3. Digital Clock updater
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // 4. Auto-hide controls on mouse/touch inactivity
  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [handleUserActivity]);

  // 5. Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  };

  // 6. Next & Previous Navigation
  const goToNext = useCallback(() => {
    const items = latestPlaylistRef.current;
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setProgress(0);
  }, []);

  const goToPrev = useCallback(() => {
    const items = latestPlaylistRef.current;
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setProgress(0);
  }, []);

  // Preload next image in background
  useEffect(() => {
    if (playlist.length > 1) {
      const nextIndex = (currentIndex + 1) % playlist.length;
      const nextItem = playlist[nextIndex];
      if (nextItem && nextItem.type === 'image' && nextItem.url) {
        const img = new window.Image();
        img.src = nextItem.url;
      }
    }
  }, [currentIndex, playlist]);

  // 7. Handle Current Media Item Playback (Video vs Image)
  const currentItem = playlist[currentIndex] || null;

  useEffect(() => {
    // Clear any active timers
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    if (!currentItem || isPaused) return;

    if (currentItem.type === 'image') {
      const durationSeconds = currentItem.duration || 10;
      const totalMs = durationSeconds * 1000;
      const intervalMs = 100;
      let elapsedMs = 0;

      progressTimerRef.current = setInterval(() => {
        elapsedMs += intervalMs;
        const pct = Math.min(100, (elapsedMs / totalMs) * 100);
        setProgress(pct);
      }, intervalMs);

      imageTimerRef.current = setTimeout(() => {
        goToNext();
      }, totalMs);
    } else if (currentItem.type === 'video') {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Autoplay video prevented by browser policy, muting:', err);
            setIsMuted(true);
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch((e) => console.error('Silent play failed:', e));
            }
          });
        }
      }
    }

    return () => {
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [currentIndex, currentItem, isPaused, goToNext]);

  // Video Time Update for progress bar
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(pct);
    }
  };

  // Video Ended callback
  const handleVideoEnded = () => {
    goToNext();
  };

  // Video Error callback
  const handleMediaError = (e) => {
    console.error('Media playback error for:', currentItem, e);
    setTimeout(() => {
      goToNext();
    }, 1500);
  };

  // Keyboard navigation for TV remotes (Space, Left, Right, F, M, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'MediaTrackNext':
          goToNext();
          break;
        case 'ArrowLeft':
        case 'MediaTrackPrevious':
          goToPrev();
          break;
        case ' ':
        case 'MediaPlayPause':
          setIsPaused((p) => !p);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          setIsMuted((m) => !m);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // ===================== RENDER STATES =====================

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 animate-bounce mb-6">
          <Tv className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Cargando Visor TV...</h2>
        <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          Conectando con la programación de la sede
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error || !sede) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-6 shadow-xl">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2">Error de Conexión</h2>
        <p className="text-slate-400 text-base max-w-md mb-8">{typeof error === 'string' ? error : (error?.message || 'Sede no encontrada')}</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => loadPlaylist(true)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Sedes
          </button>
        </div>
      </div>
    );
  }

  // 3. Empty Playlist State
  if (playlist.length === 0) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden">
        {/* Sede Top Header */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: sede.color || '#3b82f6' }}
          >
            <IconRenderer name={sede.icon} className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold">{sede.name}</h1>
            <p className="text-xs text-slate-400">{sede.address || 'Transmisión en espera'}</p>
          </div>
        </div>

        {/* Live Clock */}
        <div className="absolute top-8 right-8 flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 text-sm font-mono">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Center Content */}
        <div className="max-w-lg p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Canal en Espera</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            No hay videos o imágenes configuradas actualmente para <strong className="text-white">{sede.name}</strong>.
            Agregue contenido desde el panel de administración para comenzar la transmisión automática.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`/admin/media`}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Subir Contenido en Admin</span>
            </a>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cambiar Sede</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Active Player State
  return (
    <div
      ref={containerRef}
      className={`relative w-screen h-screen bg-black overflow-hidden select-none transition-colors ${
        showControls ? 'cursor-default' : 'cursor-none'
      }`}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
    >
      {/* ================= MEDIA PLAYBACK LAYER ================= */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
        {currentItem.type === 'video' ? (
          <video
            ref={videoRef}
            key={`video-${currentItem.id}-${currentItem.url}`}
            src={currentItem.url}
            autoPlay
            muted={isMuted}
            playsInline
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            onError={handleMediaError}
            className={`w-full h-full transition-all duration-300 ${
              fitMode === 'cover' ? 'object-cover' : 'object-contain'
            }`}
          />
        ) : (
          <img
            key={`img-${currentItem.id}-${currentItem.url}`}
            src={currentItem.url}
            alt={currentItem.title || 'Visor TV Media'}
            onError={handleMediaError}
            className={`w-full h-full transition-opacity duration-700 animate-fade-in ${
              fitMode === 'cover' ? 'object-cover' : 'object-contain'
            }`}
          />
        )}
      </div>

      {/* ================= UNMUTE PROMPT BANNER (if muted) ================= */}
      {isMuted && currentItem.type === 'video' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(false);
          }}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-semibold shadow-2xl backdrop-blur-md transition-transform hover:scale-105"
        >
          <VolumeX className="w-4 h-4 animate-pulse" />
          <span>Audio silenciado • Clic para activar sonido</span>
        </button>
      )}

      {/* ================= TOP HEADER OVERLAY (Auto-hides) ================= */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent z-20 flex items-center justify-between transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Sede Info & Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/60 shadow-lg backdrop-blur-md transition-all hover:scale-105"
            title="Volver al selector de sedes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {settings.tv_show_sede_title && (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: sede.color || '#3b82f6' }}
              >
                <IconRenderer name={sede.icon} className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-white tracking-tight drop-shadow-md">
                    {sede.name}
                  </h1>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600/80 text-[10px] font-bold text-white tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> EN VIVO
                  </span>
                </div>
                {currentItem.title && (
                  <p className="text-xs text-slate-300 drop-shadow-sm truncate max-w-md">
                    {currentItem.title}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Clock & Playlist Counter */}
        <div className="flex items-center gap-3">
          {settings.tv_show_clock && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white text-xs font-mono backdrop-blur-md shadow-lg">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          )}

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white text-xs font-semibold backdrop-blur-md shadow-lg">
            <span className="text-blue-400">{currentIndex + 1}</span> / {playlist.length}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM CONTROLS OVERLAY (Auto-hides) ================= */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 flex flex-col gap-3 transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        {settings.tv_show_progress_bar && (
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden backdrop-blur-xs">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Control Buttons Bar */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrev}
              title="Anterior (Flecha izquierda)"
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/60 backdrop-blur-md transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Reanudar (Espacio)' : 'Pausar (Espacio)'}
              className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-transform active:scale-95"
            >
              {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={goToNext}
              title="Siguiente (Flecha derecha)"
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/60 backdrop-blur-md transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Activar sonido (M)' : 'Silenciar (M)'}
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-colors ${
                isMuted
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                  : 'bg-emerald-600/90 text-white border-emerald-500'
              }`}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Aspect Ratio Fit Mode Toggle */}
            <button
              onClick={() => setFitMode(fitMode === 'contain' ? 'cover' : 'contain')}
              title={`Ajuste de pantalla: ${fitMode === 'contain' ? 'Ajustar (Proporcional)' : 'Llenar pantalla (Cover)'}`}
              className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold border border-slate-700/60 backdrop-blur-md text-slate-300 hover:text-white transition-colors"
            >
              Modo: {fitMode === 'contain' ? 'Ajustar' : 'Llenar'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Salir de pantalla completa (F11)' : 'Pantalla completa (F11)'}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/60 backdrop-blur-md transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Normal' : 'Pantalla Completa'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisorTV;
