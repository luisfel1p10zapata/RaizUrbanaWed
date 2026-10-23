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
  MapPin,
  FileText,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import useTheme from '../../../components/hooks/useTheme';
import './registro.css';

export default function Registro() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Logo dinámico según tema[cite: 9]
  const logoSrc = theme === 'dark' ? '/images/logoDark.png' : '/images/logo-ru.png';

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    id_TipoDoc: '',
    numeroDoc: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    genero: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Conexión real con el backend de Python (FastAPI)
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          id_TipoDoc: formData.id_TipoDoc,
          numeroDoc: formData.numeroDoc,
          email: formData.email,
          password: formData.password,
          telefono: formData.telefono,
          direccion: formData.direccion,
          genero: formData.genero
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'El correo electrónico ya se encuentra registrado en el sistema.');
      }

      // Guardar el token y el usuario real devuelto por FastAPI en el localStorage
      localStorage.setItem('raiz_urbana_token', data.token);
      localStorage.setItem('raiz_urbana_user', JSON.stringify(data.usuario));

      console.log('Usuario registrado exitosamente:', data.usuario);

      // Redirección automática al dashboard o perfil tras el éxito
      navigate('/dashboard');

    } catch (err) {
      setError(err.message || 'Ocurrió un error al registrar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* PANEL IZQUIERDO HERO */}
      <div className="auth-left-panel">
        <div className="auth-brand-logo">
          <img src={logoSrc} alt="Raíz Urbana Logo" className="auth-logo-img" />
        </div>
        <div className="auth-hero-content">
          <div className="auth-hero-subtitle-tag">SISTEMA ADMINISTRATIVO</div>
          <h1 className="auth-hero-title">Moda que refleja tu esencia.</h1>
          <p className="auth-hero-description">
            Gestiona tu catálogo, ventas, compras y producción desde un solo lugar.
          </p>
          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <Layers size={16} />
              <span>Catálogo de ropa y accesorios</span>
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

      {/* PANEL DERECHO FORMULARIO */}
      <div className="auth-right-panel">
        <div className="auth-top-nav">
          <Link to="/cuenta/inicio-sesion" className="auth-back-link">
            <ArrowLeft size={14} />
            Volver al sistema
          </Link>
        </div>
        <div className="auth-card-wrapper">
          <div className="auth-card-register">
            <div className="auth-card-logo">
              <img src={logoSrc} alt="Raíz Urbana Logo" className="auth-card-logo-img" />
            </div>
            <div className="auth-card-subtitle">NUEVA CUENTA</div>
            <h2 className="auth-card-title">Crear cuenta</h2>
            <p className="auth-card-desc">Únete a la plataforma de Raíz Urbana</p>

            {error && (
              <div className="auth-error-alert" style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', marginBottom: '16px', borderRadius: '8px',
                background: 'var(--red-bg, #fde6e3)', color: 'var(--red-fg, #d8483a)',
                fontSize: '13px', fontWeight: '500', border: '1px solid var(--red-bd, #f5b8b1)'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* DATOS PERSONALES */}
              <div className="auth-section-divider">DATOS PERSONALES</div>
              <div className="auth-grid-2">
                <div className="auth-input-group">
                  <label htmlFor="nombres">NOMBRES *</label>
                  <div className="auth-input-wrapper">
                    <User size={14} className="auth-input-icon" />
                    <input
                      id="nombres"
                      type="text"
                      name="nombres"
                      placeholder="Tus nombres"
                      value={formData.nombres}
                      onChange={handleChange}
                      required
                      className="auth-input"
                    />
                  </div>
                </div>
                <div className="auth-input-group">
                  <label htmlFor="apellidos">APELLIDOS *</label>
                  <div className="auth-input-wrapper">
                    <User size={14} className="auth-input-icon" />
                    <input
                      id="apellidos"
                      type="text"
                      name="apellidos"
                      placeholder="Tus apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                      required
                      className="auth-input"
                    />
                  </div>
                </div>
              </div>

              {/* IDENTIFICACIÓN */}
              <div className="auth-section-divider">IDENTIFICACIÓN</div>
              <div className="auth-grid-2">
                <div className="auth-input-group">
                  <label htmlFor="id_TipoDoc">TIPO DOC. *</label>
                  <div className="auth-input-wrapper">
                    <FileText size={14} className="auth-input-icon" />
                    <select
                      id="id_TipoDoc"
                      name="id_TipoDoc"
                      value={formData.id_TipoDoc}
                      onChange={handleChange}
                      required
                      className="auth-select"
                    >
                      <option value="">Seleccionar</option>
                      <option value="CC">Cédula de Ciudadanía (CC)</option>
                      <option value="CE">Cédula de Extranjería (CE)</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="TI">Tarjeta de Identidad (TI)</option>
                    </select>
                  </div>
                </div>
                <div className="auth-input-group">
                  <label htmlFor="numeroDoc">NÚMERO DOC. *</label>
                  <div className="auth-input-wrapper">
                    <CreditCard size={14} className="auth-input-icon" />
                    <input
                      id="numeroDoc"
                      type="text"
                      name="numeroDoc"
                      placeholder="Ej: 1020304050"
                      value={formData.numeroDoc}
                      onChange={handleChange}
                      required
                      className="auth-input"
                    />
                  </div>
                </div>
              </div>

              {/* SEGURIDAD */}
              <div className="auth-section-divider">ACCESO Y SEGURIDAD</div>
              <div className="auth-input-group">
                <label htmlFor="email">CORREO ELECTRÓNICO *</label>
                <div className="auth-input-wrapper">
                  <Mail size={14} className="auth-input-icon" />
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
              <div className="auth-input-group">
                <label htmlFor="password">CONTRASEÑA *</label>
                <div className="auth-input-wrapper">
                  <Lock size={14} className="auth-input-icon" />
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
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* CONTACTO Y PERFIL */}
              <div className="auth-section-divider">CONTACTO Y PERFIL</div>
              <div className="auth-grid-2">
                <div className="auth-input-group">
                  <label htmlFor="telefono">TELÉFONO *</label>
                  <div className="auth-input-wrapper">
                    <Phone size={14} className="auth-input-icon" />
                    <input
                      id="telefono"
                      type="tel"
                      name="telefono"
                      placeholder="300 000 0000"
                      value={formData.telefono}
                      onChange={handleChange}
                      required
                      className="auth-input"
                    />
                  </div>
                </div>
                <div className="auth-input-group">
                  <label htmlFor="genero">GÉNERO *</label>
                  <select
                    id="genero"
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    required
                    className="auth-select auth-select-no-icon"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="auth-input-group">
                <label htmlFor="direccion">DIRECCIÓN *</label>
                <div className="auth-input-wrapper">
                  <MapPin size={14} className="auth-input-icon" />
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

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'REGISTRANDO CUENTA...' : 'REGISTRAR CUENTA'}
              </button>
            </form>

            <div className="auth-card-footer">
              ¿Ya tienes cuenta?{' '}
              <Link to="/cuenta/inicio-sesion" className="auth-link-bold">
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}