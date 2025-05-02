import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import "./calendar-custom.css";
import "./animations.css";
import { FaCalendarAlt, FaUserCheck, FaSearch, FaTimes } from 'react-icons/fa';
import { toast } from "react-hot-toast";
import { useApp } from "../../context/AppContext";

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
  const { isDarkMode } = useApp();

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
    'Present': 'bg-green-600 text-white',
    'Absent': 'bg-red-700 text-white',
    'Half-Day': 'bg-yellow-700 text-white',
    'Paid Leave': 'bg-purple-800 text-white',
    'Week Off': 'bg-blue-800 text-white',
    'Holiday': isDarkMode ? 'bg-red-700 text-white' : 'bg-gray-200 text-gray-800', // Red in dark mode, normal in light
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const d = new Date(date);
      d.setHours(12,0,0,0);
      const dateStr = d.toISOString().split('T')[0];
      const rec = attendanceData.find(i => i.date === dateStr);
      // Highlight Sundays in dark mode only
      const isSunday = d.getDay() === 0;
      if (!rec && isSunday && isDarkMode) {
        return <div className="w-full h-full p-1 bg-red-700 text-white"><div className="text-xs font-bold">Holiday</div></div>;
      }
      if (rec) {
        return (
          <div className={`w-full h-full p-1 ${statusColors[rec.status]}`}>
            <div className="text-xs font-bold">{rec.status}</div>
          </div>
        );
      }
      // In light mode, do not color Sundays
      return null;
    }
    return null;
  };

  const filteredAttendanceData = attendanceData.filter(rec => {
    const d = new Date(rec.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const renderAttendanceSummary = (data) => {
    if (!data.length) return null;
    const counts = data.reduce((acc, rec) => {
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
    <div className={`max-w-6xl mx-auto p-6 animate-fadeIn ${isDarkMode ? "bg-slate-800 text-gray-100" : "bg-white text-gray-900"}`}>
      {error && (
        <div className={`p-3 mb-4 rounded animate-shake ${isDarkMode ? "bg-red-700 text-white" : "bg-red-200 text-red-900"}`}>{error}</div>
      )}

      {/* Search Section */}
      <div className={`${isDarkMode ? "bg-slate-800 border-blue-900" : "bg-blue-50 border-blue-200"} p-6 rounded-lg shadow-lg mb-8 border animate-slideIn`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={empFullName}
              onChange={handleInputChange}
              placeholder="Enter Employee Full Name"
              className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDarkMode ? "bg-slate-700 border-gray-700 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
            />
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
            {suggestions.length > 0 && (
              <ul className={`absolute z-10 w-full mt-1 rounded-lg max-h-60 overflow-auto border ${isDarkMode ? "bg-slate-800 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}>
                {suggestions.map(item => (
                  <li
                    key={item.empId}
                    onClick={() => { setEmpFullName(item.fullName); setSuggestions([]); }}
                    className={`px-3 py-2 hover:${isDarkMode ? "bg-slate-700" : "bg-blue-100"} cursor-pointer ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}
                  >{item.fullName}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={fetchAttendance}
            disabled={loading}
            className={`px-6 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${isDarkMode ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-blue-500 text-white hover:bg-blue-600"}`}
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
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-300 text-gray-900 hover:bg-gray-200"}`}
            ><FaTimes /> Clear</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className={`text-center py-8 ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Loading...</div>
      ) : attendanceData.length > 0 ? (
        <div className={`${isDarkMode ? "bg-slate-800 border-blue-900" : "bg-blue-50 border-blue-200"} p-6 rounded-lg shadow-lg border animate-slideIn`}>
          <h2 className={`text-2xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
            <FaCalendarAlt className={isDarkMode ? "text-blue-400" : "text-blue-600"} /> Attendance for {empName}
          </h2>
          <Calendar
            value={null}
            onActiveStartDateChange={handleMonthChange}
            onClickDay={handleDateClick}
            tileContent={tileContent}
            className={`${isDarkMode ? "dark-calendar bg-slate-800 text-gray-100 border-gray-700" : "light-calendar bg-white text-gray-900 border-gray-200"} rounded-lg`}
            showNeighboringMonth={false}
          />
          {renderAttendanceSummary(filteredAttendanceData)}
          {selectedDate && tooltipContent.status && (
            <div className={`${isDarkMode ? "bg-slate-700 border-blue-900" : "bg-blue-100 border-blue-300"} mt-6 p-6 rounded-lg shadow-lg border animate-slideIn transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
              <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                <FaCalendarAlt className={`${isDarkMode ? "text-blue-400" : "text-blue-600 animate-pulse"}`} /> Attendance Details for {formatDate(selectedDate)}
              </h3>
              <div className={`p-4 rounded-lg border ${statusColors[tooltipContent.status]} transform transition-all duration-300 hover:scale-[1.02]`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} text-sm`}>Status</p>
                    <p className="font-semibold text-lg">{tooltipContent.status}</p>
                  </div>
                  <div className="space-y-2">
                    <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} text-sm`}>Employee</p>
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
