from django.contrib import admin
from django.utils.html import format_html

from .models import Service, Servicepackage, Studio, Photographer


# =====================================
# SERVICE ADMIN
# =====================================

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "title",
        "price",
        "active",
        "image_preview",
    ]

    search_fields = ["title"]

    list_filter = ["active"]

    list_editable = ["price", "active"]

    readonly_fields = ["image_preview"]

    @admin.display(description="Image")
    def image_preview(self, obj):

        if obj.image:
            url = obj.image.url
        elif obj.image_url:
            url = obj.image_url
        else:
            return "No Image"

        return format_html(
            '<img src="{}" width="100" height="70" '
            'style="object-fit:cover;border-radius:8px;" />',
            url
        )


# =====================================
# SERVICE PACKAGE ADMIN
# =====================================

@admin.register(Servicepackage)
class ServicepackageAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "name",
        "slug",
        "starting_price",
        "duration",
        "is_active",
        "image_preview",
    ]

    search_fields = ["name", "description"]

    list_filter = ["is_active"]

    list_editable = ["starting_price", "is_active"]

    prepopulated_fields = {
        "slug": ("name",)
    }

    readonly_fields = ["image_preview", "created_at"]

    @admin.display(description="Image")
    def image_preview(self, obj):

        if obj.image:
            return format_html(
                '<img src="{}" width="100" height="70" '
                'style="object-fit:cover;border-radius:8px;" />',
                obj.image.url
            )

        return "No Image"


# =====================================
# PHOTOGRAPHER ADMIN
# =====================================

@admin.register(Photographer)
class PhotographerAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "name",
        "role",
        "experience",
        "specialization",
        "active",
        "image_preview",
    ]

    search_fields = [
        "name",
        "specialization",
    ]

    list_filter = ["active"]

    list_editable = ["active"]

    readonly_fields = ["image_preview"]

    @admin.display(description="Profile Image")
    def image_preview(self, obj):

        if obj.profile_image:
            url = obj.profile_image.url
        elif obj.image_url:
            url = obj.image_url
        else:
            return "No Image"

        return format_html(
            '<img src="{}" width="70" height="70" '
            'style="object-fit:cover;border-radius:50%;" />',
            url
        )


# =====================================
# STUDIO ADMIN
# =====================================

@admin.register(Studio)
class StudioAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "name",
        "phone",
        "email",
    ]

    search_fields = [
        "name",
        "email",
        "phone",
    ]


# =====================================
# CUSTOM ADMIN DASHBOARD
# =====================================

admin.site.site_header = "Lenscraft Studio Administration"

admin.site.site_title = "Lenscraft Studio Admin"

admin.site.index_title = "Welcome to Lenscraft Studio Dashboard"