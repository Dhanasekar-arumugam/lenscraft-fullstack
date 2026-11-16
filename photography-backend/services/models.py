from django.db import models


# ==========================================
# SERVICE MODEL
# ==========================================

class Service(models.Model):

    title = models.CharField(
        max_length=120,
        unique=True
    )
    

    description = models.TextField()

    image = models.ImageField(
        upload_to="services/",
        blank=True,
        null=True
    )

    image_url = models.URLField(
        blank=True
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    active = models.BooleanField(
        default=True
    )

    def __str__(self):
        return self.title


# ==========================================
# STUDIO MODEL
# ==========================================

class Studio(models.Model):

    name = models.CharField(
        max_length=120,
        default="Lenscraft Studio"
    )

    story = models.TextField(
        blank=True
    )

    mission = models.TextField(
        blank=True
    )

    vision = models.TextField(
        blank=True
    )

    address = models.CharField(
        max_length=255,
        blank=True
    )

    phone = models.CharField(
        max_length=30,
        blank=True
    )

    email = models.EmailField(
        blank=True
    )

    def __str__(self):
        return self.name


# ==========================================
# PHOTOGRAPHER MODEL
# ==========================================

class Photographer(models.Model):

    name = models.CharField(
        max_length=120
    )

    role = models.CharField(
        max_length=120
    )

    # Upload image from computer
    profile_image = models.ImageField(
        upload_to="photographers/",
        blank=True,
        null=True
    )

    # Alternative image URL
    image_url = models.URLField(
        blank=True
    )

    experience = models.PositiveIntegerField(
        default=0
    )

    specialization = models.CharField(
        max_length=150,
        blank=True
    )

    biography = models.TextField(
        blank=True
    )

    instagram_link = models.URLField(
        blank=True
    )

    active = models.BooleanField(
        default=True
    )

    def __str__(self):
        return self.name


# ==========================================
# SERVICE PACKAGE MODEL
# ==========================================

class Servicepackage(models.Model):

    name = models.CharField(
        max_length=150
    )

    slug = models.SlugField(
        max_length=180,
        unique=True
    )

    description = models.TextField()

    image = models.ImageField(
        upload_to="services/",
        blank=True,
        null=True
    )

    starting_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    duration = models.CharField(
        max_length=100,
        blank=True
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name