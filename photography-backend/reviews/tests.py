
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from bookings.models import Booking
from services.models import Service, Photographer
from reviews.models import Review


class ReviewAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="reviewadmin@test.com",
            password="TestPassword123!",
            is_staff=True,
        )

        self.customer = User.objects.create_user(
            email="reviewcustomer@test.com",
            password="TestPassword123!",
        )

        self.other_customer = User.objects.create_user(
            email="otherreviewcustomer@test.com",
            password="TestPassword123!",
        )

        self.service = Service.objects.create(
            title="Wedding Photography",
            description="Wedding photography service",
            price="25000.00",
            active=True,
        )

        self.inactive_service = Service.objects.create(
            title="Inactive Photography",
            description="Inactive service",
            active=False,
        )

        self.photographer = Photographer.objects.create(
            name="Kavin",
            role="Professional Photographer",
            experience=5,
            specialization="Wedding Photography",
            active=True,
        )

        self.inactive_photographer = Photographer.objects.create(
            name="Inactive Photographer",
            role="Photographer",
            active=False,
        )

        self.completed_booking = self.create_booking(
            customer=self.customer,
            status=Booking.Status.COMPLETED,
            service_reference=self.service,
            service="Wedding Photography",
        )

        self.pending_booking = self.create_booking(
            customer=self.customer,
            status=Booking.Status.PENDING,
            service_reference=self.service,
            service="Wedding Photography",
        )

        self.photographer_booking = self.create_booking(
            customer=self.customer,
            status=Booking.Status.COMPLETED,
            photographer=self.photographer,
            service="",
            booking_type=Booking.BookingType.PHOTOGRAPHER,
        )

        self.other_booking = self.create_booking(
            customer=self.other_customer,
            status=Booking.Status.COMPLETED,
            service_reference=self.service,
            service="Wedding Photography",
        )

        self.base_url = "/api/reviews/"

        self.valid_service_payload = {
            "booking": self.completed_booking.id,
            "service": self.service.id,
            "rating": 5,
            "title": "Excellent service",
            "comment": "Very professional photography service.",
        }

        self.valid_photographer_payload = {
            "booking": self.photographer_booking.id,
            "photographer": self.photographer.id,
            "rating": 5,
            "title": "Great photographer",
            "comment": "Amazing photography experience.",
        }

    def create_booking(self, **kwargs):
        data = {
            "customer": self.customer,
            "customer_name": "Dhanasekar",
            "email": "reviewcustomer@test.com",
            "phone": "9876543210",
            "service": "Wedding Photography",
            "booking_type": Booking.BookingType.SERVICE,
            "event_date": timezone.localdate() + timedelta(days=10),
            "event_location": "Chennai",
            "status": Booking.Status.COMPLETED,
        }

        data.update(kwargs)
        return Booking.objects.create(**data)

    def create_review(self, **kwargs):
        data = {
            "customer": self.customer,
            "booking": self.completed_booking,
            "service": self.service,
            "photographer": None,
            "rating": 5,
            "title": "Excellent",
            "comment": "Excellent photography service.",
            "status": Review.Status.PENDING,
        }

        data.update(kwargs)
        return Review.objects.create(**data)

    # ==================================================
    # REVIEW CREATION
    # ==================================================

    def test_customer_can_submit_service_review(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            self.base_url,
            self.valid_service_payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        review = Review.objects.get()

        self.assertEqual(review.customer, self.customer)
        self.assertEqual(review.booking, self.completed_booking)
        self.assertEqual(review.service, self.service)
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.status, Review.Status.PENDING)

    def test_customer_can_submit_photographer_review(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            self.base_url,
            self.valid_photographer_payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        review = Review.objects.get()

        self.assertEqual(review.photographer, self.photographer)
        self.assertEqual(review.service, None)

    def test_anonymous_user_cannot_submit_review(self):
        response = self.client.post(
            self.base_url,
            self.valid_service_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_review_customer_is_assigned_automatically(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "customer": self.other_customer.id,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(
            Review.objects.get().customer,
            self.customer,
        )

    def test_new_review_status_is_pending(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "status": Review.Status.APPROVED,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(
            Review.objects.get().status,
            Review.Status.PENDING,
        )

    # ==================================================
    # REVIEW VALIDATION
    # ==================================================

    def test_review_requires_booking(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "booking": None,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_review_requires_exactly_one_target(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "photographer": self.photographer.id,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_review_requires_service_or_photographer(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            "booking": self.completed_booking.id,
            "rating": 5,
            "comment": "Good experience.",
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rating_below_one_is_rejected(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "rating": 0,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rating_above_five_is_rejected(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "rating": 6,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_review_requires_comment(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "comment": "",
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_whitespace_only_comment_is_rejected(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "comment": "     ",
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_customer_cannot_review_another_users_booking(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "booking": self.other_booking.id,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_only_completed_bookings_can_be_reviewed(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "booking": self.pending_booking.id,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_service_cannot_be_reviewed(self):
        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "service": self.inactive_service.id,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_photographer_cannot_be_reviewed(self):
        self.client.force_authenticate(user=self.customer)

        booking = self.create_booking(
            customer=self.customer,
            status=Booking.Status.COMPLETED,
            photographer=self.inactive_photographer,
            service="",
            booking_type=Booking.BookingType.PHOTOGRAPHER,
        )

        payload = {
            "booking": booking.id,
            "photographer": self.inactive_photographer.id,
            "rating": 5,
            "comment": "Good experience.",
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_service_must_match_booking(self):
        another_service = Service.objects.create(
            title="Portrait Photography",
            description="Portrait photography",
        )

        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_service_payload,
            "service": another_service.id,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_photographer_must_match_booking(self):
        another_photographer = Photographer.objects.create(
            name="Jones",
            role="Photographer",
        )

        self.client.force_authenticate(user=self.customer)

        payload = {
            **self.valid_photographer_payload,
            "photographer": another_photographer.id,
        }

        response = self.client.post(
            self.base_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_service_review_is_rejected(self):
        self.create_review()

        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            self.base_url,
            self.valid_service_payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_photographer_review_is_rejected(self):
        Review.objects.create(
            customer=self.customer,
            booking=self.photographer_booking,
            photographer=self.photographer,
            rating=5,
            comment="Excellent photographer.",
        )

        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            self.base_url,
            self.valid_photographer_payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ==================================================
    # PUBLIC REVIEW LIST AND RETRIEVAL
    # ==================================================

    def test_public_list_shows_only_approved_reviews(self):
        self.create_review(status=Review.Status.PENDING)

        self.create_review(
            booking=self.other_booking,
            customer=self.other_customer,
            status=Review.Status.APPROVED,
        )

        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["status"],
            Review.Status.APPROVED,
        )

    def test_public_user_can_retrieve_approved_review(self):
        review = self.create_review(status=Review.Status.APPROVED)

        response = self.client.get(
            f"{self.base_url}{review.pk}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_public_user_cannot_retrieve_pending_review(self):
        review = self.create_review(status=Review.Status.PENDING)

        response = self.client.get(
            f"{self.base_url}{review.pk}/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_can_retrieve_own_pending_review(self):
        review = self.create_review(status=Review.Status.PENDING)

        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            f"{self.base_url}{review.pk}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_other_customer_cannot_retrieve_pending_review(self):
        review = self.create_review(status=Review.Status.PENDING)

        self.client.force_authenticate(user=self.other_customer)

        response = self.client.get(
            f"{self.base_url}{review.pk}/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ==================================================
    # CUSTOMER REVIEW HISTORY
    # ==================================================

    def test_customer_can_view_own_reviews(self):
        self.create_review()

        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            self.base_url + "mine/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_customer_cannot_view_other_customers_reviews(self):
        self.create_review(
            customer=self.other_customer,
            booking=self.other_booking,
        )

        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            self.base_url + "mine/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_anonymous_user_cannot_view_review_history(self):
        response = self.client.get(
            self.base_url + "mine/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # ==================================================
    # REVIEW UPDATE AND DELETE
    # ==================================================

    def test_owner_can_update_own_review(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.customer)

        response = self.client.patch(
            f"{self.base_url}{review.pk}/",
            {
                "rating": 4,
                "comment": "Updated review comment.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        review.refresh_from_db()

        self.assertEqual(review.rating, 4)
        self.assertEqual(review.status, Review.Status.PENDING)

    def test_owner_cannot_change_review_booking(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.customer)

        response = self.client.patch(
            f"{self.base_url}{review.pk}/",
            {"booking": self.pending_booking.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        review.refresh_from_db()

        self.assertEqual(review.booking, self.completed_booking)

    def test_owner_cannot_change_review_target(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.customer)

        response = self.client.patch(
            f"{self.base_url}{review.pk}/",
            {"photographer": self.photographer.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        review.refresh_from_db()

        self.assertEqual(review.service, self.service)
        self.assertIsNone(review.photographer)

    def test_other_customer_cannot_update_review(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.other_customer)

        response = self.client.patch(
            f"{self.base_url}{review.pk}/",
            {"comment": "Trying to edit another review."},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_owner_can_delete_own_review(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.customer)

        response = self.client.delete(
            f"{self.base_url}{review.pk}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Review.objects.filter(pk=review.pk).exists()
        )

    def test_other_customer_cannot_delete_review(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.other_customer)

        response = self.client.delete(
            f"{self.base_url}{review.pk}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    # ==================================================
    # ADMIN MODERATION
    # ==================================================

    def test_admin_can_view_moderation_list(self):
        self.create_review()

        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            self.base_url + "moderation/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_customer_cannot_view_moderation_list(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            self.base_url + "moderation/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_filter_moderation_by_status(self):
        self.create_review(status=Review.Status.PENDING)

        self.create_review(
            customer=self.other_customer,
            booking=self.other_booking,
            status=Review.Status.APPROVED,
        )

        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            self.base_url + "moderation/?status=approved"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_invalid_moderation_status_is_rejected(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            self.base_url + "moderation/?status=unknown"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_approve_review(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            f"{self.base_url}{review.pk}/approve/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        review.refresh_from_db()

        self.assertEqual(review.status, Review.Status.APPROVED)

    def test_admin_can_reject_review(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            f"{self.base_url}{review.pk}/reject/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        review.refresh_from_db()

        self.assertEqual(review.status, Review.Status.REJECTED)

    def test_customer_cannot_approve_review(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            f"{self.base_url}{review.pk}/approve/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_customer_cannot_reject_review(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            f"{self.base_url}{review.pk}/reject/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_staff_cannot_edit_review_content(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f"{self.base_url}{review.pk}/",
            {"comment": "Admin trying to edit content."},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # ==================================================
    # REVIEW SUMMARY
    # ==================================================

    def test_service_review_summary(self):
        self.create_review(
            rating=5,
            status=Review.Status.APPROVED,
        )

        self.create_review(
            customer=self.other_customer,
            booking=self.other_booking,
            rating=3,
            status=Review.Status.APPROVED,
        )

        response = self.client.get(
            f"{self.base_url}summary/?service={self.service.id}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["average_rating"], 4.0)
        self.assertEqual(response.data["total_reviews"], 2)

    def test_photographer_review_summary(self):
        Review.objects.create(
            customer=self.customer,
            booking=self.photographer_booking,
            photographer=self.photographer,
            rating=5,
            comment="Excellent photographer.",
            status=Review.Status.APPROVED,
        )

        response = self.client.get(
            f"{self.base_url}summary/?photographer={self.photographer.id}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["average_rating"], 5.0)
        self.assertEqual(response.data["total_reviews"], 1)

    def test_summary_requires_exactly_one_target(self):
        response = self.client.get(
            self.base_url + "summary/"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_summary_rejects_both_targets(self):
        response = self.client.get(
            f"{self.base_url}summary/?service={self.service.id}&photographer={self.photographer.id}"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_summary_rejects_invalid_service_id(self):
        response = self.client.get(
            self.base_url + "summary/?service=invalid"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_summary_rejects_nonexistent_service(self):
        response = self.client.get(
            self.base_url + "summary/?service=99999"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_summary_rejects_inactive_service(self):
        response = self.client.get(
            f"{self.base_url}summary/?service={self.inactive_service.id}"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_summary_rejects_invalid_photographer_id(self):
        response = self.client.get(
            self.base_url + "summary/?photographer=invalid"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_summary_rejects_inactive_photographer(self):
        response = self.client.get(
            f"{self.base_url}summary/?photographer={self.inactive_photographer.id}"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_summary_excludes_pending_reviews(self):
        self.create_review(
            rating=5,
            status=Review.Status.PENDING,
        )

        response = self.client.get(
            f"{self.base_url}summary/?service={self.service.id}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_reviews"], 0)
        self.assertEqual(response.data["average_rating"], 0)
