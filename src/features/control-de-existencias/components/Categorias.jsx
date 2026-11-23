import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import {
  obtenerCategorias,
  registrarCategoriaApi,
  editarCategoriaApi,
  cambiarEstadoApi,
  eliminarCategoriaApi,
} from '../services/categoriaService';
import { subirImagen, CARPETAS_UPLOAD } from '../../../services/uploadService';
import { Icons } from '../../../components/ui/Icons';
import FiltrarBuscarGlobal from '../../../components/ui/FiltrarBuscarGlobal';
import TableGlobal from '../../../components/ui/TableGlobal';
import AppAlert from '../../../components/ui/AppAlert';
import '../../../styles/kpiglobal.css';
import '../../../styles/confirmmodal.css';
import './Categorias.css';

const MAX_PAGE_SIZE = 9;

const calcularPageSizeInicial = () => {
  if (typeof window === 'undefined') return MAX_PAGE_SIZE;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 768) return 6;
  const rowH = h <= 780 ? 44 : 50;
  const overhead = h <= 780 ? 316 : 408;
  return Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor((h - overhead) / rowH)));
};

function EstadoBadge({ activo }) {
  return (
    <span className={`categoria-status ${activo ? 'activo' : 'inactivo'}`}>
      <span className="status-dot" />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function ModalShell({ children, className = '' }) {
  return (
    <div className="ru-cat-modal-overlay" role="dialog" aria-modal="true">
      <div className={`ru-cat-modal ${className}`}>{children}</div>
    </div>
  );
}

const normalizarCategoriaUI = (item) => {
  const idNumerico = item.id_categoria ?? (typeof item.id === 'number' ? item.id : String(item.id || '').replace('#', ''));
  return {
    ...item,
    id_categoria: Number(idNumerico) || idNumerico,
    id: idNumerico ? `#${idNumerico}` : item.id,
  };
};

export default function Categorias() {
  const tableSlotRef = useRef(null);
  const alertaIdRef = useRef(0);
  const [pageSize, setPageSize] = useState(calcularPageSizeInicial);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'activos' | 'inactivos'
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [formEstado, setFormEstado] = useState(true);
  const [formFoto, setFormFoto] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const archivoFotoRef = useRef(null);
  const [pagina, setPagina] = useState(1);
  const [nombreTocado, setNombreTocado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState(null);
  const [errorServidor, setErrorServidor] = useState('');
  const [notificacion, setNotificacion] = useState(null);

  const avisar = useCallback((tipo, texto) => {
    alertaIdRef.current += 1;
    setNotificacion({
      id: alertaIdRef.current,
      type: tipo === 'exito' ? 'success' : tipo,
      title:
        tipo === 'exito'
          ? '¡Éxito!'
          : tipo === 'info'
          ? 'Información'
          : tipo === 'warning'
          ? 'Advertencia'
          : 'Error',
      message: texto,
    });
  }, []);

  // Carga inicial controlada con bandera de cancelación para evitar actualizaciones duplicadas
  useEffect(() => {
    let activo = true;
    const cargarInicial = async () => {
      try {
        const data = await obtenerCategorias();
        if (!activo) return;
        const lista = Array.isArray(data) ? data : [];
        setCategorias(lista.map(normalizarCategoriaUI));
      } catch (error) {
        if (!activo) return;
        console.error('Error al listar categorías:', error);
        avisar('error', error.message || 'No se pudo conectar con el backend para listar categorías.');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargarInicial();
    return () => {
      activo = false;
    };
  }, [avisar]);

  // Filtrado compuesto: por estado y por texto en tiempo real
  const filtradas = useMemo(() => {
    let resultado = categorias;

    if (filtroEstado === 'activos') {
      resultado = resultado.filter((c) => c.estado);
    } else if (filtroEstado === 'inactivos') {
      resultado = resultado.filter((c) => !c.estado);
    }

    const texto = busqueda.trim().toLowerCase();
    if (!texto) return resultado;

    return resultado.filter((categoria) =>
      `${categoria.id} ${categoria.nombre} ${categoria.estado ? 'activo' : 'inactivo'}`
        .toLowerCase()
        .includes(texto)
    );
  }, [categorias, busqueda, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / pageSize));
  const paginaActual = Math.min(Math.max(1, pagina), totalPaginas);
  const categoriasVisibles = useMemo(
    () => filtradas.slice((paginaActual - 1) * pageSize, paginaActual * pageSize),
    [filtradas, paginaActual, pageSize]
  );

  // Adaptar registros por página (máx. 9) y altura uniforme de filas sin scroll ni recortes (idéntico a Ventas)
  const recalcularFilas = useCallback(() => {
    const slot = tableSlotRef.current;
    if (!slot) return;

    if (window.innerWidth <= 768) {
      slot.style.removeProperty('--ru-row-h');
      setPageSize((prev) => (prev === 6 ? prev : 6));
      return;
    }

    const slotHeight = Math.floor(slot.getBoundingClientRect().height);
    if (!slotHeight || slotHeight < 180) return;

    const cardEl = slot.querySelector('.produccion-table-card');
    const listHeadEl = slot.querySelector('.produccion-table-header');
    const theadEl = slot.querySelector('thead');
    const paginationEl = slot.querySelector('.produccion-pagination');
    const wrapperEl = slot.querySelector('.produccion-table-wrapper');
    const tableEl = slot.querySelector('.produccion-table');

    const cardStyle = cardEl ? window.getComputedStyle(cardEl) : null;
    const cardBorders = cardStyle
      ? Math.ceil(parseFloat(cardStyle.borderTopWidth) || 0) + Math.ceil(parseFloat(cardStyle.borderBottomWidth) || 0)
      : 2;
    const listHeadH = listHeadEl ? Math.ceil(listHeadEl.getBoundingClientRect().height) : 44;
    const theadH = theadEl ? Math.ceil(theadEl.getBoundingClientRect().height) : 38;
    const paginationH = paginationEl ? Math.ceil(paginationEl.getBoundingClientRect().height) : 48;

    const minRowH = window.innerHeight <= 780 ? 44 : 50;
    const availableBodyH = Math.floor(slotHeight - cardBorders - listHeadH - theadH - paginationH - 2);
    if (availableBodyH < 160) return;

    const filas = Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor(availableBodyH / minRowH)));
    let idealRowH = Math.max(42, Math.min(72, Math.floor(availableBodyH / filas)));

    slot.style.setProperty('--ru-row-h', `${idealRowH}px`);

    if (wrapperEl && tableEl) {
      let guard = 0;
      while (guard < 16 && idealRowH > 40 && tableEl.getBoundingClientRect().height > wrapperEl.clientHeight + 0.5) {
        idealRowH -= 1;
        slot.style.setProperty('--ru-row-h', `${idealRowH}px`);
        guard += 1;
      }
    }

    setPageSize((prev) => {
      if (prev === filas) return prev;
      setPagina(1);
      return filas;
    });
  }, []);

  useEffect(() => {
    const slot = tableSlotRef.current;
    if (!slot || typeof ResizeObserver === 'undefined') return;

    let timeoutId = null;
    const schedule = (delay = 80) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(recalcularFilas, delay);
    };

    const observer = new ResizeObserver(() => schedule(80));
    observer.observe(slot);
    schedule(40);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => schedule(30));
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [recalcularFilas]);

  useEffect(() => {
    if (!cargando) {
      const id = requestAnimationFrame(recalcularFilas);
      return () => cancelAnimationFrame(id);
    }
  }, [cargando, categoriasVisibles.length, recalcularFilas]);

  const cambiarPagina = (nuevaPagina) => {
    setPagina(Math.max(1, Math.min(nuevaPagina, totalPaginas)));
  };

  const { total, activas, inactivas } = useMemo(() => {
    let countActivas = 0;
    for (let i = 0; i < categorias.length; i += 1) {
      if (categorias[i].estado) countActivas += 1;
    }
    return {
      total: categorias.length,
      activas: countActivas,
      inactivas: categorias.length - countActivas,
    };
  }, [categorias]);

  const abrirRegistrar = () => {
    setFormNombre('');
    setFormEstado(true);
    setFormFoto('');
    setSelected(null);
    setNombreTocado(false);
    setErrorServidor('');
    setModal('registrar');
  };

  const abrirDetalle = (categoria) => {
    setSelected(categoria);
    setModal('detalle');
  };

  const abrirEditar = (categoria) => {
    setSelected(categoria);
    setFormNombre(categoria.nombre);
    setFormEstado(categoria.estado);
    setFormFoto(categoria.fotoCategoria || categoria.foto_categoria || '');
    setNombreTocado(false);
    setErrorServidor('');
    setModal('editar');
  };

  const manejarSubidaFotoCategoria = async (event) => {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (!archivo) return;

    try {
      setSubiendoFoto(true);
      setErrorServidor('');
      const res = await subirImagen(archivo, CARPETAS_UPLOAD.CATEGORIAS);
      setFormFoto(res.url);
    } catch (error) {
      setErrorServidor(error.message || 'No se pudo subir la imagen de la categoría.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const abrirEliminar = (categoria) => {
    setSelected(categoria);
    setModal('eliminar');
  };

  // Validación memoizada en tiempo real del nombre
  const errorNombre = useMemo(() => {
    const nombre = formNombre.trim();
    if (!nombre) return 'El nombre de la categoría es obligatorio.';
    if (nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (nombre.length > 100) return 'El nombre no puede superar los 100 caracteres.';
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(nombre)) {
      return 'Solo se permiten letras y espacios; no números ni símbolos.';
    }
    const idActual = String(selected?.id_categoria ?? selected?.id ?? '').replace('#', '');
    const nombreLower = nombre.toLocaleLowerCase('es');
    const duplicado = categorias.some((categoria) => {
      const idCategoria = String(categoria.id_categoria ?? categoria.id).replace('#', '');
      return (
        categoria.nombre?.trim().toLocaleLowerCase('es') === nombreLower &&
        !(modal === 'editar' && idCategoria === idActual)
      );
    });
    if (duplicado) return 'Ya existe una categoría con ese nombre.';
    return '';
  }, [formNombre, categorias, selected, modal]);

  // Registrar con actualización directa de estado local (sin recargar toda la tabla)
  const registrar = async () => {
    setNombreTocado(true);
    if (errorNombre || guardando) return;
    setGuardando(true);
    setErrorServidor('');
    try {
      const creada = await registrarCategoriaApi({
        nombre: formNombre.trim(),
        estado: true,
        fotoCategoria: formFoto.trim() || null,
      });
      const nuevaNormalizada = normalizarCategoriaUI(creada);
      setCategorias((prev) => [...prev, nuevaNormalizada]);
      setModal(null);
      setFormNombre('');
      setFormFoto('');
      setPagina(1);
      avisar('exito', '¡Categoría registrada correctamente!');
    } catch (error) {
      setErrorServidor(error.message || 'No se pudo registrar la categoría.');
      avisar('error', error.message || 'No se pudo registrar la categoría.');
    } finally {
      setGuardando(false);
    }
  };

  // Editar con actualización directa de estado local (sin recargar toda la tabla)
  const guardarCambios = async () => {
    setNombreTocado(true);
    if (errorNombre || !selected || guardando) return;
    setGuardando(true);
    setErrorServidor('');
    const idReal = selected.id_categoria || String(selected.id).replace('#', '');
    try {
      const actualizada = await editarCategoriaApi(idReal, {
        nombre: formNombre.trim(),
        estado: formEstado,
        fotoCategoria: formFoto.trim() || null,
      });
      const normalizada = normalizarCategoriaUI(actualizada);
      setCategorias((prev) =>
        prev.map((c) =>
          String(c.id_categoria ?? c.id).replace('#', '') === String(idReal)
            ? { ...c, ...normalizada }
            : c
        )
      );
      setModal(null);
      avisar('info', '¡Categoría actualizada correctamente!');
    } catch (error) {
      setErrorServidor(error.message || 'No se pudo actualizar la categoría.');
      avisar('error', error.message || 'No se pudo actualizar la categoría.');
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar Estado directamente con un clic (actualización local no bloqueante)
  const cambiarEstadoDirecto = async (categoria) => {
    if (!categoria) return;
    const idReal = String(categoria.id_categoria || String(categoria.id).replace('#', ''));
    if (cambiandoEstadoId === idReal) return;
    const nuevoEstado = !categoria.estado;
    setCambiandoEstadoId(idReal);
    try {
      const actualizada = await cambiarEstadoApi(idReal, nuevoEstado);
      const normalizada = actualizada ? normalizarCategoriaUI(actualizada) : { ...categoria, estado: nuevoEstado };
      setCategorias((prev) =>
        prev.map((c) =>
          String(c.id_categoria ?? c.id).replace('#', '') === idReal
            ? { ...c, ...normalizada, estado: normalizada.estado }
            : c
        )
      );
      avisar('info', `Estado de la categoría "${categoria.nombre}" actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}.`);
    } catch (error) {
      avisar('error', error.message || 'Error al cambiar el estado de la categoría.');
    } finally {
      setCambiandoEstadoId(null);
    }
  };

  // Eliminar con actualización directa de estado local (sin recargar toda la tabla)
  const eliminar = async () => {
    if (!selected || guardando) return;
    const idReal = String(selected.id_categoria || String(selected.id).replace('#', ''));
    setGuardando(true);
    try {
      await eliminarCategoriaApi(idReal);
      setCategorias((prev) => {
        const restantes = prev.filter(
          (c) => String(c.id_categoria ?? c.id).replace('#', '') !== idReal
        );
        return restantes;
      });
      setModal(null);
      setSelected(null);
      avisar('exito', 'Categoría eliminada correctamente.');
    } catch (error) {
      setModal(null);
      avisar('error', error.message || 'No se puede eliminar la categoría porque tiene productos asociados.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarBusqueda = (value) => {
    setBusqueda(value);
    setPagina(1);
  };

  const alternarFiltroEstado = (estadoNuevo) => {
    setFiltroEstado((prev) => (prev === estadoNuevo ? 'todos' : estadoNuevo));
    setPagina(1);
  };

  const columns = [
    {
      header: 'ID',
      className: 'ru-cat-col-id',
      render: (categoria) => <span className="ru-cat-code-pill">{categoria.id}</span>,
    },
    {
      header: 'Nombre',
      className: 'ru-cat-col-nombre',
      render: (categoria) => (
        <div className="categoria-name">
          <span className="folder-cell-icon">
            <Icons.Categoria width={16} height={16} />
          </span>
          <div className="ru-cat-name-wrap">
            <strong title={categoria.nombre}>{categoria.nombre}</strong>
            <span className="ru-cat-inline-id">{categoria.id}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Estado',
      className: 'ru-cat-col-estado',
      render: (categoria) => {
        const idFila = String(categoria.id_categoria || String(categoria.id).replace('#', ''));
        return (
          <button
            type="button"
            className="categoria-status-button"
            title="Cambiar estado"
            disabled={cambiandoEstadoId === idFila}
            onClick={() => cambiarEstadoDirecto(categoria)}
          >
            <EstadoBadge activo={categoria.estado} />
          </button>
        );
      },
    },
    {
      header: 'Acciones',
      className: 'ru-cat-col-acciones',
      render: (categoria) => (
        <div className="ru-actions">
          <button
            type="button"
            className="ru-icon-btn view"
            title="Ver detalle de categoría"
            onClick={() => abrirDetalle(categoria)}
          >
            <Icons.Eye width={15} height={15} />
          </button>
          <button
            type="button"
            className="ru-icon-btn edit"
            title="Editar categoría"
            onClick={() => abrirEditar(categoria)}
          >
            <Icons.Pencil width={15} height={15} />
          </button>
          <button
            type="button"
            className="ru-icon-btn delete"
            title="Eliminar categoría"
            onClick={() => abrirEliminar(categoria)}
          >
            <Icons.Trash width={15} height={15} />
          </button>
        </div>
      ),
    },
  ];

  const showingFrom = filtradas.length === 0 ? 0 : (paginaActual - 1) * pageSize + 1;
  const showingTo = Math.min(paginaActual * pageSize, filtradas.length);

  return (
    <div className="ru-root ru-categorias-root categorias-page">
      <div className="ru-categorias-page">
        {/* Alerta flotante estándar de Raíz Urbana */}
        {notificacion && (
          <AppAlert
            key={notificacion.id}
            type={notificacion.type}
            title={notificacion.title}
            message={notificacion.message}
            onClose={() => setNotificacion(null)}
          />
        )}

        {/* Encabezado editorial idéntico a Ventas */}
        <div className="ru-cat-header">
          <div className="ru-cat-header-info">
            <div className="ru-eyebrow">MÓDULO</div>
            <h1 className="ru-cat-title">Gestión de Categorías</h1>
            <p className="ru-cat-subtitle">Administra las categorías del catálogo de productos</p>
          </div>
        </div>

        {/* Tarjetas KPI compactas idénticas a Ventas (interactivas para filtrar) */}
        <div className="ru-kpis-container">
          <div
            className={`ru-kpi-card ru-cat-kpi-interactive ${filtroEstado === 'todos' ? 'is-active' : ''}`}
            onClick={() => alternarFiltroEstado('todos')}
            title="Ver todas las categorías"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') alternarFiltroEstado('todos'); }}
          >
            <div className="ru-kpi-icon-box">
              <Icons.Categoria width={18} height={18} />
            </div>
            <div className="ru-kpi-content">
              <span className="ru-kpi-title">Total categorías</span>
              <div className="ru-kpi-value-row">
                <span className="ru-kpi-number">{total}</span>
                <span className="ru-kpi-label">{filtroEstado === 'todos' ? 'mostrando todas' : 'filtrar todas'}</span>
              </div>
            </div>
          </div>

          <div
            className={`ru-kpi-card ru-cat-kpi-interactive ${filtroEstado === 'activos' ? 'is-active' : ''}`}
            onClick={() => alternarFiltroEstado('activos')}
            title="Filtrar categorías activas"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') alternarFiltroEstado('activos'); }}
          >
            <div className="ru-kpi-icon-box">
              <Icons.Check width={18} height={18} />
            </div>
            <div className="ru-kpi-content">
              <span className="ru-kpi-title">Activas</span>
              <div className="ru-kpi-value-row">
                <span className="ru-kpi-number">{activas}</span>
                <span className="ru-kpi-label">{filtroEstado === 'activos' ? 'filtro activo' : 'disponibles'}</span>
              </div>
            </div>
          </div>

          <div
            className={`ru-kpi-card ru-cat-kpi-interactive ${filtroEstado === 'inactivos' ? 'is-active' : ''}`}
            onClick={() => alternarFiltroEstado('inactivos')}
            title="Filtrar categorías inactivas"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') alternarFiltroEstado('inactivos'); }}
          >
            <div className="ru-kpi-icon-box">
              <Icons.Ban width={18} height={18} />
            </div>
            <div className="ru-kpi-content">
              <span className="ru-kpi-title">Inactivas</span>
              <div className="ru-kpi-value-row">
                <span className="ru-kpi-number">{inactivas}</span>
                <span className="ru-kpi-label">{filtroEstado === 'inactivos' ? 'filtro activo' : 'deshabilitadas'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra global de búsqueda + botón crear lado a lado (idéntica a Ventas) */}
        <FiltrarBuscarGlobal
          searchPlaceholder="Buscar por ID, nombre o estado..."
          searchValue={busqueda}
          onSearchChange={cambiarBusqueda}
          action={
            <button type="button" className="btn btn-primary" onClick={abrirRegistrar}>
              <Icons.Plus width={16} height={16} />
              <span>NUEVA CATEGORÍA</span>
            </button>
          }
        />

        {/* Tabla Adaptativa uniforme sin scroll (idéntica a Ventas) */}
        <div className="ru-cat-table-slot" ref={tableSlotRef}>
          <TableGlobal
            title="Listado de Categorías"
            totalCount={filtradas.length}
            pageInfoTop={`Página ${paginaActual} de ${totalPaginas}`}
            columns={columns}
            data={categoriasVisibles}
            paginationText={`Mostrando ${showingFrom}–${showingTo} de ${filtradas.length} registros`}
            currentPage={paginaActual}
            totalPages={totalPaginas}
            onPageChange={cambiarPagina}
          />
        </div>
      </div>

      {/* Modal Registrar */}
      {modal === 'registrar' && (
        <ModalShell className="categoria-register-modal">
          <div className="categoria-modal-header">
            <div>
              <span className="categoria-modal-eyebrow">NUEVO REGISTRO</span>
              <h2>Registrar Categoría</h2>
            </div>
            <button className="categoria-modal-close" type="button" disabled={guardando} onClick={() => setModal(null)}>
              <X size={20} />
            </button>
          </div>
          <div className="categoria-modal-content">
            <label>
              NOMBRE <span style={{ color: '#dc3545' }} aria-hidden="true">*</span>
            </label>
            <input
              autoFocus
              required
              value={formNombre}
              onChange={(e) => {
                setFormNombre(e.target.value);
                setNombreTocado(true);
                setErrorServidor('');
              }}
              placeholder="Ej: Ropa, Calzado..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') registrar();
              }}
              onBlur={() => setNombreTocado(true)}
              aria-invalid={nombreTocado && Boolean(errorNombre)}
              disabled={guardando}
            />
            {nombreTocado && errorNombre && (
              <small className="categoria-error-tiempo-real" role="alert">
                {errorNombre}
              </small>
            )}
            <label style={{ marginTop: '14px' }}>
              IMAGEN (OPCIONAL)
            </label>
            <input
              ref={archivoFotoRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={manejarSubidaFotoCategoria}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="categoria-secondary-button"
                disabled={guardando || subiendoFoto}
                onClick={() => archivoFotoRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ImagePlus size={15} />
                <span>{subiendoFoto ? 'Subiendo...' : formFoto ? 'Cambiar imagen' : 'Subir imagen'}</span>
              </button>
              {formFoto && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={formFoto}
                    alt="Vista previa categoría"
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <button
                    type="button"
                    className="categoria-secondary-button"
                    disabled={guardando || subiendoFoto}
                    onClick={() => setFormFoto('')}
                    aria-label="Quitar imagen"
                    style={{ padding: '6px 8px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            {errorServidor && (
              <small className="categoria-error-tiempo-real" role="alert">
                {errorServidor}
              </small>
            )}
          </div>
          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" type="button" disabled={guardando || subiendoFoto} onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button
              className="categoria-primary-modal-button"
              type="button"
              disabled={Boolean(errorNombre) || guardando || subiendoFoto}
              onClick={registrar}
            >
              {subiendoFoto ? 'Subiendo...' : guardando ? 'Registrando...' : 'Registrar categoría'}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Modal Detalle */}
      {modal === 'detalle' && selected && (
        <ModalShell className="categoria-detail-modal">
          <div className="categoria-modal-header">
            <div>
              <span className="categoria-modal-eyebrow">CONSULTA</span>
              <h2>Detalle Categoría</h2>
            </div>
            <button className="categoria-modal-close" type="button" onClick={() => setModal(null)}>
              <X size={20} />
            </button>
          </div>
          <div className="categoria-detail-fields">
            <div><span>ID</span><strong>{selected.id}</strong></div>
            <div><span>Nombre</span><strong>{selected.nombre}</strong></div>
            <div><span>Estado</span><EstadoBadge activo={selected.estado} /></div>
            {(selected.fotoCategoria || selected.foto_categoria) && (
              <div>
                <span>Imagen</span>
                <a
                  href={selected.fotoCategoria || selected.foto_categoria}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={selected.fotoCategoria || selected.foto_categoria}
                    alt={selected.nombre}
                    style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                  />
                </a>
              </div>
            )}
          </div>
          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" type="button" onClick={() => setModal(null)}>
              Cerrar
            </button>
          </div>
        </ModalShell>
      )}

      {/* Modal Editar */}
      {modal === 'editar' && selected && (
        <ModalShell className="categoria-edit-modal">
          <div className="categoria-modal-header">
            <div>
              <span className="categoria-modal-eyebrow">EDITAR</span>
              <h2>Modificar Categoría</h2>
            </div>
            <button className="categoria-modal-close" type="button" disabled={guardando || subiendoFoto} onClick={() => setModal(null)}>
              <X size={20} />
            </button>
          </div>
          <div className="categoria-modal-content">
            <label>
              NOMBRE <span style={{ color: '#dc3545' }} aria-hidden="true">*</span>
            </label>
            <input
              value={formNombre}
              onChange={(e) => {
                setFormNombre(e.target.value);
                setNombreTocado(true);
                setErrorServidor('');
              }}
              onBlur={() => setNombreTocado(true)}
              aria-invalid={nombreTocado && Boolean(errorNombre)}
              disabled={guardando}
            />
            {nombreTocado && errorNombre && (
              <small className="categoria-error-tiempo-real" role="alert">
                {errorNombre}
              </small>
            )}
            <label style={{ marginTop: '14px' }}>
              IMAGEN (OPCIONAL)
            </label>
            <input
              ref={archivoFotoRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={manejarSubidaFotoCategoria}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="categoria-secondary-button"
                disabled={guardando || subiendoFoto}
                onClick={() => archivoFotoRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ImagePlus size={15} />
                <span>{subiendoFoto ? 'Subiendo...' : formFoto ? 'Cambiar imagen' : 'Subir imagen'}</span>
              </button>
              {formFoto && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={formFoto}
                    alt="Vista previa categoría"
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <button
                    type="button"
                    className="categoria-secondary-button"
                    disabled={guardando || subiendoFoto}
                    onClick={() => setFormFoto('')}
                    aria-label="Quitar imagen"
                    style={{ padding: '6px 8px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            {errorServidor && (
              <small className="categoria-error-tiempo-real" role="alert">
                {errorServidor}
              </small>
            )}
          </div>
          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" type="button" disabled={guardando || subiendoFoto} onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button
              className="categoria-primary-modal-button"
              type="button"
              disabled={Boolean(errorNombre) || guardando || subiendoFoto}
              onClick={guardarCambios}
            >
              {subiendoFoto ? 'Subiendo...' : guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Modal Eliminar (sin cierre por clic fuera del cuadro de diálogo) */}
      {modal === 'eliminar' && selected && (
        <div className="ru-confirm-modal-overlay" role="dialog" aria-modal="true">
          <div className="ru-confirm-modal">
            <div className="ru-confirm-icon-box">
              <Trash2 size={24} />
            </div>

            <h2 className="ru-confirm-title">¿Eliminar Categoría?</h2>
            <p className="ru-confirm-message">
              {`¿Estás seguro de eliminar la categoría "${selected.nombre}"? Si tiene productos o dependencias asociadas en Supabase, la acción será rechazada para mantener la integridad del sistema.`}
            </p>

            <div className="ru-confirm-footer">
              <button
                type="button"
                className="btn btn-outline"
                disabled={guardando}
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-destructive"
                disabled={guardando}
                onClick={eliminar}
              >
                {guardando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
