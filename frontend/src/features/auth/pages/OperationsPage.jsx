import React from 'react';
import { useTranslation } from 'react-i18next';
import useOrgContext from '@/hooks/useOrgContext';
import { Building2, Bus, Calendar } from 'lucide-react';

export const OperationsPage = () => {
  const { org, orgId, orgName } = useOrgContext();
  const { t } = useTranslation();

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <span className="badge badge-manager" style={{ marginBottom: '8px' }}>
          {t('operations.roleBadge')}
        </span>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '4px' }}>
          {orgName ? `${orgName} ${t('operations.title')}` : t('operations.title')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          {t('operations.subtitle')}
        </p>
      </div>

      <div className="org-banner">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Building2 size={24} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, color: 'var(--color-text)' }}>
              {t('operations.scopeNote')}:
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '3px' }}>
              {t('operations.scopeDesc', { orgId: orgId || 'System Wide' })}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Bus size={20} color="var(--color-primary)" />
              {t('operations.fleetTitle')}
            </h2>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
            {t('operations.fleetDesc')}
          </p>
          <button className="btn btn-primary btn-block">
            {t('operations.addBusBtn')}
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Calendar size={20} color="var(--color-primary)" />
              {t('operations.scheduleTitle')}
            </h2>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
            {t('operations.scheduleDesc')}
          </p>
          <button className="btn btn-secondary btn-block">
            {t('operations.scheduleTripBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationsPage;
