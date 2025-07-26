from django.urls import path
from . import views
from . import analytics_views

urlpatterns = [
    path('bills/', views.BillView.as_view(), name='bills'),
    path('bills/<int:pk>/', views.BillView.as_view(), name='bill_detail'),
    
    # Analytics endpoints
    path('analytics/overview/', analytics_views.analytics_overview, name='analytics_overview'),
    path('analytics/barcodes/', analytics_views.analytics_barcodes, name='analytics_barcodes'),
    path('analytics/performance/', analytics_views.analytics_performance, name='analytics_performance'),
    path('analytics/dashboard/', analytics_views.analytics_dashboard, name='analytics_dashboard'),
]
