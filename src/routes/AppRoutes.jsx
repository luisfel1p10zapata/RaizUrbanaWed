import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import MainNavbar from '../components/navbar/MainNavbar';
import AdminLayout from '../components/layout/AdminLayout';

// Principal
import Inicio from '../pages/principal/Inicio';
import Dashboard from '../pages/principal/Dashboard';

// Ventas
import Ventas from '../pages/ventas/Ventas';
import Carrito from '../pages/ventas/Carrito';
import Productos from '../pages/ventas/Productos';
import ProductosVariante from '../pages/ventas/ProductosVariante';
import Categorias from '../pages/ventas/Categorias';
import TipoProducto from '../pages/ventas/TipoProducto';

// Compras
import Compras from '../pages/compras/Compras';
import ComprasInsumos from '../pages/compras/ComprasInsumos';
import Proveedores from '../pages/compras/Proveedores';

// Inventario
import Insumos from '../pages/inventario/Insumos';
import CategoriaInsumos from '../pages/inventario/CategoriaInsumos';
import Materiales from '../pages/inventario/Materiales';
import Tamanos from '../pages/inventario/Tamanos';

// Procesos
import Produccion from '../pages/procesos/Produccion';
import MetodoPago from '../pages/procesos/MetodoPago';

// Administración
import Usuarios from '../pages/administracion/Usuarios';
import Roles from '../pages/administracion/Roles';

// Cuenta
import InicioSesion from '../pages/cuenta/InicioSesion';
import Registro from '../pages/cuenta/Registro';
import RecuperarContrasena from '../pages/cuenta/RecuperarContrasena';
import Perfil from '../pages/cuenta/Perfil';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================== */}
        {/* RUTAS PÚBLICAS       */}
        {/* ==================== */}

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


        {/* ==================== */}
        {/* RUTAS ADMINISTRATIVAS */}
        {/* ==================== */}

        <Route element={<AdminLayout />}>

          {/* Principal */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Ventas */}
          <Route
            path="/ventas"
            element={<Ventas />}
          />

          <Route
            path="/carrito"
            element={<Carrito />}
          />

          <Route
            path="/productos"
            element={<Productos />}
          />

          <Route
            path="/productos-variante"
            element={<ProductosVariante />}
          />

          <Route
            path="/categorias"
            element={<Categorias />}
          />

          <Route
            path="/tipo-producto"
            element={<TipoProducto />}
          />

          {/* Compras */}
          <Route
            path="/compras"
            element={<Compras />}
          />

          <Route
            path="/compras-insumos"
            element={<ComprasInsumos />}
          />

          <Route
            path="/proveedores"
            element={<Proveedores />}
          />

          {/* Inventario */}
          <Route
            path="/inventario/insumos"
            element={<Insumos />}
          />

          <Route
            path="/inventario/categoria-insumos"
            element={<CategoriaInsumos />}
          />

          <Route
            path="/inventario/materiales"
            element={<Materiales />}
          />

          <Route
            path="/inventario/tamanos"
            element={<Tamanos />}
          />

          {/* Procesos */}
          <Route
            path="/procesos/produccion"
            element={<Produccion />}
          />

          <Route
            path="/procesos/metodo-pago"
            element={<MetodoPago />}
          />

          {/* Administración */}
          <Route
            path="/administracion/usuarios"
            element={<Usuarios />}
          />

          <Route
            path="/administracion/roles"
            element={<Roles />}
          />

          {/* Cuenta */}
          <Route
            path="/cuenta/perfil"
            element={<Perfil />}
          />

        </Route>


        {/* ==================== */}
        {/* REDIRECCIONES        */}
        {/* ==================== */}

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