import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { PERMISSIONS } from '@/constants/permissions';
import RoleGate from '@/components/ui/RoleGate';
import PermissionGate from '@/components/ui/PermissionGate';
import {
  Bus,
  Search,
  Ticket,
  Calendar,
  Building2,
  ShieldCheck,
  CheckCircle,
  Users,
  KeyRound,
  User,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const primaryOrg = user?.organizationContext?.[0];

  return (
    <div className="main-content">
      {/* Welcome Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '6px' }}>
          {t('dashboard.title', { name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User' })}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Organization Context Banner for Managers & Verifiers */}
      {primaryOrg && (
        <div className="org-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={24} color="var(--color-primary)" />
            <div>
              <p style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                {t('dashboard.orgContext')}: {primaryOrg.organizationName || 'Assigned Organization'}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                {t('dashboard.authorizedRole')}: {primaryOrg.role}
              </p>
            </div>
          </div>
          <span className="badge badge-manager">{t('dashboard.activeOrg')}</span>
        </div>
      )}

      {/* Role-Specific Panels Grid */}
      <div className="dashboard-grid">
        {/* Passenger Panels */}
        <RoleGate roles={[ROLES.PASSENGER]}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Search size={18} color="var(--color-primary)" />
                {t('dashboard.passenger.searchTitle')}
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {t('dashboard.passenger.searchDesc')}
            </p>
            <button className="btn btn-primary btn-block">
              {t('dashboard.passenger.searchBtn')}
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Ticket size={18} color="var(--color-primary)" />
                {t('dashboard.passenger.bookingsTitle')}
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {t('dashboard.passenger.bookingsDesc')}
            </p>
            <button className="btn btn-secondary btn-block">
              {t('dashboard.passenger.bookingsBtn')}
            </button>
          </div>
        </RoleGate>

        {/* Operational Manager Panels */}
        <RoleGate roles={[ROLES.OPERATIONAL_MANAGER]}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Bus size={18} color="var(--color-primary)" />
                {t('dashboard.manager.fleetTitle')}
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {t('dashboard.manager.fleetDesc')}
            </p>
            <Link to="/operations" className="btn btn-primary btn-block">
              {t('dashboard.manager.fleetBtn')}
            </Link>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Calendar size={18} color="var(--color-primary)" />
                {t('dashboard.manager.scheduleTitle')}
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {t('dashboard.manager.scheduleDesc')}
            </p>
            <button className="btn btn-secondary btn-block">
              {t('dashboard.manager.scheduleBtn')}
            </button>
          </div>
        </RoleGate>

        {/* Ticket Verifier Panel */}
        <RoleGate roles={[ROLES.TICKET_VERIFIER]}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <CheckCircle size={18} color="var(--color-success)" />
                {t('dashboard.verifier.title')}
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {t('dashboard.verifier.desc')}
            </p>
            <Link to="/verify-ticket" className="btn btn-primary btn-block">
              {t('dashboard.verifier.btn')}
            </Link>
          </div>
        </RoleGate>

        {/* Platform Admin Panels */}
        <RoleGate roles={[ROLES.PLATFORM_ADMIN]}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <ShieldCheck size={18} color="var(--color-danger)" />
                {t('dashboard.admin.govTitle')}
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {t('dashboard.admin.govDesc')}
            </p>
            <Link to="/admin" className="btn btn-primary btn-block">
              {t('dashboard.admin.govBtn')}
            </Link>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Users size={18} color="var(--color-danger)" />
                {t('dashboard.admin.auditTitle')}
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {t('dashboard.admin.auditDesc')}
            </p>
            <button className="btn btn-secondary btn-block">
              {t('dashboard.admin.auditBtn')}
            </button>
          </div>
        </RoleGate>
      </div>
    </div>
  );
};

export default DashboardPage;
