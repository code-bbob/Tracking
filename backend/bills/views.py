from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView 
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .models import Bill
from codes.models import Barcode
from .serializers import BillSerializer
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
class CustomPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_bills(request):
    """Get all active (pending) bills for the user's enterprise - no pagination needed"""
    try:
        # Get all active bills for the enterprise
        queryset = Bill.objects.filter(
            status='pending'
        ).select_related('issued_by__user', 'modified_by__user').order_by('-date_issued')
        
        # Apply search filter if provided
        search_query = request.GET.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(code__icontains=search_query) |
                Q(vehicle_number__icontains=search_query) |
                Q(destination__icontains=search_query) |
                Q(material__icontains=search_query) |
                Q(customer_name__icontains=search_query)
            ).order_by('-date_issued')
        
        serializer = BillSerializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch active bills: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_completed_bills(request):
    """Get paginated completed bills for the user's enterprise"""
    try:
        
        # Get completed bills for the enterprise
        queryset = Bill.objects.filter(
            status='completed'
        ).select_related('issued_by__user', 'modified_by__user').order_by('-modified_date')
        
        # Apply search filter if provided
        search_query = request.GET.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(code__icontains=search_query) |
                Q(vehicle_number__icontains=search_query) |
                Q(destination__icontains=search_query) |
                Q(material__icontains=search_query) |
                Q(customer_name__icontains=search_query)
            ).order_by('-modified_date')
        
        # Apply pagination
        paginator = CustomPagination()
        paginated_bills = paginator.paginate_queryset(queryset, request)
        
        if paginated_bills is not None:
            serializer = BillSerializer(paginated_bills, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = BillSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch completed bills: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cancelled_bills(request):
    """Get paginated cancelled bills for the user's enterprise"""
    try:
        
        # Get cancelled bills for the enterprise
        queryset = Bill.objects.filter(
            status='cancelled'
        ).select_related('issued_by__user', 'modified_by__user').order_by('-modified_date')
        
        # Apply search filter if provided
        search_query = request.GET.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(code__icontains=search_query) |
                Q(vehicle_number__icontains=search_query) |
                Q(destination__icontains=search_query) |
                Q(material__icontains=search_query) |
                Q(customer_name__icontains=search_query)
            ).order_by('-modified_date')
        
        # Apply pagination
        paginator = CustomPagination()
        paginated_bills = paginator.paginate_queryset(queryset, request)
        
        if paginated_bills is not None:
            serializer = BillSerializer(paginated_bills, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = BillSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch cancelled bills: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class BillView(APIView):
    def get(self, request):
        # Start with base queryset - add enterprise filtering for security
        queryset = Bill.objects.all(
        ).select_related('issued_by__user', 'modified_by__user').order_by('-date_issued')
        
        # Apply filters
        search_query = request.GET.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(code__icontains=search_query) |
                Q(vehicle_number__icontains=search_query) |
                Q(destination__icontains=search_query) |
                Q(material__icontains=search_query) |
                Q(issue_location__icontains=search_query) |
                Q(issued_by__user__name__icontains=search_query) |
                Q(modified_by__user__name__icontains=search_query) |
                Q(remark__icontains=search_query)
            )
        
        # Status filter
        status_filter = request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Material filter
        material_filter = request.GET.get('material')
        if material_filter:
            queryset = queryset.filter(material=material_filter)
        
        # Region filter
        region_filter = request.GET.get('region')
        if region_filter:
            queryset = queryset.filter(region=region_filter)
        
        # Vehicle size filter
        vehicle_size_filter = request.GET.get('vehicle_size')
        if vehicle_size_filter:
            queryset = queryset.filter(vehicle_size=vehicle_size_filter)
        
        # Issued by filter
        issued_by_filter = request.GET.get('issued_by')
        if issued_by_filter:
            queryset = queryset.filter(issued_by__user__name__icontains=issued_by_filter)
        
        # Modified by filter
        modified_by_filter = request.GET.get('modified_by')
        if modified_by_filter:
            queryset = queryset.filter(modified_by__user__name__icontains=modified_by_filter)
        
        # Date issued range
        date_issued_from = request.GET.get('date_issued_from')
        if date_issued_from:
            queryset = queryset.filter(date_issued__gte=date_issued_from)
        
        date_issued_to = request.GET.get('date_issued_to')
        if date_issued_to:
            queryset = queryset.filter(date_issued__lte=date_issued_to + ' 23:59:59')
        
        # Date modified range
        date_modified_from = request.GET.get('date_modified_from')
        if date_modified_from:
            queryset = queryset.filter(modified_date__gte=date_modified_from)
        
        date_modified_to = request.GET.get('date_modified_to')
        if date_modified_to:
            queryset = queryset.filter(modified_date__lte=date_modified_to + ' 23:59:59')
        
        # Amount range
        amount_from = request.GET.get('amount_from')
        if amount_from:
            queryset = queryset.filter(amount__gte=amount_from)
        
        amount_to = request.GET.get('amount_to')
        if amount_to:
            queryset = queryset.filter(amount__lte=amount_to)
        
        # Apply pagination
        paginator = PageNumberPagination()
        paginator.page_size = 50  # Adjust as needed
        paginated_bills = paginator.paginate_queryset(queryset, request)
        
        if paginated_bills is not None:
            serializer = BillSerializer(paginated_bills, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = BillSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        person = request.user.person
        if person:
            request.data['issued_by'] = person
        print(request.data)
        serializer = BillSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        print(request.data)
        try:
            bill = Bill.objects.get(pk=pk)
        except Bill.DoesNotExist:
            return Response({"error": "Bill not found"}, status=status.HTTP_404_NOT_FOUND)
        person = request.user.person
        if person:
            request.data['modified_by'] = person
            request.data['modified_date'] = timezone.now()
        serializer = BillSerializer(bill, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)



class ScanView(APIView):
    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({"error": "Code is required"}, status=status.HTTP_400_BAD_REQUEST)

        barcode = Barcode.objects.filter(code=code).first()
        if not barcode:
            return Response({"error": "Barcode not found"}, status=status.HTTP_404_NOT_FOUND)
        if barcode and barcode.status != 'active':
            return Response({"error": "Barcode is not active"}, status=status.HTTP_400_BAD_REQUEST)
        bill = Bill.objects.filter(code=code).first()
        if not bill:
            return Response({"error": "Bill not found for this barcode"}, status=status.HTTP_404_NOT_FOUND)
        if bill:
            if bill.status == 'pending':
                bill.status = 'completed'
                bill.modified_by = request.user.person
                bill.modified_date = timezone.now()
                bill.save()
                barcode.status = 'used'
                barcode.save()
                return Response({"message": "Bill completed successfully"}, status=status.HTTP_200_OK)
            elif status == 'completed':
                return Response({"error": "Bill is already completed"}, status=status.HTTP_400_BAD_REQUEST)
