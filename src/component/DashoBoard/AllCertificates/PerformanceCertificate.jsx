import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope, FaSearch, FaStar, FaTrophy, FaMedal, FaAward, FaChartLine, FaCheckCircle } from 'react-icons/fa';
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
import { RiMedalLine } from "react-icons/ri";
import { GiLaurelCrown } from "react-icons/gi";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../component/Loading";

const PerformanceCertificate = () => {
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
  const [sendingEmail, setSendingEmail] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  // Certificate state
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeJobTitle: '',
    employeeDepartment: '',
    evaluationPeriod: `January - December ${new Date().getFullYear()}`, 
    performanceHighlights: '',
    achievements: '',
    skillsDemo: '',
    rating: '4.8',
    evaluationDate: new Date().toISOString().split('T')[0],
    signatoryName: '',
    signatoryTitle: '',
    employeeId: '',
    employeeEmail: '',
  });

  const [showEmployeeList, setShowEmployeeList] = useState(false);

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
        const response = await axios.get(`http://localhost:8282/api/subadmin/subadmin-by-email/${email}`);
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
      const response = await axios.get(`http://localhost:8282/api/employee/${subadminId}/employee/all`);
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
    
    // Prefill form with employee data
    setFormData({
      ...formData,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeJobTitle: emp.jobRole || '',
      employeeDepartment: emp.department || 'N/A',
      employeeId: emp.empId || '',
      employeeEmail: emp.email || '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
  });

  const handleDownloadPDF = async () => {
    if (!formData.employeeName) {
      toast.error("Please fill in employee name");
      return;
    }
    
    setPdfGenerating(true);
    try {
      // Wait for images to load and set crossOrigin
      const images = certificateRef.current.querySelectorAll('img');
      images.forEach(img => {
        if (img.src.startsWith('http')) {
          img.crossOrigin = 'Anonymous';
        }
      });
      
      // Add delay to ensure images are loaded
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate PDF
      const certificateElement = certificateRef.current;
      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      // Setup PDF options
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions
      const imgWidth = 190; // A4 width with margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Check if content requires multiple pages
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      if (imgHeight <= pdfHeight) {
        // Content fits on one page
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 1.0),
          'JPEG',
          10,
          10,
          imgWidth,
          imgHeight
        );
      } else {
        // Content needs multiple pages
        let heightLeft = imgHeight;
        let position = 0;
        let page = 0;
        
        while (heightLeft > 0) {
          if (page > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(
            canvas.toDataURL('image/jpeg', 1.0),
            'JPEG',
            10,
            position,
            imgWidth,
            imgHeight
          );
          
          heightLeft -= pdfHeight;
          position -= pdfHeight;
          page++;
        }
      }
      
      // Save PDF
      pdf.save(`${formData.employeeName || 'Employee'}_Performance_Certificate.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!formData.employeeName || !formData.employeeEmail) {
      toast.error("Please fill in employee name and email");
      return;
    }
    
    setSendingEmail(true);
    try {
      // Wait for images to load and set crossOrigin
      const images = certificateRef.current.querySelectorAll('img');
      images.forEach(img => {
        if (img.src.startsWith('http')) {
          img.crossOrigin = 'Anonymous';
        }
      });
      
      // Add delay to ensure images are loaded
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate PDF
      const certificateElement = certificateRef.current;
      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      // Setup PDF options
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions
      const imgWidth = 190; // A4 width with margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      if (imgHeight <= pdfHeight) {
        // Content fits on one page
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 1.0),
          'JPEG',
          10,
          10,
          imgWidth,
          imgHeight
        );
      } else {
        // Content needs multiple pages
        let heightLeft = imgHeight;
        let position = 0;
        let page = 0;
        
        while (heightLeft > 0) {
          if (page > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(
            canvas.toDataURL('image/jpeg', 1.0),
            'JPEG',
            10,
            position,
            imgWidth,
            imgHeight
          );
          
          heightLeft -= pdfHeight;
          position -= pdfHeight;
          page++;
        }
      }
      
      // Get the PDF as blob
      const pdfBlob = pdf.output('blob');
      
      // Create form data
      const formDataToSend = new FormData();
      formDataToSend.append('to', formData.employeeEmail);
      formDataToSend.append('subject', `Performance Certificate for ${formData.employeeName}`);
      formDataToSend.append('text', `Dear ${formData.employeeName},\n\nPlease find attached your Performance Certificate.\n\nBest regards,\n${subadmin?.companyName || 'Company'}`);
      formDataToSend.append('file', pdfBlob, `${formData.employeeName || 'Employee'}_Performance_Certificate.pdf`);
      
      // Send email
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8282'}/api/sendEmailWithAttachment`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Email sent successfully!");
      } else {
        throw new Error(response.data.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard/certificates');
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
              disabled={pdfGenerating}
            >
              <FaPrint className="mr-2" /> Print
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300 flex items-center"
              disabled={pdfGenerating}
            >
              <FaDownload className="mr-2" /> {pdfGenerating ? 'Generating...' : 'Download'}
            </button>
            <button 
              onClick={handleSendEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300 flex items-center"
              disabled={sendingEmail || !selectedEmployee}
            >
              <FaEnvelope className="mr-2" /> {sendingEmail ? 'Sending...' : 'Email'}
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
              <h2 className="text-xl font-bold mb-4 text-center">Performance Certificate Details</h2>
              
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
                <label className="block text-sm font-medium mb-1">Evaluation Period</label>
                <input 
                  type="text" 
                  name="evaluationPeriod"
                  value={formData.evaluationPeriod}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="e.g., January - December 2023"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Evaluation Date</label>
                <input 
                  type="date" 
                  name="evaluationDate"
                  value={formData.evaluationDate}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                />
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
                  placeholder="Key areas where the employee excelled"
                  rows="3"
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notable Achievements</label>
                <textarea 
                  name="achievements"
                  value={formData.achievements}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Specific accomplishments during the evaluation period"
                  rows="3"
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Skills Demonstrated</label>
                <textarea 
                  name="skillsDemo"
                  value={formData.skillsDemo}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Key skills showcased during this period"
                  rows="2"
                ></textarea>
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
                <div>
                  <label className="block text-sm font-medium mb-1">Signatory Title</label>
                  <input 
                    type="text" 
                    name="signatoryTitle"
                    value={formData.signatoryTitle}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Your Title"
                  />
                </div>
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
                  background: 'linear-gradient(120deg, rgba(255,255,255,1) 0%, rgba(245,250,255,1) 100%)',
                  overflow: 'hidden'
                }}
              >
                {/* Background Design Elements */}
                <div className="absolute top-0 left-0 right-0 h-40 overflow-hidden opacity-5 z-0">
                  <div className="flex justify-center">
                    {[...Array(12)].map((_, i) => (
                      <FaTrophy key={i} className="text-indigo-700 text-6xl mx-8 transform rotate-45" />
                    ))}
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-40 overflow-hidden opacity-5 z-0">
                  <div className="flex justify-center">
                    {[...Array(12)].map((_, i) => (
                      <FaAward key={i} className="text-indigo-700 text-6xl mx-8 transform -rotate-45" />
                    ))}
                  </div>
                </div>
                
                {/* Decorative Border */}
                <div className="absolute inset-0 border-[15px] border-double border-indigo-100 pointer-events-none z-0"></div>
                <div className="absolute inset-[15px] border-[1px] border-indigo-200 pointer-events-none z-0"></div>
                
                {/* Diagonal Corner Decorations */}
                <div className="absolute top-0 left-0 w-40 h-40 overflow-hidden opacity-10 z-0">
                  <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-600 transform -translate-x-20 -translate-y-20 rotate-45"></div>
                </div>
                
                <div className="absolute top-0 right-0 w-40 h-40 overflow-hidden opacity-10 z-0">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600 transform translate-x-20 -translate-y-20 -rotate-45"></div>
                </div>
                
                <div className="absolute bottom-0 left-0 w-40 h-40 overflow-hidden opacity-10 z-0">
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-600 transform -translate-x-20 translate-y-20 -rotate-45"></div>
                </div>
                
                <div className="absolute bottom-0 right-0 w-40 h-40 overflow-hidden opacity-10 z-0">
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-600 transform translate-x-20 translate-y-20 rotate-45"></div>
                </div>
                
                {/* Certificate Content */}
                <div className="relative z-10 mt-6">
                  {/* Company Header */}
                  <div className="flex justify-center mb-4">
                    {subadmin && subadmin.companylogo && (
                      <img 
                        src={`http://localhost:8282/images/profile/${subadmin.companylogo}`} 
                        alt="Company Logo" 
                        className="h-24 object-contain" 
                        onError={(e) => {
                          console.error('Error loading logo:', e);
                          e.target.src = 'https://via.placeholder.com/200x80?text=Company+Logo';
                        }}
                      />
                    )}
                  </div>
                  
                  <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold text-indigo-800">
                      {subadmin?.registercompanyname || "Your Company Name"}
                    </h1>
                    <p className="text-sm text-gray-600">{subadmin?.address || "Company Address"}</p>
                  </div>
                  
                  {/* Certificate Title with decorative elements */}
                  <div className="text-center mb-6 relative">
                    <div className="inline-block relative px-4">
                      <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 border-b-2 border-indigo-300"></div>
                      <h2 className="relative z-10 text-3xl font-bold uppercase tracking-wider text-indigo-800 bg-white px-6 inline-block">
                        Performance Certificate
                      </h2>
                    </div>
                    
                    <div className="flex justify-center mt-3">
                      <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                    </div>
                  </div>
                  
                  {/* Award Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-indigo-50 border border-indigo-100">
                      <GiLaurelCrown className="text-6xl text-indigo-600" />
                    </div>
                  </div>
                  
                  {/* Certificate Body */}
                  <div className="mb-8 px-12 text-center">
                    <p className="text-lg mb-5 font-serif leading-relaxed text-gray-800">
                      This certifies that
                    </p>
                    
                    <h2 className="text-4xl font-bold mb-3 text-indigo-800 font-serif" style={{ fontFamily: 'Cambria, serif' }}>
                      {formData.employeeName || "[Employee Name]"}
                    </h2>
                    
                    <p className="mb-5 text-gray-700 font-serif italic text-lg">
                      {formData.employeeJobTitle || "[Job Title]"} • {formData.employeeDepartment || "[Department]"}
                    </p>
                    
                    <p className="mb-5 text-lg font-serif leading-relaxed text-gray-800">
                      has demonstrated exceptional performance and achieved excellence during the
                      <br />
                      <span className="font-semibold text-indigo-700">{formData.evaluationPeriod || "evaluation period"}</span>
                    </p>
                    
                    {/* Rating Display */}
                    <div className="mb-6 flex flex-col items-center">
                      <p className="mb-2 text-lg font-medium text-gray-800">Performance Rating</p>
                      <div className="flex justify-center space-x-2 text-3xl mb-1">
                        {renderStarRating(parseFloat(formData.rating))}
                      </div>
                      <p className="text-2xl font-bold text-indigo-600">{formData.rating}/5.0</p>
                    </div>
                    
                    {/* Performance Sections */}
                    <div className="grid grid-cols-1 gap-4 mb-6">
                      {/* Performance Highlights */}
                      <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100">
                        <h3 className="text-xl font-semibold text-indigo-800 mb-3 flex items-center justify-center">
                          <FaAward className="mr-2 text-indigo-600" /> Performance Highlights
                        </h3>
                        <p className="text-gray-700 italic">
                          {formData.performanceHighlights || "Consistently exceeds expectations, demonstrates excellent work quality, and maintains a high standard of professionalism. Takes initiative and shows outstanding teamwork abilities."}
                        </p>
                      </div>
                      
                      {/* Achievements */}
                      {formData.achievements && (
                        <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100">
                          <h3 className="text-xl font-semibold text-indigo-800 mb-3 flex items-center justify-center">
                            <FaTrophy className="mr-2 text-indigo-600" /> Notable Achievements
                          </h3>
                          <p className="text-gray-700 italic">
                            {formData.achievements}
                          </p>
                        </div>
                      )}
                      
                      {/* Skills */}
                      {formData.skillsDemo && (
                        <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100">
                          <h3 className="text-xl font-semibold text-indigo-800 mb-3 flex items-center justify-center">
                            <FaChartLine className="mr-2 text-indigo-600" /> Skills Demonstrated
                          </h3>
                          <p className="text-gray-700 italic">
                            {formData.skillsDemo}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <p className="mb-2 text-lg font-serif leading-relaxed">
                      This certificate recognizes the outstanding contributions and commitment 
                      to excellence demonstrated throughout the evaluation period.
                    </p>
                  </div>
                  
                  {/* Date and Signature */}
                  <div className="flex justify-between items-start px-10 mb-4">
                    <div>
                      <p className="font-semibold text-gray-800">Date of Issue:</p>
                      <p className="text-gray-700">{new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 mb-2">Authorized Signatory:</p>
                      {subadmin && subadmin.signature ? (
                        <div>
                          <img 
                            src={`http://localhost:8282/images/profile/${subadmin.signature}`} 
                            alt="Signature" 
                            className="h-16 object-contain ml-auto mb-2" 
                            onError={(e) => {
                              console.error('Error loading signature:', e);
                              e.target.src = 'https://via.placeholder.com/150x50?text=Signature';
                            }}
                          />
                          <div className="border-b border-gray-400 w-48 mb-2 ml-auto"></div>
                          <p className="font-semibold text-gray-800">{formData.signatoryName || (subadmin ? `${subadmin.name} ${subadmin.lastname}` : "[Signatory Name]")}</p>
                          <p className="text-sm text-gray-600">{formData.signatoryTitle || "[Signatory Title]"}</p>
                        </div>
                      ) : (
                        <div>
                          <div className="h-16 mb-2"></div>
                          <div className="border-b border-gray-400 w-48 mb-2 ml-auto"></div>
                          <p className="font-semibold text-gray-800">{formData.signatoryName || (subadmin ? `${subadmin.name} ${subadmin.lastname}` : "[Signatory Name]")}</p>
                          <p className="text-sm text-gray-600">{formData.signatoryTitle || "[Signatory Title]"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Company Stamp */}
                  {subadmin && subadmin.stampImg && (
                    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                      <div className="p-1 rounded-lg bg-white/90 border border-gray-200 shadow-sm">
                        <img 
                          src={`http://localhost:8282/images/profile/${subadmin.stampImg}`} 
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
                  <div className="mt-16 text-center">
                    <div className="mb-2">
                      <div className="border-t border-indigo-200 w-2/3 mx-auto mb-2"></div>
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

export default PerformanceCertificate; 