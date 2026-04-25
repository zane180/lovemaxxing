"""
Email service — uses SendGrid HTTP API.
Set SENDGRID_API_KEY in env to enable. Silently skips if not configured.
"""
import logging
import httpx
from ..config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


async def send_email(to: str, subject: str, html: str) -> None:
    api_key = getattr(settings, "SENDGRID_API_KEY", None)
    print(f"[EMAIL] send_email called. to={to} api_key_set={bool(api_key)}", flush=True)
    if not api_key:
        print(f"[EMAIL] SENDGRID_API_KEY not set — skipping", flush=True)
        return

    print(f"[EMAIL] Sending to {to} via SendGrid HTTP API", flush=True)
    payload = {
        "personalizations": [{"to": [{"email": to}]}],
        "from": {"email": settings.FROM_EMAIL, "name": settings.FROM_NAME},
        "subject": subject,
        "content": [{"type": "text/html", "value": html}],
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=payload,
                headers={"Authorization": f"Bearer {api_key}"},
            )
        if resp.status_code in (200, 202):
            logger.info(f"Email sent to {to}: {subject}")
        else:
            logger.error(f"SendGrid error {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")


# ── Template helpers ─────────────────────────────────────────────────────────

def _base_template(content: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#FAF7F2;font-family:Inter,system-ui,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:40px 20px;">
          <table width="100%" style="max-width:520px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(114,47,55,0.12);">
            <tr>
              <td style="background:linear-gradient(135deg,#722F37,#4A1520);padding:32px;text-align:center;">
                <span style="font-size:28px;font-weight:700;color:#FAF7F2;font-family:Georgia,serif;">
                  ♥ Lovemaxxing
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px;">
                {content}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:1px solid #EDE4D5;text-align:center;">
                <p style="color:#8f1a3c;font-size:12px;margin:0;">
                  © 2025 Lovemaxxing · <a href="{settings.FRONTEND_URL}/privacy" style="color:#722F37;">Privacy</a> ·
                  <a href="{settings.FRONTEND_URL}/terms" style="color:#722F37;">Terms</a>
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """


async def send_verification_email(to: str, name: str, token: str) -> None:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    content = f"""
    <h2 style="color:#4A1520;font-family:Georgia,serif;margin:0 0 8px;">Welcome, {name}!</h2>
    <p style="color:#722F37;margin:0 0 24px;">Please verify your email to unlock all features.</p>
    <a href="{verify_url}"
       style="display:inline-block;background:#722F37;color:#FAF7F2;padding:14px 32px;border-radius:16px;font-weight:600;text-decoration:none;margin-bottom:24px;">
      Verify My Email
    </a>
    <p style="color:#8f1a3c;font-size:13px;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
    """
    await send_email(to, "Verify your Lovemaxxing email", _base_template(content))


async def send_password_reset_email(to: str, name: str, token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    content = f"""
    <h2 style="color:#4A1520;font-family:Georgia,serif;margin:0 0 8px;">Reset your password</h2>
    <p style="color:#722F37;margin:0 0 24px;">Hey {name}, click below to set a new password.</p>
    <a href="{reset_url}"
       style="display:inline-block;background:#722F37;color:#FAF7F2;padding:14px 32px;border-radius:16px;font-weight:600;text-decoration:none;margin-bottom:24px;">
      Reset Password
    </a>
    <p style="color:#8f1a3c;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    """
    await send_email(to, "Reset your Lovemaxxing password", _base_template(content))


async def send_verification_code_email(to: str, name: str, code: str) -> None:
    content = f"""
    <h2 style="color:#4A1520;font-family:Georgia,serif;margin:0 0 8px;">Welcome, {name}!</h2>
    <p style="color:#722F37;margin:0 0 24px;">Enter this code to verify your email and complete your account.</p>
    <div style="text-align:center;margin:0 0 24px;">
      <div style="display:inline-block;background:#FAF7F2;border:2px solid #C9A96E;border-radius:16px;padding:20px 40px;">
        <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#4A1520;font-family:Georgia,serif;">{code}</span>
      </div>
    </div>
    <p style="color:#8f1a3c;font-size:13px;text-align:center;">This code expires in 10 minutes. If you didn't sign up, ignore this email.</p>
    """
    await send_email(to, "Your Lovemaxxing verification code", _base_template(content))


async def send_match_notification(to: str, name: str, match_name: str) -> None:
    content = f"""
    <h2 style="color:#4A1520;font-family:Georgia,serif;margin:0 0 8px;">It's a Match!</h2>
    <p style="color:#722F37;margin:0 0 24px;">Hey {name}, you and <strong>{match_name}</strong> both liked each other.</p>
    <a href="{settings.FRONTEND_URL}/matches"
       style="display:inline-block;background:#722F37;color:#FAF7F2;padding:14px 32px;border-radius:16px;font-weight:600;text-decoration:none;margin-bottom:24px;">
      Send a Message
    </a>
    """
    await send_email(to, f"You matched with {match_name}!", _base_template(content))
