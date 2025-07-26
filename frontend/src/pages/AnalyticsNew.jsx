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
  RefreshCw,
  Download,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState("30")
  const [selectedView, setSelectedView] = useState("overview")
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false)

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
        avg_bill_value: apiData.summary?.avg_bill_value || 0,
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

  useEffect(() => {
    if (isRealTimeEnabled) {
      const interval = setInterval(fetchAnalyticsData, 30000)
      return () => clearInterval(interval)
    }
  }, [isRealTimeEnabled, timeRange])

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

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = "blue" }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 bg-${color}-500 rounded-lg flex items-center justify-center`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 text-sm ${trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-600"}`}
            >
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
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={fetchAnalyticsData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              </div>
              <Badge variant={isRealTimeEnabled ? "default" : "secondary"} className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
                />
                {isRealTimeEnabled ? "Live" : "Static"}
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
                onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRealTimeEnabled ? "animate-spin" : ""}`} />
                Real-time
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
                className="flex items-center gap-2 bg-transparent"
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
          <TabsList className="grid w-full grid-cols-2 bg-white rounded-lg p-1 shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Bills"
                value={analyticsData.summary.total_bills.toLocaleString()}
                subtitle={`${timeRange} days period`}
                icon={Package}
                trend={analyticsData.summary.growth_rate}
                color="blue"
              />
              <StatCard
                title="Total Revenue"
                value={`₹${analyticsData.summary.total_revenue.toLocaleString()}`}
                subtitle="Total earnings"
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Completion Rate"
                value={`${analyticsData.summary.completion_rate.toFixed(1)}%`}
                subtitle="Successfully completed"
                icon={CheckCircle}
                color="emerald"
              />
              <StatCard
                title="Average Bill Value"
                value={`₹${analyticsData.summary.avg_bill_value.toLocaleString()}`}
                subtitle="Per bill average"
                icon={DollarSign}
                color="purple"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Trends Chart */}
              {analyticsData.daily_trends && analyticsData.daily_trends.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Bills Trend</CardTitle>
                    <CardDescription>Bills issued over the last {timeRange} days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.daily_trends}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="date" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <Bar dataKey="bills" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Bills" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Revenue Trends */}
              {analyticsData.daily_trends && analyticsData.daily_trends.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Daily revenue over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analyticsData.daily_trends}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="date" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
                          />
                          <Line
                            dataKey="revenue"
                            type="monotone"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: "#10b981", r: 4 }}
                            activeDot={{ r: 6, fill: "#10b981" }}
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
              <Card>
                <CardHeader>
                  <CardTitle>Bill Status Overview</CardTitle>
                  <CardDescription>Current distribution of bill statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Completed</p>
                          <p className="text-2xl font-bold text-green-900">{analyticsData.summary.completed_bills}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Pending</p>
                          <p className="text-2xl font-bold text-yellow-900">{analyticsData.summary.pending_bills}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-600" />
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800">Overdue</p>
                          <p className="text-2xl font-bold text-red-900">{analyticsData.summary.overdue_bills}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                      </div>
                    </div>
                    {analyticsData.summary.cancelled_bills > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">Cancelled</p>
                            <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.cancelled_bills}</p>
                          </div>
                          <Package className="h-8 w-8 text-gray-600" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Material Distribution */}
              {analyticsData.material_distribution && analyticsData.material_distribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Material Distribution</CardTitle>
                    <CardDescription>Bills by material type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.material_distribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={40}
                            paddingAngle={5}
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
                            }}
                            formatter={(value, name) => [`${value} bills`, name]}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" fontSize={12} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Regional Distribution */}
              {analyticsData.regional_distribution && analyticsData.regional_distribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Distribution</CardTitle>
                    <CardDescription>Local vs Cross Border</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.regional_distribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={40}
                            paddingAngle={5}
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
                            }}
                            formatter={(value, name) => [`${value} bills`, name]}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" fontSize={12} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vehicle Distribution */}
              {analyticsData.vehicle_distribution && analyticsData.vehicle_distribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Distribution</CardTitle>
                    <CardDescription>Bills by vehicle size</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.vehicle_distribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={40}
                            paddingAngle={5}
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
                            }}
                            formatter={(value, name) => [`${value} bills`, name]}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" fontSize={12} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Destinations */}
              {analyticsData.top_destinations && analyticsData.top_destinations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Destinations</CardTitle>
                    <CardDescription>Most frequent destinations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.top_destinations}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={40}
                            paddingAngle={5}
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
                            }}
                            formatter={(value, name) => [`${value} bills`, name]}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" fontSize={12} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Distribution Pie Chart */}
              {analyticsData.status_distribution && analyticsData.status_distribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Status Distribution</CardTitle>
                    <CardDescription>Bill status breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.status_distribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={40}
                            paddingAngle={5}
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
                            }}
                            formatter={(value, name) => [`${value} bills`, name]}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" fontSize={12} />
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
