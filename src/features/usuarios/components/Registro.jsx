import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import useTheme from '../../../components/hooks/useTheme';
import './registro.css';

export default function Registro() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { theme } = useTheme();

  const logoSrc =
    theme === 'dark'
      ? '/images/logoDark.png'
      : '/images/logo-ru.png';

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    id_TipoDoc: '',
    numeroDoc: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    genero: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Se conserva la lógica original del registro.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:8000/api/auth/register',
        {
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
            genero: formData.genero,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          'El correo electrónico ya se encuentra registrado en el sistema.'
        );
      }

      setSuccessMsg(
        '¡Cuenta registrada correctamente! Redirigiendo al inicio de sesión...'
      );

      setTimeout(() => {
        navigate('/cuenta/inicio-sesion');
      }, 2500);
    } catch (err) {
      setError(
        err.message || 'Ocurrió un error al registrar la cuenta.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="ru-register"
      data-theme={theme === 'dark' ? 'dark' : 'light'}
    >
      <div className="ru-register__layout">
        <nav className="ru-register__navigation">
          <Link to="/" className="ru-register__back">
            <ArrowLeft size={17} aria-hidden="true" />
            Volver al inicio
          </Link>
        </nav>

        <section
          className="ru-register__shell"
          aria-label="Registro en Raíz Urbana"
        >
          <aside className="ru-register__brand">
            <div className="ru-register__brand-top">
              <div className="ru-register__brand-logo">
                <img src={logoSrc} alt="Raíz Urbana" />
              </div>

              <span className="ru-register__brand-label">
                SISTEMA ADMINISTRATIVO
              </span>
            </div>

            <div className="ru-register__hero">
              <span className="ru-register__eyebrow">
                TU MARCA, EN UN SOLO LUGAR
              </span>

              <h1 className="ru-register__hero-title">
                Moda que refleja
                <br />
                <em>tu esencia.</em>
              </h1>

              <p className="ru-register__hero-description">
                Gestiona tu catálogo, ventas, compras y producción
                desde un solo lugar.
              </p>

              <div className="ru-register__modules">
                <span>Catálogo</span>
                <span>Ventas</span>
                <span>Producción</span>
              </div>
            </div>

            <footer className="ru-register__brand-footer">
              <span>RAÍZ URBANA</span>
              <span>© 2026 · Uso interno</span>
            </footer>

            <div
              className="ru-register__decoration"
              aria-hidden="true"
            />
          </aside>

          <div className="ru-register__panel">
            <div className="ru-register__content">
              <header className="ru-register__heading">
                <div className="ru-register__form-logo">
                  <img src={logoSrc} alt="Raíz Urbana" />
                </div>

                <div className="ru-register__heading-text">
                  <span className="ru-register__subtitle">
                    NUEVA CUENTA
                  </span>

                  <h2>Crear cuenta</h2>

                  <p>Únete a la plataforma de Raíz Urbana.</p>
                </div>
              </header>

              {error && (
                <div
                  className="ru-register__alert ru-register__alert--error"
                  role="alert"
                >
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div
                  className="ru-register__alert ru-register__alert--success"
                  role="status"
                >
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="ru-register__form"
                aria-busy={loading}
              >
                <fieldset className="ru-register__section">
                  <legend>Datos personales</legend>

                  <div className="ru-register__grid">
                    <div className="ru-register__field">
                      <label htmlFor="nombres">Nombres *</label>

                      <div className="ru-register__input-wrap">
                        <User size={16} aria-hidden="true" />

                        <input
                          id="nombres"
                          type="text"
                          name="nombres"
                          placeholder="Tus nombres"
                          value={formData.nombres}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="ru-register__field">
                      <label htmlFor="apellidos">Apellidos *</label>

                      <div className="ru-register__input-wrap">
                        <User size={16} aria-hidden="true" />

                        <input
                          id="apellidos"
                          type="text"
                          name="apellidos"
                          placeholder="Tus apellidos"
                          value={formData.apellidos}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="ru-register__section">
                  <legend>Identificación</legend>

                  <div className="ru-register__grid">
                    <div className="ru-register__field">
                      <label htmlFor="id_TipoDoc">
                        Tipo de documento *
                      </label>

                      <div className="ru-register__input-wrap">
                        <FileText size={16} aria-hidden="true" />

                        <select
                          id="id_TipoDoc"
                          name="id_TipoDoc"
                          value={formData.id_TipoDoc}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Seleccionar</option>
                          <option value="CC">
                            Cédula de Ciudadanía (CC)
                          </option>
                          <option value="CE">
                            Cédula de Extranjería (CE)
                          </option>
                          <option value="Pasaporte">Pasaporte</option>
                          <option value="TI">
                            Tarjeta de Identidad (TI)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="ru-register__field">
                      <label htmlFor="numeroDoc">
                        Número de documento *
                      </label>

                      <div className="ru-register__input-wrap">
                        <CreditCard size={16} aria-hidden="true" />

                        <input
                          id="numeroDoc"
                          type="text"
                          name="numeroDoc"
                          placeholder="Ej: 1020304050"
                          value={formData.numeroDoc}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="ru-register__section">
                  <legend>Acceso y seguridad</legend>

                  <div className="ru-register__grid">
                    <div className="ru-register__field">
                      <label htmlFor="email">
                        Correo electrónico *
                      </label>

                      <div className="ru-register__input-wrap">
                        <Mail size={16} aria-hidden="true" />

                        <input
                          id="email"
                          type="email"
                          name="email"
                          placeholder="tu@correo.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="ru-register__field">
                      <label htmlFor="password">Contraseña *</label>

                      <div className="ru-register__input-wrap">
                        <Lock size={16} aria-hidden="true" />

                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Mínimo 6 caracteres"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={6}
                          className="ru-register__password"
                        />

                        <button
                          type="button"
                          className="ru-register__password-toggle"
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                          aria-label={
                            showPassword
                              ? 'Ocultar contraseña'
                              : 'Mostrar contraseña'
                          }
                          aria-pressed={showPassword}
                          aria-controls="password"
                        >
                          {showPassword ? (
                            <EyeOff size={16} aria-hidden="true" />
                          ) : (
                            <Eye size={16} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="ru-register__section">
                  <legend>Contacto y perfil</legend>

                  <div className="ru-register__grid">
                    <div className="ru-register__field">
                      <label htmlFor="telefono">Teléfono *</label>

                      <div className="ru-register__input-wrap">
                        <Phone size={16} aria-hidden="true" />

                        <input
                          id="telefono"
                          type="tel"
                          name="telefono"
                          placeholder="300 000 0000"
                          value={formData.telefono}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="ru-register__field">
                      <label htmlFor="genero">Género *</label>

                      <select
                        id="genero"
                        name="genero"
                        value={formData.genero}
                        onChange={handleChange}
                        required
                        className="ru-register__select-plain"
                      >
                        <option value="">Seleccionar</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div className="ru-register__field ru-register__field--full">
                      <label htmlFor="direccion">Dirección *</label>

                      <div className="ru-register__input-wrap">
                        <MapPin size={16} aria-hidden="true" />

                        <input
                          id="direccion"
                          type="text"
                          name="direccion"
                          placeholder="Calle, Barrio, Ciudad"
                          value={formData.direccion}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <button
                  type="submit"
                  className="ru-register__submit"
                  disabled={loading}
                >
                  <span>
                    {loading
                      ? 'REGISTRANDO CUENTA...'
                      : 'REGISTRAR CUENTA'}
                  </span>

                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </form>

              <p className="ru-register__footer">
                ¿Ya tienes cuenta?{' '}
                <Link to="/cuenta/inicio-sesion">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}