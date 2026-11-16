
from django.conf import settings
from django.db import models


class Notification(models.Model):

    # ========================================================
    # NOTIFICATION TYPES
    # ========================================================

    class Type(models.TextChoices):

        BOOKING_CREATED = (
            "booking_created",
            "Booking Created"
        )

        BOOKING_CONFIRMED = (
            "booking_confirmed",
            "Booking Confirmed"
        )

        BOOKING_CANCELLED = (
            "booking_cancelled",
            "Booking Cancelled"
        )

        BOOKING_COMPLETED = (
            "booking_completed",
            "Booking Completed"
        )

        INFO = (
            "info",
            "Information"
        )

    # ========================================================
    # NOTIFICATION USER
    # ========================================================

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    # ========================================================
    # RELATED BOOKING
    # ========================================================

    booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    # ========================================================
    # NOTIFICATION CONTENT
    # ========================================================

    title = models.CharField(
        max_length=200
    )

    message = models.TextField()

    # ========================================================
    # NOTIFICATION TYPE
    # ========================================================

    notification_type = models.CharField(
        max_length=30,
        choices=Type.choices,
        default=Type.INFO,
        db_index=True,
    )

    # ========================================================
    # READ STATUS
    # ========================================================

    is_read = models.BooleanField(
        default=False,
        db_index=True,
    )

    # ========================================================
    # CREATED DATE
    # ========================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    # ========================================================
    # MODEL META
    # ========================================================

    class Meta:

        ordering = ["-created_at"]

        verbose_name = "Notification"

        verbose_name_plural = "Notifications"

    # ========================================================
    # STRING REPRESENTATION
    # ========================================================

    def __str__(self):

        return (
            f"{self.user} - "
            f"{self.title}"
        )
