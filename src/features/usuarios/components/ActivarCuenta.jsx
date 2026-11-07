import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { validarTokenActivacion, activarUsuarioConToken } from "../services/usuariosService";
import "../styles/Usuarios.css";
import "../styles/ModalsUsuarios.css";

export default function ActivarCuenta() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [errorToken, setErrorToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorToken("No se proporcionó ningún token de activación en el enlace.");
      return;
    }

    async function validar() {
      try {
        const res = await validarTokenActivacion(token);
        if (res && res.valido) {
          setTokenInfo(res);
        } else {
          setErrorToken(res?.mensaje || "El enlace de activación no es válido o ya ha expirado.");
        }
      } catch (err) {
        setErrorToken(err.message || "Error al verificar el token de activación.");
      } finally {
        setLoading(false);
      }
    }

    validar();
  }, [token]);

  // Validaciones en tiempo real
  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    match: password.length > 0 && password === confirmPassword,
  };

  const isFormValid =
    rules.length && rules.upper && rules.lower && rules.number && rules.match;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      await activarUsuarioConToken(token, password);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message || "No se pudo activar la cuenta. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="ru-root"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        background: "var(--background)",
      }}
    >
      <div
        className="ru-card"
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "36px 32px",
          borderRadius: "20px",
          background: "var(--card-bg)",
          boxShadow: "var(--shadow-modal)",
          border: "1px solid var(--card-border)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ display: "inline-flex", padding: "12px", borderRadius: "50%", background: "rgba(154, 140, 152, 0.15)", color: "var(--primary)", marginBottom: "12px" }}>
            <Lock size={28} />
          </div>
          <div className="ru-modal-eyebrow">SEGURIDAD · RAÍZ URBANA</div>
          <h1 style={{ fontFamily: "var(--font-logo)", fontSize: "24px", color: "var(--primary)", margin: "4px 0 8px" }}>
            Activa tu Cuenta
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted-text)", margin: 0 }}>
            Configura tu contraseña para acceder a la plataforma
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted-text)" }}>
            <p>Verificando enlace de activación...</p>
          </div>
        ) : errorToken ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ color: "var(--negative)", marginBottom: "12px" }}>
              <XCircle size={44} style={{ margin: "0 auto" }} />
            </div>
            <h3 style={{ fontSize: "16px", color: "var(--primary)", marginBottom: "8px" }}>
              Enlace no válido o expirado
            </h3>
            <p style={{ fontSize: "13px", color: "var(--muted-text)", marginBottom: "20px" }}>
              {errorToken}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => navigate("/inicio")}
            >
              Volver al inicio
            </button>
          </div>
        ) : success ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ color: "var(--positive)", marginBottom: "12px" }}>
              <ShieldCheck size={50} style={{ margin: "0 auto" }} />
            </div>
            <h3 style={{ fontSize: "18px", color: "var(--primary)", marginBottom: "8px" }}>
              ¡Cuenta activada con éxito!
            </h3>
            <p style={{ fontSize: "13.5px", color: "var(--muted-text)", marginBottom: "24px" }}>
              Tu contraseña ha sido guardada de forma segura en PostgreSQL. Ya puedes iniciar sesión con tu correo electrónico y tu nueva clave.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => navigate("/cuenta/inicio-sesion")}
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {tokenInfo && (
              <div
                style={{
                  background: "var(--background)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  marginBottom: "20px",
                  fontSize: "12.5px",
                }}
              >
                <div><strong>Usuario:</strong> {tokenInfo.nombre}</div>
                <div style={{ color: "var(--muted-text)", marginTop: "3px" }}>
                  <strong>Correo:</strong> {tokenInfo.correo}
                </div>
              </div>
            )}

            {submitError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(209, 73, 91, 0.1)",
                  color: "var(--negative)",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "12.5px",
                }}
              >
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
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

            <div style={{ marginBottom: "18px" }}>
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

            {/* Requisitos en tiempo real */}
            <div className="ru-pwd-rules" style={{ marginBottom: "22px" }}>
              <div className={`ru-pwd-rule ${rules.length ? "valid" : ""}`}>
                {rules.length ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>Mínimo 8 caracteres</span>
              </div>
              <div className={`ru-pwd-rule ${rules.upper ? "valid" : ""}`}>
                {rules.upper ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>Al menos una letra mayúscula (A-Z)</span>
              </div>
              <div className={`ru-pwd-rule ${rules.lower ? "valid" : ""}`}>
                {rules.lower ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>Al menos una letra minúscula (a-z)</span>
              </div>
              <div className={`ru-pwd-rule ${rules.number ? "valid" : ""}`}>
                {rules.number ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>Al menos un número (0-9)</span>
              </div>
              <div className={`ru-pwd-rule ${rules.match ? "valid" : ""}`}>
                {rules.match ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>Las dos contraseñas coinciden exactamente</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "13px" }}
              disabled={!isFormValid || submitting}
            >
              {submitting ? "Activando cuenta..." : "Activar Cuenta y Guardar Contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

