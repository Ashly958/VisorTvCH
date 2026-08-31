import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../services/api';
import IconRenderer from '../components/IconRenderer';
import {
  Building2,
  Tv,
  Film,
  Image,
  HardDrive,
  ExternalLink,
  Upload,
  Play,
  ArrowRight,
  RefreshCw,
  Server,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await statsService.getStats();
      if (res.data.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('visorDataUpdated', handleUpdate);
    return () => window.removeEventListener('visorDataUpdated', handleUpdate);
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          <span>Cargando panel de control...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Sedes Registradas',
      value: stats?.stats?.total_sedes || 0,
      subvalue: `${stats?.stats?.active_sedes || 0} activas`,
      icon: Building2,
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-400',
      link: '/admin/sedes',
    },
    {
      title: 'Videos Configurados',
      value: stats?.stats?.total_videos || 0,
      subvalue: 'En reproducción continua',
      icon: Film,
      color: 'from-purple-600 to-indigo-600',
      textColor: 'text-purple-400',
      link: '/admin/media',
    },
    {
      title: 'Imágenes / Carteles',
      value: stats?.stats?.total_images || 0,
      subvalue: 'Con temporizador ajustable',
      icon: Image,
      color: 'from-emerald-600 to-teal-600',
      textColor: 'text-emerald-400',
      link: '/admin/media',
    },
    {
      title: 'Almacenamiento Usado',
      value: stats?.stats?.formatted_storage || '0 B',
      subvalue: `${stats?.stats?.total_media || 0} archivos totales`,
      icon: HardDrive,
      color: 'from-amber-600 to-orange-600',
      textColor: 'text-amber-400',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Dashboard General
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervisión y control del sistema de transmisiones de cartelería digital
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <Link
            to="/admin/media"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Contenido</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <span>{kpi.subvalue}</span>
                  {kpi.link && (
                    <Link to={kpi.link} className={`${kpi.textColor} hover:underline font-medium`}>
                      Gestionar →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sedes Status Overview */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-blue-400" />
              <span>Estado de Transmisión por Sede</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Acceda directamente al visor en pantalla completa o gestione la lista de reproducción
            </p>
          </div>

          <Link
            to="/admin/sedes"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            <span>Ver todas las sedes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stats?.sedes || []).map((sede) => (
            <div
              key={sede.id}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs shadow-sm"
                      style={{ backgroundColor: sede.color || '#3b82f6' }}
                    >
                      <IconRenderer name={sede.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        {sede.name}
                      </h3>
                      <span className="text-[11px] text-slate-400">/{sede.slug}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      sede.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {sede.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-slate-900/80 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Videos</span>
                    <span className="font-semibold text-white">{sede.video_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Imágenes</span>
                    <span className="font-semibold text-white">{sede.image_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                <a
                  href={`/visor/${sede.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Abrir TV</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <Link
                  to={`/admin/media?sede_id=${sede.id}`}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium text-center transition-colors"
                >
                  Gestionar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Media & System info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Media */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              <span>Últimos Archivos Subidos</span>
            </h2>
            <Link to="/admin/media" className="text-xs text-blue-400 hover:underline">
              Ver todos →
            </Link>
          </div>

          <div className="space-y-2">
            {(stats?.recent_media || []).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                    {m.type === 'video' ? <Film className="w-4 h-4 text-purple-400" /> : <Image className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-white truncate">{m.title || m.filename}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.sede_color || '#3b82f6' }} />
                      <span>{m.sede_name}</span> • <span>{m.formatted_size}</span>
                    </p>
                  </div>
                </div>

                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                >
                  Ver
                </a>
              </div>
            ))}

            {(stats?.recent_media || []).length === 0 && (
              <p className="text-center py-6 text-xs text-slate-400 italic">
                Aún no has subido videos o imágenes. Ve a la sección Multimedia para comenzar.
              </p>
            )}
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <span>Estado del Servidor</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex justify-between">
              <span className="text-slate-400">Versión PHP</span>
              <span className="font-mono font-semibold text-white">{stats?.system?.php_version || '8.2'}</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex justify-between">
              <span className="text-slate-400">Límite Subida (upload_max)</span>
              <span className="font-mono font-semibold text-white">{stats?.system?.upload_max_filesize || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex justify-between">
              <span className="text-slate-400">Motor de Base de Datos</span>
              <span className="font-semibold text-emerald-400">SQLite 3 (WAL Mode)</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex justify-between">
              <span className="text-slate-400">Hora Servidor</span>
              <span className="font-mono text-slate-300">{stats?.system?.server_time || ''}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
