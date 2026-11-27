import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBag,
  X,
  Check,
  Minus,
  Plus,
  Package,
  Gift,
  Truck,
  Heart,
} from 'lucide-react';
import { obtenerToken } from '../../usuarios/services/authService';
import {
  agregarItemCarrito,
  obtenerCatalogoPublico,
} from '../services/carritoService';
import { listarProductosApi } from '../../control-de-existencias/services/productoService';
import { listarProductoVariantesApi } from '../../control-de-existencias/services/productoVarianteService';
import './Catalogo.css';

const FILTROS_PUBLICO = ['Todos', 'Hombre', 'Mujer', 'Niño', 'Niña'];

const COLOR_PALETTE = {
  Negro: '#17181c',
  Blanco: '#f8f9fa',
  Rojo: '#d63939',
  Azul: '#1971c2',
  Verde: '#2f9e44',
  Gris: '#868e96',
  Beige: '#e3d5ca',
  Marrón: '#78350f',
  Café: '#78350f',
  Dorado: '#d4af37',
  Plateado: '#ced4da',
};

const extraerLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (!respuesta || typeof respuesta !== 'object') return [];
  const candidata = [
    respuesta.items,
    respuesta.productos,
    respuesta.variantes,
    respuesta.data,
    respuesta.resultados,
    respuesta.registros,
  ].find(Array.isArray);
  return candidata || [];
};

const normalizarFoto = (foto) => {
  if (typeof foto === 'string') return foto.trim();
  if (foto && typeof foto === 'object') {
    return String(
      foto.url ?? foto.url_foto ?? foto.foto ?? foto.ruta ?? foto.imagen ?? ''
    ).trim();
  }
  return '';
};

const normalizarPrecio = (valor) => {
  if (typeof valor === 'number') return Number.isFinite(valor) && valor > 0 ? valor : 0;
  if (typeof valor !== 'string') return 0;
  const limpio = valor.trim().replace(/[^\d.,-]/g, '');
  if (!limpio) return 0;
  const ultimoPunto = limpio.lastIndexOf('.');
  const ultimaComa = limpio.lastIndexOf(',');
  const separadorDecimal = Math.max(ultimoPunto, ultimaComa);
  const normalizado =
    separadorDecimal >= 0 && limpio.length - separadorDecimal - 1 <= 2
      ? limpio.slice(0, separadorDecimal).replace(/[.,]/g, '') + '.' + limpio.slice(separadorDecimal + 1)
      : limpio.replace(/[.,]/g, '');
  const numero = Number(normalizado);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
};

const formatoPrecio = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);

const normalizarPublico = (publico) => {
  const p = String(publico || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (p.includes('nina')) return 'Niña';
  if (p.includes('nino') || p.includes('infantil')) return 'Niño';
  if (p.includes('mujer') || p.includes('dama') || p.includes('femenin')) return 'Mujer';
  if (p.includes('hombre') || p.includes('caballero') || p.includes('masculin')) return 'Hombre';
  return 'Unisex';
};

const obtenerGrupoCategoria = (tipo) => {
  const t = String(tipo || '').toLowerCase();
  if (
    ['accesorio', 'manilla', 'pulsera', 'collar', 'cintur', 'gorra', 'sombrero', 'bufanda', 'bolso', 'cartera', 'reloj'].some((k) =>
      t.includes(k)
    )
  ) {
    return 'ACCESORIO';
  }
  return 'ROPA';
};

const IMAGENES_RESPALDO = {
  Hombre: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=85',
  Mujer: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=800&q=85',
  Niño: 'https://images.pexels.com/photos/15249960/pexels-photo-15249960.jpeg?auto=compress&cs=tinysrgb&w=800&q=85',
  Niña: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=85',
  Unisex: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=85',
};

const obtenerImagen = (prod) => {
  const galeria = [
    ...(Array.isArray(prod.fotos) ? prod.fotos : []),
    prod.foto,
    prod.imagen,
  ]
    .map(normalizarFoto)
    .filter((url) => /^(https?:\/\/|\/|data:image\/)/i.test(url));

  if (galeria.length > 0) return galeria[0];
  return IMAGENES_RESPALDO[prod.publicoNorm] || IMAGENES_RESPALDO.Unisex;
};

const Catalogo = () => {
  const navigate = useNavigate();

  const [productosBase, setProductosBase] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState('Todos');

  // Favoritos persistentes
  const [favoritos, setFavoritos] = useState(() => {
    try {
      const saved = localStorage.getItem('raiz_urbana_favoritos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorito = (id) => {
    setFavoritos((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('raiz_urbana_favoritos', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Modal de detalle de producto
  const [productoModal, setProductoModal] = useState(null);
  const [modalColor, setModalColor] = useState('');
  const [modalTalla, setModalTalla] = useState('');
  const [modalCantidad, setModalCantidad] = useState(1);
  const [agregadoOk, setAgregadoOk] = useState(false);

  // Notificación flotante
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let activo = true;

    const cargarProductosReales = async () => {
      const [resPublico, resProductos, resVariantes] = await Promise.allSettled([
        obtenerCatalogoPublico(),
        listarProductosApi(),
        listarProductoVariantesApi(),
      ]);

      const productosDesdePublico =
        resPublico.status === 'fulfilled' ? extraerLista(resPublico.value) : [];
      const productosDesdeApi =
        resProductos.status === 'fulfilled' ? extraerLista(resProductos.value) : [];
      const variantesDesdeApi =
        resVariantes.status === 'fulfilled' ? extraerLista(resVariantes.value) : [];

      const listaProductos =
        productosDesdeApi.length > 0 ? productosDesdeApi : productosDesdePublico;
      const listaVariantes = variantesDesdeApi;

      if (!activo) return;

      const mapeados = listaProductos
        .filter((p) => {
          const est = String(p.estado ?? 'Activo').toLowerCase().trim();
          return est === 'activo' || est === 'true' || est === '1';
        })
        .map((p) => {
          const nombreProdNorm = String(p.nombre || '').trim().toLocaleLowerCase('es');

          const varsEmbebidas = Array.isArray(p.variantes) ? p.variantes : [];
          const varsExternas = listaVariantes.filter((v) => {
            const coincideId =
              v.id_producto != null && String(v.id_producto) === String(p.id);
            const coincideIdCamel =
              v.idProducto != null && String(v.idProducto) === String(p.id);
            const coincideNombre =
              String(v.producto || '').trim().toLocaleLowerCase('es') === nombreProdNorm;
            return coincideId || coincideIdCamel || coincideNombre;
          });

          const todasVariantes =
            varsExternas.length > 0 ? varsExternas : varsEmbebidas;

          const variantesActivas = todasVariantes
            .filter((v) => {
              const est = String(v.estado ?? 'Activo').toLowerCase().trim();
              return est === 'activo' || est === 'true' || est === '1';
            })
            .map((v) => ({
              id: Number(v.id ?? v.id_producto_vari ?? v.idProductoVari ?? 0),
              color: v.color || 'Único',
              talla: v.talla || v.talle || 'Única',
              precio: normalizarPrecio(v.precio),
              stock: Number(v.stock ?? 0),
              foto: normalizarFoto(v.foto),
            }));

          const preciosValidos = variantesActivas
            .map((v) => v.precio)
            .filter((n) => n > 0);
          const precioMin =
            preciosValidos.length > 0
              ? Math.min(...preciosValidos)
              : normalizarPrecio(p.precio);

          const stockTotal = variantesActivas.reduce(
            (acc, v) => acc + Number(v.stock || 0),
            0
          );

          const publicoNorm = normalizarPublico(p.publico);
          const fotosLimpias = [
            ...(Array.isArray(p.fotos) ? p.fotos : []),
            p.foto,
          ]
            .map(normalizarFoto)
            .filter(Boolean);

          return {
            id: p.id,
            nombre: p.nombre,
            tipo: (p.tipo || 'Prenda').toUpperCase(),
            grupoCategoria: obtenerGrupoCategoria(p.tipo),
            publicoNorm,
            precio: precioMin,
            descripcion:
              p.descripcion ||
              'Pieza ligera de confección cuidada con acabados suaves para mayor comodidad.',
            fotos: fotosLimpias,
            foto: fotosLimpias[0] || '',
            variantes: variantesActivas,
            colores: [...new Set(variantesActivas.map((v) => v.color).filter(Boolean))],
            tallas: [...new Set(variantesActivas.map((v) => v.talla).filter(Boolean))],
            stockTotal,
          };
        });

      setProductosBase(mapeados);
      setCargando(false);
    };

    cargarProductosReales().catch((err) => {
      console.error('Error cargando productos de Supabase:', err);
      if (activo) {
        setProductosBase([]);
        setCargando(false);
      }
    });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Cerrar modal con Escape y bloquear scroll de fondo
  useEffect(() => {
    if (!productoModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setProductoModal(null);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [productoModal]);

  const productosFiltrados = useMemo(() => {
    if (filtroActivo === 'Todos') return productosBase;
    return productosBase.filter(
      (p) => p.publicoNorm === filtroActivo || p.publicoNorm === 'Unisex'
    );
  }, [productosBase, filtroActivo]);

  const resolverVariante = (producto, color, talla) => {
    const vars = producto?.variantes || [];
    if (!vars.length) return null;
    return (
      vars.find((v) => v.color === color && v.talla === talla) ||
      vars.find((v) => v.color === color && v.stock > 0) ||
      vars.find((v) => v.color === color) ||
      vars.find((v) => v.stock > 0) ||
      vars[0]
    );
  };

  const abrirDetalle = (producto) => {
    setProductoModal(producto);
    const vari = resolverVariante(producto, producto.colores?.[0], producto.tallas?.[0]);
    setModalColor(vari?.color || producto.colores?.[0] || 'Único');
    setModalTalla(vari?.talla || producto.tallas?.[0] || 'Única');
    setModalCantidad(1);
    setAgregadoOk(false);
  };

  const varianteModal = useMemo(() => {
    if (!productoModal) return null;
    return resolverVariante(productoModal, modalColor, modalTalla);
  }, [productoModal, modalColor, modalTalla]);

  const handleAgregarCarrito = async () => {
    if (!productoModal) return;

    const idVariante = varianteModal?.id || Number(productoModal.id);
    const stockDisponible = varianteModal ? varianteModal.stock : 99;
    const precioUnitario = varianteModal?.precio ?? productoModal.precio;
    const colorSel = varianteModal?.color || modalColor || 'Único';
    const tallaSel = varianteModal?.talla || modalTalla || 'Única';

    if (varianteModal && varianteModal.stock <= 0) return;

    if (obtenerToken() && varianteModal?.id) {
      try {
        await agregarItemCarrito({
          idProductoVari: varianteModal.id,
          cantidad: modalCantidad,
        });
        setAgregadoOk(true);
        setToast({
          titulo: '¡Añadido al carrito!',
          detalle: `${productoModal.nombre} · Talla ${tallaSel} (x${modalCantidad})`,
        });
        setTimeout(() => setAgregadoOk(false), 2000);
      } catch (err) {
        setToast({
          error: true,
          titulo: 'No se pudo agregar',
          detalle: err.message || 'Verifica el inventario disponible.',
        });
      }
      return;
    }

    try {
      const saved = localStorage.getItem('raiz_urbana_carrito');
      const cart = saved ? JSON.parse(saved) : [];
      const idx = cart.findIndex((i) => Number(i.idProductoVari) === Number(idVariante));

      if (idx >= 0) {
        cart[idx].qty = Math.min(stockDisponible, cart[idx].qty + modalCantidad);
      } else {
        cart.push({
          idProductoVari: idVariante,
          productId: String(productoModal.id),
          name: productoModal.nombre,
          color: colorSel,
          talla: tallaSel,
          price: Number(precioUnitario) || 0,
          qty: modalCantidad,
          stock: stockDisponible,
        });
      }

      localStorage.setItem('raiz_urbana_carrito', JSON.stringify(cart));
      window.dispatchEvent(new Event('storage'));
      setAgregadoOk(true);
      setToast({
        titulo: '¡Añadido al carrito!',
        detalle: `${productoModal.nombre} · Talla ${tallaSel} (x${modalCantidad})`,
      });
      setTimeout(() => setAgregadoOk(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const esFavoritoModal = productoModal ? favoritos.includes(productoModal.id) : false;
  const sinStockModal = Boolean(varianteModal && varianteModal.stock <= 0);
  const imagenPrincipalModal = productoModal ? obtenerImagen(productoModal) : '';

  return (
    <main className="catalogo-page">
      {/* HERO EDITORIAL */}
      <section className="catalogo-hero">
        <div className="catalogo-container catalogo-hero-grid">
          <div>
            <div className="catalogo-eyebrow">
              <span />
              PARA TODOS · TODOS LOS DÍAS
            </div>
            <h1>
              Vestir en familia,
              <br />
              con identidad.
            </h1>
          </div>

          <p className="catalogo-hero-desc">
            Ropa y accesorios de espíritu urbano para grandes y pequeños,
            elegidos para combinar, durar y acompañar.
          </p>
        </div>
      </section>

      {/* BARRA DE FILTROS */}
      <div className="catalogo-filter-bar">
        <div className="catalogo-container catalogo-filter-inner">
          <div className="catalogo-pills" role="tablist" aria-label="Filtrar por público">
            {FILTROS_PUBLICO.map((filtro) => (
              <button
                key={filtro}
                type="button"
                role="tab"
                aria-selected={filtroActivo === filtro}
                className={`catalogo-pill ${filtroActivo === filtro ? 'active' : ''}`}
                onClick={() => setFiltroActivo(filtro)}
              >
                {filtro}
              </button>
            ))}
          </div>

          <span className="catalogo-count">
            {productosFiltrados.length}{' '}
            {productosFiltrados.length === 1 ? 'PIEZA' : 'PIEZAS'}
          </span>
        </div>
      </div>

      {/* LISTADO DE PRODUCTOS */}
      <section className="catalogo-section">
        <div className="catalogo-container">
          <div className="catalogo-section-header">
            <span className="catalogo-selection-label">
              SELECCIÓN / {filtroActivo.toUpperCase()}
            </span>
            <h2>Ropa y accesorios</h2>
          </div>

          {cargando ? (
            <div className="catalogo-empty">
              <Package size={36} />
              <p>Cargando piezas de la colección...</p>
            </div>
          ) : productosFiltrados.length > 0 ? (
            <div className="catalogo-grid">
              {productosFiltrados.map((prod) => (
                <article
                  key={prod.id}
                  className="catalogo-card"
                  onClick={() => abrirDetalle(prod)}
                >
                  <div className="catalogo-card-media">
                    <img
                      src={obtenerImagen(prod)}
                      alt={prod.nombre}
                      loading="lazy"
                      onError={(e) => {
                        const respaldo =
                          IMAGENES_RESPALDO[prod.publicoNorm] || IMAGENES_RESPALDO.Unisex;
                        if (e.currentTarget.src !== respaldo) {
                          e.currentTarget.src = respaldo;
                        }
                      }}
                    />
                    <span className="catalogo-card-badge">
                      {prod.publicoNorm.toUpperCase()} · {prod.grupoCategoria}
                    </span>
                  </div>

                  <div className="catalogo-card-meta">
                    <span className="catalogo-card-type">{prod.tipo}</span>
                    <h3>{prod.nombre}</h3>
                    <p className="catalogo-card-price">
                      {prod.precio > 0 ? formatoPrecio(prod.precio) : 'Consultar precio'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="catalogo-empty">
              <Package size={36} />
              <h3>Sin piezas disponibles en esta categoría</h3>
              <p>Aún no hay productos activos registrados para {filtroActivo}.</p>
              <button
                type="button"
                className="catalogo-btn-primary"
                onClick={() => setFiltroActivo('Todos')}
              >
                Ver todas las piezas
              </button>
            </div>
          )}
        </div>
      </section>

      {/* NOTA ARTESANAL INFERIOR */}
      <footer className="catalogo-artisan-note">
        <div className="catalogo-container catalogo-artisan-inner">
          <div className="catalogo-artisan-left">
            <div className="catalogo-artisan-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h3>Cada pieza es ligeramente distinta.</h3>
              <p>Esa es la belleza de lo hecho a mano.</p>
            </div>
          </div>

          <span className="catalogo-artisan-tag">
            RAÍZ URBANA · EDICIÓN 2026
          </span>
        </div>
      </footer>

      {/* MODAL DETALLE DE PRODUCTO */}
      {productoModal && (
        <div
          className="catalogo-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProductoModal(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={productoModal.nombre}
        >
          <div className="catalogo-modal">
            <button
              type="button"
              className="catalogo-modal-close"
              onClick={() => setProductoModal(null)}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="catalogo-modal-media">
              <img
                key={`${productoModal.id}-${varianteModal?.id || 'base'}`}
                src={imagenPrincipalModal}
                alt={productoModal.nombre}
                onError={(e) => {
                  const respaldo =
                    IMAGENES_RESPALDO[productoModal.publicoNorm] || IMAGENES_RESPALDO.Unisex;
                  if (e.currentTarget.src !== respaldo) {
                    e.currentTarget.src = respaldo;
                  }
                }}
              />
            </div>

            <div className="catalogo-modal-body">
              <div className="catalogo-modal-top">
                <div className="catalogo-modal-tags">
                  <span className="catalogo-modal-pill">
                    {productoModal.publicoNorm.toUpperCase()} · {productoModal.grupoCategoria}
                  </span>
                  <span className="catalogo-modal-subtag">{productoModal.tipo}</span>
                </div>

                <h2>{productoModal.nombre}</h2>
                <p className="catalogo-modal-price">
                  {formatoPrecio(varianteModal?.precio ?? productoModal.precio)}
                </p>
                <p className="catalogo-modal-desc">{productoModal.descripcion}</p>
              </div>

              {/* 3 TARJETAS DE BENEFICIOS */}
              <div className="catalogo-modal-perks">
                <div className="catalogo-perk-card">
                  <Package size={16} />
                  <span>Diseño local en pequeñas series</span>
                </div>
                <div className="catalogo-perk-card">
                  <Gift size={16} />
                  <span>Empaque de regalo incluido</span>
                </div>
                <div className="catalogo-perk-card">
                  <Truck size={16} />
                  <span>Envíos a toda Colombia</span>
                </div>
              </div>

              {/* COLORES (SI TIENE MÁS DE UNO) */}
              {productoModal.colores.length > 1 && (
                <div className="catalogo-modal-group">
                  <span className="catalogo-field-label">COLOR</span>
                  <div className="catalogo-modal-options">
                    {productoModal.colores.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`catalogo-chip ${modalColor === color ? 'selected' : ''}`}
                        onClick={() => setModalColor(color)}
                      >
                        <span
                          className="catalogo-dot"
                          style={{ backgroundColor: COLOR_PALETTE[color] || '#495057' }}
                        />
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FILA TALLA (IZQUIERDA) + CANTIDAD (DERECHA) */}
              <div className="catalogo-modal-selectors">
                <div className="catalogo-modal-group">
                  <span className="catalogo-field-label">TALLA</span>
                  <div className="catalogo-modal-options">
                    {(productoModal.tallas.length > 0 ? productoModal.tallas : ['Única']).map((talla) => (
                      <button
                        key={talla}
                        type="button"
                        className={`catalogo-size ${modalTalla === talla ? 'selected' : ''}`}
                        onClick={() => setModalTalla(talla)}
                      >
                        {talla}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="catalogo-modal-group catalogo-qty-group">
                  <span className="catalogo-field-label">CANTIDAD</span>
                  <div className="catalogo-qty">
                    <button
                      type="button"
                      onClick={() => setModalCantidad((q) => Math.max(1, q - 1))}
                      disabled={modalCantidad <= 1}
                      aria-label="Restar cantidad"
                    >
                      <Minus size={14} />
                    </button>
                    <span>{modalCantidad}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setModalCantidad((q) =>
                          Math.min(varianteModal?.stock || 99, q + 1)
                        )
                      }
                      disabled={sinStockModal || (varianteModal && modalCantidad >= varianteModal.stock)}
                      aria-label="Sumar cantidad"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* BARRA INFERIOR: BOTÓN AGREGAR + CORAZÓN */}
              <div className="catalogo-modal-actions">
                <button
                  type="button"
                  className="catalogo-btn-primary catalogo-btn-add"
                  onClick={handleAgregarCarrito}
                  disabled={sinStockModal}
                >
                  {agregadoOk ? (
                    <>
                      <Check size={16} /> Añadido · {modalCantidad}
                    </>
                  ) : sinStockModal ? (
                    'Agotado'
                  ) : (
                    <>
                      <ShoppingBag size={16} /> Agregar · {modalCantidad}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={`catalogo-btn-fav ${esFavoritoModal ? 'active' : ''}`}
                  onClick={() => toggleFavorito(productoModal.id)}
                  aria-label={esFavoritoModal ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                >
                  <Heart
                    size={18}
                    fill={esFavoritoModal ? 'currentColor' : 'none'}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <aside className="catalogo-toast" role="status">
          <div>
            <strong>{toast.titulo}</strong>
            <p>{toast.detalle}</p>
          </div>
          <button type="button" onClick={() => navigate('/carrito')}>
            Ver carrito
          </button>
        </aside>
      )}
    </main>
  );
};

export default Catalogo;