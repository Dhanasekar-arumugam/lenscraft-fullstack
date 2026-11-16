from django.urls import path
from .views import ResendOTP, UserListView, VerifyEmail
from .views import (
    Register,
    Login,
    Refresh,
    Logout,
    Profile,
    Csrf,
    CurrentUserView,
)

urlpatterns = [

    # CSRF
    path(
        "csrf/",
        Csrf.as_view(),
        name="auth-csrf"
    ),

    # Registration
    path(
        "register/",
        Register.as_view(),
        name="auth-register"
    ),

    # Login
    path(
        "login/",
        Login.as_view(),
        name="auth-login"
    ),

    # Refresh JWT
    path(
        "refresh/",
        Refresh.as_view(),
        name="auth-refresh"
    ),

    # Logout
    path(
        "logout/",
        Logout.as_view(),
        name="auth-logout"
    ),

    # User profile
    path(
        "profile/",
        Profile.as_view(),
        name="auth-profile"
    ),

    # Current user
    path(
        "me/",
        CurrentUserView.as_view(),
        name="auth-current-user"
    ),
    # User list
    path("users/", UserListView.as_view(), name="user-list"),
     path("verify-email/", VerifyEmail.as_view(), name="auth-verify-email"),
    path("resend-otp/", ResendOTP.as_view(), name="auth-resend-otp"),
]