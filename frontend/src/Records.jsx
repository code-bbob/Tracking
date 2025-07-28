import { useState, useEffect, useRef } from "react"
import { Search, Filter, Download, X, MapPin, Package, Truck, Clock, CheckCircle, XCircle, FileText, Printer } from "lucide-react"
import { Button } from "./components/ui/button"
import Navbar from "./components/Navbar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog"
import useAxios from "./utils/useAxios"
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import html2canvas from 'html2canvas'


export default function Records() {
    const api = useAxios()
  const [bills, setBills] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState(null)
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null })
  const [currentPage, setCurrentPage] = useState(1)
  
  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    material: "",
    region: "",
    vehicleSize: "",
    issuedBy: "",
    modifiedBy: "",
    dateIssuedFrom: "",
    dateIssuedTo: "",
    dateModifiedFrom: "",
    dateModifiedTo: "",
    amountFrom: "",
    amountTo: "",
  })
  
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "",
    material: "",
    region: "",
    vehicleSize: "",
    issuedBy: "",
    modifiedBy: "",
    dateIssuedFrom: "",
    dateIssuedTo: "",
    dateModifiedFrom: "",
    dateModifiedTo: "",
    amountFrom: "",
    amountTo: "",
  })
  
  const [showFilters, setShowFilters] = useState(false)
  
  // Material choices
  const materialChoices = [
    { value: 'roda', label: 'Roda' },
    { value: 'baluwa', label: 'Baluwa' },
    { value: 'dhunga', label: 'Dhunga' },
    { value: 'gravel', label: 'Gravel' },
    { value: 'chips', label: 'Chips' },
    { value: 'dust', label: 'Dust' },
    { value: 'mato', label: 'Mato' },
    { value: 'base/subbase', label: 'Base/Subbase' },
    { value: 'Itta', label: 'Itta' },
    { value: 'Kawadi', label: 'Kawadi' },
    { value: 'other', label: 'Other' },
  ]

  // Vehicle size choices
  const vehicleSizeChoices = [
    { value: '260', label: '260 cubic feet' },
    { value: '160', label: '160 cubic feet' },
    { value: '100', label: '100 cubic feet' },
    { value: 'Other', label: 'Other' },
  ]

  const fetchBills = async (page = 1) => {
    try {
      setIsLoading(true)
      console.log('Fetching bills from API...')
      
      // Build query parameters using appliedFilters instead of filters
      const queryParams = new URLSearchParams()
      if (page > 1) queryParams.append('page', page)
      
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) {
          // Map frontend filter keys to backend expected keys
          const keyMap = {
            vehicleSize: 'vehicle_size',
            issuedBy: 'issued_by',
            modifiedBy: 'modified_by',
            dateIssuedFrom: 'date_issued_from',
            dateIssuedTo: 'date_issued_to',
            dateModifiedFrom: 'date_modified_from',
            dateModifiedTo: 'date_modified_to',
            amountFrom: 'amount_from',
            amountTo: 'amount_to'
          }
          const backendKey = keyMap[key] || key
          queryParams.append(backendKey, value)
        }
      })
      
      const url = `/bills/bills/?${queryParams.toString()}`
      console.log('Making request to:', url)
      
      const response = await api.get(url)
      console.log('Response received:', response.data)
      
      const data = response.data
      
      // Handle paginated response structure
      const billsData = data.results || data
      const isArray = Array.isArray(billsData)
      
      if (!isArray) {
        console.error('Expected array of bills, received:', billsData)
        setBills([])
        return
      }
      
      // Convert data for frontend compatibility
      const convertedBills = billsData.map(bill => ({
        ...bill,
        vehicleNumber: bill.vehicle_number,
        dateIssued: bill.date_issued,
        billNumber: bill.code,
        cargo: bill.material,
        expectedTime: bill.eta,
        billIssueTime: new Date(bill.date_issued).toLocaleString("en-US"),
      }))
      
      setBills(convertedBills)
      setPagination({
        count: data.count || billsData.length,
        next: data.next,
        previous: data.previous
      })
      
    } catch (error) {
      console.error("Error fetching bills:", error)
      console.error("Error response:", error.response)
      
      // Log more details about the error
      if (error.response) {
        console.error("Status:", error.response.status)
        console.error("Headers:", error.response.headers)
        console.error("Data:", error.response.data)
      } else if (error.request) {
        console.error("Request made but no response:", error.request)
      } else {
        console.error("Error message:", error.message)
      }
      
      // Set empty state on error
      setBills([])
      setPagination({ count: 0, next: null, previous: null })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBills(currentPage)
  }, [appliedFilters, currentPage])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setAppliedFilters(filters)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      status: "",
      material: "",
      region: "",
      vehicleSize: "",
      issuedBy: "",
      modifiedBy: "",
      dateIssuedFrom: "",
      dateIssuedTo: "",
      dateModifiedFrom: "",
      dateModifiedTo: "",
      amountFrom: "",
      amountTo: "",
    }
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setCurrentPage(1)
  }

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    }
    
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    )
  }

  const exportToCSV = () => {
    const csvHeaders = [
      'Bill Number', 'Vehicle Number', 'Date Issued', 'Amount', 'Status',
      'Material', 'Issue Location', 'Destination', 'Region', 'Vehicle Size',
      'Issued By', 'Modified By', 'Modified Date', 'Remarks'
    ]
    
    const csvData = bills.map(bill => [
      bill.code,
      bill.vehicle_number,
      formatDateTime(bill.date_issued),
      bill.amount,
      bill.status,
      bill.material,
      bill.issue_location,
      bill.destination,
      bill.region,
      bill.vehicle_size,
      bill.issued_by_name || '',
      bill.modified_by_name || '',
      bill.modified_date ? formatDateTime(bill.modified_date) : '',
      bill.remark || ''
    ])
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bills_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Calculate total amounts (excluding cancelled bills)
  const calculateTotals = () => {
    const pendingTotal = bills
      .filter(bill => bill.status === 'pending')
      .reduce((sum, bill) => sum + (bill.amount || 0), 0)
    
    const completedTotal = bills
      .filter(bill => bill.status === 'completed')
      .reduce((sum, bill) => sum + (bill.amount || 0), 0)
    
    const cancelledTotal = bills
      .filter(bill => bill.status === 'cancelled')
      .reduce((sum, bill) => sum + (bill.amount || 0), 0)
    
    const grandTotal = pendingTotal + completedTotal
    
    return { pendingTotal, completedTotal, cancelledTotal, grandTotal }
  }

  const totals = calculateTotals()

  // Simple and reliable PDF export
  const exportToPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4') // landscape for more width
      
      // Header
      doc.setFontSize(18)
      doc.setTextColor(40, 40, 40)
      doc.text('Bill Records Report', 20, 20)
      
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)
      doc.text(`Total Records: ${bills.length}`, 20, 37)
      
      // Table setup
      let yPosition = 50
      const lineHeight = 6
      const pageHeight = 190 // leave space for footer
      
      // Table headers
      doc.setFontSize(9)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(255, 255, 255)
      doc.setFillColor(41, 128, 185)
      doc.rect(15, yPosition - 4, 260, 8, 'F')
      
      doc.text('Bill #', 20, yPosition)
      doc.text('Vehicle', 50, yPosition)
      doc.text('Route', 80, yPosition)
      doc.text('Material', 140, yPosition)
      doc.text('Amount', 170, yPosition)
      doc.text('Status', 200, yPosition)
      doc.text('Date', 220, yPosition)
      
      yPosition += 10
      
      // Table data
      doc.setFont(undefined, 'normal')
      doc.setFontSize(8)
      doc.setTextColor(40, 40, 40)
      
      bills.forEach((bill, index) => {
        if (yPosition > pageHeight) {
          doc.addPage()
          yPosition = 20
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250)
          doc.rect(15, yPosition - 3, 260, lineHeight, 'F')
        }
        
        doc.text(bill.code || '', 20, yPosition)
        doc.text(bill.vehicle_number || '', 50, yPosition)
        
        // Simple route format with consistent spacing
        const route = `${bill.issue_location} - ${bill.destination}`
        const maxRouteLength = 30 // Increased from 25
        doc.text(route.length > maxRouteLength ? route.substring(0, maxRouteLength) + '...' : route, 80, yPosition)
        
        doc.text(bill.material || '', 140, yPosition)
        doc.text(`Rs. ${(bill.amount || 0).toLocaleString()}`, 170, yPosition)
        doc.text(bill.status || '', 200, yPosition)
        doc.text(new Date(bill.date_issued).toLocaleString(), 220, yPosition)
        
        yPosition += lineHeight
      })
      
      // Financial summary
      yPosition += 15
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text('Financial Summary', 20, yPosition)
      
      yPosition += 10
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`Pending Amount: Rs. ${totals.pendingTotal.toLocaleString()}`, 20, yPosition)
      doc.text(`Completed Amount: Rs. ${totals.completedTotal.toLocaleString()}`, 20, yPosition + 7)
      doc.text(`Cancelled Amount: Rs. ${totals.cancelledTotal.toLocaleString()} (excluded)`, 20, yPosition + 14)
      
      doc.setFont(undefined, 'bold')
      doc.setTextColor(0, 100, 0)
      doc.text(`Total Revenue: Rs. ${totals.grandTotal.toLocaleString()}`, 20, yPosition + 21)
      
      doc.save(`bills_report_${new Date().toISOString().split('T')[0]}.pdf`)
      
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('PDF export failed. Please try the CSV export instead.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bill Records</h1>
            <p className="text-gray-600">
              Showing {bills.length} bills (Total: {pagination.count})
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Close' : 'Filters'}
            </Button>
            <Button
              onClick={exportToCSV}
              className="flex items-center gap-2"
              disabled={bills.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={exportToPDF}
              className="flex items-center gap-2"
              disabled={bills.length === 0}
            >
              <Printer className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg border p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Filters</h3>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search bills..."
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Material */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <select
                    value={filters.material}
                    onChange={(e) => handleFilterChange('material', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Materials</option>
                    {materialChoices.map(choice => (
                      <option key={choice.value} value={choice.value}>{choice.label}</option>
                    ))}
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    value={filters.region}
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Regions</option>
                    <option value="local">Local</option>
                    <option value="crossborder">Crossborder</option>
                  </select>
                </div>

                {/* Vehicle Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Size</label>
                  <select
                    value={filters.vehicleSize}
                    onChange={(e) => handleFilterChange('vehicleSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Sizes</option>
                    {vehicleSizeChoices.map(choice => (
                      <option key={choice.value} value={choice.value}>{choice.label}</option>
                    ))}
                  </select>
                </div>

                {/* Issued By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issued By</label>
                  <input
                    type="text"
                    value={filters.issuedBy}
                    onChange={(e) => handleFilterChange('issuedBy', e.target.value)}
                    placeholder="User name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date Issued From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Issued From</label>
                  <input
                    type="date"
                    value={filters.dateIssuedFrom}
                    onChange={(e) => handleFilterChange('dateIssuedFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date Issued To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Issued To</label>
                  <input
                    type="date"
                    value={filters.dateIssuedTo}
                    onChange={(e) => handleFilterChange('dateIssuedTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Amount From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount From</label>
                  <input
                    type="number"
                    value={filters.amountFrom}
                    onChange={(e) => handleFilterChange('amountFrom', e.target.value)}
                    placeholder="Min amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Amount To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount To</label>
                  <input
                    type="number"
                    value={filters.amountTo}
                    onChange={(e) => handleFilterChange('amountTo', e.target.value)}
                    placeholder="Max amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Checked By (Modified By) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Checked By</label>
                  <input
                    type="text"
                    value={filters.modifiedBy}
                    onChange={(e) => handleFilterChange('modifiedBy', e.target.value)}
                    placeholder="User name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Checked Date From (Modified Date From) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Checked Date From</label>
                  <input
                    type="date"
                    value={filters.dateModifiedFrom}
                    onChange={(e) => handleFilterChange('dateModifiedFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Checked Date To (Modified Date To) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Checked Date To</label>
                  <input
                    type="date"
                    value={filters.dateModifiedTo}
                    onChange={(e) => handleFilterChange('dateModifiedTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filter Action Buttons */}
              <div className="flex gap-3 mt-4 pt-4 border-t">
                <Button 
                  type="submit"
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Apply Filters
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Bills Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No bills found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto" id="bills-table-container">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Issued</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checked By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bills.map((bill) => (
                    <tr 
                      key={bill.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedBill(bill)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{bill.code}</div>
                        <div className="text-xs text-gray-500">{bill.issued_by_name || 'System'}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{bill.vehicle_number}</div>
                        <div className="text-xs text-gray-500">{bill.vehicle_size} cubic feet</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bill.issue_location}</div>
                        <div className="text-xs text-gray-500">to {bill.destination}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{bill.material}</div>
                        <div className="text-xs text-gray-500 capitalize">{bill.region}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          bill.status === 'pending' 
                            ? 'text-blue-600' 
                            : bill.status === 'cancelled'
                            ? 'text-red-500 line-through'
                            : 'text-green-600'
                        }`}>
                          Rs. {bill.amount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDateTime(bill.date_issued)}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bill.modified_by_name || '-'}</div>
                        {bill.modified_date && (
                          <div className="text-xs text-gray-500">
                            {formatDateTime(bill.modified_date)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {getStatusBadge(bill.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Professional Financial Summary */}
        {bills.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm mt-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Financial Summary
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                Revenue breakdown by status
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-blue-700 font-medium">Pending Amount</div>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-800">
                    Rs. {totals.pendingTotal.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {bills.filter(b => b.status === 'pending').length} bills awaiting completion
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-green-700 font-medium">Completed Amount</div>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-800">
                    Rs. {totals.completedTotal.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {bills.filter(b => b.status === 'completed').length} bills completed
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-red-700 font-medium">Cancelled Amount</div>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-800 line-through">
                    Rs. {totals.cancelledTotal.toLocaleString()}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {bills.filter(b => b.status === 'cancelled').length} bills cancelled (excluded)
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-200 font-medium">Total Revenue</div>
                    <Package className="h-4 w-4 text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    Rs. {totals.grandTotal.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    Combined pending + completed
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Revenue Calculation</h4>
                    <p className="text-sm text-gray-600">
                      Total revenue includes both pending and completed bills. 
                      Pending amounts are counted as they represent committed transactions.
                      Cancelled bills are excluded from all revenue calculations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.count > 50 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination.previous || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!pagination.next || isLoading}
            >
              Next
            </Button>
          </div>
        )}

        {/* Comprehensive Bill Details Modal */}
        {selectedBill && (
          <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Bill Details - #{selectedBill.code}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Status and Basic Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedBill.vehicle_number}</h3>
                    <p className="text-gray-600">{selectedBill.vehicle_size} cubic feet</p>
                  </div>
                  {getStatusBadge(selectedBill.status)}
                </div>

                {/* Route Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Route Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">From:</span> {selectedBill.issue_location}</div>
                      <div><span className="text-gray-600">To:</span> {selectedBill.destination}</div>
                      <div><span className="text-gray-600">Region:</span> <span className="capitalize">{selectedBill.region}</span></div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cargo & Payment</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">Material:</span> <span className="capitalize">{selectedBill.material}</span></div>
                      <div><span className="text-gray-600">Amount:</span> <span className="font-medium text-green-600">Rs. {selectedBill.amount?.toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date Issued:</span>
                      <span>{formatDateTime(selectedBill.date_issued)}</span>
                    </div>
                    {selectedBill.modified_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Modified:</span>
                        <span>{formatDateTime(selectedBill.modified_date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personnel */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Personnel</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issued By:</span>
                      <span>{selectedBill.issued_by_name || 'System'}</span>
                    </div>
                    {selectedBill.modified_by_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Modified By:</span>
                        <span>{selectedBill.modified_by_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Details */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Vehicle Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle Number:</span>
                      <span className="font-medium">{selectedBill.vehicle_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle Size:</span>
                      <span>{selectedBill.vehicle_size} cubic feet</span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bill Code:</span>
                      <span className="font-mono">{selectedBill.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="capitalize">{selectedBill.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region Type:</span>
                      <span className="capitalize">{selectedBill.region}</span>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {selectedBill.remark && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Remarks</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                      {selectedBill.remark}
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
