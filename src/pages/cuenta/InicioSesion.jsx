import { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Layers, Star, LayoutGrid } from 'lucide-react';
import './iniciosesion.css';

export default function InicioSesion() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Redirección directa al Perfil tras iniciar sesión
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
          <div className="auth-card">
            <div className="auth-card-logo">R\U</div>
            <div className="auth-card-subtitle">BIENVENIDO DE VUELTA</div>
            <h2 className="auth-card-title">Iniciar sesión</h2>
            <p className="auth-card-desc">Accede a tu cuenta de Raíz Urbana</p>

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

              <div className="auth-input-group">
                <label>CONTRASEÑA</label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-options">
                <label className="auth-checkbox-label">
                  <input type="checkbox" />
                  Recordarme
                </label>
                <Link to="/cuenta/recuperar-contrasena" className="auth-forgot-link">
                  Recuperar contraseña
                </Link>
              </div>

              <button type="submit" className="auth-submit-btn">
                INICIAR SESIÓN
              </button>
            </form>

            <div className="auth-card-footer">
              ¿No tienes cuenta?{' '}
              <Link to="/cuenta/registro" className="auth-link-bold">
                Regístrate
              </Link>
            </div>
          </div>
        </div>

        <div className="auth-bottom-copyright">
          Raíz Urbana © 2026 - Sistema Administrativo
        </div>
      </div>
    </div>
  );
}