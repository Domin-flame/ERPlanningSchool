"""
Service d'envoi d'email pour le reset de mot de passe.

Si les variables SMTP ne sont pas configurées, le lien de reset est
affiché dans les logs (mode développement sans serveur mail).
"""
import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@campus.local")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """
    Envoie un email avec le lien de reset.
    Retourne True si envoyé, False si SMTP non configuré (log console).
    """
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ea580c; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0;">CampusWorkflow</h1>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #111827;">Réinitialisation de mot de passe</h2>
        <p style="color: #6b7280;">
          Vous avez demandé la réinitialisation de votre mot de passe.
          Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
        </p>
        <p style="color: #6b7280;">
          Ce lien expire dans <strong>1 heure</strong>.
          Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{reset_link}"
             style="background: #ea580c; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 8px; font-weight: bold;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">
          Ou copiez ce lien dans votre navigateur :<br/>
          <a href="{reset_link}" style="color: #ea580c;">{reset_link}</a>
        </p>
      </div>
      <div style="padding: 16px; text-align: center; background: #f8f6f3;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          © 2026 CampusWorkflow
        </p>
      </div>
    </div>
    """

    text_body = (
        f"Réinitialisation de mot de passe CampusWorkflow\n\n"
        f"Cliquez sur ce lien pour réinitialiser votre mot de passe (valable 1h) :\n"
        f"{reset_link}\n\n"
        f"Si vous n'avez pas demandé cette réinitialisation, ignorez cet email."
    )

    # Mode développement — SMTP non configuré
    if not SMTP_HOST or not SMTP_USER:
        logger.warning(
            "[EMAIL_SERVICE] SMTP non configuré. Lien de reset (DEV ONLY) : %s",
            reset_link,
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Réinitialisation de votre mot de passe CampusWorkflow"
        msg["From"] = SMTP_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, [to_email], msg.as_string())

        logger.info("[EMAIL_SERVICE] Email de reset envoyé à %s", to_email)
        return True

    except smtplib.SMTPException as exc:
        logger.error("[EMAIL_SERVICE] Échec envoi email à %s : %s", to_email, exc)
        return False
