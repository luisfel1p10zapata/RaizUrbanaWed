import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Inicio.css';
import {
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  ShoppingBag,
  Sparkles,
  Search,
  X,
  Eye,
  Heart,
  Star,
  Minus,
  Plus,
  Check,
  Package,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import useTheme from '../../../components/hooks/useTheme';

const categories = [
  {
    title: 'Ropa',
    image: '/images/ropa.jpg',
  },
  {
    title: 'Tenis',
    image: '/images/tenis.jpg',
  },
  {
    title: 'Bolsos',
    image: '/images/bolsos.jpg',
  },
  {
    title: 'Accesorios',
    image: '/images/accesorios.jpg',
  },
];

const features = [
  {
    title: 'DISEÑOS ÚNICOS',
    description: 'Piezas exclusivas que no encontrarás en otro lado',
    icon: '◇',
  },
  {
    title: 'ESTILOS VARIADOS',
    description: 'Para cada personalidad y cada ocasión',
    icon: '✦',
  },
  {
    title: 'MODA URBANA',
    description: 'Colecciones inspiradas en el street style global',
    icon: '⬡',
  },
  {
    title: 'PARA TODOS',
    description: 'Hombre, mujer y accesorios en un solo lugar',
    icon: '○',
  },
];

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    nombre: 'Chaqueta Premium Cuero',
    tipo: 'Ropa',
    publico: 'Hombre',
    precio: 185000,
    precioOriginal: 220000,
    descripcion: 'Chaqueta urbana confeccionada en cuero sintético de alta resistencia con forro térmico y acabados metálicos.',
    imagen: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    colores: ['Negro', 'Marrón'],
    tallas: ['S', 'M', 'L', 'XL'],
    badge: 'DESTACADO',
    rating: 4.9,
    reviews: 34,
  },
  {
    id: 2,
    nombre: 'Zapatos Casual Urbanos',
    tipo: 'Tenis',
    publico: 'Hombre',
    precio: 145000,
    precioOriginal: 175000,
    descripcion: 'Tenis urbanos de suela vulcanizada con amortiguación premium, diseñados para el asfalto y el uso diario.',
    imagen: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
    colores: ['Blanco', 'Negro', 'Gris'],
    tallas: ['38', '39', '40', '41', '42'],
    badge: 'NUEVO',
    rating: 4.8,
    reviews: 42,
  },
  {
    id: 3,
    nombre: 'Bolso Urbano Minimalista',
    tipo: 'Bolsos',
    publico: 'Mujer',
    precio: 95000,
    precioOriginal: 115000,
    descripcion: 'Bolso cruzado resistente al agua con compartimento para tablet, textura mate y correa ergonómica.',
    imagen: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    colores: ['Negro', 'Beige', 'Verde'],
    tallas: ['Única'],
    badge: 'TENDENCIA',
    rating: 5.0,
    reviews: 29,
  },
  {
    id: 4,
    nombre: 'Manilla Tejida Negra',
    tipo: 'Accesorios',
    publico: 'Mujer',
    precio: 8500,
    precioOriginal: 12000,
    descripcion: 'Manilla artesanal en hilo encerado de alta durabilidad con herrajes plateados y cierre ajustable.',
    imagen: 'https://images.unsplash.com/photo-1611591475179-62cd34eb0e52?auto=format&fit=crop&w=800&q=80',
    colores: ['Negro', 'Rojo', 'Azul'],
    tallas: ['Ajustable'],
    badge: 'POPULAR',
    rating: 4.7,
    reviews: 64,
  },
  {
    id: 5,
    nombre: 'Camiseta Básica Algodón',
    tipo: 'Ropa',
    publico: 'Hombre',
    precio: 55000,
    precioOriginal: 65000,
    descripcion: 'Camiseta 100% algodón peinado de 220g, silueta relajada y cuello rib reforzado anti-deformación.',
    imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop',
    colores: ['Negro', 'Blanco', 'Gris', 'Azul'],
    tallas: ['S', 'M', 'L', 'XL'],
    badge: 'BÁSICO',
    rating: 4.8,
    reviews: 58,
  },
  {
    id: 6,
    nombre: 'Collar Artesanal Azul',
    tipo: 'Accesorios',
    publico: 'Mujer',
    precio: 12000,
    precioOriginal: 16000,
    descripcion: 'Collar artesanal con dije náutico en acero pulido y cadena encerada ajustable.',
    imagen: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    colores: ['Azul', 'Dorado', 'Plateado'],
    tallas: ['Única'],
    badge: 'EXCLUSIVO',
    rating: 4.9,
    reviews: 31,
  },
  {
    id: 7,
    nombre: 'Tenis Street Classic',
    tipo: 'Tenis',
    publico: 'Unisex',
    precio: 160000,
    precioOriginal: 195000,
    descripcion: 'Edición especial streetwear con plantilla acolchada memory foam y detalles reflectivos.',
    imagen: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    colores: ['Blanco', 'Negro'],
    tallas: ['37', '38', '39', '40', '41', '42'],
    badge: 'NUEVO',
    rating: 4.9,
    reviews: 18,
  },
  {
    id: 8,
    nombre: 'Bolso Bandolera Compacto',
    tipo: 'Bolsos',
    publico: 'Mujer',
    precio: 85000,
    precioOriginal: 99000,
    descripcion: 'Bandolera compacta con textura suave, cierre magnético y bolsillo interno con cremallera.',
    imagen: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
    colores: ['Marrón', 'Negro', 'Beige'],
    tallas: ['Única'],
    badge: 'OFERTA',
    rating: 4.6,
    reviews: 14,
  },
  {
    id: 9,
    nombre: 'Pantalón Recto Clásico',
    tipo: 'Ropa',
    publico: 'Mujer',
    precio: 110000,
    precioOriginal: 130000,
    descripcion: 'Pantalón en drill suave de corte recto y tiro alto, ideal para un look casual estructurado.',
    imagen: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    colores: ['Negro', 'Beige', 'Gris'],
    tallas: ['S', 'M', 'L'],
    badge: 'CLÁSICO',
    rating: 4.7,
    reviews: 22,
  },
  {
    id: 10,
    nombre: 'Cinturón Hebilla Metálica',
    tipo: 'Accesorios',
    publico: 'Hombre',
    precio: 45000,
    precioOriginal: 55000,
    descripcion: 'Cinturón táctico en reata resistente con hebilla metálica de aleación zinc de apertura rápida.',
    imagen: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80',
    colores: ['Negro', 'Verde', 'Marrón'],
    tallas: ['Ajustable'],
    badge: 'RESISTENTE',
    rating: 4.8,
    reviews: 37,
  },
  {
    id: 11,
    nombre: 'Chaqueta Denim Moderna',
    tipo: 'Ropa',
    publico: 'Mujer',
    precio: 135000,
    precioOriginal: 160000,
    descripcion: 'Chaqueta en denim 100% algodón con desgastes sutiles y botones grabados metálicos.',
    imagen: 'https://images.pexels.com/photos/19129082/pexels-photo-19129082.jpeg?auto=compress&cs=tinysrgb&w=800',
    colores: ['Azul', 'Negro'],
    tallas: ['S', 'M', 'L'],
    badge: 'TENDENCIA',
    rating: 4.9,
    reviews: 41,
  },
  {
    id: 12,
    nombre: 'Tenis Retro High',
    tipo: 'Tenis',
    publico: 'Hombre',
    precio: 175000,
    precioOriginal: 210000,
    descripcion: 'Silueta botín de caña media con protección de tobillo y cuero sintético de alto desgaste.',
    imagen: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=800&q=80',
    colores: ['Negro', 'Blanco', 'Rojo'],
    tallas: ['39', '40', '41', '42', '43'],
    badge: 'LIMITADO',
    rating: 5.0,
    reviews: 15,
  },
];

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

const normalizarPrecio = (valor) => {
  if (typeof valor === 'number') return Number.isFinite(valor) && valor > 0 ? valor : 0;
  if (typeof valor !== 'string') return 0;
  const limpio = valor.trim().replace(/[^\d.,-]/g, '');
  if (!limpio) return 0;
  const ultimoPunto = limpio.lastIndexOf('.');
  const ultimaComa = limpio.lastIndexOf(',');
  const separadorDecimal = Math.max(ultimoPunto, ultimaComa);
  let normalizado;
  if (separadorDecimal >= 0 && limpio.length - separadorDecimal - 1 <= 2) {
    normalizado = limpio.slice(0, separadorDecimal).replace(/[.,]/g, '') + '.' + limpio.slice(separadorDecimal + 1);
  } else {
    normalizado = limpio.replace(/[.,]/g, '');
  }
  const numero = Number(normalizado);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
};

const formatoPrecio = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);

const normalizarTipo = (tipo) => {
  if (!tipo) return 'Ropa';
  const t = tipo.toLowerCase().trim();
  if (['ropa', 'camiseta', 'chaqueta', 'pantalón', 'pantalon', 'vestido', 'conjunto', 'abrigo'].some((k) => t.includes(k))) {
    return 'Ropa';
  }
  if (['tenis', 'zapato', 'calzado', 'bota', 'sneaker'].some((k) => t.includes(k))) {
    return 'Tenis';
  }
  if (['bolso', 'bolsos', 'mochila', 'morral', 'cartera', 'bandolera'].some((k) => t.includes(k))) {
    return 'Bolsos';
  }
  if (['accesorio', 'accesorios', 'manilla', 'pulsera', 'collar', 'cinturón', 'cinturon', 'bufanda', 'aretes'].some((k) => t.includes(k))) {
    return 'Accesorios';
  }
  return 'Ropa';
};

// Fotografías diferenciadas por tipo de artículo. Se usan como respaldo
// cuando el producto no tiene una fotografía propia registrada.
const IMAGENES_POR_ARTICULO = {
  chaquetaCuero: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85',
  chaquetaDenim: 'https://images.pexels.com/photos/19129082/pexels-photo-19129082.jpeg?auto=compress&cs=tinysrgb&w=900',
  camiseta: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=85',
  pantalon: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85',
  tenisCasual: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=85',
  tenisStreet: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=85',
  tenisRetro: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=900&q=85',
  bolsoUrbano: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85',
  bandolera: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85',
  manilla: 'https://images.unsplash.com/photo-1611591475179-62cd34eb0e52?auto=format&fit=crop&w=900&q=85',
  collar: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85',
  cinturon: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=900&q=85',
};

const obtenerImagenProducto = (prod) => {
  const nombre = String(prod.nombre || '').toLowerCase();
  if (nombre.includes('manilla tejida negra')) {
    return 'https://images.unsplash.com/photo-1724509549263-e10987e6918b?auto=format&fit=crop&w=800&h=1000&q=85';
  }
  if (nombre.includes('bufanda elegante unicolor')) {
    return 'https://images.unsplash.com/photo-1737046299342-69676b7695e6?auto=format&fit=crop&w=800&h=1000&q=85';
  }
  if (nombre.includes('bufanda tejida suave')) {
    return 'https://images.unsplash.com/photo-1609803384370-0e73ef8d424f?auto=format&fit=crop&w=800&h=1000&q=85';
  }
  if (nombre.includes('bolso de mano elegante')) {
    return 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&h=1000&q=85';
  }
  if (nombre.includes('zapatos deportivos infantiles') || nombre.includes('zapatillas deportivas infantiles')) {
    return 'https://images.pexels.com/photos/15249960/pexels-photo-15249960.jpeg?auto=compress&cs=tinysrgb&w=800&h=1000&fit=crop';
  }
  if (nombre.trim() === 'chaqueta') {
    return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&h=1000&q=85';
  }
  if (nombre.includes('conjunto') && (nombre.includes('urbano') || nombre.includes('deportivo'))) {
    return 'https://images.unsplash.com/photo-1762575910569-46971cd69df3?auto=format&fit=crop&w=800&h=1000&q=85';
  }
  if (nombre.includes('abrigo') && nombre.includes('invierno')) {
    return 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&h=1000&q=85';
  }
  if (nombre.includes('vestido')) {
    return 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&h=1000&fit=crop';
  }
  const fotoPropia = [prod.foto, prod.imagen].find(
    (url) => typeof url === 'string' && /^(https?:\/\/|\/|data:image\/)/i.test(url.trim())
  );
  if (fotoPropia) return fotoPropia.trim();

  const tipo = normalizarTipo(prod.tipo);
  if (nombre.includes('denim') || nombre.includes('jean')) return IMAGENES_POR_ARTICULO.chaquetaDenim;
  if (nombre.includes('chaqueta') || nombre.includes('cuero')) return IMAGENES_POR_ARTICULO.chaquetaCuero;
  if (nombre.includes('camiseta')) return IMAGENES_POR_ARTICULO.camiseta;
  if (nombre.includes('pantal')) return IMAGENES_POR_ARTICULO.pantalon;
  if (nombre.includes('retro') || nombre.includes('high')) return IMAGENES_POR_ARTICULO.tenisRetro;
  if (nombre.includes('street')) return IMAGENES_POR_ARTICULO.tenisStreet;
  if (nombre.includes('tenis') || nombre.includes('zapato')) return IMAGENES_POR_ARTICULO.tenisCasual;
  if (nombre.includes('bandolera')) return IMAGENES_POR_ARTICULO.bandolera;
  if (nombre.includes('bolso')) return IMAGENES_POR_ARTICULO.bolsoUrbano;
  if (nombre.includes('manilla') || nombre.includes('pulsera')) return IMAGENES_POR_ARTICULO.manilla;
  if (nombre.includes('collar')) return IMAGENES_POR_ARTICULO.collar;
  if (nombre.includes('cintur')) return IMAGENES_POR_ARTICULO.cinturon;

  // Para nuevos productos sin foto, evita repetir una misma imagen de categoría.
  // Se recomienda guardar una foto real desde el módulo de Productos.
  const respaldos = tipo === 'Tenis'
    ? [IMAGENES_POR_ARTICULO.tenisCasual, IMAGENES_POR_ARTICULO.tenisStreet, IMAGENES_POR_ARTICULO.tenisRetro]
    : tipo === 'Bolsos'
      ? [IMAGENES_POR_ARTICULO.bolsoUrbano, IMAGENES_POR_ARTICULO.bandolera]
      : tipo === 'Accesorios'
        ? [IMAGENES_POR_ARTICULO.manilla, IMAGENES_POR_ARTICULO.collar, IMAGENES_POR_ARTICULO.cinturon]
        : [IMAGENES_POR_ARTICULO.camiseta, IMAGENES_POR_ARTICULO.chaquetaCuero, IMAGENES_POR_ARTICULO.pantalon, IMAGENES_POR_ARTICULO.chaquetaDenim];
  const indice = [...String(prod.id ?? prod.nombre ?? '')].reduce((n, c) => n + c.charCodeAt(0), 0);
  return respaldos[indice % respaldos.length];
};

const Inicio = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Estados interactivos del catálogo
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [filtroPublico, setFiltroPublico] = useState('Todos');
  const [orden, setOrden] = useState('destacados');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 8;

  // Selección de color por tarjeta { [id]: color }
  const [coloresSeleccionados, setColoresSeleccionados] = useState({});

  // Favoritos (Wishlist)
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
      const next = prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id];
      try {
        localStorage.setItem('raiz_urbana_favoritos', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Modal Vista Rápida
  const [productoModal, setProductoModal] = useState(null);
  const [modalColor, setModalColor] = useState('');
  const [modalTalla, setModalTalla] = useState('');
  const [modalCantidad, setModalCantidad] = useState(1);
  const [modalAgregado, setModalAgregado] = useState(false);

  // Toast flotante
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3800);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Cierre de modal con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && productoModal) {
        setProductoModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productoModal]);

  // Bloquear scroll al abrir modal
  useEffect(() => {
    if (productoModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [productoModal]);

  // Cargar productos base integrando posibles registros locales del admin
  const productosBase = useMemo(() => {
    let productosGuardados = [];
    try {
      const saved = localStorage.getItem('raiz-urbana-productos-v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          productosGuardados = parsed.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            tipo: p.tipo || 'Ropa',
            publico: p.publico || 'Unisex',
            precio: normalizarPrecio(p.variantes?.[0]?.precio ?? p.precio),
            precioOriginal: Math.round(normalizarPrecio(p.variantes?.[0]?.precio ?? p.precio) * 1.2),
            descripcion: p.descripcion || 'Pieza exclusiva urbana confeccionada con los mejores estándares de calidad.',
            imagen: p.foto || '',
            colores:
              p.variantes?.length > 0
                ? [...new Set(p.variantes.map((v) => v.color).filter(Boolean))]
                : ['Negro', 'Blanco'],
            tallas:
              p.variantes?.length > 0
                ? [...new Set(p.variantes.map((v) => v.talle || v.talla).filter(Boolean))]
                : ['S', 'M', 'L'],
            badge: p.estado === 'Activo' ? 'DISPONIBLE' : 'CATÁLOGO',
            rating: 4.8,
            reviews: 14,
          }));
        }
      }
    } catch (e) {
      console.error('Error cargando productos de localStorage:', e);
    }

    if (productosGuardados.length > 0) {
      const nombresDefault = new Set(DEFAULT_PRODUCTS.map((d) => d.nombre.toLowerCase()));
      const nuevos = productosGuardados.filter((p) => !nombresDefault.has(p.nombre.toLowerCase()));
      return [...DEFAULT_PRODUCTS, ...nuevos];
    }

    return DEFAULT_PRODUCTS;
  }, []);

  // Filtrado reactivo y ordenación
  const productosFiltrados = useMemo(() => {
    return productosBase
      .filter((p) => {
        if (categoriaActiva !== 'Todos') {
          const catNorm = normalizarTipo(p.tipo);
          if (catNorm !== categoriaActiva) return false;
        }

        if (filtroPublico !== 'Todos') {
          if (p.publico?.toLowerCase() !== filtroPublico.toLowerCase()) return false;
        }

        if (busqueda.trim()) {
          const q = busqueda.toLowerCase().trim();
          const matchNombre = p.nombre.toLowerCase().includes(q);
          const matchTipo = p.tipo.toLowerCase().includes(q);
          const matchDesc = p.descripcion?.toLowerCase().includes(q);
          if (!matchNombre && !matchTipo && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (orden === 'precio-asc') return a.precio - b.precio;
        if (orden === 'precio-desc') return b.precio - a.precio;
        if (orden === 'nombre-asc') return a.nombre.localeCompare(b.nombre);
        return b.rating - a.rating;
      });
  }, [productosBase, categoriaActiva, filtroPublico, busqueda, orden]);

  // Paginación
  const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina) || 1;
  const productosVisibles = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return productosFiltrados.slice(inicio, inicio + itemsPorPagina);
  }, [productosFiltrados, paginaActual, itemsPorPagina]);

  // Apertura de modal de vista rápida
  const abrirVistaRapida = (producto) => {
    setProductoModal(producto);
    const colorActual = coloresSeleccionados[producto.id] || producto.colores?.[0] || 'Negro';
    setModalColor(colorActual);
    setModalTalla(producto.tallas?.[0] || 'Única');
    setModalCantidad(1);
    setModalAgregado(false);
  };

  // Agregar al carrito y sincronizar con Carrito.jsx
  const agregarAlCarrito = (producto, colorParam, tallaParam, cantidad = 1) => {
    if (normalizarPrecio(producto.precio) <= 0) return;
    const color = colorParam || coloresSeleccionados[producto.id] || producto.colores?.[0] || 'Negro';
    const talla = tallaParam || producto.tallas?.[0] || 'Única';

    try {
      const savedCart = localStorage.getItem('raiz_urbana_carrito');
      let cart = [];
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) cart = parsed;
        } catch {
          cart = [];
        }
      }

      const itemExistenteIndex = cart.findIndex(
        (item) =>
          (item.productId === String(producto.id) || item.name === producto.nombre) &&
          item.color === color &&
          item.talla === talla
      );

      if (itemExistenteIndex >= 0) {
        cart[itemExistenteIndex].qty += cantidad;
      } else {
        cart.push({
          productId: String(producto.id),
          name: producto.nombre,
          color,
          talla,
          price: Number(producto.precio) || 0,
          qty: cantidad,
        });
      }

      localStorage.setItem('raiz_urbana_carrito', JSON.stringify(cart));
      window.dispatchEvent(new Event('storage'));

      setToast({
        nombre: producto.nombre,
        color,
        talla,
        cantidad,
      });

      if (productoModal) {
        setModalAgregado(true);
        setTimeout(() => setModalAgregado(false), 2200);
      }
    } catch (e) {
      console.error('Error al agregar al carrito:', e);
    }
  };

  const irACatalogo = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="inicio-page">

      {/* HERO */}
      <section className="inicio-hero">
        <div className="inicio-hero-overlay" />

        <div className="inicio-hero-content">
          <div className="inicio-hero-eyebrow">
            <span />
            NUEVA COLECCIÓN
          </div>

          <h1>
            Viste tu
            <br />
            <span>identidad.</span>
          </h1>

          <p className="inicio-hero-description">
            Ropa, tenis, bolsos y accesorios diseñados para quienes
            <br />
            saben lo que quieren. Moda urbana con carácter propio.
          </p>

          <div className="inicio-hero-buttons">
            <button
              className="inicio-btn inicio-btn-primary"
              onClick={irACatalogo}
              type="button"
            >
              <ShoppingBag size={17} />
              VER COLECCIÓN
              <ArrowRight size={17} />
            </button>

            <button
              className="inicio-btn inicio-btn-outline"
              onClick={() => navigate('/carrito')}
              type="button"
            >
              MI CARRITO
            </button>
          </div>

          <div className="inicio-hero-styles">
            <div className="inicio-hero-avatars">
              <div className="inicio-avatar inicio-avatar-1" />
              <div className="inicio-avatar inicio-avatar-2" />
              <div className="inicio-avatar inicio-avatar-3" />
            </div>

            <div>
              <strong>ESTILOS PARA TODOS</strong>
              <span>Hombre · Mujer · Accesorios</span>
            </div>
          </div>

          <div className="inicio-hero-scroll" onClick={irACatalogo} role="button" tabIndex={0}>
            <div />
            <span>SCROLL</span>
          </div>
        </div>

        <div className="inicio-hero-bottom">
          <span>NUEVA TEMPORADA DISPONIBLE</span>
          <b>✦</b>
          <span>ROPA · TENIS · BOLSOS · ACCESORIOS</span>
          <b>✦</b>
          <span>ENCUENTRA TU ESTILO ÚNICO</span>
          <b>✦</b>
          <span>COLECCIONES EXCLUSIVAS</span>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="inicio-categories">
        <div className="inicio-section-heading">
          <div>
            <span className="inicio-section-label">LO QUE ENCONTRARÁS</span>
            <h2>Nuestras categorías</h2>
          </div>

          <button
            className="inicio-view-all"
            type="button"
            onClick={() => {
              setCategoriaActiva('Todos');
              setPaginaActual(1);
              irACatalogo();
            }}
          >
            Ver todo el catálogo
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="inicio-category-grid">
          {categories.map((category) => (
            <article
              className="inicio-category-card"
              key={category.title}
              onClick={() => {
                setCategoriaActiva(category.title);
                setPaginaActual(1);
                irACatalogo();
              }}
              style={{
                backgroundImage: `url(${category.image})`,
              }}
              role="button"
              tabIndex={0}
            >
              <div className="inicio-category-overlay" />
              <span className="inicio-category-badge">COLECCIÓN</span>
              <h3>{category.title}</h3>
            </article>
          ))}
        </div>
      </section>

      {/* CATÁLOGO INTERACTIVO DE PRODUCTOS */}
      <section id="catalogo" className="inicio-catalog">
        <div className="inicio-catalog-container">

          <div className="inicio-catalog-header">
            <div className="inicio-catalog-header-text">
              <span className="inicio-section-label">COLECCIÓN 2026 · STREETWEAR & ACCESORIOS</span>
              <h2>Catálogo de Productos</h2>
              <p className="inicio-catalog-subtitle">
                Descubre prendas de corte contemporáneo, calzado urbano y complementos exclusivos diseñados para tu identidad.
              </p>
            </div>

            <div className="inicio-catalog-stats">
              <span className="inicio-catalog-pill-count">
                {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>
          </div>

          {/* Controles: Buscador y Selectores */}
          <div className="inicio-catalog-controls">
            <div className="inicio-search-wrapper">
              <Search size={18} className="inicio-search-icon" />
              <input
                type="text"
                className="inicio-search-input"
                placeholder="Buscar por nombre, categoría o estilo..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
              />
              {busqueda && (
                <button
                  type="button"
                  className="inicio-search-clear"
                  onClick={() => setBusqueda('')}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="inicio-catalog-selects">
              <div className="inicio-select-wrapper">
                <label htmlFor="filtro-publico" className="inicio-select-label">Público:</label>
                <select
                  id="filtro-publico"
                  className="inicio-custom-select"
                  value={filtroPublico}
                  onChange={(e) => {
                    setFiltroPublico(e.target.value);
                    setPaginaActual(1);
                  }}
                >
                  <option value="Todos">Todos</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>

              <div className="inicio-select-wrapper">
                <label htmlFor="filtro-orden" className="inicio-select-label">Ordenar:</label>
                <select
                  id="filtro-orden"
                  className="inicio-custom-select"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                >
                  <option value="destacados">Destacados</option>
                  <option value="precio-asc">Precio: Menor a Mayor</option>
                  <option value="precio-desc">Precio: Mayor a Menor</option>
                  <option value="nombre-asc">Nombre: A - Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pestañas de categorías */}
          <div className="inicio-catalog-categories-tabs">
            {['Todos', 'Ropa', 'Tenis', 'Bolsos', 'Accesorios'].map((cat) => {
              const count = cat === 'Todos'
                ? productosBase.length
                : productosBase.filter((p) => normalizarTipo(p.tipo) === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  className={`inicio-catalog-tab ${categoriaActiva === cat ? 'active' : ''}`}
                  onClick={() => {
                    setCategoriaActiva(cat);
                    setPaginaActual(1);
                  }}
                >
                  <span>{cat}</span>
                  <span className="inicio-tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Grid de productos */}
          {productosVisibles.length > 0 ? (
            <div className="inicio-products-grid">
              {productosVisibles.map((prod) => {
                const imgUrl = obtenerImagenProducto(prod);
                const colorActivo = coloresSeleccionados[prod.id] || prod.colores?.[0] || 'Negro';
                const isLiked = favoritos.includes(prod.id);

                return (
                  <article className="inicio-prod-card" key={prod.id}>
                    <div className="inicio-prod-image-wrap">
                      <img
                        src={imgUrl}
                        alt={prod.nombre}
                        className="inicio-prod-img"
                        loading="lazy"
                        decoding="async"
                      />

                      {prod.badge && (
                        <span className="inicio-prod-badge">{prod.badge}</span>
                      )}

                      <button
                        type="button"
                        className={`inicio-prod-wishlist ${isLiked ? 'active' : ''}`}
                        onClick={() => toggleFavorito(prod.id)}
                        aria-label={isLiked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        title={isLiked ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                      >
                        <Heart
                          size={16}
                          fill={isLiked ? 'currentColor' : 'none'}
                          strokeWidth={isLiked ? 0 : 2}
                        />
                      </button>

                      <button
                        type="button"
                        className="inicio-prod-quickview"
                        onClick={() => abrirVistaRapida(prod)}
                      >
                        <Eye size={14} />
                        Vista rápida
                      </button>
                    </div>

                    <div className="inicio-prod-info">
                      <div className="inicio-prod-tags">
                        <span className="inicio-prod-category">
                          {normalizarTipo(prod.tipo)} · {prod.publico}
                        </span>

                        <div className="inicio-prod-rating">
                          <Star size={12} fill="currentColor" stroke="none" />
                          <span>{prod.rating || 4.8}</span>
                        </div>
                      </div>

                      <h3
                        className="inicio-prod-title"
                        onClick={() => abrirVistaRapida(prod)}
                      >
                        {prod.nombre}
                      </h3>

                      {prod.colores && prod.colores.length > 0 && (
                        <div className="inicio-prod-colors">
                          {prod.colores.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`inicio-color-dot ${colorActivo === color ? 'active' : ''}`}
                              style={{ backgroundColor: COLOR_PALETTE[color] || '#495057' }}
                              title={`Color ${color}`}
                              onClick={() => {
                                setColoresSeleccionados((prev) => ({
                                  ...prev,
                                  [prod.id]: color,
                                }));
                              }}
                              aria-label={`Seleccionar color ${color}`}
                            />
                          ))}
                        </div>
                      )}

                      <div className="inicio-prod-pricing">
                        <span className="inicio-prod-price">
                          {prod.precio > 0 ? formatoPrecio(prod.precio) : 'Precio por definir'}
                        </span>
                        {prod.precioOriginal && prod.precioOriginal > prod.precio && (
                          <span className="inicio-prod-original-price">
                            {formatoPrecio(prod.precioOriginal)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="inicio-btn-add-cart"
                        onClick={() => agregarAlCarrito(prod, colorActivo, prod.tallas?.[0] || 'Única', 1)}
                          disabled={prod.precio <= 0}
                      >
                        <ShoppingBag size={15} />
                        Añadir al carrito
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="inicio-catalog-empty">
              <Package size={44} className="inicio-empty-icon" />
              <h3>No encontramos productos</h3>
              <p>
                No hay resultados para los filtros seleccionados. Intenta con otra categoría o término de búsqueda.
              </p>
              <button
                type="button"
                className="inicio-btn inicio-btn-primary"
                onClick={() => {
                  setBusqueda('');
                  setCategoriaActiva('Todos');
                  setFiltroPublico('Todos');
                  setPaginaActual(1);
                }}
              >
                <RotateCcw size={15} />
                Restablecer filtros
              </button>
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="inicio-catalog-pagination">
              <button
                type="button"
                className="inicio-page-btn"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`inicio-page-btn ${paginaActual === num ? 'active' : ''}`}
                  onClick={() => setPaginaActual(num)}
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                className="inicio-page-btn"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                aria-label="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>
      </section>

      {/* EDITORIAL */}
      <section className="inicio-editorial">
        <div className="inicio-editorial-background" />
        <div className="inicio-editorial-overlay" />

        <div className="inicio-editorial-content">
          <div className="inicio-editorial-copy">
            <div className="inicio-editorial-eyebrow">
              <Sparkles size={15} />
              RAÍZ URBANA
            </div>

            <h2>
              Moda que
              <br />
              <span>define épocas.</span>
            </h2>

            <p>
              Cada prenda, cada accesorio y cada par de tenis
              en nuestra colección está pensado para construir
              un estilo auténtico. Sin tendencias pasajeras.
            </p>

            <button
              className="inicio-btn inicio-btn-primary"
              onClick={irACatalogo}
              type="button"
            >
              VER COLECCIÓN COMPLETA
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="inicio-features">
            {features.map((feature) => (
              <div className="inicio-feature-card" key={feature.title}>
                <div className="inicio-feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODAL VISTA RÁPIDA INTERACTIVO */}
      {productoModal && (
        <div
          className="inicio-quickview-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProductoModal(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={productoModal.nombre}
        >
          <div className="inicio-quickview-modal">
            <button
              type="button"
              className="inicio-quickview-close"
              onClick={() => setProductoModal(null)}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>

            <div className="inicio-quickview-image-side">
              <img
                src={obtenerImagenProducto(productoModal)}
                alt={productoModal.nombre}
                className="inicio-quickview-img"
              />
              {productoModal.badge && (
                <span className="inicio-prod-badge">
                  {productoModal.badge}
                </span>
              )}
            </div>

            <div className="inicio-quickview-details">
              <span className="inicio-quickview-eyebrow">
                {normalizarTipo(productoModal.tipo)} · {productoModal.publico}
              </span>

              <h2 className="inicio-quickview-title">
                {productoModal.nombre}
              </h2>

              <div className="inicio-quickview-rating">
                <div className="inicio-quickview-rating-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" stroke="none" />
                  ))}
                </div>
                <span className="inicio-quickview-reviews">
                  {productoModal.rating || 4.9} ({productoModal.reviews || 28} valoraciones)
                </span>
              </div>

              <div className="inicio-quickview-price-row">
                <span className="inicio-quickview-price">
                  {productoModal.precio > 0 ? formatoPrecio(productoModal.precio) : 'Precio por definir'}
                </span>
                {productoModal.precioOriginal && productoModal.precioOriginal > productoModal.precio && (
                  <span className="inicio-quickview-original">
                    {formatoPrecio(productoModal.precioOriginal)}
                  </span>
                )}
              </div>

              <p className="inicio-quickview-desc">
                {productoModal.descripcion}
              </p>

              {/* Selector de color */}
              {productoModal.colores && productoModal.colores.length > 0 && (
                <div>
                  <div className="inicio-quickview-section-title">
                    <span>COLOR:</span>
                    <span className="inicio-quickview-selected-val">{modalColor}</span>
                  </div>

                  <div className="inicio-quickview-color-options">
                    {productoModal.colores.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`inicio-quickview-color-btn ${modalColor === c ? 'selected' : ''}`}
                        onClick={() => setModalColor(c)}
                      >
                        <span
                          className="inicio-quickview-color-preview"
                          style={{ backgroundColor: COLOR_PALETTE[c] || '#495057' }}
                        />
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de tallas */}
              {productoModal.tallas && productoModal.tallas.length > 0 && (
                <div>
                  <div className="inicio-quickview-section-title">
                    <span>TALLA DISPONIBLE:</span>
                    <span className="inicio-quickview-selected-val">{modalTalla}</span>
                  </div>

                  <div className="inicio-quickview-size-options">
                    {productoModal.tallas.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`inicio-quickview-size-btn ${modalTalla === t ? 'selected' : ''}`}
                        onClick={() => setModalTalla(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones de compra */}
              <div className="inicio-quickview-actions">
                <div className="inicio-quickview-qty">
                  <button
                    type="button"
                    className="inicio-qty-btn"
                    onClick={() => setModalCantidad((prev) => Math.max(1, prev - 1))}
                    disabled={modalCantidad <= 1}
                    aria-label="Reducir cantidad"
                  >
                    <Minus size={14} />
                  </button>

                  <span className="inicio-qty-value">{modalCantidad}</span>

                  <button
                    type="button"
                    className="inicio-qty-btn"
                    onClick={() => setModalCantidad((prev) => Math.min(10, prev + 1))}
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  className="inicio-btn inicio-btn-primary inicio-quickview-btn-add"
                  onClick={() => agregarAlCarrito(productoModal, modalColor, modalTalla, modalCantidad)}
                    disabled={productoModal.precio <= 0}
                >
                  {modalAgregado ? (
                    <>
                      <Check size={16} />
                      ¡AÑADIDO!
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} />
                      {productoModal.precio > 0 ? `AÑADIR (${formatoPrecio(productoModal.precio * modalCantidad)})` : 'PRECIO POR DEFINIR'}
                    </>
                  )}
                </button>
              </div>

              <div className="inicio-quickview-perks">
                <div className="inicio-quickview-perk-item">
                  <CheckCircle2 size={14} style={{ color: '#2b8a3e' }} />
                  <span>Envío express seguro a toda Colombia</span>
                </div>
                <div className="inicio-quickview-perk-item">
                  <CheckCircle2 size={14} style={{ color: '#2b8a3e' }} />
                  <span>Garantía de confección y calidad Raíz Urbana</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST FLOTANTE */}
      {toast && (
        <aside className="inicio-toast-container" role="status" aria-live="polite">
          <div className="inicio-toast-icon">
            <Check size={16} />
          </div>

          <div className="inicio-toast-content">
            <div className="inicio-toast-title">¡Añadido al carrito!</div>
            <div className="inicio-toast-detail">
              {toast.nombre} · {toast.color} · Talla {toast.talla} (x{toast.cantidad})
            </div>
          </div>

          <button
            type="button"
            className="inicio-toast-btn-cart"
            onClick={() => navigate('/carrito')}
          >
            Ver Carrito
          </button>

          <button
            type="button"
            className="inicio-toast-close"
            onClick={() => setToast(null)}
            aria-label="Cerrar notificación"
          >
            <X size={14} />
          </button>
        </aside>
      )}

      {/* FOOTER */}
      <footer className="inicio-footer">
        <div className="inicio-footer-main">
          <div className="inicio-footer-brand">
            <div className="inicio-logo">
              <img
                src={theme === 'dark' ? '/images/logoDark.png' : '/images/logo-ru.png'}
                alt="Raíz Urbana"
              />
            </div>

            <p>
              Moda contemporánea que refleja tu
              <br />
              esencia y estilo personal.
            </p>
          </div>

          <div className="inicio-footer-column">
            <h3>NAVEGACIÓN</h3>
            <a href="/">Inicio</a>
            <a href="/productos">Productos</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/design-system">Design System</a>
            <a href="/navegacion">Navegación</a>
          </div>

          <div className="inicio-footer-column inicio-footer-contact">
            <h3>CONTACTO</h3>
            <div>
              <MapPin size={17} />
              <span>Calle Principal 123, Ciudad</span>
            </div>

            <div>
              <Phone size={17} />
              <span>+123 456 7890</span>
            </div>

            <div>
              <Mail size={17} />
              <span>hola@raizurbana.com</span>
            </div>
          </div>

          <div className="inicio-social-icons">
            <h3>SÍGUENOS</h3>
            <div className="inicio-social-icons-list">
              <a href="#" aria-label="Facebook">
                <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.7.3-1 1-1Z" fill="currentColor" />
                </svg>
              </a>

              <a href="#" aria-label="Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>

              <a href="#" aria-label="TikTok">
                <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 3c.3 2.1 1.5 3.5 3.5 3.7v3.2c-1.5 0-2.8-.5-3.8-1.2v7.1c0 4-2.7 6.2-6.1 6.2-3 0-5.6-2.2-5.6-5.4 0-3.4 2.8-5.6 6-5.6.4 0 .8 0 1.2.1v3.2c-.4-.1-.8-.2-1.2-.2-1.2 0-2.5.8-2.5 2.3 0 1.4 1.1 2.2 2.2 2.2 1.4 0 2.6-.8 2.6-2.8V3h3.7Z" fill="currentColor" />
                </svg>
              </a>

              <a href="#" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.5-1.7a11.8 11.8 0 0 0 5.4 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.1-1.2-6.1-3.5-8.3ZM12.1 21.5c-1.7 0-3.3-.5-4.7-1.3l-.3-.2-3.9 1 1-3.8-.2-.3a9.7 9.7 0 1 1 8.1 4.6Zm5.3-7.3c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.7-2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.5 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.3 3.3c.2.2 2.2 3.4 5.4 4.8.8.3 1.4.5 1.9.6.8.2 1.5.2 2 .1.6-.1 1.7-.7 2-1.3.2-.6.2-1.1.1-1.3-.1-.1-.3-.2-.6-.3Z" fill="currentColor" />
                </svg>
              </a>

              <a href="#" aria-label="YouTube">
                <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.9V8.1l6.5 3.9-6.5 3.9Z" fill="currentColor" />
                </svg>
              </a>

              <a href="#" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.2 3.2a2.2 2.2 0 1 1-4.4 0 2.2 2.2 0 0 1 4.4 0ZM1.1 8h4.2v12.9H1.1V8Zm6.8 0h4v1.8h.1c.6-1.1 2-2.2 4.1-2.2 4.4 0 5.2 2.9 5.2 6.7v6.6h-4.2v-5.8c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1v5.9H7.9V8Z" fill="currentColor" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="inicio-footer-bottom">
          <span>
            © 2026 Raíz Urbana. Todos los derechos reservados.
          </span>

          <div>
            <a href="#">Política de Privacidad</a>
            <a href="#">Términos de Uso</a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Inicio;