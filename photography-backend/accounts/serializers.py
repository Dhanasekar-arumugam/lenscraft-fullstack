
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

from .models import User


# ============================================================
# 1. USER PROFILE SERIALIZER
# ============================================================

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "is_staff",
            "is_superuser",
        ]

        read_only_fields = [
            "id",
            "email",
            "is_staff",
            "is_superuser",
        ]


# ============================================================
# 2. REGISTRATION SERIALIZER
# ============================================================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )

    email = serializers.EmailField(required=True)

    class Meta:
        model = User

        fields = [
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
        ]

        read_only_fields = ["id"]

    def validate_email(self, value):

        email = value.strip().lower()

        if User.objects.filter(
            email__iexact=email
        ).exists():

            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return email

    def validate_password(self, value):
        return value

    def create(self, validated_data):

        validated_data["is_active"] = False

        user = User.objects.create_user(
            **validated_data
        )

        return user


# ============================================================
# 3. VERIFY EMAIL OTP SERIALIZER
# ============================================================

class VerifyEmailSerializer(serializers.Serializer):

    email = serializers.EmailField(
        required=True
    )

    otp = serializers.RegexField(
        regex=r"^\d{6}$",
        required=True,
        max_length=6,
        min_length=6,
        error_messages={
            "invalid": "Please enter a valid 6-digit OTP."
        },
    )

    def validate_email(self, value):
        return value.strip().lower()


# ============================================================
# 4. RESEND OTP SERIALIZER
# ============================================================

class ResendOTPSerializer(serializers.Serializer):

    email = serializers.EmailField(
        required=True
    )

    def validate_email(self, value):
        return value.strip().lower()


# ============================================================
# 5. LOGIN SERIALIZER
# ============================================================

class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField(
        required=True
    )

    password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
    )

    def validate(self, data):

        email = data["email"].strip().lower()
        password = data["password"]

        user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )

        if not user or not user.is_active:

            raise serializers.ValidationError({
                "detail": "Invalid email or password."
            })

        data["user"] = user

        return data


# ============================================================
# 6. ADMIN USER LIST SERIALIZER
# ============================================================

class UserListSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "id",
            "email",
            "is_staff",
            "is_active",
            "date_joined",
        ]
