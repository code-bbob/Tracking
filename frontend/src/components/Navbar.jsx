import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, QrCode, Plus, Scan, CheckCircle, Clock, Search, Bell, Settings, ArrowLeft, Menu, XCircle } from 'lucide-react';
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
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Menu Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMenuClick} 
                className="p-1.5 sm:p-2 hover:bg-gray-100 flex-shrink-0"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              {showBackButton && (
                <Button variant="ghost" size="sm" onClick={goBack} className="p-1.5 sm:p-2 flex-shrink-0">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
              
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 ">
                  {title || 'TruckFlow'}
                </h1>
                <p className="text-xs text-gray-500 -mt-1 truncate hidden sm:block">
                  {subtitle || 'Dashboard'}
                </p>
              </div>
            </div>

            {/* Stats Pills - only show on desktop */}
            {(isHomePage || activeCount > 0 || completedCount > 0 || cancelledCount > 0) && (
              <div className="hidden lg:flex items-center gap-2 ml-4 flex-shrink-0">
                <div>
                <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{activeCount}</span>
                </div>
                  <div className="text-xs text-blue-600">Active</div>
                </div>
                 <div>
                <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-sm font-medium text-blue-700">{completedCount}</span>
                </div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>

               <div>
                <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-sm font-medium text-red-700">{cancelledCount}</span>
                </div>
                  <div className="text-xs text-red-600">Cancelled</div>
                </div>



             </div>
            )}
          </div>

          {/* Desktop Search Bar */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search vehicles, destinations..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Custom Actions */}
            {customActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                onClick={action.onClick}
                className={`h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm ${action.className || "bg-blue-600 hover:bg-blue-700 text-white"}`}
              >
                {action.icon && <span className="h-3 w-3 sm:h-4 sm:w-4 md:mr-2">{action.icon}</span>}
                <span className="hidden md:inline">{action.label}</span>
              </Button>
            ))}

            {/* Default Home Page Actions */}
            {isHomePage && (
              <>
                <Button
                  size="sm"
                  onClick={onScanClick}
                  className="bg-green-600 hover:bg-green-700 text-white h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Scan className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1 sm:ml-2">Scan</span>
                </Button>

                <Button size="sm" className="bg-blue-600 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm" asChild>
                  <a href="/add-shipment">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1 sm:ml-2">Add</span>
                  </a>
                </Button>
              </>
            )}

            {/* User Menu - Hide settings and notifications on mobile */}
            <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-gray-200">
              {/* Settings and Notifications - Desktop only */}
              <Button size="sm" variant="ghost" className="p-1.5 sm:p-2 hidden md:flex">
                <Bell className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="p-1.5 sm:p-2 hidden md:flex">
                <Settings className="h-4 w-4" />
              </Button>
              
              {/* Logout - Always visible but smaller on mobile */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 sm:p-2"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
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