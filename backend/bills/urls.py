from django.urls import path
from . import views

urlpatterns = [
    path('bills/', views.BillView.as_view(), name='bills'),
    path('bills/<int:pk>/', views.BillView.as_view(), name='bill_detail'),
]
