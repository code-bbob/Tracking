import { useState, useEffect } from 'react';
import { QrCode, UserCheck, Download, Copy, CheckCircle, Clock, Filter, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "./components/Navbar";
import useAxios from "./utils/useAxios";

export default function IssueBarcodes() {
  const api = useAxios();
  const [formData, setFormData] = useState({
    count: 1,
    assignedTo: "",
  });
  const [users, setUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
  const [issuedCodes, setIssuedCodes] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [existingBarcodes, setExistingBarcodes] = useState([]);
  const [isLoadingBarcodes, setIsLoadingBarcodes] = useState(false);
  const [filterUser, setFilterUser] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1
  });

  // Fetch users for assignment dropdown
  const fetchUsers = async () => {
    try {
      const response = await api.get(`enterprise/persons/`);
      console.log('Users fetched:', response.data);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSubmitStatus({
        type: "error",
        message: error.response?.data?.error 
      });
    }
  };

  // Fetch already issued barcodes with filtering, search, and pagination
  const fetchExistingBarcodes = async (page = 1, assignedTo = "", search = "") => {
    try {
      setIsLoadingBarcodes(true);
      let url = `codes/issue-barcode/?page=${page}`;
      if (assignedTo) {
        url += `&assigned_to=${assignedTo}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const response = await api.get(url);
      
      // Handle paginated response
      setExistingBarcodes(response.data.results.barcodes || []);
      setPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page
      });
    } catch (error) {
      console.error('Error fetching existing barcodes:', error);
    } finally {
      setIsLoadingBarcodes(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchExistingBarcodes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value) => {
    console.log('Selected user ID:', value);
    setFormData(prev => ({
      ...prev,
      assignedTo: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: "", message: "" });

    try {
      const requestData = {
        count: parseInt(formData.count),
        assigned_to: formData.assignedTo,
      };

      const response = await api.post(`codes/issue-barcode/`, requestData);
      
      setIssuedCodes(response.data.issued_codes);
      setSubmitStatus({
        type: "success",
        message: `Successfully issued ${response.data.issued_codes.length} barcode(s)!`,
      });

      // Reset form
      setFormData({
        count: 1,
        assignedTo: "",
      });

      // Refresh existing barcodes list to show newly issued ones
      fetchExistingBarcodes(1, "", "");
      setFilterUser("");
      setSearchQuery("");

    } catch (err) {
      let message = "Failed to issue barcodes.";
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.error) {
          message = data.error;
        } else if (data.non_field_errors && data.non_field_errors.length) {
          message = data.non_field_errors[0];
        } else {
          const firstKey = Object.keys(data)[0];
          if (Array.isArray(data[firstKey]) && data[firstKey].length) {
            message = data[firstKey][0];
          } else if (typeof data[firstKey] === "string") {
            message = data[firstKey];
          }
        }
      } else if (err.message) {
        message = err.message;
      }

      console.error("Error issuing barcodes:", err);
      setSubmitStatus({
        type: "error",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadCodes = () => {
    const codesText = issuedCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcodes_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateBarcode = (code) => {
    return `||||| || ||| | |||| ||| |||| | ||| ||||`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Navbar - matching Home page */}
      <Navbar 
        title="Issue Barcodes"
        showBackButton={true}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-2 sm:p-4">
        
        {/* Status Message */}
        {submitStatus.message && (
          <div className="mb-4 sm:mb-6">
            <div
              className={`p-3 rounded-lg text-sm border ${
                submitStatus.type === "success"
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {submitStatus.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                {submitStatus.message}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Issue Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <QrCode className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Issue New Barcodes</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Count */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Number of Barcodes *
                </Label>
                <Input
                  name="count"
                  type="number"
                  value={formData.count}
                  onChange={handleInputChange}
                  placeholder="Enter quantity (1-100)"
                  min="1"
                  max="100"
                  className="mt-1 w-full"
                  required
                />
              </div>

              {/* Assign To */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Assign To *
                </Label>
                {users.length > 0 && (
                  <div className="text-xs text-gray-500 mb-1">
                    {users.length} users available
                  </div>
                )}
                <Select 
                  value={formData.assignedTo} 
                  onValueChange={handleSelectChange}
                  required
                  disabled={users.length === 0}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder={users.length === 0 ? "Loading users..." : "Select user to assign barcodes"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user} value={user.user.toString()}>
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-gray-500" />
                          <span className="truncate">{user.name || 'Unknown Name'} (@{user.username})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    <span>Issue Barcodes</span>
                  </div>
                )}
              </Button>
            </form>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            
            {issuedCodes.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Generated Codes</h2>
                    <span className="text-sm text-gray-500">({issuedCodes.length})</span>
                  </div>
                  <Button 
                    onClick={downloadCodes}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {issuedCodes.map((code, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      {/* Barcode Visual */}
                      <div className="text-center mb-3">
                        <div className="font-mono text-xs text-gray-700 mb-1 bg-gray-50 p-2 rounded overflow-x-auto">
                          {generateBarcode(code)}
                        </div>
                        <div className="font-mono text-sm font-semibold text-gray-900 bg-gray-50 p-2 rounded border break-all">
                          {code}
                        </div>
                      </div>
                      
                      {/* Copy Button */}
                      <Button
                        onClick={() => copyToClipboard(code)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        {copiedCode === code ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Copied!</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Copy className="h-4 w-4" />
                            <span>Copy</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Instructions */
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Instructions</h2>
                </div>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600 min-w-[16px]">1.</span>
                    <span>Enter the number of barcodes to generate (1-100)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600 min-w-[16px]">2.</span>
                    <span>Select a user to assign the barcodes to</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600 min-w-[16px]">3.</span>
                    <span>Click "Issue Barcodes" to generate unique codes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600 min-w-[16px]">4.</span>
                    <span>Copy codes individually or download all as a text file</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Generated codes are unique and can be used for shipment tracking.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Already Issued Barcodes Section */}
        <div className="mt-6 sm:mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Already Issued Barcodes</h2>
                {pagination.count > 0 && (
                  <span className="text-sm text-gray-500">({pagination.count} total)</span>
                )}
              </div>
              <Button 
                onClick={() => {
                  fetchExistingBarcodes(1, "", "");
                  setFilterUser("");
                  setSearchQuery("");
                }}
                variant="outline"
                size="sm"
                className="text-gray-600 w-full sm:w-auto"
                disabled={isLoadingBarcodes}
              >
                {isLoadingBarcodes ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>

            {/* Filter and Search Controls - Responsive Stack */}
            <div className="mb-4 flex flex-col lg:flex-row lg:justify-between gap-4">
              {/* Filter Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter:</Label>
                </div>
                <Select 
                  value={filterUser === "" ? "all" : filterUser} 
                  onValueChange={(value) => {
                    const actualValue = value === "all" ? "" : value;
                    setFilterUser(actualValue);
                    fetchExistingBarcodes(1, actualValue, searchQuery);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.user} value={user.user.toString()}>
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-gray-500" />
                          <span className="truncate">{user.name} (@{user.username})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Search className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Search:</Label>
                </div>
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchExistingBarcodes(1, filterUser, searchQuery);
                      }
                    }}
                    placeholder="Enter barcode code..."
                    className="flex-1 sm:w-48"
                  />
                  <Button
                    onClick={() => fetchExistingBarcodes(1, filterUser, searchQuery)}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  {searchQuery && (
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        fetchExistingBarcodes(1, filterUser, "");
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 flex-shrink-0"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {isLoadingBarcodes ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <span className="ml-2 text-gray-600">Loading barcodes...</span>
              </div>
            ) : existingBarcodes.length > 0 ? (
              <>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {existingBarcodes.map((barcode, index) => (
                    <div key={barcode.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 hover:bg-gray-50 rounded border-l-4 border-l-transparent hover:border-l-blue-500 transition-all gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <span className="font-mono text-sm font-medium text-gray-900 break-all">
                          {barcode.code}
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            assigned to <span className="font-medium truncate">{barcode.assigned_to.name}</span>
                          </span>
                          <span className="text-xs text-gray-400">
                            on {new Date(barcode.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          barcode.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                          barcode.status === 'active' ? 'bg-green-100 text-green-800' :
                          barcode.status === 'used' ? 'bg-gray-100 text-gray-800' :
                          barcode.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {barcode.status === 'issued' ? '📋 Issued' :
                           barcode.status === 'active' ? '🟢 Active' :
                           barcode.status === 'used' ? '✅ Used' :
                           barcode.status === 'cancelled' ? '❌ Cancelled' :
                           barcode.status}
                        </span>
                        <Button
                          onClick={() => copyToClipboard(barcode.code)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                        >
                          {copiedCode === barcode.code ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.count > 20 && (
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-gray-500 text-center sm:text-left">
                      Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.count)} of {pagination.count} results
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={() => fetchExistingBarcodes(pagination.currentPage - 1, filterUser, searchQuery)}
                        variant="outline"
                        size="sm"
                        disabled={!pagination.previous}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </Button>
                      <span className="text-sm text-gray-600 px-2 sm:px-3 whitespace-nowrap">
                        Page {pagination.currentPage}
                      </span>
                      <Button
                        onClick={() => fetchExistingBarcodes(pagination.currentPage + 1, filterUser, searchQuery)}
                        variant="outline"
                        size="sm"
                        disabled={!pagination.next}
                        className="flex items-center gap-1"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {filterUser || searchQuery ? "No barcodes found for your search." : "No barcodes have been issued yet."}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {filterUser || searchQuery ? "Try adjusting your filter or search terms." : "Use the form above to issue your first barcode."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}