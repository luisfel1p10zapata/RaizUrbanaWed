import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import {
    Moon,
    Sun,
    ShoppingBag,
    User,
    LogOut,
    LayoutDashboard,
} from 'lucide-react';

import useTheme from '../hooks/useTheme';

import {
    cerrarSesion,
    consultarSesion,
} from '../../features/usuarios/services/authService';

import './MainNavbar.css';

const MainNavbar = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const [currentUser, setCurrentUser] = useState(null);
    const [cargandoSesion, setCargandoSesion] = useState(true);
    const [error, setError] = useState('');
    const [cerrando, setCerrando] = useState(false);

    useEffect(() => {
        let activo = true;

        consultarSesion()
            .then((usuario) => {
                if (activo) {
                    setCurrentUser(usuario);
                }
            })
            .catch(() => {
                if (activo) {
                    setError('No fue posible comprobar tu sesión.');
                }
            })
            .finally(() => {
                if (activo) {
                    setCargandoSesion(false);
                }
            });

        return () => {
            activo = false;
        };
    }, []);

    const handleLogout = async () => {
        if (cerrando) return;

        setCerrando(true);
        setError('');

        try {
            await cerrarSesion();
            setCurrentUser(null);
            navigate('/cuenta/inicio-sesion', { replace: true });
        } catch {
            setCurrentUser(null);

            setError(
                'Se cerró la sesión en este navegador, pero no se pudo confirmar el cierre en el servidor.'
            );
        } finally {
            setCerrando(false);
        }
    };

    const userName =
        currentUser?.nombres ||
        currentUser?.correo ||
        'Mi perfil';

    const puedeVerDashboard =
        (currentUser?.rol === 'Administrador' ||
            currentUser?.rol === 'Empleado') &&
        Array.isArray(currentUser?.permisos) &&
        currentUser.permisos.includes('Dashboard');

    return (
        <header className="main-navbar">
            <div className="main-navbar-logo">
                <button
                    type="button"
                    onClick={() => navigate('/inicio')}
                >
                    <img
                        src={
                            theme === 'dark'
                                ? '/images/logoDark.png'
                                : '/images/logo-ru.png'
                        }
                        alt="Raíz Urbana"
                    />
                </button>
            </div>

            <nav className="main-navbar-links">
                <NavLink to="/inicio">Inicio</NavLink>
                <NavLink to="/productos">Colecciones</NavLink>
            </nav>

            <div className="main-navbar-actions">
                <button
                    type="button"
                    aria-label={
                        theme === 'dark'
                            ? 'Activar modo claro'
                            : 'Activar modo oscuro'
                    }
                    onClick={toggleTheme}
                >
                    {theme === 'dark' ? (
                        <Sun size={19} />
                    ) : (
                        <Moon size={19} />
                    )}
                </button>

                <button
                    type="button"
                    aria-label="Carrito"
                    onClick={() => navigate('/carrito')}
                >
                    <ShoppingBag size={19} />
                </button>

                <span className="main-navbar-divider" />

                {cargandoSesion ? (
                    <span role="status">Cargando cuenta...</span>
                ) : currentUser ? (
                    <div
                        className="user-logged-actions"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}
                    >
                        {puedeVerDashboard && (
                            <NavLink
                                to="/dashboard"
                                title="Panel de administración"
                                aria-label="Panel de administración"
                            >
                                <LayoutDashboard size={18} />
                            </NavLink>
                        )}

                        <NavLink
                            to="/cuenta/perfil"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: 'bold',
                            }}
                        >
                            <User size={18} />
                            <span>{userName}</span>
                        </NavLink>

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={cerrando}
                            title="Cerrar sesión"
                            aria-label="Cerrar sesión"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#d8483a',
                            }}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <>
                        <NavLink to="/cuenta/inicio-sesion">
                            Iniciar sesión
                        </NavLink>

                        <NavLink
                            to="/cuenta/registro"
                            className="main-navbar-register"
                        >
                            Registrarse
                        </NavLink>
                    </>
                )}
            </div>

            {error && (
                <span role="alert">
                    {error}
                </span>
            )}
        </header>
    );
};

export default MainNavbar;