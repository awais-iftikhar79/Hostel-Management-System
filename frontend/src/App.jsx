import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import RegisterStudent from './pages/RegisterStudent';
import StudentDirectory from './pages/StudentDirectory';
import ActionCenter from './pages/ActionCenter';
import StudentDashboard from './pages/StudentDashboard';
import StudentRoom from './pages/StudentRoom';
import StudentMaintenance from './pages/StudentMaintenance';
import StudentExchange from './pages/StudentExchange';
import StudentPayments from './pages/StudentPayments';

function App() {
  return (
    <Router>
      <Routes>
        {/* Automatically redirect the root URL to the login page */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* The Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* The Dashboard Routes (We will lock these down with ProtectedRoute later) */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/register" element={<RegisterStudent />} />
        <Route path="/admin/directory" element={<StudentDirectory />} />
        <Route path="/admin/action-center" element={<ActionCenter />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/room" element={<StudentRoom />} />
        <Route path="/student/maintenance" element={<StudentMaintenance />} />
        <Route path="/student/exchange" element={<StudentExchange />} />
        <Route path="/student/payments" element={<StudentPayments />} />
      </Routes>
    </Router>
  );
}

export default App;