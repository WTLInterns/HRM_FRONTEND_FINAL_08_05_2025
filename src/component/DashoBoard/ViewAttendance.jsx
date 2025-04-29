// import React, { useState, useEffect } from "react";
// import Calendar from "react-calendar";
// import "react-calendar/dist/Calendar.css"; // Default react-calendar styles
// import axios from "axios";
// import "./calendar-custom.css"; // Import custom calendar styles
// import "./animations.css";
// import { FaCalendarAlt, FaUserCheck, FaSearch, FaTimes } from 'react-icons/fa';
// import { toast } from "react-hot-toast";

// export default function ViewAttendance() {
//   // Attempt to get the logged-in user from localStorage
//   const [loggedUser, setLoggedUser] = useState(null);

//   // We'll store only the employee's full name in a local state
//   const [empFullName, setEmpFullName] = useState("");

//   const [empName, setEmpName] = useState("");
//   const [attendanceData, setAttendanceData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
//   const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [showTooltip, setShowTooltip] = useState(false);
//   const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
//   const [tooltipContent, setTooltipContent] = useState({});

//   // On mount, fetch the user from localStorage
//   useEffect(() => {
//     const userData = localStorage.getItem("user");
//     if (userData) {
//       setLoggedUser(JSON.parse(userData));
//     }
//   }, []);

//   // Format date to dd-mm-yyyy
//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}-${month}-${year}`;
//   };

//   // Handle only the Employee Full Name input
//   const handleFullNameInputChange = (e) => {
//     setEmpFullName(e.target.value);
//   };

//   // Fetch attendance data
//   const fetchAttendance = async () => {
//     if (!empFullName.trim()) {
//       setError("Please enter an Employee Full Name");
//       return;
//     }
//     // Make sure we have a valid user with ID
//     if (!loggedUser || !loggedUser.id) {
//       setError("No Subadmin found in localStorage. Please log in again.");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       const subadminId = loggedUser.id; // Retrieve subadminId from the logged-in user
//       const encodedFullName = encodeURIComponent(empFullName);
//       console.log(`Fetching attendance for Subadmin ID ${subadminId} and name ${encodedFullName}`);

//       const response = await axios.get(
//         `https://api.aimdreamplanner.com/api/employee/${subadminId}/${encodedFullName}/attendance`
//       );
//       console.log("Attendance data:", response.data);

//       setAttendanceData(response.data);
//       setEmpName(response.data[0]?.employee?.firstName || "Employee");
      
//       // If you have a function like updateStats, call it here if needed
//       // updateStats(response.data);
//     } catch (error) {
//       console.error("Error fetching attendance:", error);
//       toast.error("Failed to load attendance data");
//       setError(`Error fetching attendance data: ${error.message}`);
//       setAttendanceData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const clearAttendance = () => {
//     setEmpFullName("");
//     setAttendanceData([]);
//     setError("");
//     setEmpName("");
//     setSelectedDate(null);
//   };

//   // Called whenever the user navigates to a different month/year in the calendar
//   const handleMonthChange = ({ activeStartDate, view }) => {
//     if (view === "month") {
//       setCurrentMonth(activeStartDate.getMonth());
//       setCurrentYear(activeStartDate.getFullYear());
//     }
//   };

//   // Handle date click in calendar
//   const handleDateClick = (value) => {
//     // Create a date object without time component
//     const clickedDate = new Date(value);
//     clickedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
//     const dateStr = clickedDate.toISOString().split('T')[0];
    
//     setSelectedDate(dateStr);
    
//     // Find attendance record for this date
//     const record = attendanceData.find(item => item.date === dateStr);
    
//     setTooltipContent(record || {});
//   };

//   // Define color classes for each status
//   const statusColors = {
//     Present: "bg-green-900/30 border-green-700",
//     Absent: "bg-red-900/30 border-red-700",
//     "Half-Day": "bg-yellow-900/30 border-yellow-700",
//     "Paid Leave": "bg-purple-900/30 border-purple-700",
//     "Week Off": "bg-blue-900/30 border-blue-700",
//     Holiday: "bg-pink-900/30 border-pink-700",
//   };

//   // Custom tile content with improved visual feedback
//   const tileContent = ({ date, view }) => {
//     if (view === 'month') {
//       // Get date in the format stored in attendanceData
//       const clickedDate = new Date(date);
//       clickedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
//       const dateStr = clickedDate.toISOString().split('T')[0];
      
//       // Find attendance record for this date
//       const record = attendanceData.find(item => item.date === dateStr);
      
//       if (record) {
//         return (
//           <div className={`w-full h-full p-1 ${statusColors[record.status]}`}>
//             <div className="text-xs font-bold">{record.status}</div>
//           </div>
//         );
//       }
//     }
//     return null;
//   };

//   // Render attendance summary
//   const renderAttendanceSummary = () => {
//     if (!attendanceData.length) return null;

//     // Count occurrences of each status
//     const statusCounts = attendanceData.reduce((acc, record) => {
//       acc[record.status] = (acc[record.status] || 0) + 1;
//       return acc;
//     }, {});

//     return (
//       <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
//         {Object.entries(statusCounts).map(([status, count]) => (
//           <div 
//             key={status}
//             className={`p-3 rounded-lg border ${statusColors[status] || "border-gray-700"}`}
//           >
//             <div className="font-medium text-lg">{status}</div>
//             <div className="text-2xl font-bold">{count}</div>
//             <div className="text-xs text-gray-400">days</div>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6 animate-fadeIn">
//       {error && (
//         <div className="bg-red-500 text-white p-3 mb-4 rounded animate-shake">{error}</div>
//       )}

//       {/* Search Section */}
//       <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8 border border-blue-900 animate-slideIn">
//         <div className="flex flex-wrap gap-4 items-center">
//           <div className="flex-1">
//             <div className="relative">
//               <input
//                 type="text"
//                 value={empFullName}
//                 onChange={handleFullNameInputChange}
//                 placeholder="Enter Employee Full Name"
//                 className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100 placeholder-gray-400 transition-all duration-300"
//               />
//               <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//             </div>
//           </div>
//           <button
//             onClick={fetchAttendance}
//             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 btn-interactive"
//             disabled={loading}
//           >
//             {loading ? (
//               <div className="flex items-center gap-2">
//                 <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
//                 <span>Loading...</span>
//               </div>
//             ) : (
//               <>
//                 <FaUserCheck /> View Attendance
//               </>
//             )}
//           </button>
//           {attendanceData.length > 0 && (
//             <button
//               onClick={clearAttendance}
//               className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-2 btn-interactive"
//             >
//               <FaTimes /> Clear
//             </button>
//           )}
//         </div>
//       </div>

//       {loading ? (
//         <div className="text-center py-8 text-gray-300">Loading...</div>
//       ) : attendanceData.length > 0 ? (
//         <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-blue-900 animate-slideIn">
//           <h2 className="text-2xl font-semibold mb-4 text-gray-100 flex items-center gap-2">
//             <FaCalendarAlt className="text-blue-400" />
//             Attendance for {empName}
//           </h2>
          
//           {/* Calendar View */}
//           <div className="relative">
//             <Calendar
//               value={null}
//               onActiveStartDateChange={handleMonthChange}
//               onClickDay={handleDateClick}
//               tileContent={tileContent}
//               className="bg-slate-800 text-gray-100 border-gray-700 rounded-lg"
//               showNeighboringMonth={false}
//             />
//           </div>
          
//           {/* Attendance Summary */}
//           {renderAttendanceSummary()}
          
//           {/* Selected Date Details */}
//           {selectedDate && tooltipContent.status && (
//             <div className="mt-6 bg-slate-700 p-6 rounded-lg shadow-lg border border-blue-900 animate-slideIn transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
//               <h3 className="text-lg font-semibold mb-3 text-gray-100 flex items-center gap-2">
//                 <FaCalendarAlt className="text-blue-400 animate-pulse" />
//                 Attendance Details for {formatDate(selectedDate)}
//               </h3>
//               <div className={`p-4 rounded-lg border ${statusColors[tooltipContent.status]} transform transition-all duration-300 hover:scale-[1.02]`}>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <p className="text-gray-400 text-sm">Status</p>
//                     <p className="font-semibold text-lg">{tooltipContent.status}</p>
//                   </div>
//                   <div className="space-y-2">
//                     <p className="text-gray-400 text-sm">Employee</p>
//                     <p className="font-semibold text-lg">{tooltipContent.employee?.firstName || "N/A"}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       ) : null}
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import "./calendar-custom.css";
import "./animations.css";
import { FaCalendarAlt, FaUserCheck, FaSearch, FaTimes } from 'react-icons/fa';
import { toast } from "react-hot-toast";

export default function ViewAttendance() {
  const [loggedUser, setLoggedUser] = useState(null);
  const [empFullName, setEmpFullName] = useState("");
  const [employeeList, setEmployeeList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [empName, setEmpName] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [tooltipContent, setTooltipContent] = useState({});

  // Fetch logged-in subadmin and employee list
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setLoggedUser(user);
      axios
        .get(`https://api.aimdreamplanner.com/api/employee/${user.id}/employee/all`)
        .then(res => setEmployeeList(res.data))
        .catch(err => console.error("Failed to load employee list:", err));
    }
  }, []);

  // Compute autocomplete suggestions
  useEffect(() => {
    const query = empFullName.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      return;
    }
    const list = employeeList.map(emp => ({
      empId: emp.empId,
      fullName: `${emp.firstName} ${emp.lastName}`
    }));
    const startsWith = [];
    const endsWith = [];
    const includes = [];
    list.forEach(item => {
      const name = item.fullName.toLowerCase();
      if (name.startsWith(query)) startsWith.push(item);
      else if (name.endsWith(query)) endsWith.push(item);
      else if (name.includes(query)) includes.push(item);
    });
    setSuggestions([...startsWith, ...endsWith, ...includes]);
  }, [empFullName, employeeList]);

  const formatDate = dateString => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleInputChange = e => setEmpFullName(e.target.value);

  const fetchAttendance = async () => {
    if (!empFullName.trim()) {
      setError("Please enter an Employee Full Name");
      return;
    }
    if (!loggedUser?.id) {
      setError("No Subadmin found. Please log in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const subadminId = loggedUser.id;
      const encodedName = encodeURIComponent(empFullName);
      const res = await axios.get(
        `https://api.aimdreamplanner.com/api/employee/${subadminId}/${encodedName}/attendance`
      );
      setAttendanceData(res.data);
      setEmpName(res.data[0]?.employee?.firstName || "Employee");
    } catch (err) {
      console.error("Error fetching attendance:", err);
      toast.error("Failed to load attendance data");
      setError(`Error fetching attendance data: ${err.message}`);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const clearAttendance = () => {
    setEmpFullName("");
    setAttendanceData([]);
    setError("");
    setEmpName("");
    setSelectedDate(null);
    setSuggestions([]);
  };

  const handleMonthChange = ({ activeStartDate, view }) => {
    if (view === 'month') {
      setCurrentMonth(activeStartDate.getMonth());
      setCurrentYear(activeStartDate.getFullYear());
    }
  };

  const handleDateClick = value => {
    const d = new Date(value);
    d.setHours(12,0,0,0);
    const dateStr = d.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setTooltipContent(attendanceData.find(i => i.date === dateStr) || {});
  };

  const statusColors = {
    Present: "bg-green-900/30 border-green-700",
    Absent: "bg-red-900/30 border-red-700",
    "Half-Day": "bg-yellow-900/30 border-yellow-700",
    "Paid Leave": "bg-purple-900/30 border-purple-700",
    "Week Off": "bg-blue-900/30 border-blue-700",
    Holiday: "bg-pink-900/30 border-pink-700",
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const d = new Date(date);
      d.setHours(12,0,0,0);
      const dateStr = d.toISOString().split('T')[0];
      const rec = attendanceData.find(i => i.date === dateStr);
      return rec ? (
        <div className={`w-full h-full p-1 ${statusColors[rec.status]}`}>
          <div className="text-xs font-bold">{rec.status}</div>
        </div>
      ) : null;
    }
    return null;
  };

  const renderAttendanceSummary = () => {
    if (!attendanceData.length) return null;
    const counts = attendanceData.reduce((acc, rec) => {
      acc[rec.status] = (acc[rec.status] || 0) + 1;
      return acc;
    }, {});
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        {Object.entries(counts).map(([status, cnt]) => (
          <div key={status} className={`p-3 rounded-lg border ${statusColors[status] || 'border-gray-700'}`}>          
            <div className="font-medium text-lg">{status}</div>
            <div className="text-2xl font-bold">{cnt}</div>
            <div className="text-xs text-gray-400">days</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fadeIn">
      {error && (
        <div className="bg-red-500 text-white p-3 mb-4 rounded animate-shake">{error}</div>
      )}

      {/* Search Section */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8 border border-blue-900 animate-slideIn">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={empFullName}
              onChange={handleInputChange}
              placeholder="Enter Employee Full Name"
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-slate-800 border border-gray-700 mt-1 rounded-lg max-h-60 overflow-auto">
                {suggestions.map(item => (
                  <li
                    key={item.empId}
                    onClick={() => { setEmpFullName(item.fullName); setSuggestions([]); }}
                    className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-gray-100"
                  >{item.fullName}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={fetchAttendance}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <><FaUserCheck /> View Attendance</>
            )}
          </button>
          {attendanceData.length > 0 && (
            <button
              onClick={clearAttendance}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
            ><FaTimes /> Clear</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-300">Loading...</div>
      ) : attendanceData.length > 0 ? (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-blue-900 animate-slideIn">
          <h2 className="text-2xl font-semibold mb-4 text-gray-100 flex items-center gap-2">
            <FaCalendarAlt className="text-blue-400" /> Attendance for {empName}
          </h2>
          <Calendar
            value={null}
            onActiveStartDateChange={handleMonthChange}
            onClickDay={handleDateClick}
            tileContent={tileContent}
            className="bg-slate-800 text-gray-100 border-gray-700 rounded-lg"
            showNeighboringMonth={false}
          />
          {renderAttendanceSummary()}
          {selectedDate && tooltipContent.status && (
            <div className="mt-6 bg-slate-700 p-6 rounded-lg shadow-lg border border-blue-900 animate-slideIn transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <h3 className="text-lg font-semibold mb-3 text-gray-100 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-400 animate-pulse" /> Attendance Details for {formatDate(selectedDate)}
              </h3>
              <div className={`p-4 rounded-lg border ${statusColors[tooltipContent.status]} transform transition-all duration-300 hover:scale-[1.02]`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className="font-semibold text-lg">{tooltipContent.status}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Employee</p>
                    <p className="font-semibold text-lg">{tooltipContent.employee?.firstName || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
