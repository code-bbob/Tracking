"use client"


import { useState } from "react"
import { ArrowLeft, Scan, Plus, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import BarcodeScanner from "./BarcodeScanner"
import useAxios from "./utils/useAxios"

// API configuration
const API_BASE_URL = "http://localhost:8000"

export default function AddShipment() {

  const api = useAxios()
  const [formData, setFormData] = useState({
    code: "",
    vehicleNumber: "",
    amount: "",
    issueLocation: "",
    material: "",
    destination: "",
    vehicleSize: "",
    region: "",
    etaHours: "",
    hasDriver: false,
    driverName: "",
    driverPhone: "",

  })

  const [showScanner, setShowScanner] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" })

  // Material types with bilingual labels
  const materialTypes = [
    { en: "Roda", np: "रोडा", value: "roda" },
    { en: "Baluwa", np: "बालुवा", value: "baluwa" },
    { en: "Dhunga", np: "ढुङ्गा", value: "dhunga" },
    { en: "Gravel", np: "गिट्टी", value: "gravel" },
    { en: "Chips", np: "चिप्स", value: "chips" },
    { en: "Dust", np: "धुलो", value: "dust" },
    { en: "Mato", np: "माटो", value: "mato" },
    { en: "Base/Subbase", np: "बेस/सबबेस", value: "base/subbase" },
    { en: "Itta", np: "इट्टा", value: "Itta" },
    { en: "Kawadi", np: "कवाडी", value: "Kawadi" },
    { en: "Other", np: "अन्य", value: "other" },
  ]

  const vehicleSizes = [
    { en: "260 cubic feet", np: "२६० घन फिट", value: "260 cubic feet" },
    { en: "160 cubic feet", np: "१६० घन फिट", value: "160 cubic feet" },
    { en: "100 cubic feet", np: "१०० घन फिट", value: "100 cubic feet" },
    { en: "Other", np: "अन्य", value: "Other" },
  ]

  const regions = [
    { en: "Local", np: "स्थानीय", value: "local" },
    { en: "Crossborder", np: "सीमा पार", value: "Crossborder" },
  ]

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    const checked = e.target.checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      hasDriver: checked,
      // Clear driver details if switch is turned off
      driverName: checked ? prev.driverName : "",
      driverPhone: checked ? prev.driverPhone : "",
    }))
  }

  const handleScan = (scannedCode) => {
    setFormData((prev) => ({
      ...prev,
      code: scannedCode,
    }))
    setShowScanner(false)
  }

  const calculateETA = (hours) => {
    if (!hours) return ""
    const now = new Date()
    const etaTime = new Date(now.getTime() + Number.parseFloat(hours) * 60 * 60 * 1000)
    return etaTime.toISOString()
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: "", message: "" })
  
    try {
      const eta = calculateETA(formData.etaHours)
      const billCode = formData.code || `BILL${Date.now().toString().slice(-6)}`
  
      const billData = {
        code: billCode,
        vehicle_number: formData.vehicleNumber,
        amount: Number.parseFloat(formData.amount) || 0,
        issue_location: formData.issueLocation,
        material: formData.material,
        destination: formData.destination,
        vehicle_size: formData.vehicleSize,
        region: formData.region,
        eta,
        remark: formData.hasDriver ? `Driver: ${formData.driverName}` : "Driver TBD",
        status: "pending",
      }
  
      const response = await api.post(`${API_BASE_URL}/bills/bills/`, billData)
      const createdBill = response.data
  
      // …your existing success logic…
  
      setSubmitStatus({
        type: "success",
        message: `Shipment ${billCode} created successfully!`,
      })
  
      // reset form after a delay
        setFormData({
          code: "",
          vehicleNumber: "",
          amount: "",
          issueLocation: "",
          material: "",
          destination: "",
          vehicleSize: "",
          region: "",
          etaHours: "",
          hasDriver: false,
          driverName: "",
          driverPhone: "",
        })
        setSubmitStatus({ type: "", message: "" })
  
    } catch (err) {
      // Try to pull out the DRF validation message
      let message = "Failed to create shipment."
      if (err.response && err.response.data) {
        const data = err.response.data
        // If non_field_errors exists, use that
        if (data.non_field_errors && data.non_field_errors.length) {
          message = data.non_field_errors[0]
        } else {
          // Otherwise, take the first field’s first message
          const firstKey = Object.keys(data)[0]
          if (Array.isArray(data[firstKey]) && data[firstKey].length) {
            message = data[firstKey][0]
          } else if (typeof data[firstKey] === "string") {
            message = data[firstKey]
          }
        }
      } else if (err.message) {
        // axios/network error fallback
        message = err.message
      }
  
      console.error("Error creating shipment:", err)
      setSubmitStatus({
        type: "error",
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const goBack = () => {
    window.history.back()
  }

  return (

    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 py-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={goBack} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Add Shipment</h1>
                <p className="text-sm text-gray-500">Create a new shipment entry</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {submitStatus.message && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div
            className={`p-3 rounded-lg text-sm font-medium ${
              submitStatus.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {submitStatus.message}
          </div>
        </div>
      )}

      {/* Main Content */}
        <form onSubmit={handleSubmit}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-lg font-medium text-gray-900">Shipment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bill Code & Vehicle Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Bill Code</Label>
                  <div className="flex gap-2">
                    <Input
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Auto-generated"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setShowScanner(true)}>
                      <Scan className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Vehicle Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    placeholder="BA 1 KHA 1234"
                    required
                  />
                </div>
              </div>

              {/* Material & Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Material <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.material} onValueChange={(value) => handleSelectChange("material", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTypes.map((material) => (
                        <SelectItem key={material.value} value={material.value}>
                          {material.en} | {material.np}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Destination <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="Enter destination"
                    required
                  />
                </div>
              </div>

              {/* Issue Location & Region */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Issue Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="issueLocation"
                    value={formData.issueLocation}
                    onChange={handleInputChange}
                    placeholder="Enter issue location"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Region <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.region} onValueChange={(value) => handleSelectChange("region", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.en} | {region.np}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vehicle Size & Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Vehicle Size <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.vehicleSize}
                    onValueChange={(value) => handleSelectChange("vehicleSize", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleSizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.en} | {size.np}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Amount (NPR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* ETA Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">ETA (Hours)</Label>
                  <Input
                    name="etaHours"
                    type="number"
                    value={formData.etaHours}
                    onChange={handleInputChange}
                    placeholder="24"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>

              {/* Driver Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Driver Assignment</Label>
                    <p className="text-xs text-gray-500 mt-1">Toggle to assign a driver to this shipment</p>
                  </div>
                  <Switch checked={formData.hasDriver} onCheckedChange={handleSwitchChange} />
                </div>

                {/* Driver Details - Show when switch is on */}
                {formData.hasDriver && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 pl-4 border-l-2 border-blue-100 bg-blue-50/30 rounded-r-lg p-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Driver Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="driverName"
                        value={formData.driverName}
                        onChange={handleInputChange}
                        placeholder="Enter driver name"
                        required={formData.hasDriver}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Driver Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="driverPhone"
                        value={formData.driverPhone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                        required={formData.hasDriver}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isSubmitting}
              className="sm:w-auto bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="sm:w-auto bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Shipment</span>
                </div>
              )}
            </Button>
          </div>
        </form>

      {/* Barcode Scanner Modal */}
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  )
}
