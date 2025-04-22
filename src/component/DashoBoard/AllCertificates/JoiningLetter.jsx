import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const JoiningLetter = () => {
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
  const letterRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeJobTitle: '',
    employeeDepartment: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: '',
    workHours: '',
    probationPeriod: '3 months',
    benefits: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    signatoryName: '',
    signatoryTitle: '',
    employeeEmail: ''
  });

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

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
    } else {
      setFilteredEmployees([]);
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
      employeeJobTitle: emp.jobRole,
      employeeDepartment: emp.department || 'N/A',
      joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
      // Other fields remain as entered by the user
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!letterRef.current) return;
    
    setPdfGenerating(true);
    try {
      // First check and fix any image with missing dimensions
      const images = letterRef.current.querySelectorAll('img');
      
      // Create array of promises to ensure all images are loaded properly
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve, reject) => {
          // Skip if image is already loaded with valid dimensions
          if (img.complete && img.naturalWidth > 0) {
            img.crossOrigin = 'Anonymous';
            return resolve();
          }
          
          // Set crossOrigin before setting src
          img.crossOrigin = 'Anonymous';
          
          // Add event listeners for load and error
          img.onload = () => {
            console.log(`Image loaded: ${img.src}, dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
            resolve();
          };
          
          img.onerror = (err) => {
            console.error(`Error loading image: ${img.src}`, err);
            // Try to set a placeholder instead of failing
            img.src = 'https://via.placeholder.com/150x50?text=Image+Error';
            // Still resolve to not block the PDF generation
            resolve();
          };
          
          // If image src is relative path to profile image, convert to absolute URL
          if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
            const newSrc = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            console.log(`Converting relative URL to absolute: ${img.src} -> ${newSrc}`);
            img.src = newSrc;
          } else {
            // Force reload by setting the same src
            const currentSrc = img.src;
            img.src = currentSrc;
          }
        });
      });
      
      // Wait for all images to be properly loaded
      await Promise.all(imagePromises);
      console.log('All images loaded successfully');
      
      // Wait additional time to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set proper constraints on images to prevent them from being too large in PDF
      letterRef.current.querySelectorAll('img').forEach(img => {
        // Preserve original image classes but ensure max dimensions are set
        if (img.classList.contains('h-20')) {
          // Company logo shouldn't be more than 80px high in the PDF
          img.style.maxHeight = '80px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '200px';
          img.style.objectFit = 'contain';
        } else if (img.classList.contains('h-16')) {
          // Signature shouldn't be more than 60px high
          img.style.maxHeight = '60px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '180px';
          img.style.objectFit = 'contain';
        } else if (img.classList.contains('h-32') || img.src.includes('stampImg')) {
          // Stamp shouldn't be more than 100px in any dimension
          img.style.maxHeight = '100px';
          img.style.maxWidth = '100px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.objectFit = 'contain';
        }
      });
      
      // Generate the PDF with html2canvas using exact sizing
      const options = {
        scale: 1.5, // Lower scale for better text/image ratio
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging for production
        imageTimeout: 15000,
        removeContainer: false,
        foreignObjectRendering: false,
        letterRendering: true,
        onclone: (clonedDoc) => {
          // Process all images in the cloned document to ensure proper sizing
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach(img => {
            img.crossOrigin = 'Anonymous';
            
            // Make sure the cloned document has the same image size constraints
            if (img.classList.contains('h-20')) {
              img.style.maxHeight = '80px';
              img.style.height = 'auto';
              img.style.width = 'auto';
              img.style.maxWidth = '200px';
            } else if (img.classList.contains('h-16')) {
              img.style.maxHeight = '60px';
              img.style.height = 'auto';
              img.style.width = 'auto';
              img.style.maxWidth = '180px';
            } else if (img.classList.contains('h-32') || img.src.includes('stampImg')) {
              img.style.maxHeight = '100px';
              img.style.maxWidth = '100px';
              img.style.height = 'auto';
              img.style.width = 'auto';
            }
            
            // Ensure any remaining images with no dimensions get defaults
            if (!img.style.width && !img.hasAttribute('width') && img.naturalWidth) {
              const maxWidth = Math.min(img.naturalWidth, 200);
              img.style.width = `${maxWidth}px`;
            }
            if (!img.style.height && !img.hasAttribute('height') && img.naturalHeight) {
              const maxHeight = Math.min(img.naturalHeight, 100);
              img.style.height = `${maxHeight}px`;
            }
            
            // Fix image URLs for server resources
            if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
              img.src = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            }
          });
        }
      };
      
      const canvas = await html2canvas(letterRef.current, options);
      
      // Check if canvas has valid dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Generated canvas has invalid dimensions (width or height is 0)');
      }
      
      // Create PDF with precise A4 sizing
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Convert the canvas to an image with high quality
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Calculate dimensions to maintain aspect ratio but fit on A4
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Handle multi-page if content is long
      if (imgHeight <= pdfHeight) {
        // Content fits on one page - add with centering
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          0,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
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
            imgData,
            'JPEG',
            0,
            position,
            imgWidth,
            imgHeight,
            undefined,
            'FAST'
          );
          
          heightLeft -= pdfHeight;
          position -= pdfHeight;
          page++;
        }
      }
      
      pdf.save(`${formData.employeeName || 'Employee'}_Joining_Letter.pdf`);
      toast.success("PDF successfully downloaded!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF: " + error.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!formData.employeeEmail) {
      toast.error('Please provide employee email');
      return;
    }
    
    setEmailSending(true);
    try {
      // First check and fix any image with missing dimensions
      const images = letterRef.current.querySelectorAll('img');
      console.log(`Found ${images.length} images in the letter for email`);
      
      // Create array of promises to ensure all images are loaded properly
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          // Skip if image is already loaded with valid dimensions
          if (img.complete && img.naturalWidth > 0) {
            img.crossOrigin = 'Anonymous';
            console.log(`Image already loaded: ${img.src}, dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
            return resolve();
          }
          
          // Set crossOrigin before setting src
          img.crossOrigin = 'Anonymous';
          
          // Add event listeners for load and error
          img.onload = () => {
            console.log(`Image loaded: ${img.src}, dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
            resolve();
          };
          
          img.onerror = (err) => {
            console.error(`Error loading image: ${img.src}`, err);
            // Try to set a placeholder instead of failing
            img.src = 'https://via.placeholder.com/150x50?text=Image+Error';
            // Still resolve to not block the PDF generation
            resolve();
          };
          
          // If image src is relative path to profile image, convert to absolute URL
          if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
            const newSrc = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            console.log(`Converting relative URL to absolute: ${img.src} -> ${newSrc}`);
            img.src = newSrc;
          } else {
            // Force reload by setting the same src
            const currentSrc = img.src;
            console.log(`Reloading image: ${currentSrc}`);
            img.src = currentSrc;
          }
        });
      });
      
      // Wait for all images to be properly loaded
      await Promise.all(imagePromises);
      console.log("All images loaded for email PDF generation");
      
      // Wait additional time to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set proper constraints on images
      letterRef.current.querySelectorAll('img').forEach(img => {
        if (img.classList.contains('h-20')) {
          img.style.maxHeight = '80px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '200px';
        } else if (img.classList.contains('h-16')) {
          img.style.maxHeight = '60px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '180px';
        } else if (img.classList.contains('h-32') || img.src.includes('stampImg')) {
          img.style.maxHeight = '100px';
          img.style.maxWidth = '100px';
          img.style.height = 'auto';
          img.style.width = 'auto';
        }
      });
      
      // Generate PDF with html2canvas
      const canvas = await html2canvas(letterRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const clonedImages = clonedDoc.querySelectorAll('img');
          console.log(`Processing ${clonedImages.length} images in cloned document for email`);
          clonedImages.forEach(img => {
            img.crossOrigin = 'Anonymous';
            // Apply same styling constraints as above
            if (img.classList.contains('h-20')) {
              img.style.maxHeight = '80px';
              img.style.maxWidth = '200px';
            } else if (img.classList.contains('h-16')) {
              img.style.maxHeight = '60px';
              img.style.maxWidth = '180px';
            } else if (img.classList.contains('h-32') || img.src.includes('stampImg')) {
              img.style.maxHeight = '100px';
              img.style.maxWidth = '100px';
            }
            
            // Fix image URLs for server resources
            if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
              const originalSrc = img.src;
              img.src = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
              console.log(`Fixed image URL: ${originalSrc} -> ${img.src}`);
            }
          });
        }
      });
      
      console.log(`Canvas generated for email: ${canvas.width}x${canvas.height}`);
      
      // Create PDF with A4 size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Calculate dimensions to maintain aspect ratio
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Handle multi-page if content is long
      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        let heightLeft = imgHeight;
        let position = 0;
        let page = 0;
        
        while (heightLeft > 0) {
          if (page > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          
          heightLeft -= pdfHeight;
          position -= pdfHeight;
          page++;
        }
      }
      
      // Get the PDF as blob
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], `${formData.employeeName || 'Employee'}_Joining_Letter.pdf`, { type: 'application/pdf' });
      
      // Create FormData for email
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.employeeEmail);
      formDataToSend.append('subject', 'Joining Letter');
      formDataToSend.append('message', `Dear ${formData.employeeName},\n\nPlease find attached your joining letter.\n\nRegards,\n${subadmin?.companyName || 'Company'}`);
      formDataToSend.append('attachment', pdfFile);
      
      // Send email with the PDF attachment
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/send-email`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('Email send response:', response.data);
      toast.success('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(`Failed to send email: ${error.message || 'Unknown error'}`);
    } finally {
      setEmailSending(false);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard/certificates');
    console.log("Navigating back to certificates page");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}
    >
      {/* Back button */}
      <div className="sticky top-0 z-10 p-4 flex justify-between items-center bg-blue-600 text-white shadow-md">
        <button 
          onClick={handleBackClick}
          className="flex items-center space-x-2 hover:bg-blue-700 px-3 py-2 rounded-md transition duration-300"
        >
          <FaArrowLeft />
          <span>Back to Certificates</span>
        </button>
        <div className="text-lg font-semibold">Joining Letter Generator</div>
        <div className="w-24"></div> {/* Empty div for flex spacing */}
      </div>

      <div className="container mx-auto p-4 max-w-6xl">
        {/* Search for employee */}
        <div className="mb-6 relative" ref={autocompleteRef}>
          <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Search for Employee
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              className={`block w-full pl-10 pr-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Search by name, email or job role"
            />
          </div>
          
          {/* Employee search results dropdown */}
          {showDropdown && filteredEmployees.length > 0 && (
            <div className={`absolute z-10 w-full mt-1 rounded-md shadow-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto`}>
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className={`cursor-pointer p-3 hover:bg-blue-100 ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 border-b border-gray-700' 
                      : 'hover:bg-gray-100 border-b border-gray-200'
                  }`}
                >
                  <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                  <div className="text-sm text-gray-500">{emp.email}</div>
                  <div className="text-sm">{emp.jobRole}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Main content area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Form fields */}
          <div className="md:col-span-1">
            <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Letter Details
              </h2>
              
              <div className="space-y-4">
                {/* Employee Basic Details */}
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Employee Name
                  </label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="employeeJobTitle"
                    value={formData.employeeJobTitle}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Department
                  </label>
                  <input
                    type="text"
                    name="employeeDepartment"
                    value={formData.employeeDepartment}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Joining Date
                  </label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                {/* Joining Letter Specific Fields */}
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Salary/Compensation
                  </label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., ₹50,000 per month"
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Work Hours
                  </label>
                  <input
                    type="text"
                    name="workHours"
                    value={formData.workHours}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., 9:00 AM to 6:00 PM, Monday to Friday"
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Probation Period
                  </label>
                  <input
                    type="text"
                    name="probationPeriod"
                    value={formData.probationPeriod}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Benefits
                  </label>
                  <textarea
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleInputChange}
                    rows="3"
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., Health insurance, PF, Annual leave, etc."
                  />
                </div>
                
                {/* Contact and Signatory Details */}
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="employeeEmail"
                    value={formData.employeeEmail}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Signatory Name
                  </label>
                  <input
                    type="text"
                    name="signatoryName"
                    value={formData.signatoryName}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Signatory Title
                  </label>
                  <input
                    type="text"
                    name="signatoryTitle"
                    value={formData.signatoryTitle}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Letter Preview */}
          <div className="md:col-span-2">
            <div className={`p-6 rounded-lg shadow-md mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Letter Preview
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
                  >
                    <FaPrint />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300"
                    disabled={pdfGenerating}
                  >
                    <FaDownload />
                    <span>{pdfGenerating ? 'Generating...' : 'Download'}</span>
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-300"
                    disabled={emailSending || !selectedEmployee}
                  >
                    <FaEnvelope />
                    <span>{emailSending ? 'Sending...' : 'Email'}</span>
                  </button>
                </div>
              </div>
              
              {/* Letter Content Preview */}
              <div 
                ref={letterRef}
                className="bg-white text-black p-8 rounded-md shadow"
                style={{ minHeight: '297mm', maxWidth: '210mm', margin: '0 auto' }}
              >
                {/* Company Header */}
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                  <div>
                    {subadmin && subadmin.companylogo ? (
                      <img
                        src={`http://localhost:8282/images/profile/${subadmin.companylogo}`}
                        alt="Company Logo"
                        className="h-16 object-contain"
                        onError={(e) => {
                          console.error('Error loading logo:', e);
                          e.target.src = 'https://via.placeholder.com/150x50?text=Company+Logo';
                        }}
                      />
                    ) : (
                      <div className="h-16 w-40 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">Company Logo</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold">{subadmin?.registercompanyname || 'Company Name'}</h2>
                    <p>{subadmin?.address || 'Company Address'}</p>
                    <p>{subadmin?.email || 'company@example.com'}</p>
                    <p>{subadmin?.contact || '+91 1234567890'}</p>
                  </div>
                </div>
                
                {/* Date */}
                <div className="text-right mb-6">
                  <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
                </div>
                
                {/* Subject Line */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold underline text-center">JOINING LETTER</h3>
                </div>
                
                {/* Salutation */}
                <div className="mb-4">
                  <p>Dear {formData.employeeName || '[Employee Name]'},</p>
                </div>
                
                {/* Body Content */}
                <div className="space-y-4 mb-6">
                  <p>
                    We are pleased to confirm your appointment as <strong>{formData.employeeJobTitle || '[Job Position]'}</strong> in 
                    the <strong>{formData.employeeDepartment || '[Department]'}</strong> department at <strong>{subadmin?.registercompanyname || 'our organization'}</strong>.
                  </p>
                  
                  <p>
                    Your employment will commence on <strong>{new Date(formData.joiningDate).toLocaleDateString('en-GB') || '[Joining Date]'}</strong>.
                    Please report to <strong>{formData.contactPerson || 'HR Department'}</strong> at 9:00 AM on your joining date.
                  </p>
                  
                  <p>Your appointment is subject to the following terms and conditions:</p>
                  
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      <strong>Position and Responsibilities:</strong> You will be employed as <strong>{formData.employeeJobTitle || '[Job Title]'}</strong> and will be 
                      responsible for duties as discussed during your interview and as detailed in your job description.
                    </li>
                    
                    <li>
                      <strong>Compensation:</strong> Your compensation will be <strong>{formData.salary || '[Salary Details]'}</strong>.
                    </li>
                    
                    <li>
                      <strong>Working Hours:</strong> Your working hours will be <strong>{formData.workHours || 'as per company policy'}</strong>.
                    </li>
                    
                    <li>
                      <strong>Probation Period:</strong> You will be on probation for <strong>{formData.probationPeriod || '3 months'}</strong> from the date of joining.
                    </li>
                    
                    <li>
                      <strong>Benefits:</strong> You will be entitled to the following benefits:
                      <p>{formData.benefits || 'As per company policy and discussed during your interview process.'}</p>
                    </li>
                    
                    <li>
                      <strong>Notice Period:</strong> During and after the probation period, either party can terminate this employment by giving one month's notice or salary in lieu thereof.
                    </li>
                    
                    <li>
                      <strong>Company Policies:</strong> You will be governed by the company's policies, rules, and regulations in force or as introduced or amended from time to time.
                    </li>
                  </ol>
                  
                  <p>
                    On your joining day, please bring the following documents:
                  </p>
                  
                  <ul className="list-disc pl-5">
                    <li>Educational certificates (originals and photocopies)</li>
                    <li>Experience and relieving letters from previous employers</li>
                    <li>Identity proof (Aadhar/PAN/Passport)</li>
                    <li>Address proof</li>
                    <li>Passport size photographs (4 copies)</li>
                    <li>Bank account details for salary transfer</li>
                  </ul>
                  
                  <p>
                    We look forward to a mutually beneficial and fruitful association with you. If you have any questions or require further clarification, 
                    please feel free to contact {formData.contactPerson || 'our HR department'} at {formData.employeeEmail || 'hr@company.com'} or 
                    {formData.contactPhone || 'contact number'}.
                  </p>
                  
                  <p>
                    Please sign and return the duplicate copy of this letter as a token of your acceptance of the above terms and conditions.
                  </p>
                </div>
                
                {/* Signature Section */}
                <div className="mt-12 flex justify-between">
                  <div>
                    <p className="font-semibold mb-1">Accepted by:</p>
                    <p className="mb-10">_________________________</p>
                    <p>{formData.employeeName || '[Employee Name]'}</p>
                    <p>Date: _________________________</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold mb-1">For {subadmin?.registercompanyname || 'Company Name'}</p>
                    {subadmin && subadmin.signature ? (
                      <img
                        src={`http://localhost:8282/images/profile/${subadmin.signature}`}
                        alt="Authorized Signature"
                        className="h-16 object-contain ml-auto mb-2"
                        onError={(e) => {
                          console.error('Error loading signature:', e);
                          e.target.src = 'https://via.placeholder.com/150x50?text=Signature';
                        }}
                      />
                    ) : (
                      <div className="h-12 w-32 bg-gray-200 flex items-center justify-center mb-1 ml-auto">
                        <span className="text-gray-500">Signature</span>
                      </div>
                    )}
                    <p className="font-semibold">{formData.signatoryName || '[Signatory Name]'}</p>
                    <p>{formData.signatoryTitle || '[Signatory Title]'}</p>
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

export default JoiningLetter; 