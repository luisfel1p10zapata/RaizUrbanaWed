import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Moon, Sun, ShoppingBag, User, LogOut, LayoutDashboard } from 'lucide-react';
import useTheme from '../hooks/useTheme';
import './MainNavbar.css';

const MainNavbar = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    // Función auxiliar para obtener el usuario actual en cualquier momento
    const getStoredUser = () => {
        try {
            const savedUser = localStorage.getItem('raiz_urbana_user');
            return savedUser ? JSON.parse(savedUser) : null;
            // eslint-disable-next-line no-unused-vars
        } catch (e) {
            return null;
        }
    };

    const [currentUser, setCurrentUser] = useState(getStoredUser());

    // Sincronizar estado si cambia el localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            setCurrentUser(getStoredUser());
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('raiz_urbana_token');
        localStorage.removeItem('raiz_urbana_user');
        setCurrentUser(null);
        navigate('/cuenta/inicio-sesion');
    };

    const userName = currentUser?.nombres || currentUser?.nombre || currentUser?.correo || 'Mi Perfil';

    return (
        <header className="main-navbar">
            <div className="main-navbar-logo">
                <button type="button" onClick={() => navigate('/inicio')}>
                    <img
                        src={theme === 'dark' ? '/images/logoDark.png' : '/images/logo-ru.png'}
                        alt="Raíz Urbana"
                    />
                </button>
            </div>

            <nav className="main-navbar-links">
                <NavLink to="/inicio">Inicio</NavLink>
                <NavLink to="/productos">Colecciones</NavLink>
            </nav>

            <div className="main-navbar-actions">
                <button type="button" aria-label="Cambiar modo" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
                </button>

                <button type="button" aria-label="Carrito" onClick={() => navigate('/carrito')}>
                    <ShoppingBag size={19} />
                </button>

                <span className="main-navbar-divider"></span>

                {currentUser ? (
                    <div className="user-logged-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <NavLink to="/dashboard" title="Panel de administración">
                            <LayoutDashboard size={18} />
                        </NavLink>

                        <NavLink to="/cuenta/perfil" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                            <User size={18} />
                            <span>{userName}</span>
                        </NavLink>

                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Cerrar sesión"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#d8483a' }}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <>
                        <NavLink to="/cuenta/inicio-sesion">Iniciar sesión</NavLink>
                        <NavLink to="/cuenta/registro" className="main-navbar-register">
                            Registrarse
                        </NavLink>
                    </>
                )}
            </div>
        </header>
    );
};

export default MainNavbar;