"use client"

import { useState, useEffect } from "react"
import BarcodeScanner from "./BarcodeScanner"
import Navbar from "./components/Navbar"
import { logout } from "./redux/accessSlice"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { CheckCircle, Clock, Truck } from "lucide-react"

export default function Home() {
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [userShipments, setUserShipments] = useState([])
  const [completedUserShipments, setCompletedUserShipments] = useState([])
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
      localStorage.setItem("truckShipments", JSON.stringify(userShipments))
      localStorage.setItem("completedShipments", JSON.stringify(completedUserShipments))
    } catch {
      const saved = JSON.parse(localStorage.getItem("truckShipments") || "[]")
      const savedComp = JSON.parse(localStorage.getItem("completedShipments") || "[]")
      setUserShipments(saved)
      setCompletedUserShipments(savedComp)
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
    if (region === "local") return "text-yellow-700 bg-yellow-50"
    switch(status) {
      case "pending": return "text-blue-600 bg-blue-50"
      case "completed": return "text-green-600 bg-green-50"
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

  const CompactBillCard = ({ truck, isCompleted=false }) => {
    const overdue = !isCompleted && new Date() > new Date(truck.expectedTime)
    return (
      <div
        className={`p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-all
          ${overdue ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}
        onClick={()=>handleTruckClick(truck)}
      >
        <div className="flex justify-between mb-2">
          <div className="font-semibold">{truck.vehicleNumber}</div>
          {userRole === "Admin" && <div className="font-mono text-sm text-gray-500">{truck.billNumber}</div>}
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(truck.status, overdue, truck.region)}`}>
            {truck.status}
          </span>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>{truck.cargo}</span>
            <span>Rs. {truck.amount}</span>
          </div>
          <div className="flex justify-between">
            <span>{formatDateTime(truck.dateIssued)}</span>
            <span>{truck.destination}</span>
            <span>{formatDateTime(isCompleted ? truck.completedTime : truck.expectedTime)}</span>
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

      <div className="max-w-7xl mx-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-5 w-5 border-b-2 border-gray-900"></div></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-160px)]">
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
                       {filteredActive.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No active shipments</p>
                  ) : (
                    filteredActive.map(truck => (
                      <CompactBillCard key={truck.id} truck={truck} />
                    ))
                  )}
                  {filteredActive.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No active shipments</p>
                  ) : (
                    filteredActive.map(truck => (
                      <CompactBillCard key={truck.id} truck={truck} />
                    ))
                  )}
                  {filteredActive.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No active shipments</p>
                  ) : (
                    filteredActive.map(truck => (
                      <CompactBillCard key={truck.id} truck={truck} />
                    ))
                  )}
                  {filteredActive.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No active shipments</p>
                  ) : (
                    filteredActive.map(truck => (
                      <CompactBillCard key={truck.id} truck={truck} />
                    ))
                  )}
                  {filteredActive.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No active shipments</p>
                  ) : (
                    filteredActive.map(truck => (
                      <CompactBillCard key={truck.id} truck={truck} />
                    ))
                  )}
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
              <div className="flex items-center justify-between  p-3 border-b bg-green-100 rounded-t-lg">
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
        )}
      </div>

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={()=>setShowScanner(false)} />}
      {!!selectedTruck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeDetails}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[95vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            {/* Details content… (same as before) */}
          </div>
        </div>
      )}
    </div>
  )
}
