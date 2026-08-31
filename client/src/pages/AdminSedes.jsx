import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { sedesService } from '../services/api';
import Modal from '../components/Modal';
import IconRenderer, { AVAILABLE_ICONS } from '../components/IconRenderer';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Tv,
  Film,
  Image,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  Check,
  AlertTriangle,
  MapPin,
} from 'lucide-react';

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#dc2626', // Red
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#ea580c', // Orange
];

const AdminSedes = () => {
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSede, setSelectedSede] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    color: '#2563eb',
    icon: 'Building2',
    is_active: 1,
  });

  const showMessage = useCallback((text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  }, []);

  const loadSedes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sedesService.getAll(false);
      if (res.data.success) {
        setSedes(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching sedes:', err);
      showMessage('Error al cargar la lista de sedes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadSedes();
    const handleUpdate = () => loadSedes();
    window.addEventListener('visorDataUpdated', handleUpdate);
    return () => window.removeEventListener('visorDataUpdated', handleUpdate);
  }, [loadSedes]);

  const handleOpenCreate = () => {
    setSelectedSede(null);
    setFormData({
      name: '',
      description: '',
      address: '',
      color: PRESET_COLORS[sedes.length % PRESET_COLORS.length] || '#2563eb',
      icon: 'Building2',
      is_active: 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (sede) => {
    setSelectedSede(sede);
    setFormData({
      name: sede.name,
      description: sede.description || '',
      address: sede.address || '',
      color: sede.color || '#2563eb',
      icon: sede.icon || 'Building2',
      is_active: sede.is_active,
    });
    setModalOpen(true);
  };

  const handleOpenDelete = (sede) => {
    setSelectedSede(sede);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showMessage('El nombre de la sede es obligatorio', 'error');
      return;
    }

    setFormLoading(true);
    try {
      if (selectedSede) {
        // Update
        const res = await sedesService.update(selectedSede.id, formData);
        if (res.data.success) {
          showMessage('Sede actualizada exitosamente', 'success');
        }
      } else {
        // Create
        const res = await sedesService.create(formData);
        if (res.data.success) {
          showMessage('Sede creada exitosamente', 'success');
        }
      }
      setModalOpen(false);
      loadSedes();
    } catch (err) {
      console.error('Error saving sede:', err);
      showMessage(err.response?.data?.error || 'Error al guardar la sede', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSede) return;
    setFormLoading(true);
    try {
      const res = await sedesService.delete(selectedSede.id);
      if (res.data.success) {
        showMessage('Sede eliminada exitosamente', 'success');
      }
      setDeleteModalOpen(false);
      loadSedes();
    } catch (err) {
      console.error('Error deleting sede:', err);
      showMessage(err.response?.data?.error || 'Error al eliminar la sede', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Move Sede Up or Down in order
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sedes.length) return;

    const newSedes = [...sedes];
    const temp = newSedes[index];
    newSedes[index] = newSedes[targetIndex];
    newSedes[targetIndex] = temp;

    // Build reorder payload
    const orders = newSedes.map((s, idx) => ({
      id: s.id,
      order_num: idx + 1,
    }));

    setSedes(newSedes);

    try {
      await sedesService.reorder(orders);
      loadSedes();
    } catch (err) {
      console.error('Error reordering sedes:', err);
      showMessage('Error al guardar el nuevo orden', 'error');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-500" />
            <span>Gestión de Sedes</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administre las sedes o sucursales que proyectan contenido en las pantallas TV
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Nueva Sede</span>
        </button>
      </div>

      {/* Alert / Notification banner */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
            message.type === 'error'
              ? 'bg-red-950/60 border border-red-800 text-red-300'
              : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
          }`}
        >
          {message.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Sedes Table / List Card */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Sedes: {sedes.length}
          </span>
          <button
            onClick={loadSedes}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {sedes.map((sede, index) => (
            <div
              key={sede.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-850/50 transition-colors"
            >
              {/* Left Info */}
              <div className="flex items-start gap-3.5">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMoveOrder(index, -1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-20 disabled:hover:bg-transparent"
                    title="Subir"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === sedes.length - 1}
                    onClick={() => handleMoveOrder(index, 1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-20 disabled:hover:bg-transparent"
                    title="Bajar"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sede Icon & Color */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                  style={{ backgroundColor: sede.color || '#3b82f6' }}
                >
                  <IconRenderer name={sede.icon} className="w-6 h-6" />
                </div>

                {/* Name, Slug, Description */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{sede.name}</h3>
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

                  <p className="text-xs text-slate-400 mt-0.5">{sede.description || 'Sin descripción'}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span className="font-mono bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                      /{sede.slug}
                    </span>
                    {sede.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        {sede.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Media counts & Actions */}
              <div className="flex flex-wrap items-center gap-2 sm:self-center">
                {/* Media Badges */}
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/70 text-slate-300 text-xs border border-slate-800">
                    <Film className="w-3 h-3 text-purple-400" />
                    <span>{sede.total_videos || 0}</span>
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/70 text-slate-300 text-xs border border-slate-800">
                    <Image className="w-3 h-3 text-emerald-400" />
                    <span>{sede.total_images || 0}</span>
                  </span>
                </div>

                {/* Manage media */}
                <Link
                  to={`/admin/media?sede_id=${sede.id}`}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Multimedia
                </Link>

                {/* Open Visor TV */}
                <a
                  href={`/visor/${sede.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Tv className="w-3 h-3" />
                  <span>Visor TV</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>

                {/* Edit Button */}
                <button
                  onClick={() => handleOpenEdit(sede)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Editar Sede"
                >
                  <Edit className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleOpenDelete(sede)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar Sede"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {sedes.length === 0 && !loading && (
            <div className="text-center py-12 p-6">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No hay sedes creadas</p>
              <p className="text-xs text-slate-400 mt-1">Haga clic en "Agregar Nueva Sede" para registrar la primera.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Create / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedSede ? 'Editar Sede' : 'Crear Nueva Sede'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nombre de la Sede *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Sede Principal (Norte)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <textarea
              rows={2}
              placeholder="Breve descripción del área de pantallas..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Dirección o Ubicación Física
            </label>
            <input
              type="text"
              placeholder="Ej: Calle 100 # 15 - 20"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Color Distintivo
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-7 h-7 rounded-lg transition-transform ${
                    formData.color === c ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-7 h-7 bg-transparent rounded-lg cursor-pointer border border-slate-700"
                title="Color personalizado"
              />
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Ícono de Identificación
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 max-h-36 overflow-y-auto custom-scrollbar">
              {AVAILABLE_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: iconName })}
                  className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                    formData.icon === iconName
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <IconRenderer name={iconName} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center gap-3 pt-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active === 1}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
            <span className="text-xs font-semibold text-slate-300">
              {formData.is_active ? 'Sede Activa (Visible en pantallas)' : 'Sede Inactiva (Oculta)'}
            </span>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {formLoading ? 'Guardando...' : selectedSede ? 'Actualizar Sede' : 'Crear Sede'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar Eliminación de Sede"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
            <p>
              Esta acción eliminará permanentemente la sede <strong>{selectedSede?.name}</strong> y{' '}
              <strong>todos sus archivos multimedia (videos e imágenes)</strong> alojados en el servidor.
            </p>
          </div>

          <p className="text-xs text-slate-400">
            ¿Está seguro de que desea continuar? Esta operación no se puede deshacer.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={formLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
            >
              {formLoading ? 'Eliminando...' : 'Sí, Eliminar Sede'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSedes;
