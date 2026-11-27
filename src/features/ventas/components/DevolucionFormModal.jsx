import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Icons } from '../../../components/ui/Icons';
import ConfirmCancelModal from '../../../components/ui/ConfirmCancelModal';
import AppAlert from '../../../components/ui/AppAlert';
import { formatoMoneda } from '../../../data/dataVentas';
import { getFechaLocalHoy } from '../../../utils/dateUtils';
import {
  listarMotivos,
  crearMotivo,
  eliminarMotivo,
  listarDetallesDisponibles,
  crearDevolucion,
  editarDevolucion,
  obtenerDevolucionPorId,
} from '../../../services/devolucionesService';
import '../styles/devoluciones/DevolucionFormModal.css';

const normalizar = (txt) =>
  String(txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export default function DevolucionFormModal({
  isOpen,
  mode = 'registrar', // 'registrar' | 'editar'
  venta = null,
  selectedDevolucion = null,
  onClose,
  onSuccess,
}) {
  const isEditar = mode === 'editar';

  // Datos maestros
  const [detalles, setDetalles] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Valores del formulario
  const [idDetVenta, setIdDetVenta] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [fechaDevolucion, setFechaDevolucion] = useState(getFechaLocalHoy());
  const [idMotivo, setIdMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [reintegraStock, setReintegraStock] = useState(true);

  // Estado de valores iniciales cargados para detectar cambios ("sucio")
  const [initialValues, setInitialValues] = useState(null);

  // Estados de interacción y validación en tiempo real
  const [touched, setTouched] = useState({
    id_det_venta: false,
    cantidad: false,
    fecha_devolucion: false,
    id_motivo: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Dropdown states para Producto
  const [isProdOpen, setIsProdOpen] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [prodHighlight, setProdHighlight] = useState(-1);
  const prodContainerRef = useRef(null);
  const prodInputRef = useRef(null);

  // Dropdown states para Motivo
  const [isMotivoOpen, setIsMotivoOpen] = useState(false);
  const [motivoSearch, setMotivoSearch] = useState('');
  const [motivoHighlight, setMotivoHighlight] = useState(-1);
  const [creandoMotivo, setCreandoMotivo] = useState(false);
  const [motivoFieldError, setMotivoFieldError] = useState('');
  const motivoContainerRef = useRef(null);
  const motivoInputRef = useRef(null);

  // Alerta flotante toast (AppAlert)
  const [alertToast, setAlertToast] = useState(null);

  // Modal para confirmar cancelar si el form tiene cambios sin guardar
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showConfirmResetResolucion, setShowConfirmResetResolucion] = useState(false);

  // Referencias a inputs para foco en el primer error
  const cantidadInputRef = useRef(null);
  const fechaInputRef = useRef(null);

  // Fecha de la venta de referencia
  const fechaVenta = useMemo(() => {
    if (isEditar) {
      return selectedDevolucion?.fecha_venta
        ? String(selectedDevolucion.fecha_venta).slice(0, 10)
        : '';
    }
    return venta?.fecha ? String(venta.fecha).slice(0, 10) : '';
  }, [isEditar, selectedDevolucion, venta]);

  // Cliente de referencia
  const cliente = useMemo(() => {
    if (isEditar) {
      return {
        nombre: selectedDevolucion?.cliente || 'Cliente',
        email: selectedDevolucion?.cliente_email || 'cliente@empresa.com',
        rol: selectedDevolucion?.cliente_rol || 'Cliente',
        documento: selectedDevolucion?.cliente_documento || '',
      };
    }
    return venta?.cliente || { nombre: 'Cliente', email: 'cliente@empresa.com', rol: 'Cliente' };
  }, [isEditar, selectedDevolucion, venta]);

  // Código de venta
  const codigoVenta = useMemo(() => {
    if (isEditar) {
      const vid = selectedDevolucion?.id_venta;
      return vid ? String(vid).padStart(3, '0') : '00X';
    }
    return venta?.codigo || (venta?.id ? String(venta.id).padStart(3, '0') : '00X');
  }, [isEditar, selectedDevolucion, venta]);

  // Carga inicial de datos al abrir
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const cargar = async () => {
      setLoadingData(true);
      setApiError('');
      try {
        // 1. Cargar catálogo de motivos
        const motData = await listarMotivos().catch(() => []);
        if (isMounted) {
          setMotivos(Array.isArray(motData) ? motData : []);
        }

        // 2. Cargar detalles de venta o detalle de devolución
        if (isEditar && selectedDevolucion) {
          const devId = selectedDevolucion.id || selectedDevolucion.id_devoluciones;
          const freshDev = await obtenerDevolucionPorId(devId).catch(() => null);
          const devActual = freshDev || selectedDevolucion;

          if (isMounted) {
            setIdDetVenta(String(devActual.id_det_venta || ''));
            setCantidad(String(devActual.cantidad_devuelta || devActual.cantidad || '1'));
            setFechaDevolucion(
              devActual.fecha_devolucion
                ? String(devActual.fecha_devolucion).slice(0, 10)
                : getFechaLocalHoy()
            );
            setIdMotivo(String(devActual.id_motivo || ''));
            setObservaciones(
              String(devActual.observaciones || '').replace(/^\[ANULADA\]\s*/i, '').slice(0, 255)
            );
            setReintegraStock(
              devActual.reintegra_stock !== undefined
                ? Boolean(devActual.reintegra_stock)
                : true
            );

            // Detalle único para edición
            const maxDisp =
              devActual.cantidad_maxima !== undefined
                ? Number(devActual.cantidad_maxima)
                : Number(devActual.cantidad_devuelta || devActual.cantidad || 1);

            setDetalles([
              {
                id_det_venta: devActual.id_det_venta,
                producto: devActual.producto || 'Producto',
                talla: devActual.talla || 'Única',
                color: devActual.color || 'Único',
                cantidad_comprada: Number(devActual.cantidad_vendida || devActual.cantidad || 1),
                cantidad_disponible: maxDisp,
                precio_unitario: Number(devActual.precio_unitario || 0),
                subtotal: Number(devActual.subtotal || 0),
              },
            ]);
            const initVal = {
              idDetVenta: String(devActual.id_det_venta || ''),
              cantidad: String(devActual.cantidad_devuelta || devActual.cantidad || '1'),
              fechaDevolucion: devActual.fecha_devolucion
                ? String(devActual.fecha_devolucion).slice(0, 10)
                : getFechaLocalHoy(),
              idMotivo: String(devActual.id_motivo || ''),
              observaciones: String(devActual.observaciones || '').replace(/^\[ANULADA\]\s*/i, '').slice(0, 255),
              reintegraStock: devActual.reintegra_stock !== undefined
                ? Boolean(devActual.reintegra_stock)
                : true,
            };
            setInitialValues(initVal);
          }
        } else if (venta) {
          // Modo registrar: cargar detalles de ESA venta desde backend
          const detallesApi = await listarDetallesDisponibles(venta.id).catch(() => []);
          if (isMounted) {
            let lista = [];
            if (Array.isArray(detallesApi) && detallesApi.length > 0) {
              lista = detallesApi;
            } else if (Array.isArray(venta.items)) {
              lista = venta.items.map((it) => ({
                id_det_venta: it.id_det_venta || it.producto?.id || 1,
                producto: it.producto?.nombre || it.producto || 'Producto',
                talla: it.talla || 'Única',
                color: it.color || 'Único',
                cantidad_comprada: Number(it.cantidad || 1),
                cantidad_disponible: Number(it.cantidad || 1),
                precio_unitario: Number(it.producto?.precio || 0),
                subtotal: Number(it.subtotal || 0),
              }));
            }
            setDetalles(lista);

            // Seleccionar primer detalle con disponibilidad
            const primerDisponible = lista.find((d) => Number(d.cantidad_disponible) > 0);
            const initDet = primerDisponible
              ? String(primerDisponible.id_det_venta)
              : lista.length > 0
              ? String(lista[0].id_det_venta)
              : '';
            setIdDetVenta(initDet);
            setCantidad('1');
            setFechaDevolucion(getFechaLocalHoy());
            setIdMotivo('');
            setObservaciones('');
            setReintegraStock(true);

            setInitialValues({
              idDetVenta: initDet,
              cantidad: '1',
              fechaDevolucion: getFechaLocalHoy(),
              idMotivo: '',
              observaciones: '',
              reintegraStock: true,
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setApiError(err.message || 'Error al cargar auxiliares.');
        }
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    cargar();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isEditar, selectedDevolucion, venta]);

  // Detalle actualmente seleccionado
  const selectedDetail = useMemo(() => {
    return detalles.find((d) => String(d.id_det_venta) === String(idDetVenta)) || null;
  }, [detalles, idDetVenta]);

  // Máximo permitido para devolver
  const maxCantidad = useMemo(() => {
    if (!selectedDetail) return 1;
    return Math.max(0, Number(selectedDetail.cantidad_disponible || 0));
  }, [selectedDetail]);

  // Validaciones en tiempo real
  const errors = useMemo(() => {
    const errs = {};

    // 1. Producto
    if (!idDetVenta) {
      errs.id_det_venta = 'Seleccione un producto';
    } else if (maxCantidad <= 0 && !isEditar) {
      errs.id_det_venta = 'Este producto no tiene unidades disponibles para devolver';
    }

    // 2. Cantidad
    const cantNum = Number(cantidad);
    if (!cantidad || String(cantidad).trim() === '') {
      errs.cantidad = 'La cantidad es obligatoria';
    } else if (isNaN(cantNum) || !Number.isInteger(cantNum) || cantNum <= 0) {
      errs.cantidad = 'La cantidad debe ser un entero mayor que 0';
    } else if (cantNum > maxCantidad) {
      errs.cantidad = `No puede superar la cantidad disponible (${maxCantidad})`;
    }

    // 3. Fecha
    const hoy = getFechaLocalHoy();
    if (!fechaDevolucion || String(fechaDevolucion).trim() === '') {
      errs.fecha_devolucion = 'Seleccione la fecha de devolución';
    } else if (fechaDevolucion > hoy) {
      errs.fecha_devolucion = 'La fecha no puede ser futura';
    } else if (fechaVenta && fechaDevolucion < fechaVenta) {
      errs.fecha_devolucion = 'La fecha no puede ser anterior a la venta';
    }

    // 4. Motivo
    if (!idMotivo) {
      errs.id_motivo = 'Seleccione un motivo';
    }

    return errs;
  }, [idDetVenta, maxCantidad, isEditar, cantidad, fechaDevolucion, fechaVenta, idMotivo]);

  // Limpiar y resetear el formulario local al cerrar
  const resetLocalForm = useCallback(() => {
    setIdDetVenta('');
    setCantidad('1');
    setFechaDevolucion(getFechaLocalHoy());
    setIdMotivo('');
    setObservaciones('');
    setReintegraStock(true);
    setTouched({
      id_det_venta: false,
      cantidad: false,
      fecha_devolucion: false,
      id_motivo: false,
    });
    setApiError('');
    setMotivoFieldError('');
    setAlertToast(null);
    setIsProdOpen(false);
    setIsMotivoOpen(false);
    setProdSearch('');
    setMotivoSearch('');
    setProdHighlight(-1);
    setMotivoHighlight(-1);
    setShowConfirmCancel(false);
    setInitialValues(null);
  }, []);

  const cerrarYLimpiar = useCallback(() => {
    resetLocalForm();
    onClose();
  }, [resetLocalForm, onClose]);

  // Comprobar si el formulario tiene cambios sin guardar ("sucio")
  // En Registrar: cualquier dato modificado/ingresado
  // En Editar: diferencias respecto a lo precargado
  const isDirty = useMemo(() => {
    const init = initialValues;
    if (!init) {
      if (!isEditar) {
        return Boolean(
          idMotivo ||
          observaciones.trim() ||
          (cantidad && cantidad !== '1') ||
          (fechaDevolucion && fechaDevolucion !== getFechaLocalHoy()) ||
          !reintegraStock
        );
      }
      return false;
    }

    return (
      String(idDetVenta || '') !== String(init.idDetVenta || '') ||
      String(cantidad || '') !== String(init.cantidad || '') ||
      String(fechaDevolucion || '') !== String(init.fechaDevolucion || '') ||
      String(idMotivo || '') !== String(init.idMotivo || '') ||
      String(observaciones || '').trim() !== String(init.observaciones || '').trim() ||
      Boolean(reintegraStock) !== Boolean(init.reintegraStock)
    );
  }, [initialValues, idDetVenta, cantidad, fechaDevolucion, idMotivo, observaciones, reintegraStock, isEditar]);

  // Cierre controlado: si está sucio muestra confirmación; si no, cierra directo
  const intentarCerrar = useCallback(() => {
    if (isDirty && !submitting) {
      setShowConfirmCancel(true);
    } else {
      cerrarYLimpiar();
    }
  }, [isDirty, submitting, cerrarYLimpiar]);

  // Escape listener (idéntico a Producción y Roles)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showConfirmCancel) {
          setShowConfirmCancel(false);
        } else if (isProdOpen) {
          setIsProdOpen(false);
        } else if (isMotivoOpen) {
          setIsMotivoOpen(false);
        } else {
          intentarCerrar();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, showConfirmCancel, isProdOpen, isMotivoOpen, intentarCerrar]);

  // Click outside para dropdowns de producto y motivo
  useEffect(() => {
    const handleClick = (e) => {
      if (prodContainerRef.current && !prodContainerRef.current.contains(e.target)) {
        if (isProdOpen) {
          setIsProdOpen(false);
          setTouched((prev) => ({ ...prev, id_det_venta: true }));
        }
      }
      if (motivoContainerRef.current && !motivoContainerRef.current.contains(e.target)) {
        if (isMotivoOpen) {
          setIsMotivoOpen(false);
          setTouched((prev) => ({ ...prev, id_motivo: true }));
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isProdOpen, isMotivoOpen]);

  // Filtrado de productos para el select
  const filteredDetalles = useMemo(() => {
    const q = normalizar(prodSearch);
    if (!q) return detalles;
    return detalles.filter((d) => {
      const matchProd = normalizar(d.producto).includes(q);
      const matchTalla = normalizar(d.talla).includes(q);
      const matchColor = normalizar(d.color).includes(q);
      return matchProd || matchTalla || matchColor;
    });
  }, [detalles, prodSearch]);

  // Filtrado de motivos para el select
  const filteredMotivos = useMemo(() => {
    const q = normalizar(motivoSearch);
    if (!q) return motivos;
    return motivos.filter((m) => normalizar(m.nombre).includes(q));
  }, [motivos, motivoSearch]);

  // Comprobar si el texto escrito coincide exactamente con algún motivo existente (ignorando mayúsculas y tildes)
  const existeCoincidenciaExacta = useMemo(() => {
    const trimmed = motivoSearch.trim();
    if (!trimmed) return false;
    const q = normalizar(trimmed);
    return motivos.some((m) => normalizar(m.nombre) === q);
  }, [motivos, motivoSearch]);

  // Opción dinámica de agregar motivo: aparece cuando hay texto y no coincide exactamente con ninguna opción
  const puedeAgregarMotivo = useMemo(() => {
    const trimmed = motivoSearch.trim();
    if (!trimmed) return false;
    return !existeCoincidenciaExacta;
  }, [motivoSearch, existeCoincidenciaExacta]);

  // Manejo de teclado en select de Producto
  const handleProdKeyDown = (e) => {
    if (isEditar) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isProdOpen) {
        setIsProdOpen(true);
        setProdHighlight(0);
      } else {
        setProdHighlight((prev) => (prev + 1 >= filteredDetalles.length ? 0 : prev + 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isProdOpen) {
        setIsProdOpen(true);
        setProdHighlight(filteredDetalles.length - 1);
      } else {
        setProdHighlight((prev) => (prev - 1 < 0 ? filteredDetalles.length - 1 : prev - 1));
      }
    } else if (e.key === 'Enter') {
      if (isProdOpen && prodHighlight >= 0 && prodHighlight < filteredDetalles.length) {
        e.preventDefault();
        const item = filteredDetalles[prodHighlight];
        if (Number(item.cantidad_disponible) > 0) {
          setIdDetVenta(String(item.id_det_venta));
          setIsProdOpen(false);
          setProdSearch('');
          setTouched((prev) => ({ ...prev, id_det_venta: true }));
        }
      }
    } else if (e.key === 'Tab') {
      if (isProdOpen) {
        setIsProdOpen(false);
        setTouched((prev) => ({ ...prev, id_det_venta: true }));
      }
    }
  };

  // Acción: Crear nuevo motivo en BD con sp_registraroactualizarmotivo
  const handleCrearNuevoMotivo = async (nombreNuevo) => {
    const trimmed = String(nombreNuevo || motivoSearch || '').trim();

    // 1. Validar nombre no vacío
    if (!trimmed) {
      setMotivoFieldError('El nombre del motivo no puede estar vacío.');
      return;
    }

    // 2. Validar máx 100 caracteres
    if (trimmed.length > 100) {
      setMotivoFieldError('El nombre del motivo no puede superar los 100 caracteres.');
      return;
    }

    // 3. Validar duplicados (ignorando mayúsculas y tildes)
    const yaExiste = motivos.find(
      (m) => normalizar(m.nombre) === normalizar(trimmed)
    );
    if (yaExiste) {
      setMotivoFieldError(`Ya existe un motivo con ese nombre («${yaExiste.nombre}»).`);
      return;
    }

    setCreandoMotivo(true);
    setMotivoFieldError('');

    try {
      const nuevo = await crearMotivo(trimmed);
      if (nuevo) {
        setMotivos((prev) => [...prev, nuevo]);
        setIdMotivo(String(nuevo.id_motivo));
        setIsMotivoOpen(false);
        setMotivoSearch('');
        setMotivoHighlight(-1);
        setTouched((prev) => ({ ...prev, id_motivo: true }));
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error al crear el motivo.';
      setMotivoFieldError(msg);
      setAlertToast({
        type: 'error',
        title: 'Error al registrar motivo',
        message: msg,
      });
    } finally {
      setCreandoMotivo(false);
    }
  };

  // Manejo de teclado en select de Motivo
  const handleMotivoKeyDown = (e) => {
    if (creandoMotivo) {
      e.preventDefault();
      return;
    }

    const totalItems = filteredMotivos.length + (puedeAgregarMotivo ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isMotivoOpen) {
        setIsMotivoOpen(true);
        setMotivoHighlight(0);
      } else {
        setMotivoHighlight((prev) => (prev + 1 >= totalItems ? 0 : prev + 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isMotivoOpen) {
        setIsMotivoOpen(true);
        setMotivoHighlight(totalItems - 1);
      } else {
        setMotivoHighlight((prev) => (prev - 1 < 0 ? totalItems - 1 : prev - 1));
      }
    } else if (e.key === 'Enter') {
      if (isMotivoOpen) {
        e.preventDefault();
        if (motivoHighlight >= 0 && motivoHighlight < filteredMotivos.length) {
          const item = filteredMotivos[motivoHighlight];
          setIdMotivo(String(item.id_motivo));
          setIsMotivoOpen(false);
          setMotivoSearch('');
          setMotivoFieldError('');
          setTouched((prev) => ({ ...prev, id_motivo: true }));
        } else if (
          (motivoHighlight === filteredMotivos.length && puedeAgregarMotivo) ||
          (motivoHighlight < 0 && puedeAgregarMotivo)
        ) {
          handleCrearNuevoMotivo(motivoSearch.trim());
        }
      }
    } else if (e.key === 'Tab') {
      if (isMotivoOpen) {
        setIsMotivoOpen(false);
        setTouched((prev) => ({ ...prev, id_motivo: true }));
      }
    }
  };

  // Acción: Eliminar motivo directamente (sin confirmación, optimista)
  const handleEliminarMotivoDirecto = async (motivo) => {
    if (!motivo || !motivo.id_motivo) return;

    const prevMotivos = [...motivos];
    const prevIdMotivo = idMotivo;

    // Eliminación optimista de la lista
    setMotivos((prev) => prev.filter((m) => m.id_motivo !== motivo.id_motivo));
    if (String(idMotivo) === String(motivo.id_motivo)) {
      setIdMotivo('');
      setTouched((prev) => ({ ...prev, id_motivo: true }));
    }
    setMotivoFieldError('');

    try {
      await eliminarMotivo(motivo.id_motivo);
    } catch (err) {
      // Si la BD rechaza (por ejemplo, motivo en uso), restaurar lista y selección
      setMotivos(prevMotivos);
      if (String(prevIdMotivo) === String(motivo.id_motivo)) {
        setIdMotivo(prevIdMotivo);
      }

      const mensaje =
        err.response?.data?.detail ||
        err.message ||
        `No se puede eliminar el motivo «${motivo.nombre}» porque está siendo usado por devoluciones registradas.`;

      // Alerta flotante evidente sobre el modal (mínimo 6 segundos)
      setAlertToast({
        type: 'error',
        title: 'No se puede eliminar',
        message: mensaje,
      });

      // Refuerzo visible dentro del propio campo de motivo
      setMotivoFieldError(mensaje);
    }
  };

  // Bloquear caracteres no numéricos en cantidad
  const handleCantidadKeyDown = (e) => {
    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Enviar formulario con validación completa y foco en el primer error
  const handleSubmit = async (e, skipResetCheck = false) => {
    if (e && e.preventDefault) e.preventDefault();

    // Marcar todos como tocados
    setTouched({
      id_det_venta: true,
      cantidad: true,
      fecha_devolucion: true,
      id_motivo: true,
    });

    if (Object.keys(errors).length > 0) {
      // Enfocar el primer campo inválido
      if (errors.id_det_venta && prodInputRef.current) {
        prodInputRef.current.focus();
      } else if (errors.cantidad && cantidadInputRef.current) {
        cantidadInputRef.current.focus();
      } else if (errors.fecha_devolucion && fechaInputRef.current) {
        fechaInputRef.current.focus();
      } else if (errors.id_motivo && motivoInputRef.current) {
        motivoInputRef.current.focus();
      }
      return;
    }

    if (
      !skipResetCheck &&
      isEditar &&
      selectedDevolucion?.estado === 'En gestión' &&
      Number(cantidad) !== Number(initialValues?.cantidad)
    ) {
      setShowConfirmResetResolucion(true);
      return;
    }

    setSubmitting(true);
    setApiError('');

    try {
      const payload = {
        cantidad: Number(cantidad),
        fecha_devolucion: fechaDevolucion,
        id_motivo: Number(idMotivo),
        observaciones: observaciones?.trim() || null,
        reintegra_stock: Boolean(reintegraStock),
      };

      if (isEditar) {
        const devId = selectedDevolucion.id || selectedDevolucion.id_devoluciones;
        await editarDevolucion(devId, payload);
        if (onSuccess) {
          onSuccess(devId, payload);
        }
      } else {
        payload.id_det_venta = Number(idDetVenta);
        const res = await crearDevolucion(payload);
        if (onSuccess) {
          onSuccess({
            venta,
            item: selectedDetail,
            cantidad: Number(cantidad),
            devolucion: res,
          });
        }
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error al procesar la devolución.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Textos para los selects
  const selectedProdText = selectedDetail
    ? `${selectedDetail.producto} · Talla ${selectedDetail.talla || 'Única'} · ${
        selectedDetail.color || 'Único'
      } (Comprados: ${selectedDetail.cantidad_comprada} unid. - ${formatoMoneda(
        selectedDetail.subtotal || selectedDetail.precio_unitario * selectedDetail.cantidad_comprada
      )})`
    : '';

  const selectedMotivoObj = motivos.find((m) => String(m.id_motivo) === String(idMotivo));
  const selectedMotivoText = selectedMotivoObj ? selectedMotivoObj.nombre : '';

  return (
    <>
      <div className="ru-modal-overlay" onClick={intentarCerrar}>
        <div
          className="ru-modal ru-dev-modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="ru-modal-header">
            <div className="ru-modal-eyebrow">DEVOLUCIÓN · {codigoVenta}</div>
            <h2 className="ru-modal-title">
              {isEditar ? 'Editar Devolución' : 'Registrar Devolución'}
            </h2>
            <button
              type="button"
              className="ru-modal-close"
              onClick={intentarCerrar}
              aria-label="Cerrar modal"
            >
              <Icons.Close width={18} height={18} />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="ru-modal-body ru-dev-modal-body">
              {/* Resumen Cliente */}
              <div>
                <p className="ru-v-hint">
                  {isEditar
                    ? 'Edita los datos de la devolución registrada. El ajuste de existencias se recalculará según la cantidad y el estado de reintegro.'
                    : 'Registra la devolución de uno de los productos de esta orden de venta. El stock podrá reintegrarse automáticamente al inventario.'}
                </p>

                <div className="ru-v-summary-box">
                  <div className="ru-v-avatar">
                    <Icons.User width={16} height={16} />
                  </div>
                  <div>
                    <span className="ru-v-client-name">
                      {cliente.nombre} {cliente.rol ? `(${cliente.rol})` : '(Cliente)'}
                    </span>
                    <span className="ru-v-client-email">
                      {cliente.email || 'cliente@empresa.com'}{' '}
                      {cliente.documento ? `· CC: ${cliente.documento}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mensaje de error de la API si ocurre */}
              {apiError && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(209, 73, 91, 0.12)',
                    border: '1px solid var(--negative, #ef4444)',
                    borderRadius: '8px',
                    color: 'var(--negative, #ef4444)',
                    fontSize: '13px',
                  }}
                  role="alert"
                >
                  {apiError}
                </div>
              )}

              {/* Grid de Campos */}
              <div className="ru-dev-form-grid">
                {/* 1. PRODUCTO A DEVOLVER (Ancho completo) */}
                <div className="ru-form-field ru-dev-col-full">
                  <label className="ru-form-label" htmlFor="ru-dev-prod-input">
                    PRODUCTO A DEVOLVER <span className="req">*</span>
                  </label>

                  <div className="ru-dev-select-container" ref={prodContainerRef}>
                    <div className="ru-dev-select-input-wrap">
                      <input
                        ref={prodInputRef}
                        id="ru-dev-prod-input"
                        type="text"
                        disabled={isEditar || loadingData}
                        placeholder={
                          isEditar
                            ? selectedProdText
                            : loadingData
                            ? 'Cargando productos...'
                            : 'Buscar producto de la venta...'
                        }
                        value={isProdOpen ? prodSearch : selectedProdText}
                        onChange={(e) => {
                          setProdSearch(e.target.value);
                          if (!isProdOpen) setIsProdOpen(true);
                        }}
                        onFocus={() => {
                          if (!isEditar) {
                            setIsProdOpen(true);
                            setProdSearch('');
                          }
                        }}
                        onKeyDown={handleProdKeyDown}
                        onBlur={() => {
                          // Se valida al cerrar en clickOutside
                        }}
                        className={`ru-dev-select-input ${
                          touched.id_det_venta && errors.id_det_venta ? 'is-invalid' : ''
                        }`}
                        aria-invalid={Boolean(touched.id_det_venta && errors.id_det_venta)}
                        aria-describedby={
                          touched.id_det_venta && errors.id_det_venta ? 'prod-error-msg' : undefined
                        }
                      />
                      <span className="ru-dev-select-arrow">
                        <Icons.ChevronDown width={14} height={14} />
                      </span>
                    </div>

                    {/* Desplegable de productos */}
                    {isProdOpen && !isEditar && (
                      <ul className="ru-dev-dropdown-menu" role="listbox">
                        {filteredDetalles.length === 0 ? (
                          <li
                            style={{
                              padding: '10px 14px',
                              fontSize: '13px',
                              color: 'var(--muted-text)',
                              fontStyle: 'italic',
                              textAlign: 'center',
                            }}
                          >
                            Sin resultados
                          </li>
                        ) : (
                          filteredDetalles.map((det, idx) => {
                            const isSelected = String(det.id_det_venta) === String(idDetVenta);
                            const isDisab = Number(det.cantidad_disponible) <= 0;
                            const isHighlight = idx === prodHighlight;

                            const label = `${det.producto} · Talla ${det.talla || 'Única'} · ${
                              det.color || 'Único'
                            } (Comprados: ${det.cantidad_comprada} unid. - ${formatoMoneda(
                              det.subtotal || det.precio_unitario * det.cantidad_comprada
                            )})`;

                            return (
                              <li
                                key={det.id_det_venta}
                                role="option"
                                aria-selected={isSelected}
                                aria-disabled={isDisab}
                                className={`ru-dev-dropdown-item ${
                                  isSelected ? 'is-selected' : ''
                                } ${isDisab ? 'is-disabled' : ''} ${
                                  isHighlight ? 'is-highlighted' : ''
                                }`}
                                onMouseEnter={() => setProdHighlight(idx)}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  if (isDisab) return;
                                  setIdDetVenta(String(det.id_det_venta));
                                  setIsProdOpen(false);
                                  setProdSearch('');
                                  setTouched((prev) => ({ ...prev, id_det_venta: true }));
                                }}
                              >
                                <span>
                                  {label}
                                  {isDisab && ' — Sin unidades disponibles'}
                                </span>
                                {isSelected && <span style={{ color: '#2563eb' }}>✓</span>}
                              </li>
                            );
                          })
                        )}
                      </ul>
                    )}
                  </div>

                  {touched.id_det_venta && errors.id_det_venta && (
                    <span id="prod-error-msg" className="ru-dev-field-error" role="alert">
                      {errors.id_det_venta}
                    </span>
                  )}
                  {isEditar && (
                    <span className="ru-dev-field-hint">
                      El producto vendido no puede modificarse en la edición.
                    </span>
                  )}
                </div>

                {/* 2. CANTIDAD A DEVOLVER */}
                <div className="ru-form-field">
                  <label className="ru-form-label" htmlFor="ru-dev-cantidad-input">
                    CANTIDAD A DEVOLVER <span className="req">*</span>
                  </label>
                  <div className="ru-form-input-wrap">
                    <input
                      ref={cantidadInputRef}
                      id="ru-dev-cantidad-input"
                      type="number"
                      min="1"
                      max={maxCantidad || 1}
                      value={cantidad}
                      onKeyDown={handleCantidadKeyDown}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCantidad(val);
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, cantidad: true }))}
                      className={`ru-form-input ${
                        touched.cantidad && errors.cantidad ? 'is-invalid' : ''
                      }`}
                      aria-invalid={Boolean(touched.cantidad && errors.cantidad)}
                      aria-describedby={
                        touched.cantidad && errors.cantidad ? 'cant-error-msg' : undefined
                      }
                      placeholder="1"
                    />
                  </div>
                  <span className="ru-dev-field-hint">
                    Máximo a devolver: {maxCantidad} unid.
                  </span>
                  {touched.cantidad && errors.cantidad && (
                    <span id="cant-error-msg" className="ru-dev-field-error" role="alert">
                      {errors.cantidad}
                    </span>
                  )}
                </div>

                {/* 3. FECHA DE DEVOLUCIÓN */}
                <div className="ru-form-field">
                  <label className="ru-form-label" htmlFor="ru-dev-fecha-input">
                    FECHA DE DEVOLUCIÓN <span className="req">*</span>
                  </label>
                  <div className="ru-form-input-wrap">
                    <input
                      ref={fechaInputRef}
                      id="ru-dev-fecha-input"
                      type="date"
                      max={getFechaLocalHoy()}
                      min={fechaVenta || undefined}
                      value={fechaDevolucion}
                      onChange={(e) => setFechaDevolucion(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, fecha_devolucion: true }))}
                      className={`ru-form-input ${
                        touched.fecha_devolucion && errors.fecha_devolucion ? 'is-invalid' : ''
                      }`}
                      aria-invalid={Boolean(
                        touched.fecha_devolucion && errors.fecha_devolucion
                      )}
                      aria-describedby={
                        touched.fecha_devolucion && errors.fecha_devolucion
                          ? 'fecha-error-msg'
                          : undefined
                      }
                    />
                  </div>
                  {touched.fecha_devolucion && errors.fecha_devolucion && (
                    <span id="fecha-error-msg" className="ru-dev-field-error" role="alert">
                      {errors.fecha_devolucion}
                    </span>
                  )}
                </div>

                {/* 4. MOTIVO DE DEVOLUCIÓN (Ancho completo) */}
                <div className="ru-form-field ru-dev-col-full">
                  <label className="ru-form-label" htmlFor="ru-dev-motivo-input">
                    MOTIVO DE DEVOLUCIÓN <span className="req">*</span>
                  </label>

                  <div className="ru-dev-select-container" ref={motivoContainerRef}>
                    <div
                      className="ru-dev-select-input-wrap"
                      onClick={() => {
                        if (!creandoMotivo) {
                          setIsMotivoOpen(true);
                        }
                      }}
                    >
                      <input
                        ref={motivoInputRef}
                        id="ru-dev-motivo-input"
                        type="text"
                        placeholder={
                          creandoMotivo
                            ? 'Registrando motivo...'
                            : 'Buscar o escribir un nuevo motivo...'
                        }
                        value={isMotivoOpen ? motivoSearch : selectedMotivoText}
                        disabled={creandoMotivo}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMotivoSearch(val);
                          setMotivoFieldError('');
                          if (val.trim().length > 100) {
                            setMotivoFieldError('El nombre del motivo no puede superar los 100 caracteres.');
                          }
                          if (!isMotivoOpen) setIsMotivoOpen(true);
                        }}
                        onFocus={() => {
                          if (!creandoMotivo) {
                            setIsMotivoOpen(true);
                            setMotivoSearch('');
                          }
                        }}
                        onKeyDown={handleMotivoKeyDown}
                        className={`ru-dev-select-input ${
                          (touched.id_motivo && errors.id_motivo) || motivoFieldError
                            ? 'is-invalid'
                            : ''
                        }`}
                        aria-invalid={Boolean((touched.id_motivo && errors.id_motivo) || motivoFieldError)}
                        aria-describedby={
                          motivoFieldError
                            ? 'motivo-field-error-msg'
                            : touched.id_motivo && errors.id_motivo
                            ? 'motivo-error-msg'
                            : undefined
                        }
                      />
                      <span
                        className="ru-dev-select-arrow"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!creandoMotivo) {
                            setIsMotivoOpen((prev) => !prev);
                          }
                        }}
                      >
                        <Icons.ChevronDown width={14} height={14} />
                      </span>
                    </div>

                    {/* Desplegable de motivos */}
                    {isMotivoOpen && !creandoMotivo && (
                      <ul className="ru-dev-dropdown-menu" role="listbox">
                        {filteredMotivos.length === 0 && !puedeAgregarMotivo ? (
                          <li
                            style={{
                              padding: '10px 14px',
                              fontSize: '13px',
                              color: 'var(--muted-text)',
                              fontStyle: 'italic',
                              textAlign: 'center',
                            }}
                          >
                            Sin resultados
                          </li>
                        ) : (
                          filteredMotivos.map((m, idx) => {
                            const isSelected = String(m.id_motivo) === String(idMotivo);
                            const isHighlight = idx === motivoHighlight;

                            return (
                              <li
                                key={m.id_motivo}
                                role="option"
                                aria-selected={isSelected}
                                className={`ru-dev-dropdown-item ${
                                  isSelected ? 'is-selected' : ''
                                } ${isHighlight ? 'is-highlighted' : ''}`}
                                onMouseEnter={() => setMotivoHighlight(idx)}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setIdMotivo(String(m.id_motivo));
                                  setIsMotivoOpen(false);
                                  setMotivoSearch('');
                                  setMotivoFieldError('');
                                  setTouched((prev) => ({ ...prev, id_motivo: true }));
                                }}
                              >
                                <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                                  {m.nombre}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {isSelected && (
                                    <span style={{ color: '#2563eb', fontWeight: 700 }}>✓</span>
                                  )}
                                  <button
                                    type="button"
                                    className="ru-btn-delete-motivo"
                                    title={`Eliminar motivo «${m.nombre}»`}
                                    aria-label={`Eliminar motivo ${m.nombre}`}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleEliminarMotivoDirecto(m);
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              </li>
                            );
                          })
                        )}

                        {/* Opción de Agregar nuevo motivo */}
                        {puedeAgregarMotivo && (
                          <li
                            role="option"
                            className={`ru-dev-dropdown-item ru-dev-dropdown-item-add ${
                              motivoHighlight === filteredMotivos.length ? 'is-highlighted' : ''
                            }`}
                            onMouseEnter={() => setMotivoHighlight(filteredMotivos.length)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleCrearNuevoMotivo(motivoSearch.trim());
                            }}
                          >
                            <span>Agregar «{motivoSearch.trim()}»</span>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {motivoFieldError ? (
                    <span id="motivo-field-error-msg" className="ru-dev-field-error" role="alert">
                      {motivoFieldError}
                    </span>
                  ) : touched.id_motivo && errors.id_motivo ? (
                    <span id="motivo-error-msg" className="ru-dev-field-error" role="alert">
                      {errors.id_motivo}
                    </span>
                  ) : null}
                </div>

                {/* 5. OBSERVACIONES (Ancho completo, sin validación en tiempo real) */}
                <div className="ru-form-field ru-dev-col-full">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <label className="ru-form-label" htmlFor="ru-dev-obs-input" style={{ margin: 0 }}>
                      OBSERVACIONES / JUSTIFICACIÓN
                    </label>
                    <span style={{ fontSize: '11.5px', color: 'var(--muted-text, #64748b)' }}>
                      {observaciones.length}/255
                    </span>
                  </div>
                  <div className="ru-form-input-wrap">
                    <textarea
                      id="ru-dev-obs-input"
                      rows={4}
                      maxLength={255}
                      className="ru-dev-textarea"
                      placeholder="Describe el motivo detallado de la devolución o condición del producto..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value.slice(0, 255))}
                    />
                  </div>
                </div>

                {/* 6. CHECKBOX REINTEGRAR STOCK */}
                <div className="ru-dev-col-full ru-dev-checkbox-row">
                  <input
                    type="checkbox"
                    id="ru-dev-reintegra-chk"
                    checked={reintegraStock}
                    onChange={(e) => setReintegraStock(e.target.checked)}
                  />
                  <label htmlFor="ru-dev-reintegra-chk">
                    Reintegrar unidades devueltas automáticamente al inventario
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="ru-modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={intentarCerrar}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || (maxCantidad <= 0 && !isEditar)}
              >
                {submitting
                  ? 'Procesando...'
                  : isEditar
                  ? 'Guardar cambios'
                  : 'Confirmar devolución'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de confirmación al cerrar con cambios sin guardar (idéntico a Producción y Roles) */}
      {showConfirmCancel && (
        <ConfirmCancelModal
          title={isEditar ? '¿Cancelar edición?' : '¿Cancelar registro?'}
          message={
            isEditar
              ? '¿Estás seguro de que quieres cancelar la edición de la devolución? Los cambios no guardados se perderán.'
              : '¿Estás seguro de que quieres cancelar el registro de la devolución? Los cambios no guardados se perderán.'
          }
          cancelText="Seguir editando"
          confirmText="Sí, cancelar"
          onClose={() => setShowConfirmCancel(false)}
          onConfirm={cerrarYLimpiar}
        />
      )}

      {/* Modal de confirmación al modificar cantidad en una devolución En Gestión */}
      {showConfirmResetResolucion && (
        <ConfirmCancelModal
          title="¿Modificar cantidad y reiniciar resolución?"
          message="Modificar la cantidad en una devolución 'En gestión' anulará la resolución previamente definida y devolverá la devolución al estado 'Registrada'. ¿Deseas continuar?"
          cancelText="No, mantener"
          confirmText="Sí, continuar"
          onClose={() => setShowConfirmResetResolucion(false)}
          onConfirm={() => {
            setShowConfirmResetResolucion(false);
            handleSubmit(null, true);
          }}
        />
      )}

      {/* Alerta flotante para avisos de sistema / errores de motivo en uso (mínimo 6 segundos) */}
      {alertToast && (
        <AppAlert
          type={alertToast.type || 'error'}
          title={alertToast.title}
          message={alertToast.message}
          duration={6500}
          onClose={() => setAlertToast(null)}
        />
      )}
    </>
  );
}
