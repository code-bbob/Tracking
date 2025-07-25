import { useState } from "react"
import { ArrowLeft, Truck, Package, User, MapPin, Clock, DollarSign, Scan, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
    remark: "",
    driverName: "",
    driverPhone: "",
    showDriverDetails: false,
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
      showDriverDetails: checked,
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
        remark: formData.remark,
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
        remark: formData.remark,
        driverName: formData.driverName || "Driver TBD",
        driverPhone: formData.driverPhone,
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
          remark: "",
          driverName: "",
          driverPhone: "",
          showDriverDetails: false,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Add New Shipment | नयाँ ढुवानी थप्नुहोस्
                </h1>
                <p className="text-sm text-gray-500">Fill in the shipment details below</p>
              </div>
            </div>
            
            {/* Status indicator */}
            {submitStatus.message && (
              <div className={`px-3 py-1 rounded-md text-sm font-medium ${
                submitStatus.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {submitStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Bill Information Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-blue-600" />
                Bill Information | बिल जानकारी
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Bill Code | बिल कोड
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Auto-generated if empty"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScanner(true)}
                      className="px-3"
                    >
                      <Scan className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="issueLocation" className="text-sm font-medium">
                    Issue Location | जारी स्थान *
                  </Label>
                  <Input
                    id="issueLocation"
                    name="issueLocation"
                    value={formData.issueLocation}
                    onChange={handleInputChange}
                    placeholder="Enter issue location"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-green-600" />
                Vehicle Information | गाडी जानकारी
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber" className="text-sm font-medium">
                    Vehicle Number | गाडी नम्बर *
                  </Label>
                  <Input
                    id="vehicleNumber"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., BA 1 KHA 1234"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicleSize" className="text-sm font-medium">
                    Vehicle Size | गाडी साइज *
                  </Label>
                  <Select value={formData.vehicleSize} onValueChange={(value) => handleSelectChange('vehicleSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle size" />
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
              </div>
            </CardContent>
          </Card>

          {/* Material & Destination Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
                Material & Destination | सामग्री र गन्तव्य
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material" className="text-sm font-medium">
                    Material Type | सामग्री प्रकार *
                  </Label>
                  <Select value={formData.material} onValueChange={(value) => handleSelectChange('material', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material type" />
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
                  <Label htmlFor="region" className="text-sm font-medium">
                    Region | क्षेत्र *
                  </Label>
                  <Select value={formData.region} onValueChange={(value) => handleSelectChange('region', value)}>
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
              
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-sm font-medium">
                  Destination | गन्तव्य *
                </Label>
                <Input
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="Enter destination location"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial & Time Information Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                Financial & Time Information | आर्थिक र समय जानकारी
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">
                    Amount (NPR) | रकम *
                  </Label>
                  <Input
                    id="amount"
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
                
                <div className="space-y-2">
                  <Label htmlFor="etaHours" className="text-sm font-medium">
                    ETA (Hours) | अपेक्षित समय (घण्टा)
                  </Label>
                  <Input
                    id="etaHours"
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
            </CardContent>
          </Card>

          {/* Driver Information Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-indigo-600" />
                Driver Information | चालक जानकारी
                <div className="ml-auto flex items-center space-x-2">
                  <Switch
                    checked={formData.showDriverDetails}
                    onCheckedChange={handleSwitchChange}
                  />
                  <span className="text-sm text-gray-500">Optional</span>
                </div>
              </CardTitle>
            </CardHeader>
            {formData.showDriverDetails && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="driverName" className="text-sm font-medium">
                      Driver Name | चालक नाम
                    </Label>
                    <Input
                      id="driverName"
                      name="driverName"
                      value={formData.driverName}
                      onChange={handleInputChange}
                      placeholder="Enter driver name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="driverPhone" className="text-sm font-medium">
                      Driver Phone | चालक फोन
                    </Label>
                    <Input
                      id="driverPhone"
                      name="driverPhone"
                      type="tel"
                      value={formData.driverPhone}
                      onChange={handleInputChange}
                      placeholder="98xxxxxxxx"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Remarks Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                Additional Information | अतिरिक्त जानकारी
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="remark" className="text-sm font-medium">
                  Remarks | टिप्पणी
                </Label>
                <Textarea
                  id="remark"
                  name="remark"
                  value={formData.remark}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes or remarks..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
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
