import { Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { CustomerLogin, CustomerSignup, StaffLogin, StaffSignup, ForgotPassword } from './pages/AuthPages.jsx';
import { BusinessDetails, BusinessSearch } from './pages/BusinessPages.jsx';
import { CustomerDashboard, CustomerHistory, NotificationsPage, ProfilePage, QueueTracking, SettingsPage } from './pages/CustomerPages.jsx';
import { AddWalkIn, ServiceManagement, StaffAppointments, StaffDashboard, StaffHistory, StaffStatistics, TodaysQueue, StaffBranch } from './pages/StaffPages.jsx';
import PublicDisplay from './pages/PublicDisplay.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <DemoBanner />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/signup" element={<CustomerSignup />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/signup" element={<StaffSignup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/businesses" element={<BusinessSearch />} />
        <Route path="/businesses/:businessId" element={<BusinessDetails />} />
        <Route path="/display/:businessId" element={<PublicDisplay />} />

        {/* Customer Protected Routes */}
        <Route path="/customer/dashboard" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/customer/businesses" element={<ProtectedRoute role="customer"><BusinessSearch /></ProtectedRoute>} />
        <Route path="/customer/businesses/:businessId" element={<ProtectedRoute role="customer"><BusinessDetails /></ProtectedRoute>} />
        <Route path="/customer/queue/:entryId" element={<ProtectedRoute role="customer"><QueueTracking /></ProtectedRoute>} />
        <Route path="/customer/appointments" element={<ProtectedRoute role="customer"><CustomerHistory type="appointments" /></ProtectedRoute>} />
        <Route path="/customer/queues" element={<ProtectedRoute role="customer"><CustomerHistory type="queues" /></ProtectedRoute>} />
        <Route path="/customer/notifications" element={<ProtectedRoute role="customer"><NotificationsPage /></ProtectedRoute>} />
        <Route path="/customer/profile" element={<ProtectedRoute role="customer"><ProfilePage /></ProtectedRoute>} />
        <Route path="/customer/settings" element={<ProtectedRoute role="customer"><SettingsPage /></ProtectedRoute>} />

        {/* Staff Protected Routes */}
        <Route path="/staff/dashboard" element={<ProtectedRoute role="staff"><StaffDashboard /></ProtectedRoute>} />
        <Route path="/staff/queue" element={<ProtectedRoute role="staff"><TodaysQueue /></ProtectedRoute>} />
        <Route path="/staff/appointments" element={<ProtectedRoute role="staff"><StaffAppointments /></ProtectedRoute>} />
        <Route path="/staff/walk-in" element={<ProtectedRoute role="staff"><AddWalkIn /></ProtectedRoute>} />
        <Route path="/staff/services" element={<ProtectedRoute role="staff"><ServiceManagement /></ProtectedRoute>} />
        <Route path="/staff/branch" element={<ProtectedRoute role="staff"><StaffBranch /></ProtectedRoute>} />
        <Route path="/staff/statistics" element={<ProtectedRoute role="staff"><StaffStatistics /></ProtectedRoute>} />
        <Route path="/staff/history" element={<ProtectedRoute role="staff"><StaffHistory /></ProtectedRoute>} />

        {/* 404 — replaces silent redirect to "/" */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
