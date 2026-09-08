import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { User, Shield, Building2, CheckCircle, KeyRound, Mail, Phone } from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuth();

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'badge-admin';
      case 'OPERATIONAL_MANAGER':
        return 'badge-manager';
      case 'TICKET_VERIFIER':
        return 'badge-verifier';
      default:
        return 'badge-passenger';
    }
  };

  return (
    <div className="main-content">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>User Profile</h1>
            <p style={{ color: '#64748b' }}>Manage your account settings and credentials</p>
          </div>
          <Link to="/change-password" className="btn btn-secondary">
            <KeyRound size={16} /> Change Password
          </Link>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="#2563eb" /> Personal Information
            </h2>
            <span className={`badge ${user?.isActive ? 'badge-verifier' : 'badge-admin'}`}>
              {user?.isActive ? 'Active Account' : 'Suspended'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' }}>Full Name</p>
              <p style={{ fontWeight: 600 }}>{user?.firstName} {user?.lastName}</p>
            </div>

            <div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' }}>Email Address</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>{user?.email}</span>
                {user?.emailVerified ? (
                  <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', fontSize: '0.8rem', gap: '2px' }}>
                    <CheckCircle size={14} /> Verified
                  </span>
                ) : (
                  <span style={{ color: '#d97706', fontSize: '0.8rem' }}>Unverified</span>
                )}
              </div>
            </div>

            <div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' }}>Phone Number</p>
              <p style={{ fontWeight: 600 }}>{user?.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="#2563eb" /> Roles & System Access
            </h2>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '8px' }}>Assigned Roles</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {user?.roles?.map((role) => (
                <span key={role} className={`badge ${getRoleBadgeClass(role)}`}>
                  {role}
                </span>
              ))}
            </div>
          </div>

          {user?.organizationContext && user.organizationContext.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} /> Operational Organization Context
              </p>
              {user.organizationContext.map((org, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, color: '#1e3a8a' }}>{org.organizationName || 'Assigned Organization'}</p>
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Org ID: {org.organizationId}</p>
                  </div>
                  <span className="badge badge-manager">{org.role}</span>
                </div>
              ))}
            </div>
          )}

          {user?.permissions && user.permissions.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '8px' }}>Active Permissions</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {user.permissions.map((perm) => (
                  <span
                    key={perm}
                    style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
