import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    // Not logged in at all -> Send to Login
    return <Navigate to="/" />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Logged in, but wrong role (e.g., Student trying to access Admin)
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />;
  }

  return children;
}