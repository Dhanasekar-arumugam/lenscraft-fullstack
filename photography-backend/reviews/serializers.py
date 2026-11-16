from django.db.models import Avg, Count
from rest_framework import serializers

from bookings.models import Booking
from services.models import Service, Photographer

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):

    customer_name = serializers.SerializerMethodField()
    service_name = serializers.CharField(
        source="service.title",
        read_only=True,
        default=None
    )
    photographer_name = serializers.CharField(
        source="photographer.name",
        read_only=True,
        default=None
    )

    class Meta:
        model = Review

        fields = [
            "id",
            "customer",
            "customer_name",
            "booking",
            "service",
            "service_name",
            "photographer",
            "photographer_name",
            "rating",
            "title",
            "comment",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "customer",
            "customer_name",
            "service_name",
            "photographer_name",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_customer_name(self, obj):
        user = obj.customer

        if hasattr(user, "get_full_name"):
            name = user.get_full_name()
            if name:
                return name

        return (
            getattr(user, "name", None)
            or getattr(user, "username", None)
            or "Customer"
        )

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user

        if not user.is_authenticated:
            raise serializers.ValidationError(
                "Login is required to submit a review."
            )

        instance = self.instance

        if instance:
            booking = instance.booking
            service = instance.service
            photographer = instance.photographer
        else:
            booking = attrs.get("booking")
            service = attrs.get("service")
            photographer = attrs.get("photographer")

        rating = attrs.get(
            "rating",
            instance.rating if instance else None
        )

        comment = attrs.get(
            "comment",
            instance.comment if instance else ""
        )

        if not instance and not booking:
            raise serializers.ValidationError({
                "booking": "Select a completed booking."
            })

        if bool(service) == bool(photographer):
            raise serializers.ValidationError(
                "Select exactly one service or photographer."
            )

        if rating is None or not 1 <= rating <= 5:
            raise serializers.ValidationError({
                "rating": "Rating must be between 1 and 5."
            })

        if not comment or not comment.strip():
            raise serializers.ValidationError({
                "comment": "Review comment is required."
            })

        if booking.customer_id != user.id:
            raise serializers.ValidationError({
                "booking": "This booking does not belong to you."
            })

        if booking.status != Booking.Status.COMPLETED:
            raise serializers.ValidationError({
                "booking": "You can review only completed bookings."
            })

        if service:
            if not instance and not service.active:
                raise serializers.ValidationError({
                    "service": "This service is currently unavailable."
                })

            if booking.service_reference_id:
                matches = booking.service_reference_id == service.id
            else:
                matches = (
                    (booking.service or "").strip().casefold()
                    == service.title.strip().casefold()
                )

            if not matches:
                raise serializers.ValidationError({
                    "service": "Service does not match your booking."
                })

        if photographer:
            if not instance and not photographer.active:
                raise serializers.ValidationError({
                    "photographer": (
                        "This photographer is currently unavailable."
                    )
                })

            if booking.photographer_id != photographer.id:
                raise serializers.ValidationError({
                    "photographer": (
                        "Photographer does not match your booking."
                    )
                })

        if not instance:
            existing = Review.objects.filter(
                booking=booking
            )

            if service:
                existing = existing.filter(service=service)
            else:
                existing = existing.filter(
                    photographer=photographer
                )

            if existing.exists():
                raise serializers.ValidationError(
                    "You have already reviewed this booking item."
                )

        return attrs

    def create(self, validated_data):
        validated_data["customer"] = self.context["request"].user
        validated_data["status"] = Review.Status.PENDING

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Customers cannot change the booking or review target.
        validated_data.pop("booking", None)
        validated_data.pop("service", None)
        validated_data.pop("photographer", None)

        validated_data["status"] = Review.Status.PENDING

        return super().update(instance, validated_data)


class ReviewSummarySerializer(serializers.Serializer):
    average_rating = serializers.FloatField()
    total_reviews = serializers.IntegerField()
    rating_distribution = serializers.DictField()


def build_review_summary(queryset):
    aggregate = queryset.aggregate(
        average=Avg("rating"),
        total=Count("id")
    )

    distribution = {
        str(star): queryset.filter(rating=star).count()
        for star in range(1, 6)
    }

    return {
        "average_rating": round(aggregate["average"] or 0, 1),
        "total_reviews": aggregate["total"],
        "rating_distribution": distribution,
    }