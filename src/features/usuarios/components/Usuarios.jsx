import { useMemo, useState } from "react";
import {
  Search, Filter, Eye, Pencil, Trash2, X, Mail, Phone, IdCard,
  ShoppingBag, Activity, MapPin, ChevronsLeft, ChevronLeft,
  ChevronRight, ChevronsRight, CheckCircle2, AlertCircle, Users,
} from "lucide-react";
import AppAlert from "../../../components/ui/AppAlert";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import "../styles/Usuarios.css";

/* ============================================================
   DATA Y UTILIDADES
   ============================================================ */
const AVATAR_COLORS = ["#2E9E5B", "#D6558A", "#4A76A8", "#E0973F", "#4A76D8", "#3E9BC9", "#D1495B", "#5B6FD8", "#8A6FD6", "#3EB08A"];

const INITIAL_USERS = [
  { id: 1, cedula: "1045678901", nombre: "Carlos Mendoza", correo: "carlos.mendoza@empresa.com", telefono: "+54 11 4321-0001", rol: "Administrador", estado: "Activo", fecha: "2025-11-01", direccion: "Calle 45 # 12-30, Bogotá", genero: "Masculino", registrado: "2025-11-01" },
  { id: 2, cedula: "1098765432", nombre: "Lucía Fernández", correo: "lucia.fernandez@empresa.com", telefono: "+54 11 4321-0002", rol: "Supervisora", estado: "Activo", fecha: "2025-11-05", direccion: "Avenida 9 # 34-21, Medellín", genero: "Femenino", registrado: "2025-11-05" },
  { id: 3, cedula: "1076543219", nombre: "Martín López", correo: "martin.lopez@empresa.com", telefono: "+54 11 4321-0003", rol: "Vendedor", estado: "Activo", fecha: "2025-11-10", direccion: "Carrera 20 # 8-15, Cali", genero: "Masculino", registrado: "2025-11-10" },
  { id: 4, cedula: "1023456781", nombre: "Valentina Torres", correo: "valentina.torres@empresa.com", telefono: "+54 11 4321-0004", rol: "Empleado", estado: "Activo", fecha: "2025-11-15", direccion: "Calle 70 # 5-40, Bogotá", genero: "Femenino", registrado: "2025-11-15" },
  { id: 5, cedula: "1034567892", nombre: "Diego Ramírez", correo: "diego.ramirez@empresa.com", telefono: "+54 11 4321-0005", rol: "Bodeguero", estado: "Activo", fecha: "2025-11-20", direccion: "Calle 12 # 45-60, Barranquilla", genero: "Masculino", registrado: "2025-11-20" },
  { id: 6, cedula: "1067891234", nombre: "Sofía Gómez", correo: "sofia.gomez@empresa.com", telefono: "+54 11 4321-0006", rol: "Vendedor", estado: "Activo", fecha: "2025-12-01", direccion: "Carrera 15 # 78-22, Bogotá", genero: "Femenino", registrado: "2025-12-01" },
  { id: 7, cedula: "1012349876", nombre: "Andrés Castillo", correo: "andres.castillo@empresa.com", telefono: "+54 11 4321-0007", rol: "Empleado", estado: "Activo", fecha: "2025-12-05", direccion: "Calle 33 # 19-08, Cali", genero: "Masculino", registrado: "2025-12-05" },
  { id: 8, cedula: "1089012345", nombre: "Camila Herrera", correo: "camila.herrera@empresa.com", telefono: "+54 11 4321-0008", rol: "Supervisor", estado: "Inactivo", fecha: "2026-01-10", direccion: "Avenida 5N # 21-15, Cali", genero: "Femenino", registrado: "2026-01-10" },
  { id: 9, cedula: "1091234567", nombre: "Roberto Silva", correo: "roberto.silva@empresa.com", telefono: "+54 11 4321-0009", rol: "Bodeguero", estado: "Activo", fecha: "2026-01-15", direccion: "Calle 80 # 22-14, Bogotá", genero: "Masculino", registrado: "2026-01-15" },
  { id: 10, cedula: "1002345678", nombre: "Fernanda Ruiz", correo: "fernanda.ruiz@empresa.com", telefono: "+54 11 4321-0010", rol: "Vendedor", estado: "Activo", fecha: "2026-01-20", direccion: "Carrera 50 # 10-05, Medellín", genero: "Femenino", registrado: "2026-01-20" },
];

const PAGE_SIZE = 8;
const initials = (nombre) => nombre.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function getHistorial(user) {
  if (user.id === 2) {
    return [
      { id: "ORD-2026-001", fecha: "2026-05-20", monto: 12500, estado: "Completado" },
      { id: "ORD-2026-002", fecha: "2026-04-14", monto: 8300, estado: "Completado" },
      { id: "ORD-2026-003", fecha: "2026-03-08", monto: 21000, estado: "Completado" },
    ];
  }
  const base = user.id * 1300;
  return [
    { id: `ORD-2026-0${10 + user.id}`, fecha: "2026-05-12", monto: base + 4200, estado: "Completado" },
    { id: `ORD-2026-0${20 + user.id}`, fecha: "2026-03-28", monto: base + 1800, estado: "Completado" },
  ];
}

function getActividad(user) {
  if (user.id === 2) {
    return [
      { texto: "Inició sesión", fecha: "2026-06-23 09:04" },
      { texto: "Actualizó perfil", fecha: "2026-06-20 14:32" },
      { texto: "Generó reporte de ventas", fecha: "2026-06-18 11:05" },
      { texto: "Cambió contraseña", fecha: "2026-06-10 16:48" },
    ];
  }
  return [
    { texto: "Inició sesión", fecha: "2026-06-19 08:47" },
    { texto: "Actualizó perfil", fecha: "2026-06-05 10:15" },
  ];
}

const fmt = (n) => "$" + n.toLocaleString("es-CO");

/* ============================================================
   COMPONENTES DE APOYO (AVATAR, BADGES Y MODALES)
   ============================================================ */
function Avatar({ nombre, id, size = 42 }) {
  const color = AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length];
  return (
    <span className="ru-avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.33, borderRadius: size * 0.4 }}>
      {initials(nombre)}
    </span>
  );
}

function StatusBadge({ estado }) {
  const active = estado === "Activo";
  return (
    <span className={`ru-status ${active ? "active" : "inactive"}`}>
      <span className="dot" /> {estado}
    </span>
  );
}

function ModalShell({ eyebrow, title, onClose, children, footer }) {
  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ru-modal-header">
          <div className="ru-modal-eyebrow">{eyebrow}</div>
          <h2 className="ru-modal-title">{title}</h2>
          <button className="ru-modal-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="ru-modal-body">{children}</div>
        <div className="ru-modal-footer">{footer}</div>
      </div>
    </div>
  );
}

function ViewUserModal({ user, index, onClose, onEdit }) {
  const historial = getHistorial(user);
  const actividad = getActividad(user);
  return (
    <ModalShell
      eyebrow={`CU.14.04 · USUARIO #${index + 1}`}
      title="Consultar Usuario"
      onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cerrar</button>
        <button type="button" className="btn btn-primary" onClick={onEdit}>Editar usuario</button>
      </>}
    >
      <div className="ru-view-top">
        <Avatar nombre={user.nombre} id={user.id} size={58} />
        <div>
          <p className="ru-view-name">{user.nombre}</p>
          <p className="ru-view-registered">Registrado: {user.registrado}</p>
          <div className="ru-view-badges">
            <span className="ru-role-pill">{user.rol}</span>
            <StatusBadge estado={user.estado} />
          </div>
        </div>
      </div>
      <div className="ru-section-label"><IdCard size={13} /> INFORMACIÓN GENERAL</div>
      <div className="ru-info-grid">
        <div className="ru-info-item">
          <IdCard size={15} />
          <div><div className="ru-info-label">Cédula</div><div className="ru-info-value">{user.cedula}</div></div>
        </div>
        <div className="ru-info-item">
          <Mail size={15} />
          <div><div className="ru-info-label">Correo electrónico</div><div className="ru-info-value">{user.correo}</div></div>
        </div>
        <div className="ru-info-item">
          <Phone size={15} />
          <div><div className="ru-info-label">Teléfono</div><div className="ru-info-value">{user.telefono}</div></div>
        </div>
      </div>
      <div className="ru-section-label"><ShoppingBag size={13} /> HISTORIAL DE COMPRAS</div>
      {historial.map((h) => (
        <div className="ru-order-card" key={h.id}>
          <div>
            <div className="ru-order-id">{h.id}</div>
            <div className="ru-order-date">{h.fecha}</div>
          </div>
          <div>
            <div className="ru-order-amount">{fmt(h.monto)}</div>
            <div className="ru-order-status">{h.estado}</div>
          </div>
        </div>
      ))}
      <div className="ru-section-label"><Activity size={13} /> ACTIVIDAD RECIENTE</div>
      {actividad.map((a, i) => (
        <div className="ru-activity-item" key={i}>
          <span className="ru-activity-text"><span className="ru-activity-dot" />{a.texto}</span>
          <span className="ru-activity-time">{a.fecha}</span>
        </div>
      ))}
    </ModalShell>
  );
}

function Field({ label, required, full, children }) {
  return (
    <div className={`ru-form-field${full ? " full" : ""}`}>
      <label className="ru-form-label">{label}{required && <span className="req"> *</span>}</label>
      {children}
    </div>
  );
}

function TextInput({ icon, ...props }) {
  return (
    <div className="ru-form-input-wrap">
      {icon && <span className="leading" style={{ position: "absolute", left: 14, color: "var(--muted-text)" }}>{icon}</span>}
      <input className={`ru-form-input${icon ? " with-icon" : ""}`} {...props} />
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="ru-form-input-wrap">
      <input
        className="ru-form-input with-toggle"
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <button type="button" className="ru-toggle-eye" onClick={() => setShow((s) => !s)} aria-label="Mostrar contraseña">
        <Eye size={16} />
      </button>
    </div>
  );
}

function CreateUserModal({ nextId, onClose, onCreate }) {
  const [form, setForm] = useState({
    cedula: "", nombre: "", correo: "", password: "", confirmPassword: "",
    telefono: "", direccion: "", genero: "Masculino", rol: "Empleado",
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const canSubmit = form.cedula.trim() && form.nombre.trim();
  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreate({
      id: nextId,
      cedula: form.cedula,
      nombre: form.nombre,
      correo: form.correo || "sin.correo@empresa.com",
      telefono: form.telefono || "—",
      rol: form.rol,
      estado: "Activo",
      fecha: new Date().toISOString().slice(0, 10),
      registrado: new Date().toISOString().slice(0, 10),
      direccion: form.direccion,
      genero: form.genero,
    });
  };
  return (
    <ModalShell
      eyebrow="CU.14.02 · NUEVO USUARIO"
      title="Registrar Usuario"
      onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={!canSubmit} onClick={handleSubmit}>Registrar usuario</button>
      </>}
    >
      <div className="ru-form-grid">
        <Field label="CÉDULA" required>
          <TextInput placeholder="1023456789" value={form.cedula} onChange={set("cedula")} />
        </Field>
        <Field label="NOMBRE COMPLETO" required>
          <TextInput placeholder="Nombre y apellido" value={form.nombre} onChange={set("nombre")} />
        </Field>
        <Field label="CORREO ELECTRÓNICO">
          <TextInput icon={<Mail size={15} />} type="email" placeholder="usuario@empresa.com" value={form.correo} onChange={set("correo")} />
        </Field>
        <Field label="CONTRASEÑA">
          <PasswordInput placeholder="Mínimo 6 caracteres" value={form.password} onChange={set("password")} />
        </Field>
        <Field label="CONFIRMAR CONTRASEÑA">
          <PasswordInput placeholder="Repetir contraseña" value={form.confirmPassword} onChange={set("confirmPassword")} />
        </Field>
        <Field label="TELÉFONO">
          <TextInput icon={<Phone size={15} />} placeholder="+57 300 123-4567" value={form.telefono} onChange={set("telefono")} />
        </Field>
        <Field label="DIRECCIÓN" full>
          <TextInput icon={<MapPin size={15} />} placeholder="Calle 80 # 45-12, Bogotá" value={form.direccion} onChange={set("direccion")} />
        </Field>
        <Field label="GÉNERO">
          <select className="ru-form-input" style={{ cursor: "pointer" }} value={form.genero} onChange={set("genero")}>
            <option>Masculino</option>
            <option>Femenino</option>
            <option>Otro</option>
          </select>
        </Field>
        <Field label="ROL">
          <select className="ru-form-input" style={{ cursor: "pointer" }} value={form.rol} onChange={set("rol")}>
            {["Empleado", "Vendedor", "Bodeguero", "Supervisor", "Administrador"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
      </div>
    </ModalShell>
  );
}

function EditUserModal({ user, index, onClose, onSave }) {
  const [form, setForm] = useState({ ...user });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <ModalShell
      eyebrow={`CU.14.03 · EDITANDO #${index + 1}`}
      title="Editar Usuario"
      onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={() => onSave(form)}>Guardar cambios</button>
      </>}
    >
      <div className="ru-form-grid">
        <Field label="CÉDULA" required>
          <TextInput value={form.cedula} onChange={set("cedula")} />
        </Field>
        <Field label="NOMBRE COMPLETO" required>
          <TextInput value={form.nombre} onChange={set("nombre")} />
        </Field>
        <Field label="CORREO ELECTRÓNICO" full>
          <TextInput icon={<Mail size={15} />} type="email" value={form.correo} onChange={set("correo")} />
        </Field>
        <Field label="TELÉFONO">
          <TextInput icon={<Phone size={15} />} value={form.telefono} onChange={set("telefono")} />
        </Field>
        <Field label="DIRECCIÓN">
          <TextInput icon={<MapPin size={15} />} value={form.direccion} onChange={set("direccion")} />
        </Field>
        <Field label="GÉNERO">
          <select className="ru-form-input" style={{ cursor: "pointer" }} value={form.genero} onChange={set("genero")}>
            <option>Masculino</option>
            <option>Femenino</option>
            <option>Otro</option>
          </select>
        </Field>
        <Field label="ROL">
          <select className="ru-form-input" style={{ cursor: "pointer" }} value={form.rol} onChange={set("rol")}>
            {["Empleado", "Vendedor", "Bodeguero", "Supervisor", "Supervisora", "Administrador"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="ESTADO" full>
          <div className="ru-status-toggle-row">
            {["Activo", "Inactivo"].map((s) => {
              const selected = form.estado === s;
              return (
                <button
                  type="button"
                  key={s}
                  className={`ru-status-toggle ${selected ? `selected ${s === "Activo" ? "active" : "inactive"}` : ""}`}
                  onClick={() => setForm((f) => ({ ...f, estado: s }))}
                >
                  <span className="dot" style={selected && s === "Activo" ? { background: "var(--positive)" } : undefined} />
                  {s}
                  {selected && <CheckCircle2 size={14} className="check" />}
                </button>
              );
            })}
          </div>
        </Field>
      </div>
    </ModalShell>
  );
}



/* ============================================================
   MÓDULO PRINCIPAL
   ============================================================ */
export default function Usuarios() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos los roles");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  const uniqueRoles = useMemo(() => [...new Set(users.map((u) => u.rol))], [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.nombre.toLowerCase().includes(search.toLowerCase()) ||
        u.correo.toLowerCase().includes(search.toLowerCase()) ||
        u.cedula.includes(search);
      const matchRole = roleFilter === "Todos los roles" || u.rol === roleFilter;
      const matchStatus = statusFilter === "Todos los estados" || u.estado === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalRecords = filteredUsers.length;
  const totalPages = Math.ceil(totalRecords / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, safePage]);

  const showingFrom = totalRecords === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, totalRecords);

  const activeUser = modal?.userId ? users.find((u) => u.id === modal.userId) : null;
  const activeIndex = activeUser ? users.findIndex((u) => u.id === activeUser.id) : -1;

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const nombre = deleteTarget.nombre;
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setAlertMessage({
      type: "error",
      title: "Eliminado",
      message: `El usuario "${nombre}" fue eliminado correctamente del sistema.`,
    });
    setDeleteTarget(null);
  };

  const handleCreate = (newUser) => {
    setUsers((prev) => [newUser, ...prev]);
    setModal(null);
    setAlertMessage({
      type: "success",
      title: "¡Éxito!",
      message: `El usuario "${newUser.nombre}" fue registrado correctamente en el sistema.`,
    });
  };

  const handleSave = (updated) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setModal(null);
    setAlertMessage({
      type: "info",
      title: "Información",
      message: `Los datos del usuario "${updated.nombre}" fueron actualizados con éxito.`,
    });
  };

  const columns = [
    {
      header: "ID",
      width: "8%",
      render: (u) => {
        const realIndex = (safePage - 1) * PAGE_SIZE + (pageItems.findIndex(item => item.id === u.id) + 1);
        return <span className="ru-badge-id">#{realIndex}</span>;
      }
    },
    {
      header: "Documento",
      width: "14%",
      render: (u) => <span className="ru-badge-id">{u.cedula}</span>
    },
    {
      header: "Usuario",
      width: "22%",
      render: (u) => (
        <div className="ru-user-cell">
          <Avatar nombre={u.nombre} id={u.id} />
          <div>
            <div className="ru-user-name">{u.nombre}</div>
            <div className="ru-user-phone">{u.correo}</div>
          </div>
        </div>
      )
    },
    { header: "Teléfono", width: "13%", render: (u) => u.telefono },
    { header: "Rol", width: "13%", render: (u) => <span className="ru-role-pill">{u.rol}</span> },
    { header: "Estado", width: "10%", render: (u) => <StatusBadge estado={u.estado} /> },
    { header: "Fecha Registro", width: "12%", render: (u) => u.fecha },
    {
      header: "Acciones",
      width: "10%",
      render: (u) => (
        <div className="ru-actions">
          <button className="ru-icon-btn view" onClick={() => setModal({ type: "view", userId: u.id })} title="Ver">
            <Eye size={16} />
          </button>
          <button className="ru-icon-btn edit" onClick={() => setModal({ type: "edit", userId: u.id })} title="Editar">
            <Pencil size={16} />
          </button>
          <button className="ru-icon-btn delete" onClick={() => setDeleteTarget(u)} title="Eliminar">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="ru-root">
      <div className="ru-page">
        {/* Encabezado */}
        <div className="ru-u-header">
          <div>
            <div className="ru-eyebrow">CU.14 · MÓDULO</div>
            <h1 className="ru-u-title">Gestión de Usuarios</h1>
            <p className="ru-u-subtitle">Administra los usuarios y sus roles en el sistema</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "create" })}>
            + REGISTRAR USUARIO
          </button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="ru-card ru-filters-card">
          <div className="ru-filters-head">
            <Filter size={15} /> Filtros y búsqueda
          </div>
          <div className="ru-filters-row">
            <div className="ru-input-wrap">
              <Search size={15} />
              <input
                className="ru-input"
                placeholder="Buscar por nombre, correo o documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="ru-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="Todos los roles">Todos los roles</option>
              {uniqueRoles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              className="ru-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos los estados">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Tabla Global Integrada */}
        <div className="ru-card ru-list-card">
          <div className="ru-list-head">
            <div className="ru-list-title">
              <Users size={18} />
              <span>Lista de Usuarios</span>
              <span className="ru-count-badge">{totalRecords}</span>
            </div>
            <span className="ru-page-of">Página {safePage} de {totalPages}</span>
          </div>

          <div className="ru-table-container">
          <table className="ru-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} style={{ width: col.width }}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.length > 0 ? (
                pageItems.map((u) => (
                  <tr key={u.id}>
                    {columns.map((col, idx) => (
                      <td key={idx}>{col.render ? col.render(u) : u[col.accessor]}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="ru-no-data">No se encontraron registros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="ru-pagination">
          <span className="ru-pagination-info">Mostrando {showingFrom}–{showingTo} de {totalRecords} registros</span>
          <div className="ru-pagination-controls">
            <button className="ru-page-btn" disabled={safePage === 1} onClick={() => setPage(1)}><ChevronsLeft size={14} /></button>
            <button className="ru-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`ru-page-btn${p === safePage ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="ru-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={14} /></button>
            <button className="ru-page-btn" disabled={safePage === totalPages} onClick={() => setPage(totalPages)}><ChevronsRight size={14} /></button>
          </div>
        </div>
        </div>
      </div>

      {/* Modales */}
      {modal?.type === "view" && activeUser && (
        <ViewUserModal user={activeUser} index={activeIndex} onClose={() => setModal(null)} onEdit={() => setModal({ type: "edit", userId: activeUser.id })} />
      )}
      {modal?.type === "create" && (
        <CreateUserModal nextId={Math.max(0, ...users.map((u) => u.id), 0) + 1} onClose={() => setModal(null)} onCreate={handleCreate} />
      )}
      {modal?.type === "edit" && activeUser && (
        <EditUserModal user={activeUser} index={activeIndex} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteTarget && (
        <ConfirmModal
          title="¿Eliminar Usuario?"
          message={`Estás a punto de eliminar al usuario "${deleteTarget.nombre}". Esta acción no se puede deshacer.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          confirmText="Sí, eliminar usuario"
        />
      )}

      {/* Alerta Temporal / Toast */}
      {alertMessage && (
        <AppAlert
          type={alertMessage.type}
          title={alertMessage.title}
          message={alertMessage.message}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </div>
  );
}