import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

// Public Pages
import HomePage from '@/pages/HomePage';
import SearchTripsPage from '@/pages/SearchTripsPage';
import TripDetailsPage from '@/pages/TripDetailsPage';
import PassengerInfoPage from '@/pages/PassengerInfoPage';
import PaymentPage from '@/pages/PaymentPage';
import BookingConfirmationPage from '@/pages/BookingConfirmationPage';
import MyBookingsPage from '@/pages/MyBookingsPage';
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
import DashboardPage from '@/features/auth/pages/DashboardPage';

export const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search-trips" element={<SearchTripsPage />} />
      <Route path="/trips/:tripId" element={<TripDetailsPage />} />
      <Route path="/passenger-info" element={<PassengerInfoPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
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
            <Navigate to="/profile" replace />
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
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <MyBookingsPage />
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

      {/* Clean redirects for legacy role routes to dashboard entry point */}
      <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
      <Route path="/coordinator" element={<Navigate to="/dashboard" replace />} />
      <Route path="/operations" element={<Navigate to="/dashboard" replace />} />
      <Route path="/verifier" element={<Navigate to="/dashboard" replace />} />
      <Route path="/verify-ticket" element={<Navigate to="/dashboard" replace />} />
      <Route path="/passenger" element={<Navigate to="/dashboard" replace />} />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
