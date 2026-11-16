from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path,include
urlpatterns=[path('admin/',admin.site.urls),path('api/auth/',include('accounts.urls')),
             path('api/contacts/',include('contacts.urls')),
             path("api/accounts/", include("accounts.urls")),
             path('api/bookings/',include('bookings.urls')),
             path("api/notifications/",include("notifications.urls"))
             ,path('api/',include('portfolio.urls'))
             ,path('api/',include('services.urls'))
             ,path("api/auth/users/", include("accounts.urls"))
             ,path("api/portfolio/",include("portfolio.urls"))
             ,path("api/reviews/", include("reviews.urls")),
    ]
if settings.DEBUG: urlpatterns+=static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)
