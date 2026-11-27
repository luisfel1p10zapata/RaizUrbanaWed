import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';

import useTheme from '../../../components/hooks/useTheme';

import {
  getDocumentoConfig,
  formatearEntradaDocumento,
  validarNumeroDocumento,
} from '../utils/documentoValidation';

import './registro.css';

const API_REGISTRO =
  'http://localhost:8000/api/auth/register';

const FORMULARIO_INICIAL = {
  nombres: '',
  apellidos: '',
  id_TipoDoc: '',
  numeroDoc: '',
  email: '',
  password: '',
  confirmarPassword: '',
  telefono: '',
  direccion: '',
  genero: '',
};

function tieneCaracterEspecial(valor) {
  return [...valor].some((caracter) => {
    const codigo = caracter.charCodeAt(0);

    return (
      (codigo >= 33 && codigo <= 47) ||
      (codigo >= 58 && codigo <= 64) ||
      (codigo >= 91 && codigo <= 96) ||
      (codigo >= 123 && codigo <= 126)
    );
  });
}

function obtenerRequisitosPassword(password) {
  return [
    {
      id: 'longitud',
      texto: 'Mínimo 8 caracteres',
      cumplido: [...password].length >= 8,
    },
    {
      id: 'mayuscula',
      texto: 'Una letra mayúscula',
      cumplido: /[A-Z]/.test(password),
    },
    {
      id: 'minuscula',
      texto: 'Una letra minúscula',
      cumplido: /[a-z]/.test(password),
    },
    {
      id: 'numero',
      texto: 'Un número',
      cumplido: /[0-9]/.test(password),
    },
    {
      id: 'especial',
      texto: 'Un carácter especial',
      cumplido: tieneCaracterEspecial(password),
    },
    {
      id: 'bytes',
      texto: 'Máximo 72 bytes',
      cumplido:
        new TextEncoder().encode(password).length <= 72,
    },
  ];
}

function validarFormulario(datos, terminosAceptados) {
  const errores = {};

  if (!datos.nombres.trim()) {
    errores.nombres = 'Los nombres son obligatorios.';
  }

  if (!datos.apellidos.trim()) {
    errores.apellidos = 'Los apellidos son obligatorios.';
  }

  if (!datos.id_TipoDoc) {
    errores.id_TipoDoc =
      'Selecciona un tipo de documento.';
  }

  if (!datos.numeroDoc.trim()) {
    errores.numeroDoc =
      'El número de documento es obligatorio.';
  } else if (!datos.id_TipoDoc) {
    errores.numeroDoc =
      'Selecciona primero un tipo de documento.';
  } else {
    const errorDocumento = validarNumeroDocumento(
      datos.id_TipoDoc,
      datos.numeroDoc
    );

    if (errorDocumento) {
      errores.numeroDoc = errorDocumento;
    }
  }

  const correo = datos.email.trim();

  if (!correo) {
    errores.email =
      'El correo electrónico es obligatorio.';
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
  ) {
    errores.email =
      'Ingresa un correo electrónico válido.';
  }

  const requisitos = obtenerRequisitosPassword(
    datos.password
  );

  if (!datos.password) {
    errores.password = 'La contraseña es obligatoria.';
  } else if (
    !requisitos.every((requisito) => requisito.cumplido)
  ) {
    errores.password =
      'La contraseña debe cumplir todos los requisitos.';
  }

  if (!datos.confirmarPassword) {
    errores.confirmarPassword =
      'Debes confirmar la contraseña.';
  } else if (
    datos.confirmarPassword !== datos.password
  ) {
    errores.confirmarPassword =
      'Las contraseñas no coinciden.';
  }

  if (!datos.telefono.trim()) {
    errores.telefono = 'El teléfono es obligatorio.';
  }

  if (!datos.genero) {
    errores.genero = 'Selecciona un género.';
  }

  if (!datos.direccion.trim()) {
    errores.direccion = 'La dirección es obligatoria.';
  }

  if (!terminosAceptados) {
    errores.terminos =
      'Debes aceptar los términos y condiciones.';
  }

  return errores;
}

function obtenerMensajeError(data) {
  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((detalle) => {
        const mensaje = detalle.msg || 'Dato inválido';

        return mensaje.replace(
          /^Value error,\s*/i,
          ''
        );
      })
      .join('. ');
  }

  return 'No fue posible completar el registro.';
}

function MensajeCampo({ id, mensaje }) {
  if (!mensaje) return null;

  return (
    <small
      id={id}
      className="ru-register__security-error"
      role="alert"
    >
      {mensaje}
    </small>
  );
}

export default function Registro() {
  const [formData, setFormData] = useState(
    FORMULARIO_INICIAL
  );

  const [camposRevisados, setCamposRevisados] =
    useState({});

  const [intentoRegistro, setIntentoRegistro] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [terminosAceptados, setTerminosAceptados] =
    useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { theme } = useTheme();

  const logoSrc =
    theme === 'dark'
      ? '/images/logoDark.png'
      : '/images/logo-ru.png';

  const docConfig = getDocumentoConfig(
    formData.id_TipoDoc
  );

  const requisitosPassword =
    obtenerRequisitosPassword(formData.password);

  const errores = validarFormulario(
    formData,
    terminosAceptados
  );

  const mostrarError = (campo) =>
    camposRevisados[campo] || intentoRegistro
      ? errores[campo] || ''
      : '';

  const marcarCampo = (campo) => {
    if (!campo) return;

    setCamposRevisados((actual) => ({
      ...actual,
      [campo]: true,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setError('');
    marcarCampo(name);

    if (name === 'id_TipoDoc') {
      const numeroFormateado =
        formatearEntradaDocumento(
          value,
          formData.numeroDoc
        );

      setFormData((actual) => ({
        ...actual,
        id_TipoDoc: value,
        numeroDoc: numeroFormateado,
      }));

      if (formData.numeroDoc) {
        marcarCampo('numeroDoc');
      }

      return;
    }

    if (name === 'numeroDoc') {
      const numeroFormateado =
        formatearEntradaDocumento(
          formData.id_TipoDoc,
          value
        );

      setFormData((actual) => ({
        ...actual,
        numeroDoc: numeroFormateado,
      }));

      return;
    }

    setFormData((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const handleBlur = (event) => {
    marcarCampo(event.target.name);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || successMsg) return;

    setError('');
    setSuccessMsg('');
    setIntentoRegistro(true);

    if (Object.keys(errores).length > 0) {
      setError(
        'Revisa los campos indicados antes de continuar.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_REGISTRO, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          terminosAceptados,
          nombres: formData.nombres.trim(),
          apellidos: formData.apellidos.trim(),
          id_TipoDoc: formData.id_TipoDoc,
          numeroDoc: formData.numeroDoc.trim(),
          email: formData.email.trim(),
          password: formData.password,
          telefono: formData.telefono.trim(),
          direccion: formData.direccion.trim(),
          genero: formData.genero,
        }),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(obtenerMensajeError(data));
      }

      setSuccessMsg(
        '¡Cuenta registrada correctamente! Redirigiendo al inicio de sesión...'
      );

      window.setTimeout(() => {
        navigate('/cuenta/inicio-sesion', {
          replace: true,
        });
      }, 2500);
    } catch (err) {
      setError(
        err.message ||
        'Ocurrió un error al registrar la cuenta.'
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
                <img
                  src={logoSrc}
                  alt="Raíz Urbana"
                />
              </div>

              <span className="ru-register__brand-label">
                RAÍZ URBANA
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
                Crea tu cuenta para conocer nuestros
                productos y gestionar tu información.
              </p>

              <div className="ru-register__modules">
                <span>Catálogo</span>
                <span>Cuenta</span>
                <span>Seguridad</span>
              </div>
            </div>

            <footer className="ru-register__brand-footer">
              <span>RAÍZ URBANA</span>
              <span>© {new Date().getFullYear()}</span>
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
                  <img
                    src={logoSrc}
                    alt="Raíz Urbana"
                  />
                </div>

                <div className="ru-register__heading-text">
                  <span className="ru-register__subtitle">
                    CREA TU CUENTA
                  </span>

                  <h2>Registro</h2>

                  <p>
                    Completa tus datos para crear tu
                    cuenta en Raíz Urbana.
                  </p>
                </div>
              </header>

              {error && (
                <div
                  className="ru-register__alert ru-register__alert--error"
                  role="alert"
                >
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                  />

                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div
                  className="ru-register__alert ru-register__alert--success"
                  role="status"
                >
                  <CheckCircle2
                    size={18}
                    aria-hidden="true"
                  />

                  <span>{successMsg}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                onBlurCapture={handleBlur}
                className="ru-register__form"
                aria-busy={loading}
                noValidate
              >
                <fieldset className="ru-register__section">
                  <legend>Datos personales</legend>

                  <div className="ru-register__grid">
                    <div className="ru-register__field">
                      <label htmlFor="nombres">
                        Nombres *
                      </label>

                      <div className="ru-register__input-wrap">
                        <User size={16} aria-hidden="true" />

                        <input
                          id="nombres"
                          type="text"
                          name="nombres"
                          placeholder="Tus nombres"
                          value={formData.nombres}
                          onChange={handleChange}
                          maxLength={80}
                          autoComplete="given-name"
                          aria-invalid={Boolean(
                            mostrarError('nombres')
                          )}
                          aria-describedby={
                            mostrarError('nombres')
                              ? 'nombres-error'
                              : undefined
                          }
                          required
                        />
                      </div>

                      <MensajeCampo
                        id="nombres-error"
                        mensaje={mostrarError('nombres')}
                      />
                    </div>

                    <div className="ru-register__field">
                      <label htmlFor="apellidos">
                        Apellidos *
                      </label>

                      <div className="ru-register__input-wrap">
                        <User size={16} aria-hidden="true" />

                        <input
                          id="apellidos"
                          type="text"
                          name="apellidos"
                          placeholder="Tus apellidos"
                          value={formData.apellidos}
                          onChange={handleChange}
                          maxLength={80}
                          autoComplete="family-name"
                          aria-invalid={Boolean(
                            mostrarError('apellidos')
                          )}
                          aria-describedby={
                            mostrarError('apellidos')
                              ? 'apellidos-error'
                              : undefined
                          }
                          required
                        />
                      </div>

                      <MensajeCampo
                        id="apellidos-error"
                        mensaje={mostrarError('apellidos')}
                      />
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
                        <FileText
                          size={16}
                          aria-hidden="true"
                        />

                        <select
                          id="id_TipoDoc"
                          name="id_TipoDoc"
                          value={formData.id_TipoDoc}
                          onChange={handleChange}
                          aria-invalid={Boolean(
                            mostrarError('id_TipoDoc')
                          )}
                          aria-describedby={
                            mostrarError('id_TipoDoc')
                              ? 'tipo-doc-error'
                              : undefined
                          }
                          required
                        >
                          <option value="">
                            Seleccionar
                          </option>

                          <option value="CC">
                            Cédula de Ciudadanía (CC)
                          </option>

                          <option value="CE">
                            Cédula de Extranjería (CE)
                          </option>

                          <option value="Pasaporte">
                            Pasaporte
                          </option>

                          <option value="TI">
                            Tarjeta de Identidad (TI)
                          </option>
                        </select>
                      </div>

                      <MensajeCampo
                        id="tipo-doc-error"
                        mensaje={mostrarError('id_TipoDoc')}
                      />
                    </div>

                    <div className="ru-register__field">
                      <label htmlFor="numeroDoc">
                        Número de documento *
                      </label>

                      <div className="ru-register__input-wrap">
                        <CreditCard
                          size={16}
                          aria-hidden="true"
                        />

                        <input
                          id="numeroDoc"
                          type="text"
                          name="numeroDoc"
                          placeholder={docConfig.placeholder}
                          maxLength={docConfig.maxLength}
                          inputMode={docConfig.inputMode}
                          value={formData.numeroDoc}
                          onChange={handleChange}
                          aria-invalid={Boolean(
                            mostrarError('numeroDoc')
                          )}
                          aria-describedby={
                            mostrarError('numeroDoc')
                              ? 'numero-doc-error'
                              : formData.id_TipoDoc
                                ? 'numero-doc-ayuda'
                                : undefined
                          }
                          required
                        />
                      </div>

                      {mostrarError('numeroDoc') ? (
                        <MensajeCampo
                          id="numero-doc-error"
                          mensaje={mostrarError('numeroDoc')}
                        />
                      ) : (
                        formData.id_TipoDoc && (
                          <small
                            id="numero-doc-ayuda"
                            style={{
                              display: 'block',
                              marginTop: 4,
                              fontSize: 11,
                              opacity: 0.72,
                            }}
                          >
                            {docConfig.hint}
                          </small>
                        )
                      )}
                    </div>
                  </div>
                </fieldset>

                <fieldset className="ru-register__section">
                  <legend>Acceso y seguridad</legend>

                  <div className="ru-register__grid">
                    <div className="ru-register__field ru-register__field--full">
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
                          autoComplete="email"
                          aria-invalid={Boolean(
                            mostrarError('email')
                          )}
                          aria-describedby={
                            mostrarError('email')
                              ? 'email-error'
                              : undefined
                          }
                          required
                        />
                      </div>

                      <MensajeCampo
                        id="email-error"
                        mensaje={mostrarError('email')}
                      />
                    </div>

                    <div className="ru-register__field">
                      <label htmlFor="password">
                        Contraseña *
                      </label>

                      <div className="ru-register__input-wrap">
                        <Lock size={16} aria-hidden="true" />

                        <input
                          id="password"
                          type={
                            showPassword
                              ? 'text'
                              : 'password'
                          }
                          name="password"
                          placeholder="Crea tu contraseña"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="new-password"
                          aria-invalid={Boolean(
                            mostrarError('password')
                          )}
                          aria-describedby="password-requisitos"
                          required
                          className="ru-register__password"
                        />

                        <button
                          type="button"
                          className="ru-register__password-toggle"
                          onClick={() =>
                            setShowPassword(
                              (actual) => !actual
                            )
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
                            <EyeOff
                              size={16}
                              aria-hidden="true"
                            />
                          ) : (
                            <Eye
                              size={16}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </div>

                      <MensajeCampo
                        id="password-error"
                        mensaje={mostrarError('password')}
                      />
                    </div>

                    <div className="ru-register__field">
                      <label htmlFor="confirmarPassword">
                        Confirmar contraseña *
                      </label>

                      <div className="ru-register__input-wrap">
                        <Lock size={16} aria-hidden="true" />

                        <input
                          id="confirmarPassword"
                          type={
                            showConfirmPassword
                              ? 'text'
                              : 'password'
                          }
                          name="confirmarPassword"
                          placeholder="Repite tu contraseña"
                          value={formData.confirmarPassword}
                          onChange={handleChange}
                          autoComplete="new-password"
                          aria-invalid={Boolean(
                            mostrarError('confirmarPassword')
                          )}
                          aria-describedby={
                            mostrarError('confirmarPassword')
                              ? 'confirmacion-error'
                              : undefined
                          }
                          required
                          className="ru-register__password"
                        />

                        <button
                          type="button"
                          className="ru-register__password-toggle"
                          onClick={() =>
                            setShowConfirmPassword(
                              (actual) => !actual
                            )
                          }
                          aria-label={
                            showConfirmPassword
                              ? 'Ocultar confirmación'
                              : 'Mostrar confirmación'
                          }
                          aria-pressed={showConfirmPassword}
                          aria-controls="confirmarPassword"
                        >
                          {showConfirmPassword ? (
                            <EyeOff
                              size={16}
                              aria-hidden="true"
                            />
                          ) : (
                            <Eye
                              size={16}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </div>

                      <MensajeCampo
                        id="confirmacion-error"
                        mensaje={mostrarError(
                          'confirmarPassword'
                        )}
                      />
                    </div>

                    <div
                      id="password-requisitos"
                      className="ru-register__field ru-register__field--full"
                    >
                      <strong>
                        Requisitos de la contraseña
                      </strong>

                      <ul className="ru-register__requirements">
                        {requisitosPassword.map(
                          (requisito) => (
                            <li
                              key={requisito.id}
                              className={
                                requisito.cumplido
                                  ? 'is-complete'
                                  : 'is-pending'
                              }
                            >
                              <span aria-hidden="true">
                                {requisito.cumplido
                                  ? '✓'
                                  : '○'}
                              </span>

                              <span>
                                {requisito.texto}
                                {' — '}
                                {requisito.cumplido
                                  ? 'Cumplido'
                                  : 'Pendiente'}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="ru-register__section">
                  <legend>Contacto y perfil</legend>

                  <div className="ru-register__grid">
                    <div className="ru-register__field">
                      <label htmlFor="telefono">
                        Teléfono *
                      </label>

                      <div className="ru-register__input-wrap">
                        <Phone
                          size={16}
                          aria-hidden="true"
                        />

                        <input
                          id="telefono"
                          type="tel"
                          name="telefono"
                          placeholder="300 000 0000"
                          value={formData.telefono}
                          onChange={handleChange}
                          maxLength={20}
                          autoComplete="tel"
                          aria-invalid={Boolean(
                            mostrarError('telefono')
                          )}
                          aria-describedby={
                            mostrarError('telefono')
                              ? 'telefono-error'
                              : undefined
                          }
                          required
                        />
                      </div>

                      <MensajeCampo
                        id="telefono-error"
                        mensaje={mostrarError('telefono')}
                      />
                    </div>

                    <div className="ru-register__field">
                      <label htmlFor="genero">
                        Género *
                      </label>

                      <select
                        id="genero"
                        name="genero"
                        value={formData.genero}
                        onChange={handleChange}
                        required
                        className="ru-register__select-plain"
                        aria-invalid={Boolean(
                          mostrarError('genero')
                        )}
                        aria-describedby={
                          mostrarError('genero')
                            ? 'genero-error'
                            : undefined
                        }
                      >
                        <option value="">
                          Seleccionar
                        </option>

                        <option value="Masculino">
                          Masculino
                        </option>

                        <option value="Femenino">
                          Femenino
                        </option>

                        <option value="Otro">
                          Otro
                        </option>
                      </select>

                      <MensajeCampo
                        id="genero-error"
                        mensaje={mostrarError('genero')}
                      />
                    </div>

                    <div className="ru-register__field ru-register__field--full">
                      <label htmlFor="direccion">
                        Dirección *
                      </label>

                      <div className="ru-register__input-wrap">
                        <MapPin
                          size={16}
                          aria-hidden="true"
                        />

                        <input
                          id="direccion"
                          type="text"
                          name="direccion"
                          placeholder="Calle, barrio, ciudad"
                          value={formData.direccion}
                          onChange={handleChange}
                          maxLength={200}
                          autoComplete="street-address"
                          aria-invalid={Boolean(
                            mostrarError('direccion')
                          )}
                          aria-describedby={
                            mostrarError('direccion')
                              ? 'direccion-error'
                              : undefined
                          }
                          required
                        />
                      </div>

                      <MensajeCampo
                        id="direccion-error"
                        mensaje={mostrarError('direccion')}
                      />
                    </div>
                  </div>
                </fieldset>

                <div className="ru-register__terms">
                  <label htmlFor="terminos">
                    <input
                      id="terminos"
                      name="terminos"
                      type="checkbox"
                      checked={terminosAceptados}
                      onChange={(event) => {
                        setTerminosAceptados(
                          event.target.checked
                        );

                        marcarCampo('terminos');
                        setError('');
                      }}
                      aria-invalid={Boolean(
                        mostrarError('terminos')
                      )}
                      aria-describedby={
                        mostrarError('terminos')
                          ? 'terminos-error'
                          : undefined
                      }
                      required
                    />

                    <span>
                      He leído y acepto los{' '}
                      <Link
                        to="/terminos-y-condiciones"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        términos y condiciones
                      </Link>
                      .
                    </span>
                  </label>

                  <MensajeCampo
                    id="terminos-error"
                    mensaje={mostrarError('terminos')}
                  />
                </div>

                <button
                  type="submit"
                  className="ru-register__submit"
                  disabled={
                    loading || Boolean(successMsg)
                  }
                >
                  <span>
                    {loading
                      ? 'REGISTRANDO CUENTA...'
                      : 'REGISTRAR CUENTA'}
                  </span>

                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                  />
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