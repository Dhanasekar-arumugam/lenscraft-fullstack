
import logging
from datetime import datetime

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from rest_framework import (
    generics,
    permissions,
    serializers,
    status,
)
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from notifications.services import create_booking_notification

from .models import Booking
from .serializers import BookingSerializer
from .notifications import (
    send_booking_created_email,
    send_booking_status_email,
)


logger = logging.getLogger(__name__)


# ============================================================
# EMAIL CONFIGURATION LOGGING
# ============================================================

def log_email_configuration():

    logger.info(
        "Email backend: %s",
        getattr(settings, "EMAIL_BACKEND", "Not configured")
    )

    logger.info(
        "Email host: %s",
        getattr(settings, "EMAIL_HOST", "Not configured")
    )

    logger.info(
        "Email port: %s",
        getattr(settings, "EMAIL_PORT", "Not configured")
    )

    logger.info(
        "Email TLS enabled: %s",
        getattr(settings, "EMAIL_USE_TLS", False)
    )


# ============================================================
# QUEUE BOOKING STATUS EMAIL
# ============================================================

def queue_booking_status_email(booking_id, expected_status):
    """
    Send status email only after the database transaction commits.
    """

    def send_notification():

        try:

            booking = Booking.objects.select_related(
                "customer",
                "service_reference",
                "photographer"
            ).get(pk=booking_id)

            # Prevent sending an outdated status email.
            if booking.status != expected_status:

                logger.warning(
                    "Booking #%s email skipped. "
                    "Expected: %s, Actual: %s",
                    booking_id,
                    expected_status,
                    booking.status
                )

                return

            logger.info(
                "Preparing %s email for booking #%s",
                booking.status,
                booking.pk
            )

            log_email_configuration()

            result = send_booking_status_email(booking)

            logger.info(
                "Booking #%s status email result: %s",
                booking.pk,
                result
            )

        except Booking.DoesNotExist:

            logger.error(
                "Booking #%s not found. Status email skipped.",
                booking_id
            )

        except Exception:

            logger.exception(
                "Booking #%s status email failed.",
                booking_id
            )

    transaction.on_commit(send_notification)


# ============================================================
# QUEUE NEW BOOKING EMAIL
# ============================================================

def queue_booking_created_email(booking_id):
    """
    Send booking acknowledgment email after successful creation.
    """

    def send_notification():

        try:

            booking = Booking.objects.select_related(
                "customer",
                "service_reference",
                "photographer"
            ).get(pk=booking_id)

            if booking.status != Booking.Status.PENDING:

                logger.warning(
                    "Booking #%s acknowledgment skipped. "
                    "Current status: %s",
                    booking_id,
                    booking.status
                )

                return

            logger.info(
                "Preparing booking acknowledgment for #%s",
                booking.pk
            )

            log_email_configuration()

            result = send_booking_created_email(booking)

            logger.info(
                "Booking #%s acknowledgment email result: %s",
                booking.pk,
                result
            )

        except Booking.DoesNotExist:

            logger.error(
                "Booking #%s not found. Acknowledgment skipped.",
                booking_id
            )

        except Exception:

            logger.exception(
                "Booking #%s acknowledgment email failed.",
                booking_id
            )

    transaction.on_commit(send_notification)


# ============================================================
# COMMON BOOKING NOTIFICATION HELPER
# ============================================================

def notify_booking_status(booking, notification_type):
    """
    Create in-app notifications for the customer and admin users.
    """

    try:

        result = create_booking_notification(
            booking,
            notification_type
        )

        logger.info(
            "Booking #%s notification created: %s",
            booking.pk,
            notification_type
        )

        return result

    except Exception:

        logger.exception(
            "Booking #%s notification creation failed.",
            booking.pk
        )

        raise


# ============================================================
# 1. BOOKING LIST + CREATE
# ============================================================

class Bookings(generics.ListCreateAPIView):

    serializer_class = BookingSerializer

    def get_queryset(self):

        user = self.request.user

        if user.is_authenticated and user.is_staff:

            return Booking.objects.select_related(
                "customer",
                "service_reference",
                "photographer"
            ).all()

        return Booking.objects.none()

    def get_permissions(self):

        if self.request.method == "POST":

            return [
                permissions.IsAuthenticated()
            ]

        return [
            permissions.IsAdminUser()
        ]

    def get_throttles(self):

        if self.request.method == "POST":

            self.throttle_scope = "booking"

            return [
                ScopedRateThrottle()
            ]

        return super().get_throttles()

    @transaction.atomic
    def perform_create(self, serializer):

        booking = serializer.save(
            customer=self.request.user,
            status=Booking.Status.PENDING
        )

        notify_booking_status(
            booking,
            "booking_created"
        )

        queue_booking_created_email(
            booking.pk
        )

        logger.info(
            "New booking created: #%s",
            booking.pk
        )


# ============================================================
# 2. CUSTOMER BOOKING HISTORY
# ============================================================

class MyBookings(generics.ListAPIView):

    serializer_class = BookingSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):

        return Booking.objects.select_related(
            "service_reference",
            "photographer"
        ).filter(
            customer=self.request.user
        )


# ============================================================
# 3. ADMIN BOOKING DETAILS
# ============================================================

class BookingDetail(RetrieveUpdateDestroyAPIView):

    queryset = Booking.objects.select_related(
        "customer",
        "service_reference",
        "photographer"
    ).all()

    serializer_class = BookingSerializer

    permission_classes = [
        permissions.IsAdminUser
    ]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options"
    ]

    @transaction.atomic
    def perform_update(self, serializer):
        """
        Update the same locked booking instance.
        Trigger notifications and emails only when
        the booking status actually changes.
        """

        # ----------------------------------------------------
        # LOCK THE ACTUAL BOOKING INSTANCE
        # ----------------------------------------------------

        booking = Booking.objects.select_for_update().get(
            pk=serializer.instance.pk
        )

        old_status = booking.status

        # Use validated values for conflict checking.
        new_status = serializer.validated_data.get(
            "status",
            booking.status
        )

        event_date = serializer.validated_data.get(
            "event_date",
            booking.event_date
        )

        event_time = serializer.validated_data.get(
            "event_time",
            booking.event_time
        )

        photographer = serializer.validated_data.get(
            "photographer",
            booking.photographer
        )

        # ----------------------------------------------------
        # VALIDATE BOOKING CONFIRMATION
        # ----------------------------------------------------

        if (
            new_status == Booking.Status.CONFIRMED
            and old_status != Booking.Status.CONFIRMED
        ):

            if not event_time:

                raise serializers.ValidationError({
                    "event_time": (
                        "Event time is required before "
                        "confirming a booking."
                    )
                })

            from services.models import Studio

            Studio.objects.get_or_create(
                pk=1,
                defaults={
                    "name": "Lenscraft Studio"
                }
            )

            Studio.objects.select_for_update().get(
                pk=1
            )

            conflicts = Booking.objects.filter(
                event_date=event_date,
                event_time=event_time,
                status=Booking.Status.CONFIRMED
            ).exclude(
                pk=booking.pk
            )

            if photographer:

                conflicts = conflicts.filter(
                    photographer=photographer
                )

            if conflicts.exists():

                raise serializers.ValidationError({
                    "detail": (
                        "A booking is already confirmed "
                        "for this date and time."
                    )
                })

        # ----------------------------------------------------
        # SAVE THE LOCKED INSTANCE
        # ----------------------------------------------------

        serializer.instance = booking

        updated_booking = serializer.save()

        logger.info(
            "Booking #%s updated: %s -> %s",
            updated_booking.pk,
            old_status,
            updated_booking.status
        )

        # ----------------------------------------------------
        # NO STATUS CHANGE = NO STATUS NOTIFICATION
        # ----------------------------------------------------

        if old_status == updated_booking.status:

            return

        # ----------------------------------------------------
        # BOOKING CONFIRMED
        # ----------------------------------------------------

        if updated_booking.status == Booking.Status.CONFIRMED:

            notify_booking_status(
                updated_booking,
                "booking_confirmed"
            )

        # ----------------------------------------------------
        # BOOKING CANCELLED
        # ----------------------------------------------------

        elif updated_booking.status == Booking.Status.CANCELLED:

            notify_booking_status(
                updated_booking,
                "booking_cancelled"
            )

        # ----------------------------------------------------
        # BOOKING COMPLETED
        # ----------------------------------------------------

        elif updated_booking.status == Booking.Status.COMPLETED:

            notify_booking_status(
                updated_booking,
                "booking_completed"
            )

        # ----------------------------------------------------
        # QUEUE STATUS EMAIL
        # ----------------------------------------------------

        if updated_booking.status in [
            Booking.Status.CONFIRMED,
            Booking.Status.CANCELLED,
            Booking.Status.COMPLETED,
        ]:

            queue_booking_status_email(
                updated_booking.pk,
                updated_booking.status
            )

            logger.info(
                "Booking #%s %s email queued.",
                updated_booking.pk,
                updated_booking.status
            )


# ============================================================
# 4. CUSTOMER CANCEL BOOKING
# ============================================================

class CancelBooking(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @transaction.atomic
    def post(self, request, pk):

        # ----------------------------------------------------
        # GET AND LOCK CUSTOMER BOOKING
        # ----------------------------------------------------

        try:

            booking = Booking.objects.select_for_update().get(
                pk=pk,
                customer=request.user
            )

        except Booking.DoesNotExist:

            return Response(
                {
                    "detail": "Booking not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ----------------------------------------------------
        # CHECK BOOKING STATUS
        # ----------------------------------------------------

        if booking.status == Booking.Status.CANCELLED:

            return Response(
                {
                    "detail": "Booking is already cancelled."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if booking.status == Booking.Status.COMPLETED:

            return Response(
                {
                    "detail": (
                        "Completed bookings cannot be cancelled."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if booking.status not in [
            Booking.Status.PENDING,
            Booking.Status.CONFIRMED
        ]:

            return Response(
                {
                    "detail": "This booking cannot be cancelled."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # CHECK EVENT DATE AND TIME
        # ----------------------------------------------------

        if booking.event_time:

            event_datetime = datetime.combine(
                booking.event_date,
                booking.event_time
            )

            if timezone.is_naive(event_datetime):

                event_datetime = timezone.make_aware(
                    event_datetime,
                    timezone.get_current_timezone()
                )

            if event_datetime <= timezone.now():

                return Response(
                    {
                        "detail": (
                            "Past or started bookings "
                            "cannot be cancelled."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        elif booking.event_date <= timezone.localdate():

            return Response(
                {
                    "detail": (
                        "Bookings without event time cannot "
                        "be cancelled on or after event date."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # UPDATE BOOKING STATUS
        # ----------------------------------------------------

        booking.status = Booking.Status.CANCELLED

        booking.save(
            update_fields=["status"]
        )

        # ----------------------------------------------------
        # CREATE NOTIFICATIONS
        # ----------------------------------------------------

        notify_booking_status(
            booking,
            "booking_cancelled"
        )

        # ----------------------------------------------------
        # QUEUE CUSTOMER EMAIL
        # ----------------------------------------------------

        queue_booking_status_email(
            booking.pk,
            Booking.Status.CANCELLED
        )

        logger.info(
            "Booking #%s cancelled by customer: %s",
            booking.pk,
            request.user
        )

        return Response(
            {
                "detail": "Booking cancelled successfully.",
                "booking": BookingSerializer(
                    booking,
                    context={"request": request}
                ).data
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# 5. UNIFIED BOOKING CREATE
# ============================================================

class UnifiedBookingCreateView(generics.CreateAPIView):

    queryset = Booking.objects.all()

    serializer_class = BookingSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    throttle_classes = [
        ScopedRateThrottle
    ]

    throttle_scope = "booking"

    @transaction.atomic
    def perform_create(self, serializer):

        booking = serializer.save(
            customer=self.request.user,
            status=Booking.Status.PENDING
        )

        notify_booking_status(
            booking,
            "booking_created"
        )

        queue_booking_created_email(
            booking.pk
        )

        logger.info(
            "Unified booking created: #%s",
            booking.pk
        )


# ============================================================
# 6. ADMIN UNIFIED BOOKING LIST
# ============================================================

class AdminUnifiedBookingListView(generics.ListAPIView):

    queryset = Booking.objects.select_related(
        "customer",
        "service_reference",
        "photographer"
    ).all()

    serializer_class = BookingSerializer

    permission_classes = [
        permissions.IsAdminUser
    ]
