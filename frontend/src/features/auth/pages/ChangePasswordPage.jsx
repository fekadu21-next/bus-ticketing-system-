import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ChangePasswordPage = () => {
  const { changePassword } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    const result = await changePassword(formData);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Your password has been changed successfully.');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } else {
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="main-content">
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link
            to="/profile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#64748b',
              fontSize: '0.9rem',
              textDecoration: 'none',
              marginBottom: '12px',
            }}
          >
            <ArrowLeft size={16} /> Back to Profile
          </Link>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Change Password</h1>
          <p style={{ color: '#64748b' }}>Update your password to keep your account secure</p>
        </div>

        <div className="card">
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success" role="alert">
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="form-input"
                placeholder="Enter current password"
                value={formData.currentPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="form-input"
                placeholder="Min 8 chars, uppercase, lowercase & number"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="form-input"
                placeholder="Repeat new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
              style={{ marginTop: '8px' }}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
