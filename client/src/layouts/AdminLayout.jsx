import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sedesService } from '../services/api';
import {
  LayoutDashboard,
  Building2,
  Tv,
  Film,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sedes, setSedes] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadSedes = useCallback(async () => {
    try {
      const res = await sedesService.getAll();
      if (res.data.success) {
        setSedes(res.data.data);
      }
    } catch (err) {
      console.error('Error loading sedes for sidebar:', err);
    }
  }, []);

  useEffect(() => {
    loadSedes();
  }, [location.pathname, loadSedes]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Gestión de Sedes', path: '/admin/sedes', icon: Building2 },
    { label: 'Gestión Multimedia', path: '/admin/media', icon: Film },
    { label: 'Configuración', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Tv className="w-4 h-4" />
          </div>
          <span className="font-bold text-white tracking-wide">Visor TV Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-72 bg-slate-900 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white leading-tight">Visor TV</h1>
            <p className="text-xs text-blue-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 inline" /> Panel de Control
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {/* Main Links */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Menú Principal
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Quick TV Player Launcher list */}
          <div className="space-y-1">
            <div className="px-3 pb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Visores en Vivo ({sedes.length})</span>
              <NavLink to="/" target="_blank" className="text-blue-400 hover:underline flex items-center gap-0.5 text-[10px]">
                Ver Todo <ExternalLink className="w-2.5 h-2.5" />
              </NavLink>
            </div>
            
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {sedes.map((s) => (
                <a
                  key={s.id}
                  href={`/visor/${s.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: s.color || '#3b82f6' }} 
                    />
                    <span className="truncate">{s.name}</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {s.active_media || 0}
                  </span>
                </a>
              ))}
              {sedes.length === 0 && (
                <p className="px-3 text-xs text-slate-400 italic">No hay sedes registradas</p>
              )}
            </div>
          </div>
        </div>

        {/* User Info & Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrador'}</p>
                <p className="text-[11px] text-slate-400 truncate">@{user?.username || 'admin'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <NavLink
            to="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-300 hover:text-white rounded-lg transition-all border border-slate-700/50"
          >
            <span>Ir al Selector de Sedes</span>
            <ExternalLink className="w-3 h-3" />
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
