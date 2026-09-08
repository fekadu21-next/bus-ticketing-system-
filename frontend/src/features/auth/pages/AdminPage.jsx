import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/constants/permissions';
import PermissionGate from '@/components/ui/PermissionGate';
import { Shield, Users, Building2, Key, CheckCircle2 } from 'lucide-react';

export const AdminPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <span className="badge badge-admin" style={{ marginBottom: '8px' }}>
          {t('admin.roleBadge')}
        </span>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '4px' }}>
          {t('admin.title')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          {t('admin.subtitle')}
        </p>
      </div>

      <div className="dashboard-grid">
        <PermissionGate permission={PERMISSIONS.MANAGE_ORGANIZATIONS}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Building2 size={20} color="var(--color-danger)" />
                {t('admin.orgsTitle')}
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {t('admin.orgsDesc')}
            </p>
            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                border: '1px solid var(--color-border)',
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: '6px' }}>Configured Organizations:</p>
              <ul style={{ paddingLeft: '20px', color: 'var(--color-text-muted)' }}>
                <li>Selam Bus Line (Private Company)</li>
                <li>Sky Bus Transport System (Private Company)</li>
              </ul>
            </div>
          </div>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.MANAGE_USERS}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Users size={20} color="var(--color-danger)" />
                {t('admin.usersTitle')}
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {t('admin.usersDesc')}
            </p>
            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                border: '1px solid var(--color-border)',
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>{t('admin.systemRoles')}:</p>
              <p style={{ color: 'var(--color-text-muted)' }}>
                PLATFORM_ADMIN, OPERATIONAL_MANAGER, PASSENGER, TICKET_VERIFIER
              </p>
            </div>
          </div>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.VIEW_AUDIT_LOGS}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Key size={20} color="var(--color-danger)" />
                {t('admin.auditTitle')}
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {t('admin.auditDesc')}
            </p>
            <button className="btn btn-secondary btn-block">
              {t('admin.auditBtn')}
            </button>
          </div>
        </PermissionGate>
      </div>
    </div>
  );
};

export default AdminPage;
