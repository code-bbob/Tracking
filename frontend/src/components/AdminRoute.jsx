import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAxios from '../utils/useAxios';
import { Shield, AlertTriangle } from 'lucide-react';

const AdminRoute = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const api = useAxios();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await api.get("/enterprise/role/");
        setUserRole(res.data);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'Admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You need administrator privileges to access this page.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <AlertTriangle className="h-4 w-4" />
            <span>Contact your administrator for access</span>
          </div>
          <button 
            onClick={() => window.history.back()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;