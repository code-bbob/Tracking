import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, QrCode, Plus, Scan, CheckCircle, Clock, Search, Bell, Settings, ArrowLeft, Menu, XCircle, Truck, User, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { logout } from '../redux/accessSlice';
import { useSidebar } from './AppLayout';

const Navbar = ({ 
  title, 
  subtitle, 
  showBackButton = false, 
  showSearch = false,
  searchQuery = "",
  onSearchChange = () => {},
  activeCount = 0,
  completedCount = 0,
  cancelledCount = 0,
  onScanClick = () => {},
  customActions = []
}) => {
  const [userRole, setUserRole] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Use the sidebar context
  const { handleMenuClick } = useSidebar();

  // Fetch user role
  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${backendUrl}/enterprise/role/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const role = await response.json();
        setUserRole(role);
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    dispatch(logout());
    navigate("/login");
  };

  const goBack = () => {
    window.history.back();
  };

  const isHomePage = location.pathname === '/';

  return (
    <nav className="border-b border-gray-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left Section - Logo and Brand */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Menu Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMenuClick} 
                className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex-shrink-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {showBackButton && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={goBack} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              
              {/* Brand Section */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    {title || 'TruckFlow'}
                  </h1>
                  {subtitle && (
                    <p className="text-xs text-gray-500 -mt-0.5 truncate hidden sm:block">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Stats Pills - only show on desktop */}
            {(isHomePage || activeCount > 0 || completedCount > 0 || cancelledCount > 0) && (
              <div className="hidden xl:flex items-center gap-3 ml-6 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 shadow-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-bold text-blue-700">{activeCount}</span>
                    </div>
                    <div className="text-xs text-blue-600 font-medium mt-1">Active</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 px-3 py-1.5 rounded-xl border border-green-200 shadow-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-bold text-green-700">{completedCount}</span>
                    </div>
                    <div className="text-xs text-green-600 font-medium mt-1">Completed</div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-red-100 px-3 py-1.5 rounded-xl border border-red-200 shadow-sm">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-bold text-red-700">{cancelledCount}</span>
                    </div>
                    <div className="text-xs text-red-600 font-medium mt-1">Cancelled</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center Section - Enhanced Search Bar */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-lg mx-6 lg:mx-8">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  type="text"
                  placeholder="Search vehicles, destinations, materials..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm rounded-xl bg-gray-50 focus:bg-white transition-all shadow-sm"
                />
                {searchQuery && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-200 rounded-full"
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Custom Actions */}
            {customActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                onClick={action.onClick}
                className={`h-9 px-3 text-sm rounded-xl transition-all hover:scale-105 shadow-sm ${action.className || "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"}`}
              >
                {action.icon && <span className="h-4 w-4 mr-2">{action.icon}</span>}
                <span className="hidden md:inline">{action.label}</span>
              </Button>
            ))}

            {/* Default Home Page Actions */}
            {isHomePage && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={onScanClick}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white h-9 px-3 text-sm rounded-xl transition-all hover:scale-105 shadow-sm"
                >
                  <Scan className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Scan</span>
                </Button>

                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-9 px-3 text-sm rounded-xl transition-all hover:scale-105 shadow-sm" 
                  asChild
                >
                  <a href="/add-shipment">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Add</span>
                  </a>
                </Button>
              </div>
            )}

            {/* Enhanced User Menu */}
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
              {/* Notifications - Desktop only */}
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors hidden md:flex relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
              
              {/* Settings - Desktop only */}
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden md:flex"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              {/* User Profile Button */}
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer hidden lg:flex">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden xl:block">
                  <div className="text-xs font-medium text-gray-900">User</div>
                  <div className="text-xs text-gray-500 capitalize">{userRole || 'Member'}</div>
                </div>
                <ChevronDown className="h-3 w-3 text-gray-400 hidden xl:block" />
              </div>
              
              {/* Logout - Enhanced */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all hover:scale-105"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden pb-3 px-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;