import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Agreement_Contract_Letter = () => {
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
    employeeAge: '',
    employeeAddress: '',
    employeePosition: '',
    probationPeriod: '',
    signatoryName: '',
    signatoryTitle: '',
    agreementDate: new Date().toISOString().split('T')[0]
  });

  // Fetch subadmin data by email
  useEffect(() => {
    const fetchSubadminByEmail = async () => {
      try {
        setLoading(true);
        console.log("Fetching subadmin data...");
        
        const user = JSON.parse(localStorage.getItem("user")) || {};
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
      employeePosition: emp.jobRole,
      employeeAddress: emp.address || '',
      employeeAge: emp.age || '',
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

  const handleDownloadPDF = () => {
    const letterElement = letterRef.current;
  
    if (!letterElement) return;
  
    toast.info('Preparing PDF download...');

    try {
      // Store original styles to restore later
      const originalStyle = letterElement.style.cssText;
      
      // Temporarily adjust the container to optimize for PDF generation
      letterElement.style.width = '210mm';
      letterElement.style.height = 'auto';
      letterElement.style.fontSize = '10pt';
      letterElement.style.lineHeight = '1.3';
      
      // Optimize spacing for paragraphs
      const paragraphs = letterElement.querySelectorAll('p');
      paragraphs.forEach(p => {
        p.style.marginBottom = '0.5em';
        p.style.marginTop = '0.5em';
      });
      
      // Adjust spacing of elements
      const contentDivs = letterElement.querySelectorAll('div');
      contentDivs.forEach(div => {
        if (div.classList.contains('mt-16')) {
          div.style.marginTop = '1.5rem';
        }
      });
      
      // Ensure images are properly loaded
      const images = letterElement.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            img.crossOrigin = 'Anonymous';
            return resolve();
          }
          
          img.crossOrigin = 'Anonymous';
          img.onload = () => resolve();
          img.onerror = () => {
            img.src = 'https://via.placeholder.com/150x50?text=Image+Error';
            resolve();
          };
          
          // Ensure absolute URL for images
          if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
            img.src = `https://aimdreamplanner.com${img.src.startsWith('/') ? '' : '/'}${img.src}`;
          }
        });
      });
      
      // Wait for all images to load
      Promise.all(imagePromises).then(() => {
        // Set proper constraints on images
        letterElement.querySelectorAll('img').forEach(img => {
          if (img.classList.contains('h-16') || img.classList.contains('h-12')) {
            img.style.maxHeight = '60px';
            img.style.height = 'auto';
            img.style.width = 'auto';
            img.style.maxWidth = '160px';
            img.style.objectFit = 'contain';
          }
        });
        
        // Set up PDF options
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const options = {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          scrollY: 0,
          logging: false,
          letterRendering: true,
        };
        
        html2canvas(letterElement, options).then(canvas => {
          // Calculate dimensions
          const imgWidth = pdfWidth - 20; // 10mm margin on each side
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add image to PDF
          pdf.addImage(
            canvas.toDataURL('image/png'),
            'PNG',
            10, // x - 10mm margin
            10, // y - 10mm margin
            imgWidth,
            imgHeight
          );
          
          pdf.save('employment_agreement.pdf');
          toast.success('PDF downloaded successfully!');
          
          // Restore original styles
          letterElement.style.cssText = originalStyle;
          paragraphs.forEach(p => {
            p.style.marginBottom = '';
            p.style.marginTop = '';
          });
          contentDivs.forEach(div => {
            div.style.marginTop = '';
          });
          letterElement.querySelectorAll('img').forEach(img => {
            img.style.maxHeight = '';
            img.style.height = '';
            img.style.width = '';
            img.style.maxWidth = '';
            img.style.objectFit = '';
          });
        }).catch(error => {
          console.error('Error generating PDF:', error);
          toast.error('Failed to download PDF');
          letterElement.style.cssText = originalStyle;
        });
      });
    } catch (error) {
      console.error('Error preparing PDF:', error);
      toast.error('Failed to prepare PDF');
    }
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
      
      // Fix employee signature position for email PDF
      const employeeSignature = letterRef.current.querySelector('.flex.justify-end');
      if (employeeSignature) {
        employeeSignature.style.marginTop = '1rem';
      }
      
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
      formData.append('file', new File([pdfBlob], `${selectedEmployee.firstName}_${selectedEmployee.lastName}_Agreement.pdf`, { type: 'application/pdf' }));
      
      // Send to API
      const response = await axios.post(
        `https://api.aimdreamplanner.com/api/certificate/send/${subadmin.id}/${encodeURIComponent(selectedEmployee.firstName + ' ' + selectedEmployee.lastName)}/agreement`,
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
        if (div.classList.contains('mt-16') || div.classList.contains('mt-12') || div.classList.contains('mt-10') || div.classList.contains('mt-8') || div.classList.contains('mt-6')) {
          div.style.marginTop = '';
        }
        if (div.classList.contains('h-28')) {
          div.style.height = '';
        }
        // Reset employee signature position
        if (div.classList.contains('flex') && div.classList.contains('justify-end')) {
          div.style.marginTop = '';
        }
      });
      
      // Reset styles on images
      letterRef.current.querySelectorAll('img').forEach(img => {
        img.style.maxHeight = '';
        img.style.height = '';
        img.style.width = '';
        img.style.maxWidth = '';
        img.style.objectFit = '';
      });
      
      console.log('Email API Response:', response.data);
      toast.success(`Agreement letter sent to ${selectedEmployee.email} successfully!`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(`Failed to send email: ${error.message || 'Unknown error'}`);
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
              <h2 className="text-xl font-bold mb-4 text-center">Employment Agreement Details</h2>
              
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
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Agreement Date</label>
                  <input 
                    type="date" 
                    name="agreementDate"
                    value={formData.agreementDate}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  />
                </div>

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
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input 
                    type="number" 
                    name="employeeAge"
                    value={formData.employeeAge}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Employee age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea 
                    name="employeeAddress"
                    value={formData.employeeAddress}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Full address"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Position</label>
                  <input 
                    type="text" 
                    name="employeePosition"
                    value={formData.employeePosition}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Job position"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Probation Period (days)</label>
                  <input 
                    type="number" 
                    name="probationPeriod"
                    value={formData.probationPeriod}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="e.g., 90"
                  />
                </div>

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
              {/* Company Letterhead */}
              <div className="mb-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-shrink-0 mr-4">
                    {subadmin && subadmin.companylogo ? (
                      <img 
                        src={`https://api.aimdreamplanner.com/images/profile/${subadmin.companylogo}`} 
                        alt="Company Logo" 
                        className="h-20 object-contain" 
                        onError={(e) => {
                          console.error('Error loading logo:', e);
                          e.target.src = 'https://via.placeholder.com/150x50?text=Company+Logo';
                        }}
                      />
                    ) : null}
                  </div>
                  
                  <div className="flex flex-col items-end text-right">
                    <h2 className="font-bold text-xl text-blue-800">{subadmin?.registercompanyname}</h2>
                    <p className="text-sm text-gray-600">{subadmin?.address}</p>
                    <p className="text-sm text-gray-600">GST: {subadmin?.gstno}</p>
                  </div>
                </div>
                
                <hr className="border-t-2 border-blue-600 my-3" />
              </div>

              {/* Agreement Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold underline">EMPLOYMENT AGREEMENT</h1>
              </div>

              {/* Agreement Content */}
              <div className="space-y-6 text-justify">
                <p>
                  This agreement lays down the terms of employment, agreed upon by the employer and
                  employee. Whether stated explicitly in the agreement or not, both the employee and the
                  employer have the duty of mutual confidence and trust, and to make only
                  lawful and reasonable demands on each other.
                </p>

                <p>
                  This EMPLOYMENT AGREEMENT (Hereinafter, the "Agreement") is entered into on this
                  {formData.agreementDate ? ` ${new Date(formData.agreementDate).getDate()} day of ${new Date(formData.agreementDate).toLocaleString('default', { month: 'long' })}, ${new Date(formData.agreementDate).getFullYear()}` : " ___ day of ________, 20__"},
                </p>

                <div className="text-center font-bold my-4">BY AND BETWEEN</div>

                <p>
                  {subadmin?.registercompanyname}, a private limited company incorporated under the Companies Act, 2013,
                  having its registered office at {subadmin?.address} (hereinafter referred to as the
                  "Company" or "Employer", which expression shall, unless repugnant to the meaning or
                  context hereof, be deemed to include all permitted successors and assigns),
                </p>

                <div className="text-center font-bold my-4">AND</div>

                <p>
                  {formData.employeeName}, aged {formData.employeeAge} years and residing at {formData.employeeAddress} 
                  (hereinafter referred to as the "Employee", which expression
                  shall, unless repugnant to the meaning or context hereof, be deemed to include all permitted
                  successors and assigns).
                </p>

                <p className="font-bold">WHEREAS,</p>
                <p>
                  the parties hereto desire to enter into this Agreement to define and set forth the
                  terms and conditions of the employment of the Employee by the Company;
                </p>

                <p className="font-bold">NOW, THEREFORE,</p>
                <p>
                  in consideration of the mutual covenants and agreements set forth
                  below, it is hereby covenanted and agreed by the Company and the Employee as follows:
                </p>

                <div className="space-y-4">
                  <div>
                    <h2 className="font-bold">1. Interpretation</h2>
                    <p className="ml-4">In this agreement the following terms shall have the following meanings:</p>
                    <div className="ml-8 space-y-2">
                      <p><span className="font-bold">a) "Confidential Information"</span> means any trade secret or other information which is
                        confidential or commercially sensitive and which is not in the public domain.</p>
                      <p><span className="font-bold">b) "The Employment"</span> means the employment of the Employee by the Company in accordance
                        with the terms of this agreement.</p>
                      <p><span className="font-bold">c) "Group Company"</span> means the Company, any company of which it is a Subsidiary and any
                        Subsidiaries of the Company.</p>
                      <p><span className="font-bold">d) "Subsidiary"</span> means a company as defined in section 2(87) of the Companies Act 2013.</p>
                      <p><span className="font-bold">e) "Termination Date"</span> means the date on which the Employment ceases.</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-bold">2. Position</h2>
                    <div className="ml-4 space-y-2">
                      <p>a. Upon execution of this Agreement, the employee would be posted as the {formData.employeePosition} of the
                        Company.</p>
                      <p>b. During the term period of this Agreement, the Company may change the employee's
                        above mentioned post (or position) or location based on the Company's production,
                        operation or working requirements or according to the employee's working capacities and
                        performance.</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-bold">3. Term and Probation Period</h2>
                    <div className="ml-4 space-y-2">
                      <p>a. It is understood and agreed that the first {formData.probationPeriod || "___"} days of employment shall
                        constitute a probationary period during which period the Employer may, in its absolute
                        discretion, terminate the Employee's employment, without assigning any reasons and without
                        notice or cause.</p>
                      <p>b. After the end of the Probationary Period, the Employer may decide to confirm the
                        Employment of the Employee, in its sole discretion.</p>
                      <p>c. After the end of the Probationary Period, this Agreement may be terminated in
                        accordance with Clause 12 of this Agreement.</p>
                      <p>d. The Company agrees to Employee and the Employee agrees to work with the required
                        professional skills, technical capabilities resources for the Company for a minimum term
                        of 2 years (24 months) including the Probation Period.</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-bold">4. Performance of Duties</h2>
                    <p className="ml-4">
                      The Employee agrees that during the Employment Period, he/she shall devote his/her full
                      business time to the business affairs of the Company and shall perform the duties
                      assigned to him/her faithfully and efficiently, and shall endeavor, to the best of his/her
                      abilities to achieve the goals and adhere to the parameters set by the Company.
                    </p>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="mt-16">
                  <div className="flex justify-between items-start">
                    {/* Company Signature */}
                    <div className="w-1/2">
                      <p className="font-bold mb-2">For and on behalf of the Company</p>
                      {subadmin && subadmin.signature ? (
                        <div className="border-b border-gray-300 pb-1 w-48">
                          <img 
                            src={`https://api.aimdreamplanner.com/images/profile/${subadmin.signature}`} 
                            alt="Signature" 
                            className="h-16 mb-2 object-contain" 
                            onError={(e) => {
                              console.error('Error loading signature:', e);
                              e.target.src = 'https://via.placeholder.com/150x50?text=Signature';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-32 bg-gray-200 flex items-center justify-center mb-1">
                          <span className="text-gray-500">Signature</span>
                        </div>
                      )}
                      <p className="font-bold mt-2">{formData.signatoryName}</p>
                      <p>{formData.signatoryTitle}</p>
                      <p>{subadmin?.registercompanyname}</p>
                    </div>

                    {/* Employee Signature */}
                    <div className="w-1/2 text-right">
                      <p className="font-bold mb-2">Employee's Signature</p>
                      <div className="h-12 w-32 bg-gray-200 flex items-center justify-center mb-1 ml-auto">
                        <span className="text-gray-500">Signature</span>
                      </div>
                      <p className="font-bold mt-2">{formData.employeeName}</p>
                      <p>{formData.employeePosition}</p>
                      <p>Date: {formData.agreementDate}</p>
                    </div>
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

export default Agreement_Contract_Letter; 