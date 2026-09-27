import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2, Navigation, Bus, Ticket, UserCheck, Plus, CheckCircle } from 'lucide-react';
import Alert from '@/components/ui/Alert';

export const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('org'); // 'org' | 'trips' | 'buses' | 'bookings' | 'verifiers'

  const orgContext = user?.organizationContext?.[0] || {
    organizationName: 'Selam Bus Transport S.C.',
    organizationType: 'COMPANY',
    role: 'BOOKING_COORDINATOR',
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-strip">
        <div>
          <span className="badge-role coordinator">COORDINATOR PORTAL</span>
          <h1>{orgContext.organizationName || 'Operator Operations'}</h1>
          <p>
            Coordinator: <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'org' ? 'active' : ''}`}
          onClick={() => setActiveTab('org')}
        >
          <Building2 size={16} /> Organization Info
        </button>
        <button
          className={`tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => setActiveTab('trips')}
        >
          <Navigation size={16} /> Trips
        </button>
        <button
          className={`tab-btn ${activeTab === 'buses' ? 'active' : ''}`}
          onClick={() => setActiveTab('buses')}
        >
          <Bus size={16} /> Buses
        </button>
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <Ticket size={16} /> Bookings
        </button>
        <button
          className={`tab-btn ${activeTab === 'verifiers' ? 'active' : ''}`}
          onClick={() => setActiveTab('verifiers')}
        >
          <UserCheck size={16} /> Ticket Verifiers
        </button>
      </div>

      <div className="dashboard-tab-content">
        {/* TAB 1: ORGANIZATION INFORMATION */}
        {activeTab === 'org' && (
          <div className="overview-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper green">
                <Building2 size={24} />
              </div>
              <div className="stat-data">
                <span className="stat-number">{orgContext.organizationName}</span>
                <span className="stat-label">Registered Enterprise</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper blue">
                <UserCheck size={24} />
              </div>
              <div className="stat-data">
                <span className="stat-number">{orgContext.role || 'Coordinator'}</span>
                <span className="stat-label">Assigned Operator Role</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRIPS */}
        {activeTab === 'trips' && (
          <div className="data-table-card">
            <div className="table-header">
              <h3>Scheduled Trips</h3>
              <button className="btn btn-primary btn-sm">
                <Plus size={14} style={{ marginRight: 4 }} /> Schedule New Trip
              </button>
            </div>
            <div className="table-responsive">
              <table className="app-data-table">
                <thead>
                  <tr>
                    <th>Trip Code</th>
                    <th>Origin &rarr; Destination</th>
                    <th>Departure</th>
                    <th>Bus Assigned</th>
                    <th>Booked / Capacity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>TRP-101</code></td>
                    <td>Addis Ababa &rarr; Hawassa</td>
                    <td>Tomorrow, 06:00 AM</td>
                    <td>ET-3-12345 (Coach A)</td>
                    <td>42 / 49 seats</td>
                    <td><span className="status-pill active">Scheduled</span></td>
                  </tr>
                  <tr>
                    <td><code>TRP-102</code></td>
                    <td>Addis Ababa &rarr; Bahir Dar</td>
                    <td>Tomorrow, 06:30 AM</td>
                    <td>ET-3-98765 (Coach B)</td>
                    <td>38 / 49 seats</td>
                    <td><span className="status-pill active">Scheduled</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BUSES */}
        {activeTab === 'buses' && (
          <div className="data-table-card">
            <div className="table-header">
              <h3>Fleet Inventory</h3>
            </div>
            <div className="table-responsive">
              <table className="app-data-table">
                <thead>
                  <tr>
                    <th>Plate Number</th>
                    <th>Model</th>
                    <th>Capacity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>ET-3-12345</strong></td>
                    <td>Yutong Luxury 2024</td>
                    <td>49 Seats</td>
                    <td><span className="status-pill active">Operational</span></td>
                  </tr>
                  <tr>
                    <td><strong>ET-3-98765</strong></td>
                    <td>Scania Marcopolo</td>
                    <td>49 Seats</td>
                    <td><span className="status-pill active">Operational</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="data-table-card">
            <div className="table-header">
              <h3>Passenger Bookings</h3>
            </div>
            <div className="table-responsive">
              <table className="app-data-table">
                <thead>
                  <tr>
                    <th>Booking Ref</th>
                    <th>Passenger</th>
                    <th>Trip</th>
                    <th>Seat(s)</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>BK-99214</code></td>
                    <td>Tewodros Kassahun</td>
                    <td>Addis Ababa &rarr; Hawassa</td>
                    <td>Seat 12</td>
                    <td><span className="status-pill verified">PAID (Telebirr)</span></td>
                  </tr>
                  <tr>
                    <td><code>BK-99215</code></td>
                    <td>Bethlehem Tadesse</td>
                    <td>Addis Ababa &rarr; Bahir Dar</td>
                    <td>Seat 18, 19</td>
                    <td><span className="status-pill verified">PAID (CBE Birr)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: TICKET VERIFIERS */}
        {activeTab === 'verifiers' && (
          <div className="data-table-card">
            <div className="table-header">
              <h3>Station Ticket Verifiers</h3>
            </div>
            <div className="table-responsive">
              <table className="app-data-table">
                <thead>
                  <tr>
                    <th>Verifier Name</th>
                    <th>Assigned Terminal</th>
                    <th>Contact Phone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Dawit Alemayehu</td>
                    <td>Addis Ababa - Autobus Tera Gate 4</td>
                    <td>+251 922 110 033</td>
                    <td><span className="status-pill active">On Duty</span></td>
                  </tr>
                  <tr>
                    <td>Hana Gebre</td>
                    <td>Hawassa Main Station Gate 1</td>
                    <td>+251 944 882 119</td>
                    <td><span className="status-pill active">On Duty</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
