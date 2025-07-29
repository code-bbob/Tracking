"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  Package,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  Eye,
  Activity,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Navbar from "../components/Navbar"

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState("30")
  const [selectedView, setSelectedView] = useState("overview")

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  // Transform API data to match chart expectations
  const transformAnalyticsData = (apiData) => {
    if (!apiData) return null

    return {
      summary: {
        total_bills: apiData.summary?.total_bills || 0,
        total_revenue: apiData.summary?.total_revenue || 0,
        completion_rate: apiData.summary?.completion_rate || 0,
        pending_bills: apiData.summary?.pending_bills || 0,
        completed_bills: apiData.summary?.completed_bills || 0,
        overdue_bills: apiData.summary?.overdue_bills || 0,
        cancelled_bills: apiData.summary?.cancelled_bills || 0,
        growth_rate: apiData.summary?.growth_rate || 0,
      },
      daily_trends:
        apiData.daily_trends?.map((day) => ({
          date: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          bills: day.bills_count || 0,
          revenue: day.revenue || 0,
          completed: day.completed_count || 0,
        })) || [],
      material_distribution:
        apiData.material_distribution?.map((item, index) => ({
          name: item.material?.charAt(0).toUpperCase() + item.material?.slice(1) || "Unknown",
          value: item.count || 0,
          revenue: item.revenue || 0,
          color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"][index % 6],
        })) || [],
      regional_distribution:
        apiData.regional_distribution?.map((item) => ({
          name: item.region === "local" ? "Local" : "Cross Border",
          value: item.count || 0,
          revenue: item.revenue || 0,
          color: item.region === "local" ? "#3b82f6" : "#f59e0b",
        })) || [],
      vehicle_distribution:
        apiData.vehicle_distribution?.map((item, index) => ({
          name: item.vehicle_size || "Unknown",
          value: item.count || 0,
          revenue: item.revenue || 0,
          color: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5],
        })) || [],
      top_destinations:
        apiData.top_destinations?.map((item, index) => ({
          name: item.destination || "Unknown",
          value: item.count || 0,
          revenue: item.revenue || 0,
          color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"][index % 6],
        })) || [],
      status_distribution: [
        { name: "Completed", value: apiData.summary?.completed_bills || 0, color: "#10b981" },
        { name: "Pending", value: apiData.summary?.pending_bills || 0, color: "#f59e0b" },
        { name: "Overdue", value: apiData.summary?.overdue_bills || 0, color: "#ef4444" },
        { name: "Cancelled", value: apiData.summary?.cancelled_bills || 0, color: "#6b7280" },
      ].filter((item) => item.value > 0),
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("accessToken")
      if (!token) {
        setError(new Error("No access token found"))
        return
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }

      const response = await fetch(`${backendUrl}/bills/analytics/overview/?days=${timeRange}`, { headers })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const rawData = await response.json()
      const transformedData = transformAnalyticsData(rawData)
      setAnalyticsData(transformedData)
    } catch (error) {
      console.error("Error fetching analytics data:", error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const exportData = () => {
    if (!analyticsData) return
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, variant = "default" }) => {
    const variants = {
      default: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
      success: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
      warning: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
    }

    const iconVariants = {
      default: "bg-blue-500",
      success: "bg-green-500",
      warning: "bg-amber-500",
    }

    return (
      <Card className={`${variants[variant]} border-2 hover:shadow-lg transition-all duration-200`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${iconVariants[variant]} rounded-xl flex items-center justify-center shadow-sm`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            {trend !== undefined && (
              <div
                className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                  trend > 0
                    ? "text-green-700 bg-green-100"
                    : trend < 0
                      ? "text-red-700 bg-red-100"
                      : "text-gray-700 bg-gray-100"
                }`}
              >
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            <p className="text-sm font-medium text-gray-700">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <Activity className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 font-medium">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Data</h2>
            <p className="text-gray-600 mb-6">{error.message}</p>
            <Button onClick={fetchAnalyticsData} className="flex items-center gap-2 mx-auto">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No analytics data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        title="Analytics Dashboard" 
        subtitle="Monitor performance and track business metrics"
        showBackButton={true}
      />
      
      <div className="container mx-auto px-4 py-6 max-w-none">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Tabs value={selectedView} onValueChange={setSelectedView}>
                <TabsList className="grid grid-cols-2 bg-white rounded-lg p-1 shadow-sm border">
                  <TabsTrigger value="overview" className="flex items-center gap-2 rounded-md text-sm px-2 py-1">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2 rounded-md text-sm px-2 py-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Insights</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <MetricCard
                title="Total Bills"
                value={analyticsData.summary.total_bills.toLocaleString()}
                subtitle={`${timeRange} days period`}
                icon={Package}
                trend={analyticsData.summary.growth_rate}
                variant="default"
              />
              <MetricCard
                title="Total Revenue"
                value={`Rs.${analyticsData.summary.total_revenue.toLocaleString()}`}
                subtitle="Total earnings"
                icon={DollarSign}
                variant="success"
              />
              <MetricCard
                title="Completion Rate"
                value={`${analyticsData.summary.completion_rate.toFixed(1)}%`}
                subtitle="Successfully completed"
                icon={CheckCircle}
                variant="success"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Daily Trends Chart */}
              {analyticsData.daily_trends && analyticsData.daily_trends.length > 0 && (
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Daily Bills Trend</CardTitle>
                    <CardDescription className="text-gray-500">
                      Bills issued over the last {timeRange} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.daily_trends}
                          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis
                            dataKey="date"
                            fontSize={11}
                            tick={{ fill: "#64748b" }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            interval="preserveStartEnd"
                          />
                          <YAxis fontSize={11} tick={{ fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} width={40} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              fontSize: "12px"
                            }}
                          />
                          <Bar dataKey="bills" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Bills" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Revenue Trends */}
              {analyticsData.daily_trends && analyticsData.daily_trends.length > 0 && (
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Revenue Trends</CardTitle>
                    <CardDescription className="text-gray-500">Daily revenue over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analyticsData.daily_trends}
                          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis
                            dataKey="date"
                            fontSize={11}
                            tick={{ fill: "#64748b" }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            interval="preserveStartEnd"
                          />
                          <YAxis fontSize={11} tick={{ fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} width={60} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              fontSize: "12px"
                            }}
                            formatter={(value) => [`Rs.${value.toLocaleString()}`, "Revenue"]}
                          />
                          <Line
                            dataKey="revenue"
                            type="monotone"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: "#10b981", r: 3 }}
                            activeDot={{ r: 5, fill: "#10b981" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Status Overview */}
            {analyticsData.status_distribution && analyticsData.status_distribution.length > 0 && (
              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-6">
                  <CardTitle className="text-lg font-semibold text-gray-900">Bill Status Overview</CardTitle>
                  <CardDescription className="text-gray-500">Current distribution of bill statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-green-800 mb-1">Completed</p>
                          <p className="text-2xl font-bold text-green-900 truncate">{analyticsData.summary.completed_bills}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center ml-3">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-amber-800 mb-1">Pending</p>
                          <p className="text-2xl font-bold text-amber-900 truncate">{analyticsData.summary.pending_bills}</p>
                        </div>
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center ml-3">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-red-800 mb-1">Overdue</p>
                          <p className="text-2xl font-bold text-red-900 truncate">{analyticsData.summary.overdue_bills}</p>
                        </div>
                        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center ml-3">
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 mb-1">Cancelled</p>
                          <p className="text-2xl font-bold text-gray-900 truncate">{analyticsData.summary.cancelled_bills}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center ml-3">
                          <XCircle className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
              {/* Material Distribution */}
              {analyticsData.material_distribution && analyticsData.material_distribution.length > 0 && (
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Material Distribution</CardTitle>
                    <CardDescription className="text-gray-500">Bills by material type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.material_distribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="40%"
                            outerRadius={80}
                            innerRadius={40}
                            paddingAngle={2}
                          >
                            {analyticsData.material_distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              fontSize: "12px"
                            }}
                            formatter={(value, name) => [`${value} bills`, name]}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={80}
                            iconType="circle"
                            fontSize={10}
                            wrapperStyle={{ 
                              paddingTop: "10px",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                            layout="horizontal"
                            align="center"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Regional Distribution */}
              {analyticsData.regional_distribution && analyticsData.regional_distribution.length > 0 && (
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Regional Distribution</CardTitle>
                    <CardDescription className="text-gray-500">Local vs Cross Border</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.regional_distribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="40%"
                            outerRadius={80}
                            innerRadius={40}
                            paddingAngle={2}
                          >
                            {analyticsData.regional_distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              fontSize: "12px"
                            }}
                            formatter={(value, name) => [`${value} bills`, name]}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={80}
                            iconType="circle"
                            fontSize={10}
                            wrapperStyle={{ 
                              paddingTop: "10px",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                            layout="horizontal"
                            align="center"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vehicle Distribution */}
              {analyticsData.vehicle_distribution && analyticsData.vehicle_distribution.length > 0 && (
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Vehicle Distribution</CardTitle>
                    <CardDescription className="text-gray-500">Bills by vehicle size</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.vehicle_distribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="40%"
                            outerRadius={80}
                            innerRadius={40}
                            paddingAngle={2}
                          >
                            {analyticsData.vehicle_distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              fontSize: "12px"
                            }}
                            formatter={(value, name) => [`${value} bills`, name]}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={80}
                            iconType="circle"
                            fontSize={10}
                            wrapperStyle={{ 
                              paddingTop: "10px",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                            layout="horizontal"
                            align="center"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Destinations */}
              {analyticsData.top_destinations && analyticsData.top_destinations.length > 0 && (
                <Card className="shadow-sm border-0 bg-white lg:col-span-2 2xl:col-span-1">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Top Destinations</CardTitle>
                    <CardDescription className="text-gray-500">Most frequent destinations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.top_destinations}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="40%"
                            outerRadius={80}
                            innerRadius={40}
                            paddingAngle={2}
                          >
                            {analyticsData.top_destinations.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              fontSize: "12px"
                            }}
                            formatter={(value, name) => [`${value} bills`, name]}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={80}
                            iconType="circle"
                            fontSize={10}
                            wrapperStyle={{ 
                              paddingTop: "10px",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                            layout="horizontal"
                            align="center"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Distribution Pie Chart */}
              {analyticsData.status_distribution && analyticsData.status_distribution.length > 0 && (
                <Card className="shadow-sm border-0 bg-white lg:col-span-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Status Distribution</CardTitle>
                    <CardDescription className="text-gray-500">Bill status breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.status_distribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="40%"
                            outerRadius={80}
                            innerRadius={40}
                            paddingAngle={2}
                          >
                            {analyticsData.status_distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              fontSize: "12px"
                            }}
                            formatter={(value, name) => [`${value} bills`, name]}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={80}
                            iconType="circle"
                            fontSize={10}
                            wrapperStyle={{ 
                              paddingTop: "10px",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                            layout="horizontal"
                            align="center"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Analytics
