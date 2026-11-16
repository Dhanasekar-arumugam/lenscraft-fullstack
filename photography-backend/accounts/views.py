
import logging
from smtplib import SMTPException

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.core.mail import BadHeaderError
from django.db import IntegrityError, transaction
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import (
    csrf_protect,
    ensure_csrf_cookie,
)

from rest_framework import generics, status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
    IsAdminUser,
)
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import EmailVerificationOTP
from .otp_service import (
    issue_email_otp,
    OTP_MAX_ATTEMPTS,
    OTP_RESEND_COOLDOWN_SECONDS,
)
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UserListSerializer,
    VerifyEmailSerializer,
    ResendOTPSerializer,
)


User = get_user_model()
logger = logging.getLogger(__name__)

# ============================================================
# REFRESH COOKIE CONFIGURATION
# ============================================================

COOKIE_NAME = "lenscraft_refresh"
COOKIE_PATH = "/api/auth/"

REFRESH_COOKIE_MAX_AGE = int(
    settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()
)


def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key=COOKIE_NAME,
        value=str(refresh_token),
        max_age=REFRESH_COOKIE_MAX_AGE,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path=COOKIE_PATH,
    )
    return response


def delete_refresh_cookie(response):
    response.delete_cookie(
        key=COOKIE_NAME,
        path=COOKIE_PATH,
        samesite="Lax",
    )
    return response


# ============================================================
# 1. CSRF TOKEN — ENABLE CSRF COOKIE
# ============================================================

@method_decorator(ensure_csrf_cookie, name="dispatch")
class Csrf(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        csrf_token = get_token(request)

        return Response(
            {
                "csrfToken": csrf_token,
                "message": "CSRF cookie initialized successfully.",
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# 2. REGISTER — CREATE USER AND SEND OTP
# ============================================================

@method_decorator(csrf_protect, name="dispatch")
class Register(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register"

    def post(self, request):
        serializer = RegisterSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                user = serializer.save(is_active=False)
                issue_email_otp(user)

        except IntegrityError:
            return Response(
                {
                    "detail": "An account with this email already exists."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except (SMTPException, OSError, BadHeaderError):
            logger.exception("Failed to send registration OTP")
            return Response(
                {
                    "detail": "Unable to send verification email. Please try again."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "message": "Registration successful. Please verify your email.",
                "email": user.email,
                "verification_required": True,
                "otp_expires_in": 300,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# 3. VERIFY EMAIL OTP
# ============================================================

@method_decorator(csrf_protect, name="dispatch")
class VerifyEmail(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_verify"

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]

        with transaction.atomic():
            try:
                verification = (
                    EmailVerificationOTP.objects
                    .select_for_update()
                    .select_related("user")
                    .get(user__email__iexact=email)
                )

            except EmailVerificationOTP.DoesNotExist:
                return Response(
                    {
                        "detail": "Invalid or expired verification code."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = verification.user

            if user.is_active:
                return Response(
                    {
                        "detail": "Email address is already verified."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if verification.is_expired():
                return Response(
                    {
                        "detail": "OTP expired. Please request a new code."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if verification.attempts >= OTP_MAX_ATTEMPTS:
                return Response(
                    {
                        "detail": "Too many incorrect attempts. Please request a new OTP."
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            if not check_password(otp, verification.otp_hash):
                verification.attempts += 1
                verification.save(update_fields=["attempts"])

                return Response(
                    {
                        "detail": "Invalid OTP. Please try again.",
                        "attempts_remaining": max(
                            0,
                            OTP_MAX_ATTEMPTS - verification.attempts,
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.is_active = True
            user.save(update_fields=["is_active"])

            verification.delete()

        return Response(
            {
                "message": "Email verified successfully. You can now log in.",
                "verified": True,
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# 4. RESEND EMAIL OTP
# ============================================================

@method_decorator(csrf_protect, name="dispatch")
class ResendOTP(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_resend"

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        generic_response = {
            "message": (
                "If an unverified account exists for this email, "
                "a verification code will be sent."
            )
        }

        try:
            with transaction.atomic():
                user = (
                    User.objects
                    .select_for_update()
                    .filter(
                        email__iexact=email,
                        is_active=False,
                    )
                    .first()
                )

                if user is None:
                    return Response(
                        generic_response,
                        status=status.HTTP_200_OK,
                    )

                verification = (
                    EmailVerificationOTP.objects
                    .filter(user=user)
                    .first()
                )

                if verification:
                    elapsed = (
                        timezone.now() - verification.last_sent_at
                    ).total_seconds()

                    if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
                        return Response(
                            generic_response,
                            status=status.HTTP_200_OK,
                        )

                issue_email_otp(user)

        except (SMTPException, OSError, BadHeaderError):
            logger.exception("Failed to resend email OTP")

            return Response(
                {
                    "detail": "Email service is temporarily unavailable."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            generic_response,
            status=status.HTTP_200_OK,
        )


# ============================================================
# 5. LOGIN — JWT AUTHENTICATION
# ============================================================

@method_decorator(csrf_protect, name="dispatch")
class Login(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        if not user.is_active:
            return Response(
                {
                    "detail": "Please verify your email before logging in."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)

        response = Response(
            {
                "message": "Login successful.",
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

        set_refresh_cookie(response, refresh)
        return response


# ============================================================
# 6. REFRESH JWT ACCESS TOKEN
# ============================================================

@method_decorator(csrf_protect, name="dispatch")
class Refresh(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        refresh_token = request.COOKIES.get(COOKIE_NAME)

        if not refresh_token:
            return Response(
                {
                    "detail": "Refresh token not found. Please log in."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            old_refresh = RefreshToken(refresh_token)
            user_id = old_refresh["user_id"]

            user = User.objects.get(
                id=user_id,
                is_active=True,
            )

        except (TokenError, KeyError, User.DoesNotExist):
            response = Response(
                {
                    "detail": "Invalid or expired refresh token."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
            delete_refresh_cookie(response)
            return response

        try:
            old_refresh.blacklist()
            new_refresh = RefreshToken.for_user(user)

        except Exception:
            logger.exception("JWT refresh rotation failed")
            return Response(
                {
                    "detail": "Unable to refresh authentication."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = Response(
            {
                "access": str(new_refresh.access_token)
            },
            status=status.HTTP_200_OK,
        )

        set_refresh_cookie(response, new_refresh)
        return response


# ============================================================
# 7. LOGOUT
# ============================================================

@method_decorator(csrf_protect, name="dispatch")
class Logout(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(COOKIE_NAME)

        if refresh_token:
            try:
                refresh = RefreshToken(refresh_token)
                refresh.blacklist()
            except TokenError:
                pass

        response = Response(
            {
                "detail": "Logged out successfully."
            },
            status=status.HTTP_200_OK,
        )

        delete_refresh_cookie(response)
        return response


# ============================================================
# 8. USER PROFILE
# ============================================================

class Profile(RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ============================================================
# 9. CURRENT USER
# ============================================================

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response(
            {
                "id": user.id,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# 10. ADMIN USER LIST
# ============================================================

class UserListView(generics.ListAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return User.objects.all().order_by("id")
