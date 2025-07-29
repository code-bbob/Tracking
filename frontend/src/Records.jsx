import { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  Download,
  X,
  MapPin,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Printer,
} from "lucide-react";
import { Button } from "./components/ui/button";
import Navbar from "./components/Navbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import useAxios from "./utils/useAxios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";

export default function Records() {
  const api = useAxios();
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    material: "",
    region: "",
    vehicleSize: "",
    issuedBy: "",
    modifiedBy: "",
    dateIssuedFrom: "",
    dateIssuedTo: "",
    dateModifiedFrom: "",
    dateModifiedTo: "",
    amountFrom: "",
    amountTo: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "",
    material: "",
    region: "",
    vehicleSize: "",
    issuedBy: "",
    modifiedBy: "",
    dateIssuedFrom: "",
    dateIssuedTo: "",
    dateModifiedFrom: "",
    dateModifiedTo: "",
    amountFrom: "",
    amountTo: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Material choices
  const materialChoices = [
    { value: "roda", label: "Roda" },
    { value: "baluwa", label: "Baluwa" },
    { value: "dhunga", label: "Dhunga" },
    { value: "gravel", label: "Gravel" },
    { value: "chips", label: "Chips" },
    { value: "dust", label: "Dust" },
    { value: "mato", label: "Mato" },
    { value: "base/subbase", label: "Base/Subbase" },
    { value: "Itta", label: "Itta" },
    { value: "Kawadi", label: "Kawadi" },
    { value: "other", label: "Other" },
  ];

  // Vehicle size choices
  const vehicleSizeChoices = [
    { value: "260", label: "260 cubic feet" },
    { value: "160", label: "160 cubic feet" },
    { value: "100", label: "100 cubic feet" },
    { value: "Other", label: "Other" },
  ];

  const fetchBills = async (page = 1) => {
    try {
      setIsLoading(true);
      console.log("Fetching bills from API...");

      // Build query parameters using appliedFilters instead of filters
      const queryParams = new URLSearchParams();
      if (page > 1) queryParams.append("page", page);

      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) {
          // Map frontend filter keys to backend expected keys
          const keyMap = {
            vehicleSize: "vehicle_size",
            issuedBy: "issued_by",
            modifiedBy: "modified_by",
            dateIssuedFrom: "date_issued_from",
            dateIssuedTo: "date_issued_to",
            dateModifiedFrom: "date_modified_from",
            dateModifiedTo: "date_modified_to",
            amountFrom: "amount_from",
            amountTo: "amount_to",
          };
          const backendKey = keyMap[key] || key;
          queryParams.append(backendKey, value);
        }
      });

      const url = `/bills/bills/?${queryParams.toString()}`;
      console.log("Making request to:", url);

      const response = await api.get(url);
      console.log("Response received:", response.data);

      const data = response.data;

      // Handle paginated response structure
      const billsData = data.results || data;
      const isArray = Array.isArray(billsData);

      if (!isArray) {
        console.error("Expected array of bills, received:", billsData);
        setBills([]);
        return;
      }

      // Convert data for frontend compatibility
      const convertedBills = billsData.map((bill) => ({
        ...bill,
        vehicleNumber: bill.vehicle_number,
        dateIssued: bill.date_issued,
        billNumber: bill.code,
        cargo: bill.material,
        expectedTime: bill.eta,
        billIssueTime: new Date(bill.date_issued).toLocaleString("en-US"),
      }));

      setBills(convertedBills);
      setPagination({
        count: data.count || billsData.length,
        next: data.next,
        previous: data.previous,
      });
    } catch (error) {
      console.error("Error fetching bills:", error);
      console.error("Error response:", error.response);

      // Log more details about the error
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Headers:", error.response.headers);
        console.error("Data:", error.response.data);
      } else if (error.request) {
        console.error("Request made but no response:", error.request);
      } else {
        console.error("Error message:", error.message);
      }

      // Set empty state on error
      setBills([]);
      setPagination({ count: 0, next: null, previous: null });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(currentPage);
  }, [appliedFilters, currentPage]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      status: "",
      material: "",
      region: "",
      vehicleSize: "",
      issuedBy: "",
      modifiedBy: "",
      dateIssuedFrom: "",
      dateIssuedTo: "",
      dateModifiedFrom: "",
      dateModifiedTo: "",
      amountFrom: "",
      amountTo: "",
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-50 text-yellow-800 border-yellow-200",
        icon: Clock,
      },
      completed: {
        color: "bg-green-50 text-green-800 border-green-200",
        icon: CheckCircle,
      },
      cancelled: {
        color: "bg-red-50 text-red-800 border-red-200",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 border text-xs font-medium ${config.color}`}
      >
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  const exportToCSV = () => {
    const csvHeaders = [
      "Bill Number",
      "Vehicle Number",
      "Date Issued",
      "Amount",
      "Status",
      "Material",
      "Issue Location",
      "Destination",
      "Region",
      "Vehicle Size",
      "Issued By",
      "Modified By",
      "Modified Date",
      "Remarks",
    ];

    const csvData = bills.map((bill) => [
      bill.code,
      bill.vehicle_number,
      formatDateTime(bill.date_issued),
      bill.amount,
      bill.status,
      bill.material,
      bill.issue_location,
      bill.destination,
      bill.region,
      bill.vehicle_size,
      bill.issued_by_name || "",
      bill.modified_by_name || "",
      bill.modified_date ? formatDateTime(bill.modified_date) : "",
      bill.remark || "",
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bills_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate total amounts (excluding cancelled bills)
  const calculateTotals = () => {
    const pendingTotal = bills
      .filter((bill) => bill.status === "pending")
      .reduce((sum, bill) => sum + (bill.amount || 0), 0);

    const completedTotal = bills
      .filter((bill) => bill.status === "completed")
      .reduce((sum, bill) => sum + (bill.amount || 0), 0);

    const cancelledTotal = bills
      .filter((bill) => bill.status === "cancelled")
      .reduce((sum, bill) => sum + (bill.amount || 0), 0);

    const grandTotal = pendingTotal + completedTotal;

    return { pendingTotal, completedTotal, cancelledTotal, grandTotal };
  };

  const totals = calculateTotals();

  // Simple and reliable PDF export
  const exportToPDF = () => {
    try {
      const doc = new jsPDF("l", "mm", "a4"); // landscape for more width

      // Header
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("Bill Records Report", 20, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Records: ${bills.length}`, 20, 37);

      // Table setup
      let yPosition = 50;
      const lineHeight = 6;
      const pageHeight = 190; // leave space for footer

      // Table headers
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(41, 128, 185);
      doc.rect(15, yPosition - 4, 260, 8, "F");

      doc.text("Bill #", 20, yPosition);
      doc.text("Vehicle", 50, yPosition);
      doc.text("Route", 80, yPosition);
      doc.text("Material", 140, yPosition);
      doc.text("Amount", 170, yPosition);
      doc.text("Status", 200, yPosition);
      doc.text("Date", 220, yPosition);

      yPosition += 10;

      // Table data
      doc.setFont(undefined, "normal");
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);

      bills.forEach((bill, index) => {
        if (yPosition > pageHeight) {
          doc.addPage();
          yPosition = 20;
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(15, yPosition - 3, 260, lineHeight, "F");
        }

        doc.text(bill.code || "", 20, yPosition);
        doc.text(bill.vehicle_number || "", 50, yPosition);

        // Simple route format with consistent spacing
        const route = `${bill.issue_location} - ${bill.destination}`;
        const maxRouteLength = 30; // Increased from 25
        doc.text(
          route.length > maxRouteLength
            ? route.substring(0, maxRouteLength) + "..."
            : route,
          80,
          yPosition
        );

        doc.text(bill.material || "", 140, yPosition);
        doc.text(`Rs. ${(bill.amount || 0).toLocaleString()}`, 170, yPosition);
        doc.text(bill.status || "", 200, yPosition);
        doc.text(new Date(bill.date_issued).toLocaleString(), 220, yPosition);

        yPosition += lineHeight;
      });

      // Financial summary
      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(40, 40, 40);
      doc.text("Financial Summary", 20, yPosition);

      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(
        `Pending Amount: Rs. ${totals.pendingTotal.toLocaleString()}`,
        20,
        yPosition
      );
      doc.text(
        `Completed Amount: Rs. ${totals.completedTotal.toLocaleString()}`,
        20,
        yPosition + 7
      );
      doc.text(
        `Cancelled Amount: Rs. ${totals.cancelledTotal.toLocaleString()} (excluded)`,
        20,
        yPosition + 14
      );

      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 100, 0);
      doc.text(
        `Total Revenue: Rs. ${totals.grandTotal.toLocaleString()}`,
        20,
        yPosition + 21
      );

      doc.save(`bills_report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("PDF export failed. Please try the CSV export instead.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        title="Bill Records"
        subtitle="View and analyze all shipment records"
        showBackButton={true}
        customActions={[
          {
            label: "Export CSV",
            icon: <Download className="h-4 w-4" />,
            onClick: exportToCSV,
            disabled: bills.length === 0,
            className: "bg-gray-900 hover:bg-gray-800 text-white",
          },
          {
            label: "Export PDF",
            icon: <Printer className="h-4 w-4" />,
            onClick: exportToPDF,
            disabled: bills.length === 0,
            className: "bg-gray-700 hover:bg-gray-600 text-white",
          },
        ]}
      />

      <div className="max-w-7xl mx-auto p-2 space-y-6">
        {/* Enhanced Header Section */}
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="p-3">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                      Records Management
                    </h1>
                    <p className="text-sm text-gray-500">
                      Track and manage all bill records
                    </p>
                  </div>
                </div>

              </div>
              
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">
                      Showing{" "}
                      <span className="font-medium text-gray-900">
                        {bills.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-gray-900">
                        {pagination.count}
                      </span>{" "}
                      records
                    </span>
                  </div>

                  {bills.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">
                        Total Value:{" "}
                        <span className="font-semibold text-green-700">
                          Rs.{calculateTotals().grandTotal.toLocaleString()}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
                    showFilters
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {showFilters && <X className="h-3 w-3 ml-1" />}
                </Button>

                <div className="h-8 w-px bg-gray-200"></div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Filter Records
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Clear all filters
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 h-auto"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters();
              }}
              className="p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Search Records
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                      placeholder="Search bills, vehicles, drivers..."
                      className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Material */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Material Type
                  </label>
                  <select
                    value={filters.material}
                    onChange={(e) =>
                      handleFilterChange("material", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                  >
                    <option value="">All Materials</option>
                    {materialChoices.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Region */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Region
                  </label>
                  <select
                    value={filters.region}
                    onChange={(e) =>
                      handleFilterChange("region", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                  >
                    <option value="">All Regions</option>
                    <option value="local">Local</option>
                    <option value="crossborder">Cross Border</option>
                  </select>
                </div>

                {/* Vehicle Size */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Size
                  </label>
                  <select
                    value={filters.vehicleSize}
                    onChange={(e) =>
                      handleFilterChange("vehicleSize", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                  >
                    <option value="">All Sizes</option>
                    {vehicleSizeChoices.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Issue Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateIssuedFrom}
                    onChange={(e) =>
                      handleFilterChange("dateIssuedFrom", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                  />
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Issue Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateIssuedTo}
                    onChange={(e) =>
                      handleFilterChange("dateIssuedTo", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                  />
                </div>

                {/* Issued By */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Issued By
                  </label>
                  <input
                    type="text"
                    value={filters.issuedBy}
                    onChange={(e) =>
                      handleFilterChange("issuedBy", e.target.value)
                    }
                    placeholder="Enter issuer name..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                  />
                </div>

                {/* Min Amount */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Min Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={filters.amountFrom}
                    onChange={(e) =>
                      handleFilterChange("amountFrom", e.target.value)
                    }
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                  />
                </div>

                {/* Max Amount */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Max Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={filters.amountTo}
                    onChange={(e) =>
                      handleFilterChange("amountTo", e.target.value)
                    }
                    placeholder="999999"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                  />
                </div>

                {/* Checked By */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Verified By
                  </label>
                  <input
                    type="text"
                    value={filters.modifiedBy}
                    onChange={(e) =>
                      handleFilterChange("modifiedBy", e.target.value)
                    }
                    placeholder="Enter verifier name..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                  />
                </div>

                {/* Checked Date From */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Verified Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateModifiedFrom}
                    onChange={(e) =>
                      handleFilterChange("dateModifiedFrom", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                  />
                </div>

                {/* Checked Date To */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Verified Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateModifiedTo}
                    onChange={(e) =>
                      handleFilterChange("dateModifiedTo", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                  />
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span>Use filters to narrow down your search results</span>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    className="border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 px-6 py-2.5 text-sm font-medium transition-all"
                  >
                    Reset Filters
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 text-sm font-medium shadow-sm transition-all hover:shadow-md"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Enhanced Data Table */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading Records
              </h3>
              <p className="text-gray-500">
                Fetching your data, please wait...
              </p>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No Records Found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                No bills match your current search criteria. Try adjusting your
                filters or search terms.
              </p>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="px-6 py-2.5 border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto" id="bills-table-container">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        Bill Details
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Truck className="h-3 w-3 text-gray-500" />
                        Vehicle Info
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        Route
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3 text-gray-500" />
                        Material
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-500" />
                        Date Issued
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-gray-500" />
                        Issued by
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {bills.map((bill, index) => (
                    <tr
                      key={bill.id}
                      className={`cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:shadow-sm ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                      onClick={() => setSelectedBill(bill)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {/* <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                            {bill.code?.slice(-2) || '##'}
                          </div> */}
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              #{bill.code}
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block">
                              {bill.issued_by_name || "System"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                            <Truck className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {bill.vehicle_number}
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block">
                              {bill.vehicle_size} cu ft
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {bill.issue_location}
                            </div>
                            <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                              <span className="text-gray-400">→</span>
                              {bill.destination}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                            <Package className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {bill.material}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  bill.region === "local"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {bill.region}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-sm font-medium ${
                            bill.status === "pending"
                              ? "text-blue-600"
                              : bill.status === "cancelled"
                              ? "text-red-500 line-through"
                              : "text-green-600"
                          }`}
                        >
                          Rs.{bill.amount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div className="text-sm text-gray-900">
                            {formatDateTime(bill.date_issued)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">
                            {bill.issued_by_name || "-"}
                          </div>
                          {bill.modified_date && (
                            <div className="text-xs text-gray-500">
                              {formatDateTime(bill.modified_date)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(bill.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        {bills.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                Financial Overview
              </h3>
              <p className="text-sm text-gray-600 mt-1 ml-11">
                Summary of all displayed records
              </p>
            </div>
            
            <div className="p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Pending */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-yellow-700">Pending</div>
                      <div className="text-xs text-yellow-600">
                        {bills.filter((b) => b.status === "pending").length} bills
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-800">
                    Rs.{calculateTotals().pendingTotal.toLocaleString()}
                  </div>
                </div>

                {/* Completed */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-700">Completed</div>
                      <div className="text-xs text-green-600">
                        {bills.filter((b) => b.status === "completed").length} bills
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-800">
                    Rs.{calculateTotals().completedTotal.toLocaleString()}
                  </div>
                </div>

                {/* Cancelled */}
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-red-700">Cancelled</div>
                      <div className="text-xs text-red-600">
                        {bills.filter((b) => b.status === "cancelled").length} bills
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-800 line-through">
                    Rs.{calculateTotals().cancelledTotal.toLocaleString()}
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg p-4 text-white col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-100">Total Revenue</div>
                      <div className="text-xs text-blue-200">Active bills only</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    Rs.{calculateTotals().grandTotal.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{bills.length}</div>
                    <div className="text-sm text-gray-600">Total Records</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {bills.length > 0 ? Math.round((calculateTotals().grandTotal / bills.length)) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Avg. Amount (Rs.)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {bills.length > 0 ? Math.round(((bills.filter(b => b.status === "completed").length + bills.filter(b => b.status === "pending").length) / bills.length) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Active Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.count > 50 && (
          <div className="bg-white border border-gray-200 px-6 py-4">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil(pagination.count / 50)}
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="text-sm text-gray-500">
                  {pagination.count} total records
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={!pagination.previous || isLoading}
                  className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </Button>
                <div className="px-3 py-2 bg-gray-900 text-white text-sm font-medium">
                  {currentPage}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={!pagination.next || isLoading}
                  className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Comprehensive Bill Details Modal */}
        {selectedBill && (
          <Dialog
            open={!!selectedBill}
            onOpenChange={() => setSelectedBill(null)}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Bill Details - #{selectedBill.code}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status and Basic Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedBill.vehicle_number}
                    </h3>
                    <p className="text-gray-600">
                      {selectedBill.vehicle_size} cubic feet
                    </p>
                  </div>
                  {getStatusBadge(selectedBill.status)}
                </div>

                {/* Route Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Route Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">From:</span>{" "}
                        {selectedBill.issue_location}
                      </div>
                      <div>
                        <span className="text-gray-600">To:</span>{" "}
                        {selectedBill.destination}
                      </div>
                      <div>
                        <span className="text-gray-600">Region:</span>{" "}
                        <span className="capitalize">
                          {selectedBill.region}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Cargo & Payment
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Material:</span>{" "}
                        <span className="capitalize">
                          {selectedBill.material}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount:</span>{" "}
                        <span className="font-medium text-green-600">
                          Rs. {selectedBill.amount?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date Issued:</span>
                      <span>{formatDateTime(selectedBill.date_issued)}</span>
                    </div>
                    {selectedBill.modified_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Modified:</span>
                        <span>
                          {formatDateTime(selectedBill.modified_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personnel */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Personnel</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issued By:</span>
                      <span>{selectedBill.issued_by_name || "System"}</span>
                    </div>
                    {selectedBill.modified_by_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Modified By:</span>
                        <span>{selectedBill.modified_by_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Details */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Vehicle Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle Number:</span>
                      <span className="font-medium">
                        {selectedBill.vehicle_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle Size:</span>
                      <span>{selectedBill.vehicle_size} cubic feet</span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Additional Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bill Code:</span>
                      <span className="font-mono">{selectedBill.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="capitalize">{selectedBill.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region Type:</span>
                      <span className="capitalize">{selectedBill.region}</span>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {selectedBill.remark && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Remarks</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                      {selectedBill.remark}
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
