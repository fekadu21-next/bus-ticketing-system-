import React from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { Shield, Users, Building2, Key } from 'lucide-react';

export const AdminPage = () => {
  const { user } = useAuth();

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <span className="badge badge-admin" style={{ marginBottom: '8px' }}>
          Platform Administrator
        </span>
        <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Platform Admin Portal</h1>
        <p style={{ color: '#64748b' }}>
          Global governance, user role assignments, and transportation organization oversight
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color="#dc2626" /> Bus Companies & Associations
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
            Approve and manage private bus companies and transport associations operating on the platform.
          </p>
          <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem' }}>
            <p><strong>Configured Organizations:</strong></p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li>Selam Bus Line (Private Company)</li>
              <li>Sky Bus Transport System (Private Company)</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#dc2626" /> User & Role Management
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
            Control role assignments (`OPERATIONAL_MANAGER`, `TICKET_VERIFIER`) and associate them with operational organizations.
          </p>
          <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem' }}>
            <p><strong>System Roles:</strong> PLATFORM_ADMIN, OPERATIONAL_MANAGER, PASSENGER, TICKET_VERIFIER</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} color="#dc2626" /> Security & Audit Trails
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
            Audit records for login attempts, rate limits, lockouts, and token reuse.
          </p>
          <button className="btn btn-secondary btn-block">View Security Log Stream</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
