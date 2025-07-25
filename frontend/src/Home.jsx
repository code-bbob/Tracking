import { useState, useEffect } from 'react';
import BarcodeScanner from './BarcodeScanner';

// API configuration
const API_BASE_URL = 'http://localhost:8000';

function Home() {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [userShipments, setUserShipments] = useState([]);
  const [completedUserShipments, setCompletedUserShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Material type mapping for display
  const materialTypeMap = {
    'roda': { en: 'Roda', np: 'रोडा' },
    'baluwa': { en: 'Baluwa', np: 'बालुवा' },
    'dhunga': { en: 'Dhunga', np: 'ढुङ्गा' },
    'gravel': { en: 'Gravel', np: 'गिट्टी' },
    'chips': { en: 'Chips', np: 'चिप्स' },
    'dust': { en: 'Dust', np: 'धुलो' },
    'mato': { en: 'Mato', np: 'माटो' },
    'base/subbase': { en: 'Base/Subbase', np: 'बेस/सबबेस' },
    'Itta': { en: 'Itta', np: 'इट्टा' },
    'Kawadi': { en: 'Kawadi', np: 'कवाडी' },
    'other': { en: 'Other', np: 'अन्य' }
  };

  const regionMap = {
    'local': { en: 'Local', np: 'स्थानीय' },
    'Crossborder': { en: 'Crossborder', np: 'सीमा पार' }
  };

  const vehicleSizeMap = {
    '260 cubic feet': { en: '260 cubic feet', np: '२६० घन फिट' },
    '160 cubic feet': { en: '160 cubic feet', np: '१६० घन फिट' },
    '100 cubic feet': { en: '100 cubic feet', np: '१०० घन फिट' },
    'Other': { en: 'Other', np: 'अन्य' }
  };

  // Helper function to get bilingual display text
  const getBilingualText = (value, mapping) => {
    const item = mapping[value];
    return item ? `${item.en} | ${item.np}` : value;
  };

  // Fetch bills from Django backend
  const fetchBills = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/bills/bills/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const bills = await response.json();
      console.log('Fetched bills from API:', bills);

      // Convert API bills to frontend format
      const convertedBills = bills.map(bill => ({
        id: bill.id,
        code: bill.code,
        vehicleNumber: bill.vehicle_number,
        amount: bill.amount,
        issueLocation: bill.issue_location,
        material: bill.material,
        destination: bill.destination,
        vehicleSize: bill.vehicle_size,
        region: bill.region,
        eta: bill.eta,
        remark: bill.remark,
        dateIssued: bill.date_issued,
        status: bill.status,
        driverName: 'Driver TBD', // Default value since driver info is frontend-only
        driverPhone: '',
        // Legacy fields for compatibility
        truckNumber: bill.vehicle_number,
        billNumber: bill.code,
        cargo: bill.material,
        expectedTime: bill.eta,
        billIssueTime: new Date(bill.date_issued).toLocaleString('en-US'),
        progress: bill.status === 'completed' ? 100 : 5
      }));

      // Separate active and completed bills
      const activeBills = convertedBills.filter(bill => bill.status === 'pending');
      const completedBills = convertedBills.filter(bill => bill.status === 'completed');

      setUserShipments(activeBills);
      setCompletedUserShipments(completedBills);

      // Also update localStorage for backward compatibility
      localStorage.setItem('truckShipments', JSON.stringify(activeBills));
      localStorage.setItem('completedShipments', JSON.stringify(completedBills));

    } catch (error) {
      console.error('Error fetching bills:', error);
      // Fall back to localStorage if API fails
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('truckShipments');
    const savedCompleted = localStorage.getItem('completedShipments');
    if (saved) {
      setUserShipments(JSON.parse(saved));
    }
    if (savedCompleted) {
      setCompletedUserShipments(JSON.parse(savedCompleted));
    }
  };

  // Load shipments on component mount
  useEffect(() => {
    fetchBills();
    
    // Listen for storage changes (when new shipments are added)
    const handleStorageChange = () => {
      fetchBills(); // Refresh from API when storage changes
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes when the window regains focus
    window.addEventListener('focus', fetchBills);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', fetchBills);
    };
  }, []);

  // Update bill status via API
  const updateBillStatus = async (billId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bills/bills/${billId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating bill status:', error);
      throw error;
    }
  };

  // Default demo data (kept for demonstration)
  const defaultIssuedTrucks = [
    {
      id: 'demo1',
      truckNumber: 'TRK123',
      billNumber: 'BILL001',
      cargo: 'Electronics',
      driverName: 'John Doe',
      destination: 'New York',
      expectedTime: '2025-07-22 10:00 AM',
      billIssueTime: '2025-07-21 08:00 AM',
      status: 'In Transit',
      progress: 65
    },
    {
      id: 'demo2',
      truckNumber: 'TRK124',
      billNumber: 'BILL002',
      cargo: 'Furniture',
      driverName: 'Jane Smith',
      destination: 'Los Angeles',
      expectedTime: '2025-07-20 02:00 PM',
      billIssueTime: '2025-07-21 09:00 AM',
      status: 'Loading',
      progress: 15
    }
  ];

  const defaultCompletedTrucks = [
    {
      id: 'demo3',
      truckNumber: 'TRK125',
      billNumber: 'BILL003',
      cargo: 'Clothing',
      driverName: 'Mike Johnson',
      destination: 'Chicago',
      expectedTime: '2025-07-20 05:00 PM',
      billIssueTime: '2025-07-19 07:00 AM',
      status: 'Delivered',
      progress: 100,
      completedTime: '2025-07-20 04:45 PM'
    }
  ];

  // Combine API data with demo data
  const issuedTrucks = [...userShipments, ...defaultIssuedTrucks];
  const completedTrucks = [...completedUserShipments, ...defaultCompletedTrucks];

  const handleTruckClick = (truck) => {
    setSelectedTruck(truck);
  };

  const closeDetails = () => {
    setSelectedTruck(null);
  };

  const handleScan = async (scannedCode) => {
    // First check if the scanned code is in issued trucks (both API and demo)
    const foundInIssued = issuedTrucks.find(truck => 
      (truck.billNumber && truck.billNumber.toLowerCase() === scannedCode.toLowerCase()) ||
      (truck.code && truck.code.toLowerCase() === scannedCode.toLowerCase())
    );
    
    if (foundInIssued) {
      try {
        // If it's from API (has backend ID), update via API
        if (foundInIssued.id && !isNaN(foundInIssued.id)) {
          await updateBillStatus(foundInIssued.id, 'completed');
          // Refresh data from API
          await fetchBills();
          setShowScanner(false);
          alert(`✅ Shipment ${foundInIssued.code || foundInIssued.billNumber} marked as completed!`);
        } else {
          // It's demo data - handle locally
          const completedShipment = {
            ...foundInIssued,
            status: 'completed',
            progress: 100,
            completedTime: new Date().toLocaleString('en-US')
          };
          setShowScanner(false);
          setSelectedTruck(completedShipment);
        }
      } catch (error) {
        console.error('Error updating shipment status:', error);
        alert('Failed to update shipment status. Please try again.');
        setShowScanner(false);
      }
    } else {
      // Check if it's already in completed
      const foundInCompleted = completedTrucks.find(truck => 
        (truck.billNumber && truck.billNumber.toLowerCase() === scannedCode.toLowerCase()) ||
        (truck.code && truck.code.toLowerCase() === scannedCode.toLowerCase())
      );
      
      if (foundInCompleted) {
        setSelectedTruck(foundInCompleted);
        setShowScanner(false);
        alert(`ℹ️ Shipment ${foundInCompleted.billNumber || foundInCompleted.code} is already completed.`);
      } else {
        alert(`❌ No shipment found with bill number: ${scannedCode}`);
        setShowScanner(false);
      }
    }
  };

  const generateBarcode = (billNumber) => {
    return `||||| || ||| | |||| ||| |||| | ||| ||||`;
  };

  const isOverdue = (expectedTime) => {
    const now = new Date('2025-07-21T12:00:00'); // Current time
    const expected = new Date(expectedTime);
    return now > expected;
  };

  const getStatusStyles = (status, isOverdueShipment = false) => {
    if (isOverdueShipment) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    switch (status.toLowerCase().replace(' ', '-')) {
      case 'pending':
      case 'in-transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'loading':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'departed':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Mobile Card Component for responsive design
  const TruckCard = ({ truck, isCompleted = false }) => {
    const overdueShipment = !isCompleted && isOverdue(truck.expectedTime || truck.eta);
    const displayMaterial = truck.material ? getBilingualText(truck.material, materialTypeMap) : truck.cargo;
    const billNumber = truck.code || truck.billNumber;
    const vehicleNumber = truck.vehicleNumber || truck.truckNumber;
    
    return (
      <div 
        className={`border rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${
          overdueShipment 
            ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 shadow-red-100' 
            : 'bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white'
        }`}
        onClick={() => handleTruckClick(truck)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-sm">{vehicleNumber}</h3>
              {overdueShipment && <span className="text-red-500 text-xs">⚠️ OVERDUE</span>}
            </div>
            <p className="text-xs text-gray-600 font-mono">{billNumber}</p>
            {truck.vehicleSize && (
              <p className="text-xs text-gray-500">{getBilingualText(truck.vehicleSize, vehicleSizeMap)}</p>
            )}
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusStyles(truck.status, overdueShipment)}`}>
            {truck.status}
          </span>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-gray-500">Material:</span> {displayMaterial}</div>
            <div><span className="text-gray-500">Driver:</span> {truck.driverName}</div>
          </div>
          <div><span className="text-gray-500">To:</span> {truck.destination}</div>
          {truck.region && (
            <div><span className="text-gray-500">Region:</span> {getBilingualText(truck.region, regionMap)}</div>
          )}
          {truck.amount && (
            <div><span className="text-gray-500">Amount:</span> NPR {parseFloat(truck.amount).toLocaleString()}</div>
          )}
        </div>
        
        {!isCompleted ? (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{truck.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  overdueShipment ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{width: `${truck.progress}%`}}
              ></div>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-green-600 font-medium">
            ✓ {formatDateTime(truck.completedTime || truck.dateIssued).date} {formatDateTime(truck.completedTime || truck.dateIssued).time}
          </div>
        )}
      </div>
    );
  };

  // Desktop Table Row Component
  const TruckRow = ({ truck, isCompleted = false }) => {
    const overdueShipment = !isCompleted && isOverdue(truck.expectedTime || truck.eta);
    const displayMaterial = truck.material ? getBilingualText(truck.material, materialTypeMap) : truck.cargo;
    const billNumber = truck.code || truck.billNumber;
    const vehicleNumber = truck.vehicleNumber || truck.truckNumber;
    
    return (
      <tr 
        className={`cursor-pointer transition-colors ${
          overdueShipment 
            ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' 
            : 'hover:bg-gray-50'
        }`}
        onClick={() => handleTruckClick(truck)}
      >
        <td className="px-3 py-2 text-sm font-medium text-gray-900">
          <div className="flex items-center gap-2">
            <div>
              <div>{vehicleNumber}</div>
              {truck.vehicleSize && (
                <div className="text-xs text-gray-500">{getBilingualText(truck.vehicleSize, vehicleSizeMap)}</div>
              )}
            </div>
            {overdueShipment && <span className="text-red-500 text-xs">⚠️</span>}
          </div>
        </td>
        <td className="px-3 py-2 text-sm text-gray-600 font-mono">{billNumber}</td>
        <td className="px-3 py-2 text-sm text-gray-600">
          <div>{displayMaterial}</div>
          {truck.region && (
            <div className="text-xs text-gray-500">{getBilingualText(truck.region, regionMap)}</div>
          )}
        </td>
        <td className="px-3 py-2 text-sm text-gray-600">
          <div>{truck.destination}</div>
          {truck.amount && (
            <div className="text-xs text-gray-500">NPR {parseFloat(truck.amount).toLocaleString()}</div>
          )}
        </td>
        <td className="px-3 py-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusStyles(truck.status, overdueShipment)}`}>
            {truck.status}
          </span>
        </td>
        <td className="px-3 py-2">
          {!isCompleted ? (
            <div className="flex items-center space-x-2">
              <div className="w-12 bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    overdueShipment ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{width: `${truck.progress}%`}}
                ></div>
              </div>
              <span className="text-xs text-gray-500 font-medium min-w-[30px] text-right">{truck.progress}%</span>
            </div>
          ) : (
            <div className="text-xs text-green-600 font-medium text-center">
              <div>{formatDateTime(truck.completedTime || truck.dateIssued).date}</div>
              <div className="text-gray-500">{formatDateTime(truck.completedTime || truck.dateIssued).time}</div>
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              Truck Dashboard | ट्रक ड्यासबोर्ड
            </h1>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowScanner(true)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <span>📱</span>
                Scan | स्क्यान
              </button>
              <a 
                href="/add-shipment" 
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all duration-200 text-center shadow-md hover:shadow-lg"
              >
                + Add | थप्नुहोस्
              </a>
              {/* Stats */}
              {!isLoading && (
                <div className="flex space-x-4 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-200">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-blue-600">{issuedTrucks.length}</div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                  <div className="w-px bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-green-600">{completedTrucks.length}</div>
                    <div className="text-xs text-gray-500">Done</div>
                  </div>
                </div>
              )}
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center text-gray-500 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200">
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs">Loading...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="px-2 py-4 sm:px-4 sm:py-6 space-y-6">
        {/* Active Shipments */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
          <div className="px-3 py-3 sm:px-4 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              🚛 Active Shipments | सक्रिय ढुवानी
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                {issuedTrucks.length}
              </span>
            </h2>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle | गाडी</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill | बिल</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material | सामग्री</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination | गन्तव्य</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status | स्थिति</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress | प्रगति</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issuedTrucks.map((truck) => (
                  <TruckRow key={truck.id} truck={truck} />
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="sm:hidden p-2 space-y-2">
            {issuedTrucks.map((truck) => (
              <TruckCard key={truck.id} truck={truck} />
            ))}
          </div>
        </div>

        {/* Completed Shipments */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
          <div className="px-3 py-3 sm:px-4 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              ✅ Completed Shipments | सम्पन्न ढुवानी
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                {completedTrucks.length}
              </span>
            </h2>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle | गाडी</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill | बिल</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material | सामग्री</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination | गन्तव्य</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status | स्थिति</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed | सम्पन्न</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {completedTrucks.map((truck) => (
                  <TruckRow key={truck.id} truck={truck} isCompleted={true} />
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="sm:hidden p-2 space-y-2">
            {completedTrucks.map((truck) => (
              <TruckCard key={truck.id} truck={truck} isCompleted={true} />
            ))}
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Enhanced Modal with all Bill fields */}
      {selectedTruck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2" onClick={closeDetails}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Shipment Details | ढुवानी विवरण
              </h2>
              <button 
                className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center"
                onClick={closeDetails}
              >
                ×
              </button>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="border-b pb-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">
                    Basic Information | आधारभूत जानकारी
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Vehicle | गाडी</label>
                      <div className="font-mono font-semibold">{selectedTruck.vehicleNumber || selectedTruck.truckNumber}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Bill Code | बिल कोड</label>
                      <div className="font-mono">{selectedTruck.code || selectedTruck.billNumber}</div>
                    </div>
                    {selectedTruck.issueLocation && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Issue Location | जारी स्थान</label>
                        <div>{selectedTruck.issueLocation}</div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Status | स्थिति</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusStyles(selectedTruck.status, !selectedTruck.completedTime && isOverdue(selectedTruck.expectedTime || selectedTruck.eta))}`}>
                        {selectedTruck.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Material & Vehicle Information */}
                <div className="border-b pb-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">
                    Material & Vehicle | सामग्री र गाडी
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Material | सामग्री</label>
                      <div>{selectedTruck.material ? getBilingualText(selectedTruck.material, materialTypeMap) : selectedTruck.cargo}</div>
                    </div>
                    {selectedTruck.vehicleSize && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Vehicle Size | गाडी साइज</label>
                        <div>{getBilingualText(selectedTruck.vehicleSize, vehicleSizeMap)}</div>
                      </div>
                    )}
                    {selectedTruck.region && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Region | क्षेत्र</label>
                        <div>{getBilingualText(selectedTruck.region, regionMap)}</div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Destination | गन्तव्य</label>
                      <div>{selectedTruck.destination}</div>
                    </div>
                  </div>
                </div>

                {/* Driver Information */}
                {(selectedTruck.driverName || selectedTruck.driverPhone) && (
                  <div className="border-b pb-4">
                    <h3 className="text-md font-medium text-gray-800 mb-3">
                      Driver Information | चालक जानकारी
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedTruck.driverName && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Driver | चालक</label>
                          <div>{selectedTruck.driverName}</div>
                        </div>
                      )}
                      {selectedTruck.driverPhone && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Phone | फोन</label>
                          <div className="font-mono">{selectedTruck.driverPhone}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Information */}
                {selectedTruck.amount && (
                  <div className="border-b pb-4">
                    <h3 className="text-md font-medium text-gray-800 mb-3">
                      Financial Information | आर्थिक जानकारी
                    </h3>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Amount | रकम</label>
                      <div className="text-lg font-semibold text-green-600">
                        NPR {parseFloat(selectedTruck.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Time Information */}
                <div className="border-b pb-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">
                    Time Information | समय जानकारी
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Expected Arrival | अपेक्षित आगमन</label>
                      <div className={isOverdue(selectedTruck.expectedTime || selectedTruck.eta) && !selectedTruck.completedTime ? 'text-red-600 font-medium' : ''}>
                        {selectedTruck.eta || selectedTruck.expectedTime}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Date Issued | जारी मिति</label>
                      <div>{selectedTruck.dateIssued ? new Date(selectedTruck.dateIssued).toLocaleString() : selectedTruck.billIssueTime}</div>
                    </div>
                    {selectedTruck.completedTime && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Completed | सम्पन्न</label>
                        <div className="text-green-600 font-medium">{selectedTruck.completedTime}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                {selectedTruck.remark && (
                  <div className="border-b pb-4">
                    <h3 className="text-md font-medium text-gray-800 mb-3">
                      Additional Information | अतिरिक्त जानकारी
                    </h3>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Remarks | टिप्पणी</label>
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{selectedTruck.remark}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Barcode */}
              <div className="border-t pt-4 mt-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="font-mono text-sm tracking-wider text-gray-800 mb-1">
                    {generateBarcode(selectedTruck.code || selectedTruck.billNumber)}
                  </div>
                  <div className="text-xs font-medium text-gray-600">{selectedTruck.code || selectedTruck.billNumber}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;