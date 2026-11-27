import {
    Home,
    LayoutDashboard,
    Package,
    Tags,
    ShoppingBag,
    Truck,
    Warehouse,
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
                path: '/subcategorias',
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
                label: 'Bajas Insumos',
                path: '/inventario/bajas-insumos',
                icon: Archive,
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