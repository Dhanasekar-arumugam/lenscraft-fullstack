
from django.contrib.auth import get_user_model

from .models import Notification


User = get_user_model()


def create_booking_notification(booking, notification_type):
    """
    Create one notification for the customer and one for each
    active staff member.

    Prevent the customer from receiving a duplicate staff notification
    if their account also has is_staff=True.
    """

    notification_messages = {
        "booking_created": {
            "title": "Booking Request Received!",
            "customer": (
                f"Your booking #{booking.id} has been received. "
                "Our team will review your request shortly."
            ),
            "admin_title": "New Booking Received",
            "admin": (
                f"{booking.customer_name} submitted booking "
                f"#{booking.id}. Please review the request."
            ),
        },
        "booking_confirmed": {
            "title": "Booking Confirmed!",
            "customer": (
                f"Your booking #{booking.id} has been confirmed. "
                "We look forward to capturing your special moments."
            ),
            "admin_title": "Booking Confirmed",
            "admin": f"Booking #{booking.id} has been confirmed.",
        },
        "booking_cancelled": {
            "title": "Booking Cancelled",
            "customer": (
                f"Your booking #{booking.id} has been cancelled. "
                "Contact Lenscraft Studio if you need assistance."
            ),
            "admin_title": "Booking Cancelled",
            "admin": f"Booking #{booking.id} has been cancelled.",
        },
        "booking_completed": {
            "title": "Booking Completed!",
            "customer": (
                f"Your booking #{booking.id} has been completed. "
                "Thank you for choosing Lenscraft Studio!"
            ),
            "admin_title": "Booking Completed",
            "admin": f"Booking #{booking.id} has been marked as completed.",
        },
    }

    data = notification_messages.get(notification_type)

    if not data:
        return []

    created_notifications = []

    # ------------------------------------------------
    # CUSTOMER NOTIFICATION
    # ------------------------------------------------

    if booking.customer_id:
        notification = Notification.objects.create(
            user=booking.customer,
            booking=booking,
            title=data["title"],
            message=data["customer"],
            notification_type=notification_type,
        )

        created_notifications.append(notification)

    # ------------------------------------------------
    # ADMIN NOTIFICATIONS
    # Exclude customer to prevent duplicate delivery.
    # ------------------------------------------------

    staff_users = User.objects.filter(
    is_staff=True,
    is_active=True,
).exclude(
    pk=booking.customer_id
)

    if booking.customer_id:
        staff_users = staff_users.exclude(
            pk=booking.customer_id
        )

    for staff_user in staff_users:
        notification = Notification.objects.create(
            user=staff_user,
            booking=booking,
            title=data["admin_title"],
            message=data["admin"],
            notification_type=notification_type,
        )

        created_notifications.append(notification)

    return created_notifications
