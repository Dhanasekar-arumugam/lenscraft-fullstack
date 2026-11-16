
from django.db import transaction

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import PortfolioPhoto
from .serializers import PortfolioPhotoSerializer
from .permissions import IsAdminOrReadOnly


class PortfolioListCreateView(generics.ListCreateAPIView):

    serializer_class = PortfolioPhotoSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):

        queryset = PortfolioPhoto.objects.all()

        user = self.request.user

        if not (user.is_authenticated and user.is_staff):
            queryset = queryset.filter(is_active=True)

        category = self.request.query_params.get("category")
        featured = self.request.query_params.get("featured")

        if category:
            queryset = queryset.filter(category=category)

        if featured == "true":
            queryset = queryset.filter(featured=True)

        return queryset


class PortfolioDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = PortfolioPhotoSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):

        queryset = PortfolioPhoto.objects.all()

        user = self.request.user

        if not (user.is_authenticated and user.is_staff):
            queryset = queryset.filter(is_active=True)

        return queryset

    def perform_destroy(self, instance):
        # Remove the database record and its image file.
        image = instance.image

        instance.delete()

        if image:
            image.delete(save=False)


@api_view(["POST"])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def bulk_upload_photos(request):

    images = request.FILES.getlist("images")

    if not images:
        return Response(
            {"detail": "Please select at least one image."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(images) > 20:
        return Response(
            {"detail": "Maximum 20 images per upload."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    title = request.data.get("title", "").strip()
    category = request.data.get("category", "wedding")

    description = request.data.get("description", "")

    featured = str(
        request.data.get("featured", "false")
    ).lower() == "true"

    created = []
    saved_files = []

    try:
        with transaction.atomic():

            for index, image in enumerate(images):

                serializer = PortfolioPhotoSerializer(
                    data={
                        "title": (
                            title or image.name.rsplit(".", 1)[0]
                        ),
                        "description": description,
                        "category": category,
                        "image": image,
                        "featured": featured,
                    },
                    context={"request": request},
                )

                serializer.is_valid(raise_exception=True)

                photo = serializer.save()

                created.append(photo)

                if photo.image:
                    saved_files.append(photo.image.name)

    except Exception:
        # Database rollback does not remove uploaded files.
        from django.core.files.storage import default_storage

        for name in saved_files:
            default_storage.delete(name)

        raise

    result = PortfolioPhotoSerializer(
        created,
        many=True,
        context={"request": request},
    )

    return Response(
        {
            "message": f"{len(created)} photos uploaded successfully.",
            "photos": result.data,
        },
        status=status.HTTP_201_CREATED,
    )
