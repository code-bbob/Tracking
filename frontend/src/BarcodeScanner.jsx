import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

function BarcodeScanner({ onScan, onClose }) {
  const [isScanning, setIsScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [permissionState, setPermissionState] = useState('unknown');
  const [cameraDevices, setCameraDevices] = useState([]);
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const scanTimeout = useRef(null);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      return mobileRegex.test(userAgent.toLowerCase()) || 
             ('ontouchstart' in window) || 
             (navigator.maxTouchPoints > 0);
    };
    
    setIsMobile(checkMobile());
  }, []);

  // Check available cameras and permissions
  useEffect(() => {
    if (isMobile) {
      checkCameraAvailability();
    }
  }, [isMobile]);

  const checkCameraAvailability = async () => {
    try {
      // First check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported in this browser.');
        return;
      }

      // Try to enumerate devices first (this might prompt for permission)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(videoDevices);

      if (videoDevices.length === 0) {
        setError('No camera found on this device.');
        return;
      }

      // Check permission status if API is available
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' });
          setPermissionState(permissionStatus.state);
          
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state);
          };
        } catch (err) {
          // Permissions API might not support camera query
          console.log('Permissions API not fully supported');
        }
      }

    } catch (err) {
      console.error('Error checking camera availability:', err);
      setError('Unable to check camera availability. Please ensure you\'re using a modern browser.');
    }
  };

  // Initialize barcode reader
  useEffect(() => {
    if (isMobile) {
      codeReader.current = new BrowserMultiFormatReader();
    }
    
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }
    };
  }, [isMobile]);

  // Start camera scanning for mobile
  const startCameraScanning = async () => {
    setIsScanning(true);
    setError('');
    
    try {
      // Try with basic constraints first
      let constraints = {
        video: {
          facingMode: 'environment',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        }
      };

      let stream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstError) {
        console.warn('Failed with environment camera, trying any camera:', firstError);
        // Fallback to any available camera
        constraints = {
          video: {
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 }
          }
        };
        
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (secondError) {
          console.warn('Failed with fallback constraints, trying basic:', secondError);
          // Last resort - basic video only
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      setPermissionState('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(playError => {
            console.error('Error playing video:', playError);
            setError('Unable to start camera preview.');
          });
        };
      }

      // Start scanning after a short delay to ensure video is ready
      setTimeout(() => {
        if (codeReader.current && videoRef.current) {
          codeReader.current.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
            if (result) {
              const scannedText = result.getText();
              onScan(scannedText);
              stopScanning();
            }
            if (err && !(err instanceof Error && err.name === 'NotFoundException')) {
              console.error('Scanning error:', err);
            }
          });
        }
      }, 1000);

      // Auto-stop after 30 seconds
      scanTimeout.current = setTimeout(() => {
        setError('Scanning timeout. Please try again.');
        stopScanning();
      }, 30000);

    } catch (err) {
      console.error('Camera access error:', err);
      setPermissionState('denied');
      setIsScanning(false);
      
      let errorMessage = 'Camera access failed. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access when prompted by your browser.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera is not supported in this browser.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints could not be satisfied.';
      } else {
        errorMessage += `Error: ${err.message}`;
      }
      
      setError(errorMessage);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (codeReader.current) {
      codeReader.current.reset();
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (scanTimeout.current) {
      clearTimeout(scanTimeout.current);
    }
  };

  // Handle manual input for desktop barcode readers
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  // Handle keyboard input for barcode readers (they typically input very fast)
  const handleKeyInput = (e) => {
    if (e.key === 'Enter' && manualInput.trim()) {
      handleManualSubmit(e);
    }
  };

  // Request permission manually with better handling
  const requestCameraPermission = async () => {
    setError('');
    try {
      // Try to get permission with minimal constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      setPermissionState('granted');
      
      // Stop the stream immediately, we just wanted permission
      stream.getTracks().forEach(track => track.stop());
      
      setError('✅ Camera permission granted! You can now start scanning.');
      
      // Re-check camera availability
      setTimeout(() => {
        checkCameraAvailability();
      }, 500);
      
    } catch (err) {
      setPermissionState('denied');
      console.error('Permission request failed:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('❌ Camera permission denied. Please click the camera icon in your browser\'s address bar and allow access.');
      } else {
        setError(`❌ Camera permission failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isMobile ? 'Scan Barcode' : 'Barcode Reader'}
          </h2>
          <button 
            className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {error && (
          <div className={`mb-4 p-3 border rounded-md text-sm ${
            error.includes('✅') 
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {error}
            {error.includes('permission') && error.includes('❌') && (
              <div className="mt-2 text-xs text-gray-600">
                <strong>Troubleshooting:</strong>
                <br />• Refresh the page and try again
                <br />• Check if another app is using your camera
                <br />• Try a different browser (Chrome/Firefox work best)
                <br />• Make sure you're on localhost or HTTPS
              </div>
            )}
          </div>
        )}

        {isMobile ? (
          // Mobile Camera Scanning
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-3">
              {cameraDevices.length > 0 
                ? `Found ${cameraDevices.length} camera(s). Position the barcode within the camera view to scan.`
                : 'Checking camera availability...'
              }
            </div>
            
            {/* Permission status and request */}
            {(permissionState === 'denied' || permissionState === 'unknown') && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-yellow-800 text-sm font-medium mb-2">
                  {permissionState === 'denied' ? 'Camera Permission Denied' : 'Camera Permission Required'}
                </div>
                <button
                  onClick={requestCameraPermission}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 text-sm"
                >
                  {permissionState === 'denied' ? 'Request Permission Again' : 'Request Camera Permission'}
                </button>
              </div>
            )}
            
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
              
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="mb-4 text-4xl">📷</div>
                    <div className="text-sm">
                      {permissionState === 'granted' ? 'Ready to scan' : 'Camera access needed'}
                    </div>
                  </div>
                </div>
              )}
              
              {isScanning && (
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-48 h-32 border-2 border-red-500 bg-transparent rounded"></div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-75 px-3 py-1 rounded">
                    📱 Scanning for barcode...
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              {!isScanning ? (
                <button
                  onClick={startCameraScanning}
                  disabled={permissionState === 'denied' && !error.includes('✅')}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Scanning
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Stop Scanning
                </button>
              )}
            </div>
            
            {/* Manual input fallback */}
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 mb-2">Camera not working? Enter manually:</div>
              <form onSubmit={handleManualSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter barcode manually"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        ) : (
          // Desktop Barcode Reader Input
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Use your barcode reader to scan, or enter the code manually. Barcode readers will input automatically.
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-2 text-blue-800 text-sm">
                <span>🔍</span>
                <span>Ready for barcode reader input...</span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={handleKeyInput}
                placeholder="Scan with barcode reader or type manually"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use This Code
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default BarcodeScanner;
