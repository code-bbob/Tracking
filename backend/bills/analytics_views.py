from django.db import models
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models.functions import TruncDate, Extract
from collections import defaultdict
import calendar

from .models import Bill
from codes.models import Barcode
from enterprise.models import Person


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_overview(request):
    """
    Comprehensive analytics overview with key metrics and trends
    """
    try:
        days = int(request.GET.get('days', 30))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Get user's enterprise for filtering
        user_enterprise = request.user.person.enterprise
        
        # Filter bills by user's enterprise and date range
        bills_queryset = Bill.objects.filter(
            issued_by__enterprise=user_enterprise,
            date_issued__range=[start_date, end_date]
        )
        
        # Summary statistics
        total_bills = bills_queryset.count()
        completed_bills = bills_queryset.filter(status='completed').count()
        pending_bills = bills_queryset.filter(status='pending').count()
        cancelled_bills = bills_queryset.filter(status='cancelled').count()
        
        # Calculate overdue bills (pending bills past ETA)
        overdue_bills = bills_queryset.filter(
            status='pending',
            eta__lt=timezone.now()
        ).count()
        
        # Revenue calculations
        total_revenue = bills_queryset.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        completed_revenue = bills_queryset.filter(
            status='completed'
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Calculate completion rate
        completion_rate = (completed_bills / total_bills * 100) if total_bills > 0 else 0
        
        # Average bill value
        avg_bill_value = bills_queryset.aggregate(
            avg=Avg('amount')
        )['avg'] or 0
        
        # Growth rate calculation (compare with previous period)
        prev_start_date = start_date - timedelta(days=days)
        prev_bills_count = Bill.objects.filter(
            issued_by__enterprise=user_enterprise,
            date_issued__range=[prev_start_date, start_date]
        ).count()
        
        growth_rate = 0
        if prev_bills_count > 0:
            growth_rate = ((total_bills - prev_bills_count) / prev_bills_count) * 100
        
        # Daily trends
        daily_trends = bills_queryset.extra(
            select={'date': 'DATE(date_issued)'}
        ).values('date').annotate(
            bills_count=Count('id'),
            revenue=Sum('amount'),
            completed_count=Count('id', filter=Q(status='completed'))
        ).order_by('date')
        
        # Material distribution
        material_distribution = bills_queryset.values('material').annotate(
            count=Count('id'),
            revenue=Sum('amount')
        ).order_by('-count')
        
        # Regional distribution
        regional_distribution = bills_queryset.values('region').annotate(
            count=Count('id'),
            revenue=Sum('amount')
        ).order_by('-count')
        
        # Vehicle size distribution
        vehicle_distribution = bills_queryset.values('vehicle_size').annotate(
            count=Count('id'),
            revenue=Sum('amount')
        ).order_by('-count')
        
        # Top destinations
        top_destinations = bills_queryset.values('destination').annotate(
            count=Count('id'),
            revenue=Sum('amount')
        ).order_by('-count')[:10]
        
        response_data = {
            'summary': {
                'total_bills': total_bills,
                'completed_bills': completed_bills,
                'pending_bills': pending_bills,
                'cancelled_bills': cancelled_bills,
                'overdue_bills': overdue_bills,
                'total_revenue': float(total_revenue),
                'completed_revenue': float(completed_revenue),
                'completion_rate': round(completion_rate, 2),
                'avg_bill_value': float(avg_bill_value),
                'growth_rate': round(growth_rate, 2),
            },
            'daily_trends': list(daily_trends),
            'material_distribution': list(material_distribution),
            'regional_distribution': list(regional_distribution),
            'vehicle_distribution': list(vehicle_distribution),
            'top_destinations': list(top_destinations),
            'period': f'{days} days',
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch analytics overview: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_barcodes(request):
    """
    Barcode analytics and usage statistics
    """
    try:
        days = int(request.GET.get('days', 30))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        user_enterprise = request.user.person.enterprise
        
        # Barcode statistics
        barcodes_queryset = Barcode.objects.filter(
            assigned_to__enterprise=user_enterprise
        )
        
        total_barcodes = barcodes_queryset.count()
        issued_barcodes = barcodes_queryset.filter(status='issued').count()
        active_barcodes = barcodes_queryset.filter(status='active').count()
        used_barcodes = barcodes_queryset.filter(status='used').count()
        cancelled_barcodes = barcodes_queryset.filter(status='cancelled').count()
        
        # Usage rate calculation
        usage_rate = (used_barcodes / total_barcodes * 100) if total_barcodes > 0 else 0
        
        # Bill association rate
        associated_barcodes = barcodes_queryset.filter(
            associated_bill__isnull=False
        ).count()
        bill_association_rate = (associated_barcodes / total_barcodes * 100) if total_barcodes > 0 else 0
        
        # Recent barcode activity
        recent_barcodes = barcodes_queryset.filter(
            updated_at__range=[start_date, end_date]
        ).extra(
            select={'date': 'DATE(updated_at)'}
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Status distribution
        status_distribution = barcodes_queryset.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Barcode assignment trends
        assignment_trends = barcodes_queryset.filter(
            assigned_at__range=[start_date, end_date]
        ).extra(
            select={'date': 'DATE(assigned_at)'}
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        response_data = {
            'barcode_summary': {
                'total_barcodes': total_barcodes,
                'issued_barcodes': issued_barcodes,
                'active_barcodes': active_barcodes,
                'used_barcodes': used_barcodes,
                'cancelled_barcodes': cancelled_barcodes,
                'usage_rate': round(usage_rate, 2),
                'bill_association_rate': round(bill_association_rate, 2)
            },
            'recent_activity': list(recent_barcodes),
            'status_distribution': list(status_distribution),
            'assignment_trends': list(assignment_trends),
            'period': f'{days} days'
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch barcode analytics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_performance(request):
    """
    Performance analytics including completion times and staff performance
    """
    try:
        days = int(request.GET.get('days', 30))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        user_enterprise = request.user.person.enterprise
        
        bills_queryset = Bill.objects.filter(
            issued_by__enterprise=user_enterprise,
            date_issued__range=[start_date, end_date]
        )
        
        # Calculate average completion time for completed bills
        completed_bills = bills_queryset.filter(status='completed')
        
        # Estimate completion time using modified_date - date_issued
        completion_times = []
        for bill in completed_bills:
            if bill.modified_date:
                completion_time = bill.modified_date - bill.date_issued
                completion_times.append(completion_time.total_seconds() / 3600)  # Convert to hours
        
        avg_completion_time = sum(completion_times) / len(completion_times) if completion_times else 0
        
        # On-time delivery rate (bills completed before ETA)
        on_time_bills = completed_bills.filter(
            modified_date__lte=F('eta')
        ).count()
        
        total_completed = completed_bills.count()
        on_time_delivery_rate = (on_time_bills / total_completed * 100) if total_completed > 0 else 0
        
        # Staff performance
        staff_performance = bills_queryset.values(
            'issued_by__user__name',
        ).annotate(
            bills_issued=Count('id'),
            total_revenue=Sum('amount'),
            completed_bills=Count('id', filter=Q(status='completed')),
            cancelled_bills=Count('id', filter=Q(status='cancelled'))
        ).annotate(
            completion_rate=models.Case(
                models.When(bills_issued=0, then=0),
                default=F('completed_bills') * 100.0 / F('bills_issued'),
                output_field=models.FloatField()
            )
        ).order_by('-bills_issued')
        
        # Location performance
        location_performance = bills_queryset.values('issue_location').annotate(
            bills_count=Count('id'),
            revenue=Sum('amount'),
            completion_rate=models.Case(
                models.When(bills_count=0, then=0),
                default=Count('id', filter=Q(status='completed')) * 100.0 / Count('id'),
                output_field=models.FloatField()
            )
        ).order_by('-bills_count')
        
        # Get total unique locations
        total_locations = bills_queryset.values('issue_location').distinct().count()
        
        # Performance trends over time
        performance_trends = bills_queryset.extra(
            select={'date': 'DATE(date_issued)'}
        ).values('date').annotate(
            total_bills=Count('id'),
            completed_bills=Count('id', filter=Q(status='completed')),
            avg_amount=Avg('amount')
        ).annotate(
            completion_rate=models.Case(
                models.When(total_bills=0, then=0),
                default=F('completed_bills') * 100.0 / F('total_bills'),
                output_field=models.FloatField()
            )
        ).order_by('date')
        
        response_data = {
            'performance_summary': {
                'avg_completion_time_hours': round(avg_completion_time, 2),
                'on_time_delivery_rate': round(on_time_delivery_rate, 2),
                'total_locations': total_locations,
                'total_staff': staff_performance.count()
            },
            'staff_performance': list(staff_performance),
            'location_performance': list(location_performance),
            'performance_trends': list(performance_trends),
            'period': f'{days} days'
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch performance analytics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_predictions(request):
    """
    Predictive analytics and AI insights
    """
    try:
        user_enterprise = request.user.person.enterprise
        
        # Get historical data for predictions
        end_date = timezone.now()
        
        # Last 90 days for trend analysis
        start_date_90 = end_date - timedelta(days=90)
        bills_90_days = Bill.objects.filter(
            issued_by__enterprise=user_enterprise,
            date_issued__range=[start_date_90, end_date]
        )
        
        # Last 30 days
        start_date_30 = end_date - timedelta(days=30)
        bills_30_days = bills_90_days.filter(date_issued__range=[start_date_30, end_date])
        
        # Calculate growth rate
        bills_count_30 = bills_30_days.count()
        bills_count_prev_30 = Bill.objects.filter(
            issued_by__enterprise=user_enterprise,
            date_issued__range=[start_date_90, start_date_30]
        ).count()
        
        growth_rate = 0
        if bills_count_prev_30 > 0:
            growth_rate = ((bills_count_30 - bills_count_prev_30) / bills_count_prev_30) * 100
        
        # Predict next month's bills based on trend
        predicted_monthly_bills = max(0, int(bills_count_30 * (1 + growth_rate / 100)))
        
        # Find busiest weekday
        weekday_analysis = bills_90_days.extra(
            select={'weekday': 'EXTRACT(dow FROM date_issued)'}
        ).values('weekday').annotate(
            count=Count('id')
        ).order_by('-count')
        
        weekday_names = {
            0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
            4: 'Thursday', 5: 'Friday', 6: 'Saturday'
        }
        
        busiest_weekday = 'N/A'
        if weekday_analysis:
            busiest_weekday = weekday_names.get(int(weekday_analysis[0]['weekday']), 'N/A')
        
        # Material demand trends
        material_trends = bills_90_days.values('material').annotate(
            total_count=Count('id'),
            recent_count=Count('id', filter=Q(date_issued__range=[start_date_30, end_date])),
            avg_revenue=Avg('amount')
        ).order_by('-total_count')
        
        # Seasonal patterns (monthly analysis)
        monthly_patterns = bills_90_days.extra(
            select={'month': 'EXTRACT(month FROM date_issued)'}
        ).values('month').annotate(
            count=Count('id'),
            revenue=Sum('amount')
        ).order_by('month')
        
        # Revenue predictions
        avg_daily_revenue_30 = bills_30_days.aggregate(
            avg=Avg('amount')
        )['avg'] or 0
        
        predicted_monthly_revenue = avg_daily_revenue_30 * predicted_monthly_bills
        
        # Risk analysis - identify patterns in cancelled/overdue bills
        risk_factors = bills_90_days.filter(
            Q(status='cancelled') | Q(status='pending', eta__lt=timezone.now())
        ).values('material', 'region', 'vehicle_size').annotate(
            risk_count=Count('id')
        ).order_by('-risk_count')[:5]
        
        response_data = {
            'predictions': {
                'growth_rate': round(growth_rate, 2),
                'predicted_monthly_bills': predicted_monthly_bills,
                'predicted_monthly_revenue': round(predicted_monthly_revenue, 2),
                'busiest_weekday': busiest_weekday,
                'confidence_score': min(90, max(60, 100 - abs(growth_rate)))  # Simple confidence calculation
            },
            'material_trends': list(material_trends),
            'monthly_patterns': list(monthly_patterns),
            'risk_factors': list(risk_factors),
            'insights': {
                'trend_direction': 'positive' if growth_rate > 0 else 'negative' if growth_rate < 0 else 'stable',
                'growth_strength': 'strong' if abs(growth_rate) > 20 else 'moderate' if abs(growth_rate) > 10 else 'weak',
                'peak_day': busiest_weekday,
                'top_material': material_trends[0]['material'] if material_trends else 'N/A'
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch predictive analytics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_dashboard(request):
    """
    Real-time dashboard data for live metrics
    """
    try:
        user_enterprise = request.user.person.enterprise
        today = timezone.now().date()
        
        # Today's statistics
        today_bills = Bill.objects.filter(
            issued_by__enterprise=user_enterprise,
            date_issued__date=today
        )
        
        today_stats = {
            'bills_issued': today_bills.count(),
            'revenue': float(today_bills.aggregate(total=Sum('amount'))['total'] or 0),
            'completed': today_bills.filter(status='completed').count(),
            'pending': today_bills.filter(status='pending').count()
        }
        
        # Live metrics
        active_shipments = Bill.objects.filter(
            issued_by__enterprise=user_enterprise,
            status='pending'
        ).count()
        
        # Recent completions (last 24 hours)
        last_24h = timezone.now() - timedelta(hours=24)
        recent_completions = Bill.objects.filter(
            issued_by__enterprise=user_enterprise,
            status='completed',
            modified_date__gte=last_24h
        ).count()
        
        # Overdue shipments
        overdue_count = Bill.objects.filter(
            issued_by__enterprise=user_enterprise,
            status='pending',
            eta__lt=timezone.now()
        ).count()
        
        # High-value shipments (top 25% by amount)
        avg_amount = Bill.objects.filter(
            issued_by__enterprise=user_enterprise
        ).aggregate(avg=Avg('amount'))['avg'] or 0
        
        high_value_pending = Bill.objects.filter(
            issued_by__enterprise=user_enterprise,
            status='pending',
            amount__gte=avg_amount * 1.5  # 50% above average
        ).count()
        
        # Generate alerts
        alerts = []
        
        if overdue_count > 0:
            alerts.append({
                'type': 'warning',
                'message': f'{overdue_count} shipment{"s" if overdue_count != 1 else ""} {"are" if overdue_count != 1 else "is"} overdue',
                'count': overdue_count,
                'priority': 'high'
            })
        
        if high_value_pending > 0:
            alerts.append({
                'type': 'info',
                'message': f'{high_value_pending} high-value shipment{"s" if high_value_pending != 1 else ""} pending',
                'count': high_value_pending,
                'priority': 'medium'
            })
        
        if today_stats['bills_issued'] == 0:
            alerts.append({
                'type': 'info',
                'message': 'No bills issued today',
                'count': 0,
                'priority': 'low'
            })
        
        # Recent activity (last 10 bills)
        recent_activity = Bill.objects.filter(
            issued_by__enterprise=user_enterprise
        ).order_by('-date_issued')[:10].values(
            'code', 'amount', 'destination', 'status', 'date_issued'
        )
        
        # Quick stats for widgets
        live_metrics = {
            'active_shipments': active_shipments,
            'recent_completions': recent_completions,
            'overdue_count': overdue_count,
            'high_value_pending': high_value_pending
        }
        
        response_data = {
            'today_stats': today_stats,
            'live_metrics': live_metrics,
            'alerts': alerts,
            'recent_activity': list(recent_activity),
            'last_updated': timezone.now().isoformat()
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch dashboard data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
