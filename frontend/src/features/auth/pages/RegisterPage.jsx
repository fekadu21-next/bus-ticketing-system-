import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);
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
    setErrorDetails([]);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    const result = await register(formData);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(
        result.message ||
          'Account created successfully! We sent a verification link to your email address.'
      );
    } else {
      setErrorMessage(result.error);
      if (result.errors) {
        setErrorDetails(result.errors);
      }
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '540px' }}>
        <div className="auth-header">
          <h1>Create an Account</h1>
          <p>Register as a passenger to book intercity trips</p>
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
            <h3 style={{ color: '#065f46', marginBottom: '8px' }}>Registration Successful</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '24px' }}>
              {successMessage}
            </p>
            <Link to="/login" className="btn btn-primary btn-block">
              Proceed to Sign In
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>
                  <div>{errorMessage}</div>
                  {errorDetails.length > 0 && (
                    <ul style={{ marginTop: '6px', paddingLeft: '18px', fontSize: '0.85rem' }}>
                      {errorDetails.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Abebe"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Kebede"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="form-input"
                  placeholder="abebe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="+251 911 234567"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="form-input"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="form-input"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting}
                style={{ marginTop: '8px' }}
              >
                {isSubmitting ? (
                  <span>Creating account...</span>
                ) : (
                  <>
                    <span>Register Account</span> <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div
              style={{
                textAlign: 'center',
                marginTop: '24px',
                fontSize: '0.9rem',
                color: '#64748b',
              }}
            >
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                Sign in here
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
