import {
    PanelLeftClose,
    PanelLeftOpen,
    Moon,
    Sun,
    User,
    LogOut,
} from 'lucide-react';

import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import useTheme from '../hooks/useTheme';

import {
    cerrarSesion,
    consultarSesion,
} from '../../features/usuarios/services/authService';

import navigationConfig from './NavigationConfig';
import SidebarSection from './SidebarSection';
import SidebarItem from './SidebarItem';

import './AdminSidebar.css';

const AdminSidebar = ({ collapsed, setCollapsed }) => {
    const navigate = useNavigate();

    const [openSection, setOpenSection] = useState('Principal');
    const [currentUser, setCurrentUser] = useState(null);
    const [cargandoSesion, setCargandoSesion] = useState(true);
    const [cerrando, setCerrando] = useState(false);
    const [error, setError] = useState('');

    const { theme, toggleTheme } = useTheme();

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
                    setError('No fue posible comprobar la sesión.');
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

            navigate('/cuenta/inicio-sesion', {
                replace: true,
            });
        } catch {
            setCurrentUser(null);

            setError(
                'Se cerró la sesión en este navegador, pero no se pudo confirmar el cierre en el servidor.'
            );
        } finally {
            setCerrando(false);
        }
    };

    const toggleSidebar = () => {
        setCollapsed((actual) => !actual);
    };

    const handleSectionToggle = (sectionTitle) => {
        setOpenSection((actual) =>
            actual === sectionTitle ? null : sectionTitle
        );
    };

    const userName =
        currentUser?.nombres ||
        currentUser?.correo ||
        'Mi perfil';

    return (
        <aside
            className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}
        >
            <div className="admin-sidebar-header">
                <div className="admin-sidebar-logo">
                    <img
                        src={
                            theme === 'dark'
                                ? '/images/logoDark.png'
                                : '/images/logo-ru.png'
                        }
                        alt="Raíz Urbana"
                    />
                </div>

                {!collapsed && (
                    <span className="admin-sidebar-title" />
                )}

                <button
                    type="button"
                    className="admin-sidebar-toggle"
                    onClick={toggleSidebar}
                    aria-label={
                        collapsed
                            ? 'Expandir menú'
                            : 'Contraer menú'
                    }
                >
                    {collapsed ? (
                        <PanelLeftOpen size={19} />
                    ) : (
                        <PanelLeftClose size={19} />
                    )}
                </button>
            </div>

            {!collapsed && (
                <nav className="admin-sidebar-nav">
                    {navigationConfig.map((section) => (
                        <SidebarSection
                            key={section.title}
                            section={section}
                            isOpen={openSection === section.title}
                            onToggle={() =>
                                handleSectionToggle(section.title)
                            }
                        >
                            {section.items.map((item) => (
                                <SidebarItem
                                    key={item.path}
                                    item={item}
                                />
                            ))}
                        </SidebarSection>
                    ))}
                </nav>
            )}

            {collapsed && (
                <nav className="admin-sidebar-nav collapsed-nav">
                    {navigationConfig.flatMap((section) =>
                        section.items.map((item) => (
                            <SidebarItem
                                key={item.path}
                                item={item}
                            />
                        ))
                    )}
                </nav>
            )}

            <div className="admin-sidebar-bottom">
                <button
                    type="button"
                    className="admin-sidebar-bottom-item"
                    onClick={toggleTheme}
                    aria-label={
                        theme === 'dark'
                            ? 'Activar modo claro'
                            : 'Activar modo oscuro'
                    }
                >
                    {theme === 'dark' ? (
                        <Sun size={18} />
                    ) : (
                        <Moon size={18} />
                    )}

                    {!collapsed && (
                        <span>
                            {theme === 'dark'
                                ? 'Modo claro'
                                : 'Modo oscuro'}
                        </span>
                    )}
                </button>

                {cargandoSesion ? (
                    !collapsed && (
                        <span className="admin-sidebar-bottom-item">
                            Cargando cuenta...
                        </span>
                    )
                ) : currentUser ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                        }}
                    >
                        <NavLink
                            to="/cuenta/perfil"
                            className="admin-sidebar-bottom-item"
                            title={userName}
                        >
                            <User size={18} />

                            {!collapsed && (
                                <span
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {userName}
                                </span>
                            )}
                        </NavLink>

                        <button
                            type="button"
                            className="admin-sidebar-bottom-item"
                            onClick={handleLogout}
                            disabled={cerrando}
                            style={{ color: '#d8483a' }}
                            title="Cerrar sesión"
                        >
                            <LogOut size={18} />

                            {!collapsed && (
                                <span>
                                    {cerrando
                                        ? 'Cerrando sesión...'
                                        : 'Cerrar sesión'}
                                </span>
                            )}
                        </button>
                    </div>
                ) : (
                    <NavLink
                        to="/cuenta/inicio-sesion"
                        className="admin-sidebar-bottom-item"
                    >
                        <User size={18} />

                        {!collapsed && (
                            <span>Iniciar sesión</span>
                        )}
                    </NavLink>
                )}

                {error && !collapsed && (
                    <p role="alert">{error}</p>
                )}
            </div>
        </aside>
    );
};

export default AdminSidebar;