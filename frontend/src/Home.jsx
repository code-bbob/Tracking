"use client"

import { useState, useEffect, useCallback } from "react"
import BarcodeScanner from "./BarcodeScanner"
import ScanNotification from "./components/ScanNotification"
import Navbar from "./components/Navbar"
import Pagination from "./components/Pagination"
import { logout } from "./redux/accessSlice"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import useAxios from "./utils/useAxios"
import { CheckCircle, Clock, Truck, X, XCircle, AlertTriangle, MapPin, Calendar, User, Package, CreditCard, Flag, FileText, Shield } from "lucide-react"
import { Button } from "./components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog"

export default function Home() {
  const api = useAxios()
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  
  // Active bills (no pagination needed)
  const [activeShipments, setActiveShipments] = useState([])
  const [activeCount, setActiveCount] = useState(0)
  
  // Completed bills (paginated)
  const [completedShipments, setCompletedShipments] = useState([])
  const [completedPage, setCompletedPage] = useState(1)
  const [completedTotalPages, setCompletedTotalPages] = useState(1)
  const [completedTotalCount, setCompletedTotalCount] = useState(0)
  const [completedPageSize, setCompletedPageSize] = useState(20)
  
  // Cancelled bills (paginated)
  const [cancelledShipments, setCancelledShipments] = useState([])
  const [cancelledPage, setCancelledPage] = useState(1)
  const [cancelledTotalPages, setCancelledTotalPages] = useState(1)
  const [cancelledTotalCount, setCancelledTotalCount] = useState(0)
  const [cancelledPageSize, setCancelledPageSize] = useState(20)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false)
  const [isLoadingCancelled, setIsLoadingCancelled] = useState(false)
  const [userRole, setUserRole] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellingTruck, setCancellingTruck] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()


  const fetchUserRole = async () => {
    try {
      const res = await api.get("/enterprise/role/")
      setUserRole(res.data)
    } catch (e) { 
      console.error(e) 
    }
  }

  // Optimized fetch functions using new endpoints
  const fetchActiveShipments = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      const res = await api.get(`/bills/bills/active/?${params}`)
      const converted = res.data.results.map(b => ({
        ...b,
        vehicleNumber: b.vehicle_number,
        dateIssued: b.date_issued,
        billNumber: b.code,
        cargo: b.material,
        expectedTime: b.eta,
        billIssueTime: new Date(b.date_issued).toLocaleString("en-US"),
      }))
      
      setActiveShipments(converted)
      setActiveCount(res.data.count)
    } catch (error) {
      console.error("Error fetching active bills:", error)
      setActiveShipments([])
      setActiveCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [ searchQuery])

  const fetchCompletedShipments = useCallback(async (page = 1) => {
    try {
      setIsLoadingCompleted(true)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      const res = await api.get(`/bills/bills/completed/?${params}`)
      const converted = res.data.results.map(b => ({
        ...b,
        vehicleNumber: b.vehicle_number,
        dateIssued: b.date_issued,
        billNumber: b.code,
        cargo: b.material,
        expectedTime: b.eta,
        billIssueTime: new Date(b.date_issued).toLocaleString("en-US"),
      }))
      
      setCompletedShipments(converted)
      setCompletedPage(page)
      setCompletedTotalCount(res.data.count)
      
      // Get page size from backend response or calculate from results
      const pageSize = res.data.page_size || res.data.results.length || 20
      setCompletedPageSize(pageSize)
      setCompletedTotalPages(Math.ceil(res.data.count / pageSize))
    } catch (error) {
      console.error("Error fetching completed bills:", error)
      setCompletedShipments([])
      setCompletedTotalCount(0)
    } finally {
      setIsLoadingCompleted(false)
    }
  }, [searchQuery])

  const fetchCancelledShipments = useCallback(async (page = 1) => {
    try {
      setIsLoadingCancelled(true)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      const res = await api.get(`/bills/bills/cancelled/?${params}`)
      const converted = res.data.results.map(b => ({
        ...b,
        vehicleNumber: b.vehicle_number,
        dateIssued: b.date_issued,
        billNumber: b.code,
        cargo: b.material,
        expectedTime: b.eta,
        billIssueTime: new Date(b.date_issued).toLocaleString("en-US"),
      }))
      
      setCancelledShipments(converted)
      setCancelledPage(page)
      setCancelledTotalCount(res.data.count)
      
      // Get page size from backend response or calculate from results
      const pageSize = res.data.page_size || res.data.results.length || 20
      setCancelledPageSize(pageSize)
      setCancelledTotalPages(Math.ceil(res.data.count / pageSize))
    } catch (error) {
      console.error("Error fetching cancelled bills:", error)
      setCancelledShipments([])
      setCancelledTotalCount(0)
    } finally {
      setIsLoadingCancelled(false)
    }
  }, [searchQuery])

  // Initial data fetch
  useEffect(() => {
    fetchActiveShipments()
    fetchCompletedShipments(1)
    fetchCancelledShipments(1)
    fetchUserRole()
  }, [fetchActiveShipments, fetchCompletedShipments, fetchCancelledShipments])

  // Refresh data on window focus
  useEffect(() => {
    const handleFocus = () => {
      fetchActiveShipments()
      fetchCompletedShipments(completedPage)
      fetchCancelledShipments(cancelledPage)
    }
    
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [fetchActiveShipments, fetchCompletedShipments, fetchCancelledShipments, completedPage, cancelledPage])

  // Search effect with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchActiveShipments()
      fetchCompletedShipments(1)
      fetchCancelledShipments(1)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, fetchActiveShipments, fetchCompletedShipments, fetchCancelledShipments])

  const handleTruckClick = truck => setSelectedTruck(truck)
  const closeDetails = () => setSelectedTruck(null)

  const handleScan = async scannedCode => {
    try {
      setShowScanner(false)
      
      const response = await api.post('/bills/scan/', { code: scannedCode })
      
      setScanResult({ 
        type: 'success', 
        message: response.data.message || 'Bill completed successfully!', 
        show: true 
      })
      
      // Refresh active and completed shipments after successful scan
      await fetchActiveShipments()
      await fetchCompletedShipments(1)
      
      // Find the completed bill to show details
      const completedBill = completedShipments.find(t => 
        (t.billNumber || "").toLowerCase() === scannedCode.toLowerCase()
      ) || activeShipments.find(t => 
        (t.billNumber || "").toLowerCase() === scannedCode.toLowerCase()
      )
      
      if (completedBill) {
        setSelectedTruck({ 
          ...completedBill, 
          status: "completed", 
          completedTime: new Date().toLocaleString() 
        })
      }
      
    } catch (error) {
      setShowScanner(false)
      
      // Handle different types of errors from the backend with clearer messages
      let errorMessage = "Unknown scan error occurred"
      
      if (error.response?.data?.error) {
        const backendError = error.response.data.error
        
        // Make error messages more user-friendly and clear
        if (backendError.includes("not found") || backendError.includes("does not exist")) {
          errorMessage = "❌ Invalid Barcode - Code not found in system"
        } else if (backendError.includes("not active")) {
          errorMessage = "⚠️ Inactive Barcode - This code is no longer active"
        } else if (backendError.includes("already completed")) {
          errorMessage = "✅ Already Completed - This shipment was already processed"
        } else if (backendError.includes("not issued to you")) {
          errorMessage = "🚫 Access Denied - This barcode was not issued to your organization"
        } else {
          errorMessage = `❌ Error: ${backendError}`
        }
      } else if (error.response?.status === 404) {
        errorMessage = "❌ Barcode Not Found - Invalid or unrecognized code"
      } else if (error.response?.status === 400) {
        errorMessage = "⚠️ Invalid Request - Barcode cannot be processed"
      } else if (error.response?.status === 403) {
        errorMessage = "🚫 Access Denied - You don't have permission to scan this code"
      } else if (error.message?.includes("Network Error")) {
        errorMessage = "📡 Connection Error - Check your internet connection"
      } else if (error.message) {
        errorMessage = `❌ Error: ${error.message}`
      }
      
      // Show clear error feedback
      setScanResult({ 
        type: 'error', 
        message: errorMessage, 
        show: true 
      })
    }
  }

  const getStatusColor = (status, isOverdue, region) => {
    if (isOverdue) return "text-red-600 bg-red-50"
    switch(status) {
      case "pending": return "text-blue-600 bg-blue-50"
      case "completed": return "text-green-600 bg-green-50"
      case "cancelled": return "text-red-600 bg-red-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  const formatDateTime = dt =>
    new Date(dt).toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })

  const CompactBillCard = ({ truck, isCompleted=false, isCancelled=false }) => {
    const overdue = !isCompleted && new Date() > new Date(truck.expectedTime)
    const local = truck.region === "local"
    return (
      <div
        className={`p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-all
          ${overdue ? "bg-red-50 border-red-200": local ? "bg-yellow-200 border-yellow-200" : "bg-white border-gray-200"}`}
        onClick={()=>handleTruckClick(truck)}
      >
        <div className="flex justify-between items-start">
          <div className="font-semibold text-sm sm:text-base">{truck.vehicleNumber}</div>
          <div className="flex text-xs justify-between items-center">
            <span className="truncate flex-1 mr-2">{truck.cargo} - </span>
            <span className="whitespace-nowrap">Rs. {truck.amount}</span>
          </div>
          {truck.status === 'completed' && (
            <div>
            {/* <div className="text-xs">Checked by:</div> */}
            <div className="ml-2 px-2 py-1 rounded-full text-xs font-medium">{truck.modified_by_name}</div>
            </div>
          )}
           {truck.status === 'pending' && (
            <div>
            {/* <div className="text-xs">Issued by:</div> */}
            <div className="ml-2 px-2 py-1 rounded-full text-xs font-medium">{truck.issued_by_name}</div>
            </div>
          )}
            {truck.status === 'cancelled' && (
            <div>
            <div className="text-xs">Cancelled by:</div>
            <div className="ml-2 px-2 py-1 rounded-full text-xs font-medium">{truck.modified_by_name}</div>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between items-center flex-wrap gap-1">
            <span className="text-xs">{formatDateTime(truck.dateIssued)}</span>
            <span className="text-xs truncate max-w-[100px] sm:max-w-none">{truck.destination}</span>
            <span className="text-xs">{formatDateTime(isCompleted || isCancelled ? truck.modified_date: truck.expectedTime)}</span>
          </div>
        </div>
      </div>
    )
  }

  const handleCancelShipment = async () => {
    if (!cancellingTruck) return
    
    setIsCancelling(true)
    try {
      await api.patch(`/bills/bills/${cancellingTruck.id}/`, { 
        status: "cancelled",
        code: cancellingTruck.billNumber 
      })
      
      // Refresh data after cancellation
      await fetchActiveShipments()
      await fetchCancelledShipments(1)
      
      setShowCancelDialog(false)
      setCancellingTruck(null)
      setSelectedTruck(null)
    } catch (error) {
      console.error("Error cancelling shipment:", error)
    } finally {
      setIsCancelling(false)
    }
  }

  const handleCompleteShipment = async () => {
    if (!selectedTruck) return
    setIsCompleting(true)
    try {
      await api.patch(`/bills/bills/${selectedTruck.id}/`, {
        status: "completed",
        code: selectedTruck.billNumber
      })
      // Refresh data after completion
      await fetchActiveShipments()
      await fetchCompletedShipments(1)
      setSelectedTruck(null)
    } catch (error) {
      console.error("Error completing shipment:", error)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        title='Dashboard'
        showSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCount={activeCount}
        completedCount={completedTotalCount}
        cancelledCount={cancelledTotalCount}
        onScanClick={()=>setShowScanner(true)}
      />

      <div className="max-w-7xl mx-auto p-2 sm:p-4">
          <div className="space-y-4">
            {/* Desktop Layout - 2 columns for Active and Completed, then Cancelled below */}
            <div className="hidden lg:block space-y-4">
              {/* Top row: Active and Completed side by side */}
              <div className="grid grid-cols-2 gap-4 h-[110vh]">
                {/* Active */}
                <div className="flex flex-col overflow-hidden bg-white rounded-lg shadow-sm border h-full">
                  <div className="flex items-center justify-between p-3 border-b bg-blue-100 rounded-t-lg">
                    <h2 className="flex items-center gap-2 font-semibold">
                      <Clock className="h-5 w-5 text-blue-600"/> Active Shipments
                    </h2>
                    <span className="text-sm text-gray-500">{activeCount} bills</span>
                  </div>
                  <div className="flex-1 overflow-hidden p-3">
                    <div className="h-full overflow-y-auto space-y-1 pr-2">
                      {activeShipments.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No active shipments</p>
                      ) : (
                        activeShipments.map(truck => (
                          <CompactBillCard key={truck.id} truck={truck} />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Completed */}
                <div className="flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden h-full">
                  <div className="flex items-center justify-between p-3 border-b bg-green-100 rounded-t-lg">
                    <h2 className="flex items-center gap-2 font-semibold">
                      <CheckCircle className="h-5 w-5 text-green-600"/> Completed Shipments
                    </h2>
                    <span className="text-sm text-gray-500">{completedTotalCount} bills</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto p-3">
                        <div className="space-y-1 pr-2">
                          {isLoadingCompleted ? (
                            <div className="flex justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                            </div>
                          ) : completedShipments.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No completed shipments</p>
                          ) : (
                            completedShipments.map(truck => (
                              <CompactBillCard key={truck.id} truck={truck} isCompleted />
                            ))
                          )}
                        </div>
                      </div>
                      <div className="flex justify-center px-3 py-2">
                        <Pagination
                          currentPage={completedPage}
                          totalPages={completedTotalPages}
                          onPageChange={fetchCompletedShipments}
                          totalCount={completedTotalCount}
                          pageSize={completedPageSize}
                          isLoading={isLoadingCompleted}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom row: Cancelled full width */}
              <div className="flex flex-col bg-white rounded-lg w-full shadow-sm border overflow-hidden h-[calc(100vh-40px)]">
                <div className="flex items-center justify-between p-3 border-b bg-red-100 rounded-t-lg">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <XCircle className="h-5 w-5 text-red-600"/> Cancelled Shipments
                  </h2>
                  <span className="text-sm text-gray-500">{cancelledTotalCount} bills</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-3">
                      <div className="space-y-2 pr-2">
                        {isLoadingCancelled ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        ) : cancelledShipments.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No cancelled shipments</p>
                        ) : (
                          cancelledShipments.map(truck => (
                            <CompactBillCard key={truck.id} truck={truck} isCancelled />
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center px-3 py-2">
                      <Pagination
                        currentPage={cancelledPage}
                        totalPages={cancelledTotalPages}
                        onPageChange={fetchCancelledShipments}
                        totalCount={cancelledTotalCount}
                        pageSize={cancelledPageSize}
                        isLoading={isLoadingCancelled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile/Tablet Layout - Single column, scrollable sections */}
            <div className="lg:hidden space-y-4">
              {/* Active Shipments */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="flex items-center justify-between p-3 border-b bg-blue-100 rounded-t-lg">
                  <h2 className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600"/> Active Shipments
                  </h2>
                  <span className="text-xs sm:text-sm text-gray-500">{activeCount} bills</span>
                </div>
                <div className=" h-80 overflow-y-auto">
                  {activeShipments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">No active shipments</p>
                  ) : (
                    <div className="space-y-2">
                      {activeShipments.map(truck => (
                        <CompactBillCard key={truck.id} truck={truck} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Completed Shipments */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="flex items-center justify-between p-3 border-b bg-green-100 rounded-t-lg">
                  <h2 className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600"/> Completed Shipments
                  </h2>
                  <span className="text-xs sm:text-sm text-gray-500">{completedTotalCount} bills</span>
                </div>
                <div className=" h-80 overflow-hidden">
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-3">
                      {isLoadingCompleted ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                      ) : completedShipments.length === 0 ? (
                        <p className="text-center text-gray-500 py-8 text-sm">No completed shipments</p>
                      ) : (
                        <div className="space-y-2">
                          {completedShipments.map(truck => (
                            <CompactBillCard key={truck.id} truck={truck} isCompleted />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center px-3 py-2">
                      <Pagination
                        currentPage={completedPage}
                        totalPages={completedTotalPages}
                        onPageChange={fetchCompletedShipments}
                        totalCount={completedTotalCount}
                        pageSize={completedPageSize}
                        isLoading={isLoadingCompleted}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancelled Shipments */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="flex items-center justify-between p-3 border-b bg-red-100 rounded-t-lg">
                  <h2 className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600"/> Cancelled Shipments
                  </h2>
                  <span className="text-xs sm:text-sm text-gray-500">{cancelledTotalCount} bills</span>
                </div>
                <div className=" h-80 overflow-hidden">
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-3">
                      {isLoadingCancelled ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                      ) : cancelledShipments.length === 0 ? (
                        <p className="text-center text-gray-500 py-8 text-sm">No cancelled shipments</p>
                      ) : (
                        <div className="space-y-2">
                          {cancelledShipments.map(truck => (
                            <CompactBillCard key={truck.id} truck={truck} isCancelled />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center px-3 py-2">
                      <Pagination
                        currentPage={cancelledPage}
                        totalPages={cancelledTotalPages}
                        onPageChange={fetchCancelledShipments}
                        totalCount={cancelledTotalCount}
                        pageSize={cancelledPageSize}
                        isLoading={isLoadingCancelled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        
      </div>

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={()=>setShowScanner(false)} />}
      
      <ScanNotification 
        type={scanResult?.type}
        message={scanResult?.message}
        onClose={() => setScanResult(null)}
      />

      {!!selectedTruck && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeDetails}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200" onClick={e=>e.stopPropagation()}>
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-gray-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">#{selectedTruck.billNumber}</h3>
                  <p className="text-xs text-gray-500">{selectedTruck.vehicleNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTruck.status, false, selectedTruck.region)}`}>
                  {selectedTruck.status}
                </span>
                <Button variant="ghost" size="sm" onClick={closeDetails} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Compact Content */}
            <div className="p-4 space-y-4">
              {/* Route */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>Route</span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{selectedTruck.issue_location}</p>
                  <p className="text-xs text-gray-500">to {selectedTruck.destination}</p>
                </div>
              </div>

              {/* Material & Amount */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="h-4 w-4" />
                  <span>Cargo</span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 capitalize">{selectedTruck.cargo}</p>
                  <p className="text-lg font-bold text-green-600">Rs. {selectedTruck.amount?.toLocaleString()}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Issued</span>
                  </div>
                  <p className="text-gray-900">{formatDateTime(selectedTruck.dateIssued)}</p>
                </div>
              
               <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Issued By</span>
                  </div>
                  <p className="text-gray-900 font-medium">{selectedTruck.issued_by_name || 'System'}</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Expected</span>
                  </div>
                  <p className="text-gray-900">{formatDateTime(selectedTruck.expectedTime)}</p>
                </div>

                {selectedTruck.completedTime && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Completed</span>
                    </div>
                    <p className="text-green-700 font-medium">{formatDateTime(selectedTruck.completedTime)}</p>
                  </div>
                )}

                {selectedTruck.modified_date && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Last Modified</span>
                    </div>
                    <p className="text-gray-900">{formatDateTime(selectedTruck.modified_date)}</p>
                  </div>
                )}
              </div>

              {selectedTruck.modified_by && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Modified By</span>
                    </div>
                    <p className="text-gray-900">{selectedTruck.modified_by_name}</p>
                  </div>
                )}
              </div>

              {/* Vehicle Details */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck className="h-4 w-4" />
                  <span>Vehicle Size</span>
                </div>
                <p className="text-gray-900">{selectedTruck.vehicle_size}</p>
              </div>

              {/* Region */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Flag className="h-4 w-4" />
                  <span>Region</span>
                </div>
                <p className="text-gray-900 capitalize">{selectedTruck.region}</p>
              </div>

              {/* Remarks */}
              {selectedTruck.remark && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-600 mt-0.5" />
                    <div>
                      <span className="text-gray-600">Remarks:</span>
                      <p className="text-gray-900 mt-1">{selectedTruck.remark}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compact Footer Actions */}
            {userRole === "Admin" && selectedTruck.status === "pending" && (
              <div className="border-t border-gray-200 p-3 flex flex-col gap-2">
                <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCompleteDialog(true)}
                      disabled={isCompleting}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isCompleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Complete Shipment
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        Complete Shipment
                      </DialogTitle>
                      <DialogDescription className="pt-2">
                        Are you sure you want to complete this shipment? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        variant="outline"
                        onClick={() => setShowCompleteDialog(false)}
                        disabled={isCompleting}
                      >
                        Keep
                      </Button>
                      <Button
                        
                        onClick={() => { setShowCompleteDialog(false); handleCompleteShipment(); }}
                        disabled={isCompleting}
                        className="flex items-center bg-green-600 gap-2"
                      >
                        {isCompleting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Complete
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setCancellingTruck(selectedTruck)}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Shipment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Cancel Shipment
                      </DialogTitle>
                      <DialogDescription className="pt-2">
                        Are you sure you want to cancel this shipment? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {cancellingTruck && (
                      <div className="bg-gray-50 p-3 rounded-lg my-4">
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">Vehicle:</span> {cancellingTruck.vehicleNumber}</p>
                          <p><span className="font-medium">Bill:</span> #{cancellingTruck.billNumber}</p>
                          <p><span className="font-medium">Destination:</span> {cancellingTruck.destination}</p>
                        </div>
                      </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowCancelDialog(false)
                          setCancellingTruck(null)
                        }}
                        disabled={isCancelling}
                      >
                        Keep
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleCancelShipment}
                        disabled={isCancelling}
                        className="flex items-center gap-2"
                      >
                        {isCancelling ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}