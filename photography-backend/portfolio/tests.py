
import io
import os
import tempfile

from PIL import Image

from django.test import override_settings
from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from .models import PortfolioPhoto


class PortfolioAPITests(APITestCase):

    def setUp(self):
        # Use a temporary folder for uploaded test images.
        self.temp_media = tempfile.TemporaryDirectory()

        media_settings = override_settings(
            MEDIA_ROOT=self.temp_media.name
        )
        media_settings.enable()

        self.addCleanup(self.temp_media.cleanup)
        self.addCleanup(media_settings.disable)

        # Create admin user.
        self.admin = User.objects.create_user(
            email="portfolioadmin@test.com",
            password="Test@12345",
            is_staff=True,
        )

        # Create normal user.
        self.normal_user = User.objects.create_user(
            email="portfoliouser@test.com",
            password="Test@12345",
        )

        self.url = "/api/portfolio/"

        # Create active portfolio photo.
        self.photo = PortfolioPhoto.objects.create(
            title="Wedding Photography",
            description="Wedding photoshoot",
            category="wedding",
            image=self.create_image("wedding.jpg"),
            featured=True,
            is_active=True,
        )

        # Create inactive portfolio photo.
        self.inactive_photo = PortfolioPhoto.objects.create(
            title="Old Portrait",
            description="Inactive photo",
            category="portrait",
            image=self.create_image("portrait.jpg"),
            is_active=False,
        )

    # ======================================
    # IMAGE HELPER
    # ======================================

    def create_image(self, filename="test.jpg", image_format="JPEG"):
        """
        Generate a real image in memory.
        """

        image = Image.new(
            "RGB",
            (100, 100),
            color="red",
        )

        image_bytes = io.BytesIO()
        image.save(image_bytes, format=image_format)
        image_bytes.seek(0)

        return SimpleUploadedFile(
            filename,
            image_bytes.read(),
            content_type=f"image/{image_format.lower()}",
        )

    def create_large_png(self):
        """
        Generate a valid PNG larger than 10 MB.
        """

        image_bytes = io.BytesIO()

        image = Image.frombytes(
            "RGB",
            (1900, 1900),
            os.urandom(1900 * 1900 * 3),
        )

        image.save(
            image_bytes,
            format="PNG",
            compress_level=0,
        )

        image_bytes.seek(0)

        return SimpleUploadedFile(
            "large.png",
            image_bytes.read(),
            content_type="image/png",
        )

    # ======================================
    # 1. LIST PORTFOLIO
    # ======================================

    def test_public_can_list_active_photos(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        titles = [
            item["title"]
            for item in response.data
        ]

        self.assertIn("Wedding Photography", titles)
        self.assertNotIn("Old Portrait", titles)

    def test_admin_can_list_all_photos(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        titles = [
            item["title"]
            for item in response.data
        ]

        self.assertIn("Wedding Photography", titles)
        self.assertIn("Old Portrait", titles)

    def test_filter_photos_by_category(self):
        response = self.client.get(
            self.url,
            {"category": "wedding"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        for item in response.data:
            self.assertEqual(item["category"], "wedding")

    def test_filter_featured_photos(self):
        response = self.client.get(
            self.url,
            {"featured": "true"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        for item in response.data:
            self.assertTrue(item["featured"])

    # ======================================
    # 2. RETRIEVE PORTFOLIO PHOTO
    # ======================================

    def test_public_can_retrieve_active_photo(self):
        response = self.client.get(
            f"{self.url}{self.photo.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["title"],
            "Wedding Photography",
        )

        self.assertTrue(response.data["image_url"])

    def test_public_cannot_retrieve_inactive_photo(self):
        response = self.client.get(
            f"{self.url}{self.inactive_photo.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_admin_can_retrieve_inactive_photo(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(
            f"{self.url}{self.inactive_photo.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_nonexistent_photo_returns_404(self):
        response = self.client.get(
            f"{self.url}999999/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    # ======================================
    # 3. SINGLE IMAGE UPLOAD
    # ======================================

    def test_admin_can_upload_photo(self):
        self.client.force_authenticate(
            user=self.admin
        )

        data = {
            "title": "Fashion Photography",
            "description": "Fashion portfolio image",
            "category": "fashion",
            "image": self.create_image("fashion.jpg"),
            "featured": True,
            "is_active": True,
        }

        response = self.client.post(
            self.url,
            data,
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            PortfolioPhoto.objects.filter(
                title="Fashion Photography"
            ).exists()
        )

        photo = PortfolioPhoto.objects.get(
            title="Fashion Photography"
        )

        self.assertTrue(photo.image)
        self.assertTrue(photo.image.storage.exists(photo.image.name))

    def test_normal_user_cannot_upload_photo(self):
        self.client.force_authenticate(
            user=self.normal_user
        )

        data = {
            "title": "Unauthorized Photo",
            "category": "wedding",
            "image": self.create_image("unauthorized.jpg"),
        }

        response = self.client.post(
            self.url,
            data,
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_anonymous_user_cannot_upload_photo(self):
        data = {
            "title": "Anonymous Photo",
            "category": "wedding",
            "image": self.create_image("anonymous.jpg"),
        }

        response = self.client.post(
            self.url,
            data,
            format="multipart",
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    # ======================================
    # 4. IMAGE VALIDATION
    # ======================================

    def test_invalid_image_file_is_rejected(self):
        self.client.force_authenticate(
            user=self.admin
        )

        invalid_file = SimpleUploadedFile(
            "invalid.jpg",
            b"This is not a real image",
            content_type="image/jpeg",
        )

        response = self.client.post(
            self.url,
            {
                "title": "Invalid Image",
                "category": "wedding",
                "image": invalid_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_unsupported_image_extension_is_rejected(self):
        self.client.force_authenticate(
            user=self.admin
        )

        # A real PNG file with a GIF extension.
        image = self.create_image(
            "unsupported.gif",
            "PNG",
        )

        response = self.client.post(
            self.url,
            {
                "title": "Unsupported Image",
                "category": "wedding",
                "image": image,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_image_larger_than_10_mb_is_rejected(self):
        self.client.force_authenticate(
            user=self.admin
        )

        large_image = self.create_large_png()

        self.assertGreater(
            large_image.size,
            10 * 1024 * 1024,
        )

        response = self.client.post(
            self.url,
            {
                "title": "Large Image",
                "category": "wedding",
                "image": large_image,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # ======================================
    # 5. UPDATE PORTFOLIO PHOTO
    # ======================================

    def test_admin_can_update_photo(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.patch(
            f"{self.url}{self.photo.id}/",
            {
                "title": "Updated Wedding Photography",
                "featured": False,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.photo.refresh_from_db()

        self.assertEqual(
            self.photo.title,
            "Updated Wedding Photography",
        )

        self.assertFalse(self.photo.featured)

    def test_normal_user_cannot_update_photo(self):
        self.client.force_authenticate(
            user=self.normal_user
        )

        response = self.client.patch(
            f"{self.url}{self.photo.id}/",
            {"title": "Unauthorized Update"},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # ======================================
    # 6. DELETE PORTFOLIO PHOTO
    # ======================================

    def test_admin_can_delete_photo_and_image_file(self):
        self.client.force_authenticate(
            user=self.admin
        )

        photo_id = self.photo.id
        image_name = self.photo.image.name
        storage = self.photo.image.storage

        self.assertTrue(
            storage.exists(image_name)
        )

        response = self.client.delete(
            f"{self.url}{photo_id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            PortfolioPhoto.objects.filter(
                id=photo_id
            ).exists()
        )

        self.assertFalse(
            storage.exists(image_name)
        )

    def test_normal_user_cannot_delete_photo(self):
        self.client.force_authenticate(
            user=self.normal_user
        )

        response = self.client.delete(
            f"{self.url}{self.photo.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            PortfolioPhoto.objects.filter(
                id=self.photo.id
            ).exists()
        )

    # ======================================
    # 7. BULK IMAGE UPLOAD
    # ======================================

    def test_admin_can_bulk_upload_photos(self):
        self.client.force_authenticate(
            user=self.admin
        )

        data = {
            "title": "Event Photography",
            "category": "event",
            "description": "Event gallery",
            "images": [
                self.create_image("event1.jpg"),
                self.create_image("event2.jpg"),
            ],
        }

        response = self.client.post(
            f"{self.url}bulk-upload/",
            data,
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            len(response.data["photos"]),
            2,
        )

        self.assertEqual(
            PortfolioPhoto.objects.filter(
                title="Event Photography"
            ).count(),
            2,
        )

    def test_bulk_upload_without_images_is_rejected(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.post(
            f"{self.url}bulk-upload/",
            {
                "title": "Empty Upload",
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_bulk_upload_more_than_20_images_is_rejected(self):
        self.client.force_authenticate(
            user=self.admin
        )

        images = [
            self.create_image(f"photo_{index}.jpg")
            for index in range(21)
        ]

        response = self.client.post(
            f"{self.url}bulk-upload/",
            {
                "title": "Bulk Gallery",
                "images": images,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_normal_user_cannot_bulk_upload(self):
        self.client.force_authenticate(
            user=self.normal_user
        )

        response = self.client.post(
            f"{self.url}bulk-upload/",
            {
                "images": [
                    self.create_image("normal.jpg")
                ],
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
