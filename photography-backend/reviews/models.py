
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class Review(models.Model):

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.PROTECT,
        related_name="reviews"
    )

    service = models.ForeignKey(
        "services.Service",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="reviews"
    )

    photographer = models.ForeignKey(
        "services.Photographer",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="reviews"
    )

    rating = models.PositiveSmallIntegerField()

    title = models.CharField(
        max_length=150,
        blank=True
    )

    comment = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    

class Meta:
    ordering = ["-created_at"]

    constraints = [
        models.CheckConstraint(
            condition=(
                (
                    Q(service__isnull=False) &
                    Q(photographer__isnull=True)
                ) |
                (
                    Q(service__isnull=True) &
                    Q(photographer__isnull=False)
                )
            ),
            name="review_exactly_one_target"
        ),

        models.CheckConstraint(
            condition=Q(rating__gte=1) & Q(rating__lte=5),
            name="review_rating_between_1_and_5"
        ),

        # MySQL-compatible unique constraints
        models.UniqueConstraint(
            fields=["booking", "service"],
            name="unique_service_review_per_booking"
        ),

        models.UniqueConstraint(
            fields=["booking", "photographer"],
            name="unique_photographer_review_per_booking"
        ),
    ]


    def clean(self):
        super().clean()

        errors = {}

        if bool(self.service_id) == bool(self.photographer_id):
            errors["service"] = (
                "Select exactly one service or photographer."
            )

        if not 1 <= (self.rating or 0) <= 5:
            errors["rating"] = "Rating must be between 1 and 5."

        if not (self.comment or "").strip():
            errors["comment"] = "Review comment is required."

        if self.booking_id:
            booking = self.booking

            if self.customer_id != booking.customer_id:
                errors["booking"] = (
                    "This booking does not belong to the customer."
                )

            if booking.status != "completed":
                errors["booking"] = (
                    "Only completed bookings can be reviewed."
                )

            if self.service_id:
                if booking.service_reference_id:
                    matches = (
                        booking.service_reference_id == self.service_id
                    )
                else:
                    matches = (
                        (booking.service or "").strip().casefold()
                        == self.service.title.strip().casefold()
                    )

                if not matches:
                    errors["service"] = (
                        "This service does not match the booking."
                    )

            if self.photographer_id:
                if booking.photographer_id != self.photographer_id:
                    errors["photographer"] = (
                        "This photographer does not match the booking."
                    )

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        target = (
            self.service.title
            if self.service_id
            else self.photographer.name
            if self.photographer_id
            else "Unknown"
        )

        return f"{self.customer_id} - {target} - {self.rating}/5"