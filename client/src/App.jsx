import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import { CustomerLogin, CustomerSignup, StaffLogin } from './pages/AuthPages.jsx';
import { BusinessDetails, BusinessSearch } from './pages/BusinessPages.jsx';
import { CustomerDashboard, CustomerHistory, NotificationsPage, ProfilePage, QueueTracking, SettingsPage } from './pages/CustomerPages.jsx';
import { AddWalkIn, ServiceManagement, StaffAppointments, StaffDashboard, StaffHistory, StaffStatistics, TodaysQueue } from './pages/StaffPages.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/signup" element={<CustomerSignup />} />
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route path="/businesses" element={<BusinessSearch />} />
      <Route path="/businesses/:businessId" element={<BusinessDetails />} />

      <Route path="/customer/dashboard" element={<CustomerDashboard />} />
      <Route path="/customer/queue/:entryId" element={<QueueTracking />} />
      <Route path="/customer/appointments" element={<CustomerHistory type="appointments" />} />
      <Route path="/customer/queues" element={<CustomerHistory type="queues" />} />
      <Route path="/customer/notifications" element={<NotificationsPage />} />
      <Route path="/customer/profile" element={<ProfilePage />} />
      <Route path="/customer/settings" element={<SettingsPage />} />

      <Route path="/staff/dashboard" element={<StaffDashboard />} />
      <Route path="/staff/queue" element={<TodaysQueue />} />
      <Route path="/staff/appointments" element={<StaffAppointments />} />
      <Route path="/staff/walk-in" element={<AddWalkIn />} />
      <Route path="/staff/services" element={<ServiceManagement />} />
      <Route path="/staff/statistics" element={<StaffStatistics />} />
      <Route path="/staff/history" element={<StaffHistory />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
