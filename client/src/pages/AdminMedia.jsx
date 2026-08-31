import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sedesService, mediaService } from '../services/api';
import Modal from '../components/Modal';
import {
  Film,
  Upload,
  Trash2,
  Play,
  Eye,
  ArrowUp,
  ArrowDown,
  Check,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Sliders,
  Tv,
  Clock,
  Link2,
  Plus,
  Globe,
} from 'lucide-react';

const AdminMedia = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSedeId = searchParams.get('sede_id');

  const [sedes, setSedes] = useState([]);
  const [selectedSedeId, setSelectedSedeId] = useState(initialSedeId || '');
  const [mediaItems, setMediaItems] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [defaultDuration, setDefaultDuration] = useState(10);
  const [fitMode, setFitMode] = useState('contain');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Selection & Modals
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlFormData, setUrlFormData] = useState({
    url: '',
    title: '',
    type: 'video',
    duration: 10,
    fit_mode: 'contain'
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMessage = useCallback((text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  }, []);

  const loadMediaForSede = useCallback(async (sedeId) => {
    if (!sedeId) return;
    setLoadingMedia(true);
    setSelectedIds([]);
    try {
      const res = await mediaService.getBySede(sedeId);
      if (res.data.success) {
        setMediaItems(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
      showMessage('Error al cargar la lista de contenidos multimedia', 'error');
    } finally {
      setLoadingMedia(false);
    }
  }, [showMessage]);

  // 1. Fetch Sedes on Mount
  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const res = await sedesService.getAll(false);
        if (res.data.success && res.data.data.length > 0) {
          setSedes(res.data.data);
          if (!selectedSedeId) {
            setSelectedSedeId(res.data.data[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Error fetching sedes:', err);
        showMessage('Error al cargar la lista de sedes', 'error');
      }
    };
    fetchSedes();
  }, [selectedSedeId, showMessage]);

  // 2. Fetch Media when selected Sede changes
  useEffect(() => {
    if (selectedSedeId) {
      loadMediaForSede(selectedSedeId);
      setSearchParams({ sede_id: selectedSedeId });
    }
  }, [selectedSedeId, loadMediaForSede, setSearchParams]);

  // 3. File Upload Handling
  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0 || !selectedSedeId) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('sede_id', selectedSedeId);
    formData.append('duration', defaultDuration.toString());
    formData.append('fit_mode', fitMode);

    for (let i = 0; i < files.length; i++) {
      formData.append('files[]', files[i]);
    }

    try {
      const res = await mediaService.upload(selectedSedeId, formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      });

      if (res.data.success) {
        showMessage(res.data.message || 'Archivos subidos exitosamente', 'success');
        loadMediaForSede(selectedSedeId);
      }
    } catch (err) {
      console.error('Error uploading media:', err);
      showMessage(err.response?.data?.error || 'Error al subir los archivos', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Add Media via External URL / CDN Link
  const handleAddUrl = async (e) => {
    e.preventDefault();
    if (!urlFormData.url.trim() || !selectedSedeId) return;

    try {
      const res = await mediaService.addUrl({
        ...urlFormData,
        sede_id: selectedSedeId
      });

      if (res.data.success) {
        showMessage('Enlace multimedia agregado exitosamente', 'success');
        setShowUrlModal(false);
        setUrlFormData({
          url: '',
          title: '',
          type: 'video',
          duration: 10,
          fit_mode: 'contain'
        });
        loadMediaForSede(selectedSedeId);
      }
    } catch (err) {
      console.error('Error adding media URL:', err);
      showMessage(err.response?.data?.error || 'Error al agregar el enlace multimedia', 'error');
    }
  };

  // 4. Update Media item
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    try {
      const res = await mediaService.update(editItem.id, {
        title: editItem.title,
        duration: editItem.duration,
        fit_mode: editItem.fit_mode,
        is_active: editItem.is_active,
      });

      if (res.data.success) {
        showMessage('Contenido actualizado correctamente', 'success');
        setEditItem(null);
        loadMediaForSede(selectedSedeId);
      }
    } catch (err) {
      console.error('Error updating media item:', err);
      showMessage('Error al actualizar el contenido', 'error');
    }
  };

  // 5. Toggle item active
  const handleToggleActive = async (item) => {
    try {
      const newActive = item.is_active ? 0 : 1;
      await mediaService.update(item.id, { is_active: newActive });
      setMediaItems(
        mediaItems.map((m) => (m.id === item.id ? { ...m, is_active: newActive } : m))
      );
    } catch (err) {
      console.error('Error toggling active state:', err);
      showMessage('Error al cambiar el estado', 'error');
    }
  };

  // 6. Delete single item
  const handleDeleteSingle = async () => {
    if (!deleteItem) return;
    try {
      const res = await mediaService.delete(deleteItem.id);
      if (res.data.success) {
        showMessage('Archivo multimedia eliminado', 'success');
        setDeleteItem(null);
        loadMediaForSede(selectedSedeId);
      }
    } catch (err) {
      console.error('Error deleting media:', err);
      showMessage('Error al eliminar el archivo', 'error');
    }
  };

  // 7. Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`¿Está seguro de eliminar los ${selectedIds.length} archivos seleccionados?`)) {
      return;
    }

    try {
      const res = await mediaService.bulkDelete(selectedIds);
      if (res.data.success) {
        showMessage(res.data.message || 'Archivos eliminados exitosamente', 'success');
        loadMediaForSede(selectedSedeId);
      }
    } catch (err) {
      console.error('Error in bulk delete:', err);
      showMessage('Error al eliminar los archivos seleccionados', 'error');
    }
  };

  // 8. Reorder Items
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= mediaItems.length) return;

    const newItems = [...mediaItems];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const orders = newItems.map((item, idx) => ({
      id: item.id,
      order_num: idx + 1,
    }));

    setMediaItems(newItems);

    try {
      await mediaService.reorder(orders);
    } catch (err) {
      console.error('Error reordering media:', err);
      showMessage('Error al guardar el nuevo orden', 'error');
    }
  };

  // Select all or none
  const toggleSelectAll = () => {
    if (selectedIds.length === mediaItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mediaItems.map((m) => m.id));
    }
  };

  const toggleSelectItem = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const currentSedeObj = sedes.find((s) => s.id.toString() === selectedSedeId?.toString());

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Film className="w-7 h-7 text-purple-500" />
            <span>Gestión Multimedia de Sedes</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Suba, organice y gestione videos e imágenes para la reproducción continua en cada sede
          </p>
        </div>

        {currentSedeObj && (
          <a
            href={`/visor/${currentSedeObj.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Tv className="w-4 h-4" />
            <span>Ver Visor TV en Vivo</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Sede Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {sedes.map((s) => {
          const isSelected = s.id.toString() === selectedSedeId?.toString();
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSedeId(s.id.toString())}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color || '#3b82f6' }}
              />
              <span>{s.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {s.total_media || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alert Banner */}
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

      {/* Upload Drop Zone Card */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Subir Archivos para: <span className="text-blue-400">{currentSedeObj?.name || 'Sede seleccionada'}</span></span>
            </h2>
            <p className="text-xs text-slate-400">
              Formatos soportados: Videos (MP4, WebM, MOV, MKV) e Imágenes (JPG, PNG, WEBP, GIF). <strong className="text-slate-300 font-semibold">Sin límite de tamaño ni duración</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowUrlModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer hover:scale-105"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Añadir Video por URL / CDN</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Duración foto:</span>
              <select
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(Number(e.target.value))}
                className="bg-transparent text-white font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value={5} className="bg-slate-900">5 seg</option>
                <option value={8} className="bg-slate-900">8 seg</option>
                <option value={10} className="bg-slate-900">10 seg</option>
                <option value={15} className="bg-slate-900">15 seg</option>
                <option value={20} className="bg-slate-900">20 seg</option>
                <option value={30} className="bg-slate-900">30 seg</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Ajuste:</span>
              <select
                value={fitMode}
                onChange={(e) => setFitMode(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="contain" className="bg-slate-900">Ajustar (Contain)</option>
                <option value="cover" className="bg-slate-900">Llenar (Cover)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-1">
            <Upload className="w-6 h-6 animate-bounce" />
          </div>

          <p className="text-sm font-semibold text-white">
            Arrastre y suelte sus videos o imágenes aquí, o haga clic para examinar
          </p>
          <p className="text-xs text-slate-400">
            Puede seleccionar varios archivos a la vez para subida por lotes
          </p>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-slate-800 animate-fade-in">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-blue-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Subiendo archivos multimedia...
              </span>
              <span className="text-white">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Media Playlist Manager */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden space-y-4">
        {/* Table Controls Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Playlist de Reproducción ({mediaItems.length})
            </span>
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar {selectedIds.length} seleccionados</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              {selectedIds.length === mediaItems.length && mediaItems.length > 0 ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
            <button
              onClick={() => loadMediaForSede(selectedSedeId)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Recargar"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMedia ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Media Items List */}
        <div className="divide-y divide-slate-800/60">
          {mediaItems.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-850/50 transition-colors ${
                !item.is_active ? 'opacity-60 bg-slate-950/30' : ''
              }`}
            >
              {/* Left Details */}
              <div className="flex items-center gap-3.5">
                {/* Select Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                  className="w-4 h-4 rounded-md border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                />

                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMoveOrder(index, -1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-20 cursor-pointer"
                    title="Subir en la lista"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === mediaItems.length - 1}
                    onClick={() => handleMoveOrder(index, 1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-20 cursor-pointer"
                    title="Bajar en la lista"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Thumbnail / Media Preview */}
                <div
                  onClick={() => setPreviewItem(item)}
                  className="relative w-20 h-14 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shrink-0 cursor-pointer group flex items-center justify-center"
                >
                  {item.type === 'video' ? (
                    <>
                      <video src={item.url} className="w-full h-full object-cover" preload="metadata" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-blue-600/40 transition-colors">
                        <Play className="w-5 h-5 text-white fill-current" />
                      </div>
                    </>
                  ) : (
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Title and metadata */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
                      {item.title || item.original_name}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        item.type === 'video'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {item.type === 'video' ? 'Video' : 'Imagen'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span>Tamaño: {item.formatted_size}</span>
                    {item.type === 'image' && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        {item.duration || 10}s en pantalla
                      </span>
                    )}
                    <span>Modo: {item.fit_mode === 'cover' ? 'Llenar' : 'Ajustar'}</span>
                    <span className="font-mono text-slate-400">#{index + 1}</span>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Toggle Active Button */}
                <button
                  onClick={() => handleToggleActive(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    item.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={item.is_active ? 'Desactivar de la pantalla' : 'Activar en pantalla'}
                >
                  {item.is_active ? 'Activo' : 'Oculto'}
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => setEditItem(item)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Editar detalles y duración"
                >
                  <Sliders className="w-4 h-4" />
                </button>

                {/* Preview Button */}
                <button
                  onClick={() => setPreviewItem(item)}
                  className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Ver en grande"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => setDeleteItem(item)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar archivo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {mediaItems.length === 0 && !loadingMedia && (
            <div className="text-center py-16 p-6">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No hay archivos para esta sede</p>
              <p className="text-xs text-slate-400 mt-1">
                Suba videos o fotos en el área de arriba para configurar la lista de reproducción.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Video Preview Modal */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={`Vista Previa: ${previewItem?.title || ''}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center min-h-[360px] max-h-[70vh]">
            {previewItem?.type === 'video' ? (
              <video
                src={previewItem?.url}
                controls
                autoPlay
                className="w-full max-h-[70vh] object-contain"
              />
            ) : (
              <img
                src={previewItem?.url}
                alt={previewItem?.title}
                className="w-full max-h-[70vh] object-contain"
              />
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tipo: {previewItem?.type?.toUpperCase()}</span>
            <span>Tamaño: {previewItem?.formatted_size}</span>
            <a
              href={previewItem?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center gap-1"
            >
              Abrir archivo original <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </Modal>

      {/* Edit Media Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Editar Propiedades del Contenido"
        maxWidth="max-w-md"
      >
        {editItem && (
          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Título / Etiqueta
              </label>
              <input
                type="text"
                value={editItem.title}
                onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {editItem.type === 'image' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Duración en Pantalla (Segundos)
                </label>
                <input
                  type="number"
                  min="2"
                  max="120"
                  value={editItem.duration}
                  onChange={(e) => setEditItem({ ...editItem, duration: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Modo de Ajuste en Pantalla
              </label>
              <select
                value={editItem.fit_mode}
                onChange={(e) => setEditItem({ ...editItem, fit_mode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500"
              >
                <option value="contain">Ajustar a la pantalla (Preservar proporción)</option>
                <option value="cover">Llenar pantalla completa (Recortar bordes si es necesario)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Media via URL / CDN Modal */}
      <Modal
        isOpen={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        title="Añadir Contenido por Enlace Directo (URL / CDN)"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddUrl} className="space-y-4">
          <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-300 flex items-start gap-2.5">
            <Globe className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <p>
              Ideal para videos de gran tamaño o desplegados en la nube (AWS S3, Vercel Blob, Cloudinary, Vimeo o enlaces directos .mp4).
              <strong> No hay límite de tamaño ni tiempo.</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              URL Directa del Video o Imagen *
            </label>
            <input
              type="url"
              required
              placeholder="https://ejemplo.com/videos/anuncio-corporativo.mp4"
              value={urlFormData.url}
              onChange={(e) => {
                const val = e.target.value;
                const isImg = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(val);
                setUrlFormData({
                  ...urlFormData,
                  url: val,
                  type: isImg ? 'image' : 'video'
                });
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Título Descriptivo
              </label>
              <input
                type="text"
                placeholder="Ej: Video Promocional 4K"
                value={urlFormData.title}
                onChange={(e) => setUrlFormData({ ...urlFormData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tipo de Medio
              </label>
              <select
                value={urlFormData.type}
                onChange={(e) => setUrlFormData({ ...urlFormData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500"
              >
                <option value="video">Video (Sin límite de duración)</option>
                <option value="image">Imagen / Afiche</option>
              </select>
            </div>
          </div>

          {urlFormData.type === 'image' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Duración en Pantalla (Segundos)
              </label>
              <input
                type="number"
                min="2"
                max="300"
                value={urlFormData.duration}
                onChange={(e) => setUrlFormData({ ...urlFormData, duration: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Modo de Ajuste
            </label>
            <select
              value={urlFormData.fit_mode}
              onChange={(e) => setUrlFormData({ ...urlFormData, fit_mode: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="contain">Ajustar a la pantalla (Proporcional)</option>
              <option value="cover">Llenar pantalla completa (Cover)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowUrlModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir a la Programación</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Item Confirmation Modal */}
      <Modal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Eliminar Archivo Multimedia"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            ¿Está seguro de eliminar <strong>"{deleteItem?.title || deleteItem?.original_name}"</strong>?
            El archivo será eliminado definitivamente y dejará de mostrarse en el Visor TV.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteItem(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteSingle}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/30 transition-all"
            >
              Sí, Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminMedia;
