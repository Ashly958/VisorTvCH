import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sedesService } from '../services/api';
import IconRenderer from '../components/IconRenderer';
import {
  Tv,
  Film,
  Image,
  Play,
  ArrowRight,
  ShieldLock,
  Search,
  RefreshCw,
  Layers,
  Clock,
  Radio,
} from 'lucide-react';

const SedesSelection = () => {
  const navigate = useNavigate();
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadSedes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sedesService.getAll(true); // Public active only
      if (res.data.success) {
        setSedes(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching sedes:', err);
      setError('No se pudo conectar con el servidor de sedes. Verifique que el backend PHP esté en ejecución.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSedes();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadSedes]);

  const filteredSedes = (Array.isArray(sedes) ? sedes : []).filter((s) =>
    (s?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (s?.description && s.description.toLowerCase().includes((searchTerm || '').toLowerCase())) ||
    (s?.address && s.address.toLowerCase().includes((searchTerm || '').toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Visor TV <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Digital Signage</span>
            </h1>
            <p className="text-xs text-slate-400">Seleccione la sede para iniciar la reproducción continua</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live Clock for Kiosks */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono font-medium">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <Link
            to="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 shadow-sm transition-all hover:border-slate-600"
          >
            <ShieldLock className="w-4 h-4 text-blue-400" />
            <span>Administración</span>
          </Link>
        </div>
      </header>

      {/* Hero / Sede Chooser Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20 mb-2">
              <Radio className="w-3 h-3 animate-pulse" /> Canales de Transmisión Activos
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Sedes Disponibles
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Haga clic en una sede para proyectar su contenido audiovisual en pantalla completa.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar sede..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              onClick={loadSedes}
              title="Recargar sedes"
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadSedes}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 rounded-lg text-xs font-medium text-white transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && sedes.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-56 bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl" />
                  <div className="w-3/4 h-5 bg-slate-800 rounded-md" />
                  <div className="w-1/2 h-3 bg-slate-800/60 rounded-md" />
                </div>
                <div className="w-full h-10 bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Sedes Grid */}
        {!loading && filteredSedes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSedes.map((sede) => {
              const hasMedia = (sede.active_media || 0) > 0;
              return (
                <div
                  key={sede.id}
                  onClick={() => navigate(`/visor/${sede.slug}`)}
                  className="group relative bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  {/* Decorative glowing gradient border top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: sede.color || '#3b82f6' }}
                  />

                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110 duration-300"
                        style={{ backgroundColor: sede.color || '#3b82f6' }}
                      >
                        <IconRenderer name={sede.icon} className="w-6 h-6" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700/50">
                          <Film className="w-3 h-3 text-blue-400" />
                          <span>{sede.total_videos || 0}</span>
                        </span>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700/50">
                          <Image className="w-3 h-3 text-emerald-400" />
                          <span>{sede.total_images || 0}</span>
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {sede.name}
                    </h3>
                    
                    {sede.description && (
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {sede.description}
                      </p>
                    )}

                    {sede.address && (
                      <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1">
                        <span>📍</span> {sede.address}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${hasMedia ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      <span className="text-xs text-slate-400">
                        {hasMedia ? `${sede.active_media} contenidos listos` : 'Sin contenido aún'}
                      </span>
                    </div>

                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white group-hover:bg-blue-600 bg-slate-800 transition-colors shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Reproducir</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredSedes.length === 0 && (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-8">
            <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No se encontraron sedes</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
              {searchTerm ? 'No hay sedes que coincidan con la búsqueda.' : 'No hay sedes activas registradas en el sistema.'}
            </p>
            <Link
              to="/admin/sedes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <ShieldLock className="w-4 h-4" />
              <span>Gestionar Sedes en Administración</span>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/60 bg-slate-950/40 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Visor TV Sistemas • Reproducción Continua Digital Signage</p>
        <div className="flex items-center gap-4">
          <Link to="/admin" className="hover:text-blue-400 transition-colors">Panel Admin</Link>
          <span>•</span>
          <span className="text-slate-400">Presione F11 para Pantalla Completa en TV</span>
        </div>
      </footer>
    </div>
  );
};

export default SedesSelection;
