
from django.contrib import admin
from django.utils.html import format_html

from .models import PortfolioPhoto


@admin.register(PortfolioPhoto)
class PortfolioPhotoAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "image_preview",
        "title",
        "category",
        "featured",
        "is_active",
        "display_order",
        "created_at",
    ]

    list_filter = [
        "category",
        "featured",
        "is_active",
    ]

    search_fields = [
        "title",
        "description",
    ]

    list_editable = [
        "featured",
        "is_active",
        "display_order",
    ]

    readonly_fields = [
        "image_preview",
        "created_at",
        "updated_at",
    ]

    def image_preview(self, obj):

        if obj.image:
            return format_html(
                '<img src="{}" style="width:70px;height:55px;'
                'object-fit:cover;border-radius:6px;" />',
                obj.image.url,
            )

        return "No image"

    image_preview.short_description = "Preview"
