import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, ShieldCheck, LogOut, Info, UserCheck } from 'lucide-react';
import './perfil.css';

export default function Perfil() {
  const navigate = useNavigate();

  // Datos simulados del usuario logueado
  const user = {
    nombre: 'Sebastián Contreras',
    email: 'admin@raizurbana.com',
    telefono: '—',
    direccion: '—',
    genero: '—',
    rol: '—',
    estado: 'Activo'
  };

  const handleLogout = () => {
    navigate('/cuenta/iniciar-sesion');
  };

  return (
    <div className="profile-page-container">
      <div className="profile-content-wrapper">
        <Link to="/" className="profile-back-link">
          <ArrowLeft size={14} />
          Volver
        </Link>

        <div className="profile-header-titles">
          <div className="profile-subtitle-tag">PERFIL</div>
          <h1 className="profile-title">Mi Cuenta</h1>
          <p className="profile-desc">Información de tu cuenta de usuario</p>
        </div>

        {/* Tarjeta Avatar */}
        <div className="profile-user-card">
          <div className="profile-avatar-circle">SC</div>
          <div className="profile-user-info-main">
            <span className="profile-user-name">{user.nombre}</span>
            <span className="profile-user-email">{user.email}</span>
            <div className="profile-badge-active">
              <span className="profile-badge-dot"></span>
              Cuenta activa
            </div>
          </div>
        </div>

        {/* Detalles de Información */}
        <div className="profile-details-card">
          <div className="profile-details-title">Información personal</div>

          <div className="profile-info-list">
            <div className="profile-info-item">
              <div className="profile-info-icon-box"><User size={16} /></div>
              <div className="profile-info-text">
                <span className="profile-info-label">NOMBRE COMPLETO</span>
                <span className="profile-info-value">{user.nombre}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon-box"><Mail size={16} /></div>
              <div className="profile-info-text">
                <span className="profile-info-label">CORREO ELECTRÓNICO</span>
                <span className="profile-info-value">{user.email}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon-box"><Phone size={16} /></div>
              <div className="profile-info-text">
                <span className="profile-info-label">TELÉFONO</span>
                <span className="profile-info-value">{user.telefono}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon-box"><MapPin size={16} /></div>
              <div className="profile-info-text">
                <span className="profile-info-label">DIRECCIÓN</span>
                <span className="profile-info-value">{user.direccion}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon-box"><UserCheck size={16} /></div>
              <div className="profile-info-text">
                <span className="profile-info-label">GÉNERO</span>
                <span className="profile-info-value">{user.genero}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon-box"><ShieldCheck size={16} /></div>
              <div className="profile-info-text">
                <span className="profile-info-label">ROL</span>
                <span className="profile-info-value">{user.rol}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon-box"><Info size={16} /></div>
              <div className="profile-info-text">
                <span className="profile-info-label">ESTADO DE LA CUENTA</span>
                <span className="profile-info-value">{user.estado}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerta Informativa */}
        <div className="profile-security-alert">
          <Info size={18} />
          <span>
            La contraseña no se muestra por seguridad. Para cambiarla utiliza la opción "Recuperar contraseña".
          </span>
        </div>

        {/* Botón Cerrar Sesión */}
        <button onClick={handleLogout} className="profile-logout-btn">
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}