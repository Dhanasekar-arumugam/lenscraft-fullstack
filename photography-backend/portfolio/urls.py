
from django.urls import path

from .views import (
    PortfolioListCreateView,
    PortfolioDetailView,
    bulk_upload_photos,
)

urlpatterns = [
    path(
        "",
        PortfolioListCreateView.as_view(),
        name="portfolio-list",
    ),
    path(
        "bulk-upload/",
        bulk_upload_photos,
        name="portfolio-bulk-upload",
    ),
    path(
        "<int:pk>/",
        PortfolioDetailView.as_view(),
        name="portfolio-detail",
    ),
]
