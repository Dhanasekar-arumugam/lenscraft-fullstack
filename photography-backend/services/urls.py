from django.urls import path

from .views import (
    ServicepackageDetail,
    Services,
    ServiceDetail,
    Servicepackages,
    PhotographerList,
    PhotographerDetail,
    StudioInfo,
)


urlpatterns = [

    # SERVICES
    path(
        "services/",
        Services.as_view(),
        name="service-list-create"
    ),

    path(
        "services/<int:pk>/",
        ServiceDetail.as_view(),
        name="service-detail"
    ),

    # PHOTOGRAPHERS
    path(
        "photographers/",
        PhotographerList.as_view(),
        name="photographer-list"
    ),

    path(
        "photographers/<int:pk>/",
        PhotographerDetail.as_view(),
        name="photographer-detail"
    ),

    # STUDIO
    path(
        "studio/",
        StudioInfo.as_view(),
        name="studio-info"
    ),

    # SERVICE PACKAGES
    path(
        "service-packages/",
        Servicepackages.as_view(),
        name="service-packages"
    ),
    path(
        "service-packages/<int:pk>/",
        ServicepackageDetail.as_view(),
        name="service-package-detail",
    ),

]