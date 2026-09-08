import React from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { Building2, Bus, Calendar, Users } from 'lucide-react';

export const OperationsPage = () => {
  const { user } = useAuth();
  const org = user?.organizationContext?.[0];

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <span className="badge badge-manager" style={{ marginBottom: '8px' }}>
          Operational Management
        </span>
        <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>
          {org ? `${org.organizationName} Operations` : 'Operations Portal'}
        </h1>
        <p style={{ color: '#64748b' }}>
          Scoped operational controls: Fleet management, trip scheduling, and passenger bookings
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
        }}
      >
        <p style={{ fontWeight: 600, color: '#1e40af' }}>
          Security Boundary Enforced by Backend:
        </p>
        <p style={{ color: '#2563eb', fontSize: '0.9rem', marginTop: '4px' }}>
          All API requests sent from this portal are automatically scoped to Organization ID:{' '}
          <code>{org?.organizationId || 'System Wide'}</code>. Data from other companies or associations cannot be accessed.
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bus size={20} color="#2563eb" /> Company Bus Fleet
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
            Buses assigned to your operational division.
          </p>
          <button className="btn btn-primary btn-block">Add New Bus</button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} color="#2563eb" /> Intercity Schedules
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
            Daily scheduled departures, stops, and pricing tariffs.
          </p>
          <button className="btn btn-secondary btn-block">Schedule Trip</button>
        </div>
      </div>
    </div>
  );
};

export default OperationsPage;
