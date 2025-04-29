import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope, FaSearch, FaStar, FaMedal, FaTrophy, FaAward } from 'react-icons/fa';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import "./Experience.css";
import { useReactToPrint } from "react-to-print";
import '../../../assets/css/certificate.css';
import '../../../assets/css/sideBar.css';
import { BsSearch } from "react-icons/bs";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { FiPrinter } from "react-icons/fi";
import { AiOutlineMail } from "react-icons/ai";
import { MdOutlineStarPurple500 } from "react-icons/md";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../component/Loading";

const PostAppraisal = () => {
  const { isDarkMode } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [subadmin, setSubadmin] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const certificateRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  // Certificate state
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeJobTitle: '',
    employeeDepartment: '',
    appraisalDate: new Date().toISOString().split('T')[0],
    currentSalary: '',
    newSalary: '',
    percentage: '',
    rating: '4.5',
    performanceHighlights: '',
    areasOfImprovement: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    signatoryName: '',
    signatoryTitle: '',
    employeeId: '',
    designation: '',
    joiningDate: '',
    appraisalReasons: "The increment is based on your exemplary performance, dedication, and valuable contributions to the organization during the past review period.",
    contactPerson: '',
    contactEmail: '',
    signatoryDesignation: '',
  });

  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  // Fetch subadmin data by email
  useEffect(() => {
    const fetchSubadminByEmail = async () => {
      try {
        setLoading(true);
        console.log("Fetching subadmin data...");
        
        // Get the logged-in user from localStorage
        const user = JSON.parse(localStorage.getItem("user")) || {};
        // Use the logged-in user's email or fallback to hardcoded one
        const email = user.email || "arbaj.shaikh2034@gmail.com";
        
        console.log("Fetching subadmin data for email:", email);
        const response = await axios.get(`https://api.aimdreamplanner.com/api/subadmin/subadmin-by-email/${email}`);
        console.log("Subadmin API Response:", response.data);
        setSubadmin(response.data);
        fetchEmployees(response.data.id);
      } catch (error) {
        console.error('Error fetching subadmin:', error);
        setApiError(true);
        toast.error('Failed to fetch company details. Please check API connection.');
        setLoading(false);
      }
    };

    fetchSubadminByEmail();
  }, []);

  // Fetch employees for this subadmin
  const fetchEmployees = async (subadminId) => {
    try {
      console.log(`Fetching employees for subadmin ID: ${subadminId}`);
      const response = await axios.get(`https://api.aimdreamplanner.com/api/employee/${subadminId}/employee/all`);
      console.log("Employees API Response:", response.data);
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    
    if (value.length > 0) {
      const filtered = employees.filter(emp => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(value.toLowerCase()) ||
        emp.email.toLowerCase().includes(value.toLowerCase()) ||
        emp.jobRole.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredEmployees(filtered);
      setShowEmployeeList(true);
    } else {
      setFilteredEmployees([]);
      setShowEmployeeList(false);
    }
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setSearchTerm(`${emp.firstName} ${emp.lastName}`);
    setShowDropdown(false);
    
    // Calculate percentage increase assuming current salary is available
    const currentSalary = emp.salary || '0';
    
    // Prefill form with employee data
    setFormData({
      ...formData,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeJobTitle: emp.jobRole,
      employeeDepartment: emp.department || 'N/A',
      currentSalary: currentSalary,
      employeeId: emp.empId,
      designation: emp.designation,
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : "",
      // Other fields remain as entered by the user
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'currentSalary' || name === 'newSalary') {
      const updatedData = {
        ...formData,
        [name]: value,
      };
      
      // Calculate percentage if both salaries are entered
      if (updatedData.currentSalary && updatedData.newSalary) {
        const current = parseFloat(updatedData.currentSalary);
        const newSal = parseFloat(updatedData.newSalary);
        
        if (current > 0 && newSal > 0) {
          const percentageIncrease = ((newSal - current) / current) * 100;
          updatedData.percentage = percentageIncrease.toFixed(2);
        }
      }
      
      setFormData(updatedData);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Calculate new salary when current salary or appraisal percentage changes
    if (name === "currentSalary" || name === "percentage") {
      const currentSalary = name === "currentSalary" ? parseFloat(value) || 0 : parseFloat(formData.currentSalary) || 0;
      const percentage = name === "percentage" ? parseFloat(value) || 0 : parseFloat(formData.percentage) || 0;
      
      const newSalary = currentSalary + (currentSalary * percentage / 100);
      
      setFormData(prev => ({
        ...prev,
        newSalary: newSalary.toFixed(2)
      }));
    }
  };

  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
    documentTitle: `${formData.employeeName || 'Employee'}_Post_Appraisal`,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 2000);
      });
    },
    onAfterPrint: () => {
      toast.success("Certificate printed successfully!");
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .certificate-container {
          width: 100%;
          height: 100%;
          page-break-after: avoid;
          page-break-before: avoid;
        }
      }
    `,
  });

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    setPdfGenerating(true);
    try {
      const a4WidthPx = 794;
      const a4HeightPx = 1123;
      const certificateContainer = certificateRef.current;

      // Calculate scale factor to fit all content within A4 height
      const contentHeight = certificateContainer.scrollHeight;
      const scale = Math.min(1, a4HeightPx / contentHeight);

      const originalStyle = {
        width: certificateContainer.style.width,
        height: certificateContainer.style.height,
        transform: certificateContainer.style.transform,
        transformOrigin: certificateContainer.style.transformOrigin,
        overflow: certificateContainer.style.overflow,
      };

      certificateContainer.style.width = `${a4WidthPx}px`;
      certificateContainer.style.height = 'auto';
      certificateContainer.style.transform = `scale(${scale})`;
      certificateContainer.style.transformOrigin = 'top left';
      certificateContainer.style.overflow = 'visible';

      await new Promise(resolve => setTimeout(resolve, 800)); // Wait for reflow

      const canvas = await html2canvas(certificateContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff'
      });

      // Restore original styles
      certificateContainer.style.width = originalStyle.width;
      certificateContainer.style.height = originalStyle.height;
      certificateContainer.style.transform = originalStyle.transform;
      certificateContainer.style.transformOrigin = originalStyle.transformOrigin;
      certificateContainer.style.overflow = originalStyle.overflow;

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [a4WidthPx, a4HeightPx]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, a4WidthPx, a4HeightPx);
      pdf.save('Employee_Post_Appraisal.pdf');
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!certificateRef.current || !selectedEmployee || !subadmin) {
      toast.error('Missing required data.');
      return;
    }
    setSendingEmail(true);
    try {
      // Generate PDF as Blob
      const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [794, 1123] });
      pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 794, 1123);
      const pdfBlob = pdf.output('blob');

      // Prepare FormData
      const formDataToSend = new FormData();
      formDataToSend.append('file', pdfBlob, 'PostAppraisal.pdf');
      Object.entries(formData).forEach(([key, value]) => formDataToSend.append(key, value));

      // Compose API endpoint
      const employeeFullName = `${selectedEmployee.firstName} ${selectedEmployee.lastName}`;
      const apiUrl = `https://api.aimdreamplanner.com/api/certificate/send/${subadmin.id}/${encodeURIComponent(employeeFullName)}/postAppraisal`;

      // Send to backend
      await axios.post(apiUrl, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Certificate sent successfully!');
    } catch (error) {
      toast.error('Failed to send certificate.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard/certificates');
    console.log("Navigating back to certificates page");
  };

  // Generate star rating elements
  const renderStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-500" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStar key={i} className="text-yellow-300" />);
      } else {
        stars.push(<FaStar key={i} className="text-gray-300" />);
      }
    }

    return stars;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`p-4 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-800'}`}
    >
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={handleBackClick}
            className="flex items-center text-blue-500 hover:text-blue-700 transition duration-300"
          >
            <FaArrowLeft className="mr-2" /> Back to Certificates
          </button>
          
          <div className="flex space-x-3">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition duration-300 flex items-center"
            >
              <FaPrint className="mr-2" /> Print
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300 flex items-center"
            >
              <FaDownload className="mr-2" /> Download
            </button>
            <button 
              onClick={handleSendEmail}
              disabled={sendingEmail}
              style={{ marginLeft: '12px', background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: sendingEmail ? 'not-allowed' : 'pointer' }}
            >
              {sendingEmail ? 'Sending...' : (<><FaEnvelope style={{ marginRight: 6, verticalAlign: 'middle' }}/>Send Email</>)}
            </button>
          </div>
        </div>

        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded">
            <p>Failed to connect to the API. Some features might be limited.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
              <h2 className="text-xl font-bold mb-4 text-center">Post Appraisal Certificate Details</h2>
              
              {subadmin && (
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2">Company Information</h3>
                  <div className="p-3 rounded border bg-opacity-50 bg-blue-50 border-blue-200">
                    <p className="font-semibold">{subadmin.registercompanyname}</p>
                    <p className="text-sm">{subadmin.address}</p>
                    <p className="text-sm">GST: {subadmin.gstno}</p>
                  </div>
                </div>
              )}
              
              <div className="mb-4 relative" ref={autocompleteRef}>
                <label className="block text-sm font-medium mb-1">Search Employee</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={`w-full p-2 pr-10 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Search by name, email or job role"
                  />
                  <BsSearch className="absolute right-3 top-3 text-gray-400" />
                </div>
                
                {showEmployeeList && filteredEmployees.length > 0 && (
                  <div className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'} border`}>
                    {filteredEmployees.map(emp => (
                      <div 
                        key={emp.empId} 
                        className={`p-2 cursor-pointer hover:bg-blue-100 hover:text-blue-800 ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-blue-50'}`}
                        onClick={() => handleSelectEmployee(emp)}
                      >
                        <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs flex justify-between">
                          <span>{emp.jobRole}</span>
                          <span className={`px-2 rounded-full text-xs ${emp.status === 'Active' || emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {emp.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {showEmployeeList && searchTerm && filteredEmployees.length === 0 && (
                  <div className={`absolute z-10 w-full mt-1 p-2 rounded-md shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'} border`}>
                    No employees found
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Employee Name</label>
                <input 
                  type="text" 
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job Title</label>
                  <input 
                    type="text" 
                    name="employeeJobTitle"
                    value={formData.employeeJobTitle}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Position/Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input 
                    type="text" 
                    name="employeeDepartment"
                    value={formData.employeeDepartment}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Department"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Appraisal Date</label>
                <input 
                  type="date" 
                  name="appraisalDate"
                  value={formData.appraisalDate}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Salary</label>
                  <input 
                    type="number" 
                    name="currentSalary"
                    value={formData.currentSalary}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Current Salary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Salary</label>
                  <input 
                    type="number" 
                    name="newSalary"
                    value={formData.newSalary}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="New Salary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Increase (%)</label>
                  <input 
                    type="text" 
                    name="percentage"
                    value={formData.percentage}
                    readOnly
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'} bg-gray-100`}
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Performance Rating (out of 5)</label>
                <input 
                  type="number" 
                  name="rating"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                />
                <div className="flex justify-center mt-2">
                  {renderStarRating(parseFloat(formData.rating))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Performance Highlights</label>
                <textarea 
                  name="performanceHighlights"
                  value={formData.performanceHighlights}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Key achievements and strengths"
                  rows="3"
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Areas of Improvement</label>
                <textarea 
                  name="areasOfImprovement"
                  value={formData.areasOfImprovement}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Focus areas for further development"
                  rows="2"
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Effective Date</label>
                <input 
                  type="date" 
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Signatory Name</label>
                  <input 
                    type="text" 
                    name="signatoryName"
                    value={formData.signatoryName || (subadmin ? `${subadmin.name} ${subadmin.lastname}` : "")}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Your Name"
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium mb-1">Signatory Title</label>
                  <input 
                    type="text" 
                    name="signatoryTitle"
                    value={formData.signatoryTitle}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Your Title"
                  />
                </div> */}
              </div>
            </div>
          </div>

          {/* Certificate Preview */}
          <div className="lg:col-span-2">
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white'} mb-4`}>
              <h2 className="text-xl font-bold mb-4">Certificate Preview</h2>
              
              <div 
                ref={certificateRef}
                className="bg-white text-black relative"
                style={{ 
                  width: '21cm', 
                  minHeight: '29.7cm',
                  margin: '0 auto',
                  padding: '1cm',
                  position: 'relative',
                  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(245,245,255,1) 100%)',
                  overflow: 'hidden'
                }}
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-40 overflow-hidden opacity-10 z-0">
                  <div className="flex">
                    {[...Array(20)].map((_, i) => (
                      <FaStar key={i} className="text-blue-500 text-6xl mx-8 transform rotate-45" />
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-0 right-0 w-full h-40 overflow-hidden opacity-10 z-0">
                  <div className="flex">
                    {[...Array(20)].map((_, i) => (
                      <FaStar key={i} className="text-blue-500 text-6xl mx-8 transform rotate-45" />
                    ))}
                  </div>
                </div>
                
                {/* Decorative Border */}
                <div className="absolute inset-0 border-[20px] border-double border-blue-100 pointer-events-none"></div>
                
                {/* Certificate Content */}
                <div className="relative z-10 mt-6">
                  {/* Company Header */}
                  <div className="flex justify-center mb-4">
                    {subadmin && subadmin.companylogo && (
                      <img 
                        src={`https://api.aimdreamplanner.com/images/profile/${subadmin.companylogo}`} 
                        alt="Company Logo" 
                        className="h-20 object-contain" 
                        onError={(e) => {
                          console.error('Error loading logo:', e);
                          e.target.src = 'https://via.placeholder.com/200x80?text=Company+Logo';
                        }}
                      />
                    )}
                  </div>
                  
                  <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-blue-800">
                      {subadmin?.registercompanyname || "Your Company Name"}
                    </h1>
                    <p className="text-sm text-gray-600">{subadmin?.address || "Company Address"}</p>
                  </div>
                  
                  {/* Certificate Title */}
                  <div className="text-center mb-8">
                    <div className="inline-block border-b-2 border-t-2 border-blue-800 px-6 py-2">
                      <h2 className="text-3xl font-bold uppercase tracking-wider text-blue-800">Post Appraisal Certificate</h2>
                    </div>
                  </div>

                  {/* Decorative Elements - Medals and Icons */}
                  <div className="flex justify-between mb-6">
                    <FaMedal style={{ color: '#FFD700', fontSize: '2.25rem', opacity: 1 }} />
                    <FaTrophy style={{ color: '#FFD700', fontSize: '2.25rem', opacity: 1 }} />
                  </div>
                  
                  {/* Certificate Body */}
                  <div className="mb-8 px-8 text-center">
                    <p className="text-lg mb-4 font-serif leading-relaxed">
                      This is to certify that
                    </p>
                    
                    <h2 className="text-3xl font-bold mb-2 text-blue-800 font-serif">{formData.employeeName || "[Employee Name]"}</h2>
                    
                    <p className="mb-3 text-gray-600 font-serif italic">
                      {formData.employeeJobTitle || "[Job Title]"} • {formData.employeeDepartment || "[Department]"}
                    </p>
                    
                    <p className="mb-6 text-lg font-serif leading-relaxed">
                      has successfully completed the annual performance review on {formData.appraisalDate ? new Date(formData.appraisalDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : "[Appraisal Date]"} 
                      and has been awarded a performance rating of:
                    </p>
                    
                    {/* Rating Stars */}
                    <div className="flex justify-center space-x-2 mb-6 text-4xl">
                      {renderStarRating(parseFloat(formData.rating))}
                    </div>
                    
                    <div
                      style={{
                        background: '#f0f4fa',
                        borderRadius: '16px',
                        border: '2px solid red', // DEBUG ONLY
                        padding: '24px',
                        marginBottom: '24px',
                        color: '#222',
                        opacity: 1,
                        zIndex: 10,
                        position: 'relative',
                        boxSizing: 'border-box',
                        width: '100%'
                      }}
                    >
                      <h3 style={{ fontSize: '2rem', fontWeight: 600, color: '#2056b3', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span><svg width="28" height="28" viewBox="0 0 24 24" fill="#2056b3" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C10.343 2 9 3.343 9 5C9 6.657 10.343 8 12 8C13.657 8 15 6.657 15 5C15 3.343 13.657 2 12 2ZM12 10C7.589 10 4 13.589 4 18H20C20 13.589 16.411 10 12 10Z"/></svg></span>
                        Performance Highlights
                      </h3>
                      <p style={{ fontStyle: 'italic', fontSize: '1.1rem', textAlign: 'center', margin: 0 }}>
                        {formData.performanceHighlights || "Exceptional work quality, team collaboration, meeting deadlines, and innovative problem-solving."}
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-blue-800 mb-2">Compensation Review</h3>
                      {formData.currentSalary && formData.newSalary ? (
                        <p className="text-gray-700">
                          Based on performance evaluation, a salary increase of <span className="font-bold text-green-600">{formData.percentage}%</span> has been approved,
                          raising the compensation from <span className="font-semibold">{formData.currentSalary}</span> to <span className="font-semibold">{formData.newSalary}</span>,
                          effective from {formData.effectiveDate ? new Date(formData.effectiveDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : "[Effective Date]"}.
                        </p>
                      ) : (
                        <p className="text-gray-700 italic">
                          Compensation details will be provided separately.
                        </p>
                      )}
                    </div>
                    
                    <p className="mb-2 text-lg font-serif">
                      We appreciate your valuable contributions to the organization and look forward to your continued excellence.
                    </p>
                  </div>
                  
                  {/* Date and Signature */}
                  <div className="flex justify-between items-start px-8 mb-4">
                    <div>
                      <p className="font-semibold">Date of Issue:</p>
                      <p>{new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                    <div className="text-right">
                      {subadmin && subadmin.signature ? (
                        <div className="flex flex-col items-end">
                          <img 
                            src={`https://api.aimdreamplanner.com/images/profile/${subadmin.signature}`} 
                            alt="Signature" 
                            className="h-16 object-contain ml-auto mb-2" 
                            onError={(e) => {
                              console.error('Error loading signature:', e);
                              e.target.src = 'https://via.placeholder.com/150x50?text=Signature';
                            }}
                          />
                          <div className="border-b border-gray-400 w-48 mb-2 ml-auto"></div>
                          <p className="font-semibold text-gray-800 mt-2">{formData.signatoryName || (subadmin ? `${subadmin.name} ${subadmin.lastname}` : "[Signatory Name]")}</p>
                          <p className="font-semibold text-gray-800 mb-2">Authorized Signatory:</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <div className="h-16 mb-2"></div>
                          <div className="border-b border-gray-400 w-48 mb-2 ml-auto"></div>
                          <p className="font-semibold text-gray-800 mt-2">{formData.signatoryName || (subadmin ? `${subadmin.name} ${subadmin.lastname}` : "[Signatory Name]")}</p>
                          <p className="font-semibold text-gray-800 mb-2">Authorized Signatory:</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Company Stamp */}
                  {subadmin && subadmin.stampImg && (
                    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                      <div className="p-1 rounded-lg bg-white/90 border border-gray-200 shadow-sm">
                        <img 
                          src={`https://api.aimdreamplanner.com/images/profile/${subadmin.stampImg}`} 
                          alt="Company Stamp" 
                          className="h-32 w-32 object-contain" 
                          style={{ 
                            imageRendering: 'crisp-edges',
                            filter: 'contrast(1.05)'
                          }}
                          onError={(e) => {
                            console.error('Error loading stamp:', e);
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <p className="mt-2 text-black font-semibold text-sm">Company Stamp</p>
                    </div>
                  )}
                  
                  {/* Certificate Footer */}
                  <div className="mt-12 text-center">
                    <div className="mb-2">
                      <div className="border-t border-blue-300 w-1/2 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">This certificate is computer generated and does not require a physical signature.</p>
                    </div>
                    <p className="text-xs text-gray-500">Certificate ID: {Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PostAppraisal; 