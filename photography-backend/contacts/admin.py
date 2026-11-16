from django.contrib import admin
from .models import Contact
@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
 list_display=['name','email','service','preferred_date','created_at'];search_fields=['name','email','phone'];list_filter=['service','created_at']
