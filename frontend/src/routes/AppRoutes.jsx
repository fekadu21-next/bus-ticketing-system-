import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Pages
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage.jsx';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage.jsx';
import ResendVerificationPage from '../features/auth/pages/ResendVerificationPage.jsx';
import ProfilePage from '../features/auth/pages/ProfilePage.jsx';
import ChangePasswordPage from '../features/auth/pages/ChangePasswordPage.jsx';
import DashboardPage from '../features/auth/pages/DashboardPage.jsx';
import AdminPage from '../features/auth/pages/AdminPage.jsx';
import OperationsPage from '../features/auth/pages/OperationsPage.jsx';
import VerifyTicketPage from '../features/auth/pages/VerifyTicketPage.jsx';

export const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />

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

      {/* Protected Routes (Authenticated) */}
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

      {/* Role-Protected Routes */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={['PLATFORM_ADMIN']}>
            <AdminPage />
          </RoleRoute>
        }
      />
      <Route
        path="/operations"
        element={
          <RoleRoute allowedRoles={['OPERATIONAL_MANAGER', 'PLATFORM_ADMIN']}>
            <OperationsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/verify-ticket"
        element={
          <RoleRoute allowedRoles={['TICKET_VERIFIER', 'PLATFORM_ADMIN']}>
            <VerifyTicketPage />
          </RoleRoute>
        }
      />

      {/* Fallback 404 */}
      <Route
        path="*"
        element={
          <div className="main-content" style={{ textAlign: 'center', padding: '60px 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>404</h1>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>Page not found</p>
            <Navigate to="/" replace />
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
