import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resendVerificationApi } from '../auth.api.js';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export const ResendVerificationPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await resendVerificationApi({ email });
    } catch {
      // Intentionally suppress specific errors to prevent account enumeration
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Resend Verification</h1>
          <p>Enter your email to receive a new activation link</p>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ color: '#1e3a8a', marginBottom: '8px' }}>Link Dispatched</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '24px' }}>
              If an unverified account exists for <strong>{email}</strong>, a new verification link has been sent.
            </p>
            <Link to="/login" className="btn btn-secondary btn-block">
              <ArrowLeft size={16} /> Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Account Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
              style={{ marginTop: '10px' }}
            >
              {isSubmitting ? 'Sending Link...' : 'Resend Verification Email'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={15} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResendVerificationPage;
