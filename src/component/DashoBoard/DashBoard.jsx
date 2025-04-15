import React, { useEffect, useState, useMemo } from "react";
import { Link, Routes, Route } from "react-router-dom";
import Attendance from "./Attendance";
import SalarySheet from "./SalarySheet";
import SalarySlip from "./SalarySlip";
import AddEmp from "./AddEmp";
import ViewAttendance from "./ViewAttendance";
import { IoIosLogOut, IoIosPersonAdd } from "react-icons/io";
import { LuNotebookPen } from "react-icons/lu";
import { MdOutlinePageview, MdKeyboardArrowDown, MdKeyboardArrowRight, MdDashboard } from "react-icons/md";
import { FaReceipt, FaCalendarAlt, FaRegIdCard, FaExclamationTriangle, FaTimes, FaSignOutAlt, FaChartPie, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { BiSolidSpreadsheet } from "react-icons/bi";
import { HiMenu, HiX } from "react-icons/hi";
import { useApp } from "../../context/AppContext";
import Home from "./Home";
import ProfileForm from "./ProfileForm";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import "./animations.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
  const { fetchAllEmp, emp, logoutUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attendanceDropdownOpen, setAttendanceDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProfitable, setIsProfitable] = useState(false);
  const [companyBudget] = useState(1000000); // 10 lakh budget
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalSalary: 0,
    activeSalary: 0,
    inactiveSalary: 0,
    profitLoss: 0
  });

  // Add user data state
  const [userData, setUserData] = useState({
    name: "",
    lastname: "",
    companylogo: "",
    registercompanyname: "WTL HRM Dashboard"
  });
  
  // Add image load tracking
  const [logoLoadAttempt, setLogoLoadAttempt] = useState(0);
  
  // Get backend URL
  const BACKEND_URL = useMemo(() => "http://localhost:8282", []);
  
  // Default image
  const defaultImage = "/image/admin-profile.jpg";
  
  // Load user data from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({
        name: user.name || "",
        lastname: user.lastname || "",
        companylogo: user.companylogo || "",
        registercompanyname: user.registercompanyname || "WTL HRM Dashboard"
      });
    }
  }, []);

  useEffect(() => {
    if (!emp || emp.length === 0) {
      fetchAllEmp();
    }
  }, [emp, fetchAllEmp]);

  useEffect(() => {
    const calculateStats = () => {
      try {
        setLoading(true);
        
        const activeEmployees = emp.filter(employee => employee.status === "Active" || employee.status === "active");
        const inactiveEmployees = emp.filter(employee => employee.status === "Inactive" || employee.status === "inactive");
        
        const activeSalary = activeEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
        const inactiveSalary = inactiveEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
        const totalSalary = activeSalary + inactiveSalary;
        
        // Calculate profit/loss
        const profitLoss = companyBudget - totalSalary;
        const profitable = profitLoss > 0;
        setIsProfitable(profitable);
        
        setStats({
          totalEmployees: emp.length,
          activeEmployees: activeEmployees.length,
          inactiveEmployees: inactiveEmployees.length,
          totalSalary,
          activeSalary,
          inactiveSalary,
          profitLoss
        });
        setLoading(false);
      } catch (error) {
        console.error("Error calculating stats:", error);
        setLoading(false);
      }
    };
    
    calculateStats();
    
    // Add event listener for updates
    window.addEventListener('employeesUpdated', calculateStats);
    
    return () => {
      window.removeEventListener('employeesUpdated', calculateStats);
    };
  }, [emp, companyBudget]);

  // Prepare pie chart data
  const pieChartData = {
    labels: ['Active Salary', 'Inactive Salary'],
    datasets: [
      {
        data: [stats.activeSalary, stats.inactiveSalary],
        backgroundColor: [
          'rgba(56, 189, 248, 0.85)',   // Sky blue for active
          'rgba(251, 113, 133, 0.85)',  // Modern pink for inactive
        ],
        borderColor: [
          'rgba(56, 189, 248, 1)',
          'rgba(251, 113, 133, 1)',
        ],
        borderWidth: 0,
        hoverBackgroundColor: [
          'rgba(56, 189, 248, 1)',
          'rgba(251, 113, 133, 1)',
        ],
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 2,
        borderRadius: 6,
        spacing: 8,
        offset: 6,
      },
    ],
  };

  // Define yearlyData for the bar chart
  const yearlyData = [
    { year: '2020', profit: 80000, loss: 20000 },
    { year: '2021', profit: 90000, loss: 15000 },
    { year: '2022', profit: 120000, loss: 25000 },
    { year: '2023', profit: 150000, loss: 30000 },
    { year: '2024', profit: 200000, loss: 40000 },
  ];

  // Prepare bar chart data
  const barChartData = {
    labels: yearlyData.map(item => item.year),
    datasets: [
      {
        label: 'Profit',
        data: yearlyData.map(item => item.profit),
        backgroundColor: 'rgba(56, 189, 248, 0.85)',
        borderColor: 'rgba(56, 189, 248, 1)',
        borderWidth: 1,
      },
      {
        label: 'Loss',
        data: yearlyData.map(item => item.loss),
        backgroundColor: 'rgba(251, 113, 133, 0.85)',
        borderColor: 'rgba(251, 113, 133, 1)',
        borderWidth: 1,
      }
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    radius: '85%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: {
          size: 16,
          weight: 'bold'
        },
        bodyFont: {
          size: 14
        },
        padding: 15,
        cornerRadius: 8,
        caretSize: 0,
        borderColor: '#475569',
        borderWidth: 0,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
          },
          labelTextColor: () => '#ffffff'
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutCirc',
      delay: (context) => context.dataIndex * 200
    },
    elements: {
      arc: {
        borderWidth: 0
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#475569',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ₹${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff',
          callback: (value) => `₹${value.toLocaleString()}`
        }
      }
    }
  };

  // Count active and inactive employees
  const activeEmp = emp.filter((employee) => employee.status === "Active" || employee.status === "active");
  const inactiveEmp = emp.filter((employee) => employee.status === "Inactive" || employee.status === "inactive");
  const activeEmpCount = activeEmp.length;
  const inactiveEmpCount = inactiveEmp.length;

  // Group employees by job role and count active/inactive for each role
  const jobRoleSummary = emp.reduce((acc, employee) => {
    const role = employee.jobRole;
    if (!acc[role]) {
      acc[role] = { active: 0, inactive: 0 };
    }
    if (employee.status === "Active" || employee.status === "active") {
      acc[role].active += 1;
    } else {
      acc[role].inactive += 1;
    }
    return acc;
  }, {});

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleAttendanceDropdown = () => {
    setAttendanceDropdownOpen(!attendanceDropdownOpen);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logoutUser();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Navigation links array for DRY code
  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <MdDashboard /> },
    { to: "/dashboard/profileform", label: "Profile", icon: <FaRegIdCard /> },
    { to: "/dashboard/addEmp", label: "Add Employee", icon: <IoIosPersonAdd /> },
    { 
      label: "Attendance",
      icon: <LuNotebookPen />,
      dropdown: true,
      children: [
        { to: "/dashboard/attendance", label: "Mark Attendance", icon: <FaCalendarAlt /> },
        { to: "/dashboard/viewAtt", label: "View Attendance", icon: <MdOutlinePageview /> },
      ]
    },
    { to: "/dashboard/salarysheet", label: "Salary Sheet", icon: <BiSolidSpreadsheet /> },
    { to: "/dashboard/salaryslip", label: "Salary Slip", icon: <FaReceipt /> },
  ];

  // Handle logo error without infinite loops
  const handleLogoError = () => {
    console.log("Error loading dashboard logo, using fallback.");
    
    // Don't update state if we've already tried too many times
    if (logoLoadAttempt > 1) return;
    
    // Increment the attempt counter
    setLogoLoadAttempt(prev => prev + 1);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-blue-900 text-gray-100">
      
      {/* Mobile menu button - only visible on small screens */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Header - only visible on small screens */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-center p-4 bg-slate-800 text-white shadow-md">
        <h1 className="text-xl font-bold animate-pulse-slow">{userData.registercompanyname || "WTL HRM Dashboard"}</h1>
      </div>

      {/* Sidebar */}
      <aside 
        className={`${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:relative left-0 h-full w-64 bg-slate-800 text-white shadow-xl z-40 overflow-y-auto flex flex-col`}
      >
        <div className="flex flex-col items-center px-4 py-5 bg-slate-900 border-b border-slate-700">
          <Link to="/dashboard/profileform" className="group transition-all duration-300">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-blue-800 overflow-hidden mb-4 group-hover:border-blue-400 transition-all duration-300 shadow-lg group-hover:shadow-blue-900/40">
              {userData.companylogo && logoLoadAttempt < 1 ? (
                <img 
                  src={`${BACKEND_URL}/upload/${userData.companylogo}`} 
                  alt="Company Logo" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
                  onError={(e) => {
                    handleLogoError();
                    e.target.src = defaultImage;
                    e.target.onerror = null; // Prevent infinite loop
                  }}
                />
              ) : (
                <img 
                  src={defaultImage} 
                  alt="Admin" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
                  onError={(e) => {
                    e.target.src = "/image/lap2.jpg"; 
                    e.target.onerror = null;
                  }}
                />
              )}
            </div>
            <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-all duration-300 text-center">
              {userData.registercompanyname || "WTL HRM Dashboard"}
            </h2>
            {userData.name && (
              <p className="text-blue-400 group-hover:text-blue-300 transition-all duration-300 text-center">
                {userData.name} {userData.lastname}
              </p>
            )}
          </Link>
        </div>

        <nav className="px-4 py-3 flex-grow">
          <div className="space-y-0">
            {navLinks.map((link, index) => (
              link.dropdown ? (
                <div key={index} className="mb-1 animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <button
                    onClick={toggleAttendanceDropdown}
                    className="flex items-center justify-between w-full gap-2 p-2 rounded hover:bg-slate-700 hover:text-blue-400 transition-all duration-300 menu-item ripple"
                  >
                    <div className="flex items-center gap-2">
                      {link.icon && <span className="text-blue-400 w-6">{link.icon}</span>} {link.label}
                    </div>
                    {attendanceDropdownOpen ? <MdKeyboardArrowDown className="transition-transform duration-300 text-blue-400" /> : <MdKeyboardArrowRight className="transition-transform duration-300 text-blue-400" />}
                  </button>
                  {attendanceDropdownOpen && (
                    <div className="pl-8 mt-1 space-y-1 animate-slideIn">
                      {link.children.map((child, childIndex) => (
                        <Link
                          key={childIndex}
                          to={child.to}
                          className="flex items-center gap-2 p-2 rounded hover:bg-slate-700 hover:text-blue-400 transition-all duration-300 menu-item hover:translate-x-2"
                          onClick={closeMobileMenu}
                        >
                          {child.icon && <span className="text-blue-400 w-6">{child.icon}</span>} {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={index}
                  to={link.to}
                  className="flex items-center gap-2 p-2 my-1 rounded hover:bg-slate-700 hover:text-blue-400 transition-all duration-300 menu-item ripple animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={closeMobileMenu}
                >
                  {link.icon && <span className="text-blue-400 w-6">{link.icon}</span>} {link.label}
                </Link>
              )
            ))}
          </div>
        </nav>

        <div className="mt-auto px-4 pb-6">
          <button
            onClick={handleLogoutClick}
            className="flex items-center justify-center gap-2 p-3 w-full rounded bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md btn-interactive"
          >
            <FaSignOutAlt className="text-white" /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile menu - only visible when menu is open on small screens */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-30"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {/* Add top padding on mobile to account for the fixed header */}
        <div className="pt-16 lg:pt-0 h-full page-transition-container animate-fadeIn">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="addEmp" element={<AddEmp />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="salarysheet" element={<SalarySheet />} />
            <Route path="salaryslip" element={<SalarySlip />} />
            <Route path="viewAtt" element={<ViewAttendance />} />
            <Route path="profileform" element={<ProfileForm />} />
          </Routes>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300" 
            onClick={cancelLogout}
          ></div>
          <div className="bg-slate-800 rounded-lg shadow-xl border border-orange-800 w-full max-w-md p-6 z-10 animate-scaleIn transform transition-all duration-300">
            <div className="flex items-center mb-4 text-orange-500">
              <FaExclamationTriangle className="text-2xl mr-3 animate-pulse" />
              <h3 className="text-xl font-semibold">Logout Confirmation</h3>
              <button 
                onClick={cancelLogout} 
                className="ml-auto p-1 hover:bg-slate-700 rounded-full transition-colors duration-200"
              >
                <FaTimes className="text-gray-400 hover:text-white" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="mb-2 text-gray-200">Are you sure you want to logout?</p>
              <p className="text-gray-400 text-sm">Your session will be ended and you'll need to log in again to access the dashboard.</p>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button 
                onClick={cancelLogout}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              >
                <FaSignOutAlt className="transform group-hover:translate-x-[-2px] transition-transform duration-300" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
