import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { CheckCircle2, ScanLine, AlertCircle } from 'lucide-react';

export const VerifyTicketPage = () => {
  const { user } = useAuth();
  const [ticketCode, setTicketCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = (e) => {
    e.preventDefault();
    if (!ticketCode.trim()) return;

    // Demonstration verification result
    setVerificationResult({
      success: true,
      code: ticketCode.trim().toUpperCase(),
      passenger: 'Demo Passenger',
      origin: 'Addis Ababa',
      destination: 'Hawassa',
      seat: '12B',
      status: 'CONFIRMED & VALIDATED',
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div className="main-content">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <span className="badge badge-verifier" style={{ marginBottom: '8px' }}>
            Ticket Verifier
          </span>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Ticket Verification Terminal</h1>
          <p style={{ color: '#64748b' }}>
            Boarding pass scanning and passenger validation
          </p>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label" htmlFor="ticketCode">
                Enter Ticket Reference Code or Scan QR
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="ticketCode"
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. TKT-2026-8849"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  <ScanLine size={18} /> Verify
                </button>
              </div>
            </div>
          </form>
        </div>

        {verificationResult && (
          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46' }}>
                <CheckCircle2 size={22} color="#10b981" /> Ticket Validated
              </h2>
              <span className="badge badge-verifier">Valid Pass</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.9rem' }}>
              <div>
                <p style={{ color: '#64748b' }}>Ticket Reference</p>
                <p style={{ fontWeight: 600 }}>{verificationResult.code}</p>
              </div>
              <div>
                <p style={{ color: '#64748b' }}>Passenger Name</p>
                <p style={{ fontWeight: 600 }}>{verificationResult.passenger}</p>
              </div>
              <div>
                <p style={{ color: '#64748b' }}>Route</p>
                <p style={{ fontWeight: 600 }}>{verificationResult.origin} → {verificationResult.destination}</p>
              </div>
              <div>
                <p style={{ color: '#64748b' }}>Seat Number</p>
                <p style={{ fontWeight: 600 }}>Seat {verificationResult.seat}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyTicketPage;
