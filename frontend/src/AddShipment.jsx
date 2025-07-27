"use client"
import { useState, useEffect } from "react"
import { Plus, Scan, MapPin, Truck, Package, Clock, AlertCircle, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Navbar from "./components/Navbar"
import { useNavigate } from "react-router-dom"
import BarcodeScanner from "./BarcodeScanner"
import useAxios from "./utils/useAxios"

export default function AddShipment() {
  const api = useAxios()
  const [form, setForm] = useState({
    code: "",
    vehicleNumber: "",
    amount: "",
    issueLocation: "",
    material: "",
    destination: "",
    vehicleSize: "",
    region: "",
    etaHours: "",
  })
  const [showScanner, setShowScanner] = useState(false)
  const [status, setStatus] = useState({ type: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const navigate = useNavigate()

  const materialTypes = [
    { en: "Roda", np: "रोडा", value: "roda" },
    { en: "Baluwa", np: "बालुवा", value: "baluwa" },
    { en: "Dhunga", np: "ढुङ्गा", value: "dhunga" },
    { en: "Gravel", np: "गिट्टी", value: "gravel" },
    { en: "Chips", np: "चिप्स", value: "chips" },
    { en: "Dust", np: "धुलो", value: "dust" },
    { en: "Mato", np: "माटो", value: "mato" },
    { en: "Base/Subbase", np: "बेस/सबबेस", value: "base/subbase" },
    { en: "Itta", np: "इट्टा", value: "itta" },
    { en: "Kawadi", np: "कवाडी", value: "kawadi" },
    { en: "Other", np: "अन्य", value: "other" },
  ]

  const vehicleSizes = [
    { en: "260 cubic feet", np: "२६० घन फिट", value: "260 cubic feet" },
    { en: "160 cubic feet", np: "१६० घन फिट", value: "160 cubic feet" },
    { en: "100 cubic feet", np: "१०० घन फिट", value: "100 cubic feet" },
    { en: "Other", np: "अन्य", value: "other" },
  ]

  const regions = [
    { en: "Local", np: "स्थानीय", value: "local" },
    { en: "Crossborder", np: "सीमा पार", value: "crossborder" },
  ]

  const updateField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }))
  }

  const validateField = (name, value) => {
    switch (name) {
      case "code":
        return !value.trim() ? "Bill code is required" : ""
      case "vehicleNumber":
        return !value.trim() ? "Vehicle number is required" : 
               !/^[A-Z]{2}\s*\d+\s*[A-Z]{2,3}\s*\d+$/i.test(value.replace(/\s/g, '')) ? 
               "Invalid vehicle number format (e.g., BA 1 KHA 1234)" : ""
      case "amount":
        return !value || parseFloat(value) <= 0 ? "Amount must be greater than 0" : ""
      case "material":
        return !value ? "Material selection is required" : ""
      case "issueLocation":
        return !value.trim() ? "Issue location is required" : ""
      case "destination":
        return !value.trim() ? "Destination is required" : ""
      case "vehicleSize":
        return !value ? "Vehicle size is required" : ""
      case "region":
        return !value ? "Region selection is required" : ""
      case "etaHours":
        return value && (parseFloat(value) < 0 || parseFloat(value) > 168) ? 
               "ETA must be between 0-168 hours" : ""
      default:
        return ""
    }
  }

  const validateForm = () => {
    const newErrors = {}
    Object.keys(form).forEach(key => {
      const error = validateField(key, form[key])
      if (error) newErrors[key] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, form[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const calculateETA = (h) => (h ? new Date(Date.now() + h * 3600000).toISOString() : "")

  const formatVehicleNumber = (value) => {
    // Auto-format vehicle number as user types
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '')
    if (cleaned.length <= 2) return cleaned.toUpperCase()
    if (cleaned.length <= 3) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`.toUpperCase()
    if (cleaned.length <= 6) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3, 6)}`.toUpperCase()
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`.toUpperCase()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setStatus({
        type: "error",
        message: "Please fix all errors before submitting"
      })
      return
    }

    setLoading(true)
    setStatus({ type: "", message: "" })
    
    try {
      const payload = {
        code: form.code.trim(),
        vehicle_number: form.vehicleNumber.trim(),
        amount: Number.parseFloat(form.amount) || 0,
        issue_location: form.issueLocation.trim(),
        material: form.material,
        destination: form.destination.trim(),
        vehicle_size: form.vehicleSize,
        region: form.region,
        eta: calculateETA(Number.parseFloat(form.etaHours) || 0),
        status: "pending",
      }
      
      await api.post(`/bills/bills/`, payload)
      
      setStatus({
        type: "success",
        message: `Shipment ${form.code} created successfully!`,
      })
      
      // Reset form
      setForm({
        code: "",
        vehicleNumber: "",
        amount: "",
        issueLocation: "",
        material: "",
        destination: "",
        vehicleSize: "",
        region: "",
        etaHours: "",
      })
      setErrors({})
      setTouched({})
      
      // Redirect after short delay to show success message
      setTimeout(() => navigate("/"), 2000)
      
    } catch (err) {
      console.error('Submission error:', err)
      const msg =
        err.response?.data?.non_field_errors?.[0] ||
        Object.values(err.response?.data || {})[0]?.[0] ||
        err.message ||
        "Error creating shipment"
      setStatus({ type: "error", message: msg })
    } finally {
      setLoading(false)
    }
  }

  const getFieldError = (name) => touched[name] && errors[name]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Add Shipment" subtitle="Create a new shipment entry" showBackButton />

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Status Messages */}
        {status.message && (
          <Alert className={status.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center gap-2">
              {status.type === "success" ? 
                <CheckCircle className="h-4 w-4 text-green-600" /> : 
                <AlertCircle className="h-4 w-4 text-red-600" />
              }
              <AlertDescription className={status.type === "success" ? "text-green-700" : "text-red-700"}>
                {status.message}
              </AlertDescription>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatus({ type: "", message: "" })}
                className="ml-auto h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        )}

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="h-5 w-5 text-blue-600" />
              Shipment Information | ढुवानी जानकारी
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    Basic Information | आधारभूत जानकारी
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      Bill Code | बिल कोड 
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          value={form.code}
                          onChange={(e) => updateField("code", e.target.value)}
                          onBlur={() => handleBlur("code")}
                          placeholder="Enter or scan bill code"
                          className={getFieldError("code") ? "border-red-300 focus:border-red-500" : ""}
                        />
                        {getFieldError("code") && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.code}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowScanner(true)}
                        className="shrink-0 hover:bg-blue-50"
                        title="Scan barcode"
                      >
                        <Scan className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      Vehicle Number | गाडी नम्बर 
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.vehicleNumber}
                      onChange={(e) => updateField("vehicleNumber", formatVehicleNumber(e.target.value))}
                      onBlur={() => handleBlur("vehicleNumber")}
                      placeholder="BA 1 KHA 1234"
                      className={getFieldError("vehicleNumber") ? "border-red-300 focus:border-red-500" : ""}
                      maxLength={15}
                    />
                    {getFieldError("vehicleNumber") && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.vehicleNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipment Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <Package className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    Shipment Details | ढुवानी विवरण
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      Material | सामग्री 
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={form.material} 
                      onValueChange={(v) => updateField("material", v)}
                    >
                      <SelectTrigger className={getFieldError("material") ? "border-red-300 focus:border-red-500" : ""}>
                        <SelectValue placeholder="Select material type" />
                      </SelectTrigger>
                      <SelectContent>
                        {materialTypes.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{m.en}</span>
                              <span className="text-gray-500 text-xs ml-2">{m.np}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {getFieldError("material") && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.material}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      Amount (NPR) | रकम (रु.) 
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => updateField("amount", e.target.value)}
                      onBlur={() => handleBlur("amount")}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={getFieldError("amount") ? "border-red-300 focus:border-red-500" : ""}
                    />
                    {getFieldError("amount") && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      Vehicle Size | गाडी साइज 
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={form.vehicleSize} 
                      onValueChange={(v) => updateField("vehicleSize", v)}
                    >
                      <SelectTrigger className={getFieldError("vehicleSize") ? "border-red-300 focus:border-red-500" : ""}>
                        <SelectValue placeholder="Select vehicle size" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleSizes.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{s.en}</span>
                              <span className="text-gray-500 text-xs ml-2">{s.np}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {getFieldError("vehicleSize") && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.vehicleSize}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      Region | क्षेत्र 
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={form.region} 
                      onValueChange={(v) => updateField("region", v)}
                    >
                      <SelectTrigger className={getFieldError("region") ? "border-red-300 focus:border-red-500" : ""}>
                        <SelectValue placeholder="Select region type" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{r.en}</span>
                              <span className="text-gray-500 text-xs ml-2">{r.np}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {getFieldError("region") && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.region}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location & Timing Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    Location & Timing | स्थान र समय
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      Issue Location | जारी स्थान 
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.issueLocation}
                      onChange={(e) => updateField("issueLocation", e.target.value)}
                      onBlur={() => handleBlur("issueLocation")}
                      placeholder="Pickup location"
                      className={getFieldError("issueLocation") ? "border-red-300 focus:border-red-500" : ""}
                    />
                    {getFieldError("issueLocation") && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.issueLocation}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      Destination | गन्तव्य 
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.destination}
                      onChange={(e) => updateField("destination", e.target.value)}
                      onBlur={() => handleBlur("destination")}
                      placeholder="Delivery destination"
                      className={getFieldError("destination") ? "border-red-300 focus:border-red-500" : ""}
                    />
                    {getFieldError("destination") && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.destination}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ETA Hours | अपेक्षित समय (घण्टा)
                    </Label>
                    <Input
                      type="number"
                      value={form.etaHours}
                      onChange={(e) => updateField("etaHours", e.target.value)}
                      onBlur={() => handleBlur("etaHours")}
                      placeholder="24"
                      min="0"
                      max="168"
                      step="0.5"
                      className={getFieldError("etaHours") ? "border-red-300 focus:border-red-500" : ""}
                    />
                    {getFieldError("etaHours") && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.etaHours}
                      </p>
                    )}
                    {form.etaHours && !getFieldError("etaHours") && (
                      <p className="text-xs text-green-600 mt-1">
                        Expected arrival: {new Date(Date.now() + parseFloat(form.etaHours) * 3600000).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Summary */}
              {Object.values(form).some(value => value.trim() !== "") && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Shipment Preview</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {form.code && <div><span className="text-blue-700">Code:</span> {form.code}</div>}
                    {form.vehicleNumber && <div><span className="text-blue-700">Vehicle:</span> {form.vehicleNumber}</div>}
                    {form.material && <div><span className="text-blue-700">Material:</span> {materialTypes.find(m => m.value === form.material)?.en}</div>}
                    {form.amount && <div><span className="text-blue-700">Amount:</span> NPR {parseFloat(form.amount).toLocaleString()}</div>}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel | रद्द गर्नुहोस्
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || Object.keys(errors).some(key => errors[key])} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Shipment
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {showScanner && (
          <BarcodeScanner 
            onScan={(code) => {
              updateField("code", code)
              setShowScanner(false)
            }} 
            onClose={() => setShowScanner(false)} 
          />
        )}
      </div>
    </div>
  )
}
