from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


# ============================================================
# UNIFIED BOOKING MODEL
# Service Booking + Photographer Booking
# ============================================================

class Booking(models.Model):

    # --------------------------------------------------------
    # BOOKING STATUS
    # --------------------------------------------------------

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    # --------------------------------------------------------
    # BOOKING TYPE
    # --------------------------------------------------------

    class BookingType(models.TextChoices):
        SERVICE = "service", "Service Booking"
        PHOTOGRAPHER = "photographer", "Photographer Booking"
        BOTH = "both", "Service and Photographer Booking"

    # --------------------------------------------------------
    # CUSTOMER INFORMATION
    # --------------------------------------------------------

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bookings"
    )

    customer_name = models.CharField(
        max_length=100
    )

    email = models.EmailField()

    phone = models.CharField(
        max_length=20
    )

    # --------------------------------------------------------
    # EXISTING SERVICE FIELD
    # Preserved for existing bookings
    # --------------------------------------------------------

    service = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    # --------------------------------------------------------
    # SERVICE FOREIGN KEY
    # --------------------------------------------------------

    service_reference = models.ForeignKey(
        "services.Service",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="customer_bookings"
    )

    # --------------------------------------------------------
    # PHOTOGRAPHER FOREIGN KEY
    # --------------------------------------------------------

    photographer = models.ForeignKey(
        "services.Photographer",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="customer_bookings"
    )

    # --------------------------------------------------------
    # BOOKING TYPE
    # --------------------------------------------------------

    booking_type = models.CharField(
        max_length=20,
        choices=BookingType.choices,
        default=BookingType.SERVICE
    )

    # --------------------------------------------------------
    # EVENT INFORMATION
    # --------------------------------------------------------

    event_date = models.DateField()

    event_time = models.TimeField(
        null=True,
        blank=True
    )

    event_location = models.CharField(
        max_length=200
    )

    special_requirements = models.TextField(
        blank=True
    )

    # --------------------------------------------------------
    # BOOKING STATUS
    # --------------------------------------------------------

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    # --------------------------------------------------------
    # CREATED DATE
    # --------------------------------------------------------

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # --------------------------------------------------------
    # MODEL META
    # --------------------------------------------------------

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"

    # --------------------------------------------------------
    # MODEL VALIDATION
    # --------------------------------------------------------

    def clean(self):
        super().clean()

        has_service = bool(
            (self.service or "").strip()
            or self.service_reference_id
        )

        has_photographer = bool(
            self.photographer_id
        )

        # At least one booking selection is required
        if not has_service and not has_photographer:
            raise ValidationError(
                "Please select at least one service or photographer."
            )

        # Validate event date
        if (
            self.event_date
            and self.event_date < timezone.localdate()
        ):
            raise ValidationError({
                "event_date": "Event date cannot be in the past."
            })

        # Validate photographer availability
        if self.photographer_id:
            if not self.photographer.active:
                raise ValidationError({
                    "photographer":
                        "The selected photographer is currently unavailable."
                })

        # Validate booking type
        if has_service and has_photographer:
            expected_type = self.BookingType.BOTH

        elif has_photographer:
            expected_type = self.BookingType.PHOTOGRAPHER

        else:
            expected_type = self.BookingType.SERVICE

        if self.booking_type != expected_type:
            raise ValidationError({
                "booking_type":
                    f"Booking type must be '{expected_type}'."
            })

    # --------------------------------------------------------
    # STRING REPRESENTATION
    # --------------------------------------------------------

    def __str__(self):

        service_name = (
            self.service_reference.title
            if self.service_reference_id
            else self.service
        )

        photographer_name = (
            self.photographer.name
            if self.photographer_id
            else ""
        )

        booking_details = " / ".join(
            item for item in [
                service_name,
                photographer_name
            ]
            if item
        )

        return (
            f"#{self.pk} - "
            f"{self.customer_name} - "
            f"{booking_details} - "
            f"{self.status}"
        )