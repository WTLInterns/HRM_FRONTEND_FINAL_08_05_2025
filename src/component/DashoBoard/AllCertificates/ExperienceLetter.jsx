import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExperienceLetter = () => {
  const { isDarkMode } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [subadmins, setSubadmins] = useState([]);
  const [selectedSubadmin, setSelectedSubadmin] = useState(null);
  const letterRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeJobTitle: '',
    startDate: '',
    endDate: '',
    responsibilities: '',
    skill1: '',
    skill1Description: '',
    skill2: '',
    skill2Description: '',
    skill3: '',
    skill3Description: '',
    achievements: '',
    signatoryName: '',
    signatoryTitle: ''
  });

  // Fetch subadmins data
  useEffect(() => {
    const fetchSubadmins = async () => {
      try {
        console.log("Fetching subadmins data...");
        const response = await axios.get('http://localhost:8282/api/subadmin/all');
        console.log("API Response:", response.data);
        setSubadmins(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching subadmins:', error);
        setApiError(true);
        toast.error('Failed to fetch company details. Please check API connection.');
        setLoading(false);
      }
    };

    fetchSubadmins();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubadminChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selected = subadmins.find(admin => admin.id === selectedId);
    setSelectedSubadmin(selected);
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
      pdf.save('experience_letter.pdf');
      toast.success('PDF downloaded successfully!');
    }).catch(error => {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download PDF');
    });
  };

  const handleSendEmail = () => {
    toast.info('Email functionality will be implemented here');
    // Implementation for sending email would go here
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
              <h2 className="text-xl font-bold mb-4 text-center">Experience Letter Details</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Select Company</label>
                <select 
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  onChange={handleSubadminChange}
                >
                  <option value="">Select a company</option>
                  {subadmins.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.registercompanyname}
                    </option>
                  ))}
                </select>
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

              <div className="mb-4">
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

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input 
                    type="date" 
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input 
                    type="date" 
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Main Responsibilities</label>
                <textarea 
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Briefly describe main responsibilities"
                  rows="3"
                ></textarea>
              </div>

              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">Skills & Achievements</h3>
                
                <div className="mb-3">
                  <input 
                    type="text" 
                    name="skill1"
                    value={formData.skill1}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded mb-1 ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Skill 1 Title"
                  />
                  <textarea 
                    name="skill1Description"
                    value={formData.skill1Description}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Description of Skill 1"
                    rows="2"
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <input 
                    type="text" 
                    name="skill2"
                    value={formData.skill2}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded mb-1 ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Skill 2 Title"
                  />
                  <textarea 
                    name="skill2Description"
                    value={formData.skill2Description}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Description of Skill 2"
                    rows="2"
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <input 
                    type="text" 
                    name="skill3"
                    value={formData.skill3}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded mb-1 ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Skill 3 Title"
                  />
                  <textarea 
                    name="skill3Description"
                    value={formData.skill3Description}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Description of Skill 3"
                    rows="2"
                  ></textarea>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notable Achievements</label>
                <textarea 
                  name="achievements"
                  value={formData.achievements}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Notable achievements or accomplishments"
                  rows="3"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Signatory Name</label>
                  <input 
                    type="text" 
                    name="signatoryName"
                    value={formData.signatoryName}
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
            <div ref={letterRef} className="bg-white text-black p-8 rounded-lg shadow-lg min-h-[29.7cm] max-w-[21cm] mx-auto relative">
              {/* Debug Info */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="absolute top-0 right-0 bg-yellow-100 p-2 text-xs text-black z-50">
                  Selected Subadmin: {selectedSubadmin ? selectedSubadmin.registercompanyname : 'None'}
                </div>
              )}
              
              {/* Company Letterhead */}
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                {selectedSubadmin && selectedSubadmin.companylogo ? (
                  <img 
                    src={`http://localhost:8282/api/files/${selectedSubadmin.companylogo}`} 
                    alt="Company Logo" 
                    className="h-16 object-contain"
                    onError={(e) => {
                      console.error('Error loading logo:', e);
                      e.target.src = 'https://via.placeholder.com/150x50?text=Company+Logo';
                    }}
                  />
                ) : (
                  <div className="h-16 w-32 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Company Logo</span>
                  </div>
                )}
                <div className="text-right">
                  <h2 className="font-bold text-xl">{selectedSubadmin?.registercompanyname || "Your Company Name"}</h2>
                  <p className="text-sm">{selectedSubadmin?.address || "Company Address"}</p>
                  <p className="text-sm">GST: {selectedSubadmin?.gstno || "GSTIN"}</p>
                </div>
              </div>

              {/* Date */}
              <div className="mb-6">
                <p>{new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>

              {/* Subject Line */}
              <div className="mb-6">
                <h1 className="text-center font-bold text-xl mb-2">EXPERIENCE LETTER</h1>
                <div className="border-b-2 border-yellow-500 w-1/3 mx-auto"></div>
              </div>

              {/* Salutation */}
              <div className="mb-6">
                <p>To Whom It May Concern,</p>
              </div>

              {/* Content */}
              <div className="space-y-4 mb-8">
                <p>
                  I hereby certify that {formData.employeeName || "[Employee's Full Name]"}, 
                  {formData.employeeJobTitle ? ` ${formData.employeeJobTitle}, ` : " [Employee's Job Title], "}was employed 
                  with {selectedSubadmin?.registercompanyname || "[Your Company Name]"} from 
                  {formData.startDate ? ` ${new Date(formData.startDate).toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}` : " [Start Date]"} to 
                  {formData.endDate ? ` ${new Date(formData.endDate).toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}` : " [End Date]"}. During this period, they carried out their duties diligently and effectively.
                </p>

                <p>
                  {formData.employeeName || "[Employee's Full Name]"} was responsible for {formData.responsibilities || "[Briefly describe employee's main responsibilities and tasks]"}. 
                  They consistently met and exceeded performance standards and demonstrated exceptional skills, including:
                </p>

                <ul className="list-disc pl-8 space-y-2">
                  <li>
                    <span className="font-semibold">{formData.skill1 || "[Skill 1]"}:</span> {formData.skill1Description || "[Provide a brief description of how the employee exhibited this skill]"}
                  </li>
                  <li>
                    <span className="font-semibold">{formData.skill2 || "[Skill 2]"}:</span> {formData.skill2Description || "[Provide a brief description of how the employee exhibited this skill]"}
                  </li>
                  <li>
                    <span className="font-semibold">{formData.skill3 || "[Skill 3]"}:</span> {formData.skill3Description || "[Provide a brief description of how the employee exhibited this skill]"}
                  </li>
                </ul>

                {formData.achievements && (
                  <p>
                    {formData.employeeName || "[Employee's Full Name]"} also achieved {formData.achievements}.
                  </p>
                )}

                <p>
                  I can confidently attest to {formData.employeeName || "[Employee's Full Name]"}'s professionalism, dedication, and 
                  contribution to our organization. They were a valuable asset to our team and 
                  consistently upheld our company's values.
                </p>

                <p>
                  We wish {formData.employeeName || "[Employee's Full Name]"} continued success in their future endeavors.
                </p>
              </div>

              {/* Signature */}
              <div className="mt-12">
                <p>Sincerely,</p>
                <div className="mt-8">
                  {selectedSubadmin && selectedSubadmin.signature ? (
                    <img 
                      src={`http://localhost:8282/api/files/${selectedSubadmin.signature}`} 
                      alt="Signature" 
                      className="h-12 mb-1 object-contain"
                      onError={(e) => {
                        console.error('Error loading signature:', e);
                        e.target.src = 'https://via.placeholder.com/150x50?text=Signature';
                      }}
                    />
                  ) : (
                    <div className="h-12 w-32 bg-gray-200 flex items-center justify-center mb-1">
                      <span className="text-gray-500">Signature</span>
                    </div>
                  )}
                  <p className="font-bold">{formData.signatoryName || selectedSubadmin?.name || "[Your Name]"}</p>
                  <p>{formData.signatoryTitle || "[Your Title]"}</p>
                  <p>{selectedSubadmin?.registercompanyname || "[Company Name]"}</p>
                </div>
              </div>

              {/* Stamp if available */}
              {selectedSubadmin && selectedSubadmin.stampImg && (
                <div className="absolute bottom-12 right-12 opacity-70">
                  <img 
                    src={`http://localhost:8282/api/files/${selectedSubadmin.stampImg}`} 
                    alt="Company Stamp" 
                    className="h-24 object-contain"
                    onError={(e) => {
                      console.error('Error loading stamp:', e);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExperienceLetter; 