import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerAuxiliaresUsuarios,
  crearUsuario,
  actualizarUsuario,
  validarTokenActivacion,
  activarUsuarioConToken,
} from "../services/usuariosService";
import {
  Eye, EyeOff, Pencil, UserX, UserCheck, X, Mail, Phone, IdCard,
  MapPin, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  CheckCircle2, AlertCircle, Users, UserPlus, Copy, Check, ShieldCheck, KeyRound, Lock, AlertTriangle
} from "lucide-react";
import FiltrarBuscarGlobal from "../../../components/ui/FiltrarBuscarGlobal";
import AppAlert from "../../../components/ui/AppAlert";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import {
  getDocumentoConfig,
  formatearEntradaDocumento,
  validarNumeroDocumento,
} from "../utils/documentoValidation";
import "../styles/Usuarios.css";
import "../styles/ModalsUsuarios.css";

/* ============================================================
   DATA Y UTILIDADES
   ============================================================ */
const AVATAR_COLORS = [
  "#2E9E5B", "#D6558A", "#4A76A8", "#E0973F", "#4A76D8",
  "#3E9BC9", "#D1495B", "#5B6FD8", "#8A6FD6", "#3EB08A"
];

const MAX_PAGE_SIZE = 10;

const calcularPageSizeInicial = () => {
  if (typeof window === "undefined") return MAX_PAGE_SIZE;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 768) return 6;
  const rowH = h <= 780 ? 44 : 50;
  const overhead = h <= 780 ? 258 : 328;
  return Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor((h - overhead) / rowH)));
};

const getVisiblePages = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const initials = (nombre) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/* ============================================================
   COMPONENTES VISUALES BASE
   ============================================================ */
function Avatar({ nombre, id, size }) {
  const color = AVATAR_COLORS[Math.abs((id || 1) - 1) % AVATAR_COLORS.length];
  const style = size
    ? {
        background: color,
        width: size,
        height: size,
        fontSize: size * 0.33,
        borderRadius: size * 0.4,
      }
    : { background: color };

  return (
    <span className="ru-u-avatar" style={style}>
      {initials(nombre)}
    </span>
  );
}

function StatusBadge({ estado }) {
  const norm = (estado || "Activo").toLowerCase();
  const cls = norm === "activo" ? "active" : norm === "pendiente" ? "pending" : "inactive";
  return (
    <span className={`ru-status ${cls}`}>
      <span className="dot" /> {estado}
    </span>
  );
}

function ModalShell({ eyebrow, title, onClose, children, footer, maxWidth = 620 }) {
  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div className="ru-modal-header">
          <div className="ru-modal-eyebrow">{eyebrow}</div>
          <h2 className="ru-modal-title">{title}</h2>
          <button className="ru-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="ru-modal-body">{children}</div>
        {footer && <div className="ru-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, required, full, children, error, hint }) {
  return (
    <div className={`ru-form-field${full ? " full" : ""}`}>
      <label className="ru-form-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {children}
      {error && (
        <span className="ru-field-error">
          <AlertCircle size={13} /> {error}
        </span>
      )}
      {!error && hint && <span className="ru-field-hint">{hint}</span>}
    </div>
  );
}

function TextInput({ icon, error, ...props }) {
  return (
    <div className="ru-form-input-wrap">
      {icon && (
        <span className="leading" style={{ position: "absolute", left: 14, color: "var(--muted-text)" }}>
          {icon}
        </span>
      )}
      <input
        className={`ru-form-input${icon ? " with-icon" : ""}${error ? " is-invalid" : ""}`}
        {...props}
      />
    </div>
  );
}

/* ============================================================
   MODAL: CONSULTAR DETALLE DE USUARIO
   ============================================================ */
function ViewUserModal({ user, index, onClose, onEdit, onActivate }) {
  const isPending = (user.estado || "").toLowerCase() === "pendiente";

  return (
    <ModalShell
      eyebrow={`CU.14.04 · USUARIO #${index + 1}`}
      title="Consultar Usuario"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cerrar
          </button>
          {isPending && onActivate && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ color: "var(--warn-amber)", borderColor: "var(--warn-amber)" }}
              onClick={onActivate}
            >
              <KeyRound size={15} style={{ marginRight: 6 }} /> Activar Cuenta
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            Editar usuario
          </button>
        </>
      }
    >
      <div className="ru-view-top">
        <Avatar nombre={user.nombre} id={user.id} size={58} />
        <div>
          <p className="ru-view-name">{user.nombre}</p>
          <p className="ru-view-registered">Registrado: {user.registrado || user.fecha}</p>
          <div className="ru-view-badges">
            <span className="ru-role-pill">{user.rol}</span>
            <StatusBadge estado={user.estado} />
          </div>
        </div>
      </div>

      {isPending && (
        <div className="ru-activation-banner" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <AlertTriangle size={20} style={{ color: "var(--warn-amber)", flexShrink: 0 }} />
          <div style={{ fontSize: "12.5px", color: "var(--primary)" }}>
            <strong>Usuario pendiente de activación:</strong> Este usuario no tiene contraseña asignada aún. Se le ha enviado un enlace de activación para configurar su clave.
          </div>
        </div>
      )}

      <div className="ru-section-label">
        <IdCard size={13} /> INFORMACIÓN DE IDENTIFICACIÓN Y CONTACTO
      </div>
      <div className="ru-info-grid">
        <div className="ru-info-item">
          <IdCard size={15} />
          <div>
            <div className="ru-info-label">Tipo y Número de Documento</div>
            <div className="ru-info-value">{user.tipoDoc ? `${user.tipoDoc} - ` : ""}{user.cedula}</div>
          </div>
        </div>
        <div className="ru-info-item">
          <Mail size={15} />
          <div>
            <div className="ru-info-label">Correo electrónico</div>
            <div className="ru-info-value">{user.correo}</div>
          </div>
        </div>
        <div className="ru-info-item">
          <Phone size={15} />
          <div>
            <div className="ru-info-label">Teléfono</div>
            <div className="ru-info-value">{user.telefono || "No registrado"}</div>
          </div>
        </div>
        <div className="ru-info-item">
          <MapPin size={15} />
          <div>
            <div className="ru-info-label">Dirección</div>
            <div className="ru-info-value">{user.direccion || "No registrada"}</div>
          </div>
        </div>
        <div className="ru-info-item">
          <Users size={15} />
          <div>
            <div className="ru-info-label">Género</div>
            <div className="ru-info-value">{user.genero || "No especificado"}</div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

/* ============================================================
   MODAL: REGISTRAR USUARIO (SIN CONTRASEÑA - ADMIN FLOW)
   Alineado 100% con tb_usuario (NOT NULL, longitudes) y tb_roles activos
   ============================================================ */
function CreateUserModal({ nextId, onClose, onCreate, rolesDisponibles = [], tiposDocDisponibles = [], cargandoAux = false }) {
  const defaultRol = rolesDisponibles.find((r) => r.nombre === "Empleado")?.nombre || rolesDisponibles[0]?.nombre || "";
  const defaultTipoDoc = tiposDocDisponibles[0]?.valor || "C.C.";

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    tipoDoc: defaultTipoDoc,
    numeroDoc: "",
    correo: "",
    telefono: "",
    direccion: "",
    genero: "Masculino",
    rol: defaultRol,
  });

  const tipoDocActual = form.tipoDoc || defaultTipoDoc;
  const rolActual = form.rol || defaultRol;

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const docConfig = getDocumentoConfig(tipoDocActual);

  // Validación alineada a restricciones reales de tb_usuario en Supabase
  const validarCampo = (campo, valor, tipoDocRef = tipoDocActual) => {
    const val = (valor || "").trim();

    switch (campo) {
      case "nombres":
        if (!val) return "El nombre es obligatorio.";
        if (val.length < 2) return "Mínimo 2 caracteres.";
        if (val.length > 50) return "Máximo 50 caracteres.";
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val)) return "Solo se permiten letras y espacios.";
        return null;

      case "apellidos":
        if (!val) return "El apellido es obligatorio.";
        if (val.length < 2) return "Mínimo 2 caracteres.";
        if (val.length > 50) return "Máximo 50 caracteres.";
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val)) return "Solo se permiten letras y espacios.";
        return null;

      case "tipoDoc":
        if (!val) return "Selecciona un tipo de documento.";
        return null;

      case "numeroDoc":
        return validarNumeroDocumento(tipoDocRef, val);

      case "correo":
        if (!val) return "El correo electrónico es obligatorio.";
        if (val.length > 100) return "Máximo 100 caracteres.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Ingresa un correo válido (ej: usuario@empresa.com).";
        return null;

      case "telefono":
        if (!val) return "El teléfono es obligatorio.";
        if (val.length > 15) return "Máximo 15 caracteres.";
        if (!/^\+?[\d\s-]{7,15}$/.test(val)) {
          return "Teléfono inválido (entre 7 y 15 caracteres).";
        }
        return null;

      case "direccion":
        if (!val) return "La dirección es obligatoria.";
        if (val.length < 3) return "Mínimo 3 caracteres.";
        if (val.length > 100) return "Máximo 100 caracteres.";
        return null;

      case "rol":
        if (!val) return "Selecciona un rol activo.";
        return null;

      case "genero":
        if (!val) return "Selecciona un género.";
        return null;

      default:
        return null;
    }
  };

  const handleBlur = (campo) => {
    setTouched((prev) => ({ ...prev, [campo]: true }));
    const val = campo === "rol" ? rolActual : campo === "tipoDoc" ? tipoDocActual : form[campo];
    const err = validarCampo(campo, val, tipoDocActual);
    setErrors((prev) => ({ ...prev, [campo]: err }));
  };

  const handleChange = (campo, valor) => {
    if (campo === "tipoDoc") {
      const nextNumero = formatearEntradaDocumento(valor, form.numeroDoc);
      setForm((prev) => ({ ...prev, tipoDoc: valor, numeroDoc: nextNumero }));
      const errTipo = validarCampo("tipoDoc", valor, valor);
      const errDoc = nextNumero.trim() ? validarNumeroDocumento(valor, nextNumero) : null;
      if (nextNumero.trim()) {
        setTouched((prev) => ({ ...prev, numeroDoc: true }));
      }
      setErrors((prev) => ({ ...prev, tipoDoc: errTipo, numeroDoc: errDoc }));
      return;
    }

    if (campo === "numeroDoc") {
      const formatted = formatearEntradaDocumento(tipoDocActual, valor);
      setForm((prev) => ({ ...prev, numeroDoc: formatted }));
      const errDoc = validarNumeroDocumento(tipoDocActual, formatted);
      setErrors((prev) => ({ ...prev, numeroDoc: errDoc }));
      return;
    }

    setForm((prev) => ({ ...prev, [campo]: valor }));
    const err = validarCampo(campo, valor, tipoDocActual);
    setErrors((prev) => ({ ...prev, [campo]: err }));
  };

  const validarTodo = () => {
    const nuevosErrores = {};
    const camposObligatorios = ["nombres", "apellidos", "tipoDoc", "numeroDoc", "correo", "telefono", "direccion", "rol", "genero"];
    const formEfectivo = { ...form, tipoDoc: tipoDocActual, rol: rolActual };

    camposObligatorios.forEach((campo) => {
      const err = validarCampo(campo, formEfectivo[campo], tipoDocActual);
      if (err) nuevosErrores[campo] = err;
    });

    setTouched(camposObligatorios.reduce((acc, c) => ({ ...acc, [c]: true }), {}));
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const isFormValid = useMemo(() => {
    const formEfectivo = { ...form, tipoDoc: tipoDocActual, rol: rolActual };
    const camposReq = ["nombres", "apellidos", "tipoDoc", "numeroDoc", "correo", "telefono", "direccion", "rol", "genero"];
    const tieneVacios = camposReq.some((c) => !formEfectivo[c] || !String(formEfectivo[c]).trim());
    if (tieneVacios) return false;
    if (validarNumeroDocumento(tipoDocActual, form.numeroDoc)) return false;
    const tieneErrores = Object.values(errors).some((e) => Boolean(e));
    return !tieneErrores;
  }, [form, tipoDocActual, rolActual, errors]);

  const handleSubmit = async () => {
    if (!validarTodo() || submitting) return;
    setSubmitting(true);
    try {
      await onCreate({
        id: nextId,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        tipoDoc: tipoDocActual,
        numeroDoc: form.numeroDoc.trim(),
        correo: form.correo.trim().toLowerCase(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        genero: form.genero,
        rol: rolActual,
        contrasena: null, // Admin flow: no password set by admin
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      eyebrow="CU.14.02 · NUEVO USUARIO"
      title="Registrar Usuario"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isFormValid || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Registrando..." : "Registrar usuario"}
          </button>
        </>
      }
    >
      {/* Banner Informativo de Seguridad */}
      <div
        style={{
          background: "rgba(154, 140, 152, 0.12)",
          border: "1px solid var(--accent)",
          borderRadius: "10px",
          padding: "12px 14px",
          marginBottom: "18px",
          fontSize: "12.5px",
          color: "var(--primary)",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
        }}
      >
        <Lock size={18} style={{ color: "var(--warn-amber)", marginTop: 2, flexShrink: 0 }} />
        <div>
          <strong>Política de seguridad:</strong> El administrador no define contraseñas.
          Al guardar, el usuario quedará en estado <strong>Pendiente</strong> y se generará un enlace único
          de activación con validez de 48 horas enviado por correo para que el usuario configure su propia contraseña.
        </div>
      </div>

      <div className="ru-form-grid">
        <Field label="NOMBRES" required error={touched.nombres && errors.nombres}>
          <TextInput
            placeholder="Ej: Carlos Andrés"
            maxLength={50}
            value={form.nombres}
            error={touched.nombres && errors.nombres}
            onChange={(e) => handleChange("nombres", e.target.value)}
            onBlur={() => handleBlur("nombres")}
          />
        </Field>

        <Field label="APELLIDOS" required error={touched.apellidos && errors.apellidos}>
          <TextInput
            placeholder="Ej: Mendoza Gómez"
            maxLength={50}
            value={form.apellidos}
            error={touched.apellidos && errors.apellidos}
            onChange={(e) => handleChange("apellidos", e.target.value)}
            onBlur={() => handleBlur("apellidos")}
          />
        </Field>

        <Field label="TIPO DE DOCUMENTO" required error={touched.tipoDoc && errors.tipoDoc}>
          <select
            className={`ru-form-input ru-select ${touched.tipoDoc && errors.tipoDoc ? "is-invalid" : ""}`}
            style={{ cursor: "pointer" }}
            value={tipoDocActual}
            disabled={cargandoAux || tiposDocDisponibles.length === 0}
            onChange={(e) => handleChange("tipoDoc", e.target.value)}
            onBlur={() => handleBlur("tipoDoc")}
          >
            {tiposDocDisponibles.length === 0 && (
              <option value="">{cargandoAux ? "Cargando tipos..." : "Sin tipos de documento"}</option>
            )}
            {tiposDocDisponibles.map((td) => (
              <option key={td.id || td.valor} value={td.valor}>
                {td.nombre} ({td.sigla || td.valor})
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="NÚMERO DE DOCUMENTO"
          required
          error={touched.numeroDoc && errors.numeroDoc}
          hint={docConfig.hint}
        >
          <TextInput
            placeholder={docConfig.placeholder}
            maxLength={docConfig.maxLength}
            inputMode={docConfig.inputMode}
            value={form.numeroDoc}
            error={touched.numeroDoc && errors.numeroDoc}
            onChange={(e) => handleChange("numeroDoc", e.target.value)}
            onBlur={() => handleBlur("numeroDoc")}
          />
        </Field>

        <Field label="CORREO ELECTRÓNICO" required full error={touched.correo && errors.correo}>
          <TextInput
            icon={<Mail size={15} />}
            type="email"
            maxLength={100}
            placeholder="correo@empresa.com"
            value={form.correo}
            error={touched.correo && errors.correo}
            onChange={(e) => handleChange("correo", e.target.value)}
            onBlur={() => handleBlur("correo")}
          />
        </Field>

        <Field label="TELÉFONO" required error={touched.telefono && errors.telefono}>
          <TextInput
            icon={<Phone size={15} />}
            maxLength={15}
            placeholder="Ej: 3001234567"
            value={form.telefono}
            error={touched.telefono && errors.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            onBlur={() => handleBlur("telefono")}
          />
        </Field>

        <Field label="GÉNERO" required error={touched.genero && errors.genero}>
          <select
            className={`ru-form-input ru-select ${touched.genero && errors.genero ? "is-invalid" : ""}`}
            style={{ cursor: "pointer" }}
            value={form.genero}
            onChange={(e) => handleChange("genero", e.target.value)}
            onBlur={() => handleBlur("genero")}
          >
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </Field>

        <Field label="DIRECCIÓN" required full error={touched.direccion && errors.direccion}>
          <TextInput
            icon={<MapPin size={15} />}
            maxLength={100}
            placeholder="Calle 80 # 45-12, Medellín"
            value={form.direccion}
            error={touched.direccion && errors.direccion}
            onChange={(e) => handleChange("direccion", e.target.value)}
            onBlur={() => handleBlur("direccion")}
          />
        </Field>

        <Field label="ROL EN EL SISTEMA" required full error={touched.rol && errors.rol}>
          <select
            className={`ru-form-input ru-select ${touched.rol && errors.rol ? "is-invalid" : ""}`}
            style={{ cursor: "pointer" }}
            value={rolActual}
            disabled={cargandoAux || rolesDisponibles.length === 0}
            onChange={(e) => handleChange("rol", e.target.value)}
            onBlur={() => handleBlur("rol")}
          >
            {rolesDisponibles.length === 0 && (
              <option value="">{cargandoAux ? "Cargando roles activos..." : "Sin roles activos"}</option>
            )}
            {rolesDisponibles.map((r) => (
              <option key={r.id || r.nombre} value={r.nombre}>
                {r.nombre}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </ModalShell>
  );
}

/* ============================================================
   MODAL: CONFIRMACIÓN Y ENLACE DE ACTIVACIÓN
   ============================================================ */
function ActivationSuccessModal({ user, onClose, onActivateNow }) {
  const [copied, setCopied] = useState(false);
  const enlace = user.enlaceActivacion || `http://localhost:5173/activar-cuenta?token=${user.tokenActivacion || ""}`;

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(enlace);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <ModalShell
      eyebrow="REGISTRO EXITOSO · SEGURIDAD"
      title="Usuario Registrado"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cerrar
          </button>
          {user.tokenActivacion && onActivateNow && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onActivateNow(user.tokenActivacion, user)}
            >
              Configurar Contraseña Ahora
            </button>
          )}
        </>
      }
    >
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <div style={{ color: "var(--positive)", display: "inline-block", marginBottom: "10px" }}>
          <ShieldCheck size={48} />
        </div>
        <h3 style={{ fontSize: "18px", color: "var(--primary)", margin: "0 0 6px" }}>
          {user.nombres} {user.apellidos}
        </h3>
        <p style={{ fontSize: "13px", color: "var(--muted-text)", margin: 0 }}>
          Ha sido registrado en PostgreSQL en estado <strong style={{ color: "var(--warn-amber)" }}>Pendiente</strong>.
        </p>
      </div>

      <div className="ru-activation-banner">
        <div style={{ fontSize: "13px", color: "var(--primary)", marginBottom: "8px" }}>
          📧 <strong>Correo de activación enviado:</strong> Se ha despachado el mensaje a <strong>{user.correo}</strong> con el enlace de activación seguro (vigente por 48 horas).
        </div>
        <div style={{ fontSize: "12px", color: "var(--secondary)" }}>
          El usuario puede activar su cuenta pulsando el botón en su correo, o puedes copiar el enlace directo aquí:
        </div>
        <div className="ru-activation-link-box">
          <input
            type="text"
            readOnly
            value={enlace}
            className="ru-activation-link-input"
            onClick={(e) => e.target.select()}
          />
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: "6px 12px", fontSize: "12px", display: "flex", gap: "6px", alignItems: "center" }}
            onClick={handleCopy}
          >
            {copied ? <Check size={14} color="var(--positive)" /> : <Copy size={14} />}
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ============================================================
   MODAL: ACTIVAR CUENTA Y ESTABLECER CONTRASEÑA
   ============================================================ */
function ActivarCuentaModal({ token, user, onClose, onActivated }) {
  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [errorToken, setErrorToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function validar() {
      try {
        const res = await validarTokenActivacion(token);
        if (res && res.valido) {
          setTokenInfo(res);
        } else {
          setErrorToken(res?.mensaje || "El enlace de activación ya fue utilizado o ha expirado.");
        }
      } catch (err) {
        setErrorToken(err.message || "Error al validar el enlace.");
      } finally {
        setLoading(false);
      }
    }
    if (token) validar();
  }, [token]);

  // Reglas de contraseña en tiempo real
  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    match: password.length > 0 && password === confirmPassword,
  };

  const isFormValid = rules.length && rules.upper && rules.lower && rules.number && rules.match;

  const handleSubmit = async () => {
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const resp = await activarUsuarioConToken(token, password);
      onActivated(resp);
    } catch (err) {
      setSubmitError(err.message || "No se pudo activar la cuenta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      eyebrow="CU.14.05 · ACTIVACIÓN DE CUENTA"
      title="Configurar Contraseña"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          {!errorToken && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!isFormValid || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Activando..." : "Guardar contraseña y activar"}
            </button>
          )}
        </>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted-text)" }}>
          Verificando enlace de activación con la base de datos...
        </div>
      ) : errorToken ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <AlertCircle size={40} style={{ color: "var(--negative)", margin: "0 auto 10px" }} />
          <h3 style={{ fontSize: "16px", color: "var(--primary)" }}>Enlace Inválido</h3>
          <p style={{ fontSize: "13px", color: "var(--muted-text)" }}>{errorToken}</p>
        </div>
      ) : (
        <div>
          <div
            style={{
              background: "var(--background)",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "16px",
              fontSize: "12.5px",
            }}
          >
            <div><strong>Usuario:</strong> {tokenInfo?.nombre || user?.nombre || "Usuario"}</div>
            <div style={{ color: "var(--muted-text)", marginTop: 2 }}>
              <strong>Correo:</strong> {tokenInfo?.correo || user?.correo}
            </div>
          </div>

          {submitError && (
            <div className="ru-field-error" style={{ marginBottom: "14px", fontSize: "12.5px" }}>
              <AlertCircle size={15} /> {submitError}
            </div>
          )}

          <div style={{ marginBottom: "14px" }}>
            <label className="ru-form-label">
              NUEVA CONTRASEÑA <span className="req">*</span>
            </label>
            <div className="ru-form-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className={`ru-form-input with-toggle ${password && !rules.length ? "is-invalid" : ""}`}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="ru-toggle-eye"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Mostrar contraseña"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label className="ru-form-label">
              CONFIRMAR CONTRASEÑA <span className="req">*</span>
            </label>
            <div className="ru-form-input-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                className={`ru-form-input with-toggle ${confirmPassword && !rules.match ? "is-invalid" : ""}`}
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="ru-toggle-eye"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label="Mostrar contraseña"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && !rules.match && (
              <span className="ru-field-error">
                <AlertCircle size={13} /> Las contraseñas no coinciden.
              </span>
            )}
          </div>

          {/* Checklist de requisitos en tiempo real */}
          <div className="ru-pwd-rules">
            <div className={`ru-pwd-rule ${rules.length ? "valid" : ""}`}>
              {rules.length ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>Mínimo 8 caracteres</span>
            </div>
            <div className={`ru-pwd-rule ${rules.upper ? "valid" : ""}`}>
              {rules.upper ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>Al menos una letra mayúscula (A-Z)</span>
            </div>
            <div className={`ru-pwd-rule ${rules.lower ? "valid" : ""}`}>
              {rules.lower ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>Al menos una letra minúscula (a-z)</span>
            </div>
            <div className={`ru-pwd-rule ${rules.number ? "valid" : ""}`}>
              {rules.number ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>Al menos un número (0-9)</span>
            </div>
            <div className={`ru-pwd-rule ${rules.match ? "valid" : ""}`}>
              {rules.match ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>Las contraseñas coinciden exactamente</span>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

/* ============================================================
   MODAL: EDITAR USUARIO (Precarga fresca desde PostgreSQL)
   ============================================================ */
function EditUserModal({ user, index, onClose, onSave, rolesDisponibles = [] }) {
  // Separar nombre en nombres y apellidos si es necesario
  const partes = (user.nombre || "").trim().split(/\s+/);
  const initialNombres = user.nombres || (partes.length > 1 ? partes.slice(0, partes.length - 1).join(" ") : partes[0] || "");
  const initialApellidos = user.apellidos || (partes.length > 1 ? partes[partes.length - 1] : "");

  const [form, setForm] = useState({
    ...user,
    nombres: initialNombres,
    apellidos: initialApellidos,
    tipoDoc: user.tipoDoc || "C.C.",
    cedula: user.cedula || user.numeroDoc || "",
    telefono: user.telefono === "—" ? "" : user.telefono || "",
    direccion: user.direccion || "",
    genero: user.genero || "Masculino",
    rol: user.rol || "",
    estado: user.estado || "Activo",
  });

  // Precargar los datos más frescos directamente desde Supabase (GET /api/usuarios/{id})
  useEffect(() => {
    let activo = true;
    obtenerUsuarioPorId(user.id)
      .then((fresco) => {
        if (!activo || !fresco) return;
        setForm((prev) => ({
          ...prev,
          ...fresco,
          nombres: fresco.nombres || prev.nombres,
          apellidos: fresco.apellidos || prev.apellidos,
          tipoDoc: fresco.tipoDoc || prev.tipoDoc,
          cedula: fresco.numeroDoc || prev.cedula,
          correo: fresco.correo || prev.correo,
          telefono: fresco.telefono || "",
          direccion: fresco.direccion || "",
          genero: fresco.genero || prev.genero || "Masculino",
          rol: fresco.rol || prev.rol,
          estado: fresco.estado || prev.estado,
        }));
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [user.id]);

  const rolesLista = useMemo(() => {
    const base = Array.isArray(rolesDisponibles) ? rolesDisponibles : [];
    const existeActual = base.some((r) => r.nombre.toLowerCase() === (form.rol || "").toLowerCase());
    if (form.rol && !existeActual) {
      return [...base, { id: `actual-${form.rol}`, nombre: form.rol }];
    }
    return base;
  }, [rolesDisponibles, form.rol]);

  const isPendingUser = (user.estado || "").toLowerCase() === "pendiente";

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const validarCampo = (campo, valor) => {
    const val = (valor || "").trim();
    if (campo === "nombres" && (!val || val.length < 2 || val.length > 50)) return "Nombres obligatorios (2 a 50 caracteres).";
    if (campo === "apellidos" && (!val || val.length < 2 || val.length > 50)) return "Apellidos obligatorios (2 a 50 caracteres).";
    if (campo === "correo" && (!val || val.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))) return "Correo inválido (máx. 100 caracteres).";
    if (campo === "telefono" && (!val || val.length > 15 || !/^\+?[\d\s-]{7,15}$/.test(val))) return "Teléfono obligatorio (7 a 15 caracteres).";
    if (campo === "direccion" && (!val || val.length < 3 || val.length > 100)) return "Dirección obligatoria (3 a 100 caracteres).";
    return null;
  };

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    const err = validarCampo(campo, valor);
    setErrors((prev) => ({ ...prev, [campo]: err }));
  };

  const handleBlur = (campo) => {
    setTouched((prev) => ({ ...prev, [campo]: true }));
    const err = validarCampo(campo, form[campo]);
    setErrors((prev) => ({ ...prev, [campo]: err }));
  };

  const isFormValid =
    form.nombres.trim().length >= 2 &&
    form.nombres.trim().length <= 50 &&
    form.apellidos.trim().length >= 2 &&
    form.apellidos.trim().length <= 50 &&
    form.correo.trim().length > 3 &&
    form.telefono.trim().length >= 7 &&
    form.direccion.trim().length >= 3 &&
    Boolean(form.rol) &&
    !errors.nombres &&
    !errors.apellidos &&
    !errors.correo &&
    !errors.telefono &&
    !errors.direccion;

  return (
    <ModalShell
      eyebrow={`CU.14.03 · EDITANDO #${index + 1}`}
      title="Editar Usuario"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isFormValid}
            onClick={() => onSave({ ...form, nombre: `${form.nombres} ${form.apellidos}`.trim() })}
          >
            Guardar cambios
          </button>
        </>
      }
    >
      <div className="ru-form-grid">
        <Field label="NOMBRES" required error={touched.nombres && errors.nombres}>
          <TextInput
            maxLength={50}
            value={form.nombres}
            error={touched.nombres && errors.nombres}
            onChange={(e) => handleChange("nombres", e.target.value)}
            onBlur={() => handleBlur("nombres")}
          />
        </Field>

        <Field label="APELLIDOS" required error={touched.apellidos && errors.apellidos}>
          <TextInput
            maxLength={50}
            value={form.apellidos}
            error={touched.apellidos && errors.apellidos}
            onChange={(e) => handleChange("apellidos", e.target.value)}
            onBlur={() => handleBlur("apellidos")}
          />
        </Field>

        <Field label="DOCUMENTO (SOLO LECTURA)">
          <TextInput
            value={`${form.tipoDoc ? `${form.tipoDoc} ` : ""}${form.cedula}`}
            disabled
            style={{ opacity: 0.7, cursor: "not-allowed" }}
          />
        </Field>

        <Field label="TELÉFONO" required error={touched.telefono && errors.telefono}>
          <TextInput
            icon={<Phone size={15} />}
            maxLength={15}
            value={form.telefono}
            error={touched.telefono && errors.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            onBlur={() => handleBlur("telefono")}
          />
        </Field>

        <Field label="CORREO ELECTRÓNICO" required full error={touched.correo && errors.correo}>
          <TextInput
            icon={<Mail size={15} />}
            type="email"
            maxLength={100}
            value={form.correo}
            error={touched.correo && errors.correo}
            onChange={(e) => handleChange("correo", e.target.value)}
            onBlur={() => handleBlur("correo")}
          />
        </Field>

        <Field label="DIRECCIÓN" required full error={touched.direccion && errors.direccion}>
          <TextInput
            icon={<MapPin size={15} />}
            maxLength={100}
            value={form.direccion}
            error={touched.direccion && errors.direccion}
            onChange={(e) => handleChange("direccion", e.target.value)}
            onBlur={() => handleBlur("direccion")}
          />
        </Field>

        <Field label="GÉNERO" required>
          <select
            className="ru-form-input ru-select"
            style={{ cursor: "pointer" }}
            value={form.genero}
            onChange={(e) => handleChange("genero", e.target.value)}
          >
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </Field>

        <Field label="ROL EN EL SISTEMA" required>
          <select
            className="ru-form-input ru-select"
            style={{ cursor: "pointer" }}
            value={form.rol}
            onChange={(e) => handleChange("rol", e.target.value)}
          >
            {rolesLista.map((r) => (
              <option key={r.id || r.nombre} value={r.nombre}>
                {r.nombre}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="ESTADO DEL USUARIO"
          full
          hint={
            isPendingUser
              ? "Este usuario aún no ha configurado su contraseña (estado Pendiente). Activa su cuenta con el enlace de activación antes de pasarlo a Activo."
              : undefined
          }
        >
          <div className="ru-status-toggle-row">
            {(isPendingUser ? ["Pendiente", "Inactivo"] : ["Activo", "Inactivo"]).map((s) => {
              const selected = form.estado === s;
              return (
                <button
                  type="button"
                  key={s}
                  className={`ru-status-toggle ${selected ? `selected ${s === "Activo" ? "active" : "inactive"}` : ""}`}
                  onClick={() => handleChange("estado", s)}
                >
                  <span
                    className="dot"
                    style={
                      selected && s === "Activo"
                        ? { background: "var(--positive)" }
                        : selected && s === "Pendiente"
                        ? { background: "var(--warn-amber)" }
                        : undefined
                    }
                  />
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
   MÓDULO PRINCIPAL: GESTIÓN DE USUARIOS
   ============================================================ */
export default function Usuarios() {
  const tableSlotRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPagesBackend, setTotalPagesBackend] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageSize, setPageSize] = useState(calcularPageSizeInicial);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [activateTarget, setActivateTarget] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [tiposDocDisponibles, setTiposDocDisponibles] = useState([]);
  const [cargandoAux, setCargandoAux] = useState(true);

  // Cargar catálogos reales (tb_roles activos y tb_tipodoc) desde PostgreSQL
  const cargarAuxiliares = useCallback(async () => {
    try {
      const data = await obtenerAuxiliaresUsuarios();
      if (!data) return;
      if (Array.isArray(data.roles)) {
        setRolesDisponibles(data.roles);
      }
      if (Array.isArray(data.tiposDoc)) {
        setTiposDocDisponibles(data.tiposDoc);
      }
    } catch (err) {
      console.error("Error cargando catálogos de Usuarios desde PostgreSQL:", err.message);
    } finally {
      setCargandoAux(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    obtenerAuxiliaresUsuarios()
      .then((data) => {
        if (!activo || !data) return;
        if (Array.isArray(data.roles)) setRolesDisponibles(data.roles);
        if (Array.isArray(data.tiposDoc)) setTiposDocDisponibles(data.tiposDoc);
      })
      .catch((err) => {
        console.error("Error cargando catálogos de Usuarios desde PostgreSQL:", err.message);
      })
      .finally(() => {
        if (activo) setCargandoAux(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  // Adaptar la cantidad de filas por página y altura idéntica por fila sin scroll ni recortes
  const recalcularFilas = useCallback(() => {
    const slot = tableSlotRef.current;
    if (!slot) return;

    if (window.innerWidth <= 768) {
      slot.style.removeProperty("--ru-row-h");
      setPageSize((prev) => (prev === 6 ? prev : 6));
      return;
    }

    const slotHeight = Math.floor(slot.getBoundingClientRect().height);
    if (!slotHeight || slotHeight < 180) return;

    const cardEl = slot.querySelector(".ru-list-card");
    const listHeadEl = slot.querySelector(".ru-list-head");
    const theadEl = slot.querySelector("thead");
    const paginationEl = slot.querySelector(".ru-pagination");
    const wrapperEl = slot.querySelector(".ru-table-container");
    const tableEl = slot.querySelector(".ru-u-table");

    const cardStyle = cardEl ? window.getComputedStyle(cardEl) : null;
    const cardBorders = cardStyle
      ? Math.ceil(parseFloat(cardStyle.borderTopWidth) || 0) + Math.ceil(parseFloat(cardStyle.borderBottomWidth) || 0)
      : 2;
    const listHeadH = listHeadEl ? Math.ceil(listHeadEl.getBoundingClientRect().height) : 44;
    const theadH = theadEl ? Math.ceil(theadEl.getBoundingClientRect().height) : 38;
    const paginationH = paginationEl ? Math.ceil(paginationEl.getBoundingClientRect().height) : 50;

    const minRowH = window.innerHeight <= 780 ? 44 : 50;
    const availableBodyH = Math.floor(slotHeight - cardBorders - listHeadH - theadH - paginationH - 2);
    if (availableBodyH < 160) return;

    const filas = Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor(availableBodyH / minRowH)));
    let idealRowH = Math.max(42, Math.min(72, Math.floor(availableBodyH / filas)));

    slot.style.setProperty("--ru-row-h", `${idealRowH}px`);

    // Verificación directa en DOM: si sub-píxeles o zoom hacen que la tabla exceda el contenedor,
    // ajustamos 1px a la vez para que TODAS las filas queden exactamente iguales y sin recorte.
    if (wrapperEl && tableEl) {
      let guard = 0;
      while (guard < 16 && idealRowH > 40 && tableEl.getBoundingClientRect().height > wrapperEl.clientHeight + 0.5) {
        idealRowH -= 1;
        slot.style.setProperty("--ru-row-h", `${idealRowH}px`);
        guard += 1;
      }
    }

    setPageSize((prev) => {
      if (prev === filas) return prev;
      setPage(1);
      return filas;
    });
  }, []);

  useEffect(() => {
    const slot = tableSlotRef.current;
    if (!slot || typeof ResizeObserver === "undefined") return;

    let timeoutId = null;
    const schedule = (delay = 80) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(recalcularFilas, delay);
    };

    const observer = new ResizeObserver(() => schedule(80));
    observer.observe(slot);
    schedule(40);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => schedule(30));
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [recalcularFilas]);

  useEffect(() => {
    if (!loading) {
      const id = requestAnimationFrame(recalcularFilas);
      return () => cancelAnimationFrame(id);
    }
  }, [loading, users.length, recalcularFilas]);

  const requestSeqRef = useRef(0);

  // Debounce para optimizar la velocidad de búsqueda y no saturar la red
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(handler);
  }, [search]);

  // Listener para capturar token en URL si viene por query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token") || params.get("activarToken");
    if (tokenParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModal({ type: "activateAccount", token: tokenParam });
    }
  }, []);

  const normalizarUsuario = useCallback((u) => ({
    ...u,
    nombres: u.nombres || "",
    apellidos: u.apellidos || "",
    nombre: u.nombre || `${u.nombres || ""} ${u.apellidos || ""}`.trim() || "Usuario",
    cedula: u.cedula || u.numeroDoc || "N/A",
    fecha: u.fecha || u.fechaRegistro || "Reciente",
    registrado: u.registrado || u.fechaRegistro || u.fecha || "Reciente",
  }), []);

  const cargarUsuarios = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    setLoading(true);
    try {
      const resp = await obtenerUsuarios({
        search: debouncedSearch,
        page,
        pageSize,
      });

      if (seq !== requestSeqRef.current) return;

      if (resp && Array.isArray(resp.items)) {
        const norm = resp.items.map(normalizarUsuario);
        setUsers(norm);
        setTotalRecords(resp.total ?? norm.length);
        setTotalPagesBackend(resp.totalPages || Math.ceil((resp.total || 1) / pageSize));
      } else if (Array.isArray(resp)) {
        const norm = resp.map(normalizarUsuario);
        setUsers(norm);
        setTotalRecords(norm.length);
        setTotalPagesBackend(Math.max(1, Math.ceil(norm.length / pageSize)));
      }
    } catch (error) {
      if (seq !== requestSeqRef.current) return;
      console.error("Error al obtener usuarios desde PostgreSQL:", error.message);
      setUsers([]);
      setTotalRecords(0);
      setTotalPagesBackend(1);
      setAlertMessage({
        type: "error",
        title: "Error de conexión",
        message: "No se pudo sincronizar la lista de usuarios con la base de datos.",
      });
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, page, pageSize, normalizarUsuario]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarUsuarios();
  }, [cargarUsuarios]);

  const totalPages = Math.max(1, totalPagesBackend);
  const safePage = Math.min(page, totalPages);
  const pageItems = users;
  const showingFrom = totalRecords === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, totalRecords);
  const visiblePages = useMemo(() => getVisiblePages(safePage, totalPages), [safePage, totalPages]);

  const activeUser = modal?.userId ? users.find((u) => u.id === modal.userId) : null;
  const activeIndex = activeUser ? users.findIndex((u) => u.id === activeUser.id) : -1;

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    const nombre = deactivateTarget.nombre;
    try {
      await actualizarUsuario(deactivateTarget.id, { estado: "Inactivo" });
      setDeactivateTarget(null);
      await cargarUsuarios();
      setAlertMessage({
        type: "warning",
        title: "Usuario Desactivado",
        message: `El usuario "${nombre}" fue desactivado correctamente y su estado cambió a Inactivo.`,
      });
    } catch (error) {
      setDeactivateTarget(null);
      setAlertMessage({
        type: "error",
        title: "No se pudo desactivar",
        message: error.message || "No se pudo desactivar el usuario en la base de datos.",
      });
    }
  };

  const confirmActivate = async () => {
    if (!activateTarget) return;
    const nombre = activateTarget.nombre;
    try {
      await actualizarUsuario(activateTarget.id, { estado: "Activo" });
      setActivateTarget(null);
      await cargarUsuarios();
      setAlertMessage({
        type: "success",
        title: "Usuario Activado",
        message: `El usuario "${nombre}" fue activado correctamente y su estado cambió a Activo.`,
      });
    } catch (error) {
      setActivateTarget(null);
      setAlertMessage({
        type: "error",
        title: "No se pudo activar",
        message: error.message || "No se pudo activar el usuario en la base de datos.",
      });
    }
  };

  const handleCreate = async (newUser) => {
    try {
      const creado = await crearUsuario(newUser);
      await cargarUsuarios();

      // Abrir modal de éxito con el enlace de activación generado
      setModal({
        type: "activationSuccess",
        user: {
          ...creado,
          nombres: creado.nombres || newUser.nombres,
          apellidos: creado.apellidos || newUser.apellidos,
          correo: creado.correo || newUser.correo,
          tokenActivacion: creado.tokenActivacion,
          enlaceActivacion: creado.enlaceActivacion,
        },
      });

      setAlertMessage({
        type: "success",
        title: "¡Usuario Registrado!",
        message: `El usuario "${newUser.nombres} ${newUser.apellidos}" ha sido creado en estado Pendiente.`,
      });
    } catch (error) {
      setAlertMessage({
        type: "error",
        title: "Error al registrar",
        message: error.message || "No se pudo registrar el usuario en la base de datos.",
      });
    }
  };

  const handleSave = async (updated) => {
    try {
      await actualizarUsuario(updated.id, updated);
      setModal(null);
      await cargarUsuarios();
      setAlertMessage({
        type: "info",
        title: "Actualizado",
        message: `Los datos del usuario "${updated.nombre}" fueron actualizados con éxito en PostgreSQL.`,
      });
    } catch (error) {
      setAlertMessage({
        type: "error",
        title: "Error al actualizar",
        message: error.message || "No se pudieron actualizar los datos en la base de datos.",
      });
    }
  };

  const handleAccountActivated = async (usuarioActivado) => {
    setModal(null);
    await cargarUsuarios();
    setAlertMessage({
      type: "success",
      title: "¡Cuenta Activada!",
      message: `La cuenta de "${usuarioActivado.nombres || usuarioActivado.nombre}" ya está activa con contraseña configurada.`,
    });
  };

  const columns = [
    {
      header: "ID",
      className: "ru-col-id",
      render: (u) => {
        const realIndex = (safePage - 1) * pageSize + (pageItems.findIndex((item) => item.id === u.id) + 1);
        return <span className="ru-badge-id">#{realIndex}</span>;
      },
    },
    {
      header: "Documento",
      className: "ru-col-doc",
      render: (u) => (
        <span className="ru-badge-id" title={`${u.tipoDoc ? `${u.tipoDoc} ` : ""}${u.cedula}`}>
          {u.tipoDoc ? `${u.tipoDoc} ` : ""}{u.cedula}
        </span>
      ),
    },
    {
      header: "Usuario",
      className: "ru-col-user",
      render: (u) => (
        <div className="ru-user-cell">
          <Avatar nombre={u.nombre} id={u.id} />
          <div className="ru-user-info">
            <div className="ru-user-name" title={u.nombre}>{u.nombre}</div>
            <div className="ru-user-phone" title={u.correo}>
              <span className="ru-inline-rol">{u.rol} · </span>
              {u.correo}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Teléfono",
      className: "ru-col-tel",
      render: (u) => <span className="ru-cell-truncate" title={u.telefono || "—"}>{u.telefono || "—"}</span>,
    },
    {
      header: "Rol",
      className: "ru-col-rol",
      render: (u) => <span className="ru-role-pill">{u.rol}</span>,
    },
    {
      header: "Estado",
      className: "ru-col-estado",
      render: (u) => <StatusBadge estado={u.estado} />,
    },
    {
      header: "Fecha Registro",
      className: "ru-col-fecha",
      render: (u) => <span className="ru-cell-truncate">{u.fecha}</span>,
    },
    {
      header: "Acciones",
      className: "ru-col-acciones",
      render: (u) => {
        const estadoNorm = (u.estado || "").toLowerCase();
        const isPending = estadoNorm === "pendiente";
        const isInactive = estadoNorm === "inactivo";
        return (
          <div className="ru-actions">
            {isPending && (
              <button
                className="ru-icon-btn edit"
                style={{ color: "var(--warn-amber)" }}
                onClick={() => setModal({
                  type: "activateAccount",
                  token: u.tokenActivacion || "",
                  user: u
                })}
                title="Configurar contraseña / Activar"
              >
                <KeyRound size={15} />
              </button>
            )}
            <button className="ru-icon-btn view" onClick={() => setModal({ type: "view", userId: u.id })} title="Ver">
              <Eye size={15} />
            </button>
            <button
              className="ru-icon-btn edit"
              onClick={() => {
                void cargarAuxiliares();
                setModal({ type: "edit", userId: u.id });
              }}
              title="Editar"
            >
              <Pencil size={15} />
            </button>
            {isInactive ? (
              <button
                className="ru-icon-btn activate"
                onClick={() => setActivateTarget(u)}
                title="Activar usuario"
              >
                <UserCheck size={15} />
              </button>
            ) : (
              <button
                className="ru-icon-btn delete"
                onClick={() => setDeactivateTarget(u)}
                title="Desactivar usuario"
              >
                <UserX size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="ru-root ru-usuarios-root">
      <div className="ru-page ru-usuarios-page">
        {/* Encabezado */}
        <div className="ru-u-header">
          <div className="ru-u-header-info">
            <div className="ru-eyebrow">CU.14 · MÓDULO</div>
            <h1 className="ru-u-title">Gestión de Usuarios</h1>
            <p className="ru-u-subtitle">Administra los usuarios y sus roles con seguridad en PostgreSQL</p>
          </div>
        </div>

        {/* Barra global de búsqueda + botón de crear lado a lado */}
        <FiltrarBuscarGlobal
          searchPlaceholder="Buscar por ID, documento, nombre, correo, teléfono, rol, estado o fecha..."
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                void cargarAuxiliares();
                setModal({ type: "create" });
              }}
            >
              <UserPlus size={15} />
              <span>REGISTRAR USUARIO</span>
            </button>
          }
        />

        {/* Tabla Integrada y Adaptativa (máximo 10 registros, sin hueco blanco inferior) */}
        <div className="ru-table-slot" ref={tableSlotRef}>
          <div className="ru-card ru-list-card">
            <div className="ru-list-head">
              <div className="ru-list-title">
                <span className="ru-list-icon">
                  <Users size={15} />
                </span>
                <span>Lista de Usuarios</span>
                <span className="ru-count-badge">{totalRecords}</span>
              </div>
              <span className="ru-page-of">
                Página {safePage} de {totalPages}
              </span>
            </div>

            <div className="ru-table-container">
              <table className="ru-u-table">
                <thead>
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} className={col.className}>
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="ru-empty-tr">
                      <td colSpan={columns.length} className="ru-no-data">
                        Cargando usuarios desde PostgreSQL...
                      </td>
                    </tr>
                  ) : pageItems.length > 0 ? (
                    pageItems.map((u) => (
                      <tr key={u.id}>
                        {columns.map((col, idx) => (
                          <td key={idx} className={col.className}>
                            {col.render ? col.render(u) : u[col.accessor]}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr className="ru-empty-tr">
                      <td colSpan={columns.length} className="ru-no-data">
                        No se encontraron registros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="ru-pagination">
              <span className="ru-pagination-info">
                Mostrando {showingFrom}–{showingTo} de {totalRecords} registros
              </span>
              <div className="ru-pagination-controls">
                <button className="ru-page-btn" disabled={safePage === 1} onClick={() => setPage(1)} aria-label="Primera página">
                  <ChevronsLeft size={14} />
                </button>
                <button className="ru-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Página anterior">
                  <ChevronLeft size={14} />
                </button>
                {visiblePages.map((p) => (
                  <button
                    key={p}
                    className={`ru-page-btn${p === safePage ? " active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button className="ru-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} aria-label="Página siguiente">
                  <ChevronRight size={14} />
                </button>
                <button className="ru-page-btn" disabled={safePage === totalPages} onClick={() => setPage(totalPages)} aria-label="Última página">
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {modal?.type === "view" && activeUser && (
        <ViewUserModal
          user={activeUser}
          index={activeIndex}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "edit", userId: activeUser.id })}
          onActivate={() => setModal({
            type: "activateAccount",
            token: activeUser.tokenActivacion || "",
            user: activeUser,
          })}
        />
      )}

      {modal?.type === "create" && (
        <CreateUserModal
          nextId={Math.max(0, ...users.map((u) => u.id), 0) + 1}
          rolesDisponibles={rolesDisponibles}
          tiposDocDisponibles={tiposDocDisponibles}
          cargandoAux={cargandoAux}
          onClose={() => setModal(null)}
          onCreate={handleCreate}
        />
      )}

      {modal?.type === "activationSuccess" && modal.user && (
        <ActivationSuccessModal
          user={modal.user}
          onClose={() => setModal(null)}
          onActivateNow={(tok, usr) => setModal({ type: "activateAccount", token: tok, user: usr })}
        />
      )}

      {modal?.type === "activateAccount" && (
        <ActivarCuentaModal
          token={modal.token}
          user={modal.user}
          onClose={() => setModal(null)}
          onActivated={handleAccountActivated}
        />
      )}

      {modal?.type === "edit" && activeUser && (
        <EditUserModal
          user={activeUser}
          index={activeIndex}
          rolesDisponibles={rolesDisponibles}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Modal de Confirmación de Desactivación */}
      {deactivateTarget && (
        <ConfirmModal
          title="¿Desactivar Usuario?"
          message={`Estás a punto de desactivar a "${deactivateTarget.nombre}" (${deactivateTarget.rol}). Su estado cambiará a "Inactivo" y no podrá acceder al sistema, conservando su historial en PostgreSQL.`}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={confirmDeactivate}
          confirmText="Sí, desactivar usuario"
          cancelText="Cancelar"
          confirmVariant="destructive"
          icon={<UserX size={24} style={{ color: "#D1495B" }} />}
        />
      )}

      {/* Modal de Confirmación de Activación */}
      {activateTarget && (
        <ConfirmModal
          title="¿Activar Usuario?"
          message={`Estás a punto de activar a "${activateTarget.nombre}" (${activateTarget.rol}). Su estado cambiará a "Activo" y podrá volver a acceder al sistema.`}
          onClose={() => setActivateTarget(null)}
          onConfirm={confirmActivate}
          confirmText="Sí, activar usuario"
          cancelText="Cancelar"
          confirmVariant="primary"
          icon={<UserCheck size={24} style={{ color: "var(--positive, #2E9E5B)" }} />}
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
