import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import ProtectedRoute from "./components/ProtectedRoute";
import RequireLoggedOut from "./components/RequireLoggedOut";

import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import Drives from "./pages/Drives";
import DriveDetails from "./pages/DriveDetails";
import Placements from "./pages/Placements";
import JobDetails from "./pages/JobDetails";
import Notices from "./pages/Notices";

import StudentSignup from "./pages/auth/StudentSignup";
import StudentLogin from "./pages/auth/StudentLogin";
import StudentForgotPassword from "./pages/auth/StudentForgotPassword";
import TpoSignup from "./pages/auth/TpoSignup";
import TpoLogin from "./pages/auth/TpoLogin";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentInterviews from "./pages/student/Interviews";
import StudentProfile from "./pages/student/Profile";
import MyDrives from "./pages/student/MyDrives";
import TpoDashboard from "./pages/tpo/TpoDashboard";
import CreateJob from "./pages/tpo/CreateJob";
import CreateNotice from "./pages/tpo/CreateNotice";
import Applicants from "./pages/tpo/Applicants";
import Students from "./pages/tpo/Students";
import CreateDrive from "./pages/tpo/CreateDrive";
import DriveRegistrations from "./pages/tpo/DriveRegistrations";

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/drives" element={<Drives />} />
        <Route path="/drives/:driveId" element={<DriveDetails />} />
        <Route path="/placements" element={<Placements />} />
        <Route path="/jobs/:jobId" element={<JobDetails />} />
        <Route path="/notices" element={<Notices />} />

        <Route path="/student/signup" element={
          <RequireLoggedOut>
            <StudentSignup />
          </RequireLoggedOut>
        } />
        <Route path="/student/login" element={
          <RequireLoggedOut>
            <StudentLogin />
          </RequireLoggedOut>
        } />
        <Route path="/student/forgot-password" element={
          <RequireLoggedOut>
            <StudentForgotPassword />
          </RequireLoggedOut>
        } />
        <Route path="/tpo/signup" element={
          <RequireLoggedOut>
            <TpoSignup />
          </RequireLoggedOut>
        } />
        <Route path="/tpo/login" element={
          <RequireLoggedOut>
            <TpoLogin />
          </RequireLoggedOut>
        } />

        <Route path="/student/interviews" element={
          <ProtectedRoute role="student">
            <StudentInterviews />
          </ProtectedRoute>
        } />

        <Route path="/student/profile" element={
          <ProtectedRoute role="student">
            <StudentProfile />
          </ProtectedRoute>
        } />

        <Route path="/student/drives" element={
          <ProtectedRoute role="student">
            <MyDrives />
          </ProtectedRoute>
        } />

        <Route path="/student/dashboard" element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />

        <Route path="/tpo/dashboard" element={
          <ProtectedRoute role="tpo">
            <TpoDashboard />
          </ProtectedRoute>
        } />

        <Route path="/tpo/drives/new" element={
          <ProtectedRoute role="tpo">
            <CreateDrive />
          </ProtectedRoute>
        } />

        <Route path="/tpo/drives/:driveId/edit" element={
          <ProtectedRoute role="tpo">
            <CreateDrive />
          </ProtectedRoute>
        } />

        <Route path="/tpo/drives/:driveId/registrations" element={
          <ProtectedRoute role="tpo">
            <DriveRegistrations />
          </ProtectedRoute>
        } />

        <Route path="/tpo/jobs/new" element={
          <ProtectedRoute role="tpo">
            <CreateJob />
          </ProtectedRoute>
        } />

        <Route path="/tpo/jobs/:jobId/edit" element={
          <ProtectedRoute role="tpo">
            <CreateJob />
          </ProtectedRoute>
        } />

        <Route path="/tpo/notices/new" element={
          <ProtectedRoute role="tpo">
            <CreateNotice />
          </ProtectedRoute>
        } />

        <Route path="/tpo/notices/:noticeId/edit" element={
          <ProtectedRoute role="tpo">
            <CreateNotice />
          </ProtectedRoute>
        } />

        <Route path="/tpo/students" element={
          <ProtectedRoute role="tpo">
            <Students />
          </ProtectedRoute>
        } />

        <Route path="/tpo/jobs/:jobId/applicants" element={
          <ProtectedRoute role="tpo">
            <Applicants />
          </ProtectedRoute>
        } />

        <Route path="*" element={<div className="container"><div className="card"><h2>404</h2></div></div>} />
      </Routes>
    </BrowserRouter>
  );
}
