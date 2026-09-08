import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { resetPasswordApi } from '../auth.api.js';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Reset token is missing from the link.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPasswordApi({
        token,
        newPassword,
        confirmPassword,
      });
      setSuccessMessage(
        response.message || 'Password has been reset successfully. You can now log in.'
      );
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to reset password. The link may have expired.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Create a secure new password for your account</p>
        </div>

        {successMessage ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
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
            <h3 style={{ color: '#065f46', marginBottom: '8px' }}>Password Updated</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '24px' }}>
              {successMessage}
            </p>
            <Link to="/login" className="btn btn-primary btn-block">
              Sign In Now <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {!token && (
              <div className="alert alert-warning">
                Invalid or missing reset token. Please request a new password reset link.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting || !token}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting || !token}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting || !token}
                style={{ marginTop: '10px' }}
              >
                {isSubmitting ? 'Updating password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
