
from django.db import models
from django.core.validators import FileExtensionValidator


class PortfolioPhoto(models.Model):

    CATEGORY_CHOICES = [
        ("wedding", "Wedding"),
        ("portrait", "Portrait"),
        ("fashion", "Fashion"),
        ("event", "Event"),
        ("product", "Product"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=150)

    description = models.TextField(blank=True)

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="wedding",
        db_index=True,
    )

    image = models.ImageField(
        upload_to="portfolio/%Y/%m/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=["jpg", "jpeg", "png", "webp"]
            )
        ],
    )

    featured = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)

    display_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "-created_at"]

    def __str__(self):
        return self.title
