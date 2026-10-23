import { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Layers, Star, LayoutGrid, AlertCircle } from 'lucide-react';
import useTheme from '../../../components/hooks/useTheme';
import './iniciosesion.css';

export default function InicioSesion() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { theme } = useTheme();

  const logoSrc = theme === 'dark' ? '/images/logoDark.png' : '/images/logo-ru.png';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ---------------------------------------------------------------------------
      // PUNTO DE CONEXIÓN CON EL BACKEND EN PYTHON (FastAPI / Flask)
      // Cuando subas tu backend, descomenta este bloque y apunta a tu ruta real:
      // ---------------------------------------------------------------------------
      /*
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, contraseña: password })
      });
      
      if (!response.ok) {
        throw new Error('Credenciales incorrectas. Verifique su correo y contraseña.');
      }
      
      const data = await response.json();
      localStorage.setItem('raiz_urbana_token', data.token);
      localStorage.setItem('raiz_urbana_user', JSON.stringify(data.usuario));
      */

      // Simulación validación local mientras conectamos el backend completo:
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simula red

      if (email === "error@prueba.com") {
        throw new Error("El usuario o la contraseña son incorrectos.");
      }

      // Datos simulados del usuario logueado
      const mockUser = {
        id_Usuario: 1,
        nombres: "Sebastián",
        apellidos: "Contreras",
        correo: email,
        tipoDoc: "CC",
        numeroDoc: "1020304050",
        telefono: "300 123 4567",
        direccion: "Medellín, Colombia",
        genero: "Masculino",
        rol: "Administrador",
        token: "mock-jwt-token-raiz-urbana-2026"
      };

      // Guardar sesión de forma segura localmente (Sprint I - Frontend)
      localStorage.setItem('raiz_urbana_token', mockUser.token);
      localStorage.setItem('raiz_urbana_user', JSON.stringify(mockUser));

      // Redirección al Dashboard con todos los módulos
      navigate('/dashboard');

    } catch (err) {
      setError(err.message || "Ocurrió un error al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Panel Izquierdo Hero */}
      <div className="auth-left-panel">
        <div className="auth-brand-logo">
          <img src={logoSrc} alt="Raíz Urbana" />
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
          <Link to="/inicio" className="auth-back-link">
            <ArrowLeft size={14} />
            Volver al inicio
          </Link>
        </div>

        <div className="auth-card-wrapper">
          <div className="auth-card">
            <div className="auth-card-logo">
              <img src={logoSrc} alt="Raíz Urbana" />
            </div>
            <div className="auth-card-subtitle">BIENVENIDO DE VUELTA</div>
            <h2 className="auth-card-title">Iniciar sesión</h2>
            <p className="auth-card-desc">Accede a tu cuenta de Raíz Urbana</p>

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
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'VALIDANDO...' : 'INICIAR SESIÓN'}
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