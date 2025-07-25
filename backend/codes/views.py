from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
import random
from .models import Barcode
from enterprise.models import Person
# Create your views here.

class IssueBarcodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Logic to issue a barcode
        # For demonstration, returning a static barcode
        barcode_data = {
            'barcode': '1234567890123',
            'message': 'Barcode issued successfully'
        }
        return Response(barcode_data)

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

