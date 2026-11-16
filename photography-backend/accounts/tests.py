
import re
from datetime import timedelta
from django.core.cache import cache
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailVerificationOTP


User = get_user_model()

BASE_URL = "/api/auth"

COOKIE_NAME = "lenscraft_refresh"

TEST_PASSWORD = "Lenscraft@12345"


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "lenscraft-accounts-tests",
        }
    },
)
class AccountsAuthenticationTests(APITestCase):

    def setUp(self):
        cache.clear()
        mail.outbox.clear()

        self.user = User.objects.create_user(
            email="customer@example.com",
            password=TEST_PASSWORD,
            first_name="Test",
            last_name="Customer",
            phone="9876543210",
            is_active=True,
        )

        self.admin = User.objects.create_superuser(
            email="admin@example.com",
            password=TEST_PASSWORD,
        )

    # --------------------------------------------------
    # HELPER METHODS
    # --------------------------------------------------

    def register_user(self, email="newuser@example.com"):
        return self.client.post(
            f"{BASE_URL}/register/",
            {
                "email": email,
                "password": TEST_PASSWORD,
                "first_name": "New",
                "last_name": "User",
                "phone": "9876543211",
            },
            format="json",
        )

    def get_otp_from_email(self):
        self.assertTrue(mail.outbox)

        email_body = mail.outbox[-1].body

        match = re.search(
            r"(?<!\d)\d{6}(?!\d)",
            email_body,
        )

        self.assertIsNotNone(match)

        return match.group()

    def login_user(self):
        return self.client.post(
            f"{BASE_URL}/login/",
            {
                "email": self.user.email,
                "password": TEST_PASSWORD,
            },
            format="json",
        )

    def register_and_get_otp(self):
        response = self.register_user()

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        return self.get_otp_from_email()

    # --------------------------------------------------
    # 1. USER REGISTRATION TESTS
    # --------------------------------------------------

    def test_register_success(self):

        response = self.register_user()

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            User.objects.filter(
                email="newuser@example.com"
            ).exists()
        )

        user = User.objects.get(
            email="newuser@example.com"
        )

        self.assertFalse(user.is_active)

        self.assertEqual(
            response.data["verification_required"],
            True,
        )

        self.assertEqual(len(mail.outbox), 1)

    def test_register_duplicate_email(self):

        response = self.register_user(
            email=self.user.email
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_register_invalid_email(self):

        response = self.client.post(
            f"{BASE_URL}/register/",
            {
                "email": "invalid-email",
                "password": TEST_PASSWORD,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_register_weak_password(self):

        response = self.client.post(
            f"{BASE_URL}/register/",
            {
                "email": "weak@example.com",
                "password": "123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------
    # 2. EMAIL OTP VERIFICATION TESTS
    # --------------------------------------------------

    def test_verify_email_with_correct_otp(self):

        otp = self.register_and_get_otp()

        response = self.client.post(
            f"{BASE_URL}/verify-email/",
            {
                "email": "newuser@example.com",
                "otp": otp,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        user = User.objects.get(
            email="newuser@example.com"
        )

        self.assertTrue(user.is_active)

        self.assertFalse(
            EmailVerificationOTP.objects.filter(
                user=user
            ).exists()
        )

    def test_verify_email_with_wrong_otp(self):

        self.register_and_get_otp()

        response = self.client.post(
            f"{BASE_URL}/verify-email/",
            {
                "email": "newuser@example.com",
                "otp": "000000",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        verification = EmailVerificationOTP.objects.get(
            user__email="newuser@example.com"
        )

        self.assertEqual(verification.attempts, 1)

    def test_verify_email_with_expired_otp(self):

        self.register_and_get_otp()

        verification = EmailVerificationOTP.objects.get(
            user__email="newuser@example.com"
        )

        verification.expires_at = (
            timezone.now() - timedelta(minutes=1)
        )

        verification.save(update_fields=["expires_at"])

        response = self.client.post(
            f"{BASE_URL}/verify-email/",
            {
                "email": "newuser@example.com",
                "otp": self.get_otp_from_email(),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "expired",
            response.data["detail"].lower(),
        )

    def test_verify_email_after_max_attempts(self):

        self.register_and_get_otp()

        verification = EmailVerificationOTP.objects.get(
            user__email="newuser@example.com"
        )

        verification.attempts = 5

        verification.save(update_fields=["attempts"])

        response = self.client.post(
            f"{BASE_URL}/verify-email/",
            {
                "email": "newuser@example.com",
                "otp": self.get_otp_from_email(),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
        )

    def test_verify_email_invalid_otp_format(self):

        self.register_and_get_otp()

        response = self.client.post(
            f"{BASE_URL}/verify-email/",
            {
                "email": "newuser@example.com",
                "otp": "123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------
    # 3. RESEND OTP TESTS
    # --------------------------------------------------

    def test_resend_otp_success_response(self):

        self.register_and_get_otp()

        response = self.client.post(
            f"{BASE_URL}/resend-otp/",
            {
                "email": "newuser@example.com",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "message",
            response.data,
        )

    def test_resend_otp_respects_cooldown(self):

        self.register_and_get_otp()

        initial_email_count = len(mail.outbox)

        response = self.client.post(
            f"{BASE_URL}/resend-otp/",
            {
                "email": "newuser@example.com",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(mail.outbox),
            initial_email_count,
        )

    def test_resend_otp_unknown_email(self):

        response = self.client.post(
            f"{BASE_URL}/resend-otp/",
            {
                "email": "unknown@example.com",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(len(mail.outbox), 0)

    # --------------------------------------------------
    # 4. LOGIN TESTS
    # --------------------------------------------------

    def test_login_success(self):

        response = self.login_user()

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "access",
            response.data,
        )

        self.assertIn(
            "user",
            response.data,
        )

        self.assertIn(
            COOKIE_NAME,
            response.cookies,
        )

        self.assertTrue(
            response.cookies[COOKIE_NAME]["httponly"]
        )

    def test_login_wrong_password(self):

        response = self.client.post(
            f"{BASE_URL}/login/",
            {
                "email": self.user.email,
                "password": "WrongPassword@123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_login_unverified_user(self):

        User.objects.create_user(
            email="unverified@example.com",
            password=TEST_PASSWORD,
            is_active=False,
        )

        response = self.client.post(
            f"{BASE_URL}/login/",
            {
                "email": "unverified@example.com",
                "password": TEST_PASSWORD,
            },
            format="json",
        )

        # Django's default authentication backend rejects
        # inactive users before the view's 403 check.
        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------
    # 5. JWT ACCESS TOKEN TESTS
    # --------------------------------------------------

    def test_access_token_authentication(self):

        response = self.login_user()

        access_token = response.data["access"]

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )

        current_user_response = self.client.get(
            f"{BASE_URL}/me/"
        )

        self.assertEqual(
            current_user_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            current_user_response.data["email"],
            self.user.email,
        )

    def test_current_user_without_token(self):

        response = self.client.get(
            f"{BASE_URL}/me/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # --------------------------------------------------
    # 6. JWT REFRESH TOKEN TESTS
    # --------------------------------------------------

    def test_refresh_without_cookie(self):

        response = self.client.post(
            f"{BASE_URL}/refresh/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_refresh_with_valid_cookie(self):

        login_response = self.login_user()

        refresh_cookie = login_response.cookies[COOKIE_NAME].value

        self.client.cookies[COOKIE_NAME] = refresh_cookie

        response = self.client.post(
            f"{BASE_URL}/refresh/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "access",
            response.data,
        )

        self.assertIn(
            COOKIE_NAME,
            response.cookies,
        )

    # --------------------------------------------------
    # 7. LOGOUT TESTS
    # --------------------------------------------------

    def test_logout_success(self):

        login_response = self.login_user()

        refresh_cookie = login_response.cookies[COOKIE_NAME].value

        self.client.cookies[COOKIE_NAME] = refresh_cookie

        response = self.client.post(
            f"{BASE_URL}/logout/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["detail"],
            "Logged out successfully.",
        )

        self.assertEqual(
            response.cookies[COOKIE_NAME]["max-age"],
            0,
        )

    def test_logout_without_refresh_cookie(self):

        response = self.client.post(
            f"{BASE_URL}/logout/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    # --------------------------------------------------
    # 8. PROFILE TESTS
    # --------------------------------------------------

    def test_profile_authenticated_user(self):

        login_response = self.login_user()

        access_token = login_response.data["access"]

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )

        response = self.client.get(
            f"{BASE_URL}/profile/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["email"],
            self.user.email,
        )

    def test_profile_without_authentication(self):

        response = self.client.get(
            f"{BASE_URL}/profile/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # --------------------------------------------------
    # 9. ADMIN PERMISSION TESTS
    # --------------------------------------------------

    def test_normal_user_cannot_access_user_list(self):

        login_response = self.login_user()

        access_token = login_response.data["access"]

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )

        response = self.client.get(
            f"{BASE_URL}/users/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_access_user_list(self):

        refresh = RefreshToken.for_user(self.admin)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

        response = self.client.get(
            f"{BASE_URL}/users/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    # --------------------------------------------------
    # 10. CSRF ENDPOINT TEST
    # --------------------------------------------------

    def test_csrf_endpoint(self):

        response = self.client.get(
            f"{BASE_URL}/csrf/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "csrfToken",
            response.data,
        )
