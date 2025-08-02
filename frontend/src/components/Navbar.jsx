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
    <nav className="border-b border-gray-200/80 shadow-lg sticky top-0 z-50 backdrop-blur-md bg-white/95">
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
                className="p-2 hover:bg-blue-50/80 hover:text-blue-600 rounded-xl transition-all duration-200 flex-shrink-0 hover:shadow-sm"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* {showBackButton && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={goBack} 
                  className="p-2 hover:bg-gray-100/80 rounded-xl transition-all duration-200 flex-shrink-0 hover:shadow-sm"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )} */}
              
              {/* Brand Section */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl shadow-md">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                    JS-JV - {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs text-gray-500 -mt-0.5 truncate hidden sm:block font-medium">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - Enhanced Search Bar */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-lg mx-6 lg:mx-8">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <Input
                  type="text"
                  placeholder="Search vehicles, destinations, materials..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 text-sm rounded-xl bg-gray-50/60 focus:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                />
                {searchQuery && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-200/80 rounded-full transition-all duration-200"
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
                disabled={action.disabled}
                className={`h-9 px-3 text-sm rounded-xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md ${action.className || "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"}`}
              >
                {action.icon && <span className="h-4 w-4 mr-2">{action.icon}</span>}
                <span className="hidden md:inline font-medium">{action.label}</span>
              </Button>
            ))}

            {/* Default Home Page Actions */}
            {isHomePage && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={onScanClick}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white h-9 px-3 text-sm rounded-xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                >
                  <Scan className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2 font-medium">Scan</span>
                </Button>

                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-9 px-3 text-sm rounded-xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md" 
                  asChild
                >
                  <a href="/add-shipment">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2 font-medium">Add</span>
                  </a>
                </Button>
              </div>
            )}

            {/* Enhanced User Menu */}
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200/60">
              {/* Notifications - Desktop only */}
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2 hover:bg-blue-50/80 hover:text-blue-600 rounded-xl transition-all duration-200 hidden md:flex relative hover:shadow-sm"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse shadow-sm"></span>
              </Button>
              
              {/* Settings - Desktop only */}
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2 hover:bg-gray-100/80 rounded-xl transition-all duration-200 hidden md:flex hover:shadow-sm"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              {/* User Profile Button */}
              <div className="hidden lg:flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50/80 transition-all duration-200 cursor-pointer hover:shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden xl:block">
                  <div className="text-xs font-semibold text-gray-900">User</div>
                  <div className="text-xs text-gray-500 capitalize font-medium">{userRole || 'Member'}</div>
                </div>
                <ChevronDown className="h-3 w-3 text-gray-400 hidden xl:block" />
              </div>
              
              {/* Logout - Enhanced */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50/80 p-2 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-sm"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline ml-2 font-medium">Logout</span>
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
                className="pl-10 pr-4 py-2.5 w-full text-sm rounded-xl border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 bg-gray-50/60 focus:bg-white transition-all duration-200 shadow-sm"
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;