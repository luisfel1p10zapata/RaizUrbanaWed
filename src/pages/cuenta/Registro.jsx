import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Layers, Star, LayoutGrid, User, Phone, MapPin } from 'lucide-react';
import './registro.css';

export default function Registro() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('activo');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    genero: '',
    rol: 'Empleado'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/cuenta/perfil');
  };

  return (
    <div className="auth-container">
      {/* Panel Izquierdo Hero */}
      <div className="auth-left-panel">
        <div className="auth-brand-logo">R\U</div>

        <div className="auth-hero-content">
          <div className="auth-hero-subtitle-tag">SISTEMA ADMINISTRATIVO</div>
          <h1 className="auth-hero-title">Moda que refleja tu esencia.</h1>
          <p className="auth-hero-description">
            Gestiona tu catálogo, ventas, compras y producción desde un solo lugar.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <Layers size={16} />
              <span>Catálogo de moda premium</span>
            </div>
            <div className="auth-feature-item">
              <Star size={16} />
              <span>Gestión integral de ventas</span>
            </div>
            <div className="auth-feature-item">
              <LayoutGrid size={16} />
              <span>Panel administrativo completo</span>
            </div>
          </div>
        </div>

        <div className="auth-footer-tag">
          Raíz Urbana © 2026 - Uso Interno
        </div>
      </div>

      {/* Panel Derecho Formulario */}
      <div className="auth-right-panel">
        <div className="auth-top-nav">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={14} />
            Volver al sistema
          </Link>
        </div>

        <div className="auth-card-wrapper">
          <div className="auth-card-register">
            <div className="auth-card-logo">R\U</div>
            <div className="auth-card-subtitle">NUEVA CUENTA</div>
            <h2 className="auth-card-title">Crear cuenta</h2>
            <p className="auth-card-desc">Únete a Raíz Urbana</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-section-divider">INFORMACIÓN PERSONAL</div>

              <div className="auth-input-group">
                <label>NOMBRES *</label>
                <div className="auth-input-wrapper">
                  <User size={14} className="auth-input-icon" />
                  <input
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

              <div className="auth-input-group">
                <label>CORREO ELECTRÓNICO *</label>
                <div className="auth-input-wrapper">
                  <Mail size={14} className="auth-input-icon" />
                  <input
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

              <div className="auth-section-divider">SEGURIDAD</div>

              <div className="auth-input-group">
                <label>CONTRASEÑA *</label>
                <div className="auth-input-wrapper">
                  <Lock size={14} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="auth-section-divider">CONTACTO</div>

              <div className="auth-input-group">
                <label>TELÉFONO *</label>
                <div className="auth-input-wrapper">
                  <Phone size={14} className="auth-input-icon" />
                  <input
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

              <div className="auth-input-group">
                <label>DIRECCIÓN *</label>
                <div className="auth-input-wrapper">
                  <MapPin size={14} className="auth-input-icon" />
                  <input
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

              <div className="auth-section-divider">PERFIL</div>

              <div className="auth-grid-2">
                <div className="auth-input-group">
                  <label>GÉNERO *</label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    required
                    className="auth-select auth-select-no-icon"
                  >
                    <option value="">Seleccionar</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="auth-input-group">
                  <label>ROL</label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    className="auth-select auth-select-no-icon"
                  >
                    <option value="Empleado">Empleado</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="auth-input-group">
                <label>ESTADO</label>
                <div className="auth-status-toggle">
                  <button
                    type="button"
                    className={`auth-status-btn ${status === 'activo' ? 'active' : ''}`}
                    onClick={() => setStatus('activo')}
                  >
                    Activo
                  </button>
                  <button
                    type="button"
                    className={`auth-status-btn ${status === 'inactivo' ? 'active' : ''}`}
                    onClick={() => setStatus('inactivo')}
                  >
                    Inactivo
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                CREAR CUENTA
              </button>
            </form>

            <div className="auth-card-footer">
              ¿Ya tienes cuenta?{' '}
              <Link to="/cuenta/iniciar-sesion" className="auth-link-bold">
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}