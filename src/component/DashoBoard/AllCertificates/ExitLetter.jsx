import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExitLetter = () => {
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
    employeeId: '',
    designation: '',
    exitDate: '',
    signatoryName: '',
    signatoryTitle: ''
  });

  // Fetch subadmin data by email
  useEffect(() => {
    const fetchSubadminByEmail = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user")) || {};
        const email = user.email || "arbaj.shaikh2034@gmail.com";
        
        const response = await axios.get(`https://api.aimdreamplanner.com/api/subadmin/subadmin-by-email/${email}`);
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
      const response = await axios.get(`https://api.aimdreamplanner.com/api/employee/${subadminId}/employee/all`);
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
      setLoading(false);
    }
  };

  useEffect(() => {
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
    
    setFormData({
      ...formData,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeId: emp.empId,
      designation: emp.jobRole,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const letterElement = letterRef.current;
    
    if (!letterElement) return;
    
    toast.info('Preparing PDF download...');
    
    const options = {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
    };
    
    html2canvas(letterElement, options).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save('exit_letter.pdf');
      toast.success('PDF downloaded successfully!');
    }).catch(error => {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download PDF');
    });
  };

  const handleSendEmail = async () => {
    if (!letterRef.current) return;
    
    // Check if we have a valid employee selected
    if (!selectedEmployee) {
      toast.error('Please select an employee first');
      return;
    }
    
    if (!subadmin) {
      toast.error('Company information not loaded');
      return;
    }
    
    toast.info(`Preparing to send email to ${selectedEmployee.email}...`);
    
    try {
      // Store original styles to restore later
      const letterContainer = letterRef.current;
      const originalStyle = letterContainer.style.cssText;
      
      // Temporarily adjust the container to optimize for PDF generation - CRITICAL FOR EMAIL
      letterContainer.style.width = '210mm';
      letterContainer.style.height = 'auto';
      letterContainer.style.fontSize = '9pt'; // Slightly smaller font for email to ensure fit on one page
      letterContainer.style.lineHeight = '1.2'; // Tighter line height for email
      
      // Optimize spacing for paragraphs to fit on one page
      const paragraphs = letterContainer.querySelectorAll('p');
      paragraphs.forEach(p => {
        p.style.marginBottom = '0.5em';
        p.style.marginTop = '0.5em';
      });
      
      // Adjust the spacing of elements to ensure everything fits properly
      const contentDivs = letterContainer.querySelectorAll('div');
      contentDivs.forEach(div => {
        if (div.classList.contains('mt-16') || div.classList.contains('mt-12') || div.classList.contains('mt-10') || div.classList.contains('mt-6')) {
          div.style.marginTop = '0.75rem';
        }
        if (div.classList.contains('mt-8')) {
          div.style.marginTop = '0.5rem';
        }
        // Reduce height of spacer divs
        if (div.classList.contains('h-28')) {
          div.style.height = '1rem';
        }
      });
      
      // First check and fix any image with missing dimensions
      const images = letterRef.current.querySelectorAll('img');
      console.log(`Found ${images.length} images in the letter for email`);
      
      // Create array of promises to ensure all images are loaded properly
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          // Skip if image is already loaded with valid dimensions
          if (img.complete && img.naturalWidth > 0) {
            img.crossOrigin = 'Anonymous';
            console.log(`Image already loaded: ${img.src}`);
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
            const newSrc = `https://aimdreamplanner.com${img.src.startsWith('/') ? '' : '/'}${img.src}`;
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
      console.log('All images loaded successfully for email');
      
      // Wait additional time to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set proper constraints on images - optimized for email
      letterRef.current.querySelectorAll('img').forEach(img => {
        if (img.classList.contains('h-20') || img.classList.contains('h-24')) {
          img.style.maxHeight = '70px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '180px';
          img.style.objectFit = 'contain';
        } else if (img.classList.contains('h-16') || img.classList.contains('h-12')) {
          img.style.maxHeight = '50px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '150px';
          img.style.objectFit = 'contain';
        } else if (img.src.includes('stampImg')) {
          img.style.maxHeight = '90px';
          img.style.maxWidth = '90px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.objectFit = 'contain';
        }
      });
      
      // Generate PDF with html2canvas - optimized settings for email
      const canvas = await html2canvas(letterRef.current, {
        scale: 1.3, // Lower scale for better text/image ratio and to fit on one page
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 15000,
        letterRendering: true,
        foreignObjectRendering: false,
        onclone: (clonedDoc) => {
          // Process all images in the cloned document to ensure proper sizing
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach(img => {
            img.crossOrigin = 'Anonymous';
            
            // Make sure the cloned document has the same image size constraints
            if (img.classList.contains('h-20') || img.classList.contains('h-24')) {
              img.style.maxHeight = '70px';
              img.style.height = 'auto';
              img.style.width = 'auto';
              img.style.maxWidth = '180px';
            } else if (img.classList.contains('h-16') || img.classList.contains('h-12')) {
              img.style.maxHeight = '50px';
              img.style.height = 'auto';
              img.style.width = 'auto';
              img.style.maxWidth = '150px';
            } else if (img.src.includes('stampImg')) {
              img.style.maxHeight = '90px';
              img.style.maxWidth = '90px';
              img.style.height = 'auto';
              img.style.width = 'auto';
            }
          });
        }
      });
      
      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
      
      // Convert PDF to blob for upload
      const pdfBlob = pdf.output('blob');
      
      // Create FormData for API request
      const formData = new FormData();
      formData.append('file', new File([pdfBlob], `${selectedEmployee.firstName}_${selectedEmployee.lastName}_Exit.pdf`, { type: 'application/pdf' }));
      
      // Send to API
      const response = await axios.post(
        `https://api.aimdreamplanner.com/api/certificate/send/${subadmin.id}/${encodeURIComponent(selectedEmployee.firstName + ' ' + selectedEmployee.lastName)}/exit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Restore original styles
      letterRef.current.style.cssText = originalStyle;
      
      // Reset styles on paragraphs
      paragraphs.forEach(p => {
        p.style.marginBottom = '';
        p.style.marginTop = '';
      });
      
      // Reset styles on divs
      contentDivs.forEach(div => {
        if (div.classList.contains('mt-16') || div.classList.contains('mt-12') || div.classList.contains('mt-10') || div.classList.contains('mt-6')) {
          div.style.marginTop = '';
        }
        if (div.classList.contains('mt-8')) {
          div.style.marginTop = '';
        }
        if (div.classList.contains('h-28')) {
          div.style.height = '';
        }
      });
      
      console.log('Email API Response:', response.data);
      toast.success(`Exit letter sent to ${selectedEmployee.email} successfully!`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard/certificates');
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
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300 flex items-center"
            >
              <FaEnvelope className="mr-2" /> Email
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
              <h2 className="text-xl font-bold mb-4 text-center">Exit Letter Details</h2>
              
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
                  <FaSearch className="absolute right-3 top-3 text-gray-400" />
                </div>
                
                {showDropdown && filteredEmployees.length > 0 && (
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
                
                {showDropdown && searchTerm && filteredEmployees.length === 0 && (
                  <div className={`absolute z-10 w-full mt-1 p-2 rounded-md shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'} border`}>
                    No employees found
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
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
                <div>
                  <label className="block text-sm font-medium mb-1">Employee ID</label>
                  <input 
                    type="text" 
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Employee ID"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Designation</label>
                <input 
                  type="text" 
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Designation"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Exit Date</label>
                <input 
                  type="date" 
                  name="exitDate"
                  value={formData.exitDate}
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
                    value={formData.signatoryName || (subadmin ? `${subadmin.name} ${subadmin.lastname}` : '')}
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

          {/* Letter Preview Section */}
          <div className="lg:col-span-2">
            <div ref={letterRef} className="bg-white text-black p-8 rounded-lg shadow-xl min-h-[29.7cm] max-w-[21cm] mx-auto relative border border-gray-200">
              {/* Company Header */}
              <div className="flex justify-between items-center mb-12">
                <div className="flex-shrink-0">
                  {subadmin && subadmin.companylogo ? (
                    <img 
                      src={`https://api.aimdreamplanner.com/images/profile/${subadmin.companylogo}`} 
                      alt="Company Logo" 
                      className="h-20 object-contain" 
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150x50?text=LOGO';
                      }}
                    />
                  ) : (
                    <div className="text-4xl font-bold">LOGO</div>
                  )}
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-bold">{subadmin?.registercompanyname || "COMPANY NAME"}</h1>
                </div>
              </div>

              {/* Letter Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Exit Letter</h1>
              </div>

              {/* Letter Content */}
              <div className="space-y-4">
                <p className="font-bold">Subject: Exit Letter - Confirmation of Resignation</p>

                <p>Date: {formData.exitDate ? new Date(formData.exitDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "[Insert Date]"}</p>

                <p>Employee ID: {formData.employeeId || "[Employee ID]"}</p>

                <p>Designation: {formData.designation || "[Designation]"}</p>

                <p>Dear {formData.employeeName || "[Employee Name]"},</p>

                <p className="text-justify">
                  An exit letter is a formal document issued by a company to an employee when they leave the
                  organization. Its purpose is as follows:
                </p>

                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <span className="font-semibold">Confirmation:</span> It confirms the end of the employee's tenure
                  </li>
                  <li>
                    <span className="font-semibold">Clearance:</span> States that the employee has completed all necessary handovers and formalities
                  </li>
                  <li>
                    <span className="font-semibold">Reference:</span> Often used by the employee as a reference for future job opportunities
                  </li>
                  <li>
                    <span className="font-semibold">Professional Closure:</span> Provides a respectful and professional end to the employment relationship
                  </li>
                </ul>

                <div className="mt-12">
                  <p>Sincerely,</p>
                  <div className="mt-8">
                    {subadmin && subadmin.signature ? (
                      <div className="border-b border-gray-300 pb-1 w-48">
                        <img 
                          src={`https://api.aimdreamplanner.com/images/profile/${subadmin.signature}`} 
                          alt="Signature" 
                          className="h-16 mb-2 object-contain" 
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150x50?text=Signature';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-32 bg-gray-200 flex items-center justify-center mb-1">
                        <span className="text-gray-500">[Sender Name]</span>
                      </div>
                    )}
                    <p className="font-bold">{formData.signatoryName || "[Sender Name]"}</p>
                    <p>{formData.signatoryTitle || "[Designation]"}</p>
                    <p>{subadmin?.registercompanyname || "[Company Name]"}</p>
                  </div>
                </div>

                {/* Company Stamp */}
                {subadmin && subadmin.stampImg && (
                  <div className="absolute bottom-24 right-8">
                    <img 
                      src={`https://api.aimdreamplanner.com/images/profile/${subadmin.stampImg}`} 
                      alt="Company Stamp" 
                      className="h-28 w-auto object-contain opacity-90" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExitLetter; 