import React, { useRef, useState, useEffect } from 'react';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
const IMAGE_BASE_URL = 'http://localhost:8282/images/profile/';

const getImageUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  return `${IMAGE_BASE_URL}${filename}`;
};

const IntershipCertificate = () => {
  const { isDarkMode } = useApp();
  const navigate = useNavigate();
  const certificateRef = useRef(null);
  const [formData, setFormData] = useState({
    recipientName: '',
    internshipRole: '',
    startDate: '',
    endDate: '',
  });

  // Company logo and signature state
  const [signature, setSignature] = useState('');
  const [profileData, setProfileData] = useState({});
  const [organizationName, setOrganizationName] = useState('');

  // Employee autocomplete state
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  // Add HOD sign state
  const [hodSign, setHodSign] = useState(null);

  useEffect(() => {
    // Get user profile from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setSignature(user.signature || '');
      setProfileData(user);
      // Set organization name from company name in profile
      setOrganizationName(user.registercompanyname || '');
    }
  }, []);

  // Fetch employees for autocomplete
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeeLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) return;
        const res = await axios.get(`http://localhost:8282/api/employee/${user.id}/employee/all`);
        if (Array.isArray(res.data)) {
          setEmployeeOptions(res.data);
        }
      } catch (err) {
        setEmployeeOptions([]);
      } finally {
        setEmployeeLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add handler for HOD sign upload
  const handleHodSignChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setHodSign(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const certElement = certificateRef.current;
    if (!certElement) return;
    toast.info('Preparing PDF download...');
    const options = { scale: 2, useCORS: true, allowTaint: true, scrollX: 0, scrollY: 0, backgroundColor: null };
    window.scrollTo(0, 0); // ensure no scroll offset
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(certElement, options).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        import('jspdf').then(({ default: jsPDF }) => {
          // Set PDF size to match canvas size (landscape)
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
          });
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
          pdf.save('internship_certificate.pdf');
          toast.success('PDF downloaded successfully!');
        });
      }).catch(error => {
        console.error('Error generating PDF:', error);
        toast.error('Failed to download PDF');
      });
    });
  };

  // --- Add handleSendEmail function for internship certificate ---
  const handleSendEmail = async () => {
    if (!certificateRef.current || !profileData || !formData.recipientName) {
      toast.error('Missing required data.');
      return;
    }
    setEmployeeLoading(true);
    try {
      // Generate PDF as Blob
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
      const pdfBlob = pdf.output('blob');

      // Prepare FormData
      const formDataToSend = new FormData();
      formDataToSend.append('file', pdfBlob, 'InternshipCertificate.pdf');
      Object.entries(formData).forEach(([key, value]) => formDataToSend.append(key, value));

      // Compose API endpoint
      const employeeFullName = formData.recipientName;
      const apiUrl = `http://localhost:8282/api/certificate/send/${profileData.id}/${encodeURIComponent(employeeFullName)}/internship`;

      // Send to backend
      await axios.post(apiUrl, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Certificate sent successfully!');
    } catch (error) {
      toast.error('Failed to send certificate.');
    } finally {
      setEmployeeLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard/certificates');
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '[Date]';
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  };

  return (
    <div className={`p-4 min-h-screen ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-800'}`}>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={handleBackClick} className="flex items-center text-blue-500 hover:text-blue-700 transition duration-300">
            <FaArrowLeft className="mr-2" /> Back to Certificates
          </button>
          <div className="flex space-x-3">
            <button onClick={handlePrint} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center">
              <FaPrint className="mr-2" /> Print
            </button>
            <button onClick={handleDownloadPDF} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center">
              <FaDownload className="mr-2" /> Download PDF
            </button>
            <button onClick={handleSendEmail} disabled={employeeLoading} style={{ marginLeft: '12px', background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: employeeLoading ? 'not-allowed' : 'pointer' }}>
              {employeeLoading ? 'Sending...' : (<><FaEnvelope style={{ marginRight: 6, verticalAlign: 'middle' }}/>Send Email</>)}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4">Certificate Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Recipient Name</label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Full name"
                  list="employee-autocomplete"
                />
                <datalist id="employee-autocomplete">
                  {employeeOptions.map(emp => (
                    <option
                      key={emp.empId || emp.id}
                      value={((emp.firstName || '') + ' ' + (emp.lastName || '')).trim()}
                    />
                  ))}
                </datalist>
                {employeeLoading && <span className="text-xs text-gray-400 ml-2">Loading...</span>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Organization Name</label>
                <input
                  type="text"
                  name="organizationName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Internship Role</label>
                <input
                  type="text"
                  name="internshipRole"
                  value={formData.internshipRole}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Enter internship role"
                />
              </div>
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
              <div>
                <label className="block text-sm font-medium mb-1">HOD Signature</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHodSignChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
              <h2 className="text-xl font-semibold mb-4">Certificate Preview</h2>
              <div className="overflow-auto p-2 border rounded">
                <div 
                  ref={certificateRef} 
                  className="relative w-full aspect-[1.414/1] overflow-hidden" 
                  style={{ 
                    maxWidth: '900px', 
                    margin: '0 auto',
                    backgroundColor: '#fff',
                    color: '#000',
                    fontFamily: 'serif',
                    position: 'relative',
                  }}
                >
                  {/* Certificate Background - PNG image instead of PDF */}
                  <img
                    src="/image/InternshipCertificate.png"
                    alt="Certificate Background"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 1,
                    }}
                  />
                  
                  {/* Recipient Name - Positioned above the line */}
                  {formData.recipientName && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '39%',
                        left: 0,
                        width: '100%',
                        textAlign: 'center',
                        fontFamily: 'Script MT Bold, Brush Script MT, cursive',
                        fontSize: '35px',
                        color: '#000',
                        zIndex: 10,
                      }}
                    >
                      {formData.recipientName}
                    </div>
                  )}
                  
                  {/* New Certificate Text */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '55%',
                      left: '10%',
                      width: '80%',
                      textAlign: 'center',
                      fontFamily: 'Script MT Bold',
                      fontSize: '13px',
                      color: '#000',
                      zIndex: 10,
                      lineHeight: '1.8',
                      fontWeight: 400,
                    }}
                  >
                    <span>
                      This certificate is proudly awarded to <strong>{formData.recipientName || '[Recipient Name]'}</strong> for successfully completing an internship at <strong>{organizationName || '[Organization Name]'}</strong> in the role of <strong>{formData.internshipRole || '[Internship Role]'}</strong>. The internship was carried out from <strong>{formatDate(formData.startDate)}</strong> to <strong>{formatDate(formData.endDate)}</strong>. We commend their dedication, performance, and contributions during this period.
                    </span>
                  </div>
                  
                  {/* HR Manager Signature */}
                  {signature && (
                    <img
                      src={getImageUrl(signature)}
                      alt="HR Manager Signature"
                      style={{
                        position: 'absolute',
                        left: '25%',
                        bottom: '20%',
                        width: '100px',
                        height: '40px',
                        objectFit: 'contain',
                        zIndex: 10,
                        transform: 'translateX(-50%)',
                      }}
                    />
                  )}
                  
                  {/* HOD Signature */}
                  {hodSign && (
                    <img
                      src={hodSign}
                      alt="HOD Signature"
                      style={{
                        position: 'absolute',
                        right: '25%',
                        bottom: '20%',
                        width: '100px',
                        height: '40px',
                        objectFit: 'contain',
                        zIndex: 10,
                        transform: 'translateX(50%)',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntershipCertificate;