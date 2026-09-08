import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmailApi } from '../auth.api.js';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing from the URL.');
      return;
    }

    const performVerification = async () => {
      try {
        const response = await verifyEmailApi({ token });
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            err.message ||
            'Verification failed. The link may have expired or already been used.'
        );
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-header">
          <h1>Email Verification</h1>
        </div>

        {status === 'verifying' && (
          <div style={{ padding: '32px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p style={{ color: '#64748b' }}>Verifying your email address, please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ padding: '16px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#10b981',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ color: '#065f46', marginBottom: '8px' }}>Verified!</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '24px' }}>
              {message}
            </p>
            <Link to="/login" className="btn btn-primary btn-block">
              Continue to Login <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '16px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={36} />
            </div>
            <h3 style={{ color: '#991b1b', marginBottom: '8px' }}>Verification Unsuccessful</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '24px' }}>
              {message}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/resend-verification" className="btn btn-primary btn-block">
                Request New Verification Link
              </Link>
              <Link to="/login" className="btn btn-secondary btn-block">
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
