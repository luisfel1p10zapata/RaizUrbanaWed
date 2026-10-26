import {
    PanelLeftClose,
    PanelLeftOpen,
    Moon,
    Sun,
    User,
    LogOut,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './AdminSidebar.css';
import useTheme from '../hooks/useTheme';
import navigationConfig from './NavigationConfig';
import SidebarSection from './SidebarSection';
import SidebarItem from './SidebarItem';

const AdminSidebar = ({ collapsed, setCollapsed }) => {
    const navigate = useNavigate();
    const [openSection, setOpenSection] = useState('Principal');
    const { theme, toggleTheme } = useTheme();
    const [currentUser, setCurrentUser] = useState(null);

    // Leer el usuario autenticado desde el localStorage
    useEffect(() => {
        const checkUserSession = () => {
            const savedUser = localStorage.getItem('raiz_urbana_user');
            if (savedUser) {
                try {
                    setCurrentUser(JSON.parse(savedUser));
                    // eslint-disable-next-line no-unused-vars
                } catch (e) {
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
        };

        checkUserSession();
        window.addEventListener('storage', checkUserSession);
        return () => window.removeEventListener('storage', checkUserSession);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('raiz_urbana_token');
        localStorage.removeItem('raiz_urbana_user');
        setCurrentUser(null);
        navigate('/cuenta/inicio-sesion');
    };

    const toggleSidebar = () => {
        setCollapsed((prev) => !prev);
    };

    const handleSectionToggle = (sectionTitle) => {
        setOpenSection((prev) =>
            prev === sectionTitle ? null : sectionTitle
        );
    };

    const userName = currentUser?.nombres || currentUser?.nombre || currentUser?.correo || 'Mi Perfil';

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
                    <span className="admin-sidebar-title">
                    </span>
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
                            onToggle={() => handleSectionToggle(section.title)}
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
                            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                        </span>
                    )}
                </button>

                {currentUser ? (
                    /* SI HAY SESIÓN ACTIVA EN EL SIDEBAR */
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <NavLink
                            to="/cuenta/perfil"
                            className="admin-sidebar-bottom-item"
                            title={userName}
                        >
                            <User size={18} />
                            {!collapsed && (
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {userName}
                                </span>
                            )}
                        </NavLink>
                        <button
                            type="button"
                            className="admin-sidebar-bottom-item"
                            onClick={handleLogout}
                            style={{ color: '#d8483a' }}
                            title="Cerrar sesión"
                        >
                            <LogOut size={18} />
                            {!collapsed && <span>Cerrar sesión</span>}
                        </button>
                    </div>
                ) : (
                    /* SI NO HAY SESIÓN */
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
            </div>
        </aside>
    );
};

export default AdminSidebar;