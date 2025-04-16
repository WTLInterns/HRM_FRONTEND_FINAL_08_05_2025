import React, { useState, useEffect } from "react";
import { FaBuilding, FaEdit, FaTrash, FaEnvelope, FaSearch, FaSignature, FaStamp, FaUser, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../DashoBoard/animations.css";

const ViewCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch companies from backend API
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        
        // Fetch data from the API
        const response = await fetch('http://localhost:8282/api/subadmin/all');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched subadmin data:', data);
        setCompanies(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setLoading(false);
      }
    };
    
    fetchCompanies();
    
    // Set up event listener for company updates
    const handleCompanyUpdates = () => {
      fetchCompanies();
    };
    
    window.addEventListener('companiesUpdated', handleCompanyUpdates);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('companiesUpdated', handleCompanyUpdates);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company => 
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.registercompanyname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredCompanies.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredCompanies.length / rowsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleEdit = (id) => {
    // Find the company to edit
    const companyToEdit = companies.find(company => company.id === id);
    
    if (companyToEdit) {
      // Store the company to edit in localStorage
      localStorage.setItem('companyToEdit', JSON.stringify(companyToEdit));
      
      // Navigate to the register company page with edit mode
      navigate('/masteradmin/register-company?mode=edit');
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (id) => {
    const company = companies.find(company => company.id === id);
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (companyToDelete) {
      try {
        // Make an API call to delete the company
        const response = await fetch(`http://localhost:8282/api/subadmin/delete/${companyToDelete.id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Update the local state after successful deletion
        const updatedCompanies = companies.filter(company => company.id !== companyToDelete.id);
        setCompanies(updatedCompanies);
        
        // Update pagination if needed
        if (currentRows.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        
        // Dispatch custom event to update dashboard
        window.dispatchEvent(new Event('companiesUpdated'));
        
        // Close the modal
        setShowDeleteModal(false);
        setCompanyToDelete(null);
        
        alert('Company deleted successfully');
      } catch (error) {
        console.error("Error deleting company:", error);
        alert("Failed to delete company. Please try again.");
      }
    }
  };

  // Cancel delete action
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCompanyToDelete(null);
  };

  const handleSendLoginDetails = async (id) => {
    try {
      const company = companies.find(c => c.id === id);
      if (!company || !company.email) {
        alert('Company email not found');
        return;
      }
      
      // Call the API to send login details
      const response = await fetch(`http://localhost:8282/api/subadmin/send-email/${company.email}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      alert(`Login details successfully sent to ${company.email}`);
    } catch (error) {
      console.error('Error sending login details:', error);
      alert('Failed to send login details. Please try again.');
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-800/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-700 animate-fadeIn text-gray-100">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={cancelDelete}></div>
          <div className="bg-slate-800 rounded-lg shadow-xl border border-red-800 w-full max-w-md p-6 z-10 animate-scaleIn">
            <div className="flex items-center mb-4 text-red-500">
              <FaExclamationTriangle className="text-2xl mr-3" />
              <h3 className="text-xl font-semibold">Delete Confirmation</h3>
              <button onClick={cancelDelete} className="ml-auto p-1 hover:bg-slate-700 rounded-full transition-colors">
                <FaTimes className="text-gray-400 hover:text-white" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="mb-2">Are you sure you want to delete this company?</p>
              {companyToDelete && (
                <div className="bg-slate-900/60 p-3 rounded-md border border-slate-700 mt-3">
                  <p className="font-semibold text-blue-400">{companyToDelete.registercompanyname}</p>
                  <p className="text-sm text-gray-300">{companyToDelete.email}</p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button 
                onClick={cancelDelete}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-900/50 rounded-full text-blue-400">
            <FaBuilding className="text-xl md:text-2xl" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-100">Registered Companies</h2>
        </div>
        
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-blue-400" />
          </div>
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full md:w-64 pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      ) : (
        <div className="rounded-lg shadow-sm overflow-hidden bg-slate-900/50 border border-slate-700">
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-slate-700 table-fixed">
              <thead className="bg-slate-800">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/5">
                    Contact
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/4">
                    Company
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/5">
                    Contact Info
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/12">
                    Docs
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/12">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-900 divide-y divide-slate-800">
                {currentRows.length > 0 ? (
                  currentRows.map((company, index) => (
                    <tr 
                      key={company.id} 
                      className={`hover:bg-slate-800 transform transition duration-300 animate-fadeIn`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Contact Person */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-blue-900 to-blue-800 rounded-full flex items-center justify-center shadow-sm">
                            <FaUser className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-100">{company.name} {company.lastname}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Company Name */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-full flex items-center justify-center shadow-sm">
                            <FaBuilding className="h-4 w-4 text-indigo-400" />
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-100">{company.registercompanyname}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[150px]">{company.address}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Contact Info */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-100">{company.email}</div>
                        <div className="text-sm text-gray-400">{company.phoneno}</div>
                      </td>
                      
                      {/* Documents */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span 
                            className={`px-1 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              company.signature ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-gray-900/50 text-gray-400 border border-gray-800'
                            } shadow-sm`}
                            title="Signature"
                          >
                            <FaSignature className="mr-1" /> {company.signature ? "Yes" : "No"}
                          </span>
                          <span 
                            className={`px-1 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              company.stampImg ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-gray-900/50 text-gray-400 border border-gray-800'
                            } shadow-sm`}
                            title="Company Stamp"
                          >
                            <FaStamp className="mr-1" /> {company.stampImg ? "Yes" : "No"}
                          </span>
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${
                          company.status && company.status.toLowerCase() === 'active' 
                            ? 'bg-green-900/50 text-green-400 border border-green-800' 
                            : 'bg-red-900/50 text-red-400 border border-red-800'
                        }`}>
                          {company.status && company.status.toLowerCase() === 'active' 
                            ? 'Active' 
                            : 'Inactive'}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit(company.id)}
                            className="text-indigo-400 hover:text-indigo-300 hover:scale-125 transition-all duration-300 bg-indigo-900/30 p-1.5 rounded-full"
                            title="Edit company details"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(company.id)}
                            className="text-red-400 hover:text-red-300 hover:scale-125 transition-all duration-300 bg-red-900/30 p-1.5 rounded-full"
                            title="Delete company"
                          >
                            <FaTrash size={16} />
                          </button>
                          <button 
                            onClick={() => handleSendLoginDetails(company.id)}
                            className="text-green-400 hover:text-green-300 hover:scale-125 transition-all duration-300 bg-green-900/30 p-1.5 rounded-full"
                            title="Send login details"
                          >
                            <FaEnvelope size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 md:px-6 py-6 text-center text-sm text-gray-400 bg-slate-800/50">
                      <div className="flex flex-col items-center">
                        <FaSearch className="text-gray-500 mb-2 text-2xl" />
                        <p>No companies found matching your search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {filteredCompanies.length > 0 && (
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-slate-700 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    Showing <span className="font-medium">{indexOfFirstRow + 1}</span> to{" "}
                    <span className="font-medium">
                      {indexOfLastRow > filteredCompanies.length ? filteredCompanies.length : indexOfLastRow}
                    </span>{" "}
                    of <span className="font-medium">{filteredCompanies.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600 bg-slate-800 text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <FaChevronLeft className="h-3 w-3" aria-hidden="true" />
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-3 py-2 border border-slate-600 text-sm font-medium ${
                          currentPage === i + 1
                            ? 'z-10 bg-blue-900/50 border-blue-700 text-blue-300'
                            : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600 bg-slate-800 text-sm font-medium ${
                        currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <FaChevronRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
              
              <div className="flex items-center sm:hidden mt-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md ${
                    currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  Previous
                </button>
                <p className="text-sm text-gray-300 mx-4">
                  Page {currentPage} of {totalPages}
                </p>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md ${
                    currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewCompany; 