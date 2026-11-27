import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { consultarSesion } from '../services/authService';

export default function RutaProtegida({
    permiso,
    soloAdministrativo = false,
}) {
    const [estado, setEstado] = useState('cargando');
    const [usuario, setUsuario] = useState(null);

    const location = useLocation();

    useEffect(() => {
        let activo = true;

        consultarSesion()
            .then((resultado) => {
                if (!activo) return;

                if (!resultado) {
                    setEstado('sin-sesion');
                    return;
                }

                setUsuario(resultado);
                setEstado('autenticado');
            })
            .catch(() => {
                if (activo) {
                    setEstado('error');
                }
            });

        return () => {
            activo = false;
        };
    }, []);

    if (estado === 'cargando') {
        return (
            <p role="status">
                Comprobando sesión...
            </p>
        );
    }

    if (estado === 'error') {
        return (
            <div role="alert">
                <p>No fue posible comprobar tu sesión.</p>

                <button
                    type="button"
                    onClick={() => window.location.reload()}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (estado === 'sin-sesion') {
        return (
            <Navigate
                to="/cuenta/inicio-sesion"
                replace
                state={{ desde: location.pathname }}
            />
        );
    }

    const esAdministrativo =
        usuario?.rol === 'Administrador' ||
        usuario?.rol === 'Empleado';

    if (soloAdministrativo && !esAdministrativo) {
        return <Navigate to="/inicio" replace />;
    }

    if (
        permiso &&
        (!Array.isArray(usuario?.permisos) ||
            !usuario.permisos.includes(permiso))
    ) {
        return (
            <div role="alert">
                <p>No tienes permiso para acceder a esta página.</p>
                <a href="/inicio">Volver al inicio</a>
            </div>
        );
    }

    return <Outlet />;
}