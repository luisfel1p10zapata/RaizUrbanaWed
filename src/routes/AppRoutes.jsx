import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import MainNavbar from '../components/navegacion/MainNavbar';
import AdminLayout from '../components/layout/AdminLayout';

// Ventas y catálogo
import Inicio from '../features/ventas/components/Inicio';
import Ventas from '../features/ventas/components/Ventas';
import Carrito from '../features/ventas/components/Carrito';
import Productos from '../features/control-de-existencias/components/Productos';
import Categorias from '../features/control-de-existencias/components/Categorias';
import Subcategorias from '../features/control-de-existencias/components/Subcategorias';
import Devoluciones from '../features/ventas/components/Devoluciones';

// Dashboard
import Dashboard from '../features/dashboard/components/Dashboard';

// Compras
import Compras from '../features/compras/components/Compras';
import ComprasInsumos from '../features/compras/components/ComprasInsumos';
import Proveedores from '../features/compras/components/Proveedores';

// Inventario
import Insumos from '../features/control-de-existencias/components/Insumos';
import CategoriaInsumos from '../features/control-de-existencias/components/CategoriaInsumos';
import BajasInsumos from '../features/control-de-existencias/components/BajasInsumos';

// Procesos
import Produccion from '../features/produccion/components/Produccion';
import MetodoPago from '../features/ventas/components/MetodoPago';

// Administración
import Usuarios from '../features/usuarios/components/Usuarios';
import Roles from '../features/config/components/Roles';

// Cuenta y autenticación
import InicioSesion from '../features/usuarios/components/InicioSesion';
import Registro from '../features/usuarios/components/Registro';
import RecuperarContrasena from '../features/usuarios/components/RecuperarContrasena';
import RestablecerContrasena from '../features/usuarios/components/RestablecerContrasena';
import ActivarCuenta from '../features/usuarios/components/ActivarCuenta';
import Perfil from '../features/usuarios/components/Perfil';
import RutaProtegida from '../features/usuarios/components/RutaProtegida';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}

        <Route
          path="/inicio"
          element={
            <>
              <MainNavbar />
              <Inicio />
            </>
          }
        />

        <Route
          path="/cuenta/inicio-sesion"
          element={<InicioSesion />}
        />

        <Route
          path="/cuenta/registro"
          element={<Registro />}
        />

        <Route
          path="/cuenta/recuperar-contrasena"
          element={<RecuperarContrasena />}
        />

        <Route
          path="/cuenta/restablecer-contrasena"
          element={<RestablecerContrasena />}
        />

        <Route
          path="/activar-cuenta"
          element={<ActivarCuenta />}
        />

        {/* Perfil para personas con sesión activa */}

        <Route element={<RutaProtegida />}>
          <Route
            path="/cuenta/perfil"
            element={
              <>
                <MainNavbar />
                <Perfil />
              </>
            }
          />
        </Route>

        {/* Área administrativa */}

        <Route element={<RutaProtegida soloAdministrativo />}>
          <Route element={<AdminLayout />}>
            <Route element={<RutaProtegida permiso="Dashboard" />}>
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Ventas" />}>
              <Route
                path="/ventas"
                element={<Ventas />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Carrito" />}>
              <Route
                path="/carrito"
                element={<Carrito />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Productos" />}>
              <Route
                path="/productos"
                element={<Productos />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Categoria" />}>
              <Route
                path="/categorias"
                element={<Categorias />}
              />

              <Route
                path="/inventario/categoria-insumos"
                element={<CategoriaInsumos />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="SubCategoria" />}>
              <Route
                path="/subcategorias"
                element={<Subcategorias />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Compras" />}>
              <Route
                path="/compras"
                element={<Compras />}
              />

              <Route
                path="/compras-insumos"
                element={<ComprasInsumos />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Proveedores" />}>
              <Route
                path="/proveedores"
                element={<Proveedores />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Bajas Insumos" />}>
              <Route
                path="/inventario/bajas-insumos"
                element={<BajasInsumos />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Devoluciones" />}>
              <Route
                path="/devoluciones"
                element={<Devoluciones />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Insumos" />}>
              <Route
                path="/inventario/insumos"
                element={<Insumos />}
              />
            </Route>

            <Route
              element={
                <RutaProtegida permiso="Orden de Produccion" />
              }
            >
              <Route
                path="/procesos/produccion"
                element={<Produccion />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Metodo Pago" />}>
              <Route
                path="/procesos/metodo-pago"
                element={<MetodoPago />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Usuarios" />}>
              <Route
                path="/administracion/usuarios"
                element={<Usuarios />}
              />
            </Route>

            <Route element={<RutaProtegida permiso="Roles" />}>
              <Route
                path="/administracion/roles"
                element={<Roles />}
              />
            </Route>
          </Route>
        </Route>

        {/* Redirecciones */}

        <Route
          path="/"
          element={<Navigate to="/inicio" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/inicio" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;