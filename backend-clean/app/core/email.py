"""Servicio de envío de correos electrónicos para Raíz Urbana (SMTP con soporte Gmail)."""
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv # type: ignore

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").replace(" ", "").strip()
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Raíz Urbana").strip()


def plantilla_html_activacion(nombre_usuario: str, enlace_activacion: str) -> str:
    """Plantilla de correo con diseño moderno y la paleta de Raíz Urbana."""
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activa tu cuenta en Raíz Urbana</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F2E9E4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #22223B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F2E9E4; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 18px rgba(34, 34, 59, 0.08); border: 1px solid #EAD9CF;">
          <!-- Header -->
          <tr>
            <td style="background-color: #22223B; padding: 32px 30px; text-align: center;">
              <h1 style="color: #FFFFFF; font-size: 26px; margin: 0; font-family: Georgia, serif; letter-spacing: 0.05em;">RAÍZ URBANA</h1>
              <p style="color: #C9ADA7; font-size: 13px; margin: 6px 0 0; letter-spacing: 0.1em; text-transform: uppercase;">Activación de Cuenta</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="color: #22223B; font-size: 20px; margin-top: 0; font-weight: 600;">¡Hola, {nombre_usuario}!</h2>
              <p style="color: #4A4E69; font-size: 14.5px; line-height: 1.6; margin: 16px 0;">
                Has sido registrado como usuario en la plataforma de <strong>Raíz Urbana</strong>.
              </p>
              <p style="color: #4A4E69; font-size: 14.5px; line-height: 1.6; margin: 16px 0;">
                Por políticas de seguridad, el administrador no define contraseñas. Por favor pulsa el siguiente botón para configurar y confirmar tu clave de acceso personal:
              </p>
              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px auto;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #22223B;">
                    <a href="{enlace_activacion}" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 14px; font-weight: bold; color: #FFFFFF; text-decoration: none; border-radius: 8px; letter-spacing: 0.04em;">
                      CONFIGURAR CONTRASEÑA
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Link alternativo -->
              <div style="background-color: #F8F5F2; border-left: 3px solid #9A8C98; padding: 12px 16px; border-radius: 6px; margin-top: 24px;">
                <p style="font-size: 12px; color: #4A4E69; margin: 0 0 6px;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:
                </p>
                <p style="font-size: 11.5px; color: #22223B; word-break: break-all; margin: 0; font-family: monospace;">
                  {enlace_activacion}
                </p>
              </div>
              <p style="color: #9A8C98; font-size: 12px; margin: 24px 0 0; text-align: center;">
                ⏳ Este enlace de activación vence en <strong>48 horas</strong> y es de un solo uso.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F5F2; padding: 20px 30px; text-align: center; border-top: 1px solid #ECE1D8;">
              <p style="color: #9691A0; font-size: 11.5px; margin: 0;">
                © Raíz Urbana · Sistema de Gestión y Administración
              </p>
              <p style="color: #9691A0; font-size: 10.5px; margin: 4px 0 0;">
                Si tú no solicitaste esta cuenta, puedes ignorar este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _obtener_config_smtp():
    """Carga siempre la configuración más reciente desde el archivo .env."""
    load_dotenv(override=True)
    host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    pwd = os.getenv("SMTP_PASSWORD", "").replace(" ", "").strip()
    from_name = os.getenv("SMTP_FROM_NAME", "Raíz Urbana").strip()
    return host, port, user, pwd, from_name


def enviar_correo_activacion(destinatario: str, nombre_usuario: str, enlace_activacion: str) -> bool:
    """Envía un correo de activación por SMTP. Si faltan credenciales, registra en consola."""
    host, port, user, pwd, from_name = _obtener_config_smtp()

    if not user or not pwd:
        print(f"""
================================================================================
[MODO SIMULADO - SMTP NO CONFIGURADO]
Para: {destinatario}
Nombre: {nombre_usuario}
Asunto: Activa tu cuenta en Raíz Urbana
Enlace: {enlace_activacion}
(Configura SMTP_USER y SMTP_PASSWORD en backend-clean/.env para envío real por Gmail)
================================================================================
""")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Activa tu cuenta en Raíz Urbana"
        msg["From"] = f"{from_name} <{user}>"
        msg["To"] = destinatario

        # Versión texto plano de respaldo
        texto_plano = (
            f"Hola {nombre_usuario},\n\n"
            f"Has sido registrado en Raíz Urbana.\n"
            f"Ingresa al siguiente enlace para configurar tu contraseña (vence en 48 horas):\n"
            f"{enlace_activacion}\n\n"
            f"Equipo Raíz Urbana."
        )
        msg.attach(MIMEText(texto_plano, "plain", "utf-8"))

        # Versión HTML con diseño Raíz Urbana
        html = plantilla_html_activacion(nombre_usuario, enlace_activacion)
        msg.attach(MIMEText(html, "html", "utf-8"))

        # Conexión SMTP con TLS
        with smtplib.SMTP(host, port, timeout=15) as servidor:
            servidor.ehlo()
            servidor.starttls()
            servidor.ehlo()
            servidor.login(user, pwd)
            servidor.sendmail(user, [destinatario], msg.as_string())

        print(f"[CORREO REAL ENVIADO] Mensaje de activación despachado con éxito a: {destinatario}")
        return True

    except Exception as err:
        print(f"[ERROR SMTP AL ENVIAR CORREO REAL A {destinatario}]: {err}")
        return False

