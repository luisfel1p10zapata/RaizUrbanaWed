import React, { useMemo, useState } from "react";
import {
  Search, Filter, Eye, Pencil, Trash2, X, Mail, Phone, IdCard,
  ShoppingBag, Activity, Lock, MapPin, ChevronsLeft, ChevronLeft,
  ChevronRight, ChevronsRight, CheckCircle2,
} from "lucide-react";
import "./Usuarios.css";

/* ============================================================
   DATA
   ============================================================ */

const AVATAR_COLORS = ["#2E9E5B", "#D6558A", "#4A76A8", "#E0973F", "#4A76D8", "#3E9BC9", "#D1495B", "#5B6FD8", "#8A6FD6", "#3EB08A"];

const ROLES = ["Administrador", "Supervisor", "Supervisora", "Vendedor", "Empleado", "Bodeguero"];

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

/* Historial / actividad — datos reales para Lucía (#2), genéricos y deterministas para el resto */
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
   SMALL PIECES
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

/* ============================================================
   MODAL SHELL
   ============================================================ */

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

/* ============================================================
   VIEW USER MODAL — "Consultar Usuario"
   ============================================================ */

function ViewUserModal({ user, index, onClose, onEdit }) {
  const historial = getHistorial(user);
  const actividad = getActividad(user);
  return (
    <ModalShell
      eyebrow={`CU.14.04 · USUARIO #${index + 1}`}
      title="Consultar Usuario"
      onClose={onClose}
      footer={<>
        <button className="ru-btn-outline" onClick={onClose}>Cerrar</button>
        <button className="ru-btn-dark" onClick={onEdit}>Editar usuario</button>
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

/* ============================================================
   FORM FIELD HELPERS
   ============================================================ */

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

/* ============================================================
   CREATE USER MODAL — "Registrar Usuario"
   ============================================================ */

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
        <button className="ru-btn-outline" onClick={onClose}>Cancelar</button>
        <button className="ru-btn-dark" disabled={!canSubmit} onClick={handleSubmit}>Registrar usuario</button>
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

/* ============================================================
   EDIT USER MODAL — "Editar Usuario"
   ============================================================ */

function EditUserModal({ user, index, onClose, onSave }) {
  const [form, setForm] = useState({ ...user });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <ModalShell
      eyebrow={`CU.14.03 · EDITANDO #${index + 1}`}
      title="Editar Usuario"
      onClose={onClose}
      footer={<>
        <button className="ru-btn-outline" onClick={onClose}>Cancelar</button>
        <button className="ru-btn-dark" onClick={() => onSave(form)}>Guardar cambios</button>
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
   PAGINATION
   ============================================================ */

function Pagination({ page, totalPages, onChange, showingFrom, showingTo, total }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="ru-pagination">
      <span className="ru-pagination-info">Mostrando {showingFrom}–{showingTo} de {total} registros</span>
      <div className="ru-pagination-controls">
        <button className="ru-page-btn" disabled={page === 1} onClick={() => onChange(1)}><ChevronsLeft size={14} /></button>
        <button className="ru-page-btn" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft size={14} /></button>
        {pages.map((p) => (
          <button key={p} className={`ru-page-btn${p === page ? " active" : ""}`} onClick={() => onChange(p)}>{p}</button>
        ))}
        <button className="ru-page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}><ChevronRight size={14} /></button>
        <button className="ru-page-btn" disabled={page === totalPages} onClick={() => onChange(totalPages)}><ChevronsRight size={14} /></button>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN MODULE
   ============================================================ */

export default function Usuarios() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos los roles");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null); // { type: 'view'|'create'|'edit', userId }

  const uniqueRoles = useMemo(() => [...new Set(users.map((u) => u.rol))], [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !search.trim() ||
        u.nombre.toLowerCase().includes(search.toLowerCase()) ||
        u.correo.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "Todos los roles" || u.rol === roleFilter;
      const matchesStatus = statusFilter === "Todos los estados" || u.estado === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, filtered.length);

  const updateFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  const activeUser = modal && modal.userId != null ? users.find((u) => u.id === modal.userId) : null;
  const activeIndex = activeUser ? users.findIndex((u) => u.id === activeUser.id) : -1;

  const handleDelete = (user) => {
    if (window.confirm(`¿Eliminar a ${user.nombre}? Esta acción no se puede deshacer.`)) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
  };

  return (
    <div className="ru-root">
      <div className="ru-page">
        <div className="ru-u-header">
          <div>
            <div className="ru-eyebrow">CU.14 · MÓDULO</div>
            <h1 className="ru-u-title">Gestión de Usuarios</h1>
            <p className="ru-u-subtitle">Administra los usuarios y sus roles en el sistema</p>
          </div>
          <button className="ru-btn-primary" onClick={() => setModal({ type: "create" })}>
            + REGISTRAR USUARIO
          </button>
        </div>

        <div className="ru-card ru-filters-card">
          <div className="ru-filters-head"><Filter size={15} /> Filtros y búsqueda</div>
          <div className="ru-filters-row">
            <div className="ru-input-wrap">
              <Search size={15} />
              <input
                className="ru-input"
                placeholder="Buscar por nombre o correo..."
                value={search}
                onChange={updateFilter(setSearch)}
              />
            </div>
            <select className="ru-select" value={roleFilter} onChange={updateFilter(setRoleFilter)}>
              <option>Todos los roles</option>
              {uniqueRoles.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select className="ru-select" value={statusFilter} onChange={updateFilter(setStatusFilter)}>
              <option>Todos los estados</option>
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>
        </div>

        <div className="ru-card ru-list-card">
          <div className="ru-list-head">
            <div className="ru-list-title">Listado de Usuarios <span className="ru-count-badge">{filtered.length}</span></div>
            <div className="ru-page-of">Página {safePage} de {totalPages}</div>
          </div>

          <div className="ru-table-scroll">
            <table className="ru-users-table">
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
                {pageItems.length === 0 && (
                  <tr className="ru-empty-row"><td colSpan={7}>No se encontraron usuarios con esos filtros.</td></tr>
                )}
                {pageItems.map((u) => {
                  const idx = users.findIndex((x) => x.id === u.id);
                  return (
                    <tr key={u.id}>
                      <td>#{idx + 1}</td>
                      <td>
                        <div className="ru-user-cell">
                          <Avatar nombre={u.nombre} id={u.id} />
                          <div>
                            <div className="ru-user-name">{u.nombre}</div>
                            <div className="ru-user-phone">{u.telefono}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ru-mail-cell"><Mail size={13} /><span>{u.correo}</span></div>
                      </td>
                      <td><span className="ru-role-pill">{u.rol}</span></td>
                      <td><StatusBadge estado={u.estado} /></td>
                      <td>{u.fecha}</td>
                      <td>
                        <div className="ru-actions">
                          <button className="ru-icon-btn view" onClick={() => setModal({ type: "view", userId: u.id })} aria-label="Ver"><Eye size={16} /></button>
                          <button className="ru-icon-btn edit" onClick={() => setModal({ type: "edit", userId: u.id })} aria-label="Editar"><Pencil size={16} /></button>
                          <button className="ru-icon-btn delete" onClick={() => handleDelete(u)} aria-label="Eliminar"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} showingFrom={showingFrom} showingTo={showingTo} total={filtered.length} />
        </div>
      </div>

      {modal?.type === "view" && activeUser && (
        <ViewUserModal
          user={activeUser}
          index={activeIndex}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "edit", userId: activeUser.id })}
        />
      )}

      {modal?.type === "create" && (
        <CreateUserModal
          nextId={Math.max(0, ...users.map((u) => u.id)) + 1}
          onClose={() => setModal(null)}
          onCreate={(newUser) => { setUsers((prev) => [...prev, newUser]); setModal(null); }}
        />
      )}

      {modal?.type === "edit" && activeUser && (
        <EditUserModal
          user={activeUser}
          index={activeIndex}
          onClose={() => setModal(null)}
          onSave={(updated) => {
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            setModal(null);
          }}
        />
      )}
    </div>
  );
}