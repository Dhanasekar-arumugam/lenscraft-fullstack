from django.urls import path
from .views import Contacts,ContactDetail
urlpatterns=[path('',Contacts.as_view()),path('<int:pk>/',ContactDetail.as_view())]
