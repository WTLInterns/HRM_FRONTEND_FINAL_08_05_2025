"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CiEdit } from "react-icons/ci";
import { MdDeleteOutline } from "react-icons/md";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import axios from "axios";

export default function AddEmp() {
  // States for Add/Update Employee fields
  const [firstName, setFname] = useState("");
  const [lastName, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [aadharNo, setaadharNo] = useState("");
  const [panCard, setpanCard] = useState("");
  const [education, seteducation] = useState("");
  const [bloodGroup, setbloodGroup] = useState("");
  const [jobRole, setjobRole] = useState("");
  const [gender, setgender] = useState("");
  const [address, setaddress] = useState("");
  const [birthDate, setbirthDate] = useState("");
  const [joiningDate, setjoiningDate] = useState("");
  const [status, setstatus] = useState("");
  const [bankName, setbankName] = useState("");
  const [bankIfscCode, setbankIfscCode] = useState("");
  const [branchName, setbranchName] = useState("");
  const [salary, setsalary] = useState("");
  const [bankAccountNo, setbankAccountNo] = useState("");

  // Modal states: add modal and update modal
  const [modal, setModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  // Selected employee for update
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Search and Pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 5;

  // Get subadmin data from localStorage
  const [subadminId, setSubadminId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the subadmin data from localStorage
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.id) {
      setSubadminId(userData.id);
      console.log("Found user ID in localStorage:", userData.id);
    } else {
      console.log("No user data found in localStorage or missing ID");
    }
  }, []);

  // Fetch employees when subadminId is available
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!subadminId) {
        console.log("No subadminId available, can't fetch employees");
        return;
      }
      
      setLoading(true);
      try {
        console.log(`Fetching employees for subadmin ID: ${subadminId}`);
        const response = await axios.get(`http://localhost:8282/api/employee/${subadminId}/employee/all`);
        console.log("Fetched employees:", response.data);
        setEmployees(response.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to fetch employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [subadminId]);

  // Filter employees based on search term
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate totalPages based on employees data
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  
  const currentEmployees = filteredEmployees.slice(
    (currentPage - 1) * employeesPerPage,
    currentPage * employeesPerPage
  );

  const handleModalToggle = () => {
    setModal(!modal);
  };

  const handleUpdateModalToggle = () => {
    setUpdateModal(!updateModal);
    if (updateModal) {
      // Clear update state when closing the modal
      setSelectedEmployee(null);
    }
  };

  // Validation function for all fields
  const validateFields = () => {
    // Removing all validations and always returning true
    return true;
  };

  // Reset function to clear all form fields
  const handleReset = (e) => {
    e.preventDefault();
    setFname("");
    setLname("");
    setEmail("");
    setPhone("");
    setaadharNo("");
    setpanCard("");
    seteducation("");
    setbloodGroup("");
    setjobRole("");
    setgender("");
    setaddress("");
    setbirthDate("");
    setjoiningDate("");
    setstatus("");
    setbankName("");
    setbankAccountNo("");
    setbankIfscCode("");
    setbranchName("");
    setsalary("");
  };

  // Add Employee submission
  const handleAddEmp = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;
    
    if (!subadminId) {
      toast.error("Subadmin session expired. Please login again.");
      return;
    }
    
    try {
      // Create FormData to send to the backend API
      const formData = new URLSearchParams();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('phone', phone); 
      formData.append('aadharNo', aadharNo);
      formData.append('panCard', panCard);
      formData.append('education', education);
      formData.append('bloodGroup', bloodGroup);
      formData.append('jobRole', jobRole);
      formData.append('gender', gender);
      formData.append('address', address);
      formData.append('birthDate', birthDate);
      formData.append('joiningDate', joiningDate);
      formData.append('status', status);
      formData.append('bankName', bankName);
      formData.append('bankAccountNo', bankAccountNo);
      formData.append('bankIfscCode', bankIfscCode);
      formData.append('branchName', branchName);
      formData.append('salary', salary);

      console.log("Sending employee data to backend...");

      // Use the dynamic subadminId from state
      const response = await axios.post(
        `http://localhost:8282/api/subadmin/add-employee/${subadminId}`, 
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log("API response:", response);
      toast.success("Employee Registered Successfully");
      setModal(false);
      handleReset(e);
      
      // Refresh the employee list
      const refreshResponse = await axios.get(`http://localhost:8282/api/employee/${subadminId}/employee/all`);
      setEmployees(refreshResponse.data);
      
    } catch (err) {
      toast.error("Failed to register employee: " + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  // Handle Update Employee submission
  const handleUpdateEmp = async (e) => {
    e.preventDefault();
    if (!validateFields() || !selectedEmployee) return;
    
    if (!subadminId) {
      toast.error("Subadmin session expired. Please login again.");
      return;
    }
    
    try {
      // Create the updated employee object
      const updatedEmployee = {
        empId: selectedEmployee.empId,
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: Number(phone),
        aadharNo: aadharNo,
        panCard: panCard,
        education: education,
        bloodGroup: bloodGroup,
        jobRole: jobRole,
        gender: gender,
        address: address,
        birthDate: birthDate,
        joiningDate: joiningDate,
        status: status,
        bankName: bankName,
        bankAccountNo: bankAccountNo,
        bankIfscCode: bankIfscCode,
        branchName: branchName,
        salary: Number(salary),
        role: "EMPLOYEE"
      };

      console.log("Updating employee data:", updatedEmployee);
      
      // Use the dynamic subadminId from state
      const response = await axios.put(
        `http://localhost:8282/api/employee/${subadminId}/update/${selectedEmployee.empId}`,
        updatedEmployee,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Update API response:", response);
      toast.success("Employee Updated Successfully");
      setUpdateModal(false);
      handleReset(e);
      
      // Refresh the employee list
      const refreshResponse = await axios.get(`http://localhost:8282/api/employee/${subadminId}/employee/all`);
      setEmployees(refreshResponse.data);
      
    } catch (err) {
      toast.error("Failed to update employee: " + (err.response?.data || err.message));
      console.error(err);
    }
  };

  // Delete Employee
  const handleDeleteEmp = async (empId) => {
    if (!subadminId) {
      toast.error("Subadmin session expired. Please login again.");
      return;
    }
    
    try {
      // Get the employee to delete
      const employee = employees.find(e => e.empId === empId);
      if (!employee) {
        toast.error("Employee not found");
        return;
      }
      
      console.log(`Deleting employee with ID: ${empId}`);
      
      // Use the dynamic subadminId from state
      const response = await axios.delete(
        `http://localhost:8282/api/employee/${subadminId}/delete/${empId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("API response:", response);
      toast.success("Employee deleted successfully");
      
      // Refresh the employee list
      const refreshResponse = await axios.get(`http://localhost:8282/api/employee/${subadminId}/employee/all`);
      setEmployees(refreshResponse.data);
      
    } catch (err) {
      toast.error("Failed to delete employee: " + (err.response?.data || err.message));
      console.error(err);
    }
  };

  // When clicking the edit icon, populate update modal with employee info
  const handleEditEmp = (employee) => {
    setSelectedEmployee(employee);
    setFname(employee.firstName);
    setLname(employee.lastName);
    setEmail(employee.email);
    setPhone(employee.phone);
    setaadharNo(employee.aadharNo);
    setpanCard(employee.panCard);
    seteducation(employee.education);
    setbloodGroup(employee.bloodGroup);
    setjobRole(employee.jobRole);
    setgender(employee.gender);
    setaddress(employee.address);
    setbirthDate(employee.birthDate);
    setjoiningDate(employee.joiningDate);
    setstatus(employee.status);
    setbankName(employee.bankName);
    setbankAccountNo(employee.bankAccountNo);
    setbankIfscCode(employee.bankIfscCode);
    setbranchName(employee.branchName);
    setsalary(employee.salary);
    setUpdateModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-400">Employee Management</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors duration-200 flex items-center gap-2"
          onClick={handleModalToggle}
        >
          <span>Add Employee</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 p-4 bg-slate-800 rounded-lg shadow-md border border-slate-700">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="bg-slate-700 text-gray-300 hover:text-white p-2 rounded-md transition-colors"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Employee Table - Desktop View */}
      <div className="hidden md:block mb-6 overflow-x-auto bg-slate-800 rounded-lg shadow-md border border-slate-700">
      {currentEmployees.length > 0 ? (
          <table className="min-w-full divide-y divide-slate-700">
              <thead>
              <tr className="bg-slate-700">
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Emp ID
                  </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Phone
                  </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Job Role
                  </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-700">
                {currentEmployees.map((employee) => (
                <tr key={employee.empId} className="hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{employee.empId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-100">
                            {employee.firstName} {employee.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{employee.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{employee.jobRole}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.status === "Active" ? "bg-green-800 text-green-100" : "bg-red-800 text-red-100"
                    }`}>
                        {employee.status}
                      </span>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditEmp(employee)}
                          className="text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 bg-blue-900/50 rounded-md"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEmp(employee.empId)}
                          className="text-red-400 hover:text-red-300 transition-colors px-2 py-1 bg-red-900/50 rounded-md"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        ) : (
          <div className="text-center py-4 text-gray-400">
            {searchTerm ? "No employees match your search criteria" : "No employees found"}
          </div>
        )}
          </div>

      {/* Employee Cards - Mobile View */}
      <div className="md:hidden grid grid-cols-1 gap-4 mb-6">
        {currentEmployees.length > 0 ? (
          currentEmployees.map((employee) => (
            <div key={employee.empId} className="bg-slate-800 rounded-lg p-4 shadow border border-slate-700">
              <div className="flex justify-between items-start">
                    <div>
                  <h3 className="font-medium text-white">{employee.firstName} {employee.lastName}</h3>
                  <p className="text-sm text-gray-300 mt-1">{employee.email}</p>
                  <div className="flex mt-2 items-center">
                    <span className="text-sm text-gray-400 mr-2">Role:</span>
                    <span className="text-sm text-gray-300">{employee.jobRole}</span>
                    </div>
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-400 mr-2">Status:</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      employee.status === "Active" ? "bg-green-800 text-green-100" : "bg-red-800 text-red-100"
                    }`}>
                      {employee.status}
                    </span>
                  </div>
                    </div>
                <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleEditEmp(employee)}
                    className="p-2 bg-blue-900 text-blue-300 rounded-md"
                    >
                    <CiEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteEmp(employee.empId)}
                    className="p-2 bg-red-900 text-red-300 rounded-md"
                    >
                    <MdDeleteOutline size={18} />
                    </button>
                  </div>
                </div>
              </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-400">
            {searchTerm ? "No employees match your search criteria" : "No employees found"}
          </div>
        )}
        </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center py-3 px-4 bg-slate-800 rounded-lg shadow-md border border-slate-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Showing <span className="font-medium">{Math.min(1 + (currentPage - 1) * employeesPerPage, filteredEmployees.length)}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * employeesPerPage, filteredEmployees.length)}</span> of{' '}
                <span className="font-medium">{filteredEmployees.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600 bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border ${
                      currentPage === i + 1
                        ? 'bg-blue-700 text-white border-blue-600'
                        : 'bg-slate-700 text-gray-300 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600 bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-black opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
            <div className="inline-block align-bottom bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-slate-600">
              <div className="bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-blue-400">Add New Employee</h3>
                  <button
                    onClick={handleModalToggle}
                    className="text-gray-400 hover:text-white"
                  >
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleAddEmp} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                        First Name:
                      </label>
                      <input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFname(e.target.value)}
                        placeholder="Enter your first name"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                        Last Name:
                      </label>
                      <input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLname(e.target.value)}
                        placeholder="Enter your last name"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                        Email ID:
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contact" className="block text-sm font-medium text-gray-300">
                        Contact No:
                      </label>
                      <input
                        id="contact"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your 10-digit contact number"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="aadharNo" className="block text-sm font-medium text-gray-300">
                        Aadhar No:
                      </label>
                      <input
                        id="aadharNo"
                        value={aadharNo}
                        onChange={(e) => setaadharNo(e.target.value)}
                        placeholder="Enter your 12-digit Aadhar number"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="panCard" className="block text-sm font-medium text-gray-300">
                        Pancard No:
                      </label>
                      <input
                        id="panCard"
                        value={panCard}
                        onChange={(e) => setpanCard(e.target.value)}
                        placeholder="Enter your PAN card (e.g., ABCDE1234F)"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="education" className="block text-sm font-medium text-gray-300">
                        Education:
                      </label>
                      <select
                        id="education"
                        value={education}
                        onChange={(e) => seteducation(e.target.value)}
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select education</option>
                        <option value="hsc">HSC</option>
                        <option value="graduate">Graduate</option>
                        <option value="post-graduate">Post Graduate</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-300">
                        Blood Group:
                      </label>
                      <select
                        id="bloodGroup"
                        value={bloodGroup}
                        onChange={(e) => setbloodGroup(e.target.value)}
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select blood group</option>
                        <option value="a+">A+</option>
                        <option value="b+">B+</option>
                        <option value="o+">O+</option>
                        <option value="ab+">AB+</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="jobRole" className="block text-sm font-medium text-gray-300">
                        Job Role:
                      </label>
                      <select
                        id="jobRole"
                        value={jobRole}
                        onChange={(e) => setjobRole(e.target.value)}
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select job role</option>
                        <option value="HR">HR</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="JAVA FULL STACK DEVELOPER">JAVA FULL STACK DEVELOPER</option>
                        <option value="MERN STACK  DEVELOPER">MERN STACK DEVELOPER</option>
                        <option value="SUPERVISOR">SUPERVISOR</option>
                        <option value="DIGITAL MARKETING INTERN">DIGITAL MARKETING INTERN</option>
                        <option value="TELECALLER EXCUTIVE">TELECALLER EXECUTIVE</option>
                        <option value="BACK OFFICE">BACK OFFICE</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-300">
                        Gender:
                      </label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setgender(e.target.value)}
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-300">
                        Address:
                      </label>
                      <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setaddress(e.target.value)}
                        placeholder="Enter your full address"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      ></textarea>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="birthDate" className="block text-sm font-medium text-gray-300">
                        Birth Date:
                      </label>
                      <input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setbirthDate(e.target.value)}
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Select your birth date"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-300">
                        Joining Date:
                      </label>
                      <input
                        id="joiningDate"
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setjoiningDate(e.target.value)}
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Select your joining date"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="status" className="block text-sm font-medium text-gray-300">
                        Status:
                      </label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setstatus(e.target.value)}
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bankName" className="block text-sm font-medium text-gray-300">
                        Bank Name:
                      </label>
                      <input
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setbankName(e.target.value)}
                        placeholder="Enter bank name (alphabets and spaces only)"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bankAccountNo" className="block text-sm font-medium text-gray-300">
                        Bank Account No:
                      </label>
                      <input
                        id="bankAccountNo"
                        value={bankAccountNo}
                        onChange={(e) => setbankAccountNo(e.target.value)}
                        placeholder="Enter your bank account number"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bankIfscCode" className="block text-sm font-medium text-gray-300">
                        Bank IFSC Code:
                      </label>
                      <input
                        id="bankIfscCode"
                        value={bankIfscCode}
                        onChange={(e) => setbankIfscCode(e.target.value.toUpperCase())}
                        placeholder="Enter IFSC code (e.g., ABCD0EF1234)"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="branchName" className="block text-sm font-medium text-gray-300">
                        Branch Name:
                      </label>
                      <input
                        id="branchName"
                        value={branchName}
                        onChange={(e) => setbranchName(e.target.value)}
                        placeholder="Enter branch name"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="salary" className="block text-sm font-medium text-gray-300">
                        Salary:
                      </label>
                      <input
                        id="salary"
                        value={salary}
                        onChange={(e) => setsalary(e.target.value)}
                        placeholder="Enter salary (numeric value)"
                        className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleModalToggle}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-300"
                    >
                      Add Employee
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Employee Modal */}
      {updateModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
            <div className="inline-block align-bottom bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-slate-600">
              <div className="bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-blue-400">Update Employee Information</h3>
            <button
              onClick={handleUpdateModalToggle}
                    className="text-gray-400 hover:text-white"
            >
                    <FaTimes />
            </button>
                </div>
                <form onSubmit={handleUpdateEmp} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstNameUpd" className="block text-sm font-medium text-gray-300" >
                  First Name:
                </label>
                <input
                  id="firstNameUpd"
                  value={firstName}
                  onChange={(e) => setFname(e.target.value)}
                  placeholder="First name"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastNameUpd" className="block text-sm font-medium text-gray-300">
                  Last Name:
                </label>
                <input
                  id="lastNameUpd"
                  value={lastName}
                  onChange={(e) => setLname(e.target.value)}
                  placeholder="Last name"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="emailUpd" className="block text-sm font-medium text-gray-300">
                  Email:
                </label>
                <input
                  id="emailUpd"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="contactUpd" className="block text-sm font-medium text-gray-300">
                  Contact No:
                </label>
                <input
                  id="contactUpd"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contact No"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="aadharNoUpd" className="block text-sm font-medium text-gray-300">
                  Aadhar No:
                </label>
                <input
                  id="aadharNoUpd"
                  value={aadharNo}
                  onChange={(e) => setaadharNo(e.target.value)}
                  placeholder="Aadhar No"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="panCardUpd" className="block text-sm font-medium text-gray-300">
                  Pancard No:
                </label>
                <input
                  id="panCardUpd"
                  value={panCard}
                  onChange={(e) => setpanCard(e.target.value)}
                  placeholder="Enter your PAN card (e.g., ABCDE1234F)"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="educationUpd" className="block text-sm font-medium text-gray-300">
                  Education:
                </label>
                <select
                  id="educationUpd"
                  value={education}
                  onChange={(e) => seteducation(e.target.value)}
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select education</option>
                  <option value="hsc">HSC</option>
                  <option value="graduate">Graduate</option>
                  <option value="post-graduate">Post Graduate</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="bloodGroupUpd" className="block text-sm font-medium text-gray-300">
                  Blood Group:
                </label>
                <select
                  id="bloodGroupUpd"
                  value={bloodGroup}
                  onChange={(e) => setbloodGroup(e.target.value)}
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select blood group</option>
                  <option value="a+">A+</option>
                  <option value="b+">B+</option>
                  <option value="o+">O+</option>
                  <option value="ab+">AB+</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="jobRoleUpd" className="block text-sm font-medium text-gray-300">
                  Job Role:
                </label>
                <select
                  id="jobRoleUpd"
                  value={jobRole}
                  onChange={(e) => setjobRole(e.target.value)}
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select JobRole</option>
                  <option value="HR">HR</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="MERN STACK DEVELOPER">MERN STACK DEVELOPER</option>
                  <option value="SUPERVISOR">SUPERVISOR</option>
                  <option value="DIGITAL MARKETING INTERN">DIGITAL MARKETING INTERN</option>
                  <option value="JAVA FULL STACK">JAVA FULL STACK  DEVELOPER</option>
                  <option value="TELECALLER EXCUTIVE">TELECALLER EXCUTIVE</option>
                  <option value="BACK OFFICE">BACK OFFICE</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="genderUpd" className="block text-sm font-medium text-gray-300">
                  Gender:
                </label>
                <select
                  id="genderUpd"
                  value={gender}
                  onChange={(e) => setgender(e.target.value)}
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="addressUpd" className="block text-sm font-medium text-gray-300">
                  Address:
                </label>
                <textarea
                  id="addressUpd"
                  value={address}
                  onChange={(e) => setaddress(e.target.value)}
                  placeholder="Address Details"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                ></textarea>
              </div>
              <div className="space-y-2">
                <label htmlFor="birthDateUpd" className="block text-sm font-medium text-gray-300">
                  Birth Date:
                </label>
                <input
                  id="birthDateUpd"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setbirthDate(e.target.value)}
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="joiningDateUpd" className="block text-sm font-medium text-gray-300">
                  Joining Date:
                </label>
                <input
                  id="joiningDateUpd"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setjoiningDate(e.target.value)}
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="statusUpd" className="block text-sm font-medium text-gray-300">
                  Status:
                </label>
                <select
                  id="statusUpd"
                  value={status}
                  onChange={(e) => setstatus(e.target.value)}
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="bankNameUpd" className="block text-sm font-medium text-gray-300">
                  Bank Name:
                </label>
                <input
                  id="bankNameUpd"
                  value={bankName}
                  onChange={(e) => setbankName(e.target.value)}
                  placeholder="Bank Name"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="bankAccountNoUpd" className="block text-sm font-medium text-gray-300">
                  Bank Account No:
                </label>
                <input
                  id="bankAccountNoUpd"
                  value={bankAccountNo}
                  onChange={(e) => setbankAccountNo(e.target.value)}
                  placeholder="Account No"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="bankIfscCodeUpd" className="block text-sm font-medium text-gray-300">
                  Bank IFSC Code:
                </label>
                <input
                  id="bankIfscCodeUpd"
                  value={bankIfscCode}
                  onChange={(e) => setbankIfscCode(e.target.value)}
                  placeholder="Enter IFSC code (e.g., ABCD0EF1234"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="branchNameUpd" className="block text-sm font-medium text-gray-300">
                  Branch Name:
                </label>
                <input
                  id="branchNameUpd"
                  value={branchName}
                  onChange={(e) => setbranchName(e.target.value)}
                  placeholder="Branch Name"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="salaryUpd" className="block text-sm font-medium text-gray-300">
                  Salary:
                </label>
                <input
                  id="salaryUpd"
                  value={salary}
                  onChange={(e) => setsalary(e.target.value)}
                  placeholder="Salary"
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
                    </div>
              </div>
              <div className="md:col-span-2 flex justify-center space-x-4">
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-300">
                  Update
                </button>
                <button
                  type="button"
                  onClick={handleUpdateModalToggle}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md transition-colors duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
