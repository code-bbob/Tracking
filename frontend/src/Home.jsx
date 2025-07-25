"use client"

import { useState, useEffect } from "react"
import BarcodeScanner from "./BarcodeScanner"
import Navbar from "./components/Navbar"
import { logout } from "./redux/accessSlice"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { CheckCircle, Clock, Truck, X, XCircle } from "lucide-react"
import { Button } from "./components/ui/button"

export default function Home() {
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [userShipments, setUserShipments] = useState([])
  const [completedUserShipments, setCompletedUserShipments] = useState([])
  const [cancelledUserShipments, setCancelledUserShipments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        showSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCount={filteredActive.length}
        completedCount={filteredCompleted.length}
        onScanClick={()=>setShowScanner(true)}
      />

      <div className="max-w-7xl mx-auto p-2 sm:p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-5 w-5 border-b-2 border-gray-900"></div></div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Layout - 2 columns for Active and Completed */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-4 h-[calc(100vh-80px)]">
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
                      {filteredCompleted.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No completed shipments</p>
                    ) : (
                      filteredCompleted.map(truck => (
                        <CompactBillCard key={truck.id} truck={truck} isCompleted />
                      ))
                    )}
                    {filteredCompleted.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No completed shipments</p>
                    ) : (
                      filteredCompleted.map(truck => (
                        <CompactBillCard key={truck.id} truck={truck} isCompleted />
                      ))
                    )}
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
                      {filteredCompleted.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No completed shipments</p>
                    ) : (
                      filteredCompleted.map(truck => (
                        <CompactBillCard key={truck.id} truck={truck} isCompleted />
                      ))
                    )}
                    {filteredCompleted.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No completed shipments</p>
                    ) : (
                      filteredCompleted.map(truck => (
                        <CompactBillCard key={truck.id} truck={truck} isCompleted />
                      ))
                    )}
                    {filteredCompleted.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No completed shipments</p>
                    ) : (
                      filteredCompleted.map(truck => (
                        <CompactBillCard key={truck.id} truck={truck} isCompleted />
                      ))
                    )}
 
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

            {/* Desktop Cancelled Section - Full width */}
            <div className="hidden lg:block h-[calc(40vh-80px)]">
              <div className="flex flex-col bg-white rounded-lg shadow-sm border overflow-scroll h-full">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {filteredCancelled.map(truck => (
                          <CompactBillCard key={truck.id} truck={truck} isCancelled />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={()=>setShowScanner(false)} />}
      {!!selectedTruck && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeDetails}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
            {/* Truck Details Modal */}
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Shipment Details</h3>
                <Button variant="ghost" size="sm" onClick={closeDetails}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vehicle Number</label>
                    <p className="text-sm text-gray-900">{selectedTruck.vehicleNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bill Number</label>
                    <p className="text-sm text-gray-900">{selectedTruck.billNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Material</label>
                    <p className="text-sm text-gray-900">{selectedTruck.cargo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount</label>
                    <p className="text-sm text-gray-900">Rs. {selectedTruck.amount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Issue Location</label>
                    <p className="text-sm text-gray-900">{selectedTruck.issue_location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Destination</label>
                    <p className="text-sm text-gray-900">{selectedTruck.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date Issued</label>
                    <p className="text-sm text-gray-900">{formatDateTime(selectedTruck.dateIssued)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expected Time</label>
                    <p className="text-sm text-gray-900">{formatDateTime(selectedTruck.expectedTime)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedTruck.status, false, selectedTruck.region)}`}>
                      {selectedTruck.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Region</label>
                    <p className="text-sm text-gray-900">{selectedTruck.region}</p>
                  </div>
                </div>

                {selectedTruck.completedTime && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Completed Time</label>
                    <p className="text-sm text-gray-900">{formatDateTime(selectedTruck.completedTime)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}