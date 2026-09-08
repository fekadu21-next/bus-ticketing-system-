import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import {
  Bus,
  Search,
  Ticket,
  Calendar,
  Building2,
  ShieldCheck,
  CheckCircle,
  Users,
  Settings,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();

  const isPassenger = user?.roles?.includes('PASSENGER');
  const isManager = user?.roles?.includes('OPERATIONAL_MANAGER');
  const isVerifier = user?.roles?.includes('TICKET_VERIFIER');
  const isAdmin = user?.roles?.includes('PLATFORM_ADMIN');

  return (
    <div className="main-content">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>
          Welcome, {user?.firstName} {user?.lastName}!
        </h1>
        <p style={{ color: '#64748b' }}>
          Long-distance intercity bus ticketing and operational management
        </p>
      </div>

      {/* Organization Context Banner for Managers & Verifiers */}
      {user?.organizationContext && user.organizationContext.length > 0 && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={24} color="#2563eb" />
            <div>
              <p style={{ fontWeight: 700, color: '#1e40af' }}>
                Operational Scope: {user.organizationContext[0].organizationName || 'Assigned Organization'}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#3b82f6' }}>
                Authorized Role: {user.organizationContext[0].role}
              </p>
            </div>
          </div>
          <span className="badge badge-manager">Active Organization Context</span>
        </div>
      )}

      {/* Role-Specific Panels */}
      <div className="dashboard-grid">
        {/* Passenger View */}
        {isPassenger && (
          <>
            <div className="card">
              <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={18} color="#2563eb" /> Search Intercity Trips
                </h2>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                Find scheduled routes across major cities with real-time seat availability.
              </p>
              <button className="btn btn-primary btn-block">Find Scheduled Buses</button>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Ticket size={18} color="#2563eb" /> My Bookings & Passes
                </h2>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                View your confirmed tickets, digital boarding passes, and booking history.
              </p>
              <button className="btn btn-secondary btn-block">View My Tickets</button>
            </div>
          </>
        )}

        {/* Operational Manager View */}
        {isManager && (
          <>
            <div className="card">
              <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bus size={18} color="#2563eb" /> Bus Fleet Management
                </h2>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                Manage bus inventory, seat configurations, and maintenance statuses for your company.
              </p>
              <Link to="/operations" className="btn btn-primary btn-block">
                Open Fleet Portal
              </Link>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="#2563eb" /> Trip Scheduling & Pricing
                </h2>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                Publish new long-distance departures, assign drivers, and manage ticket tariffs.
              </p>
              <button className="btn btn-secondary btn-block">Manage Departures</button>
            </div>
          </>
        )}

        {/* Ticket Verifier View */}
        {isVerifier && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#16a34a" /> Boarding Pass Verification
              </h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
              Scan QR boarding passes or enter ticket reference codes at boarding gates.
            </p>
            <Link to="/verify-ticket" className="btn btn-primary btn-block">
              Launch Ticket Scanner
            </Link>
          </div>
        )}

        {/* Platform Admin View */}
        {isAdmin && (
          <>
            <div className="card">
              <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#dc2626" /> Platform Governance
                </h2>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                System-wide administrative controls, role assignment, and organization oversight.
              </p>
              <Link to="/admin" className="btn btn-primary btn-block">
                Platform Admin Portal
              </Link>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#dc2626" /> Security & Audit Logs
                </h2>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                Review real-time authentication events, login failures, lockouts, and token reuse.
              </p>
              <button className="btn btn-secondary btn-block">Inspect Audit Trails</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
