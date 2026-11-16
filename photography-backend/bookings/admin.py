from django.contrib import admin
from .models import Booking
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
 list_display=['id','customer_name','service','event_date','event_time','status'];list_filter=['status','service','event_date'];search_fields=['customer_name','email']
