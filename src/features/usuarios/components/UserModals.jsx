import React, { useState } from "react";
import { X, Mail, Phone, IdCard, MapPin, AlertTriangle } from "lucide-react";

const AVATAR_COLORS = ["#2E9E5B", "#D6558A", "#4A76A8", "#E0973F", "#4A76D8", "#3E9BC9", "#D1495B", "#5B6FD8", "#8A6FD6", "#3EB08A"];

const initials = (nombre, apellido) => `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();

export function Avatar({ nombres, apellidos, id, size = 42 }) {
  const color = AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length];
  return (
    <span className="ru-avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.33, borderRadius: size * 0.4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
      {initials(nombres, apellidos)}
    </span>
  );
}

export function StatusBadge({ estado }) {
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

function Field({ label, required, full, children, error }) {
  return (
    <div className={`ru-form-field${full ? " full" : ""}`}>
      <label className="ru-form-label">{label}{required && <span className="req"> *</span>}</label>
      {children}
      {error && <span style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}

function TextInput({ icon, ...props }) {
  return (
    <div className="ru-form-input-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && <span className="leading" style={{ position: "absolute", left: 14, color: "var(--muted-text)" }}>{icon}</span>}
      <input className={`ru-form-input${icon ? " with-icon" : ""}`} {...props} style={icon ? { paddingLeft: '40px', width: '100%' } : { width: '100%' }} />
    </div>
  );
}

export function ViewUserModal({ user, index, onClose, onEdit }) {
  return (
    <ModalShell
      eyebrow={`CU.14.04 · USUARIO #${index + 1}`}
      title="Consultar Usuario"
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
        <button className="btn btn-primary" onClick={onEdit}>Editar usuario</button>
      </>}
    >
      <div className="ru-view-top" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
        <Avatar nombres={user.nombres} apellidos={user.apellidos} id={user.id} size={58} />
        <div>
          <p className="ru-view-name" style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{user.nombres} {user.apellidos}</p>
          <p className="ru-view-registered" style={{ margin: '4px 0', fontSize: '0.85rem', color: '#777' }}>Registrado: {user.fecha}</p>
          <div className="ru-view-badges" style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <span className="ru-role-pill">{user.rol}</span>
            <StatusBadge estado={user.estado} />
          </div>
        </div>
      </div>

      <div className="modal-warning-box" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', padding: '12px', background: '#fef9e7', borderRadius: '8px', color: '#9a7d0a', fontSize: '0.85rem' }}>
        <AlertTriangle size={20} />
        <div><strong>Detalle:</strong> Documento {user.tipoDoc} - {user.numeroDoc}</div>
      </div>

      <div className="ru-section-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: '#555', marginBottom: '10px' }}><IdCard size={13} /> INFORMACIÓN DE CONTACTO Y ACCESO</div>
      <div className="ru-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="ru-info-item"><div><div className="ru-info-label" style={{ fontSize: '0.75rem', color: '#888' }}>Correo</div><div className="ru-info-value" style={{ fontWeight: 600 }}>{user.correo}</div></div></div>
        <div className="ru-info-item"><div><div className="ru-info-label" style={{ fontSize: '0.75rem', color: '#888' }}>Teléfono</div><div className="ru-info-value" style={{ fontWeight: 600 }}>{user.telefono}</div></div></div>
        <div className="ru-info-item" style={{ gridColumn: 'span 2' }}><div><div className="ru-info-label" style={{ fontSize: '0.75rem', color: '#888' }}>Dirección</div><div className="ru-info-value" style={{ fontWeight: 600 }}>{user.direccion}</div></div></div>
      </div>
    </ModalShell>
  );
}

export function CreateUserModal({ nextId, onClose, onCreate }) {
  const [form, setForm] = useState({
    nombres: "", apellidos: "", tipoDoc: "C.C.", numeroDoc: "",
    telefono: "", direccion: "", correo: "", contrasena: "", genero: "Masculino", rol: "Empleado"
  });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nombres.trim()) errs.nombres = "Obligatorio";
    if (!form.apellidos.trim()) errs.apellidos = "Obligatorio";
    if (!form.numeroDoc.trim()) errs.numeroDoc = "Obligatorio";
    if (!form.correo.trim() || !/\S+@\S+\.\S+/.test(form.correo)) errs.correo = "Correo válido requerido";
    if (!form.contrasena || form.contrasena.length < 6) errs.contrasena = "Mínimo 6 caracteres";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <ModalShell
      eyebrow="CU.14.02 · NUEVO USUARIO"
      title="Registrar Usuario"
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => validate() && onCreate({ id: nextId, ...form, estado: "Activo", fecha: new Date().toISOString().slice(0, 10) })}>Registrar usuario</button>
      </>}
    >
      <div className="ru-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="NOMBRES" required error={errors.nombres}><TextInput placeholder="Ej: Carlos" value={form.nombres} onChange={set("nombres")} /></Field>
        <Field label="APELLIDOS" required error={errors.apellidos}><TextInput placeholder="Ej: Mendoza" value={form.apellidos} onChange={set("apellidos")} /></Field>
        <Field label="TIPO DOC">
          <select className="ru-form-input" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} value={form.tipoDoc} onChange={set("tipoDoc")}>
            <option>C.C.</option><option>C.E.</option><option>Pasaporte</option><option>T.I.</option>
          </select>
        </Field>
        <Field label="NÚMERO DOC" required error={errors.numeroDoc}><TextInput placeholder="1023456789" value={form.numeroDoc} onChange={set("numeroDoc")} /></Field>
        <Field label="CORREO" required error={errors.correo}><TextInput icon={<Mail size={15} />} type="email" placeholder="correo@empresa.com" value={form.correo} onChange={set("correo")} /></Field>
        <Field label="CONTRASEÑA" required error={errors.contrasena}><TextInput type="password" placeholder="******" value={form.contrasena} onChange={set("contrasena")} /></Field>
        <Field label="TELÉFONO"><TextInput icon={<Phone size={15} />} placeholder="+57 300..." value={form.telefono} onChange={set("telefono")} /></Field>
        <Field label="GÉNERO">
          <select className="ru-form-input" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} value={form.genero} onChange={set("genero")}>
            <option>Masculino</option><option>Femenino</option><option>Otro</option>
          </select>
        </Field>
        <Field label="DIRECCIÓN" full><TextInput icon={<MapPin size={15} />} placeholder="Calle 80..." value={form.direccion} onChange={set("direccion")} /></Field>
        <Field label="ROL">
          <select className="ru-form-input" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} value={form.rol} onChange={set("rol")}>
            <option>Administrador</option><option>Supervisor</option><option>Vendedor</option><option>Bodeguero</option><option>Empleado</option>
          </select>
        </Field>
      </div>
    </ModalShell>
  );
}

export function EditUserModal({ user, index, onClose, onSave }) {
  const [form, setForm] = useState({ ...user });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nombres.trim()) errs.nombres = "Obligatorio";
    if (!form.apellidos.trim()) errs.apellidos = "Obligatorio";
    if (!form.numeroDoc.trim()) errs.numeroDoc = "Obligatorio";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <ModalShell
      eyebrow={`CU.14.03 · EDITANDO #${index + 1}`}
      title="Editar Usuario / Cliente"
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => validate() && onSave(form)}>Guardar cambios</button>
      </>}
    >
      <div className="ru-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="NOMBRES" required error={errors.nombres}><TextInput value={form.nombres} onChange={set("nombres")} /></Field>
        <Field label="APELLIDOS" required error={errors.apellidos}><TextInput value={form.apellidos} onChange={set("apellidos")} /></Field>
        <Field label="NÚMERO DOC" required error={errors.numeroDoc}><TextInput value={form.numeroDoc} onChange={set("numeroDoc")} /></Field>
        <Field label="TELÉFONO"><TextInput value={form.telefono} onChange={set("telefono")} /></Field>
        <Field label="CORREO" full><TextInput value={form.correo} onChange={set("correo")} /></Field>
        <Field label="DIRECCIÓN" full><TextInput value={form.direccion} onChange={set("direccion")} /></Field>
        <Field label="ESTADO">
          <select className="ru-form-input" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} value={form.estado} onChange={set("estado")}>
            <option>Activo</option><option>Inactivo</option>
          </select>
        </Field>
        <Field label="ROL">
          <select className="ru-form-input" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} value={form.rol} onChange={set("rol")}>
            <option>Administrador</option><option>Supervisor</option><option>Vendedor</option><option>Bodeguero</option><option>Empleado</option>
          </select>
        </Field>
      </div>
    </ModalShell>
  );
}