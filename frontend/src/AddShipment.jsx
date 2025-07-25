"use client"
import { useState } from "react"
import { Plus, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "./components/Navbar"
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
    { en: "260 cubic feet", np: "२६० घन फिट", value: "260" },
    { en: "160 cubic feet", np: "१६० घन फिट", value: "160" },
    { en: "100 cubic feet", np: "१०० घन फिट", value: "100" },
    { en: "Other", np: "अन्य", value: "other" },
  ]

  const regions = [
    { en: "Local", np: "स्थानीय", value: "local" },
    { en: "Crossborder", np: "सीमा पार", value: "crossborder" },
  ]

  const updateField = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  const calculateETA = (h) => (h ? new Date(Date.now() + h * 3600000).toISOString() : "")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: "", message: "" })
    try {
      const payload = {
        code: form.code,
        vehicle_number: form.vehicleNumber,
        amount: Number.parseFloat(form.amount) || 0,
        issue_location: form.issueLocation,
        material: form.material,
        destination: form.destination,
        vehicle_size: form.vehicleSize,
        region: form.region,
        eta: calculateETA(Number.parseFloat(form.etaHours) || 0),
        remark: "Driver TBD",
        status: "pending",
      }
      await api.post(`/bills/bills/`, payload)
      setStatus({
        type: "success",
        message: `Shipment ${form.code} created successfully!`,
      })
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
    } catch (err) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Add Shipment" subtitle="Create a new shipment" showBackButton />

      <div className="max-w-3xl mx-auto p-4">
        {status.message && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              status.type === "success"
                ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                : "bg-red-50 border-red-400 text-red-700"
            }`}
          >
            {status.message}
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Basic Information | आधारभूत जानकारी
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Bill Code | बिल कोड <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.code}
                        onChange={(e) => updateField("code", e.target.value)}
                        placeholder="Enter bill code | बिल कोड प्रविष्ट गर्नुहोस्"
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowScanner(true)}
                        className="shrink-0"
                      >
                        <Scan className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Vehicle Number | गाडी नम्बर <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.vehicleNumber}
                      onChange={(e) => updateField("vehicleNumber", e.target.value)}
                      placeholder="BA 1 KHA 1234"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipment Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Shipment Details | ढुवानी विवरण
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Material | सामग्री <span className="text-red-500">*</span>
                    </Label>
                    <Select value={form.material} onValueChange={(v) => updateField("material", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material | सामग्री छान्नुहोस्" />
                      </SelectTrigger>
                      <SelectContent>
                        {materialTypes.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.en} | {m.np}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Amount (NPR) | रकम (रु.) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => updateField("amount", e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Vehicle Size | गाडी साइज <span className="text-red-500">*</span>
                    </Label>
                    <Select value={form.vehicleSize} onValueChange={(v) => updateField("vehicleSize", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size | साइज छान्नुहोस्" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleSizes.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.en} | {s.np}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Region | क्षेत्र <span className="text-red-500">*</span>
                    </Label>
                    <Select value={form.region} onValueChange={(v) => updateField("region", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region | क्षेत्र छान्नुहोस्" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.en} | {r.np}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Location & Timing */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Location & Timing | स्थान र समय
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Issue Location | जारी स्थान <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.issueLocation}
                      onChange={(e) => updateField("issueLocation", e.target.value)}
                      placeholder="Pickup location | उठाउने स्थान"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Destination | गन्तव्य <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.destination}
                      onChange={(e) => updateField("destination", e.target.value)}
                      placeholder="Delivery destination | पुर्याउने स्थान"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">ETA Hours | अपेक्षित समय (घण्टा)</Label>
                    <Input
                      type="number"
                      value={form.etaHours}
                      onChange={(e) => updateField("etaHours", e.target.value)}
                      placeholder="24"
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => history.back()}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel | रद्द गर्नुहोस्
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating... | सिर्जना गर्दै...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add  | सिर्जना गर्नुहोस्
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {showScanner && (
          <BarcodeScanner onScan={(code) => updateField("code", code)} onClose={() => setShowScanner(false)} />
        )}
      </div>
    </div>
  )
}
