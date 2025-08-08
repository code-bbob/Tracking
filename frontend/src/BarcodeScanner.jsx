import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

function BarcodeScanner({ onScan, onClose }) {
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);

  useEffect(() => {
    // Check if device is laptop/desktop (not mobile/tablet)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Auto-focus only on non-mobile devices without touch capability (laptops/desktops)
    setShouldAutoFocus(!isMobile && !hasTouch);

    // initialize html5-qrcode scanner with back camera and permission prompt
    const config = {
      fps: 10,
      qrbox: { width: 300, height: 300 },
      formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128],
      videoConstraints: { facingMode: { exact: 'environment' } }
    };
    const scanner = new Html5QrcodeScanner('html5qr-reader', config, false);
    scanner.render(
      text => { onScan(text); scanner.clear(); },
      _ => { /* scan error, ignore */ }
    );
    return () => { scanner.clear(); };
  }, []);

  const handleManualSubmit = e => {
    e.preventDefault();
    const val = manualInput.trim();
    if (val) {
      onScan(val);
      setManualInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Scan Barcode</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {error && <div className="mb-4 p-2 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}
        <div className="flex flex-col items-center mb-4">
          <p className="text-center text-sm text-gray-600 mb-2">Align the barcode within the frame</p>
          <div id="html5qr-reader" className="w-72 h-72 rounded-lg border-4 border-dashed border-blue-400 overflow-hidden" />
        </div>

        <div className="border-t pt-4">
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-2">
            <input
              id="barcode-manual-input"
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="Enter barcode manually"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              autoFocus={shouldAutoFocus}
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition self-end"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BarcodeScanner;
