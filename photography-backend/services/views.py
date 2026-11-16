from rest_framework import generics, permissions
from rest_framework.permissions import SAFE_METHODS
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser,
)

from .models import (
    Service,
    Servicepackage,
    Studio,
    Photographer,
)

from .serializers import (
    ServiceSerializer,
    ServicepackageSerializer,
    StudioSerializer,
    PhotographerSerializer,
)


# ==========================================
# CUSTOM PERMISSION
# ==========================================

class AdminWritePermission(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )


# ==========================================
# SERVICE LIST + CREATE
# ==========================================

class Services(generics.ListCreateAPIView):

    serializer_class = ServiceSerializer

    permission_classes = [AdminWritePermission]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated and user.is_staff:
            return Service.objects.all().order_by("-id")

        return Service.objects.filter(
            active=True
        ).order_by("-id")


# ==========================================
# SERVICE DETAIL + UPDATE + DELETE
# ==========================================

class ServiceDetail(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = ServiceSerializer

    permission_classes = [AdminWritePermission]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated and user.is_staff:
            return Service.objects.all()

        return Service.objects.filter(active=True)




# ==========================================
# SERVICE PACKAGES - LIST + CREATE
# ==========================================

class Servicepackages(generics.ListCreateAPIView):
    serializer_class = ServicepackageSerializer
    permission_classes = [AdminWritePermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated and user.is_staff:
            return Servicepackage.objects.all().order_by("-id")

        return Servicepackage.objects.filter(
            is_active=True
        ).order_by("-id")

# ==========================================
# SERVICE PACKAGE - DETAIL + UPDATE + DELETE
# ==========================================

class ServicepackageDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ServicepackageSerializer
    permission_classes = [AdminWritePermission]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated and user.is_staff:
            return Servicepackage.objects.all()

        return Servicepackage.objects.filter(is_active=True)


# ==========================================
# PHOTOGRAPHERS LIST + CREATE
# ==========================================

class PhotographerList(generics.ListCreateAPIView):

    queryset = Photographer.objects.all().order_by("id")

    serializer_class = PhotographerSerializer

    permission_classes = [AdminWritePermission]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]


# ==========================================
# PHOTOGRAPHER DETAIL
# ==========================================

class PhotographerDetail(
    generics.RetrieveUpdateDestroyAPIView
):

    queryset = Photographer.objects.all()

    serializer_class = PhotographerSerializer

    permission_classes = [AdminWritePermission]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]


# ==========================================
# STUDIO INFORMATION
# ==========================================

class StudioInfo(generics.RetrieveAPIView):

    queryset = Studio.objects.all()

    serializer_class = StudioSerializer

    permission_classes = [permissions.AllowAny]

    def get_object(self):
        return (
            Studio.objects.first()
            or Studio(name="Lenscraft Studio")
        )