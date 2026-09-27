import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { DashboardLayout } from "../components/layout/DashboardLayout";

// Public Pages
import HomePage from "../pages/HomePage";
import SearchTripsPage from "../pages/SearchTripsPage";
import AboutPage from "../pages/AboutPage";
import ContactPage from "../pages/ContactPage";
import PartnerRegisterPage from "../pages/PartnerRegisterPage";

// Auth Pages
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import VerifyEmailPage from "../features/auth/pages/VerifyEmailPage";
import ResendVerificationPage from "../features/auth/pages/ResendVerificationPage";
import ProfilePage from "../features/auth/pages/ProfilePage";
import ChangePasswordPage from "../features/auth/pages/ChangePasswordPage";
import NotFoundPage from "../features/auth/pages/NotFoundPage";
import DashboardPage from "../features/auth/pages/DashboardPage";

// Admin Pages
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminOrganizationsPage } from "../pages/admin/AdminOrganizationsPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminStationsPage } from "../pages/admin/AdminStationsPage";
import { AdminBusesPage } from "../pages/admin/AdminBusesPage";
import { AdminRoutesPage } from "../pages/admin/AdminRoutesPage";
import { AdminTripsPage } from "../pages/admin/AdminTripsPage";
import { AdminBookingsPage } from "../pages/admin/AdminBookingsPage";
import { AdminPaymentsPage } from "../pages/admin/AdminPaymentsPage";
import { AdminTicketsPage } from "../pages/admin/AdminTicketsPage";
import { AdminReportsPage } from "../pages/admin/AdminReportsPage";
import { AdminAuditLogsPage } from "../pages/admin/AdminAuditLogsPage";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";

// Manager Pages
import { ManagerDashboardPage } from "../pages/manager/ManagerDashboardPage";
import { ManagerOrganizationPage } from "../pages/manager/ManagerOrganizationPage";
import { ManagerBusesPage } from "../pages/manager/ManagerBusesPage";
import { ManagerRoutesPage } from "../pages/manager/ManagerRoutesPage";
import { ManagerTripsPage } from "../pages/manager/ManagerTripsPage";
import { ManagerSeatsPage } from "../pages/manager/ManagerSeatsPage";
import { ManagerBookingsPage } from "../pages/manager/ManagerBookingsPage";
import { ManagerPaymentsPage } from "../pages/manager/ManagerPaymentsPage";
import { ManagerDriversPage } from "../pages/manager/ManagerDriversPage";
import { ManagerVerifiersPage } from "../pages/manager/ManagerVerifiersPage";
import { ManagerReportsPage } from "../pages/manager/ManagerReportsPage";
import { ManagerSettingsPage } from "../pages/manager/ManagerSettingsPage";

export const ManagementConsole = () => {
  const { user } = useAuth();
  const { currentRole, setCurrentRole, activePage } = useApp();

  React.useEffect(() => {
    if (user?.roles && Array.isArray(user.roles)) {
      if (
        user.roles.includes("BOOKING_COORDINATOR") ||
        user.roles.includes("OPERATIONAL_MANAGER")
      ) {
        if (currentRole !== "MANAGER") {
          setCurrentRole("MANAGER");
        }
      } else if (
        user.roles.includes("ADMIN") ||
        user.roles.includes("PLATFORM_ADMIN")
      ) {
        if (currentRole !== "ADMIN") {
          setCurrentRole("ADMIN");
        }
      }
    }
  }, [user, currentRole, setCurrentRole]);

  const renderAdminContent = () => {
    switch (activePage) {
      case "dashboard":
        return <AdminDashboardPage />;
      case "organizations":
        return <AdminOrganizationsPage />;
      case "users":
        return <AdminUsersPage />;
      case "stations":
        return <AdminStationsPage />;
      case "buses":
        return <AdminBusesPage />;
      case "routes":
        return <AdminRoutesPage />;
      case "trips":
        return <AdminTripsPage />;
      case "bookings":
        return <AdminBookingsPage />;
      case "payments":
        return <AdminPaymentsPage />;
      case "tickets":
        return <AdminTicketsPage />;
      case "reports":
        return <AdminReportsPage />;
      case "audit":
        return <AdminAuditLogsPage />;
      case "settings":
        return <AdminSettingsPage />;
      default:
        return <AdminDashboardPage />;
    }
  };

  const renderManagerContent = () => {
    switch (activePage) {
      case "dashboard":
        return <ManagerDashboardPage />;
      case "organization":
        return <ManagerOrganizationPage />;
      case "buses":
        return <ManagerBusesPage />;
      case "routes":
        return <ManagerRoutesPage />;
      case "trips":
        return <ManagerTripsPage />;
      case "seats":
        return <ManagerSeatsPage />;
      case "bookings":
        return <ManagerBookingsPage />;
      case "payments":
        return <ManagerPaymentsPage />;
      case "drivers":
        return <ManagerDriversPage />;
      case "verifiers":
        return <ManagerVerifiersPage />;
      case "reports":
        return <ManagerReportsPage />;
      case "settings":
        return <ManagerSettingsPage />;
      default:
        return <ManagerDashboardPage />;
    }
  };

  return (
    <DashboardLayout>
      {currentRole === "ADMIN" ? renderAdminContent() : renderManagerContent()}
    </DashboardLayout>
  );
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

      {/* Interactive Operations Console / Management Portal */}
      <Route path="/portal/*" element={<ManagementConsole />} />
      <Route path="/management/*" element={<ManagementConsole />} />
      <Route path="/admin" element={<ManagementConsole />} />

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
            <DashboardPage />
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

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
