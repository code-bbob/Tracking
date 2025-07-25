"use client"

import { useState, useEffect } from "react"
import BarcodeScanner from "./BarcodeScanner"
import Navbar from "./components/Navbar"
import { logout } from "./redux/accessSlice"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
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
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [userShipments, setUserShipments] = useState([])
  const [completedUserShipments, setCompletedUserShipments] = useState([])
  const [cancelledUserShipments, setCancelledUserShipments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellingTruck, setCancellingTruck] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  // mappings...
  const materialTypeMap = { roda: { en: "Roda", np: "रोडा" }, /*...*/ }
  const regionMap = { local: { en: "Local", np: "स्थानीय" }, /*...*/ }
  const vehicleSizeMap = { "260 cubic feet": { en: "260 cubic feet", np: "२६० घन फिट" }, /*...*/ }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    dispatch(logout())
    navigate("/login")
  }

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${backendUrl}/enterprise/role/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setUserRole(await res.json())
    } catch (e) { console.error(e) }
  }

  const fetchBills = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${backendUrl}/bills/bills/`)
      if (!res.ok) throw new Error(res.status)
      const bills = await res.json()
      const converted = bills.map(b => ({
        ...b,
        vehicleNumber: b.vehicle_number,
        dateIssued: b.date_issued,
        billNumber: b.code,
        cargo: b.material,
        expectedTime: b.eta,
        billIssueTime: new Date(b.date_issued).toLocaleString("en-US"),
      }))
      setUserShipments(converted.filter(b => b.status === "pending"))
      setCompletedUserShipments(converted.filter(b => b.status === "completed"))
      setCancelledUserShipments(converted.filter(b => b.status === "cancelled"))
      localStorage.setItem("truckShipments", JSON.stringify(userShipments))
      localStorage.setItem("completedShipments", JSON.stringify(completedUserShipments))
      localStorage.setItem("cancelledShipments", JSON.stringify(cancelledUserShipments))
    } catch {
      const saved = JSON.parse(localStorage.getItem("truckShipments") || "[]")
      const savedComp = JSON.parse(localStorage.getItem("completedShipments") || "[]")
      const savedCanc = JSON.parse(localStorage.getItem("cancelledShipments") || "[]")
      setUserShipments(saved)
      setCompletedUserShipments(savedComp)
      setCancelledUserShipments(savedCanc)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBills()
    fetchUserRole()
    window.addEventListener("focus", fetchBills)
    window.addEventListener("storage", fetchBills)
    return () => {
      window.removeEventListener("focus", fetchBills)
      window.removeEventListener("storage", fetchBills)
    }
  }, [])

  const updateBillStatus = async (id, status, code) => {
    const res = await fetch(`${backendUrl}/bills/bills/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ status, code }),
    })
    if (!res.ok) throw new Error(res.status)
    return res.json()
  }

  const handleTruckClick = truck => setSelectedTruck(truck)
  const closeDetails = () => setSelectedTruck(null)

  const handleScan = async scannedCode => {
    // search in pending
    const found = userShipments.find(t =>
      (t.billNumber||"").toLowerCase() === scannedCode.toLowerCase()
    )
    if (found) {
      await updateBillStatus(found.id, "completed", scannedCode)
      await fetchBills()
      setShowScanner(false)
      setSelectedTruck({ ...found, status:"completed", completedTime: new Date().toLocaleString() })
    } else {
      setShowScanner(false)
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

  const filterBills = bills =>
    searchQuery
      ? bills.filter(b =>
          b.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.cargo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.billNumber.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : bills

  const filteredActive = filterBills(userShipments)
  const filteredCompleted = filterBills(completedUserShipments)
  const filteredCancelled = filterBills(cancelledUserShipments)

  const CompactBillCard = ({ truck, isCompleted=false, isCancelled=false }) => {
    const overdue = !isCompleted && new Date() > new Date(truck.expectedTime)
    const local = truck.region === "local"
    return (
      <div
        className={`p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-all
          ${overdue ? "bg-red-50 border-red-200": local ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"}`}
        onClick={()=>handleTruckClick(truck)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="font-semibold text-sm sm:text-base">{truck.vehicleNumber}</div>
          <div className="flex text-xs justify-between items-center">
            <span className="truncate flex-1 mr-2">{truck.cargo} - </span>
            <span className="whitespace-nowrap">Rs. {truck.amount}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            {userRole === "Admin" && <div className="font-mono text-xs text-gray-500">{truck.billNumber}</div>}
          </div>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between items-center flex-wrap gap-1">
            <span className="text-xs">{formatDateTime(truck.dateIssued)}</span>
            <span className="text-xs truncate max-w-[100px] sm:max-w-none">{truck.destination}</span>
            <span className="text-xs">{formatDateTime(isCompleted ? truck.completedTime : truck.expectedTime)}</span>
          </div>
        </div>
      </div>
    )
  }

  const handleCancelShipment = async () => {
    if (!cancellingTruck) return
    
    setIsCancelling(true)
    try {
      const res = await fetch(`${backendUrl}/bills/bills/${cancellingTruck.id}/`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({ 
          status: "cancelled",
          code: cancellingTruck.billNumber 
        }),
      })
      
      if (res.ok) {
        await fetchBills()
        setShowCancelDialog(false)
        setCancellingTruck(null)
        setSelectedTruck(null)
      } else {
        console.error("Failed to cancel shipment")
      }
    } catch (error) {
      console.error("Error cancelling shipment:", error)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        showSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCount={filteredActive.length}
        completedCount={filteredCompleted.length}
        cancelledCount={filteredCancelled.length}
        onScanClick={()=>setShowScanner(true)}
      />

      <div className="max-w-7xl mx-auto p-2 sm:p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-5 w-5 border-b-2 border-gray-900"></div></div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Layout - 2 columns for Active and Completed, then Cancelled below */}
            <div className="hidden lg:block space-y-4">
              {/* Top row: Active and Completed side by side */}
              <div className="grid grid-cols-2 gap-4 h-[calc(75vh-40px)]">
                {/* Active */}
                <div className="flex flex-col overflow-scroll bg-white rounded-lg shadow-sm border h-full">
                  <div className="flex items-center justify-between p-3 border-b bg-blue-100 rounded-t-lg">
                    <h2 className="flex items-center gap-2 font-semibold">
                      <Clock className="h-5 w-5 text-blue-600"/> Active Shipments
                    </h2>
                    <span className="text-sm text-gray-500">{filteredActive.length} bills</span>
                  </div>
                  <div className="flex-1 overflow-hidden p-3">
                    <div className="h-full overflow-y-auto space-y-2 pr-2">
                      {filteredActive.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No active shipments</p>
                      ) : (
                        filteredActive.map(truck => (
                          <CompactBillCard key={truck.id} truck={truck} />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Completed */}
                <div className="flex flex-col bg-white rounded-lg shadow-sm border overflow-scroll h-full">
                  <div className="flex items-center justify-between p-3 border-b bg-green-100 rounded-t-lg">
                    <h2 className="flex items-center gap-2 font-semibold">
                      <CheckCircle className="h-5 w-5 text-green-600"/> Completed Shipments
                    </h2>
                    <span className="text-sm text-gray-500">{filteredCompleted.length} bills</span>
                  </div>
                  <div className="flex-1 overflow-hidden p-3">
                    <div className="h-full overflow-y-auto space-y-2 pr-2">
                      {filteredCompleted.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No completed shipments</p>
                      ) : (
                        filteredCompleted.map(truck => (
                          <CompactBillCard key={truck.id} truck={truck} isCompleted />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom row: Cancelled full width */}
              <div className="flex flex-col bg-white rounded-lg w-[calc(50vw-25px)] shadow-sm border overflow-scroll h-[calc(40vh-40px)]">
                <div className="flex items-center justify-between p-3 border-b bg-red-100 rounded-t-lg">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <XCircle className="h-5 w-5 text-red-600"/> Cancelled Shipments
                  </h2>
                  <span className="text-sm text-gray-500">{filteredCancelled.length} bills</span>
                </div>
                <div className="flex-1 overflow-hidden p-3">
                  <div className="h-full overflow-y-auto space-y-2 pr-2">
                    {filteredCancelled.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No cancelled shipments</p>
                    ) : (
                      filteredCancelled.map(truck => (
                        <CompactBillCard key={truck.id} truck={truck} isCancelled />
                      ))
                    )}
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
                  <span className="text-xs sm:text-sm text-gray-500">{filteredActive.length} bills</span>
                </div>
                <div className="p-3 max-h-80 overflow-y-auto">
                  {filteredActive.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">No active shipments</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredActive.map(truck => (
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
                  <span className="text-xs sm:text-sm text-gray-500">{filteredCompleted.length} bills</span>
                </div>
                <div className="p-3 max-h-80 overflow-y-auto">
                  {filteredCompleted.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">No completed shipments</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredCompleted.map(truck => (
                        <CompactBillCard key={truck.id} truck={truck} isCompleted />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cancelled Shipments */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="flex items-center justify-between p-3 border-b bg-red-100 rounded-t-lg">
                  <h2 className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600"/> Cancelled Shipments
                  </h2>
                  <span className="text-xs sm:text-sm text-gray-500">{filteredCancelled.length} bills</span>
                </div>
                <div className="p-3 max-h-60 overflow-y-auto">
                  {filteredCancelled.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">No cancelled shipments</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredCancelled.map(truck => (
                        <CompactBillCard key={truck.id} truck={truck} isCancelled />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={()=>setShowScanner(false)} />}
      {!!selectedTruck && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeDetails}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200" onClick={e=>e.stopPropagation()}>
            {/* Compact Header */}
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

              {/* Personnel */}
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
              <div className="border-t border-gray-200 p-3">
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