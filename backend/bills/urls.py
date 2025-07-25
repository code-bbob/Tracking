from django.urls import path
from . import views

urlpatterns = [
    path('bills/', views.BillView.as_view(), name='bills'),
]
