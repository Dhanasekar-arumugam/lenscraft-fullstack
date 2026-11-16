
from rest_framework import serializers
from .models import PortfolioPhoto


class PortfolioPhotoSerializer(serializers.ModelSerializer):

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioPhoto

        fields = [
            "id",
            "title",
            "description",
            "category",
            "image",
            "image_url",
            "featured",
            "is_active",
            "display_order",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "image_url",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "image": {"write_only": True},
        }

    def get_image_url(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")
        url = obj.image.url

        if request:
            return request.build_absolute_uri(url)

        return url

    def validate_image(self, image):

        max_size = 10 * 1024 * 1024

        if image.size > max_size:
            raise serializers.ValidationError(
                "Image size must not exceed 10 MB."
            )

        allowed_formats = {"JPEG", "PNG", "WEBP"}

        image_format = getattr(image, "image", None)

        if image_format is None:
            raise serializers.ValidationError(
                "Please upload a valid image."
            )

        if image.image.format not in allowed_formats:
            raise serializers.ValidationError(
                "Only JPG, PNG and WebP images are supported."
            )

        return image
