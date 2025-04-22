import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "../DashBoard";
import AddEmp from "../AddEmp";
import Attendance from "../Attendance";
import Certificates from "../Certificates";
import ExperienceLetter from "../AllCertificates/ExperienceLetter";

const DashoBoardRouter = () => {
  console.log("Dashboard Router Component Rendering");
  
  return (
    <>
      <Routes>
        {/* Main dashboard route */}
        <Route index element={<Dashboard />} />
        
        {/* Nested routes */}
        <Route path="addEmp" element={<AddEmp />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="experience" element={<ExperienceLetter />} />
        
        {/* Add other certificate routes as needed */}
        <Route path="letterhead" element={<div>Letterhead Template (To be implemented)</div>} />
        <Route path="appointment" element={<div>Appointment Letter Template (To be implemented)</div>} />
        <Route path="joining" element={<div>Joining Letter Template (To be implemented)</div>} />
        <Route path="agreement" element={<div>Agreement Template (To be implemented)</div>} />
        <Route path="increment" element={<div>Increment Letter Template (To be implemented)</div>} />
        <Route path="relieving" element={<div>Relieving Letter Template (To be implemented)</div>} />
        <Route path="exit" element={<div>Exit Letter Template (To be implemented)</div>} />
        <Route path="termination" element={<div>Termination Letter Template (To be implemented)</div>} />
        
        {/* Internship certificate routes */}
        <Route path="internship-completion" element={<div>Internship Completion Certificate (To be implemented)</div>} />
        <Route path="achievement" element={<div>Achievement Certificate (To be implemented)</div>} />
        <Route path="performance" element={<div>Performance Certificate (To be implemented)</div>} />
        <Route path="post-appraisal" element={<div>Post Appraisal Certificate (To be implemented)</div>} />
      </Routes>
    </>
  );
};

export default DashoBoardRouter;
