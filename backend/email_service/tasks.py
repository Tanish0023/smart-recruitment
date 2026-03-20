from celery import shared_task
import json
import smtplib
import urllib.error
import urllib.request
from django.utils.html import strip_tags
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

import logging


logger = logging.getLogger(__name__)


def _smtp_is_configured() -> bool:
    return bool(getattr(settings, "EMAIL_HOST_USER", "") and getattr(settings, "EMAIL_HOST_PASSWORD", ""))


def _send_email(subject: str, html_message: str, message: str, user_email: str, category: str) -> None:
    # Prefer Mailtrap Sending API if token is configured.
    if getattr(settings, "MAILTRAP_API_TOKEN", ""):
        payload = {
            "from": {"email": settings.DEFAULT_FROM_EMAIL},
            "to": [{"email": user_email}],
            "subject": subject,
            "text": message,
            "html": html_message,
            "category": category,
        }
        request = urllib.request.Request(
            url=settings.MAILTRAP_API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {settings.MAILTRAP_API_TOKEN}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                status_code = response.getcode()
                if status_code >= 400:
                    body = response.read().decode("utf-8", errors="replace")
                    raise RuntimeError(f"Mailtrap API failed with status={status_code}: {body}")
            return
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            logger.warning("Mailtrap API failed (%s). Falling back to SMTP if configured.", exc.code)
            if not _smtp_is_configured():
                logger.error(
                    "Mailtrap API request failed and SMTP fallback is not configured. "
                    f"HTTP error={exc.code}: {body}"
                )
                return

    elif not _smtp_is_configured():
        raise RuntimeError(
            "MAILTRAP_API_TOKEN is missing and SMTP fallback is not configured. "
            "Set MAILTRAP_API_TOKEN or EMAIL_HOST_USER/EMAIL_HOST_PASSWORD."
        )

    # SMTP fallback path.
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
    except smtplib.SMTPDataError as exc:
        logger.error("SMTP rejected email (code=%s): %s", exc.smtp_code, exc.smtp_error)
    except Exception:
        logger.exception("Unexpected SMTP error while sending email")


@shared_task(queue="email_service")
def send_registration_thank_you_email(user_email: str, username: str) -> None:
    subject = "Welcome to Smart Recruitment"
    dashboard_url_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")
    dashboard_url = f"{dashboard_url_base}/applicant/dashboard?tab=applications"
    html_message = render_to_string(
        "email_service/registration_thank_you.html",
        {
            "username": username,
            "dashboard_url": dashboard_url,
            "current_year": timezone.now().year,
        },
    )
    message = strip_tags(html_message)

    _send_email(
        subject=subject,
        html_message=html_message,
        message=message,
        user_email=user_email,
        category="registration",
    )


@shared_task(queue="email_service")
def send_application_status_email(
    user_email: str,
    username: str,
    job_title: str,
    status: str,
) -> None:
    normalized_status = (status or "").strip().lower()
    is_positive = normalized_status in {"selected", "hired"}
    status_label = "selected" if is_positive else "rejected"
    status_message = (
        "Great news! Your profile matched the role requirements. "
        "Please check your dashboard for next steps."
        if is_positive
        else "Thank you for your interest in this role. While this application was not selected, "
        "we encourage you to apply for other opportunities."
    )

    subject = f"Application update: {job_title}"
    dashboard_url_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")
    dashboard_url = f"{dashboard_url_base}/applicant/dashboard?tab=applications"
    html_message = render_to_string(
        "email_service/application_status_update.html",
        {
            "username": username,
            "job_title": job_title,
            "status_label": status_label,
            "is_positive": is_positive,
            "status_message": status_message,
            "dashboard_url": dashboard_url,
            "current_year": timezone.now().year,
        },
    )
    message = strip_tags(html_message)

    _send_email(
        subject=subject,
        html_message=html_message,
        message=message,
        user_email=user_email,
        category="application-status",
    )
