from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from rest_framework.pagination import PageNumberPagination
import random
from .models import Barcode
from enterprise.models import Person
# Create your views here.

class IssueBarcodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch all issued barcodes for the current user's enterprise with filtering, search, and pagination
        person = request.user.person
        
        # Start with base queryset
        queryset = Barcode.objects.filter(
        ).select_related('assigned_to', 'assigned_by').order_by('-created_at')
        
        # Filter by assigned_to if provided
        assigned_to_filter = request.GET.get('assigned_to')
        if assigned_to_filter:
            queryset = queryset.filter(assigned_to__user=assigned_to_filter)
        
        # Search by barcode code if provided
        search_query = request.GET.get('search')
        if search_query:
            queryset = queryset.filter(code__icontains=search_query)
        
        # Apply pagination
        paginator = PageNumberPagination()
        paginator.page_size = 20  # You can adjust this
        paginated_barcodes = paginator.paginate_queryset(queryset, request)
        
        barcode_data = []
        for barcode in paginated_barcodes:
            barcode_data.append({
                'code': barcode.code,
                'status': barcode.status,
                'assigned_to': {
                    'id': barcode.assigned_to.user.id,
                    'name': barcode.assigned_to.user.name,
                },
                'assigned_by': {
                    'name': barcode.assigned_by.user.name,
                },
                'created_at': barcode.created_at.isoformat(),
                'assigned_at': barcode.assigned_at.isoformat(),
            })
        
        return paginator.get_paginated_response({
            'barcodes': barcode_data
        })

    def post(self, request):
        person = request.user.person

        role = person.role

        if role != 'Admin':
            return Response({'error': 'You do not have permission to issue barcodes.'}, status=403)
        
        lowerbound = request.data.get('lowerbound')
        upperbound = request.data.get('upperbound')

        if not lowerbound or not upperbound:
            return Response({'error': 'Lowerbound and upperbound are required.'}, status=400)

        assigned_by = person
        assigned_to_id = request.data.get('assigned_to')
        assigned_to = Person.objects.get(user=assigned_to_id)
        # person = Person.objects.get(id=assigned_to_id)
        existing_codes = set(Barcode.objects.values_list('code', flat=True))
        # collect new codes in order
        new_codes_list = []
        for code in range(lowerbound, upperbound + 1):
            code_str = str(code).zfill(6)
            if code_str not in existing_codes:
                new_codes_list.append(code_str)
        if not new_codes_list:
            return Response({'error': 'No new barcodes to issue.'}, status=400)
        issued_codes = []
        # create barcodes one by one to preserve order
        for code_str in new_codes_list:
            Barcode.objects.create(code=code_str, assigned_to=assigned_to, assigned_by=assigned_by)
            issued_codes.append(code_str)
        return Response({'issued_codes': issued_codes}, status=201)

