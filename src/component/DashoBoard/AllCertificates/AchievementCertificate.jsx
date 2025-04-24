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

const AchievementCertificate = () => {
  const { isDarkMode } = useApp();
  const navigate = useNavigate();
  const certificateRef = useRef(null);
  const [formData, setFormData] = useState({
    recipientName: '',
    achievement: '',
    date: '',
  });

  // Company logo and signature state
  const [companyLogo, setCompanyLogo] = useState('');
  const [signature, setSignature] = useState('');
  const [profileData, setProfileData] = useState({});

  // Employee autocomplete state
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  // Add HOD sign state
  const [hodSign, setHodSign] = useState(null);

  useEffect(() => {
    // Get user profile from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setCompanyLogo(user.companylogo || '');
      setSignature(user.signature || '');
      setProfileData(user);
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
          pdf.save('achievement_certificate.pdf');
          toast.success('PDF downloaded successfully!');
        });
      }).catch(error => {
        console.error('Error generating PDF:', error);
        toast.error('Failed to download PDF');
      });
    });
  };

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
      formDataToSend.append('file', pdfBlob, 'AchievementCertificate.pdf');
      Object.entries(formData).forEach(([key, value]) => formDataToSend.append(key, value));

      // Compose API endpoint
      const employeeFullName = formData.recipientName;
      const apiUrl = `http://localhost:8282/api/certificate/send/${profileData.id}/${encodeURIComponent(employeeFullName)}/achievement`;

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
              <FaDownload className="mr-2" /> Download
            </button>
            <button onClick={handleSendEmail} disabled={employeeLoading} style={{ marginLeft: '12px', background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: employeeLoading ? 'not-allowed' : 'pointer' }}>
              {employeeLoading ? 'Sending...' : (<><FaEnvelope style={{ marginRight: 6, verticalAlign: 'middle' }}/>Send Email</>)}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}> 
              <h2 className="text-xl font-bold mb-4 text-center">Achievement Certificate Details</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Recipient Name</label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="Full name"
                  list="employee-autocomplete"
                />
                <datalist id="employee-autocomplete">
                  {employeeOptions.map(emp => (
                    <option
                      key={emp.empId}
                      value={((emp.firstName || '') + ' ' + (emp.lastName || '')).trim()}
                    />
                  ))}
                </datalist>
                {employeeLoading && <span className="text-xs text-gray-400 ml-2">Loading...</span>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Achievement</label>
                <input type="text" name="achievement" value={formData.achievement} onChange={handleInputChange} className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`} placeholder="Achievement details" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">HOD Signature</label>
                <input type="file" accept="image/*" onChange={handleHodSignChange} className="w-full p-2 border rounded" />
                {hodSign && (
                  <img src={hodSign} alt="HOD Signature Preview" className="mt-2 h-12 object-contain" />
                )}
              </div>
            </div>
          </div>
          {/* Certificate Preview Section */}
          <div className="lg:col-span-2 flex justify-center items-center">
            <div ref={certificateRef} className="rounded-lg shadow-lg w-full max-w-2xl overflow-hidden" style={{ background: 'transparent', boxShadow: isDarkMode ? '0 0 16px #222' : '0 0 16px #bbb', position: 'relative' }}>
              <div style={{ position: 'relative', width: '100%', height: '600px', background: 'transparent' }}>
                {/* Certificate background image */}
                <img
                  src="/image/AchievementTemplate.png"
                  alt="Certificate Background"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    pointerEvents: 'none',
                  }}
                />
                {/* Gold medal image at top right */}
                <img
                  src="/image/gold-medal.png"
                  alt="Gold Medal"
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '10px',
                    width: '190px',
                    height: '110px',
                    objectFit: 'contain',
                    zIndex: 5,
                    pointerEvents: 'none',
                  }}
                />
                {/* Overlay recipient name in cursive font above the line */}
                {formData.recipientName && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '260px',
                      left: 0,
                      width: '100%',
                      textAlign: 'center',
                      fontFamily: 'Brush Script MT, cursive',
                      fontSize: '2.5rem',
                      color: '#222',
                      zIndex: 10,
                      pointerEvents: 'none',
                      textShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    }}
                  >
                    {formData.recipientName}
                  </div>
                )}
                {/* Custom message below the line - always visible with placeholders */}
                <div
                  style={{
                    position: 'absolute',
                    top: '340px',
                    left: '10%',
                    width: '80%',
                    textAlign: 'center',
                    fontFamily: 'serif',
                    fontSize: '0.7rem',
                    color: '#444',
                    zIndex: 10,
                    pointerEvents: 'none',
                    padding: '0 16px',
                  }}
                >
                  {`“This certificate is presented to ${formData.recipientName || '[Name]'} in recognition of their exceptional performance and outstanding achievements in ${formData.achievement || '[Achievement]'} on ${formData.date ? (() => { const d = new Date(formData.date); return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()}`; })() : '[Date]'}. Your hard work, dedication, and perseverance have been instrumental in your success, and we are honored to recognize your accomplishments.”`}
                </div>
                {/* Signature above HR Manager */}
                {signature && (
                  <img
                    src={getImageUrl(signature)}
                    alt="HR Manager Signature"
                    style={{
                      position: 'absolute',
                      left: '22%',
                      top: '72%',
                      width: '100px',
                      height: '40px',
                      objectFit: 'contain',
                      zIndex: 10,
                      pointerEvents: 'none',
                      background: 'transparent',
                    }}
                  />
                )}
                {/* Company stamp in center */}
                {profileData?.stampImg && (
                  <img
                    src={getImageUrl(profileData.stampImg)}
                    alt="Company Stamp"
                    style={{
                      position: 'absolute',
                      left: '44%',
                      top: '70%',
                      width: '70px',
                      height: '70px',
                      objectFit: 'contain',
                      zIndex: 10,
                      pointerEvents: 'none',
                      background: 'transparent',
                    }}
                  />
                )}
                {/* HOD sign above H.O.D */}
                {hodSign && (
                  <img
                    src={hodSign}
                    alt="HOD Signature"
                    style={{
                      position: 'absolute',
                      left: '62%',
                      top: '72%',
                      width: '100px',
                      height: '40px',
                      objectFit: 'contain',
                      zIndex: 10,
                      pointerEvents: 'none',
                      background: 'transparent',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementCertificate;