import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Eye,
    EyeOff,
    ShieldCheck,
} from 'lucide-react';

import {
    eliminarToken,
    obtenerToken,
} from '../services/authService';

const API_CAMBIAR_CONTRASENA =
    'http://localhost:8000/api/auth/perfil/cambiar-contrasena';

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

function obtenerRequisitos(password) {
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

function mensajeRespuesta(datos) {
    if (typeof datos?.detail === 'string') {
        return datos.detail;
    }

    if (Array.isArray(datos?.detail)) {
        return datos.detail
            .map((detalle) =>
                String(detalle.msg || 'Dato inválido')
                    .replace(/^Value error,\s*/i, '')
            )
            .join('. ');
    }

    return 'No fue posible cambiar la contraseña.';
}

export default function CambiarContrasena() {
    const navigate = useNavigate();
    const temporizadorRef = useRef(null);

    const [abierto, setAbierto] = useState(false);
    const [actual, setActual] = useState('');
    const [nueva, setNueva] = useState('');
    const [confirmacion, setConfirmacion] = useState('');

    const [mostrarActual, setMostrarActual] = useState(false);
    const [mostrarNueva, setMostrarNueva] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] =
        useState(false);

    const [tocados, setTocados] = useState({});
    const [intentoGuardar, setIntentoGuardar] =
        useState(false);

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    useEffect(() => {
        return () => {
            if (temporizadorRef.current) {
                window.clearTimeout(temporizadorRef.current);
            }
        };
    }, []);

    const requisitos = obtenerRequisitos(nueva);

    const errores = {
        actual: !actual
            ? 'Ingresa tu contraseña actual.'
            : new TextEncoder().encode(actual).length > 72
                ? 'La contraseña actual supera la longitud permitida.'
                : '',

        nueva: !nueva
            ? 'Ingresa una contraseña nueva.'
            : !requisitos.every((requisito) => requisito.cumplido)
                ? 'Cumple todos los requisitos de seguridad.'
                : '',

        confirmacion: !confirmacion
            ? 'Confirma la contraseña nueva.'
            : confirmacion !== nueva
                ? 'Las contraseñas no coinciden.'
                : '',
    };

    const mostrarError = (campo) =>
        tocados[campo] || intentoGuardar
            ? errores[campo]
            : '';

    const marcarTocado = (campo) => {
        setTocados((actuales) => ({
            ...actuales,
            [campo]: true,
        }));
    };

    const limpiarFormulario = () => {
        setActual('');
        setNueva('');
        setConfirmacion('');
        setTocados({});
        setIntentoGuardar(false);
        setMostrarActual(false);
        setMostrarNueva(false);
        setMostrarConfirmacion(false);
        setError('');
    };

    const cerrarFormulario = () => {
        if (guardando) return;

        limpiarFormulario();
        setAbierto(false);
    };

    const guardarContrasena = async (event) => {
        event.preventDefault();

        if (guardando || mensaje) return;

        setError('');
        setIntentoGuardar(true);

        if (Object.values(errores).some(Boolean)) {
            return;
        }

        const token = obtenerToken();

        if (!token) {
            navigate('/cuenta/inicio-sesion', {
                replace: true,
            });
            return;
        }

        setGuardando(true);

        try {
            const respuesta = await fetch(
                API_CAMBIAR_CONTRASENA,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        contrasenaActual: actual,
                        contrasenaNueva: nueva,
                    }),
                }
            );

            const datos = await respuesta
                .json()
                .catch(() => null);

            if (respuesta.status === 401) {
                eliminarToken();

                navigate('/cuenta/inicio-sesion', {
                    replace: true,
                });

                return;
            }

            if (!respuesta.ok) {
                throw new Error(mensajeRespuesta(datos));
            }

            // El backend ya cerró todas las sesiones.
            eliminarToken();

            setActual('');
            setNueva('');
            setConfirmacion('');

            setMensaje(
                'Contraseña actualizada. Inicia sesión nuevamente.'
            );

            temporizadorRef.current = window.setTimeout(() => {
                navigate('/cuenta/inicio-sesion', {
                    replace: true,
                });
            }, 2500);
        } catch (err) {
            setError(
                err instanceof TypeError
                    ? 'No fue posible conectar con el servidor.'
                    : err.message ||
                    'No fue posible cambiar la contraseña.'
            );
        } finally {
            setGuardando(false);
        }
    };

    return (
        <section
            className="profile-password"
            aria-labelledby="profile-password-title"
        >
            <div className="profile-password__heading">
                <ShieldCheck size={20} aria-hidden="true" />

                <div>
                    <h2 id="profile-password-title">
                        Seguridad de la cuenta
                    </h2>

                    <p>
                        Puedes actualizar tu contraseña cuando lo necesites.
                    </p>
                </div>
            </div>

            {mensaje && (
                <div
                    className="profile-password__success"
                    role="status"
                >
                    {mensaje}
                </div>
            )}

            {!abierto && !mensaje && (
                <button
                    type="button"
                    className="profile-password__button"
                    onClick={() => setAbierto(true)}
                >
                    Cambiar contraseña
                </button>
            )}

            {abierto && !mensaje && (
                <form
                    className="profile-password__form"
                    onSubmit={guardarContrasena}
                    noValidate
                >
                    {error && (
                        <div
                            className="profile-password__error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <div className="profile-password__field">
                        <label htmlFor="profile-password-actual">
                            Contraseña actual *
                        </label>

                        <div className="profile-password__input">
                            <input
                                id="profile-password-actual"
                                type={mostrarActual ? 'text' : 'password'}
                                value={actual}
                                onChange={(event) => {
                                    setActual(event.target.value);
                                    marcarTocado('actual');
                                    setError('');
                                }}
                                onBlur={() => marcarTocado('actual')}
                                autoComplete="current-password"
                                aria-invalid={Boolean(mostrarError('actual'))}
                                aria-describedby={
                                    mostrarError('actual')
                                        ? 'profile-password-actual-error'
                                        : undefined
                                }
                                disabled={guardando}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setMostrarActual((valor) => !valor)
                                }
                                aria-label={
                                    mostrarActual
                                        ? 'Ocultar contraseña actual'
                                        : 'Mostrar contraseña actual'
                                }
                                aria-pressed={mostrarActual}
                                disabled={guardando}
                            >
                                {mostrarActual ? (
                                    <EyeOff size={17} />
                                ) : (
                                    <Eye size={17} />
                                )}
                            </button>
                        </div>

                        {mostrarError('actual') && (
                            <small
                                id="profile-password-actual-error"
                                className="profile-password__field-error"
                            >
                                {mostrarError('actual')}
                            </small>
                        )}
                    </div>

                    <div className="profile-password__field">
                        <label htmlFor="profile-password-nueva">
                            Contraseña nueva *
                        </label>

                        <div className="profile-password__input">
                            <input
                                id="profile-password-nueva"
                                type={mostrarNueva ? 'text' : 'password'}
                                value={nueva}
                                onChange={(event) => {
                                    setNueva(event.target.value);
                                    marcarTocado('nueva');
                                    setError('');
                                }}
                                onBlur={() => marcarTocado('nueva')}
                                autoComplete="new-password"
                                aria-invalid={Boolean(mostrarError('nueva'))}
                                aria-describedby="profile-password-requisitos"
                                disabled={guardando}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setMostrarNueva((valor) => !valor)
                                }
                                aria-label={
                                    mostrarNueva
                                        ? 'Ocultar contraseña nueva'
                                        : 'Mostrar contraseña nueva'
                                }
                                aria-pressed={mostrarNueva}
                                disabled={guardando}
                            >
                                {mostrarNueva ? (
                                    <EyeOff size={17} />
                                ) : (
                                    <Eye size={17} />
                                )}
                            </button>
                        </div>

                        {mostrarError('nueva') && (
                            <small className="profile-password__field-error">
                                {mostrarError('nueva')}
                            </small>
                        )}
                    </div>

                    <div
                        id="profile-password-requisitos"
                        className="profile-password__requirements"
                    >
                        <strong>Requisitos de seguridad</strong>

                        <ul>
                            {requisitos.map((requisito) => (
                                <li
                                    key={requisito.id}
                                    className={
                                        requisito.cumplido
                                            ? 'is-complete'
                                            : 'is-pending'
                                    }
                                >
                                    <span aria-hidden="true">
                                        {requisito.cumplido ? '✓' : '○'}
                                    </span>

                                    <span>
                                        {requisito.texto}
                                        {' — '}
                                        {requisito.cumplido
                                            ? 'Cumplido'
                                            : 'Pendiente'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="profile-password__field">
                        <label htmlFor="profile-password-confirmacion">
                            Confirmar contraseña nueva *
                        </label>

                        <div className="profile-password__input">
                            <input
                                id="profile-password-confirmacion"
                                type={
                                    mostrarConfirmacion
                                        ? 'text'
                                        : 'password'
                                }
                                value={confirmacion}
                                onChange={(event) => {
                                    setConfirmacion(event.target.value);
                                    marcarTocado('confirmacion');
                                    setError('');
                                }}
                                onBlur={() => marcarTocado('confirmacion')}
                                autoComplete="new-password"
                                aria-invalid={Boolean(
                                    mostrarError('confirmacion')
                                )}
                                aria-describedby={
                                    mostrarError('confirmacion')
                                        ? 'profile-password-confirmacion-error'
                                        : undefined
                                }
                                disabled={guardando}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setMostrarConfirmacion((valor) => !valor)
                                }
                                aria-label={
                                    mostrarConfirmacion
                                        ? 'Ocultar confirmación'
                                        : 'Mostrar confirmación'
                                }
                                aria-pressed={mostrarConfirmacion}
                                disabled={guardando}
                            >
                                {mostrarConfirmacion ? (
                                    <EyeOff size={17} />
                                ) : (
                                    <Eye size={17} />
                                )}
                            </button>
                        </div>

                        {mostrarError('confirmacion') && (
                            <small
                                id="profile-password-confirmacion-error"
                                className="profile-password__field-error"
                            >
                                {mostrarError('confirmacion')}
                            </small>
                        )}
                    </div>

                    <p className="profile-password__note">
                        Al guardar, se cerrarán las sesiones abiertas
                        y deberás iniciar sesión nuevamente.
                    </p>

                    <div className="profile-password__actions">
                        <button
                            type="button"
                            className="profile-password__cancel"
                            onClick={cerrarFormulario}
                            disabled={guardando}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="profile-password__button"
                            disabled={guardando}
                        >
                            {guardando
                                ? 'Guardando...'
                                : 'Guardar contraseña'}
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}