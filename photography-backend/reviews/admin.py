
from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "customer",
        "review_target",
        "rating",
        "status",
        "created_at",
    ]

    list_filter = [
        "status",
        "rating",
        "created_at",
    ]

    search_fields = [
        "customer__email",
        "service__title",
        "photographer__name",
        "title",
        "comment",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]

    list_select_related = [
        "customer",
        "service",
        "photographer",
    ]

    actions = [
        "approve_reviews",
        "reject_reviews",
    ]

    @admin.display(description="Review For")
    def review_target(self, obj):
        if obj.service_id:
            return f"Service: {obj.service.title}"

        if obj.photographer_id:
            return f"Photographer: {obj.photographer.name}"

        return "-"

    @admin.action(description="Approve selected reviews")
    def approve_reviews(self, request, queryset):
        count = queryset.update(
            status=Review.Status.APPROVED
        )

        self.message_user(
            request,
            f"{count} review(s) approved."
        )

    @admin.action(description="Reject selected reviews")
    def reject_reviews(self, request, queryset):
        count = queryset.update(
            status=Review.Status.REJECTED
        )

        self.message_user(
            request,
            f"{count} review(s) rejected."
        )

    def save_model(self, request, obj, form, change):
        obj.full_clean()
        super().save_model(request, obj, form, change)