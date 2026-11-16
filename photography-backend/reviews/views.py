from django.shortcuts import render

from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response

from services.models import Service, Photographer

from .models import Review
from .permissions import IsReviewOwnerOrStaff, IsStaffUser
from .serializers import (
    ReviewSerializer,
    build_review_summary,
)


class ReviewViewSet(viewsets.ModelViewSet):

    serializer_class = ReviewSerializer

    queryset = Review.objects.select_related(
        "customer",
        "booking",
        "service",
        "photographer",
    )

    http_method_names = [
        "get",
        "post",
        "put",
        "patch",
        "delete",
        "head",
        "options",
    ]
    
    def get_permissions(self):
        if self.action in ["approve", "reject", "moderation"]:
            return [IsStaffUser()]

        if self.action in ["create", "mine"]:
            return [IsAuthenticated()]

        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsReviewOwnerOrStaff()]

        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()

        user = self.request.user

        if self.action == "moderation":
            return queryset

        if self.action == "mine":
            return queryset.filter(customer=user)

        if self.action in [
            "update",
            "partial_update",
            "destroy",
        ]:
            if user.is_authenticated:
                if user.is_staff:
                    return queryset

                return queryset.filter(customer=user)

            return queryset.none()

        if self.action == "retrieve":
            if user.is_authenticated:
                if user.is_staff:
                    return queryset

                return queryset.filter(
                    Q(status=Review.Status.APPROVED)
                    | Q(customer=user)
                )

            return queryset.filter(
                status=Review.Status.APPROVED
            )

        queryset = queryset.filter(
            status=Review.Status.APPROVED
        )

        service_id = self.request.query_params.get("service")
        photographer_id = self.request.query_params.get("photographer")

        if service_id:
            queryset = queryset.filter(service_id=service_id)

        if photographer_id:
            queryset = queryset.filter(
                photographer_id=photographer_id
            )

        return queryset

    def perform_update(self, serializer):
        review = self.get_object()

        # Do not allow staff to change review content through
        # customer edit endpoints. Use moderation actions instead.
        if review.customer_id != self.request.user.id:
            raise PermissionDenied(
                "Only the review owner can edit its content."
            )

        serializer.save()
    def update(self, request, *args, **kwargs):
        review = self.get_object()

        if review.customer_id != request.user.id:
            raise PermissionDenied(
                "Only the review owner can edit its content."
            )

        return super().update(request, *args, **kwargs)


    def partial_update(self, request, *args, **kwargs):
        review = self.get_object()

        if review.customer_id != request.user.id:
            raise PermissionDenied(
                "Only the review owner can edit its content."
            )

        return super().partial_update(request, *args, **kwargs)

    def perform_destroy(self, instance):
        instance.delete()

    @action(
        detail=False,
        methods=["get"],
        url_path="mine"
    )
    def mine(self, request):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="moderation"
    )
    def moderation(self, request):
        queryset = self.get_queryset()

        review_status = request.query_params.get("status")

        if review_status:
            if review_status not in Review.Status.values:
                return Response(
                    {"detail": "Invalid review status."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            queryset = queryset.filter(status=review_status)

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        url_path="approve"
    )
    def approve(self, request, pk=None):
        review = get_object_or_404(
            Review,
            pk=pk
        )

        review.status = Review.Status.APPROVED
        review.save(update_fields=["status", "updated_at"])

        return Response({
            "message": "Review approved successfully.",
            "review": self.get_serializer(review).data,
        })

    @action(
        detail=True,
        methods=["post"],
        url_path="reject"
    )
    def reject(self, request, pk=None):
        review = get_object_or_404(
            Review,
            pk=pk
        )

        review.status = Review.Status.REJECTED
        review.save(update_fields=["status", "updated_at"])

        return Response({
            "message": "Review rejected successfully.",
            "review": self.get_serializer(review).data,
        })

    @action(
        detail=False,
        methods=["get"],
        url_path="summary",
        permission_classes=[AllowAny]
    )
    def summary(self, request):
        queryset = Review.objects.filter(
            status=Review.Status.APPROVED
        )

        service_id = request.query_params.get("service")
        photographer_id = request.query_params.get("photographer")

        if bool(service_id) == bool(photographer_id):
            return Response(
                {
                    "detail": (
                        "Provide exactly one service or photographer ID."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if service_id:
            if not service_id.isdecimal():
                return Response(
                    {"detail": "Invalid service ID."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            get_object_or_404(
                Service,
                pk=service_id,
                active=True
            )

            queryset = queryset.filter(service_id=service_id)

        if photographer_id:
            if not photographer_id.isdecimal():
                return Response(
                    {"detail": "Invalid photographer ID."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            get_object_or_404(
                Photographer,
                pk=photographer_id,
                active=True
            )

            queryset = queryset.filter(
                photographer_id=photographer_id
            )

        return Response(build_review_summary(queryset))