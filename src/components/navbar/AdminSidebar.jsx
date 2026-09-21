import {
    PanelLeftClose,
    PanelLeftOpen,
    Moon,
    Sun,
    User,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';

import './AdminSidebar.css';

import useTheme from '../hook/useTheme';
import navigationConfig from './NavigationConfig';
import SidebarSection from './SidebarSection';
import SidebarItem from './SidebarItem';

const AdminSidebar = ({ collapsed, setCollapsed }) => {
    const [openSection, setOpenSection] = useState('Principal');
    const { theme, toggleTheme } = useTheme();

    const toggleSidebar = () => {
        setCollapsed((prev) => !prev);
    };

    const handleSectionToggle = (sectionTitle) => {
        setOpenSection((prev) =>
            prev === sectionTitle ? null : sectionTitle
        );
    };

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

                <NavLink
                    to="/cuenta/inicio-sesion"
                    className="admin-sidebar-bottom-item"
                >
                    <User size={18} />

                    {!collapsed && (
                        <span>Iniciar sesión</span>
                    )}
                </NavLink>
            </div>
        </aside>
    );
};

export default AdminSidebar;