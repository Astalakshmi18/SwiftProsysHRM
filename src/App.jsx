import React, { useState } from 'react'
import Login from './pages/auth/login'
import Signup from './pages/auth/signup'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/protectedRoute';
import Production_report from './pages/Production/production_report';
import UserScreen from './screens/userScreen';
import Attendance from './pages/attendance/dailyattendance';
import AddEmployee from './pages/attendance/addEmployee';
import EmployeeList from './pages/attendance/empList';
import AdminScreen from './screens/adminScreen';
import AttendanceReport from './pages/attendance/attendance_report';
import AdminDashboard from './pages/attendance/Admin_dashboard';
import EditEmployeeModal from './pages/attendance/editEmployeeModal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Production" element={<Production_report />} />

        <Route path="/user" element={<ProtectedRoute roleAllowed="user" />}>
          <Route element={<UserScreen />}>
            <Route index element={<Attendance />} />
          </Route>
        </Route>

        <Route path="/admin" element={<ProtectedRoute roleAllowed="admin" />}>
          <Route element={<AdminScreen />}>
            <Route index element={<AdminDashboard />} />
            <Route path='attendance' element={<Attendance />} />
            <Route path="emplist" element={<EmployeeList />} />
            <Route path="addemployee" element={<AddEmployee />} />
            <Route path="attendancereport" element={<AttendanceReport />} />
            <Route path="editempmodal/:employeeid" element={<EditEmployeeModal />} />
          </Route>
        </Route>

        {/* Catch-all: redirect unknown routes to login */}
        <Route path="/addemployee" element={<AddEmployee />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
