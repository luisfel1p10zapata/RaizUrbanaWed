// Usuarios.jsx

import { useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  EyeOff,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import './Usuarios.css';

const usuariosIniciales = [
  {
    id: 1,
    nombre: 'Carlos Mendoza',
    correo: 'carlos.mendoza@empresa.com',
    telefono: '+54 11 4521-0001',
    rol: 'Administrador',
    estado: 'Activo',
    fecha: '2025-11-01',
    cedula: '1023456789',
    direccion: 'Calle 80 # 45-12, Bogotá',
    genero: 'Masculino',
  },
  {
    id: 2,
    nombre: 'Lucía Fernández',
    correo: 'lucia.fernandez@empresa.com',
    telefono: '+54 11 4521-0002',
    rol: 'Supervisora',
    estado: 'Activo',
    fecha: '2025-11-05',
    cedula: '1023456790',
    direccion: 'Carrera 20 # 50-18, Bogotá',
    genero: 'Femenino',
  },
  {
    id: 3,
    nombre: 'Martín López',
    correo: 'martin.lopez@empresa.com',
    telefono: '+54 11 4521-0003',
    rol: 'Vendedor',
    estado: 'Activo',
    fecha: '2025-11-10',
    cedula: '1023456791',
    direccion: 'Calle 72 # 20-10, Bogotá',
    genero: 'Masculino',
  },
  {
    id: 4,
    nombre: 'Valentina Torres',
    correo: 'valentina.torres@empresa.com',
    telefono: '+54 11 4521-0004',
    rol: 'Empleado',
    estado: 'Activo',
    fecha: '2025-11-15',
    cedula: '1023456792',
    direccion: 'Carrera 12 # 70-22, Bogotá',
    genero: 'Femenino',
  },
  {
    id: 5,
    nombre: 'Diego Ramírez',
    correo: 'diegoramirez@empresa.com',
    telefono: '+54 11 4521-0005',
    rol: 'Bodeguero',
    estado: 'Activo',
    fecha: '2025-11-20',
    cedula: '1023456793',
    direccion: 'Calle 90 # 30-15, Bogotá',
    genero: 'Masculino',
  },
  {
    id: 6,
    nombre: 'Sofía Gómez',
    correo: 'sofia.gomez@empresa.com',
    telefono: '+54 11 4521-0006',
    rol: 'Vendedor',
    estado: 'Activo',
    fecha: '2025-12-01',
    cedula: '1023456794',
    direccion: 'Carrera 7 # 60-19, Bogotá',
    genero: 'Femenino',
  },
  {
    id: 7,
    nombre: 'Andrés Castillo',
    correo: 'andres.castillo@empresa.com',
    telefono: '+54 11 4521-0007',
    rol: 'Empleado',
    estado: 'Activo',
    fecha: '2025-12-05',
    cedula: '1023456795',
    direccion: 'Calle 45 # 10-20, Bogotá',
    genero: 'Masculino',
  },
  {
    id: 8,
    nombre: 'Camila Herrera',
    correo: 'camila.herrera@empresa.com',
    telefono: '+54 11 4521-0008',
    rol: 'Supervisor',
    estado: 'Inactivo',
    fecha: '2026-01-10',
    cedula: '1023456796',
    direccion: 'Carrera 15 # 80-11, Bogotá',
    genero: 'Femenino',
  },
  {
    id: 9,
    nombre: 'Roberto Suarez',
    correo: 'roberto.suarez@empresa.com',
    telefono: '+54 11 4321-0009',
    rol: 'Bodeguero',
    estado: 'Inactivo',
    fecha: '2026-01-15',
    cedula: '1012345678',
    direccion: 'Calle 72 # 10-34, Barranquilla',
    genero: 'Masculino',
  },
  {
    id: 10,
    nombre: 'Ana Morales',
    correo: 'ana.morales@empresa.com',
    telefono: '+54 11 4521-0010',
    rol: 'Empleado',
    estado: 'Activo',
    fecha: '2026-02-01',
    cedula: '1023456798',
    direccion: 'Carrera 30 # 15-20, Bogotá',
    genero: 'Femenino',
  },
];

const avatarColors = [
  '#00dce8',
  '#ff00c8',
  '#00e9a3',
  '#ffae00',
  '#16c9e8',
  '#16c9e8',
  '#ff0056',
  '#16c9e8',
  '#2b2b67',
  '#ffae00',
];

function Modal({ children, onClose, className = '' }) {
  return (
    <div className="usuario-overlay" onMouseDown={onClose}>
      <div
        className={`usuario-modal ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ kicker, title, onClose }) {
  return (
    <div className="usuario-modal-header">
      <div>
        <div className="usuario-modal-kicker">{kicker}</div>
        <h2>{title}</h2>
      </div>
      <button onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );
}

function Campo({ label, children, full = false }) {
  return (
    <label className={`usuario-field ${full ? 'full' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function SelectCampo({ value, onChange, children }) {
  return (
    <div className="usuario-select-wrap">
      <select value={value} onChange={onChange}>
        {children}
      </select>
      <ChevronDown size={15} />
    </div>
  );
}

function NuevoUsuario({ onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <Modal className="usuario-form-modal" onClose={onClose}>
      <ModalHeader
        kicker="CU.14.02 · NUEVO USUARIO"
        title="Registrar Usuario"
        onClose={onClose}
      />

      <div className="usuario-form-body">
        <div className="usuario-form-grid">
          <Campo label="CÉDULA *">
            <input placeholder="1023456789" />
          </Campo>

          <Campo label="NOMBRE COMPLETO *">
            <input placeholder="Nombre y apellido" />
          </Campo>

          <Campo label="CORREO ELECTRÓNICO">
            <div className="usuario-input-icon">
              <Mail size={15} />
              <input placeholder="usuario@empresa.com" />
            </div>
          </Campo>

          <Campo label="CONTRASEÑA">
            <div className="usuario-input-icon">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Campo>

          <Campo label="CONFIRMAR CONTRASEÑA">
            <div className="usuario-input-icon">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repetir contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Campo>

          <Campo label="TELÉFONO">
            <div className="usuario-input-icon">
              <Phone size={15} />
              <input placeholder="+57 300 123-4567" />
            </div>
          </Campo>

          <Campo label="DIRECCIÓN" full>
            <input placeholder="Calle 80 # 45-12, Bogotá" />
          </Campo>

          <Campo label="GÉNERO">
            <SelectCampo defaultValue="Masculino">
              <option>Masculino</option>
              <option>Femenino</option>
              <option>Otro</option>
            </SelectCampo>
          </Campo>

          <Campo label="ROL">
            <SelectCampo defaultValue="Empleado">
              <option>Administrador</option>
              <option>Supervisora</option>
              <option>Supervisor</option>
              <option>Vendedor</option>
              <option>Empleado</option>
              <option>Bodeguero</option>
            </SelectCampo>
          </Campo>
        </div>
      </div>

      <div className="usuario-modal-footer">
        <button className="usuario-outline" onClick={onClose}>
          Cancelar
        </button>
        <button className="usuario-primary" onClick={onClose}>
          Registrar usuario
        </button>
      </div>
    </Modal>
  );
}

function EditarUsuario({ usuario, onClose }) {
  const [estado, setEstado] = useState(usuario.estado);

  return (
    <Modal className="usuario-form-modal" onClose={onClose}>
      <ModalHeader
        kicker={`CU.14.03 · EDITANDO #${usuario.id}`}
        title="Editar Usuario"
        onClose={onClose}
      />

      <div className="usuario-form-body">
        <div className="usuario-form-grid">
          <Campo label="CÉDULA *">
            <input defaultValue={usuario.cedula} />
          </Campo>

          <Campo label="NOMBRE COMPLETO *">
            <input defaultValue={usuario.nombre} />
          </Campo>

          <Campo label="CORREO ELECTRÓNICO">
            <div className="usuario-input-icon">
              <Mail size={15} />
              <input defaultValue={usuario.correo} />
            </div>
          </Campo>

          <Campo label="TELÉFONO">
            <div className="usuario-input-icon">
              <Phone size={15} />
              <input defaultValue={usuario.telefono} />
            </div>
          </Campo>

          <Campo label="DIRECCIÓN" full>
            <input defaultValue={usuario.direccion} />
          </Campo>

          <Campo label="GÉNERO">
            <SelectCampo defaultValue={usuario.genero}>
              <option>Masculino</option>
              <option>Femenino</option>
              <option>Otro</option>
            </SelectCampo>
          </Campo>

          <Campo label="ROL">
            <SelectCampo defaultValue={usuario.rol}>
              <option>Administrador</option>
              <option>Supervisora</option>
              <option>Supervisor</option>
              <option>Vendedor</option>
              <option>Empleado</option>
              <option>Bodeguero</option>
            </SelectCampo>
          </Campo>

          <Campo label="ESTADO" full>
            <div className="usuario-radio-group">
              <button
                className={estado === 'Activo' ? 'selected' : ''}
                onClick={() => setEstado('Activo')}
              >
                <span />
                Activo
              </button>

              <button
                className={estado === 'Inactivo' ? 'selected' : ''}
                onClick={() => setEstado('Inactivo')}
              >
                <span />
                Inactivo
              </button>
            </div>
          </Campo>
        </div>
      </div>

      <div className="usuario-modal-footer">
        <button className="usuario-outline" onClick={onClose}>
          Cancelar
        </button>
        <button className="usuario-primary" onClick={onClose}>
          Guardar cambios
        </button>
      </div>
    </Modal>
  );
}

function VerUsuario({ usuario, onClose }) {
  return (
    <Modal className="usuario-view-modal" onClose={onClose}>
      <ModalHeader
        kicker={`CU.14.04 · USUARIO #${usuario.id}`}
        title="Consultar Usuario"
        onClose={onClose}
      />

      <div className="usuario-view-body">
        <div className="usuario-profile-head">
          <div className="usuario-large-avatar">
            {usuario.nombre
              .split(' ')
              .map((x) => x[0])
              .slice(0, 2)
              .join('')}
          </div>

          <div>
            <strong>{usuario.nombre}</strong>
            <span>{usuario.correo}</span>
            <small>{usuario.rol}</small>
          </div>

          <span className={`usuario-state ${usuario.estado.toLowerCase()}`}>
            {usuario.estado}
          </span>
        </div>

        <section className="usuario-view-section">
          <h3>INFORMACIÓN GENERAL</h3>

          <div className="usuario-info-grid">
            <div>
              <span>Cédula</span>
              <strong>{usuario.cedula}</strong>
            </div>

            <div>
              <span>Correo electrónico</span>
              <strong>{usuario.correo}</strong>
            </div>

            <div>
              <span>Teléfono</span>
              <strong>{usuario.telefono}</strong>
            </div>

            <div>
              <span>Dirección</span>
              <strong>{usuario.direccion}</strong>
            </div>
          </div>
        </section>

        <section className="usuario-view-section">
          <h3>HISTORIAL DE COMPRAS</h3>

          {[
            ['ORD-2026-001', '2026-05-20', '$12.500'],
            ['ORD-2026-002', '2026-04-14', '$8.300'],
            ['ORD-2026-003', '2026-03-08', '$21.000'],
          ].map(([codigo, fecha, valor]) => (
            <div className="usuario-purchase" key={codigo}>
              <div>
                <strong>{codigo}</strong>
                <span>{fecha}</span>
              </div>
              <strong>{valor}</strong>
              <b>Completado</b>
            </div>
          ))}
        </section>

        <section className="usuario-view-section">
          <h3>ACTIVIDAD RECIENTE</h3>

          {[
            ['Inicio de sesión', '2026-09-12 10:32'],
            ['Actualizó perfil', '2026-09-10 14:21'],
            ['Generó reporte de ventas', '2026-09-08 09:15'],
            ['Cambio contraseña', '2026-08-30 17:42'],
          ].map(([actividad, fecha]) => (
            <div className="usuario-activity" key={actividad}>
              <span>{actividad}</span>
              <small>{fecha}</small>
            </div>
          ))}
        </section>
      </div>
    </Modal>
  );
}

function EliminarUsuario({ usuario, onClose }) {
  const bloqueado = usuario.rol === 'Administrador';

  return (
    <Modal className="usuario-delete-modal" onClose={onClose}>
      <div className="usuario-delete-symbol">
        <Trash2 size={18} />
      </div>

      <h2>Confirmar eliminación</h2>

      {bloqueado ? (
        <p>
          No se puede eliminar un usuario con rol{' '}
          <strong>Administrador.</strong>
        </p>
      ) : (
        <p>
          ¿Está seguro de eliminar al usuario <strong>{usuario.nombre}</strong>?
        </p>
      )}

      <div className="usuario-delete-actions">
        <button className="usuario-outline" onClick={onClose}>
          Cancelar
        </button>

        {!bloqueado && (
          <button className="usuario-danger" onClick={onClose}>
            Eliminar
          </button>
        )}
      </div>
    </Modal>
  );
}

export default function Usuarios() {
  const [usuarios] = useState(usuariosIniciales);
  const [search, setSearch] = useState('');
  const [rol, setRol] = useState('Todos los roles');
  const [estado, setEstado] = useState('Todos los estados');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return usuarios.filter((usuario) => {
      const text =
        `${usuario.nombre} ${usuario.correo} ${usuario.telefono}`.toLowerCase();

      return (
        text.includes(search.toLowerCase()) &&
        (rol === 'Todos los roles' || usuario.rol === rol) &&
        (estado === 'Todos los estados' || usuario.estado === estado)
      );
    });
  }, [usuarios, search, rol, estado]);

  const open = (type, user) => {
    setSelected(user);
    setModal(type);
  };

  return (
    <div className="usuarios-page">
      <div className="usuarios-header">
        <div>
          <div className="usuarios-kicker">CU.14 · MÓDULO</div>
          <h1>Gestión de Usuarios</h1>
          <p>Administra los usuarios y sus roles en el sistema</p>
        </div>

        <button
          className="usuarios-register"
          onClick={() => setModal('new')}
        >
          + &nbsp; REGISTRAR USUARIO
        </button>
      </div>

      <div className="usuarios-filter-card">
        <div className="usuarios-filter-title">
          <SlidersHorizontal size={15} />
          <strong>Filtros y búsqueda</strong>
        </div>

        <div className="usuarios-filter-body">
          <div className="usuarios-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo..."
            />
          </div>

          <div className="usuarios-select">
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option>Todos los roles</option>
              <option>Administrador</option>
              <option>Supervisora</option>
              <option>Supervisor</option>
              <option>Vendedor</option>
              <option>Empleado</option>
              <option>Bodeguero</option>
            </select>
            <ChevronDown size={15} />
          </div>

          <div className="usuarios-select">
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option>Todos los estados</option>
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </div>
      </div>

      <div className="usuarios-table-card">
        <div className="usuarios-table-top">
          <div>
            <strong>Listado de Usuarios</strong>
            <b>10</b>
          </div>
          <span>Página 1 de 2</span>
        </div>

        <div className="usuarios-table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>USUARIO</th>
                <th>CORREO</th>
                <th>ROL</th>
                <th>ESTADO</th>
                <th>FECHA REGISTRO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>

            <tbody>
              {filtered.slice(0, 8).map((usuario, index) => {
                const initials = usuario.nombre
                  .split(' ')
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join('');

                return (
                  <tr key={usuario.id}>
                    <td>#{index + 1}</td>

                    <td>
                      <div className="usuario-cell">
                        <div
                          className="usuario-avatar"
                          style={{
                            background: avatarColors[index],
                          }}
                        >
                          {initials}
                        </div>

                        <div>
                          <strong>{usuario.nombre}</strong>
                          <small>{usuario.telefono}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="usuario-email">
                        <Mail size={14} />
                        {usuario.correo}
                      </div>
                    </td>

                    <td>
                      <span className="usuario-role">{usuario.rol}</span>
                    </td>

                    <td>
                      <span
                        className={`usuario-status ${
                          usuario.estado === 'Activo' ? 'active' : 'inactive'
                        }`}
                      >
                        <i />
                        {usuario.estado}
                      </span>
                    </td>

                    <td>{usuario.fecha}</td>

                    <td>
                      <div className="usuarios-actions">
                        <button
                          className="view"
                          onClick={() => open('view', usuario)}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          className="edit"
                          onClick={() => open('edit', usuario)}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          className="delete"
                          onClick={() => open('delete', usuario)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="usuarios-table-footer">
          <span>Mostrando 1–8 de 10 registros</span>

          <div className="usuarios-pagination">
            <button><ChevronsLeft size={14} /></button>
            <button><ChevronLeft size={14} /></button>
            <button className="active">1</button>
            <button>2</button>
            <button><ChevronRight size={14} /></button>
            <button><ChevronsRight size={14} /></button>
          </div>
        </div>
      </div>

      {modal === 'new' && <NuevoUsuario onClose={() => setModal(null)} />}

      {modal === 'edit' && (
        <EditarUsuario
          usuario={selected}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'view' && (
        <VerUsuario
          usuario={selected}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'delete' && (
        <EliminarUsuario
          usuario={selected}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}