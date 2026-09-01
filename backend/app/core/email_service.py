import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings

logger = logging.getLogger("matzevet.email")

def send_password_reset_email(to_email: str, code: str) -> bool:
    """Dispatches a password reset verification code email via SMTP."""
    settings = get_settings()
    
    # Check if SMTP server is configured
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.info(
            f"[SMTP Disabled] SMTP not configured. Verification code for '{to_email}': {code}"
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"קוד אימות לאיפוס סיסמה - The Office: {code}"
        msg["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        msg["To"] = to_email

        text_content = f"""
שלום,

קיבלנו בקשה לאיפוס הסיסמה שלך במערכת The Office.
קוד האימות שלך הוא: {code}

קוד זה תקף למשך 15 דקות.
אם לא ביקשת לאפס את הסיסמה, ניתן להתעלם מהודעה זו.

בברכה,
צוות The Office
"""
        html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #1e293b; direction: rtl; text-align: right;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800;">The Office</h1>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">מערכת שליטה ומצבת כוח אדם</p>
        </div>
        
        <h2 style="font-size: 18px; margin-bottom: 12px; color: #0f172a;">איפוס סיסמה למערכת</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            שלום,<br>
            התקבלה בקשה לאיפוס הסיסמה לחשבונך. הזן את קוד האימות הבא במסך האימות:
        </p>
        
        <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 14px 32px; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #1d4ed8;">
                {code}
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">קוד זה בתוקף למשך 15 דקות</p>
        </div>
        
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            אם לא יזמת בקשה זו, תוכל להתעלם מאימייל זה בבטחה. סיסמתך לא תשתנה ללא הזנת הקוד.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            הודעה אוטומטית ממערכת The Office • אין להשיב להודעה זו
        </p>
    </div>
</body>
</html>
"""
        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if settings.SMTP_USE_TLS:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(msg["From"], [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.ehlo()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(msg["From"], [to_email], msg.as_string())

        logger.info(f"Password reset verification email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {e}")
        return False
