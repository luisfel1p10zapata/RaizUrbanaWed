import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import MainNavbar from '../components/navegacion/MainNavbar';
import AdminLayout from '../components/layout/AdminLayout';

// Ventas (Incluye catálogo, carrito y gestión de ventas/productos)
import Inicio from '../features/ventas/components/Inicio';
import Ventas from '../features/ventas/components/Ventas';
import Carrito from '../features/ventas/components/Carrito';
import Productos from '../features/control-de-existencias/components/Productos';
import ProductosVariante from '../features/control-de-existencias/components/ProductosVariante';
import Categorias from '../features/control-de-existencias/components/Categorias';
import TipoProducto from '../features/control-de-existencias/components/TipoProducto';

// Dashboard
import Dashboard from '../features/dashboard/components/Dashboard';

// Compras
import Compras from '../features/compras/components/Compras';
import ComprasInsumos from '../features/compras/components/ComprasInsumos';
import Proveedores from '../features/compras/components/Proveedores';

// Control de Existencias / Inventario
import Insumos from '../features/control-de-existencias/components/Insumos';
import CategoriaInsumos from '../features/control-de-existencias/components/CategoriaInsumos';
import Materiales from '../features/control-de-existencias/components/Materiales';
import Tamanos from '../features/control-de-existencias/components/Tamanos';

// Producción y Configuración de Procesos
import Produccion from '../features/produccion/components/Produccion';
import MetodoPago from '../features/ventas/components/MetodoPago';

// Administración (Usuarios y Roles)
import Usuarios from '../features/usuarios/components/Usuarios';
import Roles from '../features/config/components/Roles';

// Cuenta y Autenticación
import InicioSesion from '../features/usuarios/components/InicioSesion';
import Registro from '../features/usuarios/components/Registro';
import RecuperarContrasena from '../features/usuarios/components/RecuperarContrasena';
import Perfil from '../features/usuarios/components/Perfil';

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
        ...
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