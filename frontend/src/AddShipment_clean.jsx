import { useState } from "react"
import { ArrowLeft, Scan, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import BarcodeScanner from "./BarcodeScanner"

// API configuration
const API_BASE_URL = 'http://localhost:8000'

export default function AddShipment() {
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
  })

  const [showScanner, setShowScanner] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })

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
    setSubmitStatus({ type: '', message: '' })

    try {
      const eta = calculateETA(formData.etaHours)
      
      // Generate bill code if not provided
      const billCode = formData.code || `BILL${Date.now().toString().slice(-6)}`

      const billData = {
        code: billCode,
        vehicle_number: formData.vehicleNumber,
        amount: parseFloat(formData.amount) || 0,
        issue_location: formData.issueLocation,
        material: formData.material,
        destination: formData.destination,
        vehicle_size: formData.vehicleSize,
        region: formData.region,
        eta: eta,
        remark: formData.hasDriver ? "Driver assigned" : "Driver TBD",
        status: "pending"
      }

      // Submit to API
      const response = await fetch(`${API_BASE_URL}/bills/bills/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(billData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const createdBill = await response.json()
      
      // Also save to localStorage for backward compatibility
      const newShipment = {
        id: createdBill.id,
        code: billCode,
        vehicleNumber: formData.vehicleNumber,
        amount: formData.amount,
        issueLocation: formData.issueLocation,
        material: formData.material,
        destination: formData.destination,
        vehicleSize: formData.vehicleSize,
        region: formData.region,
        eta: eta,
        etaHours: formData.etaHours,
        remark: formData.hasDriver ? "Driver assigned" : "Driver TBD",
        driverName: formData.hasDriver ? "Assigned" : "Driver TBD",
        driverPhone: "",
        dateIssued: new Date().toISOString(),
        status: "pending",
        // Legacy fields for compatibility
        truckNumber: formData.vehicleNumber,
        billNumber: billCode,
        cargo: formData.material,
        expectedTime: eta,
        billIssueTime: new Date().toLocaleString('en-US'),
        progress: 5
      }

      // Update localStorage
      const existingShipments = JSON.parse(localStorage.getItem('truckShipments') || '[]')
      existingShipments.push(newShipment)
      localStorage.setItem('truckShipments', JSON.stringify(existingShipments))

      setSubmitStatus({
        type: 'success',
        message: `✅ Shipment ${billCode} created successfully!`
      })

      // Reset form after successful submission
      setTimeout(() => {
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
        })
        setSubmitStatus({ type: '', message: '' })
      }, 3000)

    } catch (error) {
      console.error('Error creating shipment:', error)
      setSubmitStatus({
        type: 'error',
        message: `❌ Failed to create shipment: ${error.message}`
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const goBack = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Add Shipment | ढुवानी थप्नुहोस्
                </h1>
                <p className="text-sm text-gray-500">Quick & simple shipment creation</p>
              </div>
            </div>
            
            {/* Status indicator */}
            {submitStatus.message && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                submitStatus.type === 'success' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {submitStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Single Card with all essential fields */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="text-xl font-semibold text-gray-800">
                Shipment Details | ढुवानी विवरण
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Fill in the essential information below</p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Bill Code & Vehicle Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                    Bill Code | बिल कोड
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Auto-generated"
                      className="flex-1 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScanner(true)}
                      className="px-3 h-11 border-gray-200 hover:bg-blue-50"
                    >
                      <Scan className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">
                    Vehicle Number | गाडी नम्बर *
                  </Label>
                  <Input
                    id="vehicleNumber"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    placeholder="BA 1 KHA 1234"
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Material & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material" className="text-sm font-medium text-gray-700">
                    Material | सामग्री *
                  </Label>
                  <Select value={formData.material} onValueChange={(value) => handleSelectChange('material', value)}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                  <Label htmlFor="destination" className="text-sm font-medium text-gray-700">
                    Destination | गन्तव्य *
                  </Label>
                  <Input
                    id="destination"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="Enter destination"
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Issue Location & Region */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueLocation" className="text-sm font-medium text-gray-700">
                    Issue Location | जारी स्थान *
                  </Label>
                  <Input
                    id="issueLocation"
                    name="issueLocation"
                    value={formData.issueLocation}
                    onChange={handleInputChange}
                    placeholder="Enter issue location"
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="region" className="text-sm font-medium text-gray-700">
                    Region | क्षेत्र *
                  </Label>
                  <Select value={formData.region} onValueChange={(value) => handleSelectChange('region', value)}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleSize" className="text-sm font-medium text-gray-700">
                    Vehicle Size | गाडी साइज *
                  </Label>
                  <Select value={formData.vehicleSize} onValueChange={(value) => handleSelectChange('vehicleSize', value)}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                    Amount (NPR) | रकम *
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* ETA Hours & Driver Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="etaHours" className="text-sm font-medium text-gray-700">
                    ETA (Hours) | अपेक्षित समय
                  </Label>
                  <Input
                    id="etaHours"
                    name="etaHours"
                    type="number"
                    value={formData.etaHours}
                    onChange={handleInputChange}
                    placeholder="24"
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    min="0"
                    step="0.5"
                  />
                </div>
                
                <div className="flex items-center space-x-3 pb-2">
                  <Switch
                    checked={formData.hasDriver}
                    onCheckedChange={handleSwitchChange}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <Label className="text-sm font-medium text-gray-700 cursor-pointer">
                    Driver Assigned | चालक तोकिएको
                  </Label>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 font-medium border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 min-w-[140px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Shipment</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
