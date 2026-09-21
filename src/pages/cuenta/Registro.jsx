import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Layers,
  Star,
  LayoutGrid,
  User,
  Phone,
  MapPin
} from 'lucide-react';

import useTheme from '../../components/hook/useTheme';
import './registro.css';

export default function Registro() {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const { theme } = useTheme();

  // Logo dinámico según el tema
  const logoSrc =
    theme === 'dark'
      ? '/images/logoDark.png'
      : '/images/logo-ru.png';

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    genero: '',
    rol: 'Empleado',
    estado: 'activo'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (nuevoEstado) => {
    setFormData((prev) => ({
      ...prev,
      estado: nuevoEstado
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('Datos a enviar:', formData);

    navigate('/cuenta/perfil');
  };

  return (
    <div className="auth-container">

      {/* =========================================
          PANEL IZQUIERDO
          ========================================= */}
      <div className="auth-left-panel">

        {/* Logo */}
        <div className="auth-brand-logo">
          <img
            src={logoSrc}
            alt="Raíz Urbana"
          />
        </div>

        {/* Hero */}
        <div className="auth-hero-content">

          <div className="auth-hero-subtitle-tag">
            SISTEMA ADMINISTRATIVO
          </div>

          <h1 className="auth-hero-title">
            Moda que refleja tu esencia.
          </h1>

          <p className="auth-hero-description">
            Gestiona tu catálogo, ventas, compras y producción
            desde un solo lugar.
          </p>

          {/* Características */}
          <div className="auth-feature-list">

            <div className="auth-feature-item">
              <Layers size={16} />
              <span>
                Catálogo de ropa y accesorios
              </span>
            </div>

            <div className="auth-feature-item">
              <Star size={16} />
              <span>
                Gestión integral de ventas
              </span>
            </div>

            <div className="auth-feature-item">
              <LayoutGrid size={16} />
              <span>
                Panel administrativo completo
              </span>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer-tag">
          Raíz Urbana © 2026 - Uso Interno
        </div>

      </div>


      {/* =========================================
          PANEL DERECHO
          ========================================= */}
      <div className="auth-right-panel">

        {/* Navegación */}
        <div className="auth-top-nav">

          <Link
            to="/"
            className="auth-back-link"
          >
            <ArrowLeft size={14} />
            Volver al sistema
          </Link>

        </div>


        {/* Tarjeta */}
        <div className="auth-card-wrapper">

          <div className="auth-card-register">

            {/* Logo de la tarjeta */}
            <div className="auth-card-logo">

              <img
                src={logoSrc}
                alt="Raíz Urbana"
              />

            </div>


            {/* Encabezado */}
            <div className="auth-card-subtitle">
              NUEVA CUENTA
            </div>

            <h2 className="auth-card-title">
              Crear cuenta
            </h2>

            <p className="auth-card-desc">
              Únete a Raíz Urbana
            </p>


            {/* =====================================
                FORMULARIO
                ===================================== */}
            <form
              onSubmit={handleSubmit}
              className="auth-form"
            >

              {/* INFORMACIÓN PERSONAL */}
              <div className="auth-section-divider">
                INFORMACIÓN PERSONAL
              </div>


              {/* NOMBRES */}
              <div className="auth-input-group">

                <label htmlFor="nombre">
                  NOMBRES *
                </label>

                <div className="auth-input-wrapper">

                  <User
                    size={14}
                    className="auth-input-icon"
                  />

                  <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    placeholder="Tu nombre completo"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />

                </div>

              </div>


              {/* CORREO */}
              <div className="auth-input-group">

                <label htmlFor="email">
                  CORREO ELECTRÓNICO *
                </label>

                <div className="auth-input-wrapper">

                  <Mail
                    size={14}
                    className="auth-input-icon"
                  />

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="tu@correo.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />

                </div>

              </div>


              {/* SEGURIDAD */}
              <div className="auth-section-divider">
                SEGURIDAD
              </div>


              {/* CONTRASEÑA */}
              <div className="auth-input-group">

                <label htmlFor="password">
                  CONTRASEÑA *
                </label>

                <div className="auth-input-wrapper">

                  <Lock
                    size={14}
                    className="auth-input-icon"
                  />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="auth-input"
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={14} />
                    ) : (
                      <Eye size={14} />
                    )}
                  </button>

                </div>

              </div>


              {/* CONTACTO */}
              <div className="auth-section-divider">
                CONTACTO
              </div>


              {/* TELÉFONO */}
              <div className="auth-input-group">

                <label htmlFor="telefono">
                  TELÉFONO *
                </label>

                <div className="auth-input-wrapper">

                  <Phone
                    size={14}
                    className="auth-input-icon"
                  />

                  <input
                    id="telefono"
                    type="tel"
                    name="telefono"
                    placeholder="+57 300 000 0000"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />

                </div>

              </div>


              {/* DIRECCIÓN */}
              <div className="auth-input-group">

                <label htmlFor="direccion">
                  DIRECCIÓN *
                </label>

                <div className="auth-input-wrapper">

                  <MapPin
                    size={14}
                    className="auth-input-icon"
                  />

                  <input
                    id="direccion"
                    type="text"
                    name="direccion"
                    placeholder="Calle, Barrio, Ciudad"
                    value={formData.direccion}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />

                </div>

              </div>


              {/* PERFIL */}
              <div className="auth-section-divider">
                PERFIL
              </div>


              {/* GÉNERO + ROL */}
              <div className="auth-grid-2">

                {/* GÉNERO */}
                <div className="auth-input-group">

                  <label htmlFor="genero">
                    GÉNERO *
                  </label>

                  <select
                    id="genero"
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    required
                    className="auth-select auth-select-no-icon"
                  >
                    <option value="">
                      Seleccionar
                    </option>

                    <option value="masculino">
                      Masculino
                    </option>

                    <option value="femenino">
                      Femenino
                    </option>

                    <option value="otro">
                      Otro
                    </option>
                  </select>

                </div>


                {/* ROL */}
                <div className="auth-input-group">

                  <label htmlFor="rol">
                    ROL
                  </label>

                  <select
                    id="rol"
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    className="auth-select auth-select-no-icon"
                  >
                    <option value="Empleado">
                      Empleado
                    </option>

                    <option value="Administrador">
                      Administrador
                    </option>
                  </select>

                </div>

              </div>


              {/* ESTADO */}
              <div className="auth-input-group">

                <label>
                  ESTADO
                </label>

                <div className="auth-status-toggle">

                  <button
                    type="button"
                    className={`auth-status-btn ${
                      formData.estado === 'activo'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      handleStatusChange('activo')
                    }
                  >
                    Activo
                  </button>

                  <button
                    type="button"
                    className={`auth-status-btn ${
                      formData.estado === 'inactivo'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      handleStatusChange('inactivo')
                    }
                  >
                    Inactivo
                  </button>

                </div>

              </div>


              {/* BOTÓN */}
              <button
                type="submit"
                className="auth-submit-btn"
              >
                CREAR CUENTA
              </button>

            </form>


            {/* Footer */}
            <div className="auth-card-footer">

              ¿Ya tienes cuenta?{' '}

              <Link
                to="/cuenta/iniciar-sesion"
                className="auth-link-bold"
              >
                Inicia sesión
              </Link>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}