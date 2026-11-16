import re
from rest_framework import serializers
from .models import Contact
class ContactSerializer(serializers.ModelSerializer):
 class Meta:
  model=Contact;fields='__all__';read_only_fields=['id','created_at']
 def validate_phone(self,value):
  if not re.fullmatch(r'\+?[0-9 ()-]{10,20}',value) or len(re.sub(r'\D','',value))<10:raise serializers.ValidationError('Enter a valid phone number')
  return value
