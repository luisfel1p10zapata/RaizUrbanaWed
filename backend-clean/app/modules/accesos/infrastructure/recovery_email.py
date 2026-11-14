"""Envío de correos de recuperación de contraseña."""

import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from dotenv import load_dotenv # type: ignore


def enviar_correo_recuperacion(
    destinatario: str,
    enlace: str,
) -> None:
    """Envía el enlace de recuperación mediante SMTP con TLS.

    Si el envío falla, produce una excepción para que el
    servicio pueda registrar el fallo sin exponer el enlace.
    """

    load_dotenv()

    host = os.getenv(
        "SMTP_HOST",
        "smtp.gmail.com",
    ).strip()

    puerto = int(
        os.getenv("SMTP_PORT", "587")
    )

    usuario = os.getenv(
        "SMTP_USER",
        "",
    ).strip()

    password = os.getenv(
        "SMTP_PASSWORD",
        "",
    ).replace(" ", "").strip()

    nombre_remitente = os.getenv(
        "SMTP_FROM_NAME",
        "Raíz Urbana",
    ).strip()

    if not usuario or not password:
        raise RuntimeError(
            "El servicio de correo no está configurado."
        )

    mensaje = EmailMessage()

    mensaje["Subject"] = (
        "Recupera tu contraseña de Raíz Urbana"
    )
    mensaje["From"] = formataddr(
        (nombre_remitente, usuario)
    )
    mensaje["To"] = destinatario

    mensaje.set_content(
        "Hola:\n\n"
        "Recibimos una solicitud para recuperar la contraseña "
        "de tu cuenta en Raíz Urbana.\n\n"
        "Abre el siguiente enlace para crear una contraseña nueva:\n\n"
        f"{enlace}\n\n"
        "El enlace es temporal y solo puede utilizarse una vez.\n\n"
        "Si no solicitaste este cambio, ignora este correo.\n\n"
        "Equipo Raíz Urbana"
    )

    with smtplib.SMTP(
        host,
        puerto,
        timeout=15,
    ) as servidor:
        servidor.ehlo()
        servidor.starttls()
        servidor.ehlo()
        servidor.login(usuario, password)
        servidor.send_message(mensaje)