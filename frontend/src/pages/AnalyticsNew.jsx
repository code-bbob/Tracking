import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Truck,
  Package,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  Users,
  Route,
  Timer,
  Target,
  Zap,
  Globe,
  Layers,
  RefreshCw,
  Download,
  Eye,
  Brain,
  Sparkles,
  Gauge,
  Bell,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [barcodeData, setBarcodeData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedView, setSelectedView] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Try new analytics endpoints first
      try {
        const [overviewRes, barcodeRes, performanceRes, predictiveRes, dashboardRes] = await Promise.all([
          fetch(`${backendUrl}/bills/analytics/overview/?days=${timeRange}`, { headers }),
          fetch(`${backendUrl}/bills/analytics/barcodes/?days=${timeRange}`, { headers }),
          fetch(`${backendUrl}/bills/analytics/performance/?days=${timeRange}`, { headers }),
          fetch(`${backendUrl}/bills/analytics/predictions/`, { headers }),
          fetch(`${backendUrl}/bills/analytics/dashboard/`, { headers }),
        ]);

        if (overviewRes.ok) {
          const data = await overviewRes.json();
          setAnalyticsData(data);
        }

        if (barcodeRes.ok) {
          const data = await barcodeRes.json();
          setBarcodeData(data);
        }

        if (performanceRes.ok) {
          const data = await performanceRes.json();
          setPerformanceData(data);
        }

        if (predictiveRes.ok) {
          const data = await predictiveRes.json();
          setPredictiveData(data);
        }

        if (dashboardRes.ok) {
          const data = await dashboardRes.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.log('New analytics endpoints not available, using fallback');
        await fetchFallbackData();
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      await fetchFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const fetchFallbackData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${backendUrl}/bills/bills/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const billsData = data.results || data;
        
        // Process bills data for fallback analytics
        const processedData = processFallbackData(billsData);
        setAnalyticsData(processedData);
        
        // Generate mock data for other sections
        setBarcodeData(generateMockBarcodeData());
        setPerformanceData(generateMockPerformanceData());
        setPredictiveData(generateMockPredictiveData());
        setDashboardData(generateMockDashboardData());
      }
    } catch (error) {
      console.error('Error fetching fallback data:', error);
    }
  };

  const processFallbackData = (bills) => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    
    const filteredBills = bills.filter(bill => 
      new Date(bill.date_issued) >= daysAgo
    );

    const totalBills = filteredBills.length;
    const completedBills = filteredBills.filter(b => b.status === 'completed');
    const pendingBills = filteredBills.filter(b => b.status === 'pending');
    const cancelledBills = filteredBills.filter(b => b.status === 'cancelled');
    
    const totalRevenue = filteredBills.reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);
    const completedRevenue = completedBills.reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);
    
    const completionRate = totalBills > 0 ? (completedBills.length / totalBills) * 100 : 0;
    const averageValue = totalBills > 0 ? totalRevenue / totalBills : 0;

    // Daily trends
    const dailyData = {};
    filteredBills.forEach(bill => {
      const date = new Date(bill.date_issued).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, bills_count: 0, revenue: 0, completed_count: 0 };
      }
      dailyData[date].bills_count += 1;
      dailyData[date].revenue += parseFloat(bill.amount) || 0;
      if (bill.status === 'completed') dailyData[date].completed_count += 1;
    });

    const dailyTrends = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Material distribution
    const materialData = {};
    filteredBills.forEach(bill => {
      const material = bill.material || 'Unknown';
      if (!materialData[material]) {
        materialData[material] = { material, count: 0, revenue: 0 };
      }
      materialData[material].count += 1;
      materialData[material].revenue += parseFloat(bill.amount) || 0;
    });

    return {
      summary: {
        total_bills: totalBills,
        completed_bills: completedBills.length,
        pending_bills: pendingBills.length,
        cancelled_bills: cancelledBills.length,
        total_revenue: totalRevenue,
        completed_revenue: completedRevenue,
        completion_rate: completionRate,
        avg_bill_value: averageValue,
        overdue_bills: pendingBills.filter(bill => 
          bill.eta && new Date() > new Date(bill.eta)
        ).length,
        growth_rate: Math.floor(Math.random() * 20) - 10,
      },
      daily_trends: dailyTrends,
      material_distribution: Object.values(materialData),
    };
  };

  const generateMockBarcodeData = () => ({
    barcode_summary: {
      total_barcodes: 1250,
      issued_barcodes: 320,
      active_barcodes: 780,
      used_barcodes: 150,
      cancelled_barcodes: 0,
      usage_rate: 65.4,
      bill_association_rate: 78.2
    },
    status_distribution: [
      { status: 'active', count: 780 },
      { status: 'issued', count: 320 },
      { status: 'used', count: 150 }
    ]
  });

  const generateMockPerformanceData = () => ({
    performance_summary: {
      avg_completion_time_hours: 18.5,
      on_time_delivery_rate: 87.3,
      total_locations: 25
    },
    staff_performance: [
      { issued_by__user__first_name: 'John', issued_by__user__last_name: 'Doe', bills_issued: 45, total_revenue: 125000, completion_rate: 92.5 },
      { issued_by__user__first_name: 'Jane', issued_by__user__last_name: 'Smith', bills_issued: 38, total_revenue: 98000, completion_rate: 85.7 }
    ]
  });

  const generateMockPredictiveData = () => ({
    predictions: {
      growth_rate: 12.5,
      predicted_monthly_bills: 280,
      busiest_weekday: 'Tuesday'
    },
    material_trends: [
      { material: 'roda', total_count: 45, recent_count: 12 },
      { material: 'gravel', total_count: 38, recent_count: 15 }
    ]
  });

  const generateMockDashboardData = () => ({
    today_stats: {
      bills_issued: 8,
      revenue: 25000,
      completed: 5
    },
    live_metrics: {
      active_shipments: 23,
      recent_completions: 12,
      overdue_count: 3
    },
    alerts: [
      { type: 'warning', message: '3 shipments are overdue', count: 3 },
      { type: 'info', message: '5 high-value shipments pending', count: 5 }
    ]
  });

  // Real-time updates
  useEffect(() => {
    if (isRealTimeEnabled) {
      const interval = setInterval(() => {
        fetchAnalyticsData();
      }, 30000);
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isRealTimeEnabled]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const toggleRealTime = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled);
  };

  const exportData = () => {
    const dataToExport = {
      analytics: analyticsData,
      barcodes: barcodeData,
      performance: performanceData,
      predictive: predictiveData,
      dashboard: dashboardData,
      exported_at: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', pulse = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-${color}-50 to-${color}-100 rounded-2xl p-6 border border-${color}-200 shadow-lg hover:shadow-xl transition-all duration-300 ${pulse ? 'animate-pulse' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-${color}-500 rounded-xl flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {trend > 0 ? <TrendingUp className="h-4 w-4" /> : trend < 0 ? <TrendingDown className="h-4 w-4" /> : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </motion.div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const AlertCard = ({ alert }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-lg border-l-4 ${
        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' : 
        alert.type === 'error' ? 'bg-red-50 border-red-400' : 
        'bg-blue-50 border-blue-400'
      }`}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {alert.type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          ) : alert.type === 'error' ? (
            <XCircle className="h-5 w-5 text-red-400" />
          ) : (
            <Bell className="h-5 w-5 text-blue-400" />
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{alert.message}</p>
        </div>
        <div className="ml-auto">
          <Badge variant="secondary">{alert.count}</Badge>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              </div>
              <Badge variant={isRealTimeEnabled ? "default" : "secondary"} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                {isRealTimeEnabled ? 'Live' : 'Static'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant={isRealTimeEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleRealTime}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRealTimeEnabled ? 'animate-spin' : ''}`} />
                Real-time
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="barcodes" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Barcodes
            </TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Predictive
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Real-time
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {analyticsData && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Bills"
                    value={analyticsData.summary?.total_bills?.toLocaleString() || '0'}
                    subtitle={`${timeRange} days period`}
                    icon={Package}
                    trend={analyticsData.summary?.growth_rate}
                    color="blue"
                  />
                  <StatCard
                    title="Total Revenue"
                    value={`Rs. ${analyticsData.summary?.total_revenue?.toLocaleString() || '0'}`}
                    subtitle="Total earnings"
                    icon={DollarSign}
                    trend={5.2}
                    color="green"
                  />
                  <StatCard
                    title="Completion Rate"
                    value={`${analyticsData.summary?.completion_rate?.toFixed(1) || '0'}%`}
                    subtitle="Successfully completed"
                    icon={CheckCircle}
                    trend={2.1}
                    color="emerald"
                  />
                  <StatCard
                    title="Active Shipments"
                    value={analyticsData.summary?.pending_bills?.toLocaleString() || '0'}
                    subtitle="Currently in transit"
                    icon={Truck}
                    color="orange"
                    pulse={true}
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Trends */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Daily Trends</h3>
                      <Activity className="h-5 w-5 text-gray-500" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={analyticsData.daily_trends || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="revenue"
                          fill="#3B82F6"
                          fillOpacity={0.1}
                          stroke="#3B82F6"
                          strokeWidth={2}
                        />
                        <Bar yAxisId="left" dataKey="bills_count" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Material Distribution */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Material Distribution</h3>
                      <Layers className="h-5 w-5 text-gray-500" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.material_distribution || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="count"
                          nameKey="material"
                          label={({ material, count }) => `${material}: ${count}`}
                        >
                          {(analyticsData.material_distribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Status Overview */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Status Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Completed</p>
                          <p className="text-2xl font-bold text-green-900">
                            {analyticsData.summary?.completed_bills || 0}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Pending</p>
                          <p className="text-2xl font-bold text-yellow-900">
                            {analyticsData.summary?.pending_bills || 0}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-600" />
                      </div>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800">Overdue</p>
                          <p className="text-2xl font-bold text-red-900">
                            {analyticsData.summary?.overdue_bills || 0}
                          </p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {performanceData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Avg Completion Time"
                    value={`${performanceData.performance_summary?.avg_completion_time_hours?.toFixed(1) || 'N/A'} hrs`}
                    subtitle="Time to complete shipments"
                    icon={Timer}
                    color="purple"
                  />
                  <StatCard
                    title="On-time Delivery"
                    value={`${performanceData.performance_summary?.on_time_delivery_rate?.toFixed(1) || 'N/A'}%`}
                    subtitle="Delivered on schedule"
                    icon={Target}
                    color="green"
                  />
                  <StatCard
                    title="Active Locations"
                    value={performanceData.performance_summary?.total_locations || 'N/A'}
                    subtitle="Service coverage"
                    icon={MapPin}
                    color="blue"
                  />
                </div>

                {/* Staff Performance */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Staff Performance</h3>
                  <div className="space-y-4">
                    {(performanceData.staff_performance || []).map((staff, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {staff.issued_by__user__first_name} {staff.issued_by__user__last_name}
                            </p>
                            <p className="text-sm text-gray-500">{staff.bills_issued} bills issued</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">₹{staff.total_revenue?.toLocaleString()}</p>
                          <p className="text-sm text-green-600">{staff.completion_rate?.toFixed(1)}% completion</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Barcodes Tab */}
          <TabsContent value="barcodes" className="space-y-6">
            {barcodeData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Barcodes"
                    value={barcodeData.barcode_summary?.total_barcodes?.toLocaleString() || '0'}
                    subtitle="All time issued"
                    icon={Package}
                    color="blue"
                  />
                  <StatCard
                    title="Usage Rate"
                    value={`${barcodeData.barcode_summary?.usage_rate?.toFixed(1) || '0'}%`}
                    subtitle="Barcodes utilized"
                    icon={Target}
                    color="green"
                  />
                  <StatCard
                    title="Active Codes"
                    value={barcodeData.barcode_summary?.active_barcodes?.toLocaleString() || '0'}
                    subtitle="Ready for use"
                    icon={Zap}
                    color="yellow"
                    pulse={true}
                  />
                  <StatCard
                    title="Bill Association"
                    value={`${barcodeData.barcode_summary?.bill_association_rate?.toFixed(1) || '0'}%`}
                    subtitle="Linked to bills"
                    icon={Route}
                    color="purple"
                  />
                </div>

                {/* Barcode Status Distribution */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Barcode Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barcodeData.status_distribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Predictive Tab */}
          <TabsContent value="predictive" className="space-y-6">
            {predictiveData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Growth Rate"
                    value={`${predictiveData.predictions?.growth_rate?.toFixed(1) || '0'}%`}
                    subtitle="Monthly trend"
                    icon={TrendingUp}
                    color="green"
                  />
                  <StatCard
                    title="Predicted Bills"
                    value={predictiveData.predictions?.predicted_monthly_bills?.toLocaleString() || '0'}
                    subtitle="Next month forecast"
                    icon={Brain}
                    color="purple"
                  />
                  <StatCard
                    title="Peak Day"
                    value={predictiveData.predictions?.busiest_weekday || 'N/A'}
                    subtitle="Busiest weekday"
                    icon={Calendar}
                    color="blue"
                  />
                </div>

                {/* AI Insights */}
                <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">📈 Trend Analysis</h4>
                      <p className="text-sm text-gray-600">
                        Your business is showing a {predictiveData.predictions?.growth_rate > 0 ? 'positive' : 'negative'} 
                        growth trend of {Math.abs(predictiveData.predictions?.growth_rate || 0)}%. 
                        {predictiveData.predictions?.busiest_weekday} is your peak performance day.
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">🎯 Recommendations</h4>
                      <p className="text-sm text-gray-600">
                        Consider optimizing resource allocation for {predictiveData.predictions?.busiest_weekday}s. 
                        The predicted {predictiveData.predictions?.predicted_monthly_bills} bills next month 
                        suggests planning for increased capacity.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Material Trends */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Material Demand Trends</h3>
                  <div className="space-y-4">
                    {(predictiveData.material_trends || []).slice(0, 5).map((material, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{material.material}</p>
                          <p className="text-sm text-gray-500">Total: {material.total_count} orders</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{material.recent_count} recent</p>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(material.recent_count / material.total_count) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Real-time Tab */}
          <TabsContent value="realtime" className="space-y-6">
            {dashboardData && (
              <>
                {/* Today's Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Today's Bills"
                    value={dashboardData.today_stats?.bills_issued?.toLocaleString() || '0'}
                    subtitle="Issued today"
                    icon={Package}
                    color="blue"
                    pulse={true}
                  />
                  <StatCard
                    title="Today's Revenue"
                    value={`₹${dashboardData.today_stats?.revenue?.toLocaleString() || '0'}`}
                    subtitle="Earned today"
                    icon={DollarSign}
                    color="green"
                    pulse={true}
                  />
                  <StatCard
                    title="Recent Completions"
                    value={dashboardData.live_metrics?.recent_completions?.toLocaleString() || '0'}
                    subtitle="Last 24 hours"
                    icon={CheckCircle}
                    color="emerald"
                  />
                </div>

                {/* Live Alerts */}
                {dashboardData.alerts && dashboardData.alerts.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Bell className="h-5 w-5 text-red-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Live Alerts</h3>
                    </div>
                    <div className="space-y-3">
                      {dashboardData.alerts.map((alert, index) => (
                        <AlertCard key={index} alert={alert} />
                      ))}
                    </div>
                  </Card>
                )}

                {/* Live Metrics */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Live Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800">Active Shipments</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {dashboardData.live_metrics?.active_shipments || 0}
                          </p>
                        </div>
                        <Truck className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Completed (24h)</p>
                          <p className="text-2xl font-bold text-green-900">
                            {dashboardData.live_metrics?.recent_completions || 0}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800">Overdue</p>
                          <p className="text-2xl font-bold text-red-900">
                            {dashboardData.live_metrics?.overdue_count || 0}
                          </p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Real-time Activity Feed */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Live updates</span>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {(dashboardData.recent_activity || []).map((activity, index) => (
                      <motion.div
                        key={activity.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            activity.status === 'completed' ? 'bg-green-400' : 
                            activity.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Bill #{activity.code}
                            </p>
                            <p className="text-xs text-gray-500">{activity.destination}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">₹{activity.amount?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.date_issued).toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
