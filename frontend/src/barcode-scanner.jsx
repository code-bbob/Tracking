import { useEffect, useRef, useState } from "react"
import { X, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const [manualCode, setManualCode] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
      }
    } catch (err) {
      setError("Camera access denied. Please use manual entry.")
      console.error("Camera error:", err)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach((track) => track.stop())
    }
  }

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim())
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleManualSubmit()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Scan Bill Code</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scanner Content */}
        <div className="p-4 space-y-4">
          {/* Camera View */}
          <div className="relative">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
              {isScanning && !error ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{error || "Camera not available"}</p>
                  </div>
                </div>
              )}
            </div>
            {isScanning && (
              <p className="text-xs text-gray-500 text-center mt-2">Position the barcode within the frame</p>
            )}
          </div>

          {/* Manual Entry */}
          <div className="space-y-2">
            <Label htmlFor="manual-code">Or enter code manually:</Label>
            <div className="flex space-x-2">
              <Input
                id="manual-code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter bill code"
                className="flex-1"
              />
              <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>
                Use Code
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Point camera at barcode to scan automatically</p>
            <p>• Or type the code manually above</p>
            <p>• Make sure the barcode is clear and well-lit</p>
          </div>
        </div>
      </div>
    </div>
  )
}

