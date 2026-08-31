import React, { useState, useEffect, useCallback } from 'react';
import { settingsService, authService } from '../services/api';
import {
  Settings,
  Lock,
  Tv,
  Check,
  AlertTriangle,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    app_name: 'Visor TV Sistemas',
    default_image_duration: '10',
    tv_show_clock: '1',
    tv_show_sede_title: '1',
    tv_show_progress_bar: '1',
    tv_auto_refresh_seconds: '30',
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ text: '', type: '' });

  // Password state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const loadSettings = useCallback(async () => {
    try {
      const res = await settingsService.getSettings();
      if (res.data.success && res.data.settings) {
        setSettings((prev) => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage({ text: '', type: '' });

    try {
      const res = await settingsService.updateSettings(settings);
      if (res.data.success) {
        setSettingsMessage({ text: 'Configuración guardada exitosamente', type: 'success' });
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setSettingsMessage({ text: 'Error al guardar la configuración', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordMessage({ text: 'Las nuevas contraseñas no coinciden', type: 'error' });
      return;
    }

    if (passwordData.new_password.length < 4) {
      setPasswordMessage({ text: 'La contraseña debe tener al menos 4 caracteres', type: 'error' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await authService.changePassword(
        passwordData.current_password,
        passwordData.new_password
      );
      if (res.data.success) {
        setPasswordMessage({ text: 'Contraseña cambiada exitosamente', type: 'success' });
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordMessage({
        text: err.response?.data?.error || 'Error al cambiar la contraseña',
        type: 'error',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          <span>Cargando configuración del sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-blue-500" />
          <span>Configuración del Sistema</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Ajustes globales de reproducción de pantallas y seguridad de acceso
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TV Display Configuration */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Parámetros de Reproducción TV</h2>
              <p className="text-xs text-slate-400">Comportamiento del reproductor de pantallas</p>
            </div>
          </div>

          {settingsMessage.text && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
                settingsMessage.type === 'error'
                  ? 'bg-red-950/60 border border-red-800 text-red-300'
                  : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              }`}
            >
              {settingsMessage.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <span>{settingsMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre del Sistema
              </label>
              <input
                type="text"
                value={settings.app_name}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Duración Predeterminada de Fotos (Segundos)
              </label>
              <input
                type="number"
                min="3"
                max="120"
                value={settings.default_image_duration}
                onChange={(e) => setSettings({ ...settings, default_image_duration: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Intervalo de Sincronización Automática (Segundos)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.tv_auto_refresh_seconds}
                onChange={(e) => setSettings({ ...settings, tv_auto_refresh_seconds: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Frecuencia con la que las TVs verifican si se subió nuevo contenido.
              </span>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tv_show_clock === '1'}
                  onChange={(e) => setSettings({ ...settings, tv_show_clock: e.target.checked ? '1' : '0' })}
                  className="w-4 h-4 rounded-md border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-medium">
                  Mostrar reloj digital en el Visor TV
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tv_show_sede_title === '1'}
                  onChange={(e) => setSettings({ ...settings, tv_show_sede_title: e.target.checked ? '1' : '0' })}
                  className="w-4 h-4 rounded-md border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-medium">
                  Mostrar información y título de sede en pantalla
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tv_show_progress_bar === '1'}
                  onChange={(e) => setSettings({ ...settings, tv_show_progress_bar: e.target.checked ? '1' : '0' })}
                  className="w-4 h-4 rounded-md border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-medium">
                  Mostrar barra de progreso en controles de TV
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Guardando...' : 'Guardar Parámetros'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Change Admin Password */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Seguridad de Administrador</h2>
              <p className="text-xs text-slate-400">Actualizar clave de acceso al panel</p>
            </div>
          </div>

          {passwordMessage.text && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
                passwordMessage.type === 'error'
                  ? 'bg-red-950/60 border border-red-800 text-red-300'
                  : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              }`}
            >
              {passwordMessage.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nueva Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirmar Nueva Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{savingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
