import { Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import ProtectedRoute, { GuestRoute } from './components/ProtectedRoute.jsx';
import SyllabusEvaluationModal from './components/SyllabusEvaluationModal.jsx';
import BookingCartDrawer from './components/BookingCartDrawer.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import NotFound from './pages/NotFound.jsx';
import { CustomerLogin, CustomerSignup, StaffLogin, StaffSignup, ForgotPassword } from './pages/AuthPages.jsx';
import { BusinessDetails, BusinessSearch } from './pages/BusinessPages.jsx';
import { CustomerDashboard, CustomerHistory, NotificationsPage, ProfilePage, QueueTracking, SettingsPage } from './pages/CustomerPages.jsx';
import { AddWalkIn, ServiceManagement, StaffAppointments, StaffDashboard, StaffHistory, StaffStatistics, TodaysQueue, StaffBranch } from './pages/StaffPages.jsx';
import PublicDisplay from './pages/PublicDisplay.jsx';
import PortfolioLayout from './pages/portfolio/PortfolioLayout.jsx';
import PortfolioHome from './pages/portfolio/PortfolioHome.jsx';
import PortfolioAbout from './pages/portfolio/PortfolioAbout.jsx';
import PortfolioProjects from './pages/portfolio/PortfolioProjects.jsx';
import PortfolioContact from './pages/portfolio/PortfolioContact.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <DemoBanner />
      <SyllabusEvaluationModal />
      <BookingCartDrawer />
      <Routes>
        {/* Public Browsing Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/businesses" element={<BusinessSearch />} />
        <Route path="/businesses/:businessId" element={<BusinessDetails />} />
        <Route path="/display/:businessId" element={<PublicDisplay />} />

        {/* Mini-Project 1: Student Portfolio SPA with Nested Routing */}
        <Route path="/portfolio" element={<PortfolioLayout />}>
          <Route index element={<PortfolioHome />} />
          <Route path="about" element={<PortfolioAbout />} />
          <Route path="projects" element={<PortfolioProjects />} />
          <Route path="contact" element={<PortfolioContact />} />
        </Route>

        {/* Guest-Protected Auth Routes (Redirects already logged-in users to their dashboard) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/signup" element={<CustomerSignup />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/signup" element={<StaffSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Customer Protected Routes (Requires authenticated Customer) */}
        <Route element={<ProtectedRoute role="customer" />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/businesses" element={<BusinessSearch />} />
          <Route path="/customer/businesses/:businessId" element={<BusinessDetails />} />
          <Route path="/customer/queue/:entryId" element={<QueueTracking />} />
          <Route path="/customer/appointments" element={<CustomerHistory type="appointments" />} />
          <Route path="/customer/queues" element={<CustomerHistory type="queues" />} />
          <Route path="/customer/notifications" element={<NotificationsPage />} />
          <Route path="/customer/profile" element={<ProfilePage />} />
          <Route path="/customer/settings" element={<SettingsPage />} />
        </Route>

        {/* Staff Protected Routes (Requires authenticated Staff Member) */}
        <Route element={<ProtectedRoute role="staff" />}>
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/queue" element={<TodaysQueue />} />
          <Route path="/staff/appointments" element={<StaffAppointments />} />
          <Route path="/staff/walk-in" element={<AddWalkIn />} />
          <Route path="/staff/services" element={<ServiceManagement />} />
          <Route path="/staff/branch" element={<StaffBranch />} />
          <Route path="/staff/statistics" element={<StaffStatistics />} />
          <Route path="/staff/history" element={<StaffHistory />} />
        </Route>

        {/* 404 Catch-All Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}
