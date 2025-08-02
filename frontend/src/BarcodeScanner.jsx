import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

function BarcodeScanner({ onScan, onClose }) {
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // initialize html5-qrcode scanner
    const scanner = new Html5QrcodeScanner(
      'html5qr-reader',
      { fps: 10, qrbox: { width: 300, height: 300 }, formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128] },
      false
    );
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
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Scan Barcode</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>

        {error && <div className="mb-4 p-2 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}
        <div id="html5qr-reader" className="w-full h-64 mb-4" />

        <div className="border-t pt-4">
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <input
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="Enter barcode manually"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button type="submit" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BarcodeScanner;
