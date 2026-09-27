import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import RoleRoute from '@/routes/RoleRoute';
import PermissionRoute from '@/routes/PermissionRoute';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { PERMISSIONS } from '@/constants/permissions';

// Public Pages
import HomePage from '@/pages/HomePage';
import SearchTripsPage from '@/pages/SearchTripsPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import PartnerRegisterPage from '@/pages/PartnerRegisterPage';

// Auth Pages
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage';
import ResendVerificationPage from '@/features/auth/pages/ResendVerificationPage';
import ProfilePage from '@/features/auth/pages/ProfilePage';
import ChangePasswordPage from '@/features/auth/pages/ChangePasswordPage';
import NotFoundPage from '@/features/auth/pages/NotFoundPage';

// Role Dashboards
import AdminDashboard from '@/pages/dashboards/AdminDashboard';
import CoordinatorDashboard from '@/pages/dashboards/CoordinatorDashboard';
import VerifierDashboard from '@/pages/dashboards/VerifierDashboard';
import PassengerDashboard from '@/pages/dashboards/PassengerDashboard';

/** Smart dashboard switcher for authenticated users arriving at /dashboard */
const DashboardDispatcher = () => {
  const { user } = useAuth();

  if (user?.roles?.includes(ROLES.ADMIN) || user?.roles?.includes('PLATFORM_ADMIN')) {
    return <AdminDashboard />;
  }
  if (user?.roles?.includes(ROLES.BOOKING_COORDINATOR) || user?.roles?.includes('OPERATIONAL_MANAGER')) {
    return <CoordinatorDashboard />;
  }
  if (user?.roles?.includes(ROLES.TICKET_VERIFIER)) {
    return <VerifierDashboard />;
  }
  return <PassengerDashboard />;
};

export const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search-trips" element={<SearchTripsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/partner-register" element={<PartnerRegisterPage />} />
      <Route path="/partner" element={<Navigate to="/partner-register" replace />} />

      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />

      {/* General Authenticated Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardDispatcher />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      {/* Role-Specific Direct Routes */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={[ROLES.ADMIN, 'PLATFORM_ADMIN']}>
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/coordinator"
        element={
          <RoleRoute allowedRoles={[ROLES.BOOKING_COORDINATOR, 'OPERATIONAL_MANAGER', ROLES.ADMIN]}>
            <CoordinatorDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/operations"
        element={<Navigate to="/coordinator" replace />}
      />
      <Route
        path="/verifier"
        element={
          <RoleRoute allowedRoles={[ROLES.TICKET_VERIFIER, ROLES.ADMIN]}>
            <VerifierDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/verify-ticket"
        element={<Navigate to="/verifier" replace />}
      />
      <Route
        path="/passenger"
        element={
          <RoleRoute allowedRoles={[ROLES.PASSENGER, ROLES.ADMIN]}>
            <PassengerDashboard />
          </RoleRoute>
        }
      />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
