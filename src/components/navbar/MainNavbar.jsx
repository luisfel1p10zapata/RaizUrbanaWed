import { NavLink, useNavigate } from 'react-router-dom';
import { Moon, ShoppingBag , LayoutDashboard } from 'lucide-react';
import './MainNavbar.css';

const MainNavbar = () => {
    const navigate = useNavigate();

    return (
        <header className="main-navbar">
            <div className="main-navbar-logo">
                <button
                    type="button"
                    onClick={() => navigate('/inicio')}
                >
                    <img
                        src="/images/logo-ru.png"
                        alt="Raíz Urbana"
                    />
                </button>
            </div>

            <nav className="main-navbar-links">
                <NavLink to="/inicio">
                    Inicio
                </NavLink>

                <NavLink to="/productos">
                    Colecciones
                </NavLink>
            </nav>

            <div className="main-navbar-actions">
                <button
                    type="button"
                    aria-label="Cambiar modo"
                >
                    <Moon size={19} />
                </button>

                <button
                    type="button"
                    aria-label="Carrito"
                    onClick={() => navigate('/carrito')}
                >
                    <ShoppingBag size={19} />
                </button>

                <span className="main-navbar-divider"></span>

                <NavLink to="/cuenta/inicio-sesion">
                    Iniciar sesión
                </NavLink>

                <NavLink
                    to="/cuenta/registro"
                    className="main-navbar-register"
                >
                    Registrarse
                </NavLink>

                <button
                    type="button"
                    className="main-navbar-admin"
                    onClick={() => navigate('/dashboard')}
                >
                    <LayoutDashboard></LayoutDashboard>Administrador
                </button>
            </div>
        </header>
    );
};

export default MainNavbar;