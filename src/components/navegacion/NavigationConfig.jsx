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
        title: 'Ventas',
        items: [
            {
                label: 'Ventas',
                path: '/ventas',
                icon: TrendingUp,
            },
            {
                label: 'Carrito',
                path: '/carrito',
                icon: ShoppingBag,
            },
            {
                label: 'Productos',
                path: '/productos',
                icon: Package,
            },
            {
                label: 'Productos Variante',
                path: '/productos-variante',
                icon: Layers,
            },
            {
                label: 'Categorías',
                path: '/categorias',
                icon: Tags,
            },
            {
                label: 'Tipo Producto',
                path: '/tipo-producto',
                icon: Package,
            },
        ],
    },

    {
        title: 'Compras',
        items: [
            {
                label: 'Compras',
                path: '/compras',
                icon: Receipt,
            },
            {
                label: 'Compras Insumos',
                path: '/compras-insumos',
                icon: Package,
            },
            {
                label: 'Proveedores',
                path: '/proveedores',
                icon: Truck,
            },
        ],
    },

    {
        title: 'Inventario',
        items: [
            {
                label: 'Insumos',
                path: '/inventario/insumos',
                icon: Warehouse,
            },
            {
                label: 'Categoría Insumos',
                path: '/inventario/categoria-insumos',
                icon: Tags,
            },
            {
                label: 'Materiales',
                path: '/inventario/materiales',
                icon: Layers,
            },
            {
                label: 'Tamaños',
                path: '/inventario/tamanos',
                icon: Ruler,
            },
        ],
    },

    {
        title: 'Procesos',
        items: [
            {
                label: 'Producción',
                path: '/procesos/produccion',
                icon: Factory,
            },
            {
                label: 'Método Pago',
                path: '/procesos/metodo-pago',
                icon: CreditCard,
            },
        ],
    },

    {
        title: 'Administración',
        items: [
            {
                label: 'Usuarios',
                path: '/administracion/usuarios',
                icon: Users,
            },
            {
                label: 'Roles',
                path: '/administracion/roles',
                icon: Shield,
            },
        ],
    },
];

export default navigationConfig;