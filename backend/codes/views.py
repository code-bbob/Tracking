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
        
        count = request.data.get('count', 1)

        assigned_by = person
        assigned_to_id = request.data.get('assigned_to')
        assigned_to = Person.objects.get(user=assigned_to_id)
        # person = Person.objects.get(id=assigned_to_id)
        existing_codes = set(
            Barcode.objects.values_list('code', flat=True)
        ) 
        new_codes = set()

        while len(new_codes) < count:
            code = f"{random.randint(100000000000, 999999999999)}"
            if code not in existing_codes and code not in new_codes:
                new_codes.add(code)
        
        barcodes = [
            Barcode(code=code, assigned_to=assigned_to, assigned_by=assigned_by)
            for code in new_codes
        ]
        Barcode.objects.bulk_create(barcodes)

        return Response(
            {'issued_codes': list(new_codes)},
            status=201
        )

