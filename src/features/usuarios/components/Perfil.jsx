import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  Edit,
  Info,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
  X,
} from 'lucide-react';

import {
  cerrarSesion,
  obtenerToken,
} from '../services/authService';

import './perfil.css';

const API_PERFIL = 'http://localhost:8000/api/auth/perfil';

async function solicitarPerfil(opciones = {}) {
  const token = obtenerToken();

  if (!token) {
    const error = new Error('Debes iniciar sesión.');
    error.status = 401;
    throw error;
  }

  let respuesta;

  try {
    respuesta = await fetch(API_PERFIL, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...opciones.headers,
      },
    });
  } catch {
    throw new Error(
      'No fue posible conectar con el servidor.'
    );
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const mensaje =
      typeof datos?.detail === 'string'
        ? datos.detail
        : 'No fue posible completar la solicitud.';

    const error = new Error(mensaje);
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

function obtenerIniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

function validarFormulario(formulario) {
  const errores = {};

  const campos = [
    ['nombres', 'Los nombres son obligatorios.'],
    ['apellidos', 'Los apellidos son obligatorios.'],
    ['telefono', 'El teléfono es obligatorio.'],
    ['direccion', 'La dirección es obligatoria.'],
  ];

  campos.forEach(([campo, mensaje]) => {
    if (!formulario[campo].trim()) {
      errores[campo] = mensaje;
    }
  });

  if (!formulario.genero) {
    errores.genero = 'Selecciona un género.';
  }

  return errores;
}

export default function Perfil() {
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [formulario, setFormulario] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    direccion: '',
    genero: '',
  });

  const [editando, setEditando] = useState(false);
  const [tocados, setTocados] = useState({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;

    solicitarPerfil()
      .then((datos) => {
        if (!activo) return;

        setPerfil(datos);
      })
      .catch((err) => {
        if (!activo) return;

        if (err.status === 401) {
          navigate('/cuenta/inicio-sesion', {
            replace: true,
          });
          return;
        }

        setError(
          err.message || 'No fue posible cargar tu perfil.'
        );
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [navigate]);

  const errores = validarFormulario(formulario);

  const mostrarError = (campo) =>
    tocados[campo] || intentoGuardar
      ? errores[campo]
      : '';

  const cambiarCampo = (event) => {
    const { name, value } = event.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));

    setTocados((actual) => ({
      ...actual,
      [name]: true,
    }));

    setError('');
    setMensaje('');
  };

  const comenzarEdicion = () => {
    if (!perfil) return;

    setFormulario({
      nombres: perfil.nombres || '',
      apellidos: perfil.apellidos || '',
      telefono: perfil.telefono || '',
      direccion: perfil.direccion || '',
      genero: perfil.genero || '',
    });

    setTocados({});
    setIntentoGuardar(false);
    setError('');
    setMensaje('');
    setEditando(true);
  };

  const cancelarEdicion = () => {
    if (guardando) return;

    setEditando(false);
    setError('');
    setTocados({});
    setIntentoGuardar(false);
  };

  const guardarCambios = async (event) => {
    event.preventDefault();
    setIntentoGuardar(true);
    setError('');
    setMensaje('');

    if (Object.keys(errores).length > 0) {
      return;
    }

    setGuardando(true);

    try {
      const datos = await solicitarPerfil({
        method: 'PUT',
        body: JSON.stringify({
          nombres: formulario.nombres.trim(),
          apellidos: formulario.apellidos.trim(),
          telefono: formulario.telefono.trim(),
          direccion: formulario.direccion.trim(),
          genero: formulario.genero,
        }),
      });

      setPerfil(datos);
      setEditando(false);
      setMensaje('Tus datos se actualizaron correctamente.');
    } catch (err) {
      if (err.status === 401) {
        navigate('/cuenta/inicio-sesion', {
          replace: true,
        });
        return;
      }

      setError(
        err.message || 'No fue posible actualizar tu perfil.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleLogout = async () => {
    if (cerrando) return;

    setCerrando(true);
    setError('');

    try {
      await cerrarSesion();

      navigate('/cuenta/inicio-sesion', {
        replace: true,
      });
    } catch {
      setError(
        'Se cerró la sesión en este navegador, pero no se pudo confirmar el cierre en el servidor.'
      );

      setPerfil(null);
    } finally {
      setCerrando(false);
    }
  };

  if (cargando) {
    return (
      <div className="profile-page-container">
        <p role="status">Cargando tu perfil...</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="profile-page-container">
        <div className="profile-content-wrapper">
          <p role="alert">
            {error || 'No fue posible cargar tu perfil.'}
          </p>

          <Link to="/cuenta/inicio-sesion">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  const nombreCompleto =
    `${perfil.nombres || ''} ${perfil.apellidos || ''}`.trim();

  const volverA =
    perfil.rol === 'Administrador' ||
      perfil.rol === 'Empleado'
      ? '/dashboard'
      : '/inicio';

  return (
    <div className="profile-page-container">
      <div className="profile-content-wrapper">
        <Link to={volverA} className="profile-back-link">
          <ArrowLeft size={14} />
          {volverA === '/dashboard'
            ? 'Volver al Dashboard'
            : 'Volver al inicio'}
        </Link>

        <div className="profile-header-titles">
          <div className="profile-subtitle-tag">PERFIL</div>

          <h1 className="profile-title">Mi Cuenta</h1>

          <p className="profile-desc">
            Información de tu cuenta de usuario
          </p>
        </div>

        <div className="profile-user-card">
          <div className="profile-avatar-circle">
            {obtenerIniciales(nombreCompleto) || 'U'}
          </div>

          <div className="profile-user-info-main">
            <span className="profile-user-name">
              {nombreCompleto}
            </span>

            <span className="profile-user-email">
              {perfil.correo}
            </span>

            <div className="profile-badge-active">
              <span className="profile-badge-dot" />
              Cuenta {perfil.estado?.toLowerCase()}
            </div>
          </div>
        </div>

        {error && (
          <div className="profile-message profile-message--error" role="alert">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="profile-message profile-message--success" role="status">
            {mensaje}
          </div>
        )}

        <div className="profile-details-card">
          <div className="profile-details-header">
            <div className="profile-details-title">
              Información personal
            </div>

            {!editando && (
              <button
                type="button"
                className="profile-edit-btn"
                onClick={comenzarEdicion}
              >
                <Edit size={15} />
                Editar
              </button>
            )}
          </div>

          {editando ? (
            <form
              className="profile-edit-form"
              onSubmit={guardarCambios}
              noValidate
            >
              <div className="profile-edit-field">
                <label htmlFor="perfil-nombres">
                  Nombres *
                </label>

                <input
                  id="perfil-nombres"
                  name="nombres"
                  value={formulario.nombres}
                  onChange={cambiarCampo}
                  maxLength={80}
                  aria-invalid={Boolean(mostrarError('nombres'))}
                  required
                />

                {mostrarError('nombres') && (
                  <small className="profile-field-error">
                    {mostrarError('nombres')}
                  </small>
                )}
              </div>

              <div className="profile-edit-field">
                <label htmlFor="perfil-apellidos">
                  Apellidos *
                </label>

                <input
                  id="perfil-apellidos"
                  name="apellidos"
                  value={formulario.apellidos}
                  onChange={cambiarCampo}
                  maxLength={80}
                  aria-invalid={Boolean(mostrarError('apellidos'))}
                  required
                />

                {mostrarError('apellidos') && (
                  <small className="profile-field-error">
                    {mostrarError('apellidos')}
                  </small>
                )}
              </div>

              <div className="profile-edit-field">
                <label htmlFor="perfil-telefono">
                  Teléfono *
                </label>

                <input
                  id="perfil-telefono"
                  name="telefono"
                  type="tel"
                  value={formulario.telefono}
                  onChange={cambiarCampo}
                  maxLength={20}
                  aria-invalid={Boolean(mostrarError('telefono'))}
                  required
                />

                {mostrarError('telefono') && (
                  <small className="profile-field-error">
                    {mostrarError('telefono')}
                  </small>
                )}
              </div>

              <div className="profile-edit-field">
                <label htmlFor="perfil-direccion">
                  Dirección *
                </label>

                <input
                  id="perfil-direccion"
                  name="direccion"
                  value={formulario.direccion}
                  onChange={cambiarCampo}
                  maxLength={200}
                  aria-invalid={Boolean(mostrarError('direccion'))}
                  required
                />

                {mostrarError('direccion') && (
                  <small className="profile-field-error">
                    {mostrarError('direccion')}
                  </small>
                )}
              </div>

              <div className="profile-edit-field">
                <label htmlFor="perfil-genero">
                  Género *
                </label>

                <select
                  id="perfil-genero"
                  name="genero"
                  value={formulario.genero}
                  onChange={cambiarCampo}
                  aria-invalid={Boolean(mostrarError('genero'))}
                  required
                >
                  <option value="">Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>

                {mostrarError('genero') && (
                  <small className="profile-field-error">
                    {mostrarError('genero')}
                  </small>
                )}
              </div>

              <div className="profile-edit-actions">
                <button
                  type="button"
                  className="profile-cancel-btn"
                  onClick={cancelarEdicion}
                  disabled={guardando}
                >
                  <X size={15} />
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info-list">
              <div className="profile-info-item">
                <div className="profile-info-icon-box">
                  <User size={16} />
                </div>

                <div className="profile-info-text">
                  <span className="profile-info-label">
                    NOMBRE COMPLETO
                  </span>
                  <span className="profile-info-value">
                    {nombreCompleto}
                  </span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon-box">
                  <Mail size={16} />
                </div>

                <div className="profile-info-text">
                  <span className="profile-info-label">
                    CORREO ELECTRÓNICO
                  </span>
                  <span className="profile-info-value">
                    {perfil.correo}
                  </span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon-box">
                  <Phone size={16} />
                </div>

                <div className="profile-info-text">
                  <span className="profile-info-label">
                    TELÉFONO
                  </span>
                  <span className="profile-info-value">
                    {perfil.telefono || '—'}
                  </span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon-box">
                  <MapPin size={16} />
                </div>

                <div className="profile-info-text">
                  <span className="profile-info-label">
                    DIRECCIÓN
                  </span>
                  <span className="profile-info-value">
                    {perfil.direccion || '—'}
                  </span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon-box">
                  <UserCheck size={16} />
                </div>

                <div className="profile-info-text">
                  <span className="profile-info-label">
                    GÉNERO
                  </span>
                  <span className="profile-info-value">
                    {perfil.genero || '—'}
                  </span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon-box">
                  <ShieldCheck size={16} />
                </div>

                <div className="profile-info-text">
                  <span className="profile-info-label">ROL</span>
                  <span className="profile-info-value">
                    {perfil.rol}
                  </span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon-box">
                  <Info size={16} />
                </div>

                <div className="profile-info-text">
                  <span className="profile-info-label">
                    ESTADO DE LA CUENTA
                  </span>
                  <span className="profile-info-value">
                    {perfil.estado}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-security-alert">
          <Info size={18} />

          <span>
            Por seguridad, la contraseña no se muestra.
            Puedes usar la opción de recuperar contraseña
            desde el inicio de sesión.
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="profile-logout-btn"
          disabled={cerrando}
        >
          <LogOut size={16} />
          {cerrando ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  );
}