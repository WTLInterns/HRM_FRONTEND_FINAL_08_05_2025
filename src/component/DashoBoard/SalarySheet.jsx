import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTimes, FaSearch } from "react-icons/fa";

const SalarySheet = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchSalaryData() {
      try {
        setLoading(true);
        
        // Get the subadmin ID from localStorage
        const userData = JSON.parse(localStorage.getItem("user"));
        if (!userData || !userData.id) {
          throw new Error("User data not found. Please login again.");
        }
        
        const subadminId = userData.id;
        console.log("Fetching employees for subadmin ID:", subadminId);
        
        // Call the API with the correct endpoint
        const response = await axios.get(`http://localhost:8282/api/employee/${subadminId}/employee/all`);
        
        console.log("Employee data received:", response.data);
        setEmployees(response.data);
      } catch (error) {
        console.error("Error fetching salary data:", error);
        setError(error.response?.data || "Failed to load salary data. " + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSalaryData();
  }, []);

  // Filter employees based on search term
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 min-h-screen flex justify-center items-center">
        <div className="spinner-border animate-spin inline-block w-16 h-16 border-4 rounded-full border-t-transparent border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-900 min-h-screen flex justify-center items-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const viewEmployeeDetails = (employee) => {
    setSelectedEmployee(employee);
  };

  const closeModal = () => {
    setSelectedEmployee(null);
  };

  return (
    <div className="p-3 sm:p-6 bg-slate-900 min-h-screen text-gray-100">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-blue-400">{employees[0]?.subadminName || "Employee"} Salary Sheet</h1>
      <p className="italic mb-4 text-gray-300">Employee Salary Sheet</p>
      
      {/* Search bar */}
      <div className="mb-6 bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700">
        <div className="flex items-center">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="ml-2 p-2 bg-slate-700 rounded-md text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes />
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-400">
            Found {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'}
          </div>
        )}
      </div>
      
      {/* Desktop view - Full table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse border border-slate-700 bg-slate-800 shadow-md">
          <thead>
            <tr className="bg-slate-700 text-left">
              <th className="border border-slate-600 px-4 py-2">Employee Email</th>
              <th className="border border-slate-600 px-4 py-2">First Name</th>
              <th className="border border-slate-600 px-4 py-2">Last Name</th>
              <th className="border border-slate-600 px-4 py-2">Bank Acc.No</th>
              <th className="border border-slate-600 px-4 py-2">Branch Name</th>
              <th className="border border-slate-600 px-4 py-2">Bank Name</th>
              <th className="border border-slate-600 px-4 py-2">IFSC Code</th>
              <th className="border border-slate-600 px-4 py-2">Net Salary</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee, index) => (
              <tr
                key={employee.empId}
                className={index % 2 === 0 ? "bg-slate-800" : "bg-slate-700"}
              >
                <td className="border border-slate-600 px-4 py-2">{employee.email}</td>
                <td className="border border-slate-600 px-4 py-2">{employee.firstName}</td>
                <td className="border border-slate-600 px-4 py-2">{employee.lastName}</td>
                <td className="border border-slate-600 px-4 py-2">{employee.bankAccountNo}</td>
                <td className="border border-slate-600 px-4 py-2">{employee.branchName}</td>
                <td className="border border-slate-600 px-4 py-2">{employee.bankName}</td>
                <td className="border border-slate-600 px-4 py-2">{employee.bankIfscCode}</td>
                <td className="border border-slate-600 px-4 py-2">{employee.salary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view - Card-based list */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {filteredEmployees.map((employee, index) => (
          <div 
            key={employee.empId} 
            className="bg-slate-800 rounded-lg shadow-md p-4 border border-slate-700"
            onClick={() => viewEmployeeDetails(employee)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-blue-400">{employee.firstName} {employee.lastName}</h3>
              <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded-full text-xs">
                ₹{employee.salary}
              </span>
            </div>
            <p className="text-sm text-gray-300 truncate">{employee.email}</p>
            <p className="text-xs text-gray-400 mt-2">
              Click to view full details
            </p>
          </div>
        ))}
      </div>

      {/* Mobile detail modal */}
      {selectedEmployee && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-600">
            <div className="p-4 border-b border-slate-600">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-blue-400">Employee Details</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-400">Full Name</p>
                <p>{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p>{selectedEmployee.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Bank Details</p>
                <p>{selectedEmployee.bankName} ({selectedEmployee.branchName})</p>
                <p>Acc: {selectedEmployee.bankAccountNo}</p>
                <p>IFSC: {selectedEmployee.bankIfscCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Salary</p>
                <p className="text-lg font-bold text-green-400">₹{selectedEmployee.salary}</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-600 flex justify-end">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalarySheet;
