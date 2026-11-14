import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    Lock,
    ShieldCheck,
} from 'lucide-react';

import useTheme from '../../../components/hooks/useTheme';
import './recuperarcontraseña.css';

const API_URL =
    'http://localhost:8000/api/auth/restablecer-contrasena';

export default function RestablecerContrasena() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);

    const { theme } = useTheme();

    const logoSrc =
        theme === 'dark'
            ? '/images/logoDark.png'
            : '/images/logo-ru.png';

    const passwordValida = password.length >= 8;
    const excedeLimiteBytes =
        new TextEncoder().encode(password).length > 72;

    const contrasenasCoinciden =
        password !== '' && password === confirmacion;

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        setError('');
        setMensaje('');

        if (!token) {
            setError(
                'El enlace no contiene un código de recuperación. Solicita uno nuevo.'
            );
            return;
        }

        if (!passwordValida) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (excedeLimiteBytes) {
            setError('La contraseña supera la longitud permitida.');
            return;
        }

        if (!contrasenasCoinciden) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const detalle =
                    typeof data?.detail === 'string'
                        ? data.detail
                        : 'No se pudo cambiar la contraseña. Solicita un enlace nuevo.';

                throw new Error(detalle);
            }

            setPassword('');
            setConfirmacion('');
            setMensaje(
                'Tu contraseña fue actualizada. Ya puedes iniciar sesión.'
            );
        } catch (err) {
            setError(
                err instanceof TypeError
                    ? 'No fue posible conectar con el servidor.'
                    : err.message || 'No se pudo cambiar la contraseña.'
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
                    aria-label="Restablecer contraseña"
                >
                    <aside className="ru-recovery__brand">
                        <div className="ru-recovery__brand-top">
                            <div className="ru-recovery__brand-logo">
                                <img src={logoSrc} alt="Raíz Urbana" />
                            </div>

                            <span className="ru-recovery__brand-label">
                                RAÍZ URBANA
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
                                Recupera el acceso a tu cuenta y continúa
                                disfrutando de Raíz Urbana.
                            </p>

                            <div className="ru-recovery__modules">
                                <span>Catálogo</span>
                                <span>Cuenta</span>
                                <span>Seguridad</span>
                            </div>
                        </div>

                        <footer className="ru-recovery__brand-footer">
                            <span>RAÍZ URBANA</span>
                            <span>© {new Date().getFullYear()}</span>
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

                                <h2>Crear nueva contraseña</h2>

                                <p>
                                    Escribe una contraseña nueva para tu cuenta.
                                </p>
                            </header>

                            {!token && (
                                <div
                                    className="ru-recovery__alert ru-recovery__alert--error"
                                    role="alert"
                                >
                                    <AlertCircle size={18} aria-hidden="true" />
                                    <span>
                                        Este enlace no contiene un código de recuperación.
                                        Solicita uno nuevo.
                                    </span>
                                </div>
                            )}

                            {error && (
                                <div
                                    className="ru-recovery__alert ru-recovery__alert--error"
                                    role="alert"
                                >
                                    <AlertCircle size={18} aria-hidden="true" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {mensaje && (
                                <div
                                    className="ru-recovery__alert ru-recovery__alert--success"
                                    role="status"
                                >
                                    <CheckCircle2 size={18} aria-hidden="true" />
                                    <span>{mensaje}</span>
                                </div>
                            )}

                            {!mensaje && (
                                <form
                                    onSubmit={handleSubmit}
                                    className="ru-recovery__form"
                                    aria-busy={loading}
                                >
                                    <div className="ru-recovery__field">
                                        <label htmlFor="ru-new-password">
                                            Nueva contraseña
                                        </label>

                                        <div className="ru-recovery__input-wrap">
                                            <Lock
                                                size={18}
                                                className="ru-recovery__input-icon"
                                                aria-hidden="true"
                                            />

                                            <input
                                                id="ru-new-password"
                                                type={mostrarPassword ? 'text' : 'password'}
                                                placeholder="Mínimo 8 caracteres"
                                                autoComplete="new-password"
                                                value={password}
                                                onChange={(event) => {
                                                    setPassword(event.target.value);
                                                    setError('');
                                                }}
                                                minLength={8}
                                                required
                                            />

                                            <button
                                                type="button"
                                                className="ru-recovery__password-toggle"
                                                onClick={() =>
                                                    setMostrarPassword((actual) => !actual)
                                                }
                                                aria-label={
                                                    mostrarPassword
                                                        ? 'Ocultar contraseña'
                                                        : 'Mostrar contraseña'
                                                }
                                                aria-pressed={mostrarPassword}
                                            >
                                                {mostrarPassword ? (
                                                    <EyeOff size={18} aria-hidden="true" />
                                                ) : (
                                                    <Eye size={18} aria-hidden="true" />
                                                )}
                                            </button>
                                        </div>

                                        {password && !passwordValida && (
                                            <small className="ru-recovery__field-error">
                                                Usa al menos 8 caracteres.
                                            </small>
                                        )}

                                        {password && excedeLimiteBytes && (
                                            <small className="ru-recovery__field-error">
                                                La contraseña supera la longitud permitida.
                                            </small>
                                        )}
                                    </div>

                                    <div className="ru-recovery__field">
                                        <label htmlFor="ru-confirm-password">
                                            Confirmar contraseña
                                        </label>

                                        <div className="ru-recovery__input-wrap">
                                            <Lock
                                                size={18}
                                                className="ru-recovery__input-icon"
                                                aria-hidden="true"
                                            />

                                            <input
                                                id="ru-confirm-password"
                                                type={
                                                    mostrarConfirmacion ? 'text' : 'password'
                                                }
                                                placeholder="Repite la contraseña"
                                                autoComplete="new-password"
                                                value={confirmacion}
                                                onChange={(event) => {
                                                    setConfirmacion(event.target.value);
                                                    setError('');
                                                }}
                                                required
                                            />

                                            <button
                                                type="button"
                                                className="ru-recovery__password-toggle"
                                                onClick={() =>
                                                    setMostrarConfirmacion((actual) => !actual)
                                                }
                                                aria-label={
                                                    mostrarConfirmacion
                                                        ? 'Ocultar confirmación'
                                                        : 'Mostrar confirmación'
                                                }
                                                aria-pressed={mostrarConfirmacion}
                                            >
                                                {mostrarConfirmacion ? (
                                                    <EyeOff size={18} aria-hidden="true" />
                                                ) : (
                                                    <Eye size={18} aria-hidden="true" />
                                                )}
                                            </button>
                                        </div>

                                        {confirmacion && !contrasenasCoinciden && (
                                            <small className="ru-recovery__field-error">
                                                Las contraseñas no coinciden.
                                            </small>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="ru-recovery__submit"
                                        disabled={loading || !token}
                                    >
                                        <span>
                                            {loading
                                                ? 'GUARDANDO...'
                                                : 'GUARDAR CONTRASEÑA'}
                                        </span>

                                        <ArrowRight size={18} aria-hidden="true" />
                                    </button>
                                </form>
                            )}

                            <Link
                                to={
                                    !token
                                        ? '/cuenta/recuperar-contrasena'
                                        : '/cuenta/inicio-sesion'
                                }
                                className="ru-recovery__login-link"
                            >
                                <ArrowLeft size={16} aria-hidden="true" />
                                {!token
                                    ? 'Solicitar un enlace nuevo'
                                    : 'Volver al inicio de sesión'}
                            </Link>

                            <div className="ru-recovery__access-note">
                                <ShieldCheck size={16} aria-hidden="true" />
                                <span>Raíz Urbana · Seguridad de tu cuenta</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}