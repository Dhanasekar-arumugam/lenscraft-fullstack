
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from notifications.models import Notification


class NotificationAPITests(APITestCase):

    def setUp(self):
        # -------------------------------------------------
        # USERS
        # -------------------------------------------------

        self.user = User.objects.create_user(
            email="customer@example.com",
            password="TestPassword123!",
        )

        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="TestPassword123!",
        )

        # -------------------------------------------------
        # API URLS
        # -------------------------------------------------

        self.list_url = "/api/notifications/"
        self.unread_count_url = (
            "/api/notifications/unread-count/"
        )
        self.mark_all_read_url = (
            "/api/notifications/mark-all-read/"
        )

        # -------------------------------------------------
        # NOTIFICATIONS
        # -------------------------------------------------

        self.notification = self.create_notification(
            user=self.user,
            title="Booking Created",
            message="Your booking has been created.",
            notification_type=Notification.Type.BOOKING_CREATED,
        )

        self.read_notification = self.create_notification(
            user=self.user,
            title="Booking Confirmed",
            message="Your booking has been confirmed.",
            notification_type=Notification.Type.BOOKING_CONFIRMED,
            is_read=True,
        )

        self.other_notification = self.create_notification(
            user=self.other_user,
            title="Private Notification",
            message="This belongs to another user.",
        )

    # =====================================================
    # HELPER
    # =====================================================

    def create_notification(
        self,
        user,
        title="Test Notification",
        message="Test notification message.",
        notification_type=Notification.Type.INFO,
        is_read=False,
    ):

        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            is_read=is_read,
        )

    # =====================================================
    # AUTHENTICATION TESTS
    # =====================================================

    def test_anonymous_user_cannot_list_notifications(self):

        response = self.client.get(self.list_url)

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_anonymous_user_cannot_check_unread_count(self):

        response = self.client.get(
            self.unread_count_url
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_anonymous_user_cannot_mark_notification_read(self):

        response = self.client.patch(
            f"{self.list_url}{self.notification.id}/read/"
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_anonymous_user_cannot_mark_all_read(self):

        response = self.client.post(
            self.mark_all_read_url
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    # =====================================================
    # NOTIFICATION LIST TESTS
    # =====================================================

    def test_authenticated_user_can_list_notifications(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_user_only_sees_own_notifications(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            self.list_url
        )

        notification_ids = [
            item["id"]
            for item in response.data
        ]

        self.assertIn(
            self.notification.id,
            notification_ids,
        )

        self.assertIn(
            self.read_notification.id,
            notification_ids,
        )

        self.assertNotIn(
            self.other_notification.id,
            notification_ids,
        )

    def test_notification_list_contains_required_fields(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            self.list_url
        )

        notification_data = response.data[0]

        expected_fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "booking_id",
            "is_read",
            "created_at",
        ]

        for field in expected_fields:
            self.assertIn(
                field,
                notification_data,
            )

    def test_notifications_are_ordered_by_latest_first(self):

        self.client.force_authenticate(
            user=self.user
        )

        first = self.create_notification(
            user=self.user,
            title="First",
        )

        second = self.create_notification(
            user=self.user,
            title="Second",
        )

        response = self.client.get(
            self.list_url
        )

        notification_ids = [
            item["id"]
            for item in response.data
        ]

        self.assertEqual(
            notification_ids[0],
            second.id,
        )

        self.assertEqual(
            notification_ids[1],
            first.id,
        )

    # =====================================================
    # UNREAD COUNT TESTS
    # =====================================================

    def test_unread_count_returns_correct_count(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            self.unread_count_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["unread_count"],
            1,
        )

    def test_unread_count_excludes_read_notifications(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            self.unread_count_url
        )

        self.assertEqual(
            response.data["unread_count"],
            Notification.objects.filter(
                user=self.user,
                is_read=False,
            ).count(),
        )

    def test_unread_count_does_not_include_other_users(self):

        self.create_notification(
            user=self.other_user,
            title="Another Unread Notification",
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            self.unread_count_url
        )

        self.assertEqual(
            response.data["unread_count"],
            1,
        )

    def test_unread_count_returns_zero_when_all_are_read(self):

        Notification.objects.filter(
            user=self.user
        ).update(is_read=True)

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            self.unread_count_url
        )

        self.assertEqual(
            response.data["unread_count"],
            0,
        )

    # =====================================================
    # MARK SINGLE NOTIFICATION AS READ
    # =====================================================

    def test_user_can_mark_own_notification_as_read(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.patch(
            f"{self.list_url}{self.notification.id}/read/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.notification.refresh_from_db()

        self.assertTrue(
            self.notification.is_read
        )

    def test_mark_read_returns_success_message(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.patch(
            f"{self.list_url}{self.notification.id}/read/"
        )

        self.assertEqual(
            response.data["message"],
            "Notification marked as read.",
        )

        self.assertEqual(
            response.data["notification_id"],
            self.notification.id,
        )

    def test_user_cannot_mark_other_users_notification_read(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.patch(
            f"{self.list_url}{self.other_notification.id}/read/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.other_notification.refresh_from_db()

        self.assertFalse(
            self.other_notification.is_read
        )

    def test_mark_nonexistent_notification_returns_404(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.patch(
            f"{self.list_url}999999/read/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_mark_already_read_notification_returns_success(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.patch(
            f"{self.list_url}{self.read_notification.id}/read/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.read_notification.refresh_from_db()

        self.assertTrue(
            self.read_notification.is_read
        )

    # =====================================================
    # MARK ALL NOTIFICATIONS AS READ
    # =====================================================

    def test_user_can_mark_all_notifications_as_read(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            self.mark_all_read_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            Notification.objects.filter(
                user=self.user,
                is_read=False,
            ).exists()
        )

    def test_mark_all_read_returns_updated_count(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            self.mark_all_read_url
        )

        self.assertEqual(
            response.data["updated_count"],
            1,
        )

    def test_mark_all_read_does_not_change_other_users_notifications(self):

        self.client.force_authenticate(
            user=self.user
        )

        self.client.post(
            self.mark_all_read_url
        )

        self.other_notification.refresh_from_db()

        self.assertFalse(
            self.other_notification.is_read
        )

    def test_mark_all_read_when_no_unread_notifications(self):

        Notification.objects.filter(
            user=self.user
        ).update(is_read=True)

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            self.mark_all_read_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["updated_count"],
            0,
        )

    # =====================================================
    # NOTIFICATION MODEL TESTS
    # =====================================================

    def test_notification_default_type_is_info(self):

        notification = Notification.objects.create(
            user=self.user,
            title="Information",
            message="General information.",
        )

        self.assertEqual(
            notification.notification_type,
            Notification.Type.INFO,
        )

    def test_notification_default_read_status_is_false(self):

        notification = Notification.objects.create(
            user=self.user,
            title="New Notification",
            message="Unread notification.",
        )

        self.assertFalse(
            notification.is_read
        )

    def test_notification_string_representation(self):

        self.assertEqual(
            str(self.notification),
            f"{self.user} - Booking Created",
        )

    def test_notification_types_are_valid(self):

        valid_types = [
            "booking_created",
            "booking_confirmed",
            "booking_cancelled",
            "booking_completed",
            "info",
        ]

        for notification_type, _ in Notification.Type.choices:
            self.assertIn(
                notification_type,
                valid_types,
            )

