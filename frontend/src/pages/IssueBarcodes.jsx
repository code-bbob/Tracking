import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  QrCode, 
  Users, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  UserCheck,
  Hash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const IssueBarcodes = () => {
  const [persons, setPersons] = useState([]);
  const [selectedAssignedTo, setSelectedAssignedTo] = useState('');
  const [selectedAssignedBy, setSelectedAssignedBy] = useState('');
  const [count, setCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPersons, setIsLoadingPersons] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [issuedCodes, setIssuedCodes] = useState([]);
  const [userRole, setUserRole] = useState('');
  
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    checkUserRole();
    fetchPersons();
  }, []);

  const checkUserRole = async () => {
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
        
        if (role !== 'Admin') {
          navigate('/');
          return;
        }
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Error checking user role:', err);
      navigate('/login');
    }
  };

  const fetchPersons = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${backendUrl}/enterprise/persons/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersons(data);
      } else if (response.status === 403) {
        setError('You do not have permission to access this page.');
        navigate('/');
      } else {
        setError('Failed to fetch persons.');
      }
    } catch (err) {
      setError('Error loading data.');
      console.error('Error fetching persons:', err);
    } finally {
      setIsLoadingPersons(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!selectedAssignedTo || !selectedAssignedBy) {
      setError('Please select both assigned to and assigned by persons.');
      setIsLoading(false);
      return;
    }

    if (count < 1 || count > 1000) {
      setError('Count must be between 1 and 1000.');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${backendUrl}/codes/issue-barcode/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigned_to: selectedAssignedTo,
          assigned_by: selectedAssignedBy,
          count: parseInt(count),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully issued ${data.issued_codes.length} barcode(s).`);
        setIssuedCodes(data.issued_codes);
        // Reset form
        setSelectedAssignedTo('');
        setSelectedAssignedBy('');
        setCount(1);
      } else {
        setError(data.error || 'Failed to issue barcodes.');
      }
    } catch (err) {
      setError('Error issuing barcodes.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (userRole !== 'Admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">This page is only accessible to administrators.</p>
          <Button onClick={() => navigate('/')} className="w-full">
            <ArrowLeft className="mr-2" size={16} />
            Go Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <QrCode className="mr-3 text-blue-600" size={36} />
                Issue Barcodes
              </h1>
              <p className="text-gray-600 mt-2">Generate and assign barcodes to team members</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Home
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issue Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <Package className="mr-2 text-blue-600" size={20} />
                Barcode Issuance Form
              </h2>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center"
                >
                  <AlertCircle className="mr-2" size={16} />
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center"
                >
                  <CheckCircle className="mr-2" size={16} />
                  {success}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="assignedTo" className="flex items-center mb-2">
                      <Users className="mr-2" size={16} />
                      Assign To
                    </Label>
                    <Select value={selectedAssignedTo} onValueChange={setSelectedAssignedTo}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select person to assign to" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingPersons ? (
                          <SelectItem value="loading" disabled>Loading persons...</SelectItem>
                        ) : (
                          persons.map((person) => (
                            <SelectItem key={person.user} value={person.user.toString()}>
                              <div className="flex items-center">
                                <UserCheck className="mr-2" size={14} />
                                {person.name} ({person.role})
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* <div>
                    <Label htmlFor="assignedBy" className="flex items-center mb-2">
                      <UserCheck className="mr-2" size={16} />
                      Assigned By
                    </Label>
                    <Select value={selectedAssignedBy} onValueChange={setSelectedAssignedBy}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select assigning person" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingPersons ? (
                          <SelectItem value="loading" disabled>Loading persons...</SelectItem>
                        ) : (
                          persons.filter(person => person.role === 'Admin').map((person) => (
                            <SelectItem key={person.user} value={person.user.toString()}>
                              <div className="flex items-center">
                                <UserCheck className="mr-2" size={14} />
                                {person.name} (Admin)
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div> */}
                <div>
                  <Label htmlFor="count" className="flex items-center mb-2">
                    <Hash className="mr-2" size={16} />
                    Number of Barcodes
                  </Label>
                  <Input
                    id="count"
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    min="1"
                    max="1000"
                    placeholder="Enter number of barcodes to issue"
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum: 1, Maximum: 1000</p>
                </div>
                </div>


                <Button
                  type="submit"
                  disabled={isLoading || isLoadingPersons}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <QrCode size={16} />
                    </motion.div>
                  ) : (
                    <QrCode className="mr-2" size={16} />
                  )}
                  {isLoading ? 'Issuing Barcodes...' : 'Issue Barcodes'}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Recent Issued Codes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <CheckCircle className="mr-2 text-green-600" size={20} />
                Recently Issued
              </h3>
              
              {issuedCodes.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {issuedCodes.map((code, index) => (
                    <motion.div
                      key={code}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
                    >
                      <span className="font-mono text-sm">{code}</span>
                      <QrCode size={16} className="text-gray-500" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <QrCode size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No barcodes issued yet</p>
                  <p className="text-sm">Recently issued codes will appear here</p>
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Your Role:</span>
                  <span className="font-semibold text-blue-600">{userRole}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available Persons:</span>
                  <span className="font-semibold">{persons.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Just Issued:</span>
                  <span className="font-semibold text-green-600">{issuedCodes.length}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default IssueBarcodes;
