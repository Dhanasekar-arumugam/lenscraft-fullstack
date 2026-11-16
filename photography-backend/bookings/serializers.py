import re
from datetime import datetime

from django.utils import timezone
from rest_framework import serializers

from .models import Booking


# ============================================================
# UNIFIED BOOKING SERIALIZER
# Service Booking + Photographer Booking
# ============================================================

class BookingSerializer(serializers.ModelSerializer):

    # --------------------------------------------------------
    # READ-ONLY DISPLAY FIELDS
    # --------------------------------------------------------

    service_name = serializers.SerializerMethodField()

    photographer_name = serializers.SerializerMethodField()

    booking_type_display = serializers.CharField(
        source="get_booking_type_display",
        read_only=True
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True
    )

    # --------------------------------------------------------
    # META
    # --------------------------------------------------------

    class Meta:
        model = Booking

        fields = [
            "id",

            # Customer
            "customer",
            "customer_name",
            "email",
            "phone",

            # Booking Selection
            "service",
            "service_reference",
            "service_name",
            "photographer",
            "photographer_name",

            # Booking Type
            "booking_type",
            "booking_type_display",

            # Event Details
            "event_date",
            "event_time",
            "event_location",
            "special_requirements",

            # Status
            "status",
            "status_display",

            # Created Date
            "created_at",
        ]

        read_only_fields = [
            "id",
            "customer",
            "service_name",
            "photographer_name",
            "booking_type",
            "booking_type_display",
            "status_display",
            "created_at",
        ]

        extra_kwargs = {
            "service": {
                "required": False,
                "allow_blank": True,
            },
            "service_reference": {
                "required": False,
                "allow_null": True,
            },
            "photographer": {
                "required": False,
                "allow_null": True,
            },
            "event_time": {
                "required": False,
                "allow_null": True,
            },
            "special_requirements": {
                "required": False,
                "allow_blank": True,
            },
        }

    # ========================================================
    # DISPLAY SERVICE NAME
    # ========================================================

    def get_service_name(self, obj):

        if obj.service_reference_id:
            return obj.service_reference.title

        return obj.service or None

    # ========================================================
    # DISPLAY PHOTOGRAPHER NAME
    # ========================================================

    def get_photographer_name(self, obj):

        if obj.photographer_id:
            return obj.photographer.name

        return None

    # ========================================================
    # FIELD PERMISSIONS
    # ========================================================

    def get_fields(self):

        fields = super().get_fields()

        request = self.context.get("request")

        # Only staff can modify booking status
        if not request or not request.user.is_staff:
            fields["status"].read_only = True

        return fields

    # ========================================================
    # CUSTOMER NAME VALIDATION
    # ========================================================

    def validate_customer_name(self, value):

        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Name must contain at least 3 characters."
            )

        return value

    # ========================================================
    # EMAIL VALIDATION
    # ========================================================

    def validate_email(self, value):

        return value.strip().lower()

    # ========================================================
    # PHONE NUMBER VALIDATION
    # ========================================================

    def validate_phone(self, value):

        value = value.strip()

        if not re.fullmatch(r"[6-9]\d{9}", value):
            raise serializers.ValidationError(
                "Enter a valid 10-digit Indian mobile number."
            )

        return value

    # ========================================================
    # SERVICE VALIDATION
    # ========================================================

    def validate_service(self, value):

        return value.strip()

    # ========================================================
    # PHOTOGRAPHER VALIDATION
    # ========================================================

    def validate_photographer(self, value):

        if value and not value.active:
            raise serializers.ValidationError(
                "This photographer is currently unavailable."
            )

        return value

    # ========================================================
    # EVENT LOCATION VALIDATION
    # ========================================================

    def validate_event_location(self, value):

        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Please enter a valid event location."
            )

        return value

    # ========================================================
    # OBJECT VALIDATION
    # ========================================================

    def validate(self, attrs):

        # ----------------------------------------------------
        # GET CURRENT OR UPDATED VALUES
        # ----------------------------------------------------

        instance = self.instance

        service = attrs.get(
            "service",
            getattr(instance, "service", "")
        )

        service_reference = attrs.get(
            "service_reference",
            getattr(instance, "service_reference", None)
        )

        photographer = attrs.get(
            "photographer",
            getattr(instance, "photographer", None)
        )

        event_date = attrs.get(
            "event_date",
            getattr(instance, "event_date", None)
        )

        event_time = attrs.get(
            "event_time",
            getattr(instance, "event_time", None)
        )

        # ----------------------------------------------------
        # VALIDATE BOOKING SELECTION
        # ----------------------------------------------------

        has_service = bool(
            (service or "").strip()
            or service_reference
        )

        has_photographer = bool(photographer)

        if not has_service and not has_photographer:
            raise serializers.ValidationError({
                "service": (
                    "Please select at least one service "
                    "or photographer."
                )
            })

        # ----------------------------------------------------
        # DETERMINE BOOKING TYPE AUTOMATICALLY
        # ----------------------------------------------------

        if has_service and has_photographer:

            attrs["booking_type"] = Booking.BookingType.BOTH

        elif has_photographer:

            attrs["booking_type"] = Booking.BookingType.PHOTOGRAPHER

        else:

            attrs["booking_type"] = Booking.BookingType.SERVICE

        # ----------------------------------------------------
        # VALIDATE PHOTOGRAPHER AVAILABILITY
        # ----------------------------------------------------

        if photographer and not photographer.active:
            raise serializers.ValidationError({
                "photographer": (
                    "The selected photographer is unavailable."
                )
            })

        # ----------------------------------------------------
        # VALIDATE EVENT DATE
        # ----------------------------------------------------

        if event_date:

            today = timezone.localdate()

            if event_date < today:
                raise serializers.ValidationError({
                    "event_date": (
                        "Please select today or a future date."
                    )
                })

        # ----------------------------------------------------
        # VALIDATE EVENT DATE AND TIME
        # ----------------------------------------------------

        if event_date and event_time:

            event_datetime = datetime.combine(
                event_date,
                event_time
            )

            if timezone.is_naive(event_datetime):
                event_datetime = timezone.make_aware(
                    event_datetime,
                    timezone.get_current_timezone()
                )

            if event_datetime <= timezone.now():
                raise serializers.ValidationError({
                    "event_time": (
                        "Please select a future event date and time."
                    )
                })

        return attrs

    # ========================================================
    # CREATE BOOKING
    # ========================================================

    def create(self, validated_data):

        request = self.context.get("request")

        # Automatically attach logged-in customer
        if request and request.user.is_authenticated:
            validated_data["customer"] = request.user

        # New bookings always start as pending
        validated_data["status"] = Booking.Status.PENDING

        booking = Booking.objects.create(
            **validated_data
        )

        return booking

    # ========================================================
    # UPDATE BOOKING
    # ========================================================

    def update(self, instance, validated_data):

        request = self.context.get("request")

        # Prevent non-admin users from changing booking status
        if not request or not request.user.is_staff:
            validated_data.pop("status", None)

        for attribute, value in validated_data.items():
            setattr(instance, attribute, value)

        instance.save()

        return instance