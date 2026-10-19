
import {
    Home,
    LayoutDashboard,
    Package,
    Tags,
    ShoppingBag,
    Truck,
    Warehouse,
    Ruler,
    Factory,
    CreditCard,
    Users,
    Shield,
    TrendingUp,
    Receipt,
    Layers,
    Archive,
    RotateCcw,
} from 'lucide-react';

const navigationConfig = [
    {
        title: 'Principal',
        items: [
            {
                label: 'Inicio',
                path: '/inicio',
                icon: Home,
            },
            {
                label: 'Dashboard',
                path: '/dashboard',
                icon: LayoutDashboard,
            },
        ],
    },

    {
        title: 'Configuración',
        items: [
            {
                label: 'Roles',
                path: '/administracion/roles',
                icon: Shield,
            },
        ],
    },

    {
        title: 'Usuarios',
        items: [
            {
                label: 'Usuarios',
                path: '/administracion/usuarios',
                icon: Users,
            },
        ],
    },

    {
        title: 'Control de existencias',
        items: [
            {
                label: 'Categoría',
                path: '/categorias',
                icon: Tags,
            },
            {
                label: 'Subcategoría',
                path: '/tipo-producto',
                icon: Layers,
            },
            {
                label: 'Insumos',
                path: '/inventario/insumos',
                icon: Warehouse,
            },
            {
                label: 'Productos',
                path: '/productos',
                icon: Package,
            },
            {
                label: 'Producto Variante',
                path: '/productos-variante',
                icon: Layers,
            },
            {
                label: 'Bajas Insumos',
                path: '/inventario/bajas-insumos',
                icon: Archive,
            },
            {
                label: 'Tamaños',
                path: '/inventario/tamanos',
                icon: Ruler,
            },
            {
                label: 'Materiales',
                path: '/inventario/materiales',
                icon: Package,
            },
        ],
    },

    {
        title: 'Compras',
        items: [
            {
                label: 'Proveedores',
                path: '/proveedores',
                icon: Truck,
            },
            {
                label: 'Compras',
                path: '/compras',
                icon: Receipt,
            },
        ],
    },

    {
        title: 'Producción',
        items: [
            {
                label: 'Orden de producción',
                path: '/procesos/produccion',
                icon: Factory,
            },
        ],
    },

    {
        title: 'Ventas',
        items: [
            {
                label: 'Ventas',
                path: '/ventas',
                icon: TrendingUp,
            },
            {
                label: 'Devoluciones',
                path: '/devoluciones',
                icon: RotateCcw,
            },
            {
                label: 'Carrito',
                path: '/carrito',
                icon: ShoppingBag,
            },
            {
                label: 'Método Pago',
                path: '/procesos/metodo-pago',
                icon: CreditCard,
            },
        ],
    },
];

export default navigationConfig;
