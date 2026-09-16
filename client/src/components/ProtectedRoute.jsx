import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, role = 'customer' }) {
  const { customer, staff } = useAuth();
  const location = useLocation();

  if (role === 'customer') {
    if (!customer) {
      if (staff) {
        // Logged in as staff, prevent accessing customer dashboard
        return <Navigate to="/staff/dashboard" replace />;
      }
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  }

  if (role === 'staff') {
    if (!staff) {
      if (customer) {
        // Logged in as customer, prevent accessing staff management desk
        return <Navigate to="/customer/dashboard" replace />;
      }
      return <Navigate to="/staff/login" state={{ from: location }} replace />;
    }
    return children;
  }

  return children;
}

