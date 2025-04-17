"use client"

import { useState, useEffect } from "react"
import jsPDF from "jspdf"
import "jspdf-autotable"
import companyLogo from "../../assets/company.jpeg"     // The company logo
import WtlSign from "../../assets/WTL Sign.jpg"         // The WTL sign
import axios from "axios"
import { toast } from "react-hot-toast"
import { CloudCog } from "lucide-react"

// Helper: format date from "YYYY-MM-DD" to "DD-MM-YYYY"
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A"
  const parts = dateStr.split("-")
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

// Helpers for converting numbers to words
const numberToWordsHelper = (num) => {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  let str = ""
  if (num > 99) {
    str += a[Math.floor(num / 100)] + " Hundred "
    num = num % 100
  }
  if (num > 19) {
    str += b[Math.floor(num / 10)] + " " + a[num % 10]
  } else {
    str += a[num]
  }
  return str.trim()
}
const numberToWords = (num) => {
  if (num == null) return ""
  const numStr = num.toString()
  if (numStr.length > 9) return "Overflow"
  const n = ("000000000" + numStr).substr(-9).match(/.{1,3}/g)
  let str = ""
  str += Number(n[0]) !== 0 ? numberToWordsHelper(Number(n[0])) + " Million " : ""
  str += Number(n[1]) !== 0 ? numberToWordsHelper(Number(n[1])) + " Thousand " : ""
  str += Number(n[2]) !== 0 ? numberToWordsHelper(Number(n[2])) : ""
  return str.trim()
}

// Convert a string to Title Case
const toTitleCase = (str) => {
  if (!str) return str
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

// Calculate monthly salary components from yearly CTC
const calculateSalaryComponents = (yearlyCTC) => {
  const monthlyCTC = yearlyCTC / 12
  const basicPercent = 0.5 // 50% of CTC
  const hraPercent = 0.2  // 20% of CTC
  const daPercent = 0.53  // 53% of Basic

  const basic = Math.round(monthlyCTC * basicPercent)
  const hra = Math.round(monthlyCTC * hraPercent)
  const da = Math.round(basic * daPercent)
  const special = Math.round(monthlyCTC - (basic + hra + da))
  const totalAllowance = hra + da + special
  const grossSalary = basic + totalAllowance

  return {
    basic,
    hra,
    da,
    special,
    totalAllowance,
    grossSalary,
    monthlyCTC,
  }
}

export default function SalaryReport() {
  const [employeeName, setEmployeeName] = useState("")
  // Company details will be retrieved from local storage
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [yearlyCTC, setYearlyCTC] = useState(0)
  const [salaryReport, setSalaryReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [s, setS] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // Get company details from localStorage
  const getCompanyDetails = () => {
    return {
      companyName: localStorage.getItem('registercompanyname') || 'TECH mahindra',
      companyAddress: localStorage.getItem('companyAddress') || 'A Wing 1st Floor City Vista Office no-016 kharadi Pune-411014',
      signatureImage: localStorage.getItem('signatureImage') || WtlSign, // Fallback to default
      stampImage: localStorage.getItem('stampImage') || companyLogo // Fallback to default
    };
  }

  const [user, setUser] = useState(null);

  // 1) Load from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      setUser(JSON.parse(raw));
    }
  }, []);
  const faintGreen = [220, 230, 195]
  const white = [255, 255, 255]
  const black = [0, 0, 0]

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/public/find/${employeeName}`);
      if (response.data) {
        console.log("Employee found:", response.data);
        setS(response.data);
        setShowReport(true);
      } else {
        toast.error("Employee not found");
      }
    } catch (error) {
      console.error("Error finding employee:", error);
      toast.error("Failed to find employee");
      setS(null);
      setShowReport(false);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!employeeName || !startDate || !endDate) {
      toast.error("Please fill all fields");
      return;
    }

    setGenerating(true);
    const pdfUrl = 
      `/public/generateReport?employeeName=${employeeName}&startDate=${startDate}&endDate=${endDate}`;
    
    // Open the PDF in a new tab
    window.open(pdfUrl, "_blank");
    setGenerating(false);
  };

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get company name from local storage (assuming it's stored when user logs in)
      const companyDetails = getCompanyDetails();
      
      // Using the new API endpoint format
      const response = await axios.get(
        `http://localhost:8282/api/employee/employee/${encodeURIComponent(user.registercompanyname)}/${encodeURIComponent(employeeName)}/attendance/report?startDate=${startDate}&endDate=${endDate}`
      )
      
      if (response.status !== 200) {
        throw new Error("Failed to fetch salary report")
      }
      
      const data = response.data
      console.log("API Response:", data)
      setSalaryReport(data)
      setS(data) // Set s to the same data for consistency
      setShowReport(true)
      setYearlyCTC(data.grossSalary * 12) // Set yearly CTC based on gross salary
    } catch (err) {
      console.error("Error fetching salary report:", err)
      setError(err.message || "Failed to fetch data")
      setShowReport(false)
    } finally {
      setLoading(false)
    }
  }

  const generateSalarySlipPDF = () => {
    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      
      // Pre-load both images before generating PDF
      const preloadImages = () => {
        return new Promise((resolve) => {
          // Create objects to hold our images
          const images = {
            signature: null,
            companyLogo: null
          };
          
          // Track how many images have loaded
          let loadedCount = 0;
          
          // Function to check if all images loaded and resolve promise
          const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount >= 2) {
              resolve(images);
            }
          };
          
          // Load signature image
          const signatureImg = new Image();
          signatureImg.onerror = () => {
            console.log("Error loading signature, using fallback");
            images.signature = WtlSign;
            checkAllLoaded();
          };
          signatureImg.onload = () => {
            console.log("Signature image loaded successfully");
            images.signature = signatureImg.src;
            checkAllLoaded();
          };
          
          // Add cache-busting timestamp
          const timestamp = new Date().getTime();
          signatureImg.src = userData.signature ? 
            `/image/lap2.jpg` : // Local path to avoid CORS
            `/image/lap2.jpg`;
          
          // Load company logo
          const logoImg = new Image();
          logoImg.onerror = () => {
            console.log("Error loading company logo, using fallback");
            images.companyLogo = companyLogo;
            checkAllLoaded();
          };
          logoImg.onload = () => {
            console.log("Company logo loaded successfully");
            images.companyLogo = logoImg.src;
            checkAllLoaded();
          };
          
          // Add cache-busting timestamp
          logoImg.src = userData.companylogo ? 
            `/image/lap2.jpg` : // Local path to avoid CORS
            `/image/lap2.jpg`;
          
          // Set timeout in case images take too long
          setTimeout(() => {
            if (loadedCount < 2) {
              console.log("Image loading timed out, using fallbacks");
              if (!images.signature) images.signature = WtlSign;
              if (!images.companyLogo) images.companyLogo = companyLogo;
              resolve(images);
            }
          }, 3000);
        });
      };
      
      // Start the PDF generation process with preloaded images
      preloadImages().then((images) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;
        const contentWidth = pageWidth - 2 * margin;
        let yPos = margin;

        // Helper: create a cell with borders
        const createCell = (
          x,
          y,
          width,
          height,
          text = "",
          fontSize = 10,
          align = "left",
          bold = false,
          fillColor = white
        ) => {
          doc.setFillColor(...fillColor);
          doc.rect(x, y, width, height, "F");
          doc.setDrawColor(...black);
          doc.setLineWidth(0.1);
          doc.rect(x, y, width, height, "S");

          doc.setFontSize(fontSize);
          doc.setFont("helvetica", bold ? "bold" : "normal");
          if (text) {
            doc.text(text.toString(), align === "center" ? x + width / 2 : x + 2, y + height / 2, {
              align: align === "center" ? "center" : "left",
              baseline: "middle",
            });
          }
        };

        // Outer container start
        const slipStartY = yPos;

        // 1) HEADER with green background
        const headerBoxHeight = 14;
        doc.setFillColor(...faintGreen);
        doc.rect(margin, yPos, contentWidth, headerBoxHeight, "F");
        doc.setDrawColor(...black);
        doc.setLineWidth(0.1);
        doc.rect(margin, yPos, contentWidth, headerBoxHeight, "S");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        
        // Use dynamic company name
        const companyName = userData.registercompanyname.toUpperCase();
        doc.textWithLink(
          companyName,
          margin + (contentWidth / 2),
          yPos + headerBoxHeight / 2,
          {
            url: "#",
            align: "center",
          }
        );
        yPos += headerBoxHeight;

        // 2) Company address row with dynamic address
        createCell(
          margin,
          yPos,
          contentWidth,
          12,
          `Company Address :- ${userData.address}`,
          12,
          "center",
          true,
          faintGreen
        );
        yPos += 12;

        // Example: "PAY SLIP FOR MARCH-2025"
        const paySlipMonth = startDate
          ? new Date(startDate).toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase()
          : "MARCH-2025";

        createCell(
          margin,
          yPos,
          contentWidth,
          10,
          `PAY SLIP FOR ${paySlipMonth}`,
          14,
          "center",
          true,
          faintGreen
        );
        yPos += 12;

        // 3) EMPLOYEE INFORMATION
        const employeeInfoBoxY = yPos;
        createCell(margin, yPos, contentWidth, 10, "Employee Information", 13, "center", true, faintGreen);
        yPos += 10;

        const col1 = contentWidth * 0.15;
        const col2 = contentWidth * 0.35;
        const col3 = contentWidth * 0.15;
        const col4 = contentWidth * 0.35;

        // Row 1: UID & Designation
        createCell(margin, yPos, col1, 10, "UID:", 10, "left", true);
        createCell(margin + col1, yPos, col2, 10, salaryReport?.uid || "N/A", 10, "left");
        createCell(margin + col1 + col2, yPos, col3, 10, "Designation:", 10, "left", true);
        createCell(
          margin + col1 + col2 + col3,
          yPos,
          col4,
          10,
          salaryReport?.jobRole ? toTitleCase(salaryReport.jobRole) : "N/A",
          10,
          "left"
        );
        yPos += 10;

        // Row 2: Name & Department
        createCell(margin, yPos, col1, 10, "Name:", 10, "left", true)
        createCell(
          margin + col1,
          yPos,
          col2,
          10,
          `${salaryReport?.firstName ? toTitleCase(salaryReport.firstName) : ""} ${salaryReport?.lastName ? toTitleCase(salaryReport.lastName) : ""}`,
          10,
          "left"
        )
        createCell(margin + col1 + col2, yPos, col3, 10, "Department:", 10, "left", true)
        createCell(
          margin + col1 + col2 + col3,
          yPos,
          col4,
          10,
          salaryReport?.department || "N/A",
          10,
          "left"
        )
        yPos += 10

        // Outline for Employee Info
        const employeeInfoBoxHeight = yPos - employeeInfoBoxY
        doc.rect(margin, employeeInfoBoxY, contentWidth, employeeInfoBoxHeight, "S")

        // 4) EMPLOYEE ATTENDANCE & BANK DETAILS
        const rowHeight = 10
        const colWidth = contentWidth / 4

        // Header row
        createCell(
          margin,
          yPos,
          colWidth * 2,
          rowHeight,
          "Employee Attendance",
          11,
          "center",
          true,
          faintGreen
        )
        createCell(
          margin + colWidth * 2,
          yPos,
          colWidth * 2,
          rowHeight,
          "Bank Details",
          11,
          "center",
          true,
          faintGreen
        )
        yPos += rowHeight

        // Row 1
        createCell(margin, yPos, colWidth, rowHeight, "Working Days:", 10, "left", true)
        createCell(
          margin + colWidth,
          yPos,
          colWidth,
          rowHeight,
          String(salaryReport?.workingDays ?? 0),
          10,
          "left"
        )
        createCell(
          margin + colWidth * 2,
          yPos,
          colWidth,
          rowHeight,
          "Bank Name:",
          10,
          "left",
          true
        )
        createCell(
          margin + colWidth * 3,
          yPos,
          colWidth,
          rowHeight,
          salaryReport?.bankName ? toTitleCase(salaryReport.bankName) : "N/A",
          10,
          "left"
        )
        yPos += rowHeight

        // Row 2
        createCell(margin, yPos, colWidth, rowHeight, "Leave Taken:", 10, "left", true)
        createCell(
          margin + colWidth,
          yPos,
          colWidth,
          rowHeight,
          String(salaryReport?.leaveTaken ?? 0),
          10,
          "left"
        )
        createCell(
          margin + colWidth * 2,
          yPos,
          colWidth,
          rowHeight,
          "IFSC Code:",
          10,
          "left",
          true
        )
        createCell(
          margin + colWidth * 3,
          yPos,
          colWidth,
          rowHeight,
          s?.bankIfscCode || "N/A",
          10,
          "left"
        )
        yPos += rowHeight

        // Row 3
        createCell(margin, yPos, colWidth, rowHeight, "Payable Days:", 10, "left", true)
        createCell(
          margin + colWidth,
          yPos,
          colWidth,
          rowHeight,
          String(salaryReport?.payableDays ?? 0),
          10,
          "left"
        )
        createCell(
          margin + colWidth * 2,
          yPos,
          colWidth,
          rowHeight,
          "Branch Name:",
          10,
          "left",
          true
        )
        createCell(
          margin + colWidth * 3,
          yPos,
          colWidth,
          rowHeight,
          salaryReport?.branchName ? toTitleCase(salaryReport.branchName) : "N/A",
          10,
          "left"
        )
        yPos += rowHeight

        // Row 4
        createCell(margin, yPos, colWidth, rowHeight, "", 10, "left")
        createCell(margin + colWidth, yPos, colWidth, rowHeight, "", 10, "left")
        createCell(
          margin + colWidth * 2,
          yPos,
          colWidth,
          rowHeight,
          "Account No:",
          10,
          "left",
          true
        )
        createCell(
          margin + colWidth * 3,
          yPos,
          colWidth,
          rowHeight,
          salaryReport?.bankAccountNo || "N/A",
          10,
          "left"
        )
        yPos += rowHeight

        // 5) SALARY CALCULATIONS
        const salaryCalcBoxY = yPos
        createCell(margin, yPos, contentWidth, 10, "Salary Calculations", 11, "center", true, faintGreen)
        yPos += 10

        const salaryCol1 = contentWidth * 0.4
        const salaryCol2 = contentWidth * 0.2
        const salaryCol3 = contentWidth * 0.2
        const salaryCol4 = contentWidth * 0.2

        const ctcVal = yearlyCTC
        const { basic, hra, da, special, totalAllowance, grossSalary, monthlyCTC } =
          calculateSalaryComponents(ctcVal)

        const workingDays = salaryReport?.workingDays || 30
        const perDaySalary = monthlyCTC / workingDays
        const totalLeaves = workingDays - (salaryReport?.payableDays ?? 0)
        const deductionVal = Math.round(perDaySalary * totalLeaves)
        const professionalTaxVal = salaryReport?.professionalTax ? Math.round(salaryReport.professionalTax) : 0
        const tdsVal = salaryReport?.tds ? Math.round(salaryReport.tds) : 0
        const totalDeductions = deductionVal + professionalTaxVal + tdsVal
        const computedNetPayable = grossSalary - totalDeductions
        const netPayInteger = Math.max(0, computedNetPayable)

        // Cost To Company & Deductions
        createCell(margin, yPos, salaryCol1, 10, "Cost To Company - CTC", 10, "left", true)
        createCell(margin + salaryCol1, yPos, salaryCol2, 10, `Rs. ${ctcVal}`, 10, "left")
        createCell(margin + salaryCol1 + salaryCol2, yPos, salaryCol3, 10, "Deductions", 10, "left", true)
        createCell(margin + salaryCol1 + salaryCol2 + salaryCol3, yPos, salaryCol4, 10, `Rs. ${deductionVal}`, 10, "right")
        yPos += 10

        // Basic & Professional Tax
        createCell(margin, yPos, salaryCol1, 10, "Basic", 10, "left", true)
        createCell(margin + salaryCol1, yPos, salaryCol2, 10, `Rs. ${basic}`, 10, "left")
        createCell(margin + salaryCol1 + salaryCol2, yPos, salaryCol3, 10, "Professional Tax", 10, "left", true)
        createCell(margin + salaryCol1 + salaryCol2 + salaryCol3, yPos, salaryCol4, 10, `Rs. ${professionalTaxVal}`, 10, "right")
        yPos += 10

        // House Rent Allowance & TDS
        createCell(margin, yPos, salaryCol1, 10, "House Rent Allowance", 10, "left", true)
        createCell(margin + salaryCol1, yPos, salaryCol2, 10, `Rs. ${hra}`, 10, "left")
        createCell(margin + salaryCol1 + salaryCol2, yPos, salaryCol3, 10, "TDS", 10, "left", true)
        createCell(margin + salaryCol1 + salaryCol2 + salaryCol3, yPos, salaryCol4, 10, `Rs. ${tdsVal}`, 10, "right")
        yPos += 10

        // DA & blank
        createCell(margin, yPos, salaryCol1, 10, "DA Allowance (53% of Basic)", 10, "left", true)
        createCell(margin + salaryCol1, yPos, salaryCol2, 10, `Rs. ${da}`, 10, "left")
        createCell(margin + salaryCol1 + salaryCol2, yPos, salaryCol3, 10, "", 10, "left", true)
        createCell(margin + salaryCol1 + salaryCol2 + salaryCol3, yPos, salaryCol4, 10, "", 10, "right")
        yPos += 10

        // Special & Total Deductions
        createCell(margin, yPos, salaryCol1, 10, "Special Allowance", 10, "left", true)
        createCell(margin + salaryCol1, yPos, salaryCol2, 10, `Rs. ${special}`, 10, "left")
        createCell(margin + salaryCol1 + salaryCol2, yPos, salaryCol3, 10, "Total Deductions", 10, "left", true)
        createCell(margin + salaryCol1 + salaryCol2 + salaryCol3, yPos, salaryCol4, 10, `Rs. ${totalDeductions}`, 10, "right")
        yPos += 10

        // Total Allowance & Additional Perks
        createCell(margin, yPos, salaryCol1, 10, "Total Allowance", 10, "right", true)
        createCell(margin + salaryCol1, yPos, salaryCol2, 10, `Rs. ${totalAllowance}`, 10, "left")
        createCell(margin + salaryCol1 + salaryCol2, yPos, salaryCol3, 10, "Additional Perks", 10, "left", true)
        createCell(margin + salaryCol1 + salaryCol2 + salaryCol3, yPos, salaryCol4, 10, salaryReport?.additionalPerks || "N/A", 10, "right")
        yPos += 10

        // Gross Salary & Bonus
        createCell(margin, yPos, salaryCol1, 10, "Gross Salary", 10, "right", true)
        createCell(margin + salaryCol1, yPos, salaryCol2, 10, `Rs. ${grossSalary}`, 10, "left")
        createCell(margin + salaryCol1 + salaryCol2, yPos, salaryCol3, 10, "Bonus", 10, "left", true)
        createCell(margin + salaryCol1 + salaryCol2 + salaryCol3, yPos, salaryCol4, 10, `Rs. ${salaryReport?.bonus ? Math.round(salaryReport.bonus) : 0}`, 10, "right")
        yPos += 10

        // Net Payable
        createCell(margin, yPos, salaryCol1 + salaryCol2, 10, "", 10, "left")
        createCell(margin + salaryCol1 + salaryCol2, yPos, salaryCol3, 10, "Net Payable Salary", 10, "left", true)
        createCell(margin + salaryCol1 + salaryCol2 + salaryCol3, yPos, salaryCol4, 10, `Rs. ${netPayInteger}`, 10, "right")
        yPos += 10

        // Amount in Words
        const amountWords = numberToWords(netPayInteger) + " Rupees Only"
        createCell(margin, yPos, contentWidth * 0.3, 10, "Amount in Words:", 10, "left", true)
        createCell(margin + contentWidth * 0.3, yPos, contentWidth * 0.7, 10, amountWords, 10, "center")
        yPos += 10
        createCell(margin, yPos, contentWidth, 10, "", 10, "left")
        yPos += 10

        const salaryCalcBoxHeight = yPos - salaryCalcBoxY
        doc.rect(margin, salaryCalcBoxY, contentWidth, salaryCalcBoxHeight, "S")

        // ===================
        // SIGNATURE SECTION
        // ===================
        // 2 columns: left = Prepared By + WTL sign, right = Approved By + company logo + bigger WTL sign below.
        const sigColumnWidth = contentWidth / 2
        const signatureStartY = yPos

        // Row 1 (text)
        createCell(margin, signatureStartY, sigColumnWidth, 10, "Prepared By:", 10, "left", true)
        createCell(margin + sigColumnWidth, signatureStartY, sigColumnWidth, 10, "Approved By:", 10, "left", true)
        yPos += 10

        // Row 2 (images)
        const signatureRowHeight = 40  // Decreased row height
        createCell(margin, yPos, sigColumnWidth, signatureRowHeight, "", 10, "left")
        createCell(margin + sigColumnWidth, yPos, sigColumnWidth, signatureRowHeight, "", 10, "left")

        // Left column: Signature image'
        const signature = `http://localhost:8282/images/profile/${user.signature}`
        try {
          doc.addImage(
            signature,
            "JPEG",
            margin + 10,
            yPos + 5,
            50,
            35
          );
        } catch (error) {
          console.error("Error adding signature image:", error);
          // Use fallback
          doc.addImage(
            WtlSign,
            "JPEG",
            margin + 10,
            yPos + 5,
            50,
            35
          );
        }

        // Right column: Company logo
        const logo = `http://localhost:8282/images/profile/${user.companylogo}`
        try {
          doc.addImage(
           logo,
            "JPEG",
            margin + sigColumnWidth + 10,
            yPos + 5,
            50,
            35
          );
        } catch (error) {
          console.error("Error adding company logo:", error);
          // Use fallback
          doc.addImage(
            companyLogo,
            "JPEG",
            margin + sigColumnWidth + 10,
            yPos + 5,
            50,
            35
          );
        }

        yPos += signatureRowHeight;

        // ADD THE HORIZONTAL LINE AFTER IMAGES
        doc.setLineWidth(0.1);
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPos, margin + contentWidth, yPos); // from left margin to right margin

        // Outline entire slip (optional)
        const totalSlipHeight = yPos - slipStartY;
        doc.rect(margin, slipStartY, contentWidth, totalSlipHeight, "S");

        // Finally, save PDF
        doc.save(`${userData.registercompanyname}_salary_slip_${employeeName || "employee"}.pdf`);
      });
      
    } catch (error) {
      console.error("Error preparing for PDF generation:", error);
      alert("Error generating PDF. Please check console for details.");
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-900 min-h-screen text-gray-100 animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6 text-blue-400">Salary Slip Generator</h1>
      
      {/* Form */}
      <div className="mb-8 bg-slate-800 p-5 rounded-lg shadow-lg border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          <div>

            <label htmlFor="employeeName" className="text-sm font-semibold mb-1 text-gray-300">
              Employee Full Name
            </label>
            <input
              type="text"
              id="employeeName"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full p-2 border border-slate-600 rounded-md bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter Full Name (e.g. Rohit More)"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="text-sm font-semibold mb-1 text-gray-300">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-slate-600 rounded-md bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="text-sm font-semibold mb-1 text-gray-300">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-slate-600 rounded-md bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex space-x-3">
          <button
            onClick={handleSubmit}
            disabled={loading || !employeeName || !startDate || !endDate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Generate Report"}
          </button>
          
          {salaryReport && (
            <button
              onClick={generateSalarySlipPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Download PDF
            </button>
          )}
        </div>
        {error && <div className="mt-3 text-red-500">{error}</div>}
      </div>

      {/* Salary Preview */}
      {salaryReport && (
        <div className="bg-slate-800 p-5 rounded-lg shadow-lg border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Salary Report Preview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-300">Employee Information</h3>
              <div className="bg-slate-700 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-400">Name</p>
                    <p className="font-medium">
                      {salaryReport?.firstName} {salaryReport?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Designation</p>
                    <p className="font-medium">{salaryReport?.jobRole || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">UID</p>
                    <p className="font-medium">{salaryReport?.uid || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Joining Date</p>
                    <p className="font-medium">{formatDate(salaryReport?.joiningDate) || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-300">Bank Details</h3>
              <div className="bg-slate-700 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-400">Bank Name</p>
                    <p className="font-medium">{salaryReport?.bankName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Account No</p>
                    <p className="font-medium">{salaryReport?.bankAccountNo || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">IFSC Code</p>
                    <p className="font-medium">{salaryReport?.ifscCode || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Branch</p>
                    <p className="font-medium">{salaryReport?.branchName || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2 text-gray-300">Attendance Summary</h3>
            <div className="bg-slate-700 p-4 rounded-md">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-sm text-gray-400">Working Days</p>
                  <p className="font-medium">{salaryReport?.workingDays || "0"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Payable Days</p>
                  <p className="font-medium">{salaryReport?.payableDays || "0"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Leave Taken</p>
                  <p className="font-medium">{salaryReport?.leaveTaken || "0"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Half Days</p>
                  <p className="font-medium">{salaryReport?.halfDay || "0"}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2 text-gray-300">Salary Details</h3>
            <div className="bg-slate-700 p-4 rounded-md">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Basic</p>
                  <p className="font-medium">₹{salaryReport?.basic || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">HRA</p>
                  <p className="font-medium">₹{salaryReport?.hra || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">DA Allowance</p>
                  <p className="font-medium">₹{salaryReport?.daAllowance || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Special Allowance</p>
                  <p className="font-medium">₹{salaryReport?.specialAllowance || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Allowance</p>
                  <p className="font-medium">₹{salaryReport?.totalAllowance || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Gross Salary</p>
                  <p className="font-medium">₹{salaryReport?.grossSalary || 0}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2 text-gray-300">Deductions</h3>
            <div className="bg-slate-700 p-4 rounded-md">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Professional Tax</p>
                  <p className="font-medium">₹{salaryReport?.professionalTax || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">TDS</p>
                  <p className="font-medium">₹{salaryReport?.tds || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Advance</p>
                  <p className="font-medium">₹{salaryReport?.advance || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Deductions</p>
                  <p className="font-medium">₹{salaryReport?.totalDeductions || 0}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2 text-gray-300">Net Payable</h3>
            <div className="bg-slate-700 p-4 rounded-md">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Net Payable Salary</p>
                  <p className="font-medium text-xl text-green-400">₹{salaryReport?.netPayable || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Amount in Words</p>
                  <p className="font-medium italic">{salaryReport?.amountInWords || ""}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}