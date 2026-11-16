
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from .models import Service


class ServiceAPITests(APITestCase):

    def setUp(self):
        # Create admin user
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="Test@12345",
            is_staff=True,
        )

        # Create normal user
        self.normal_user = User.objects.create_user(
            email="user@test.com",
            password="Test@12345",
        )

        # API endpoints
        self.service_url = "/api/services/"

        # Create sample active service
        self.service = Service.objects.create(
            title="Wedding Photography",
            description="Professional wedding photography",
            price=25000,
            active=True,
        )

        # Create inactive service
        self.inactive_service = Service.objects.create(
            title="Old Photography Service",
            description="Inactive service",
            price=10000,
            active=False,
        )

    # ======================================
    # 1. LIST SERVICES
    # ======================================

    def test_public_can_list_active_services(self):
        response = self.client.get(self.service_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        titles = [item["title"] for item in response.data]

        self.assertIn("Wedding Photography", titles)
        self.assertNotIn("Old Photography Service", titles)

    def test_admin_can_list_all_services(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.service_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        titles = [item["title"] for item in response.data]

        self.assertIn("Wedding Photography", titles)
        self.assertIn("Old Photography Service", titles)

    # ======================================
    # 2. RETRIEVE SERVICE
    # ======================================

    def test_public_can_retrieve_active_service(self):
        response = self.client.get(
            f"{self.service_url}{self.service.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["title"],
            "Wedding Photography",
        )

    def test_public_cannot_retrieve_inactive_service(self):
        response = self.client.get(
            f"{self.service_url}{self.inactive_service.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_retrieve_inactive_service(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            f"{self.service_url}{self.inactive_service.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ======================================
    # 3. CREATE SERVICE
    # ======================================

    def test_admin_can_create_service(self):
        self.client.force_authenticate(user=self.admin)

        data = {
            "title": "Birthday Photography",
            "description": "Birthday event photography",
            "price": "15000.00",
            "active": True,
        }

        response = self.client.post(
            self.service_url,
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(
            Service.objects.filter(
                title="Birthday Photography"
            ).exists()
        )

    def test_normal_user_cannot_create_service(self):
        self.client.force_authenticate(user=self.normal_user)

        data = {
            "title": "New Photography",
            "description": "Test description",
            "price": "10000.00",
            "active": True,
        }

        response = self.client.post(
            self.service_url,
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_user_cannot_create_service(self):
        data = {
            "title": "New Photography",
            "description": "Test description",
            "price": "10000.00",
            "active": True,
        }

        response = self.client.post(
            self.service_url,
            data,
            format="json",
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    # ======================================
    # 4. UPDATE SERVICE
    # ======================================

    def test_admin_can_update_service(self):
        self.client.force_authenticate(user=self.admin)

        data = {
            "title": "Premium Wedding Photography",
            "price": "35000.00",
        }

        response = self.client.patch(
            f"{self.service_url}{self.service.id}/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.service.refresh_from_db()

        self.assertEqual(
            self.service.title,
            "Premium Wedding Photography",
        )

        self.assertEqual(
            str(self.service.price),
            "35000.00",
        )

    def test_normal_user_cannot_update_service(self):
        self.client.force_authenticate(user=self.normal_user)

        response = self.client.patch(
            f"{self.service_url}{self.service.id}/",
            {"price": "50000.00"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ======================================
    # 5. DELETE SERVICE
    # ======================================

    def test_admin_can_delete_service(self):
        self.client.force_authenticate(user=self.admin)

        service_id = self.service.id

        response = self.client.delete(
            f"{self.service_url}{service_id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(
            Service.objects.filter(id=service_id).exists()
        )

    def test_normal_user_cannot_delete_service(self):
        self.client.force_authenticate(user=self.normal_user)

        response = self.client.delete(
            f"{self.service_url}{self.service.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.assertTrue(
            Service.objects.filter(id=self.service.id).exists()
        )

    # ======================================
    # 6. VALIDATION TESTS
    # ======================================

    def test_negative_price_is_rejected(self):
        self.client.force_authenticate(user=self.admin)

        data = {
            "title": "Negative Price Service",
            "description": "Test description",
            "price": "-100.00",
        }

        response = self.client.post(
            self.service_url,
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("price", response.data)

    def test_short_title_is_rejected(self):
        self.client.force_authenticate(user=self.admin)

        data = {
            "title": "AB",
            "description": "Test description",
            "price": "1000.00",
        }

        response = self.client.post(
            self.service_url,
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

    def test_duplicate_title_is_rejected(self):
        self.client.force_authenticate(user=self.admin)

        data = {
            "title": "Wedding Photography",
            "description": "Duplicate service",
            "price": "20000.00",
        }

        response = self.client.post(
            self.service_url,
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

    # ======================================
    # 7. NOT FOUND
    # ======================================

    def test_retrieve_nonexistent_service_returns_404(self):
        response = self.client.get(
            f"{self.service_url}999999/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
