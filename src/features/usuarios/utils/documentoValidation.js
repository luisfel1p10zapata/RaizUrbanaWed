/**
 * Reglas oficiales de validación por tipo de documento en Colombia
 * (Registraduría Nacional del Estado Civil, Migración Colombia y Cancillería / OACI).
 */

export const DOCUMENTO_RULES = {
  CC: {
    codigo: "CC",
    nombre: "Cédula de Ciudadanía (C.C.)",
    placeholder: "Ej: 1023456789",
    hint: "Solo números, entre 6 y 10 dígitos (sin puntos ni espacios).",
    maxLength: 10,
    inputMode: "numeric",
    soloNumeros: true,
    regex: /^[1-9]\d{5,9}$/,
    errorFormato: "La Cédula de Ciudadanía debe contener solo números (sin puntos ni letras).",
    errorLongitud: "La Cédula de Ciudadanía debe tener entre 6 y 10 dígitos y no iniciar en 0.",
  },
  TI: {
    codigo: "TI",
    nombre: "Tarjeta de Identidad (T.I.)",
    placeholder: "Ej: 1098765432",
    hint: "Solo números, exactamente 10 dígitos (estándar NUIP).",
    maxLength: 10,
    inputMode: "numeric",
    soloNumeros: true,
    regex: /^[1-9]\d{9}$/,
    errorFormato: "La Tarjeta de Identidad debe contener solo números (sin puntos ni letras).",
    errorLongitud: "La Tarjeta de Identidad (NUIP) debe tener exactamente 10 dígitos y no iniciar en 0.",
  },
  CE: {
    codigo: "CE",
    nombre: "Cédula de Extranjería (C.E.)",
    placeholder: "Ej: 7208242",
    hint: "Solo números, entre 6 y 7 dígitos (Migración Colombia).",
    maxLength: 7,
    inputMode: "numeric",
    soloNumeros: true,
    regex: /^[1-9]\d{5,6}$/,
    errorFormato: "La Cédula de Extranjería debe contener solo números (sin puntos ni letras).",
    errorLongitud: "La Cédula de Extranjería debe tener entre 6 y 7 dígitos y no iniciar en 0.",
  },
  PA: {
    codigo: "PA",
    nombre: "Pasaporte",
    placeholder: "Ej: AO123456",
    hint: "Alfanumérico de 6 a 9 caracteres (letras mayúsculas y números, sin espacios).",
    maxLength: 9,
    inputMode: "text",
    soloNumeros: false,
    regex: /^(?=.*[A-Z])(?=(?:.*\d){4,})[A-Z0-9]{6,9}$/,
    errorFormato: "El Pasaporte solo permite letras mayúsculas y números (sin espacios ni símbolos).",
    errorLongitud: "El Pasaporte debe tener entre 6 y 9 caracteres alfanuméricos (ej: AO123456, mínimo 1 letra y 4 números).",
  },
};

/**
 * Normaliza la clave del tipo de documento ("C.C.", "CC", "Pasaporte", "PA", etc.)
 * a una de las claves oficiales: "CC" | "TI" | "CE" | "PA".
 */
export function normalizarTipoDoc(tipoDoc) {
  const raw = String(tipoDoc || "").replace(/\./g, "").trim().toUpperCase();
  if (raw === "CC" || raw.includes("CIUDADAN")) return "CC";
  if (raw === "TI" || raw.includes("IDENTIDAD")) return "TI";
  if (raw === "CE" || raw.includes("EXTRANJER")) return "CE";
  if (raw === "PA" || raw.includes("PASAPORTE")) return "PA";
  return "";
}

/**
 * Obtiene la configuración UI y reglas para el tipo de documento seleccionado.
 */
export function getDocumentoConfig(tipoDoc) {
  const key = normalizarTipoDoc(tipoDoc);
  return DOCUMENTO_RULES[key] || {
    codigo: "",
    nombre: "Documento",
    placeholder: "Selecciona primero el tipo de documento",
    hint: "Selecciona un tipo de documento para ver el formato válido.",
    maxLength: 15,
    inputMode: "text",
    soloNumeros: false,
  };
}

/**
 * Limpia espacios y convierte a mayúsculas cuando aplica (ej. Pasaporte).
 */
export function formatearEntradaDocumento(tipoDoc, valor) {
  const key = normalizarTipoDoc(tipoDoc);
  const str = String(valor || "");
  if (key === "PA") {
    return str.toUpperCase();
  }
  return str;
}

/**
 * Valida el número de documento según el tipo seleccionado.
 * Retorna un mensaje de error claro o `null` si es válido.
 */
export function validarNumeroDocumento(tipoDoc, numeroDoc) {
  const key = normalizarTipoDoc(tipoDoc);
  const val = String(numeroDoc || "").trim();

  if (!key) {
    return "Selecciona primero un tipo de documento.";
  }

  if (!val) {
    return "El número de documento es obligatorio.";
  }

  const rule = DOCUMENTO_RULES[key];

  if (rule.soloNumeros) {
    if (!/^\d+$/.test(val)) {
      return rule.errorFormato;
    }
    if (!rule.regex.test(val)) {
      return rule.errorLongitud;
    }
    if (/^(\d)\1+$/.test(val)) {
      return "El número de documento no puede tener todos sus dígitos iguales.";
    }
    return null;
  }

  // Pasaporte (alfanumérico)
  const upper = val.toUpperCase();
  if (!/^[A-Z0-9]+$/.test(upper)) {
    return rule.errorFormato;
  }
  if (!rule.regex.test(upper)) {
    return rule.errorLongitud;
  }
  if (/^([A-Z0-9])\1+$/.test(upper)) {
    return "El número de pasaporte no puede tener todos sus caracteres repetidos.";
  }

  return null;
}
