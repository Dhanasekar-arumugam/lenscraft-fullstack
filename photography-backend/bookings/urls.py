from django.urls import path

from .views import (
    Bookings,
    MyBookings,
    BookingDetail,
    CancelBooking,
    AdminUnifiedBookingListView,
)


urlpatterns = [

    # =====================================================
    # 1. UNIFIED BOOKING API
    # GET  -> Admin: List all bookings
    # POST -> Customer: Create a booking
    # =====================================================

    path(
        "",
        Bookings.as_view(),
        name="bookings",
    ),

    # =====================================================
    # 2. CUSTOMER BOOKING HISTORY
    # =====================================================

    path(
        "my-bookings/",
        MyBookings.as_view(),
        name="my-bookings",
    ),

    # =====================================================
    # 3. CUSTOMER CANCEL BOOKING
    # =====================================================

    path(
        "<int:pk>/cancel/",
        CancelBooking.as_view(),
        name="cancel-booking",
    ),

    # =====================================================
    # 4. ADMIN BOOKING DETAILS
    # GET / PATCH / DELETE
    # =====================================================

    path(
        "<int:pk>/",
        BookingDetail.as_view(),
        name="booking-detail",
    ),

    # =====================================================
    # 5. ADMIN UNIFIED BOOKING LIST
    # =====================================================

    path(
        "admin/bookings/",
        AdminUnifiedBookingListView.as_view(),
        name="admin-unified-bookings",
    ),

]