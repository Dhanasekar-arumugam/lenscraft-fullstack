
from datetime import date

from django.test import override_settings

from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from contacts.models import Contact


@override_settings(
    REST_FRAMEWORK={
        "DEFAULT_THROTTLE_RATES": {
            "contact": "1000/hour",
        }
    }
)
class ContactAPITests(APITestCase):

    def setUp(self):

        # ---------------------------------------------
        # USERS
        # ---------------------------------------------

        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="TestPassword123!",
            is_staff=True,
        )

        self.customer = User.objects.create_user(
            email="customer@example.com",
            password="TestPassword123!",
        )

        # ---------------------------------------------
        # API URLS
        # ---------------------------------------------

        self.list_url = "/api/contacts/"

        # ---------------------------------------------
        # CONTACT DATA
        # ---------------------------------------------

        self.valid_payload = {
            "name": "Dhanasekar",
            "email": "dhana@example.com",
            "phone": "+919876543210",
            "service": "Wedding Photography",
            "preferred_date": "2026-12-15",
            "location": "Chennai",
            "message": "I need wedding photography services.",
        }

        # ---------------------------------------------
        # EXISTING CONTACT
        # ---------------------------------------------

        self.contact = Contact.objects.create(
            name="Arun",
            email="arun@example.com",
            phone="9876543210",
            service="Portrait Photography",
            preferred_date=date(2026, 12, 20),
            location="Chennai",
            message="I need portrait photography.",
        )

    # =================================================
    # HELPER
    # =================================================

    def get_contact_detail_url(self, pk):

        return f"{self.list_url}{pk}/"

    # =================================================
    # CREATE CONTACT TESTS
    # =================================================

    def test_anonymous_user_can_submit_contact(self):

        response = self.client.post(
            self.list_url,
            self.valid_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            Contact.objects.count(),
            2,
        )

    def test_authenticated_user_can_submit_contact(self):

        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.post(
            self.list_url,
            self.valid_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_contact_is_saved_correctly(self):

        response = self.client.post(
            self.list_url,
            self.valid_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        contact = Contact.objects.get(
            email="dhana@example.com"
        )

        self.assertEqual(
            contact.name,
            "Dhanasekar",
        )

        self.assertEqual(
            contact.phone,
            "+919876543210",
        )

        self.assertEqual(
            contact.service,
            "Wedding Photography",
        )

    def test_contact_created_at_is_read_only(self):

        payload = self.valid_payload.copy()

        payload["created_at"] = "2020-01-01T00:00:00Z"

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        contact = Contact.objects.get(
            email="dhana@example.com"
        )

        self.assertNotEqual(
            contact.created_at.year,
            2020,
        )

    # =================================================
    # REQUIRED FIELD TESTS
    # =================================================

    def test_contact_requires_name(self):

        payload = self.valid_payload.copy()
        payload.pop("name")

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_contact_requires_email(self):

        payload = self.valid_payload.copy()
        payload.pop("email")

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_contact_requires_phone(self):

        payload = self.valid_payload.copy()
        payload.pop("phone")

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_contact_requires_service(self):

        payload = self.valid_payload.copy()
        payload.pop("service")

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_contact_requires_message(self):

        payload = self.valid_payload.copy()
        payload.pop("message")

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # =================================================
    # EMAIL VALIDATION TESTS
    # =================================================

    def test_invalid_email_is_rejected(self):

        payload = self.valid_payload.copy()
        payload["email"] = "invalid-email"

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # =================================================
    # PHONE VALIDATION TESTS
    # =================================================

    def test_valid_phone_without_country_code(self):

        payload = self.valid_payload.copy()
        payload["phone"] = "9876543210"

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_valid_phone_with_country_code(self):

        payload = self.valid_payload.copy()
        payload["phone"] = "+919876543210"

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_phone_with_less_than_ten_digits_is_rejected(self):

        payload = self.valid_payload.copy()
        payload["phone"] = "123456789"

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_phone_with_more_than_twenty_characters_is_rejected(self):

        payload = self.valid_payload.copy()
        payload["phone"] = "123456789012345678901"

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_phone_with_alphabets_is_rejected(self):

        payload = self.valid_payload.copy()
        payload["phone"] = "98765ABCDE"

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_phone_with_special_symbols_is_rejected(self):

        payload = self.valid_payload.copy()
        payload["phone"] = "98765@3210"

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # =================================================
    # LIST CONTACT TESTS
    # =================================================

    def test_anonymous_user_cannot_list_contacts(self):

        response = self.client.get(
            self.list_url
        )

        self.assertIn(
    response.status_code,
    [
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    ],
)

    def test_normal_user_cannot_list_contacts(self):

        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_list_contacts(self):

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_contacts_are_ordered_latest_first(self):

        Contact.objects.create(
            name="Latest Contact",
            email="latest@example.com",
            phone="9876543211",
            service="Wedding Photography",
            message="Latest enquiry.",
        )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data[0]["name"],
            "Latest Contact",
        )

    # =================================================
    # CONTACT DETAIL TESTS
    # =================================================

    def test_admin_can_retrieve_contact(self):

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(
            self.get_contact_detail_url(
                self.contact.id
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["name"],
            "Arun",
        )

    def test_normal_user_cannot_retrieve_contact(self):

        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.get(
            self.get_contact_detail_url(
                self.contact.id
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_anonymous_user_cannot_retrieve_contact(self):

        response = self.client.get(
            self.get_contact_detail_url(
                self.contact.id
            )
        )

        self.assertIn(
    response.status_code,
    [
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    ],
)

    def test_nonexistent_contact_returns_404(self):

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(
            self.get_contact_detail_url(999999)
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    # =================================================
    # DELETE CONTACT TESTS
    # =================================================

    def test_admin_can_delete_contact(self):

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.delete(
            self.get_contact_detail_url(
                self.contact.id
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Contact.objects.filter(
                id=self.contact.id
            ).exists()
        )

    def test_normal_user_cannot_delete_contact(self):

        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.delete(
            self.get_contact_detail_url(
                self.contact.id
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Contact.objects.filter(
                id=self.contact.id
            ).exists()
        )

    def test_anonymous_user_cannot_delete_contact(self):

        response = self.client.delete(
            self.get_contact_detail_url(
                self.contact.id
            )
        )

        self.assertIn(
    response.status_code,
    [
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    ],
)

        self.assertTrue(
            Contact.objects.filter(
                id=self.contact.id
            ).exists()
        )

    # =================================================
    # MODEL TESTS
    # =================================================

    def test_contact_string_representation(self):

        self.assertEqual(
            str(self.contact),
            "Arun - Portrait Photography",
        )

    def test_contact_without_optional_fields(self):

        contact = Contact.objects.create(
            name="Kavin",
            email="kavin@example.com",
            phone="9876543212",
            service="Event Photography",
            message="I need event photography.",
        )

        self.assertIsNone(
            contact.preferred_date
        )

        self.assertEqual(
            contact.location,
            "",
        )
