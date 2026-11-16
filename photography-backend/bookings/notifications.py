
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import Booking


logger = logging.getLogger(__name__)


EMAIL_CONFIG = {
    "pending": {
        "subject": "Booking Request Received",
    },
    "confirmed": {
        "subject": "Booking Confirmed",
    },
    "cancelled": {
        "subject": "Booking Cancelled",
    },
    "completed": {
        "subject": "Booking Completed - Thank You!",
    },
}


def send_booking_email(booking, email_type):

    if not booking.email:
        logger.warning(
            "Booking #%s has no customer email.",
            booking.pk,
        )
        return 0

    email_config = EMAIL_CONFIG.get(email_type)

    if not email_config:
        logger.warning("Unsupported email type: %s", email_type)
        return 0

    service_name = (
        booking.service_reference.title
        if booking.service_reference_id
        else booking.service
    )

    photographer_name = (
        booking.photographer.name
        if booking.photographer_id
        else ""
    )

    subject = (
        f"{email_config['subject']} "
        f"#{booking.pk} | Lenscraft Studio"
    )

    context = {
        "booking": booking,
        "status": email_type,
        "customer_name": booking.customer_name,
        "service_name": service_name,
        "photographer_name": photographer_name,
    }

    # Confirm the actual template location in your project.
    html_content = render_to_string(
        "ebookings/email.html",
        context,
    )

    text_content = strip_tags(html_content)

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[booking.email],
    )

    email.attach_alternative(
        html_content,
        "text/html",
    )

    result = email.send(fail_silently=False)

    logger.info(
        "Booking #%s %s email sent to %s. Result: %s",
        booking.pk,
        email_type,
        booking.email,
        result,
    )

    return result


def send_booking_created_email(booking):
    return send_booking_email(booking, "pending")


def send_booking_status_email(booking):

    if booking.status not in [
        Booking.Status.CONFIRMED,
        Booking.Status.CANCELLED,
        Booking.Status.COMPLETED,
    ]:
        return 0

    return send_booking_email(
        booking,
        booking.status,
    )
