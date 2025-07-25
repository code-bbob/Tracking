import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Plus, 
  QrCode, 
  BarChart3, 
  Settings, 
  Users, 
  FileText, 
  X,
  Truck,
  Package
} from 'lucide-react';
import { Button } from './ui/button';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/',
      description: 'View all shipments'
    },
    {
      label: 'Add Shipment',
      icon: Plus,
      path: '/add-shipment',
      description: 'Create new shipment'
    },
    {
      label: 'Issue Barcodes',
      icon: QrCode,
      path: '/issue-barcodes',
      description: 'Generate tracking codes'
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      description: 'View reports'
    },
    {
      label: 'Fleet Management',
      icon: Truck,
      path: '/fleet',
      description: 'Manage vehicles'
    },
    {
      label: 'Inventory',
      icon: Package,
      path: '/inventory',
      description: 'Material tracking'
    },
    {
      label: 'Reports',
      icon: FileText,
      path: '/reports',
      description: 'Generate reports'
    },
    {
      label: 'Users',
      icon: Users,
      path: '/users',
      description: 'Manage users'
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      description: 'App settings'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Backdrop with blur effect */}
      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm bg-white/10 z-[60] transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar - reduced width to w-60 (15rem) */}
      <div className={`fixed top-0 left-0 h-full w-60 bg-white shadow-xl z-[70] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Header with X button - adjusted for smaller width */}
        <div className="flex items-center h-16 px-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {/* X button positioned exactly where hamburger menu is in navbar */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">TruckFlow</h2>
              <p className="text-[10px] text-gray-500 -mt-1">Navigation</p>
            </div>
          </div>
        </div>

        {/* Navigation Items - adjusted for smaller width */}
        <div className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-64px-80px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors group ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className={`p-1.5 rounded-md ${
                  isActive 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-xs truncate ${
                    isActive ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {item.label}
                  </div>
                  <div className={`text-[10px] truncate ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer - adjusted for smaller width */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-[10px] text-gray-500">TruckFlow v1.0</p>
            <p className="text-[9px] text-gray-400">Shipment System</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;