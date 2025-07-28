import React from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

const ScanNotification = ({ type, message, onClose }) => {
  if (!type || !message) return null

  const isSuccess = type === 'success'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className={`max-w-md w-full mx-4 rounded-2xl shadow-2xl border-4 transform transition-all duration-300 scale-100 ${
        isSuccess 
          ? 'bg-green-50 border-green-300' 
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="p-8 text-center">
          {/* Large Icon */}
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            isSuccess ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isSuccess ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>

          {/* Title */}
          <h3 className={`text-2xl font-bold mb-3 ${
            isSuccess ? 'text-green-800' : 'text-red-800'
          }`}>
            {isSuccess ? 'Scan Successful!' : 'Scan Failed!'}
          </h3>

          {/* Message */}
          <p className={`text-lg mb-6 leading-relaxed ${
            isSuccess ? 'text-green-700' : 'text-red-700'
          }`}>
            {message}
          </p>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              isSuccess 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSuccess ? 'Continue' : 'Try Again'}
          </button>
        </div>

        {/* Quick Close X */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isSuccess 
              ? 'text-green-600 hover:bg-green-100' 
              : 'text-red-600 hover:bg-red-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default ScanNotification