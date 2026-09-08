import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import RoleRoute from '@/routes/RoleRoute';
import PermissionRoute from '@/routes/PermissionRoute';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { PERMISSIONS } from '@/constants/permissions';

// Auth Pages
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage';
import ResendVerificationPage from '@/features/auth/pages/ResendVerificationPage';
import ProfilePage from '@/features/auth/pages/ProfilePage';
import ChangePasswordPage from '@/features/auth/pages/ChangePasswordPage';
import DashboardPage from '@/features/auth/pages/DashboardPage';
import AdminPage from '@/features/auth/pages/AdminPage';
import OperationsPage from '@/features/auth/pages/OperationsPage';
import VerifyTicketPage from '@/features/auth/pages/VerifyTicketPage';
import NotFoundPage from '@/features/auth/pages/NotFoundPage';

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
        element={isAuthenticated ? <Navigate to="/profile?welcome=true" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />

      {/* Protected Routes (Any Authenticated User) */}
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
          <RoleRoute allowedRoles={[ROLES.PLATFORM_ADMIN]}>
            <AdminPage />
          </RoleRoute>
        }
      />
      <Route
        path="/operations"
        element={
          <RoleRoute allowedRoles={[ROLES.OPERATIONAL_MANAGER, ROLES.PLATFORM_ADMIN]}>
            <OperationsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/verify-ticket"
        element={
          <RoleRoute allowedRoles={[ROLES.TICKET_VERIFIER, ROLES.PLATFORM_ADMIN]}>
            <VerifyTicketPage />
          </RoleRoute>
        }
      />

      {/* Permission-Protected Route Demonstration */}
      <Route
        path="/audit"
        element={
          <PermissionRoute permission={PERMISSIONS.VIEW_AUDIT_LOGS}>
            <AdminPage />
          </PermissionRoute>
        }
      />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
