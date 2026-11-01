import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { isUserAdmin, isUserOperator } from "@/utils/userUtils";

// Public Passenger & Marketing Pages
import HomePage from '@/pages/HomePage';
import SearchTripsPage from '@/pages/SearchTripsPage';
import TripDetailsPage from '@/pages/TripDetailsPage';
import PassengerInfoPage from '@/pages/PassengerInfoPage';
import PaymentPage from '@/pages/PaymentPage';
import PaymentCallbackPage from '@/pages/PaymentCallbackPage';
import TelebirrCheckoutPage from '@/pages/TelebirrCheckoutPage';
import ChapaCheckoutPage from '@/pages/ChapaCheckoutPage';
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

// Lazy-loaded Management Console (Code-splitting operator & admin dashboards)
const ManagementConsole = React.lazy(() => import("./ManagementConsole"));

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
    </React.Suspense>
  );
};

export default AppRoutes;
