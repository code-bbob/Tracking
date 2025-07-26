import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, Pie, PieChart, Cell } from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [barcodeData, setBarcodeData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedView, setSelectedView] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Sample data for when backend is not available
  const sampleAnalyticsData = {
    total_bills: 245,
    total_quantity: 12580,
    total_materials: 15,
    bills_this_month: 78,
    average_bill_value: 892.50,
    trend_percentage: 12.5,
    daily_trends: [
      { date: '2024-07-20', bills: 12, quantity: 450, revenue: 8950 },
      { date: '2024-07-21', bills: 15, quantity: 567, revenue: 11240 },
      { date: '2024-07-22', bills: 8, quantity: 234, revenue: 4650 },
      { date: '2024-07-23', bills: 22, quantity: 789, revenue: 15670 },
      { date: '2024-07-24', bills: 18, quantity: 623, revenue: 12360 },
      { date: '2024-07-25', bills: 25, quantity: 834, revenue: 16580 },
      { date: '2024-07-26', bills: 19, quantity: 567, revenue: 11250 },
    ],
    material_distribution: [
      { name: 'Steel', value: 4500, fill: 'hsl(var(--chart-1))' },
      { name: 'Aluminum', value: 3200, fill: 'hsl(var(--chart-2))' },
      { name: 'Copper', value: 2800, fill: 'hsl(var(--chart-3))' },
      { name: 'Iron', value: 2080, fill: 'hsl(var(--chart-4))' },
    ]
  };

  const sampleBarcodeData = {
    total_barcodes: 1247,
    active_barcodes: 892,
    generated_today: 23,
    scan_rate: 94.2,
    recent_scans: [
      { id: 1, code: 'BC001234', material: 'Steel Rod', timestamp: '2024-07-26 14:30', location: 'Warehouse A' },
      { id: 2, code: 'BC001235', material: 'Aluminum Sheet', timestamp: '2024-07-26 14:25', location: 'Warehouse B' },
      { id: 3, code: 'BC001236', material: 'Copper Wire', timestamp: '2024-07-26 14:20', location: 'Warehouse C' },
    ]
  };

  const samplePerformanceData = {
    efficiency_score: 87.5,
    completion_rate: 94.2,
    average_processing_time: 4.8,
    staff_performance: [
      { name: 'John Doe', efficiency: 92, bills_processed: 156 },
      { name: 'Jane Smith', efficiency: 88, bills_processed: 134 },
      { name: 'Mike Johnson', efficiency: 85, bills_processed: 128 },
      { name: 'Sarah Wilson', efficiency: 91, bills_processed: 142 },
    ],
    monthly_trends: [
      { month: 'Jan', efficiency: 82, completion: 89 },
      { month: 'Feb', efficiency: 84, completion: 91 },
      { month: 'Mar', efficiency: 86, completion: 92 },
      { month: 'Apr', efficiency: 85, completion: 90 },
      { month: 'May', efficiency: 88, completion: 94 },
      { month: 'Jun', efficiency: 87, completion: 93 },
      { month: 'Jul', efficiency: 88, completion: 94 },
    ],
    performance_trends: [
      { date: '2024-07-20', completion_rate: 89, efficiency: 85 },
      { date: '2024-07-21', completion_rate: 92, efficiency: 87 },
      { date: '2024-07-22', completion_rate: 88, efficiency: 86 },
      { date: '2024-07-23', completion_rate: 95, efficiency: 89 },
      { date: '2024-07-24', completion_rate: 91, efficiency: 88 },
      { date: '2024-07-25', completion_rate: 94, efficiency: 90 },
      { date: '2024-07-26', completion_rate: 96, efficiency: 92 },
    ]
  };

  // Error boundary component
  const ErrorFallback = ({ error, resetError }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
      <div className="text-center p-8">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">
          {error?.message || 'An unexpected error occurred while loading analytics data.'}
        </p>
        <Button onClick={resetError} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );

  // Safe data accessor with fallbacks
  const safeGet = (obj, path, fallback = 'N/A') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.warn('No access token found, using sample data');
        // Use sample data when no token is available
        setAnalyticsData(sampleAnalyticsData);
        setBarcodeData(sampleBarcodeData);
        setPerformanceData(samplePerformanceData);
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      try {
        // Fetch analytics data from backend
        const [overviewRes, barcodeRes, performanceRes, predictiveRes, dashboardRes] = await Promise.all([
          fetch(`${backendUrl}/bills/analytics/overview/?days=${timeRange}`, { headers }),
          fetch(`${backendUrl}/bills/analytics/barcodes/?days=${timeRange}`, { headers }),
          fetch(`${backendUrl}/bills/analytics/performance/?days=${timeRange}`, { headers }),
          fetch(`${backendUrl}/bills/analytics/predictions/`, { headers }),
          fetch(`${backendUrl}/bills/analytics/dashboard/`, { headers }),
        ]);

        // Process successful responses or use fallback data
        if (overviewRes.ok) {
          const data = await overviewRes.json();
          setAnalyticsData(data);
        } else {
          console.warn('Overview endpoint failed, using sample data');
          setAnalyticsData(sampleAnalyticsData);
        }

        if (barcodeRes.ok) {
          const data = await barcodeRes.json();
          setBarcodeData(data);
        } else {
          console.warn('Barcode endpoint failed, using sample data');
          setBarcodeData(sampleBarcodeData);
        }

        if (performanceRes.ok) {
          const data = await performanceRes.json();
          setPerformanceData(data);
        } else {
          console.warn('Performance endpoint failed, using sample data');
          setPerformanceData(samplePerformanceData);
        }

        if (predictiveRes.ok) {
          const data = await predictiveRes.json();
          setPredictiveData(data);
        }

        if (dashboardRes.ok) {
          const data = await dashboardRes.json();
          setDashboardData(data);
        }
      } catch (fetchError) {
        console.warn('Backend fetch failed, using sample data:', fetchError);
        setAnalyticsData(sampleAnalyticsData);
        setBarcodeData(sampleBarcodeData);
        setPerformanceData(samplePerformanceData);
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Use sample data as fallback
      setAnalyticsData(sampleAnalyticsData);
      setBarcodeData(sampleBarcodeData);
      setPerformanceData(samplePerformanceData);
    } finally {
      setLoading(false);
    }
  };

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

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', pulse = false, loading = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-${color}-50 to-${color}-100 rounded-2xl p-6 border border-${color}-200 shadow-lg hover:shadow-xl transition-all duration-300 ${pulse ? 'animate-pulse' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-${color}-500 rounded-xl flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend !== undefined && !loading && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {trend > 0 ? <TrendingUp className="h-4 w-4" /> : trend < 0 ? <TrendingDown className="h-4 w-4" /> : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        {loading ? (
          <>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            <p className="text-sm text-gray-600">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </>
        )}
      </div>
    </motion.div>
  );

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
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error && !analyticsData && !barcodeData && !performanceData && !predictiveData && !dashboardData) {
    return <ErrorFallback error={error} resetError={() => {
      setError(null);
      fetchAnalyticsData();
    }} />;
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
                    value={safeGet(analyticsData, 'summary.total_bills', 0).toLocaleString()}
                    subtitle={`${timeRange} days period`}
                    icon={Package}
                    trend={safeGet(analyticsData, 'summary.growth_rate', 0)}
                    color="blue"
                    loading={loading}
                  />
                  <StatCard
                    title="Total Revenue"
                    value={`₹${safeGet(analyticsData, 'summary.total_revenue', 0).toLocaleString()}`}
                    subtitle="Total earnings"
                    icon={DollarSign}
                    trend={5.2}
                    color="green"
                    loading={loading}
                  />
                  <StatCard
                    title="Completion Rate"
                    value={`${safeGet(analyticsData, 'summary.completion_rate', 0).toFixed(1)}%`}
                    subtitle="Successfully completed"
                    icon={CheckCircle}
                    trend={2.1}
                    color="emerald"
                    loading={loading}
                  />
                  <StatCard
                    title="Active Shipments"
                    value={safeGet(analyticsData, 'summary.pending_bills', 0).toLocaleString()}
                    subtitle="Currently in transit"
                    icon={Truck}
                    color="orange"
                    pulse={true}
                    loading={loading}
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Trends Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Bills Trend</CardTitle>
                      <CardDescription>Bills issued over the last {timeRange} days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analyticsData?.daily_trends && analyticsData.daily_trends.length > 0 ? (
                        <ChartContainer config={{
                          bills: {
                            label: "Bills",
                            color: "hsl(var(--chart-1))",
                          },
                        }}>
                          <BarChart accessibilityLayer data={analyticsData.daily_trends}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              tickMargin={10}
                              axisLine={false}
                              tickFormatter={(value) => {
                                try {
                                  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                } catch {
                                  return value;
                                }
                              }}
                            />
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent hideLabel />}
                            />
                            <Bar dataKey="bills" fill="hsl(var(--chart-1))" radius={8} />
                          </BarChart>
                        </ChartContainer>
                      ) : (
                        <div className="h-72 flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No trend data available</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 text-sm">
                      <div className="flex gap-2 leading-none font-medium">
                        {safeGet(analyticsData, 'summary.growth_rate', 0) > 0 ? (
                          <>Trending up by {Math.abs(safeGet(analyticsData, 'summary.growth_rate', 0)).toFixed(1)}% <TrendingUpIcon className="h-4 w-4" /></>
                        ) : (
                          <>Trending down by {Math.abs(safeGet(analyticsData, 'summary.growth_rate', 0)).toFixed(1)}% <TrendingDown className="h-4 w-4" /></>
                        )}
                      </div>
                      <div className="text-muted-foreground leading-none">
                        Based on bills issued in the selected period
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Material Distribution Chart */}
                  <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                      <CardTitle>Material Distribution</CardTitle>
                      <CardDescription>Bills by material type</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                      {analyticsData?.material_distribution && analyticsData.material_distribution.length > 0 ? (
                        <ChartContainer
                          config={analyticsData.material_distribution.reduce((acc, item, index) => {
                            const name = item.name || `item-${index}`;
                            acc[name] = {
                              label: name.charAt(0).toUpperCase() + name.slice(1),
                              color: `hsl(var(--chart-${(index % 5) + 1}))`,
                            };
                            return acc;
                          }, {})}
                          className="mx-auto aspect-square max-h-[250px] pb-0"
                        >
                          <PieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie 
                              data={analyticsData.material_distribution} 
                              dataKey="value" 
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                            >
                              {analyticsData.material_distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ChartContainer>
                      ) : (
                        <div className="h-60 flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No material data available</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 leading-none font-medium">
                        Total materials tracked: {analyticsData?.material_distribution?.length || 0}
                      </div>
                      <div className="text-muted-foreground leading-none">
                        Distribution across all bill materials
                      </div>
                    </CardFooter>
                  </Card>
                </div>

                {/* Revenue Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Daily revenue over the last {timeRange} days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analyticsData?.daily_trends && analyticsData.daily_trends.length > 0 ? (
                      <ChartContainer config={{
                        revenue: {
                          label: "Revenue",
                          color: "hsl(var(--chart-2))",
                        },
                      }}>
                        <LineChart
                          accessibilityLayer
                          data={analyticsData.daily_trends}
                          margin={{
                            left: 12,
                            right: 12,
                          }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => {
                              try {
                                return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              } catch {
                                return value;
                              }
                            }}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                          />
                          <Line
                            dataKey="revenue"
                            type="natural"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-72 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No revenue data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="flex w-full items-start gap-2 text-sm">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2 leading-none font-medium">
                          Total Revenue: ₹{safeGet(analyticsData, 'summary.total_revenue', 0).toLocaleString()}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 leading-none">
                          Average per bill: ₹{safeGet(analyticsData, 'summary.avg_bill_value', 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardFooter>
                </Card>

                {/* Status Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status Overview</CardTitle>
                    <CardDescription>Current bill status distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800">Completed</p>
                            <p className="text-2xl font-bold text-green-900">
                              {safeGet(analyticsData, 'summary.completed_bills', 0)}
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
                              {safeGet(analyticsData, 'summary.pending_bills', 0)}
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
                              {safeGet(analyticsData, 'summary.overdue_bills', 0)}
                            </p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {performanceData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Avg Completion Time"
                    value={`${safeGet(performanceData, 'performance_summary.avg_completion_time_hours', 0).toFixed(1)} hrs`}
                    subtitle="Time to complete shipments"
                    icon={Timer}
                    color="purple"
                  />
                  <StatCard
                    title="On-time Delivery"
                    value={`${safeGet(performanceData, 'performance_summary.on_time_delivery_rate', 0).toFixed(1)}%`}
                    subtitle="Delivered on schedule"
                    icon={Target}
                    color="green"
                  />
                  <StatCard
                    title="Active Locations"
                    value={safeGet(performanceData, 'performance_summary.total_locations', 0)}
                    subtitle="Service coverage"
                    icon={MapPin}
                    color="blue"
                  />
                </div>

                {/* Staff Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Performance</CardTitle>
                    <CardDescription>Bills issued by staff members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {performanceData?.staff_performance && performanceData.staff_performance.length > 0 ? (
                      <ChartContainer config={performanceData.staff_performance.reduce((acc, staff, index) => {
                        acc[staff.name] = {
                          label: staff.name,
                          color: `hsl(var(--chart-${(index % 5) + 1}))`,
                        };
                        return acc;
                      }, {})}>
                        <BarChart accessibilityLayer data={performanceData.staff_performance}>
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.split(' ')[0]}
                          />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <Bar dataKey="bills_processed" fill="hsl(var(--chart-1))" radius={8} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-72 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No staff performance data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Trends */}
                {performanceData?.performance_trends && performanceData.performance_trends.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Trends</CardTitle>
                      <CardDescription>Completion rate over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{
                        completion_rate: {
                          label: "Completion Rate (%)",
                          color: "hsl(var(--chart-2))",
                        },
                      }}>
                        <LineChart
                          accessibilityLayer
                          data={performanceData.performance_trends}
                          margin={{
                            left: 12,
                            right: 12,
                          }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => {
                              try {
                                return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              } catch {
                                return value;
                              }
                            }}
                          />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                          <Line
                            dataKey="completion_rate"
                            type="natural"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Gauge className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No performance data available</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Barcodes Tab */}
          <TabsContent value="barcodes" className="space-y-6">
            {barcodeData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Barcodes"
                    value={safeGet(barcodeData, 'barcode_summary.total_barcodes', 0).toLocaleString()}
                    subtitle="All time issued"
                    icon={Package}
                    color="blue"
                  />
                  <StatCard
                    title="Usage Rate"
                    value={`${safeGet(barcodeData, 'barcode_summary.usage_rate', 0).toFixed(1)}%`}
                    subtitle="Barcodes utilized"
                    icon={Target}
                    color="green"
                  />
                  <StatCard
                    title="Active Codes"
                    value={safeGet(barcodeData, 'barcode_summary.active_barcodes', 0).toLocaleString()}
                    subtitle="Ready for use"
                    icon={Zap}
                    color="yellow"
                    pulse={true}
                  />
                  <StatCard
                    title="Bill Association"
                    value={`${safeGet(barcodeData, 'barcode_summary.bill_association_rate', 0).toFixed(1)}%`}
                    subtitle="Linked to bills"
                    icon={Route}
                    color="purple"
                  />
                </div>

                {/* Barcode Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Barcode Status Distribution</CardTitle>
                    <CardDescription>Current status of all barcodes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {barcodeData?.status_distribution && barcodeData.status_distribution.length > 0 ? (
                      <ChartContainer config={barcodeData.status_distribution.reduce((acc, item, index) => {
                        acc[item.status] = {
                          label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                          color: `var(--chart-${(index % 5) + 1})`,
                        };
                        return acc;
                      }, {})}>
                        <BarChart accessibilityLayer data={barcodeData.status_distribution}>
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="status"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                          />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                          <Bar dataKey="count" fill="var(--chart-1)" radius={8} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-72 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No barcode data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No barcode data available</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Predictive Tab */}
          <TabsContent value="predictive" className="space-y-6">
            {predictiveData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Growth Rate"
                    value={`${safeGet(predictiveData, 'predictions.growth_rate', 0).toFixed(1)}%`}
                    subtitle="Monthly trend"
                    icon={TrendingUpIcon}
                    color="green"
                  />
                  <StatCard
                    title="Predicted Bills"
                    value={safeGet(predictiveData, 'predictions.predicted_monthly_bills', 0).toLocaleString()}
                    subtitle="Next month forecast"
                    icon={Brain}
                    color="purple"
                  />
                  <StatCard
                    title="Peak Day"
                    value={safeGet(predictiveData, 'predictions.busiest_weekday', 'N/A')}
                    subtitle="Busiest weekday"
                    icon={Calendar}
                    color="blue"
                  />
                </div>

                {/* Material Trends Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Material Demand Trends</CardTitle>
                    <CardDescription>Recent vs total material usage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {predictiveData?.material_trends && predictiveData.material_trends.length > 0 ? (
                      <ChartContainer config={{
                        total_count: {
                          label: "Total Count",
                          color: "var(--chart-1)",
                        },
                        recent_count: {
                          label: "Recent Count",
                          color: "var(--chart-2)",
                        },
                      }}>
                        <BarChart accessibilityLayer data={predictiveData.material_trends}>
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="material"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                          />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <Bar dataKey="total_count" fill="var(--color-total_count)" radius={4} />
                          <Bar dataKey="recent_count" fill="var(--color-recent_count)" radius={4} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-72 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No material trend data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                      <span>AI Insights</span>
                      <Badge variant="outline" className="text-xs">
                        {safeGet(predictiveData, 'predictions.confidence_score', 75)}% confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">📈 Trend Analysis</h4>
                        <p className="text-sm text-gray-600">
                          Your business is showing a {safeGet(predictiveData, 'insights.trend_direction', 'positive')} 
                          growth trend of {Math.abs(safeGet(predictiveData, 'predictions.growth_rate', 0)).toFixed(1)}%. 
                          {safeGet(predictiveData, 'predictions.busiest_weekday', 'Tuesday')} is your peak performance day.
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">🎯 Recommendations</h4>
                        <p className="text-sm text-gray-600">
                          Consider optimizing resource allocation for {safeGet(predictiveData, 'predictions.busiest_weekday', 'Tuesday')}s. 
                          The predicted {safeGet(predictiveData, 'predictions.predicted_monthly_bills', 280)} bills next month 
                          suggests planning for increased capacity.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No predictive data available</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Real-time Tab */}
          <TabsContent value="realtime" className="space-y-6">
            {dashboardData ? (
              <>
                {/* Today's Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Today's Bills"
                    value={safeGet(dashboardData, 'today_stats.bills_issued', 0).toLocaleString()}
                    subtitle="Issued today"
                    icon={Package}
                    color="blue"
                    pulse={true}
                  />
                  <StatCard
                    title="Today's Revenue"
                    value={`₹${safeGet(dashboardData, 'today_stats.revenue', 0).toLocaleString()}`}
                    subtitle="Earned today"
                    icon={DollarSign}
                    color="green"
                    pulse={true}
                  />
                  <StatCard
                    title="Recent Completions"
                    value={safeGet(dashboardData, 'live_metrics.recent_completions', 0).toLocaleString()}
                    subtitle="Last 24 hours"
                    icon={CheckCircle}
                    color="emerald"
                  />
                </div>

                {/* Live Alerts */}
                {dashboardData.alerts && dashboardData.alerts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-red-500" />
                        <span>Live Alerts</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.alerts.map((alert, index) => (
                          <AlertCard key={index} alert={alert} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Live Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Live Metrics</CardTitle>
                    <CardDescription>Real-time operational status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800">Active Shipments</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {safeGet(dashboardData, 'live_metrics.active_shipments', 0)}
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
                              {safeGet(dashboardData, 'live_metrics.recent_completions', 0)}
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
                              {safeGet(dashboardData, 'live_metrics.overdue_count', 0)}
                            </p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                {dashboardData.recent_activity && dashboardData.recent_activity.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Recent Activity</span>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span>Live updates</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {dashboardData.recent_activity.map((activity, index) => (
                          <motion.div
                            key={activity.code || index}
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
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No real-time data available</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
