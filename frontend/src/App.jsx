import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import RegisterStudent from './pages/RegisterStudent';
import StudentDirectory from './pages/StudentDirectory';
import ActionCenter from './pages/ActionCenter';
import StudentDashboard from './pages/StudentDashboard';

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
      </Routes>
    </Router>
  );
}

export default App;