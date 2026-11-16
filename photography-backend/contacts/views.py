from rest_framework import generics,permissions
from rest_framework.throttling import ScopedRateThrottle
from .models import Contact
from .serializers import ContactSerializer
class Contacts(generics.ListCreateAPIView):
 queryset=Contact.objects.all().order_by('-created_at');serializer_class=ContactSerializer
 def get_permissions(self):return [permissions.AllowAny()] if self.request.method=='POST' else [permissions.IsAdminUser()]
 def get_throttles(self):
  if self.request.method=='POST':self.throttle_scope='contact';return [ScopedRateThrottle()]
  return super().get_throttles()
class ContactDetail(generics.RetrieveDestroyAPIView):
 queryset=Contact.objects.all();serializer_class=ContactSerializer;permission_classes=[permissions.IsAdminUser]
