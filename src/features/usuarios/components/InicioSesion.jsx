import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  LoaderCircle,
} from 'lucide-react';

import useTheme from '../../../components/hooks/useTheme';
import { iniciarSesion } from '../services/authService';

import './iniciosesion.css';

export default function InicioSesion() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { theme } = useTheme();

  const logoSrc =
    theme === 'dark'
      ? '/images/logoDark.png'
      : '/images/logo-ru.png';

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const usuario = await iniciarSesion(email, password);

      const esAdministrativo =
        usuario.rol === 'Administrador' ||
        usuario.rol === 'Empleado';

      const tieneDashboard =
        Array.isArray(usuario.permisos) &&
        usuario.permisos.includes('Dashboard');

      if (esAdministrativo && tieneDashboard) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/inicio', { replace: true });
      }
    } catch (err) {
      setError(
        err.message ||
        'No se pudo iniciar sesión. Inténtalo nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="ru-login"
      data-theme={theme === 'dark' ? 'dark' : 'light'}
    >
      <Link to="/" className="ru-login__back">
        <span aria-hidden="true">←</span>
        Volver al inicio
      </Link>

      <section
        className="ru-login__shell"
        aria-label="Acceso a Raíz Urbana"
      >
        <aside className="ru-login__brand">
          <div className="ru-login__brand-top">
            <div className="ru-login__brand-logo">
              <img src={logoSrc} alt="Raíz Urbana" />
            </div>

            <span className="ru-login__brand-label">
              RAÍZ URBANA
            </span>
          </div>

          <div className="ru-login__hero">
            <span className="ru-login__eyebrow">
              TU MARCA, EN UN SOLO LUGAR
            </span>

            <h1 className="ru-login__hero-title">
              Moda que refleja
              <br />
              <em>tu esencia.</em>
            </h1>

            <p className="ru-login__hero-description">
              Un espacio para descubrir nuestros productos
              y gestionar tu cuenta.
            </p>

            <div className="ru-login__modules">
              <span>Catálogo</span>
              <span>Cuenta</span>
              <span>Seguridad</span>
            </div>
          </div>

          <div className="ru-login__brand-footer">
            <span>RAÍZ URBANA</span>
            <span>© {new Date().getFullYear()}</span>
          </div>

          <div
            className="ru-login__decoration"
            aria-hidden="true"
          />
        </aside>

        <div className="ru-login__panel">
          <div className="ru-login__form-container">
            <div className="ru-login__form-logo">
              <img src={logoSrc} alt="Raíz Urbana" />
            </div>

            <header className="ru-login__heading">
              <span className="ru-login__welcome">
                BIENVENIDO DE VUELTA
              </span>

              <h2>Iniciar sesión</h2>

              <p>
                Ingresa tus datos para acceder a tu cuenta.
              </p>
            </header>

            {error && (
              <div
                id="ru-login-error"
                className="ru-login__error"
                role="alert"
              >
                <AlertCircle size={18} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form
              className="ru-login__form"
              onSubmit={handleSubmit}
              aria-busy={loading}
              aria-describedby={
                error ? 'ru-login-error' : undefined
              }
            >
              <div className="ru-login__field">
                <label htmlFor="ru-login-email">
                  Correo electrónico
                </label>

                <div className="ru-login__input-wrap">
                  <Mail
                    size={18}
                    className="ru-login__input-icon"
                    aria-hidden="true"
                  />

                  <input
                    id="ru-login-email"
                    name="email"
                    type="email"
                    placeholder="tu@correo.com"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError('');
                    }}
                    required
                  />
                </div>
              </div>

              <div className="ru-login__field">
                <div className="ru-login__label-row">
                  <label htmlFor="ru-login-password">
                    Contraseña
                  </label>
                </div>

                <div className="ru-login__input-wrap">
                  <Lock
                    size={18}
                    className="ru-login__input-icon"
                    aria-hidden="true"
                  />

                  <input
                    id="ru-login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError('');
                    }}
                    className="ru-login__password-input"
                    required
                  />

                  <button
                    type="button"
                    className="ru-login__toggle"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                    aria-pressed={showPassword}
                    aria-controls="ru-login-password"
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="ru-login__options">
                <Link to="/cuenta/recuperar-contrasena">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                className="ru-login__submit"
                disabled={loading}
              >
                <span>
                  {loading
                    ? 'Iniciando sesión...'
                    : 'Iniciar sesión'}
                </span>

                {loading ? (
                  <LoaderCircle
                    size={19}
                    className="ru-login__spinner"
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowRight size={19} aria-hidden="true" />
                )}
              </button>
            </form>

            <p className="ru-login__register">
              ¿Aún no tienes una cuenta?{' '}
              <Link to="/cuenta/registro">
                Regístrate
              </Link>
            </p>

            <div className="ru-login__access-note">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Acceso a tu cuenta de Raíz Urbana</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}