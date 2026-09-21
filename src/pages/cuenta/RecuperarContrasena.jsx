import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Layers, Star, LayoutGrid } from 'lucide-react';
import useTheme from '../../components/hook/useTheme';
import './recuperarcontraseña.css';

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('');
  const { theme } = useTheme();

  // Selección de logo dinámico según el tema
  const logoSrc = theme === 'dark' ? '/images/logoDark.png' : '/images/logo-ru.png';

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Se ha enviado un enlace de recuperación a tu correo electrónico.');
  };

  return (
    <div className="auth-container">
      {/* Panel Izquierdo Hero */}
      <div className="auth-left-panel">
        <div className="auth-brand-logo-container">
          <img src={logoSrc} alt="Raíz Urbana" className="auth-brand-logo-img" />
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
          <div className="auth-card">
            <Link to="/cuenta/iniciar-sesion" className="auth-card-header-link">
              <ArrowLeft size={14} />
              Volver al inicio de sesión
            </Link>

            <div className="auth-card-subtitle">RECUPERACIÓN DE ACCESO</div>
            <h2 className="auth-card-title">Recuperar contraseña</h2>
            <p className="auth-card-desc">
              Te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <label>CORREO ELECTRÓNICO</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                ENVIAR ENLACE DE RECUPERACIÓN
              </button>
            </form>
          </div>
        </div>

        <div className="auth-bottom-copyright">
          Raíz Urbana © 2026 - Sistema Administrativo
        </div>
      </div>
    </div>
  );
}