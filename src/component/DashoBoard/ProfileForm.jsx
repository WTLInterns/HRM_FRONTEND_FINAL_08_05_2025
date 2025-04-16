import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaRegEnvelope, FaPhone, FaUser, FaStamp, FaSignature, FaEdit, FaSave, FaTimes, FaCheck, FaIdCard, FaBriefcase, FaBuilding, FaUserTie } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

const ProfileForm = () => {
  // State for user data from localStorage
  const [profileData, setProfileData] = useState({
    id: "",
    name: "",
    lastname: "",
    email: "",
    phoneno: "",
    registercompanyname: "",
    status: "",
    stampImg: "",
    signature: "",
    companylogo: "",
    gstno: "",
    cinno: "",
    companyurl: "",
    address: ""
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [tempData, setTempData] = useState({...profileData});
  
  // Files to upload
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [stampImgFile, setStampImgFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  
  // Image preview URLs
  const [companyLogoPreview, setCompanyLogoPreview] = useState("");
  const [stampImgPreview, setStampImgPreview] = useState("");
  const [signaturePreview, setSignaturePreview] = useState("");
  
  // Load user data on component mount
  useEffect(() => {
    const fetchSubadminData = async () => {
      try {
        setLoading(true);
        
        // Get email from localStorage for the API call
        const userFromStorage = JSON.parse(localStorage.getItem("user"));
        if (!userFromStorage || !userFromStorage.email) {
          throw new Error("No user email found in localStorage");
        }
        
        // Call the API to get full subadmin details by email
        const response = await axios.get(
          `http://localhost:8282/api/subadmin/subadmin-by-email/${userFromStorage.email}`
        );
        
        console.log("Subadmin data from API:", response.data);
        
        if (response.data) {
          const userData = response.data;
          
          // Update state with the fetched data
          setProfileData({
            id: userData.id || "",
            name: userData.name || "",
            lastname: userData.lastname || "",
            email: userData.email || "",
            phoneno: userData.phoneno || "",
            registercompanyname: userData.registercompanyname || "",
            status: userData.status || "active",
            stampImg: userData.stampImg || "",
            signature: userData.signature || "",
            companylogo: userData.companylogo || "",
            gstno: userData.gstno || "",
            cinno: userData.cinno || "",
            companyurl: userData.companyurl || "",
            address: userData.address || ""
          });
          
          setTempData({
            id: userData.id || "",
            name: userData.name || "",
            lastname: userData.lastname || "",
            email: userData.email || "",
            phoneno: userData.phoneno || "",
            registercompanyname: userData.registercompanyname || "",
            status: userData.status || "active",
            stampImg: userData.stampImg || "",
            signature: userData.signature || "",
            companylogo: userData.companylogo || "",
            gstno: userData.gstno || "",
            cinno: userData.cinno || "",
            companyurl: userData.companyurl || "",
            address: userData.address || ""
          });
          
          // Also update the localStorage with this more complete data
          localStorage.setItem("user", JSON.stringify(userData));
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching subadmin data:", error);
        setError("Failed to load profile data. Please try again.");
        
        // Fallback to localStorage if API fails
        const fallbackData = JSON.parse(localStorage.getItem("user"));
        if (fallbackData) {
          console.log("Falling back to localStorage data");
          setProfileData({
            id: fallbackData.id || "",
            name: fallbackData.name || "",
            lastname: fallbackData.lastname || "",
            email: fallbackData.email || "",
            phoneno: fallbackData.phoneno || "",
            registercompanyname: fallbackData.registercompanyname || "",
            status: fallbackData.status || "active",
            stampImg: fallbackData.stampImg || "",
            signature: fallbackData.signature || "",
            companylogo: fallbackData.companylogo || ""
          });
          
          setTempData({
            id: fallbackData.id || "",
            name: fallbackData.name || "",
            lastname: fallbackData.lastname || "",
            email: fallbackData.email || "",
            phoneno: fallbackData.phoneno || "",
            registercompanyname: fallbackData.registercompanyname || "",
            status: fallbackData.status || "active",
            stampImg: fallbackData.stampImg || "",
            signature: fallbackData.signature || "",
            companylogo: fallbackData.companylogo || ""
          });
        }
        
        setLoading(false);
      }
    };
    
    fetchSubadminData();
  }, []);
  
  // Function to get the correct image URL with fallback
  const getImageUrl = (imagePath, defaultImage = '/image/lap2.jpg') => {
    // Just use default images since we've verified the real images aren't available
    return defaultImage;
  };

  // Function to fetch images from the server - not used due to 500 error
  const fetchImages = async (subadminId) => {
    if (!subadminId) {
      console.error("No subadminId provided");
      return;
    }

    console.log(`Setting up image paths for subadmin ID: ${subadminId}`);
    
    // Just use static image paths instead of API calls
    setCompanyLogoPreview(getImageUrl(profileData.companylogo));
    setStampImgPreview(getImageUrl(profileData.stampImg));
    setSignaturePreview(getImageUrl(profileData.signature));
    
    // We won't try to fetch from API anymore since it gives 500 error
    console.log("Using static image paths:", {
      logo: getImageUrl(profileData.companylogo),
      stamp: getImageUrl(profileData.stampImg),
      signature: getImageUrl(profileData.signature)
    });
  };

  // Dedicated effect for setting up images
  useEffect(() => {
    if (profileData && profileData.id) {
      console.log("Setting up default images");
      // Just set default images since real ones aren't available
      setCompanyLogoPreview("/image/lap2.jpg");
      setStampImgPreview("/image/lap2.jpg");
      setSignaturePreview("/image/lap2.jpg");
    }
  }, [profileData.id]); // Only re-run when the ID changes
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData({
      ...tempData,
      [name]: value,
    });
  };

  const handleEdit = () => {
    setTempData({...profileData});
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    // Reset file states
    setCompanyLogoFile(null);
    setStampImgFile(null);
    setSignatureFile(null);
    
    // Reset preview URLs to default images
    setCompanyLogoPreview("/image/lap2.jpg");
    setStampImgPreview("/image/lap2.jpg");
    setSignaturePreview("/image/lap2.jpg");
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Create form data for the API
      const formData = new FormData();
      formData.append('name', tempData.name);
      formData.append('lastname', tempData.lastname);
      formData.append('email', tempData.email);
      formData.append('phoneno', tempData.phoneno);
      formData.append('registercompanyname', tempData.registercompanyname);
      formData.append('status', tempData.status || 'active');
      
      // Add files if selected
      if (companyLogoFile) {
        formData.append('companylogo', companyLogoFile);
      }
      
      if (stampImgFile) {
        formData.append('stampImg', stampImgFile);
      }
      
      if (signatureFile) {
        formData.append('signature', signatureFile);
      }
      
      // Call the API
      const response = await axios.put(
        `http://localhost:8282/api/subadmin/update-fields/${profileData.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log("Profile update response:", response.data);
      
      // Update local storage with the new data
      const updatedUser = response.data;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Update state
      setProfileData(updatedUser);
      setEditMode(false);
      setShowSuccessModal(true);
      
      // Hide success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Create a preview URL for the image
    const previewUrl = URL.createObjectURL(file);
    
    switch(type) {
      case 'logo':
        setCompanyLogoFile(file);
        setCompanyLogoPreview(previewUrl);
        break;
      case 'stamp':
        setStampImgFile(file);
        setStampImgPreview(previewUrl);
        break;
      case 'signature':
        setSignatureFile(file);
        setSignaturePreview(previewUrl);
        break;
      default:
        break;
    }
  };

  // Separate component for image with fallbacks
  const ImageWithFallback = ({ filename, altText, type, onLoaded }) => {
    const [srcIndex, setSrcIndex] = useState(0);
    const [error, setError] = useState(false);
    const [attempted, setAttempted] = useState(false);
    
    // Only try one direct API call on initial mount to prevent excessive console errors
    useEffect(() => {
      if (attempted || !filename) {
        return;
      }
      
      setAttempted(true);
      
      // Define local fallback images to use when remote images fail
      const localFallbacks = {
        logo: "/image/lap2.jpg",
        stamp: "/image/lap2.jpg",
        signature: "/image/lap2.jpg"
      };
      
      // Define all possible image source paths in priority order
      const sources = [
        // Add direct paths that might work
        `http://localhost:8282/images/${filename}`,
        `http://localhost:8282/upload/${filename}`,
        `http://localhost:8282/static/images/${filename}`,
        `http://localhost:8282/static/resources/${filename}`,
        // Use local fallback as last resort
        localFallbacks[type]
      ];
      
      // Try to load the image directly
      const img = new Image();
      let currentSourceIndex = 0;
      
      img.onload = () => {
        setSrcIndex(currentSourceIndex);
        console.log(`Successfully loaded ${type} image from ${sources[currentSourceIndex]}`);
        onLoaded();
      };
      
      img.onerror = () => {
        currentSourceIndex++;
        if (currentSourceIndex < sources.length) {
          console.log(`Trying next source for ${type}: ${sources[currentSourceIndex]}`);
          img.src = sources[currentSourceIndex];
        } else {
          console.log(`All sources failed for ${type}, using placeholder`);
          setError(true);
          onLoaded();
        }
      };
      
      // Start loading the first source
      img.src = sources[currentSourceIndex];
      
    }, [filename, type, onLoaded, attempted]);
    
    // Define local fallback images to use when remote images fail
    const localFallbacks = {
      logo: "/image/lap2.jpg",
      stamp: "/image/lap2.jpg",
      signature: "/image/lap2.jpg"
    };
    
    // All sources failed, show placeholder
    if (error || !filename) {
      return (
        <div className="text-center text-gray-400">
          {type === 'logo' && <FaBuilding size={32} className="mx-auto mb-2" />}
          {type === 'stamp' && <FaStamp size={32} className="mx-auto mb-2" />}
          {type === 'signature' && <FaSignature size={32} className="mx-auto mb-2" />}
          <p>No {altText.toLowerCase()} available</p>
        </div>
      );
    }
    
    // Define all possible image source paths in priority order
    const sources = [
      `http://localhost:8282/images/${filename}`,
      `http://localhost:8282/upload/${filename}`,
      `http://localhost:8282/static/images/${filename}`,
      `http://localhost:8282/static/resources/${filename}`,
      localFallbacks[type]
    ];
    
    return (
      <img 
        src={srcIndex < sources.length ? sources[srcIndex] : localFallbacks[type]} 
        alt={altText} 
        className="max-h-40 max-w-full object-contain"
        onError={() => {
          if (srcIndex < sources.length - 1) {
            setSrcIndex(prevIndex => prevIndex + 1);
          } else {
            setError(true);
            onLoaded();
          }
        }}
        onLoad={onLoaded}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 rounded-lg p-4 text-red-200">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 text-white rounded-lg shadow-xl p-6 max-w-5xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
          <FaUser className="mr-2" /> Profile Information
        </h2>
        
        {/* Edit/Save Buttons */}
        <div>
          {editMode ? (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaSave /> Save
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
              >
                <FaTimes /> Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-300"
            >
              <FaEdit /> Edit Profile
            </button>
          )}
        </div>
      </div>
      
      {/* Profile Information */}
      <div className="bg-slate-700 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
              <FaIdCard /> Personal Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">First Name</p>
                <div className="flex items-center gap-2">
                  <FaUser className="text-blue-400" />
                  {editMode ? (
                    <input
                      type="text"
                      name="name"
                      value={tempData.name}
                      onChange={handleInputChange}
                      className="bg-slate-800 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-white">{profileData.name}</span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Last Name</p>
                <div className="flex items-center gap-2">
                  <FaUser className="text-blue-400" />
                  {editMode ? (
                    <input
                      type="text"
                      name="lastname"
                      value={tempData.lastname}
                      onChange={handleInputChange}
                      className="bg-slate-800 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-white">{profileData.lastname}</span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <FaRegEnvelope className="text-blue-400" />
                  {editMode ? (
                    <input
                      type="email"
                      name="email"
                      value={tempData.email}
                      onChange={handleInputChange}
                      className="bg-slate-800 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-white">{profileData.email}</span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Phone Number</p>
                <div className="flex items-center gap-2">
                  <FaPhone className="text-blue-400" />
                  {editMode ? (
                    <input
                      type="text"
                      name="phoneno"
                      value={tempData.phoneno}
                      onChange={handleInputChange}
                      className="bg-slate-800 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-white">{profileData.phoneno}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Company Information */}
          <div>
            <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
              <FaBuilding /> Company Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Company Name</p>
                <div className="flex items-center gap-2">
                  <FaBuilding className="text-blue-400" />
                  {editMode ? (
                    <input
                      type="text"
                      name="registercompanyname"
                      value={tempData.registercompanyname}
                      onChange={handleInputChange}
                      className="bg-slate-800 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-white">{profileData.registercompanyname}</span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <FaUserTie className="text-blue-400" />
                  {editMode ? (
                    <select
                      name="status"
                      value={tempData.status}
                      onChange={handleInputChange}
                      className="bg-slate-800 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  ) : (
                    <span className="text-white capitalize">{profileData.status}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Images Section */}
      <div className="bg-slate-700 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
          <FaIdCard /> Images & Signature
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Logo */}
          <div>
            <p className="text-gray-400 text-sm mb-2">Company Logo</p>
            <div className="relative bg-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-slate-600 p-4 h-48">
              {/* <ImageWithFallback
                filename={profileData.companylogo}
                altText="Company Logo"
                type="logo"
                onLoaded={() => console.log("Company logo loaded")}
              /> */}

              <img 
                src={`http://localhost:8282/images/profile/${profileData.companylogo}`} 
                alt="Company Logo" 
                className="max-h-40 max-w-full object-contain"
              />
              
              {editMode && (
                <div className="absolute bottom-2 right-2">
                  <input
                    type="file"
                    id="companyLogoUpload"
                    value={tempData.companylogo}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                  />
                  <label 
                    htmlFor="companyLogoUpload" 
                    className="cursor-pointer bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all duration-300"
                  >
                    <FaEdit />
                  </label>
                </div>
              )}
            </div>
          </div>
          
          {/* Stamp Image */}
          <div>
            <p className="text-gray-400 text-sm mb-2">Stamp Image</p>
            <div className="relative bg-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-slate-600 p-4 h-48">
              {/* <ImageWithFallback
                filename={profileData.stampImg}
                altText="Stamp"
                type="stamp"
                onLoaded={() => console.log("Stamp image loaded")}
              /> */}

              <img 
                src={`http://localhost:8282/images/profile/${profileData.stampImg}`} 
                alt="Stamp" 
                className="max-h-40 max-w-full object-contain"
              />
              
              {editMode && (
                <div className="absolute bottom-2 right-2">
                  <input
                    type="file"
                    id="stampImageUpload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'stamp')}
                  />
                  <label 
                    htmlFor="stampImageUpload" 
                    className="cursor-pointer bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all duration-300"
                  >
                    <FaEdit />
                  </label>
                </div>
              )}
            </div>
          </div>
          
          {/* Signature */}
          <div>
            <p className="text-gray-400 text-sm mb-2">Signature</p>
            <div className="relative bg-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-slate-600 p-4 h-48">
              {/* <ImageWithFallback
                filename={profileData.signature}
                altText="Signature"
                type="signature"
                onLoaded={() => console.log("Signature image loaded")}
              /> */}

              <img 
                src={`http://localhost:8282/images/profile/${profileData.signature}`} 
                value={tempData.signature}
                alt="Signature" 
                className="max-h-40 max-w-full object-contain"
              />
              
              {editMode && (
                <div className="absolute bottom-2 right-2">
                  <input
                    type="file"
                    id="signatureUpload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'signature')}
                  />
                  <label 
                    htmlFor="signatureUpload" 
                    className="cursor-pointer bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all duration-300"
                  >
                    <FaEdit />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit/Save Buttons - visible on mobile */}
      <div className="md:hidden flex justify-center mt-6">
        {editMode ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Saving..." : <><FaSave /> Save</>}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
            >
              <FaTimes /> Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-300"
          >
            <FaEdit /> Edit Profile
          </button>
        )}
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="bg-slate-800 border border-blue-600 rounded-lg shadow-2xl p-6 z-10 w-full max-w-md mx-4 transform transition-all animate-scaleIn">
            <div className="flex items-center gap-3 text-green-500 mb-4">
              <div className="bg-green-500 rounded-full p-2 text-white">
                <FaCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Success</h3>
            </div>
            <p className="text-gray-300 mb-6">Profile information updated successfully!</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileForm; 