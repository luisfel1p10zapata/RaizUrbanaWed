import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Layers, Star, LayoutGrid, AlertCircle, CheckCircle2 } from 'lucide-react';
import useTheme from '../../../components/hooks/useTheme';
import './recuperarcontraseña.css';

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  // Selección de logo dinámico según el tema[cite: 10]
  const logoSrc = theme === 'dark' ? '/images/logoDark.png' : '/images/logo-ru.png';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Conexión real con el endpoint en Python (FastAPI)
      const response = await fetch('http://localhost:8000/api/auth/recuperar-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Ocurrió un error al procesar la solicitud.');
      }

      // Mensaje de éxito que devuelve el backend
      setMessage(data.message || 'Se ha enviado un enlace de recuperación a tu correo electrónico.');

    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor de Python.');
    } finally {
      setLoading(false);
    }
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
            <Link to="/cuenta/inicio-sesion" className="auth-card-header-link">
              <ArrowLeft size={14} />
              Volver al inicio de sesión
            </Link>
            <div className="auth-card-subtitle">RECUPERACIÓN DE ACCESO</div>
            <h2 className="auth-card-title">Recuperar contraseña</h2>
            <p className="auth-card-desc">
              Te enviaremos un enlace para restablecer tu contraseña.
            </p>

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

            {message && (
              <div className="auth-success-alert" style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', marginBottom: '16px', borderRadius: '8px',
                background: '#e6f4ea', color: '#137333',
                fontSize: '13px', fontWeight: '500', border: '1px solid #ceead6'
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{message}</span>
              </div>
            )}

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
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE DE RECUPERACIÓN'}
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