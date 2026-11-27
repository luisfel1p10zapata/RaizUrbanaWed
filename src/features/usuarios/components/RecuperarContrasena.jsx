import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

import useTheme from '../../../components/hooks/useTheme';
import './recuperarcontraseña.css';

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const logoSrc =
    theme === 'dark'
      ? '/images/logoDark.png'
      : '/images/logo-ru.png';

  // Se conserva la lógica original de recuperación.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:8000/api/auth/recuperar-contrasena',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo: email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Ocurrió un error al procesar la solicitud.'
        );
      }

      setMessage(
        data.message ||
        'Se ha enviado un enlace de recuperación a tu correo electrónico.'
      );
    } catch (err) {
      setError(
        err.message || 'Error al conectar con el servidor de Python.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="ru-recovery"
      data-theme={theme === 'dark' ? 'dark' : 'light'}
    >
      <div className="ru-recovery__layout">
        <nav
          className="ru-recovery__navigation"
          aria-label="Volver al inicio"
        >
          <Link to="/" className="ru-recovery__back">
            <ArrowLeft size={17} aria-hidden="true" />
            Volver al inicio
          </Link>
        </nav>

        <section
          className="ru-recovery__shell"
          aria-label="Recuperación de contraseña"
        >
          <aside className="ru-recovery__brand">
            <div className="ru-recovery__brand-top">
              <div className="ru-recovery__brand-logo">
                <img src={logoSrc} alt="Raíz Urbana" />
              </div>

              <span className="ru-recovery__brand-label">
                SISTEMA ADMINISTRATIVO
              </span>
            </div>

            <div className="ru-recovery__hero">
              <span className="ru-recovery__eyebrow">
                TU MARCA, EN UN SOLO LUGAR
              </span>

              <h1 className="ru-recovery__hero-title">
                Moda que refleja
                <br />
                <em>tu esencia.</em>
              </h1>

              <p className="ru-recovery__hero-description">
                Gestiona tu catálogo, ventas, compras y producción
                desde un solo lugar.
              </p>

              <div className="ru-recovery__modules">
                <span>Catálogo</span>
                <span>Ventas</span>
                <span>Producción</span>
              </div>
            </div>

            <footer className="ru-recovery__brand-footer">
              <span>RAÍZ URBANA</span>
              <span>© 2026 · Uso interno</span>
            </footer>

            <div
              className="ru-recovery__decoration"
              aria-hidden="true"
            />
          </aside>

          <div className="ru-recovery__panel">
            <div className="ru-recovery__content">
              <div className="ru-recovery__form-logo">
                <img src={logoSrc} alt="Raíz Urbana" />
              </div>

              <header className="ru-recovery__heading">
                <span className="ru-recovery__subtitle">
                  RECUPERACIÓN DE ACCESO
                </span>

                <h2>Recuperar contraseña</h2>

                <p>
                  Te enviaremos un enlace para restablecer
                  tu contraseña.
                </p>
              </header>

              {error && (
                <div
                  className="ru-recovery__alert ru-recovery__alert--error"
                  role="alert"
                >
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div
                  className="ru-recovery__alert ru-recovery__alert--success"
                  role="status"
                >
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>{message}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="ru-recovery__form"
                aria-busy={loading}
              >
                <div className="ru-recovery__field">
                  <label htmlFor="ru-recovery-email">
                    Correo electrónico
                  </label>

                  <div className="ru-recovery__input-wrap">
                    <Mail
                      size={18}
                      className="ru-recovery__input-icon"
                      aria-hidden="true"
                    />

                    <input
                      id="ru-recovery-email"
                      name="email"
                      type="email"
                      placeholder="tu@correo.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="ru-recovery__submit"
                  disabled={loading}
                >
                  <span>
                    {loading
                      ? 'ENVIANDO...'
                      : 'ENVIAR ENLACE DE RECUPERACIÓN'}
                  </span>

                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </form>

              <Link
                to="/cuenta/inicio-sesion"
                className="ru-recovery__login-link"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Volver al inicio de sesión
              </Link>

              <div className="ru-recovery__access-note">
                <ShieldCheck size={16} aria-hidden="true" />
                <span>Raíz Urbana · Sistema Administrativo</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}