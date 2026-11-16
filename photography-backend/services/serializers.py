from rest_framework import serializers

from .models import (
    Service,
    Servicepackage,
    Studio,
    Photographer,
)


# ==========================================
# SERVICE SERIALIZER
# ==========================================

class ServiceSerializer(serializers.ModelSerializer):

    # Display image URL in React frontend
    image = serializers.SerializerMethodField()

    # Accept uploaded image from admin dashboard
    uploaded_image = serializers.ImageField(
        source="image",
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Service

        fields = [
            "id",
            "title",
            "description",
            "image",
            "uploaded_image",
            "image_url",
            "price",
            "active",
        ]

        read_only_fields = [
            "id",
            "image",
        ]

    # ======================================
    # GET IMAGE URL
    # ======================================

    def get_image(self, obj):

        request = self.context.get("request")

        # Priority 1: Uploaded image
        if obj.image:

            image_url = obj.image.url

            if request:
                return request.build_absolute_uri(image_url)

            return image_url

        # Priority 2: External image URL
        if obj.image_url:
            return obj.image_url

        return None

    # ======================================
    # VALIDATE TITLE
    # ======================================

    def validate_title(self, value):

        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Service title must contain at least 3 characters."
            )

        return value

    # ======================================
    # VALIDATE PRICE
    # ======================================

    def validate_price(self, value):

        if value < 0:
            raise serializers.ValidationError(
                "Service price cannot be negative."
            )

        return value

    # ======================================
    # VALIDATE IMAGE
    # ======================================

    def validate_uploaded_image(self, value):

        if value is None:
            return value

        max_size = 5 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "Image size must be less than 5 MB."
            )

        allowed_formats = {
            "JPEG",
            "PNG",
            "WEBP",
        }

        image_object = getattr(value, "image", None)

        if image_object is None:
            raise serializers.ValidationError(
                "Invalid image file."
            )

        if image_object.format not in allowed_formats:
            raise serializers.ValidationError(
                "Only JPG, PNG and WebP images are allowed."
            )

        return value


# ==========================================
# STUDIO SERIALIZER
# ==========================================

class StudioSerializer(serializers.ModelSerializer):

    class Meta:
        model = Studio
        fields = "__all__"


# ==========================================
# PHOTOGRAPHER SERIALIZER
# ==========================================

class PhotographerSerializer(serializers.ModelSerializer):

    # Accept uploaded image files
    profile_image = serializers.ImageField(
        required=False,
        allow_null=True
    )

    # Return image URL for frontend
    image = serializers.SerializerMethodField()

    class Meta:
        model = Photographer

        fields = [
            "id",
            "name",
            "role",
            "profile_image",
            "image_url",
            "image",
            "experience",
            "specialization",
            "biography",
            "instagram_link",
            "active",
        ]

        read_only_fields = [
            "id",
            "image",
        ]

    def get_image(self, obj):

        request = self.context.get("request")

        # Priority 1: Uploaded profile image
        if obj.profile_image:

            image_url = obj.profile_image.url

            if request:
                return request.build_absolute_uri(
                    image_url
                )

            return image_url

        # Priority 2: External image URL
        if obj.image_url:
            return obj.image_url

        return None

    def validate_profile_image(self, value):

        if value is None:
            return value

        # Maximum image size: 5 MB
        max_size = 5 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "Image size must be less than 5 MB."
            )

        # Validate actual image format
        allowed_formats = {
            "JPEG",
            "PNG",
            "WEBP",
        }

        image_format = getattr(
            value,
            "image",
            None
        )

        if image_format is None:
            raise serializers.ValidationError(
                "Invalid image file."
            )

        if image_format.format not in allowed_formats:
            raise serializers.ValidationError(
                "Only JPG, PNG and WebP images are allowed."
            )

        return value


# ==========================================
# SERVICE PACKAGE SERIALIZER
# ==========================================

class ServicepackageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    uploaded_image = serializers.ImageField(
        source="image",
        write_only=True,
        required=False,
    )

    class Meta:
        model = Servicepackage
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image_url",
            "uploaded_image",
            "starting_price",
            "duration",
            "is_active",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "image_url",
            "created_at",
        ]

    def get_image_url(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")
        url = obj.image.url

        return request.build_absolute_uri(url) if request else url

    def validate_uploaded_image(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "Image must be smaller than 5 MB."
            )

        if value.image.format not in {"JPEG", "PNG", "WEBP"}:
            raise serializers.ValidationError(
                "Only JPG, PNG, and WebP images are supported."
            )

        return value

    def validate_starting_price(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Starting price cannot be negative."
            )
        return value