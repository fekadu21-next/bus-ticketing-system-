import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "@/constants/roles";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { isUserAdmin, isUserOperator, isUserDriver, isUserVerifier } from "@/utils/userUtils";

// Immediate Critical Landing Page
import HomePage from '@/pages/HomePage';

// Lazy-loaded Passenger & Checkout Flow Pages
const SearchTripsPage = React.lazy(() => import('@/pages/SearchTripsPage'));
const TripDetailsPage = React.lazy(() => import('@/pages/TripDetailsPage'));
const PassengerInfoPage = React.lazy(() => import('@/pages/PassengerInfoPage'));
const PaymentPage = React.lazy(() => import('@/pages/PaymentPage'));
const PaymentCallbackPage = React.lazy(() => import('@/pages/PaymentCallbackPage'));
const TelebirrCheckoutPage = React.lazy(() => import('@/pages/TelebirrCheckoutPage'));
const ChapaCheckoutPage = React.lazy(() => import('@/pages/ChapaCheckoutPage'));
const BookingConfirmationPage = React.lazy(() => import('@/pages/BookingConfirmationPage'));
const MyBookingsPage = React.lazy(() => import('@/pages/MyBookingsPage'));
const AboutPage = React.lazy(() => import('@/pages/AboutPage'));
const ContactPage = React.lazy(() => import('@/pages/ContactPage'));
const PartnerRegisterPage = React.lazy(() => import('@/pages/PartnerRegisterPage'));
const NotificationsPage = React.lazy(() => import('@/pages/NotificationsPage'));
const FeedbackPage = React.lazy(() => import('@/pages/FeedbackPage'));

// Lazy-loaded Auth Pages
const LoginPage = React.lazy(() => import("../features/auth/pages/LoginPage"));
const RegisterPage = React.lazy(() => import("../features/auth/pages/RegisterPage"));
const ForgotPasswordPage = React.lazy(() => import("../features/auth/pages/ForgotPasswordPage"));
const ResetPasswordPage = React.lazy(() => import("../features/auth/pages/ResetPasswordPage"));
const VerifyEmailPage = React.lazy(() => import("../features/auth/pages/VerifyEmailPage"));
const ResendVerificationPage = React.lazy(() => import("../features/auth/pages/ResendVerificationPage"));
const ProfilePage = React.lazy(() => import("../features/auth/pages/ProfilePage"));
const ChangePasswordPage = React.lazy(() => import("../features/auth/pages/ChangePasswordPage"));
const NotFoundPage = React.lazy(() => import("../features/auth/pages/NotFoundPage"));

// Lazy-loaded Staff & Management Portals
const ManagementConsole = React.lazy(() => import("./ManagementConsole"));
const DriverDashboardPage = React.lazy(() => import("@/pages/driver/DriverDashboardPage"));
const VerifierDashboardPage = React.lazy(() => import("@/pages/verifier/VerifierDashboardPage"));

export const AppRoutes = () => {
  const { user, isAuthenticated, isLoading, isAdmin, isOperator, isDriver, isTicketVerifier } = useAuth();
  const location = useLocation();

  const getAuthenticatedHome = () => {
    const fromPath = location.state?.from?.pathname;
    const adminUser = isUserAdmin(user) || (typeof isAdmin === "function" && isAdmin());
    const operatorUser = isUserOperator(user) || (typeof isOperator === "function" && isOperator());
    const driverUser = isUserDriver(user) || (typeof isDriver === "function" && isDriver());
    const verifierUser = isUserVerifier(user) || (typeof isTicketVerifier === "function" && isTicketVerifier());

    if (fromPath && fromPath !== "/login" && fromPath !== "/register") {
      if (adminUser && (fromPath.startsWith("/operator") || fromPath.startsWith("/manager"))) {
        return "/admin";
      }
      if (!adminUser && !operatorUser && (fromPath.startsWith("/operator") || fromPath.startsWith("/manager") || fromPath.startsWith("/admin"))) {
        if (driverUser) return "/driver";
        if (verifierUser) return "/verifier";
        return "/my-bookings";
      }
      return fromPath;
    }
    if (adminUser) return "/admin";
    if (operatorUser) return "/operator";
    if (driverUser) return "/driver";
    if (verifierUser) return "/verifier";
    return "/my-bookings";
  };

  return (
    <React.Suspense fallback={<LoadingSpinner fullPage label="Loading..." />}>
      <Routes>
        {/* Public Passenger Pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search-trips" element={<SearchTripsPage />} />
        <Route path="/trips" element={<Navigate to="/search-trips" replace />} />
        <Route path="/trips/:tripId" element={<TripDetailsPage />} />
        <Route path="/passenger-info" element={<PassengerInfoPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/checkout/telebirr" element={<TelebirrCheckoutPage />} />
        <Route path="/checkout/chapa" element={<ChapaCheckoutPage />} />
        <Route path="/payment/callback" element={<PaymentCallbackPage />} />
        <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />

        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/partner-register" element={<PartnerRegisterPage />} />
        <Route path="/partner" element={<Navigate to="/partner-register" replace />} />

        {/* Dynamic Authenticated Hub Dispatcher */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ManagementConsole />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <ManagementConsole />
            </ProtectedRoute>
          }
        />

        {/* Operator / Management Console (Restricted to Coordinators, Operational Managers & Admins) */}
        <Route
          path="/operator"
          element={
            <RoleRoute allowedRoles={[ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER]}>
              <ManagementConsole />
            </RoleRoute>
          }
        />
        <Route
          path="/operator/*"
          element={
            <RoleRoute allowedRoles={[ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER]}>
              <ManagementConsole />
            </RoleRoute>
          }
        />
        <Route path="/manager" element={<Navigate to="/operator" replace />} />
        <Route path="/manager/*" element={<Navigate to="/operator" replace />} />
        <Route
          path="/portal/*"
          element={
            <RoleRoute allowedRoles={[ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER]}>
              <ManagementConsole />
            </RoleRoute>
          }
        />
        <Route
          path="/management/*"
          element={
            <RoleRoute allowedRoles={[ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER]}>
              <ManagementConsole />
            </RoleRoute>
          }
        />

        {/* Platform Admin Console (Restricted to Admins only) */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <ManagementConsole />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <ManagementConsole />
            </RoleRoute>
          }
        />

        {/* Dedicated Driver Staff Portal (Restricted to Drivers & Admin Superusers) */}
        <Route
          path="/driver"
          element={
            <RoleRoute allowedRoles={[ROLES.DRIVER]}>
              <DriverDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/driver/*"
          element={
            <RoleRoute allowedRoles={[ROLES.DRIVER]}>
              <DriverDashboardPage />
            </RoleRoute>
          }
        />

        {/* Dedicated Station Ticket Verifier Portal (Restricted to Verifiers & Admin Superusers) */}
        <Route
          path="/verifier"
          element={
            <RoleRoute allowedRoles={[ROLES.TICKET_VERIFIER]}>
              <VerifierDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/verifier/*"
          element={
            <RoleRoute allowedRoles={[ROLES.TICKET_VERIFIER]}>
              <VerifierDashboardPage />
            </RoleRoute>
          }
        />

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

        {/* Authenticated User Account Settings & Bookings */}
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
              {typeof isAdmin === 'function' && isAdmin() ? (
                <Navigate to="/admin/profile" replace />
              ) : typeof isOperator === 'function' && isOperator() ? (
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
              {typeof isAdmin === 'function' && isAdmin() ? (
                <Navigate to="/admin/change-password" replace />
              ) : typeof isOperator === 'function' && isOperator() ? (
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
    </React.Suspense>
  );
};

export default AppRoutes;
