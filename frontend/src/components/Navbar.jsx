import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, QrCode, Plus, Scan, CheckCircle, Clock, Search, Bell, Settings, ArrowLeft, Menu } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Menu Button with 3 lines */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMenuClick} 
                className="p-2 hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {showBackButton && (
                <Button variant="ghost" size="sm" onClick={goBack} className="p-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {title || 'TruckFlow'}
                </h1>
                <p className="text-xs text-gray-500 -mt-1">
                  {subtitle || 'Dashboard'}
                </p>
              </div>
            </div>

            {/* Stats Pills - only show on home page or when counts provided */}
            {(isHomePage || activeCount > 0 || completedCount > 0) && (
              <div className="hidden md:flex items-center gap-3 ml-6">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{activeCount}</span>
                  <span className="text-xs text-blue-600">Active</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{completedCount}</span>
                  <span className="text-xs text-green-600">Done</span>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search vehicles, destinations, materials..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Mobile Stats */}
            {(isHomePage || activeCount > 0 || completedCount > 0) && (
              <div className="md:hidden flex items-center gap-2 mr-2">
                <div className="bg-blue-50 px-2 py-1 rounded text-xs font-medium text-blue-700">
                  {activeCount}
                </div>
                <div className="bg-green-50 px-2 py-1 rounded text-xs font-medium text-green-700">
                  {completedCount}
                </div>
              </div>
            )}

            {/* Custom Actions */}
            {customActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                onClick={action.onClick}
                className={action.className || "bg-blue-600 hover:bg-blue-700 text-white"}
              >
                {action.icon && <span className="h-4 w-4 md:mr-2">{action.icon}</span>}
                <span className="hidden md:inline">{action.label}</span>
              </Button>
            ))}

            {/* Default Home Page Actions */}
            {isHomePage && (
              <>
                <Button
                  size="sm"
                  onClick={onScanClick}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Scan className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Scan</span>
                </Button>

                <Button size="sm" asChild>
                  <a href="/add-shipment">
                    <Plus className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Add</span>
                  </a>
                </Button>

                {/* {userRole === "Admin" && (
                  <Button size="sm" variant="outline" asChild>
                    <a href="/issue-barcodes">
                      <QrCode className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Codes</span>
                    </a>
                  </Button>
                )} */}
              </>
            )}

            {/* User Menu */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
              <Button size="sm" variant="ghost" className="p-2">
                <Bell className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="p-2">
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;