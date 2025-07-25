"use client"

import { useState, useEffect } from "react"
import BarcodeScanner from "./BarcodeScanner"
import Navbar from "./components/Navbar"
import { logout } from "./redux/accessSlice"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { CheckCircle, Clock, Truck } from "lucide-react"

function Home() {
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

  // Material type mapping for display
  const materialTypeMap = {
    roda: { en: "Roda", np: "रोडा" },
    baluwa: { en: "Baluwa", np: "बालुवा" },
    dhunga: { en: "Dhunga", np: "ढुङ्गा" },
    gravel: { en: "Gravel", np: "गिट्टी" },
    chips: { en: "Chips", np: "चिप्स" },
    dust: { en: "Dust", np: "धुलो" },
    mato: { en: "Mato", np: "माटो" },
    "base/subbase": { en: "Base/Subbase", np: "बेस/सबबेस" },
    Itta: { en: "Itta", np: "इट्टा" },
    Kawadi: { en: "Kawadi", np: "कवाडी" },
    other: { en: "Other", np: "अन्य" },
  }

  const regionMap = {
    local: { en: "Local", np: "स्थानीय" },
    Crossborder: { en: "Crossborder", np: "सीमा पार" },
  }

  const vehicleSizeMap = {
    "260 cubic feet": { en: "260 cubic feet", np: "२६० घन फिट" },
    "160 cubic feet": { en: "160 cubic feet", np: "१६० घन फिट" },
    "100 cubic feet": { en: "100 cubic feet", np: "१०० घन फिट" },
    Other: { en: "Other", np: "अन्य" },
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    dispatch(logout())
    navigate("/login")
  }

  // Fetch user role
  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`${backendUrl}/enterprise/role/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (response.ok) {
        const role = await response.json()
        setUserRole(role)
      }
    } catch (err) {
      console.error("Error fetching user role:", err)
    }
  }

  // Helper function to get bilingual display text
  const getBilingualText = (value, mapping) => {
    const item = mapping[value]
    return item ? `${item.en} | ${item.np}` : value
  }

  // Fetch bills from Django backend
  const fetchBills = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${backendUrl}/bills/bills/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const bills = await response.json()

      // Convert API bills to frontend format
      const convertedBills = bills.map((bill) => ({
        id: bill.id,
        code: bill.code,
        vehicleNumber: bill.vehicle_number,
        amount: bill.amount,
        issueLocation: bill.issue_location,
        material: bill.material,
        destination: bill.destination,
        vehicleSize: bill.vehicle_size,
        region: bill.region,
        eta: bill.eta,
        remark: bill.remark,
        dateIssued: bill.date_issued,
        status: bill.status,
        driverName: "Driver TBD",
        driverPhone: "",
        truckNumber: bill.vehicle_number,
        billNumber: bill.code,
        cargo: bill.material,
        expectedTime: bill.eta,
        billIssueTime: new Date(bill.date_issued).toLocaleString("en-US"),
      }))

      // Separate active and completed bills
      const activeBills = convertedBills.filter((bill) => bill.status === "pending")
      const completedBills = convertedBills.filter((bill) => bill.status === "completed")

      setUserShipments(activeBills)
      setCompletedUserShipments(completedBills)

      localStorage.setItem("truckShipments", JSON.stringify(activeBills))
      localStorage.setItem("completedShipments", JSON.stringify(completedBills))
    } catch (error) {
      console.error("Error fetching bills:", error)
      loadFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem("truckShipments")
    const savedCompleted = localStorage.getItem("completedShipments")
    if (saved) {
      setUserShipments(JSON.parse(saved))
    }
    if (savedCompleted) {
      setCompletedUserShipments(JSON.parse(savedCompleted))
    }
  }

  // Load shipments on component mount
  useEffect(() => {
    fetchBills()
    fetchUserRole()

    const handleStorageChange = () => {
      fetchBills()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("focus", fetchBills)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", fetchBills)
    }
  }, [])

  // Update bill status via API
  const updateBillStatus = async (billId, newStatus, scannedCode) => {
    try {
      console.log("HERE WUTH BILL ID", billId, "NEW STATUS", newStatus, "SCANNED CODE", scannedCode)
      const response = await fetch(`${backendUrl}/bills/bills/${billId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: newStatus, code: scannedCode }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error("Error updating bill status:", error)
      throw error
    }
  }

  const issuedTrucks = userShipments
  const completedTrucks = completedUserShipments

  const handleTruckClick = (truck) => {
    setSelectedTruck(truck)
  }

  const closeDetails = () => {
    setSelectedTruck(null)
  }

  const handleScan = async (scannedCode) => {
    const foundInIssued = issuedTrucks.find(
      (truck) =>
        (truck.billNumber && truck.billNumber.toLowerCase() === scannedCode.toLowerCase()) ||
        (truck.code && truck.code.toLowerCase() === scannedCode.toLowerCase()),
    )

    if (foundInIssued) {
      try {
        await updateBillStatus(foundInIssued.id, "completed", scannedCode)
        await fetchBills()
        setShowScanner(false)
        setSelectedTruck({
          ...foundInIssued,
          status: "completed",
          completedTime: new Date().toLocaleString("en-US"),
        })
      } catch (error) {
        console.error("Error updating shipment status:", error)
        setShowScanner(false)
      }
    } else {
      const foundInCompleted = completedTrucks.find(
        (truck) =>
          (truck.billNumber && truck.billNumber.toLowerCase() === scannedCode.toLowerCase()) ||
          (truck.code && truck.code.toLowerCase() === scannedCode.toLowerCase()),
      )

      if (foundInCompleted) {
        setSelectedTruck(foundInCompleted)
        setShowScanner(false)
      } else {
        setShowScanner(false)
      }
    }
  }

  const generateBarcode = (billNumber) => {
    return `||||| || ||| | |||| ||| |||| | ||| ||||`
  }

  const isOverdue = (expectedTime) => {
    const now = new Date("2025-07-21T12:00:00")
    const expected = new Date(expectedTime)
    return now > expected
  }

  const getStatusColor = (status, isOverdueShipment = false, region = "") => {
    if (isOverdueShipment) return "text-red-600 bg-red-50"
    if (region && region.toLowerCase() === "local") return "text-yellow-700 bg-yellow-50"

    switch (status.toLowerCase()) {
      case "pending":
        return "text-blue-600 bg-blue-50"
      case "loading":
        return "text-orange-600 bg-orange-50"
      case "departed":
        return "text-purple-600 bg-purple-50"
      case "completed":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  // Compact Bill Card Component - Updated to match your changes
  const CompactBillCard = ({ truck, isCompleted = false }) => {
    const overdueShipment = !isCompleted && isOverdue(truck.expectedTime || truck.eta)
    const displayMaterial = truck.material ? getBilingualText(truck.material, materialTypeMap) : truck.cargo
    const billNumber = truck.code || truck.billNumber
    const vehicleNumber = truck.vehicleNumber || truck.truckNumber
    const isLocal = truck.region && truck.region.toLowerCase() === "local"

    return (
      <div
        className={`p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-all duration-150 ${
          isLocal ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"
        } ${overdueShipment ? "border-red-300 bg-red-50" : ""}`}
        onClick={() => handleTruckClick(truck)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm text-gray-900">{vehicleNumber}</div>
            {overdueShipment && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
            {isLocal && <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>}
          </div>
          <div
            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(truck.status, overdueShipment, truck.region)}`}
          >
            {truck.status}
          </div>
        </div>

        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span className="truncate flex-1 mr-2">{displayMaterial}</span>
            {truck.amount && <span className="font-medium">Rs. {truck.amount}</span>}
          </div>
          <div className="flex justify-between">
            <div className="truncate">{formatDateTime(truck.dateIssued)}</div>
            <div className="truncate">{truck.destination}</div>
            <div className="truncate">
              {formatDateTime(truck.completedTime ? truck.completedTime : truck.expectedTime || truck.eta) || "TBD"}
            </div>
          </div>
          {userRole === "Admin" && <div className="font-mono text-gray-500">{billNumber}</div>}
        </div>
      </div>
    )
  }

  // Filter bills based on search query
  const filterBills = (bills) => {
    if (!searchQuery) return bills
    return bills.filter(
      (bill) =>
        (bill.vehicleNumber || bill.truckNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bill.destination || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bill.material || bill.cargo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bill.code || bill.billNumber || "").toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  const filteredIssuedTrucks = filterBills(issuedTrucks)
  const filteredCompletedTrucks = filterBills(completedTrucks)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Professional Navbar */}
      <Navbar
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCount={filteredIssuedTrucks.length}
        completedCount={filteredCompletedTrucks.length}
        onScanClick={() => setShowScanner(true)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              <span>Loading shipments...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
            {/* Active Shipments */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Active Shipments
                </h2>
                <div className="text-sm text-gray-500">{filteredIssuedTrucks.length} bills</div>
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {filteredIssuedTrucks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Truck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No active shipments found</p>
                    </div>
                  ) : (
                    filteredIssuedTrucks.map((truck) => <CompactBillCard key={truck.id} truck={truck} />)
                  )}
                </div>
              </div>
            </div>

            {/* Completed Shipments */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Completed Shipments
                </h2>
                <div className="text-sm text-gray-500">{filteredCompletedTrucks.length} bills</div>
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {filteredCompletedTrucks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No completed shipments found</p>
                    </div>
                  ) : (
                    filteredCompletedTrucks.map((truck) => (
                      <CompactBillCard key={truck.id} truck={truck} isCompleted={true} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {/* Compact Shipment Details Modal */}
      {selectedTruck && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4"
          onClick={closeDetails}
        >
          <div
            className="bg-white rounded-lg w-full max-w-lg max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Shipment Details</h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-xl w-6 h-6 flex items-center justify-center"
                onClick={closeDetails}
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Vehicle & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vehicle</label>
                  <div className="text-base font-mono font-semibold">
                    {selectedTruck.vehicleNumber || selectedTruck.truckNumber}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedTruck.status, !selectedTruck.completedTime && isOverdue(selectedTruck.expectedTime || selectedTruck.eta), selectedTruck.region)}`}
                  >
                    {selectedTruck.status}
                  </span>
                </div>
              </div>

              {/* Bill Code (Admin only) */}
              {userRole === "Admin" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bill Code</label>
                  <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {selectedTruck.code || selectedTruck.billNumber}
                  </div>
                </div>
              )}

              {/* Material & Destination */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Material</label>
                  <div className="text-sm">
                    {selectedTruck.material
                      ? getBilingualText(selectedTruck.material, materialTypeMap)
                      : selectedTruck.cargo}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Destination</label>
                  <div className="text-sm">{selectedTruck.destination}</div>
                </div>
              </div>

              {/* Region & Vehicle Size */}
              <div className="grid grid-cols-2 gap-3">
                {selectedTruck.region && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Region</label>
                    <div
                      className={`text-sm ${selectedTruck.region.toLowerCase() === "local" ? "text-yellow-700 font-medium" : ""}`}
                    >
                      {getBilingualText(selectedTruck.region, regionMap)}
                    </div>
                  </div>
                )}
                {selectedTruck.vehicleSize && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Vehicle Size</label>
                    <div className="text-sm">{getBilingualText(selectedTruck.vehicleSize, vehicleSizeMap)}</div>
                  </div>
                )}
              </div>

              {/* Amount */}
              {selectedTruck.amount && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                  <div className="text-lg font-bold text-green-600">
                    Rs. {Number.parseFloat(selectedTruck.amount).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Time Information */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date Issued</label>
                  <div className="text-sm">
                    {selectedTruck.dateIssued
                      ? new Date(selectedTruck.dateIssued).toLocaleString()
                      : selectedTruck.billIssueTime}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Expected Arrival</label>
                  <div
                    className={`text-sm ${
                      isOverdue(selectedTruck.expectedTime || selectedTruck.eta) && !selectedTruck.completedTime
                        ? "text-red-600 font-medium"
                        : ""
                    }`}
                  >
                    {selectedTruck.eta || selectedTruck.expectedTime || "TBD"}
                  </div>
                </div>
                {selectedTruck.completedTime && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Completed</label>
                    <div className="text-sm text-green-600 font-medium">{selectedTruck.completedTime}</div>
                  </div>
                )}
              </div>

              {/* Issue Location */}
              {selectedTruck.issueLocation && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Issue Location</label>
                  <div className="text-sm">{selectedTruck.issueLocation}</div>
                </div>
              )}

              {/* Remarks */}
              {selectedTruck.remark && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Remarks</label>
                  <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{selectedTruck.remark}</div>
                </div>
              )}

              {/* Barcode - Only show for Admin */}
              {userRole === "Admin" && (
                <div className="border-t pt-4">
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <div className="font-mono text-xs tracking-wider text-gray-800 mb-1">
                      {generateBarcode(selectedTruck.code || selectedTruck.billNumber)}
                    </div>
                    <div className="text-xs font-medium text-gray-600">
                      {selectedTruck.code || selectedTruck.billNumber}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
