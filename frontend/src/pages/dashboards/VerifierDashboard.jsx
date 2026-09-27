import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, QrCode, Clock } from 'lucide-react';

export const VerifierDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [ticketInput, setTicketInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Verification history
  const [history, setHistory] = useState([
    {
      code: 'TCK-88123-AA',
      passenger: 'Abebe Bikila',
      route: 'Addis Ababa &rarr; Hawassa',
      seat: 'Seat 14',
      status: 'VALIDATED',
      timestamp: 'Just now',
    },
    {
      code: 'TCK-88122-AA',
      passenger: 'Meron Tesfaye',
      route: 'Addis Ababa &rarr; Hawassa',
      seat: 'Seat 15',
      status: 'VALIDATED',
      timestamp: '15 mins ago',
    },
  ]);

  const handleVerify = (e) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const code = ticketInput.trim().toUpperCase();
      const newEntry = {
        code,
        passenger: 'Verified Boarding Passenger',
        route: 'Assigned Departure Route',
        seat: 'Confirmed Seat',
        status: 'VALIDATED',
        timestamp: 'Just now',
      };
      setScanResult({
        valid: true,
        message: `Ticket ${code} has been successfully validated for boarding.`,
        data: newEntry,
      });
      setHistory((prev) => [newEntry, ...prev]);
      setTicketInput('');
      setLoading(false);
    }, 500);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-strip">
        <div>
          <span className="badge-role verifier">{t('dashboards.verifier.badge')}</span>
          <h1>{t('dashboards.verifier.title')}</h1>
          <p>
            Logged in as: <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})
          </p>
        </div>
      </div>

      <div className="verifier-grid">
        {/* Verification Form Card */}
        <div className="verifier-form-card">
          <div className="verifier-card-header">
            <QrCode size={26} color="#059669" />
            <h3>{t('dashboards.verifier.scanTitle')}</h3>
          </div>

          <form onSubmit={handleVerify} className="verifier-form">
            <div className="form-group">
              <label className="form-label">{t('dashboards.verifier.ticketLabel')}</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="e.g. TCK-88124-AA"
                  className="form-input"
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="btn btn-partner btn-block btn-lg" disabled={loading}>
              <CheckCircle2 size={18} style={{ marginRight: 8 }} />
              {loading ? t('common.loading') : t('dashboards.verifier.validateBtn')}
            </button>
          </form>

          {scanResult && (
            <div className={`scan-result-banner ${scanResult.valid ? 'success' : 'danger'}`}>
              <CheckCircle2 size={24} color="#059669" />
              <div>
                <h4>{scanResult.valid ? t('dashboards.verifier.valid') : t('dashboards.verifier.invalid')}</h4>
                <p>{scanResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Verification Activity */}
        <div className="data-table-card">
          <div className="table-header">
            <div className="header-with-icon">
              <Clock size={18} color="#2563eb" />
              <h3>{t('dashboards.verifier.recentActivity')}</h3>
            </div>
          </div>
          <div className="table-responsive">
            <table className="app-data-table">
              <thead>
                <tr>
                  <th>Ticket Code</th>
                  <th>Passenger</th>
                  <th>Seat</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx}>
                    <td><code>{item.code}</code></td>
                    <td>{item.passenger}</td>
                    <td>{item.seat}</td>
                    <td><span className="status-pill verified">{item.status}</span></td>
                    <td>{item.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifierDashboard;
