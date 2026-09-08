import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ color: '#475569' }}>Checking permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user?.roles?.includes('PLATFORM_ADMIN');
  const hasRequiredRole = allowedRoles.some((role) => user?.roles?.includes(role));

  if (!isAdmin && !hasRequiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;
