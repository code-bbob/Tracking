from django.urls import path
from . import views

urlpatterns = [
    # path('persons/',views.PersonView.as_view(),name='persons')
    path('issue-barcode/', views.IssueBarcodeView.as_view(), name='issue_barcode'),
]