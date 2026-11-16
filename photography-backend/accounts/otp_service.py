
# accounts/otp_service.py

import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.utils import timezone

from .models import EmailVerificationOTP


OTP_EXPIRY_MINUTES = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_ATTEMPTS = 5


def generate_otp():
    return f"{secrets.randbelow(1_000_000):06d}"


def issue_email_otp(user):
    otp = generate_otp()
    now = timezone.now()

    EmailVerificationOTP.objects.update_or_create(
        user=user,
        defaults={
            "otp_hash": make_password(otp),
            "expires_at": now + timedelta(
                minutes=OTP_EXPIRY_MINUTES
            ),
            "last_sent_at": now,
            "attempts": 0,
        },
    )

    send_mail(
        subject="Verify your email | Lenscraft Studio",
        message=(
            f"Hello {user.first_name or 'there'},\n\n"
            "Welcome to Lenscraft Studio!\n\n"
            f"Your verification code is: {otp}\n\n"
            f"This code expires in {OTP_EXPIRY_MINUTES} minutes.\n\n"
            "If you did not create this account, "
            "please ignore this email.\n\n"
            "Lenscraft Studio"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
