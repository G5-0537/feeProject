import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Role-Based Route Protection Guard for React Router v7
 *
 * Supported Roles:
 * - 'customer': Allows only authenticated customers.
 *               If unauthenticated -> redirects to /login with original location state.
 *               If logged in as staff -> redirects to /staff/dashboard.
 * - 'staff':    Allows only authenticated staff members.
 *               If unauthenticated -> redirects to /staff/login with original location state.
 *               If logged in as customer -> redirects to /customer/dashboard.
 * - 'guest':    Allows only unauthenticated visitors (login, signup, password reset).
 *               If logged in as customer -> redirects to /customer/dashboard.
 *               If logged in as staff -> redirects to /staff/dashboard.
 * - 'authenticated': Allows any authenticated user (customer OR staff).
 *
 * Supports both layout route syntax (<Route element={<ProtectedRoute ... />} />)
 * and direct child element wrapping (<ProtectedRoute>{children}</ProtectedRoute>).
 */
export default function ProtectedRoute({ children, role = 'customer' }) {
  const { customer, staff } = useAuth();
  const location = useLocation();

  // Guest Only routes (Login, Signup, Forgot Password)
  if (role === 'guest') {
    if (staff) {
      return <Navigate to="/staff/dashboard" replace />;
    }
    if (customer) {
      return <Navigate to="/customer/dashboard" replace />;
    }
    return children ? children : <Outlet />;
  }

  // Customer Protected routes
  if (role === 'customer') {
    if (!customer) {
      if (staff) {
        // Logged in as staff, prevent accessing customer dashboard
        return <Navigate to="/staff/dashboard" replace />;
      }
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children ? children : <Outlet />;
  }

  // Staff Protected routes
  if (role === 'staff') {
    if (!staff) {
      if (customer) {
        // Logged in as customer, prevent accessing staff management desk
        return <Navigate to="/customer/dashboard" replace />;
      }
      return <Navigate to="/staff/login" state={{ from: location }} replace />;
    }
    return children ? children : <Outlet />;
  }

  // Any authenticated user
  if (role === 'authenticated') {
    if (!customer && !staff) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children ? children : <Outlet />;
  }

  return children ? children : <Outlet />;
}

/**
 * Convenience helper for guest-only public routes (Login, Signup, etc.)
 */
export function GuestRoute({ children }) {
  return <ProtectedRoute role="guest">{children}</ProtectedRoute>;
}
