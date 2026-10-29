import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

export const OrgApprovalBanner = () => {
  const { t } = useTranslation();
  const { activeOrg } = useApp();

  if (!activeOrg) return null;

  const status = (activeOrg.status || '').toUpperCase();
  const isApproved = status === 'APPROVED' && activeOrg.isActive !== false && activeOrg.is_active !== false;

  if (isApproved) return null;

  if (status === 'PENDING') {
    return (
      <div
        style={{
          background: '#fffbeb',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#92400e',
        }}
        role="alert"
      >
        <Clock size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>
            {t('managerDashboard.pendingTitle', 'Registration Pending Platform Approval')}
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: '#b45309' }}>
            Your organization <strong>"{activeOrg.name}"</strong> is currently awaiting review by the platform administrator. Creating or modifying trips, routes, fleet buses, and assigning staff is disabled until approval is granted.
          </div>
        </div>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div
        style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#991b1b',
        }}
        role="alert"
      >
        <AlertTriangle size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>
            {t('managerDashboard.rejectedTitle', 'Organization Application Rejected')}
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: '#b91c1c' }}>
            Your organization <strong>"{activeOrg.name}"</strong> application has been rejected by the platform administrator. Operational access is disabled. Please check your registered email or contact platform support.
          </div>
        </div>
      </div>
    );
  }

  if (status === 'SUSPENDED' || activeOrg.isActive === false || activeOrg.is_active === false) {
    return (
      <div
        style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#991b1b',
        }}
        role="alert"
      >
        <ShieldAlert size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>
            {t('managerDashboard.suspendedTitle', 'Organization Inactive or Suspended')}
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: '#b91c1c' }}>
            Operational actions are disabled while organization <strong>"{activeOrg.name}"</strong> is inactive or suspended.
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OrgApprovalBanner;

