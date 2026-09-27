import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, Ticket, Calendar, User, ArrowRight } from 'lucide-react';

export const PassengerDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('bookings');

  const sampleBookings = [
    {
      id: 'BK-10884',
      ticketNumber: 'TCK-88123-AA',
      operator: 'Selam Bus',
      origin: 'Addis Ababa',
      destination: 'Hawassa',
      departureDate: 'Tomorrow, 06:00 AM',
      seat: '14',
      status: 'CONFIRMED',
      fare: '550 ETB',
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-strip">
        <div>
          <span className="badge-role passenger">{t('dashboards.passenger.badge')}</span>
          <h1>{t('dashboards.passenger.welcome')}, {user?.firstName || 'Traveler'}!</h1>
          <p>{t('dashboards.passenger.subtitle')}</p>
        </div>
        <Link to="/search-trips" className="btn btn-primary btn-sm">
          <Search size={14} style={{ marginRight: 6 }} /> {t('dashboards.passenger.bookTrip')}
        </Link>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <Calendar size={16} /> {t('dashboards.passenger.myBookings')} ({sampleBookings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <Ticket size={16} /> {t('dashboards.passenger.myTickets')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} /> {t('dashboards.passenger.profile')}
        </button>
      </div>

      <div className="dashboard-tab-content">
        {/* TAB 1: MY BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="my-bookings-container">
            {sampleBookings.length === 0 ? (
              <div className="empty-state-card">
                <Ticket size={40} color="#94a3b8" />
                <h3>{t('dashboards.passenger.noBookings')}</h3>
                <p>{t('dashboards.passenger.subtitle')}</p>
                <Link to="/search-trips" className="btn btn-primary btn-md">
                  {t('dashboards.passenger.bookTrip')}
                </Link>
              </div>
            ) : (
              sampleBookings.map((b) => (
                <div key={b.id} className="passenger-ticket-card">
                  <div className="ticket-card-header">
                    <div className="ticket-carrier">
                      <strong>{b.operator}</strong>
                      <span className="ticket-id">Ref: {b.id}</span>
                    </div>
                    <span className="status-pill verified">{b.status}</span>
                  </div>

                  <div className="ticket-card-body">
                    <div className="ticket-route-display">
                      <div className="route-stop">
                        <span className="stop-label">{t('searchPage.fromLabel')}</span>
                        <strong className="stop-name">{b.origin}</strong>
                        <span className="stop-time">{b.departureDate}</span>
                      </div>
                      <div className="route-arrow">
                        <ArrowRight size={20} color="#2563eb" />
                      </div>
                      <div className="route-stop">
                        <span className="stop-label">{t('searchPage.toLabel')}</span>
                        <strong className="stop-name">{b.destination}</strong>
                        <span className="stop-time">{t('searchPage.direct')}</span>
                      </div>
                    </div>

                    <div className="ticket-meta-details">
                      <div>
                        <span className="meta-label">Seat Assigned</span>
                        <strong className="meta-value">{b.seat}</strong>
                      </div>
                      <div>
                        <span className="meta-label">Ticket Code</span>
                        <strong className="meta-value">{b.ticketNumber}</strong>
                      </div>
                      <div>
                        <span className="meta-label">Total Fare</span>
                        <strong className="meta-value">{b.fare}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: MY TICKETS */}
        {activeTab === 'tickets' && (
          <div className="tickets-grid">
            {sampleBookings.map((b) => (
              <div key={b.id} className="boarding-pass-card">
                <div className="pass-header">
                  <h4>{t('dashboards.passenger.boardingPass')}</h4>
                  <span>BusTicket Ethiopia</span>
                </div>
                <div className="pass-body">
                  <p><strong>Passenger:</strong> {user?.firstName} {user?.lastName}</p>
                  <p><strong>Operator:</strong> {b.operator}</p>
                  <p><strong>Route:</strong> {b.origin} &rarr; {b.destination}</p>
                  <p><strong>Date:</strong> {b.departureDate}</p>
                  <p><strong>Seat:</strong> {b.seat}</p>
                  <div className="pass-barcode-preview">
                    <code>* {b.ticketNumber} *</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === 'profile' && (
          <div className="data-table-card profile-preview-card">
            <div className="table-header">
              <h3>{t('nav.profile')}</h3>
              <Link to="/profile" className="btn btn-outline btn-sm">
                Full Profile &amp; Settings
              </Link>
            </div>
            <div className="profile-details-grid">
              <div className="profile-detail-row">
                <span className="detail-label">{t('auth.register.firstNameLabel')}:</span>
                <span className="detail-value">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="profile-detail-row">
                <span className="detail-label">{t('auth.login.emailLabel')}:</span>
                <span className="detail-value">{user?.email}</span>
              </div>
              <div className="profile-detail-row">
                <span className="detail-label">{t('auth.register.phoneLabel')}:</span>
                <span className="detail-value">{user?.phone || '—'}</span>
              </div>
              <div className="profile-detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  {user?.emailVerified ? (
                    <span className="status-pill verified">{t('common.verified')}</span>
                  ) : (
                    <span className="status-pill unverified">{t('common.unverified')}</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerDashboard;
