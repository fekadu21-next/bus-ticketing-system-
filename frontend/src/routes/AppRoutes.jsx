import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { isUserAdmin, isUserOperator, isUserPassenger } from "@/utils/userUtils";

// Public Pages
import HomePage from '@/pages/HomePage';
import SearchTripsPage from '@/pages/SearchTripsPage';
import TripDetailsPage from '@/pages/TripDetailsPage';
import PassengerInfoPage from '@/pages/PassengerInfoPage';
import PaymentPage from '@/pages/PaymentPage';
import PaymentCallbackPage from '@/pages/PaymentCallbackPage';
import TelebirrCheckoutPage from '@/pages/TelebirrCheckoutPage';
import BookingConfirmationPage from '@/pages/BookingConfirmationPage';
import MyBookingsPage from '@/pages/MyBookingsPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import PartnerRegisterPage from '@/pages/PartnerRegisterPage';
import NotificationsPage from '@/pages/NotificationsPage';
import FeedbackPage from '@/pages/FeedbackPage';


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
import { AdminReportsPage } from "../pages/admin/AdminReportsPage";
import { AdminAuditLogsPage } from "../pages/admin/AdminAuditLogsPage";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";
import { AdminFeedbackPage } from "../pages/admin/AdminFeedbackPage";

// Manager Pages
import { ManagerDashboardPage } from "../pages/manager/ManagerDashboardPage";
import { ManagerBusesPage } from "../pages/manager/ManagerBusesPage";
import { ManagerRoutesPage } from "../pages/manager/ManagerRoutesPage";
import { ManagerTripsPage } from "../pages/manager/ManagerTripsPage";
import { ManagerSeatsPage } from "../pages/manager/ManagerSeatsPage";
import { ManagerBookingsPage } from "../pages/manager/ManagerBookingsPage";
import { ManagerPaymentsPage } from "../pages/manager/ManagerPaymentsPage";
import { ManagerDriversPage } from "../pages/manager/ManagerDriversPage";
import { ManagerVerifiersPage } from "../pages/manager/ManagerVerifiersPage";
import { ManagerFeedbackPage } from "../pages/manager/ManagerFeedbackPage";
import { ManagerReportsPage } from "../pages/manager/ManagerReportsPage";
import { ManagerSettingsPage } from "../pages/manager/ManagerSettingsPage";

export const ManagementConsole = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const {
    currentRole,
    setCurrentRole,
    activePage,
    setActivePage,
    selectedOrgId,
    setSelectedOrgId,
  } = useApp();

  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = isUserAdmin(user);
  const isCoordinator = isUserOperator(user);

  const isOperatorRoute = location.pathname.startsWith("/operator");
  const isAdminRoute = location.pathname.startsWith("/admin");

  React.useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (isAdmin && !isOperatorRoute) {
      if (currentRole !== "ADMIN") {
        setCurrentRole("ADMIN");
      }
    } else if (isCoordinator || isOperatorRoute) {
      if (currentRole !== "MANAGER") {
        setCurrentRole("MANAGER");
      }
      const orgCtx = user.organizationContext?.[0] || user.organization;
      const orgId = orgCtx?.organizationId || user.organizationId;
      if (orgId && selectedOrgId !== orgId) {
        setSelectedOrgId(orgId);
      }
    }
  }, [user, isAuthenticated, isAdmin, isCoordinator, isOperatorRoute, currentRole, setCurrentRole, selectedOrgId, setSelectedOrgId]);

  const pageFromUrl = React.useMemo(() => {
    const basePath = isOperatorRoute
      ? "/operator"
      : isAdminRoute
      ? "/admin"
      : location.pathname.startsWith("/dashboard")
      ? "/dashboard"
      : null;

    if (!basePath) return "dashboard";
    const rest = location.pathname.replace(basePath, "").replace(/^\//, "");
    return rest.split("/")[0] || "dashboard";
  }, [location.pathname, isOperatorRoute, isAdminRoute]);

  const consolePage = pageFromUrl || activePage || "dashboard";

  // Synchronize URL subpath with activePage on route change / deep link
  React.useEffect(() => {
    if (consolePage && consolePage !== activePage) {
      setActivePage(consolePage);
    }
  }, [consolePage, activePage, setActivePage]);

  if (isLoading) {
    return <LoadingSpinner fullPage label="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Generic /dashboard entrypoint redirect to specific portal
  if (location.pathname === "/dashboard" || location.pathname === "/dashboard/") {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (isCoordinator) {
      return <Navigate to="/operator" replace />;
    }
    return <Navigate to="/my-bookings" replace />;
  }

  // Operator cannot access platform Admin console
  if (!isAdmin && isAdminRoute) {
    return <Navigate to="/operator" replace />;
  }

  // Passengers cannot access admin or operator management consoles
  if (!isAdmin && !isCoordinator) {
    return <Navigate to="/my-bookings" replace />;
  }

  const renderAdminContent = () => {
    switch (consolePage) {
      case "dashboard":
        return <AdminDashboardPage />;
      case "profile":
        return <ProfilePage embedded={true} />;
      case "change-password":
        return <ChangePasswordPage embedded={true} />;
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
      case "reports":
        return <AdminReportsPage />;
      case "audit":
        return <AdminAuditLogsPage />;
      case "feedback":
        return <AdminFeedbackPage />;
      case "settings":
        return <AdminSettingsPage />;
      default:
        return <AdminDashboardPage />;
    }
  };

  const renderManagerContent = () => {
    switch (consolePage) {
      case "dashboard":
        return <ManagerDashboardPage />;
      case "profile":
        return <ProfilePage embedded={true} />;
      case "change-password":
        return <ChangePasswordPage embedded={true} />;
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
      case "feedback":
        return <ManagerFeedbackPage />;
      case "reports":
        return <ManagerReportsPage />;
      case "settings":
        return <ManagerSettingsPage />;
      case "trip-details":
        return <TripDetailsPage />;
      default:
        return <ManagerDashboardPage />;
    }
  };

  const showAdminUI = isAdmin && !isOperatorRoute;

  return (
    <DashboardLayout>
      {showAdminUI ? renderAdminContent() : renderManagerContent()}
    </DashboardLayout>
  );
};

export const AppRoutes = () => {
  const { user, isAuthenticated, isLoading, isAdmin, isOperator } = useAuth();
  const location = useLocation();

  const getAuthenticatedHome = () => {
    const fromPath = location.state?.from?.pathname;
    const adminUser = isUserAdmin(user) || (typeof isAdmin === "function" && isAdmin());
    const operatorUser = isUserOperator(user) || (typeof isOperator === "function" && isOperator());

    if (fromPath && fromPath !== "/login" && fromPath !== "/register") {
      if (adminUser && (fromPath.startsWith("/operator") || fromPath.startsWith("/manager"))) {
        return "/admin";
      }
      return fromPath;
    }
    if (adminUser) return "/admin";
    if (operatorUser) return "/operator";
    return "/my-bookings";
  };

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search-trips" element={<SearchTripsPage />} />
      <Route path="/trips" element={<Navigate to="/search-trips" replace />} />
      <Route path="/trips/:tripId" element={<TripDetailsPage />} />
      <Route path="/passenger-info" element={<PassengerInfoPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/checkout/telebirr" element={<TelebirrCheckoutPage />} />
      <Route path="/payment/callback" element={<PaymentCallbackPage />} />
      <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />

      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/partner-register" element={<PartnerRegisterPage />} />
      <Route path="/partner" element={<Navigate to="/partner-register" replace />} />

      {/* Interactive Operations Console & System Dashboards */}
      <Route path="/dashboard" element={<ManagementConsole />} />
      <Route path="/dashboard/*" element={<ManagementConsole />} />
      <Route path="/operator" element={<ManagementConsole />} />
      <Route path="/operator/*" element={<ManagementConsole />} />
      <Route path="/manager" element={<Navigate to="/operator" replace />} />
      <Route path="/manager/*" element={<Navigate to="/operator" replace />} />
      <Route path="/portal/*" element={<ManagementConsole />} />
      <Route path="/management/*" element={<ManagementConsole />} />
      <Route path="/admin" element={<ManagementConsole />} />
      <Route path="/admin/*" element={<ManagementConsole />} />

      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          isLoading ? (
            <LoadingSpinner fullPage label="Authenticating session..." />
          ) : isAuthenticated ? (
            <Navigate to={getAuthenticatedHome()} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          isLoading ? (
            <LoadingSpinner fullPage label="Authenticating session..." />
          ) : isAuthenticated ? (
            <Navigate to={getAuthenticatedHome()} replace />
          ) : (
            <RegisterPage />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />

      {/* User Account Settings */}
      <Route
        path="/account-overview"
        element={
          <ProtectedRoute>
            <Navigate to="/profile" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            {isAdmin() ? (
              <Navigate to="/admin/profile" replace />
            ) : isOperator() ? (
              <Navigate to="/operator/profile" replace />
            ) : (
              <ProfilePage />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            {isAdmin() ? (
              <Navigate to="/admin/change-password" replace />
            ) : isOperator() ? (
              <Navigate to="/operator/change-password" replace />
            ) : (
              <ChangePasswordPage />
            )}
          </ProtectedRoute>
        }
      />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
