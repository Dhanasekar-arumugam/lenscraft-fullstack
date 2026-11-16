from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):

    serializer_class = NotificationSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        )


class UnreadNotificationCountView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        return Response({
            "unread_count": count
        })


class MarkNotificationReadView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        notification = generics.get_object_or_404(
            Notification,
            pk=pk,
            user=request.user,
        )

        notification.is_read = True
        notification.save(update_fields=["is_read"])

        return Response({
            "message": "Notification marked as read.",
            "notification_id": notification.id,
        })


class MarkAllNotificationsReadView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        updated_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).update(is_read=True)

        return Response({
            "message": "All notifications marked as read.",
            "updated_count": updated_count,
        })