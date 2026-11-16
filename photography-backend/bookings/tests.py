
from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from .models import Booking


class BookingAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="bookingadmin@test.com",
            password="TestPassword123!",
            is_staff=True,
        )

        self.customer = User.objects.create_user(
            email="customer@test.com",
            password="TestPassword123!",
        )

        self.other_customer = User.objects.create_user(
            email="othercustomer@test.com",
            password="TestPassword123!",
        )

        self.base_url = "/api/bookings/"

        self.future_date = timezone.localdate() + timedelta(days=10)

        self.valid_payload = {
            "customer_name": "Dhanasekar",
            "email": "DHANA@TEST.COM",
            "phone": "9876543210",
            "service": "Wedding Photography",
            "event_date": self.future_date.isoformat(),
            "event_location": "Chennai",
            "special_requirements": "Outdoor photography",
        }

    def create_booking(self, **kwargs):
        data = {
            "customer": self.customer,
            "customer_name": "Dhanasekar",
            "email": "dhana@test.com",
            "phone": "9876543210",
            "service": "Wedding Photography",
            "booking_type": Booking.BookingType.SERVICE,
            "event_date": self.future_date,
            "event_location": "Chennai",
            "status": Booking.Status.PENDING,
        }

        data.update(kwargs)
        return Booking.objects.create(**data)

    # --------------------------------------------------
    # BOOKING CREATION
    # --------------------------------------------------

    @patch("bookings.views.queue_booking_created_email")
    @patch("bookings.views.notify_booking_status")
    def test_authenticated_customer_can_create_booking(
        self, mock_notification, mock_email
    ):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            self.base_url,
            self.valid_payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Booking.objects.count(), 1)

        booking = Booking.objects.first()

        self.assertEqual(booking.customer, self.customer)
        self.assertEqual(booking.status, Booking.Status.PENDING)
        self.assertEqual(
            booking.booking_type,
            Booking.BookingType.SERVICE,
        )

        self.assertEqual(booking.email, "dhana@test.com")

        mock_notification.assert_called_once()
        mock_email.assert_called_once_with(booking.pk)

    def test_anonymous_user_cannot_create_booking(self):
        response = self.client.post(
            self.base_url,
            self.valid_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    @patch("bookings.views.queue_booking_created_email")
    @patch("bookings.views.notify_booking_status")
    def test_customer_cannot_set_booking_status_during_creation(
        self, mock_notification, mock_email
    ):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_payload,
            "status": Booking.Status.CONFIRMED,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        booking = Booking.objects.get()

        self.assertEqual(booking.status, Booking.Status.PENDING)

    def test_booking_requires_service_or_photographer(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_payload,
            "service": "",
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------
    # CUSTOMER VALIDATION
    # --------------------------------------------------

    def test_invalid_customer_name_is_rejected(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_payload,
            "customer_name": "AB",
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_invalid_phone_number_is_rejected(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_payload,
            "phone": "12345",
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_invalid_email_is_rejected(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_payload,
            "email": "invalid-email",
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_invalid_event_location_is_rejected(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_payload,
            "event_location": "AB",
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_past_event_date_is_rejected(self):
        self.client.force_authenticate(user=self.customer)

        past_date = timezone.localdate() - timedelta(days=1)

        payload = {
            **self.valid_payload,
            "event_date": past_date.isoformat(),
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_past_event_time_is_rejected(self):
        self.client.force_authenticate(user=self.customer)

        past_time = timezone.localtime() - timedelta(hours=1)

        payload = {
            **self.valid_payload,
            "event_date": timezone.localdate().isoformat(),
            "event_time": past_time.strftime("%H:%M:%S"),
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------
    # ADMIN BOOKING LIST
    # --------------------------------------------------

    def test_admin_can_list_all_bookings(self):
        self.create_booking()
        self.create_booking(customer=self.other_customer)

        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_customer_cannot_access_admin_booking_list(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(self.base_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_anonymous_user_cannot_access_booking_list(self):
        response = self.client.get(self.base_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_admin_unified_booking_list(self):
        self.create_booking()
        self.create_booking(customer=self.other_customer)

        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            self.base_url + "admin/bookings/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_customer_cannot_access_admin_unified_list(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            self.base_url + "admin/bookings/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # --------------------------------------------------
    # CUSTOMER BOOKING HISTORY
    # --------------------------------------------------

    def test_customer_can_view_own_bookings(self):
        self.create_booking()
        self.create_booking(customer=self.other_customer)

        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            self.base_url + "my-bookings/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        self.assertEqual(
            response.data[0]["customer"],
            self.customer.id,
        )

    def test_customer_cannot_view_other_customer_bookings(self):
        self.create_booking(customer=self.other_customer)

        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            self.base_url + "my-bookings/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_anonymous_user_cannot_view_booking_history(self):
        response = self.client.get(
            self.base_url + "my-bookings/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # --------------------------------------------------
    # ADMIN BOOKING DETAILS
    # --------------------------------------------------

    def test_admin_can_retrieve_booking(self):
        booking = self.create_booking()

        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            f"{self.base_url}{booking.pk}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], booking.pk)

    def test_customer_cannot_retrieve_booking_details(self):
        booking = self.create_booking()

        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            f"{self.base_url}{booking.pk}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_update_booking(self):
        booking = self.create_booking()

        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f"{self.base_url}{booking.pk}/",
            {"event_location": "Coimbatore"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        booking.refresh_from_db()

        self.assertEqual(booking.event_location, "Coimbatore")

    def test_customer_cannot_update_booking(self):
        booking = self.create_booking()

        self.client.force_authenticate(user=self.customer)

        response = self.client.patch(
            f"{self.base_url}{booking.pk}/",
            {"event_location": "Coimbatore"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_delete_booking(self):
        booking = self.create_booking()

        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(
            f"{self.base_url}{booking.pk}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Booking.objects.filter(pk=booking.pk).exists()
        )

    def test_customer_cannot_delete_booking(self):
        booking = self.create_booking()

        self.client.force_authenticate(user=self.customer)

        response = self.client.delete(
            f"{self.base_url}{booking.pk}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_nonexistent_booking_returns_404(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            f"{self.base_url}99999/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    # --------------------------------------------------
    # CUSTOMER BOOKING CANCELLATION
    # --------------------------------------------------

    @patch("bookings.views.queue_booking_status_email")
    @patch("bookings.views.notify_booking_status")
    def test_customer_can_cancel_own_pending_booking(
        self, mock_notification, mock_email
    ):
        booking = self.create_booking()

        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            f"{self.base_url}{booking.pk}/cancel/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        booking.refresh_from_db()

        self.assertEqual(
            booking.status,
            Booking.Status.CANCELLED,
        )

        mock_notification.assert_called_once()
        mock_email.assert_called_once_with(
            booking.pk,
            Booking.Status.CANCELLED,
        )

    def test_customer_cannot_cancel_another_users_booking(self):
        booking = self.create_booking(customer=self.other_customer)

        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            f"{self.base_url}{booking.pk}/cancel/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_customer_cannot_cancel_already_cancelled_booking(self):
        booking = self.create_booking(
            status=Booking.Status.CANCELLED
        )

        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            f"{self.base_url}{booking.pk}/cancel/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_customer_cannot_cancel_completed_booking(self):
        booking = self.create_booking(
            status=Booking.Status.COMPLETED
        )

        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            f"{self.base_url}{booking.pk}/cancel/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_customer_cannot_cancel_booking_on_past_date(self):
        booking = self.create_booking(
            event_date=timezone.localdate() - timedelta(days=1)
        )

        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            f"{self.base_url}{booking.pk}/cancel/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_anonymous_user_cannot_cancel_booking(self):
        booking = self.create_booking()

        response = self.client.post(
            f"{self.base_url}{booking.pk}/cancel/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
